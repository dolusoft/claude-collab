/**
 * WebSocket Hub Server
 * Central server that manages client connections and message routing
 * @module infrastructure/websocket/hub-server
 */

import { WebSocketServer, WebSocket } from 'ws';
import type { MemberId, TeamId, QuestionId } from '../../shared/types/branded-types.js';
import type { Member } from '../../domain/entities/member.entity.js';
import type { Question } from '../../domain/entities/question.entity.js';
import { MemberStatus } from '../../domain/entities/member.entity.js';
import { QuestionStatus } from '../../domain/entities/question.entity.js';
import { MessageContent } from '../../domain/value-objects/message-content.vo.js';
import { JoinTeamUseCase } from '../../application/use-cases/join-team.use-case.js';
import { AskQuestionUseCase } from '../../application/use-cases/ask-question.use-case.js';
import { GetInboxUseCase } from '../../application/use-cases/get-inbox.use-case.js';
import { ReplyQuestionUseCase } from '../../application/use-cases/reply-question.use-case.js';
import { InMemoryMemberRepository } from '../repositories/in-memory-member.repository.js';
import { InMemoryTeamRepository } from '../repositories/in-memory-team.repository.js';
import { InMemoryQuestionRepository } from '../repositories/in-memory-question.repository.js';
import { InMemoryAnswerRepository } from '../repositories/in-memory-answer.repository.js';
import { config } from '../../config/index.js';
import {
  type ClientMessage,
  type HubMessage,
  type MemberInfo,
  parseClientMessage,
  serializeMessage,
  createErrorMessage,
} from './message-protocol.js';

/**
 * Client connection state
 */
interface ClientConnection {
  ws: WebSocket;
  memberId?: MemberId;
  teamId?: TeamId;
  lastPing: Date;
}

/**
 * Hub server options
 */
export interface HubServerOptions {
  port?: number;
  host?: string;
}

/**
 * WebSocket Hub Server
 */
export class HubServer {
  private wss: WebSocketServer | null = null;
  private readonly clients = new Map<WebSocket, ClientConnection>();
  private readonly memberToWs = new Map<MemberId, WebSocket>();

  // Repositories
  private readonly memberRepository = new InMemoryMemberRepository();
  private readonly teamRepository = new InMemoryTeamRepository();
  private readonly questionRepository = new InMemoryQuestionRepository();
  private readonly answerRepository = new InMemoryAnswerRepository();

