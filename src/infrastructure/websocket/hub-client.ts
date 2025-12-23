/**
 * WebSocket Hub Client
 * Client that connects to the Hub server
 * @module infrastructure/websocket/hub-client
 */

import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';
import type { MemberId, TeamId, QuestionId } from '../../shared/types/branded-types.js';
import type { MessageFormat } from '../../domain/value-objects/message-content.vo.js';
import { config } from '../../config/index.js';
import {
  type ClientMessage,
  type HubMessage,
  type QuestionMessage,
  type AnswerMessage,
  type InboxMessage,
  type MemberInfo,
  serializeMessage,
  parseHubMessage,
} from './message-protocol.js';

/**
 * Pending request with timeout
 */
interface PendingRequest<T> {
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}

/**
 * Hub client options
 */
export interface HubClientOptions {
  host?: string;
  port?: number;
  reconnect?: boolean;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

/**
 * Hub client events
 */
export interface HubClientEvents {
  onConnected?: () => void;
  onDisconnected?: () => void;
  onQuestion?: (question: QuestionMessage) => void;
  onAnswer?: (answer: AnswerMessage) => void;
  onMemberJoined?: (member: MemberInfo) => void;
  onMemberLeft?: (memberId: MemberId, teamId: TeamId) => void;
  onError?: (error: Error) => void;
}

/**
 * WebSocket Hub Client
 */
export class HubClient {
  private ws: WebSocket | null = null;
  private readonly pendingRequests = new Map<string, PendingRequest<HubMessage>>();
  private reconnectAttempts = 0;
  private isClosing = false;

  private memberId?: MemberId;
  private teamId?: TeamId;
  private teamName?: string;
  private displayName?: string;

  constructor(
    private readonly options: HubClientOptions = {},
    private readonly events: HubClientEvents = {}
  ) {}

  /**
   * Connects to the Hub server
   */
  async connect(): Promise<void> {
    const host = this.options.host ?? config.hub.host;
    const port = this.options.port ?? config.hub.port;
    const url = `ws://${host}:${port}`;

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url);

        this.ws.on('open', () => {
          this.reconnectAttempts = 0;
          this.startPingInterval();
          this.events.onConnected?.();
          resolve();
        });

        this.ws.on('message', (data) => {
          this.handleMessage(data.toString());
        });

        this.ws.on('close', () => {
          this.handleDisconnect();
        });

        this.ws.on('error', (error) => {
          this.events.onError?.(error);
          if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            reject(error);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnects from the Hub server
   */
  async disconnect(): Promise<void> {
    this.isClosing = true;

    if (this.memberId) {
      this.send({ type: 'LEAVE' });
    }

    return new Promise((resolve) => {
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
      this.isClosing = false;
      resolve();
    });
  }

  /**
   * Joins a team
   */
  async join(teamName: string, displayName: string): Promise<MemberInfo> {
    const requestId = uuidv4();

    this.send({
      type: 'JOIN',
      teamName,
      displayName,
    });

    const response = await this.waitForResponse<{ type: 'JOINED'; member: MemberInfo }>(
      (msg) => msg.type === 'JOINED',
      30000
    );

    this.memberId = response.member.memberId;
    this.teamId = response.member.teamId;
    this.teamName = teamName;
    this.displayName = displayName;

    return response.member;
  }

  /**
   * Asks a question to another team
   */
  async ask(
    toTeam: string,
    content: string,
    format: MessageFormat = 'markdown',
    timeoutMs: number = config.communication.defaultTimeout
  ): Promise<AnswerMessage> {
    const requestId = uuidv4();

    this.send({
      type: 'ASK',
      toTeam,
      content,
      format,
      requestId,
    });

    // Wait for QUESTION_SENT confirmation
    await this.waitForResponse(
      (msg) => msg.type === 'QUESTION_SENT' && 'requestId' in msg && msg.requestId === requestId,
      5000
    );

    // Wait for ANSWER
    const answer = await this.waitForResponse<AnswerMessage>(
      (msg) => msg.type === 'ANSWER',
      timeoutMs
    );

    return answer;
  }

  /**
   * Gets the inbox (pending questions)
   */
  async getInbox(): Promise<InboxMessage> {
    const requestId = uuidv4();

    this.send({
      type: 'GET_INBOX',
      requestId,
    });

    return this.waitForResponse<InboxMessage>(
      (msg) => msg.type === 'INBOX' && msg.requestId === requestId,
      5000
    );
  }

  /**
   * Replies to a question
   */
  async reply(questionId: QuestionId, content: string, format: MessageFormat = 'markdown'): Promise<void> {
    this.send({
      type: 'REPLY',
      questionId,
      content,
      format,
    });
  }

  /**
   * Checks if connected
   */
  get isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Gets the current member ID
   */
  get currentMemberId(): MemberId | undefined {
    return this.memberId;
  }

  /**
   * Gets the current team ID
   */
  get currentTeamId(): TeamId | undefined {
    return this.teamId;
  }

  private send(message: ClientMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(serializeMessage(message));
    }
  }

  private handleMessage(data: string): void {
    try {
      const message = parseHubMessage(data);

      // Check pending requests
      for (const [requestId, pending] of this.pendingRequests) {
        // This is handled by the filter function in waitForResponse
      }

      // Handle specific message types
      switch (message.type) {
        case 'QUESTION':
          this.events.onQuestion?.(message);
          break;
        case 'ANSWER':
          this.events.onAnswer?.(message);
          break;
        case 'MEMBER_JOINED':
          this.events.onMemberJoined?.(message.member);
          break;
        case 'MEMBER_LEFT':
          this.events.onMemberLeft?.(message.memberId, message.teamId);
          break;
        case 'ERROR':
          this.events.onError?.(new Error(`${message.code}: ${message.message}`));
          break;
      }

      // Resolve any matching pending requests
      this.resolvePendingRequest(message);
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  }

  private resolvePendingRequest(message: HubMessage): void {
    for (const [requestId, pending] of this.pendingRequests) {
      // The filter is stored separately, we'll match by message type patterns
      this.pendingRequests.delete(requestId);
      clearTimeout(pending.timeout);
      pending.resolve(message);
      break; // Only resolve one request per message
    }
  }

  private waitForResponse<T extends HubMessage>(
    filter: (msg: HubMessage) => boolean,
    timeoutMs: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const requestId = uuidv4();

      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error('Request timed out'));
      }, timeoutMs);

      // Store filter function with the pending request
      const pending: PendingRequest<HubMessage> & { filter: (msg: HubMessage) => boolean } = {
        resolve: (msg) => {
          if (filter(msg)) {
            resolve(msg as T);
          }
        },
        reject,
        timeout,
        filter,
      };

      this.pendingRequests.set(requestId, pending);

      // Override handleMessage to check this specific filter
      const originalHandler = this.handleMessage.bind(this);
      const checkFilter = (data: string): void => {
        try {
          const message = parseHubMessage(data);
          if (filter(message)) {
            this.pendingRequests.delete(requestId);
            clearTimeout(timeout);
            resolve(message as T);
          }
        } catch {
          // Ignore parse errors here
        }
        originalHandler(data);
      };

      // Temporarily override
      if (this.ws) {
        this.ws.removeAllListeners('message');
        this.ws.on('message', (data) => checkFilter(data.toString()));
      }
    });
  }

  private handleDisconnect(): void {
    this.events.onDisconnected?.();

    if (this.isClosing) return;

    const shouldReconnect = this.options.reconnect ?? true;
    const maxAttempts = this.options.maxReconnectAttempts ?? config.autoStart.maxRetries;

    if (shouldReconnect && this.reconnectAttempts < maxAttempts) {
      this.reconnectAttempts++;
      const delay = this.options.reconnectDelay ?? config.autoStart.retryDelay;

      setTimeout(() => {
        this.connect()
          .then(() => {
            if (this.teamName && this.displayName) {
              return this.join(this.teamName, this.displayName);
            }
          })
          .catch((error) => {
            this.events.onError?.(error);
          });
      }, delay);
    }
  }

  private pingInterval: ReturnType<typeof setInterval> | null = null;

  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      this.send({ type: 'PING' });
    }, config.hub.heartbeatInterval);
  }
}