  // Use cases
  private joinTeamUseCase!: JoinTeamUseCase;
  private askQuestionUseCase!: AskQuestionUseCase;
  private getInboxUseCase!: GetInboxUseCase;
  private replyQuestionUseCase!: ReplyQuestionUseCase;

  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private timeoutCheckInterval: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly options: HubServerOptions = {}) {
    this.initializeUseCases();
  }

  private initializeUseCases(): void {
    this.joinTeamUseCase = new JoinTeamUseCase({
      memberRepository: this.memberRepository,
      teamRepository: this.teamRepository,
      onMemberJoined: async (event) => {
        await this.broadcastToTeam(event.teamId, event.memberId, {
          type: 'MEMBER_JOINED',
          member: await this.getMemberInfo(event.memberId),
        });
      },
    });

    this.askQuestionUseCase = new AskQuestionUseCase({
      memberRepository: this.memberRepository,
      teamRepository: this.teamRepository,
      questionRepository: this.questionRepository,
      onQuestionAsked: async (event) => {
        const question = await this.questionRepository.findById(event.questionId);
        if (question) {
          await this.deliverQuestion(question);
        }
      },
    });

    this.getInboxUseCase = new GetInboxUseCase({
      memberRepository: this.memberRepository,
      teamRepository: this.teamRepository,
      questionRepository: this.questionRepository,
    });

    this.replyQuestionUseCase = new ReplyQuestionUseCase({
      memberRepository: this.memberRepository,
      questionRepository: this.questionRepository,
      answerRepository: this.answerRepository,
      onQuestionAnswered: async (event) => {
        const question = await this.questionRepository.findById(event.questionId);
        const answer = await this.answerRepository.findByQuestionId(event.questionId);
        if (question && answer) {
          await this.deliverAnswer(question, answer, event.answeredByMemberId);
        }
      },
    });
  }

  /**
   * Starts the hub server
   */
  async start(): Promise<void> {
    const port = this.options.port ?? config.hub.port;
    const host = this.options.host ?? config.hub.host;

    return new Promise((resolve, reject) => {
      try {
        this.wss = new WebSocketServer({ port, host });

        this.wss.on('connection', (ws) => {
          this.handleConnection(ws);
        });

        this.wss.on('error', (error) => {
          console.error('Hub server error:', error);
          reject(error);
        });

        this.wss.on('listening', () => {
          console.log(`Hub server listening on ${host}:${port}`);
          this.startHeartbeat();
          this.startTimeoutCheck();
          resolve();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stops the hub server
   */
  async stop(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.timeoutCheckInterval) {
      clearInterval(this.timeoutCheckInterval);
      this.timeoutCheckInterval = null;
    }

    return new Promise((resolve) => {
      if (this.wss) {
        // Close all client connections
        for (const [ws] of this.clients) {
          ws.close();
        }
        this.clients.clear();
        this.memberToWs.clear();

        this.wss.close(() => {
          this.wss = null;
          console.log('Hub server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  private handleConnection(ws: WebSocket): void {
    const connection: ClientConnection = {
      ws,
      lastPing: new Date(),
    };
    this.clients.set(ws, connection);

    ws.on('message', async (data) => {
      await this.handleMessage(ws, data.toString());
    });

    ws.on('close', async () => {
      await this.handleDisconnect(ws);
    });

    ws.on('error', (error) => {
      console.error('Client connection error:', error);
    });
  }

  private async handleMessage(ws: WebSocket, data: string): Promise<void> {
    const connection = this.clients.get(ws);
    if (!connection) return;

    try {
      const message = parseClientMessage(data);
      connection.lastPing = new Date();

      switch (message.type) {
        case 'JOIN':
          await this.handleJoin(ws, connection, message.teamName, message.displayName);
          break;
        case 'LEAVE':
          await this.handleLeave(ws, connection);
          break;
        case 'ASK':
          await this.handleAsk(ws, connection, message);
          break;
        case 'REPLY':
          await this.handleReply(ws, connection, message);
          break;
        case 'GET_INBOX':
          await this.handleGetInbox(ws, connection, message.requestId);
          break;
        case 'PING':
          this.send(ws, { type: 'PONG', timestamp: new Date().toISOString() });
          break;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.send(ws, createErrorMessage('INVALID_MESSAGE', errorMessage));
    }
  }

  private async handleJoin(
    ws: WebSocket,
    connection: ClientConnection,
    teamName: string,
    displayName: string
  ): Promise<void> {
    try {
      const result = await this.joinTeamUseCase.execute({ teamName, displayName });

      connection.memberId = result.memberId;
      connection.teamId = result.teamId;
      this.memberToWs.set(result.memberId, ws);

      const memberInfo = await this.getMemberInfo(result.memberId);
      this.send(ws, {
        type: 'JOINED',
        member: memberInfo,
        memberCount: result.memberCount,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Join failed';
      this.send(ws, createErrorMessage('JOIN_FAILED', errorMessage));
    }
  }

  private async handleLeave(ws: WebSocket, connection: ClientConnection): Promise<void> {
    if (connection.memberId && connection.teamId) {
      await this.removeMember(connection.memberId, connection.teamId);
      connection.memberId = undefined;
      connection.teamId = undefined;
    }

    this.send(ws, { type: 'LEFT', memberId: connection.memberId! });
  }

  private async handleAsk(
    ws: WebSocket,
    connection: ClientConnection,
    message: { toTeam: string; content: string; format: 'plain' | 'markdown'; requestId: string }
  ): Promise<void> {
    if (!connection.memberId) {
      this.send(ws, createErrorMessage('NOT_JOINED', 'Must join a team first', message.requestId));
      return;
    }

    try {
      const result = await this.askQuestionUseCase.execute({
        fromMemberId: connection.memberId,
        toTeamName: message.toTeam,
        content: message.content,
        format: message.format,
      });

      this.send(ws, {
        type: 'QUESTION_SENT',
        questionId: result.questionId,
        toTeamId: result.toTeamId,
        status: result.status,
        requestId: message.requestId,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ask failed';
      this.send(ws, createErrorMessage('ASK_FAILED', errorMessage, message.requestId));
    }
  }

  private async handleReply(
    ws: WebSocket,
    connection: ClientConnection,
    message: { questionId: QuestionId; content: string; format: 'plain' | 'markdown' }
  ): Promise<void> {
    if (!connection.memberId) {
      this.send(ws, createErrorMessage('NOT_JOINED', 'Must join a team first'));
      return;
    }

    try {
      await this.replyQuestionUseCase.execute({
        fromMemberId: connection.memberId,
        questionId: message.questionId,
        content: message.content,
        format: message.format,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Reply failed';
      this.send(ws, createErrorMessage('REPLY_FAILED', errorMessage));
    }
  }

  private async handleGetInbox(
    ws: WebSocket,
    connection: ClientConnection,
    requestId: string
  ): Promise<void> {
    if (!connection.memberId || !connection.teamId) {
      this.send(ws, createErrorMessage('NOT_JOINED', 'Must join a team first', requestId));
      return;
    }

    try {
      const result = await this.getInboxUseCase.execute({
        memberId: connection.memberId,
        teamId: connection.teamId,
      });

      const questions = await Promise.all(
        result.questions.map(async (q) => ({
          questionId: q.questionId,
          from: await this.getMemberInfo(q.fromMemberId),
          content: q.content,
          format: q.format,
          status: q.status as QuestionStatus,
          createdAt: q.createdAt.toISOString(),
          ageMs: q.ageMs,
        }))
      );

      this.send(ws, {
        type: 'INBOX',
        questions,
        totalCount: result.totalCount,
        pendingCount: result.pendingCount,
        requestId,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Get inbox failed';
      this.send(ws, createErrorMessage('INBOX_FAILED', errorMessage, requestId));
    }
  }

  private async handleDisconnect(ws: WebSocket): Promise<void> {
    const connection = this.clients.get(ws);
    if (connection?.memberId && connection.teamId) {
      await this.removeMember(connection.memberId, connection.teamId);
      this.memberToWs.delete(connection.memberId);
    }
    this.clients.delete(ws);
  }

  private async removeMember(memberId: MemberId, teamId: TeamId): Promise<void> {
    const member = await this.memberRepository.findById(memberId);
    if (member) {
      member.goOffline();
      await this.memberRepository.save(member);
    }

    const team = await this.teamRepository.findById(teamId);
    if (team) {
      team.removeMember(memberId);
      await this.teamRepository.save(team);

      // Notify other team members
      await this.broadcastToTeam(teamId, memberId, {
        type: 'MEMBER_LEFT',
        memberId,
        teamId,
      });
    }
  }

  private async deliverQuestion(question: Question): Promise<void> {
    const team = await this.teamRepository.findById(question.toTeamId);
    if (!team) return;

    const fromMember = await this.memberRepository.findById(question.fromMemberId);
    if (!fromMember) return;

    const memberInfo = await this.getMemberInfo(question.fromMemberId);

    for (const memberId of team.memberIds) {
      const ws = this.memberToWs.get(memberId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        this.send(ws, {
          type: 'QUESTION',
          questionId: question.id,
          from: memberInfo,
          content: question.content.text,
          format: question.content.format,
          createdAt: question.createdAt.toISOString(),
        });
      }
    }
  }

  private async deliverAnswer(
    question: Question,
    answer: { content: MessageContent; createdAt: Date },
    answeredByMemberId: MemberId
  ): Promise<void> {
    const ws = this.memberToWs.get(question.fromMemberId);
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    const memberInfo = await this.getMemberInfo(answeredByMemberId);

    this.send(ws, {
      type: 'ANSWER',
      questionId: question.id,
      from: memberInfo,
      content: answer.content.text,
      format: answer.content.format,
      answeredAt: answer.createdAt.toISOString(),
    });
  }

  private async broadcastToTeam(
    teamId: TeamId,
    excludeMemberId: MemberId,
    message: HubMessage
  ): Promise<void> {
    const team = await this.teamRepository.findById(teamId);
    if (!team) return;

    for (const memberId of team.getOtherMemberIds(excludeMemberId)) {
      const ws = this.memberToWs.get(memberId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        this.send(ws, message);
      }
    }
  }

  private async getMemberInfo(memberId: MemberId): Promise<MemberInfo> {
    const member = await this.memberRepository.findById(memberId);
    const team = member ? await this.teamRepository.findById(member.teamId) : null;

    return {
      memberId,
      teamId: member?.teamId ?? ('' as TeamId),
      teamName: team?.name ?? 'Unknown',
      displayName: member?.displayName ?? 'Unknown',
      status: member?.status ?? MemberStatus.OFFLINE,
    };
  }

  private send(ws: WebSocket, message: HubMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(serializeMessage(message));
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = new Date();
      for (const [ws, connection] of this.clients) {
        const timeSinceLastPing = now.getTime() - connection.lastPing.getTime();
        if (timeSinceLastPing > config.hub.clientTimeout) {
          ws.terminate();
        }
      }
    }, config.hub.heartbeatInterval);
  }

  private startTimeoutCheck(): void {
    this.timeoutCheckInterval = setInterval(async () => {
      await this.questionRepository.markTimedOut(config.communication.defaultTimeout);
    }, 5000);
  }

  /**
   * Gets the number of connected clients
   */
  get clientCount(): number {
    return this.clients.size;
  }

  /**
   * Checks if the server is running
   */
  get isRunning(): boolean {
    return this.wss !== null;
  }
}
