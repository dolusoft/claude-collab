/**
 * WebSocket Message Protocol
 * Defines the message format between Hub and Clients
 * @module infrastructure/websocket/message-protocol
 */

import type { MemberId, TeamId, QuestionId } from '../../shared/types/branded-types.js';
import type { MessageFormat } from '../../domain/value-objects/message-content.vo.js';
import type { MemberStatus } from '../../domain/entities/member.entity.js';
import type { QuestionStatus } from '../../domain/entities/question.entity.js';

// ============================================================================
// Client → Hub Messages
// ============================================================================

export type ClientMessageType = 'JOIN' | 'LEAVE' | 'ASK' | 'REPLY' | 'PING' | 'GET_INBOX';

export interface JoinMessage {
  type: 'JOIN';
  teamName: string;
  displayName: string;
}

export interface LeaveMessage {
  type: 'LEAVE';
}

export interface AskMessage {
  type: 'ASK';
  toTeam: string;
  content: string;
  format: MessageFormat;
  requestId: string; // For correlating response
}

export interface ReplyMessage {
  type: 'REPLY';
  questionId: QuestionId;
  content: string;
  format: MessageFormat;
}

export interface PingMessage {
  type: 'PING';
}

export interface GetInboxMessage {
  type: 'GET_INBOX';
  requestId: string;
}

export type ClientMessage =
  | JoinMessage
  | LeaveMessage
  | AskMessage
  | ReplyMessage
  | PingMessage
  | GetInboxMessage;

// ============================================================================
// Hub → Client Messages
// ============================================================================

export type HubMessageType =
  | 'JOINED'
  | 'LEFT'
  | 'MEMBER_JOINED'
  | 'MEMBER_LEFT'
  | 'QUESTION'
  | 'ANSWER'
  | 'QUESTION_SENT'
  | 'INBOX'
  | 'PONG'
  | 'ERROR';

export interface MemberInfo {
  memberId: MemberId;
  teamId: TeamId;
  teamName: string;
  displayName: string;
  status: MemberStatus;
}

export interface JoinedMessage {
  type: 'JOINED';
  member: MemberInfo;
  memberCount: number;
}

export interface LeftMessage {
  type: 'LEFT';
  memberId: MemberId;
}

export interface MemberJoinedMessage {
  type: 'MEMBER_JOINED';
  member: MemberInfo;
}

export interface MemberLeftMessage {
  type: 'MEMBER_LEFT';
  memberId: MemberId;
  teamId: TeamId;
}

export interface QuestionMessage {
  type: 'QUESTION';
  questionId: QuestionId;
  from: MemberInfo;
  content: string;
  format: MessageFormat;
  createdAt: string;
}

export interface AnswerMessage {
  type: 'ANSWER';
  questionId: QuestionId;
  from: MemberInfo;
  content: string;
  format: MessageFormat;
  answeredAt: string;
  requestId?: string; // Correlates with original ASK request
}

export interface QuestionSentMessage {
  type: 'QUESTION_SENT';
  questionId: QuestionId;
  toTeamId: TeamId;
  status: QuestionStatus;
  requestId: string;
}

export interface InboxQuestionInfo {
  questionId: QuestionId;
  from: MemberInfo;
  content: string;
  format: MessageFormat;
  status: QuestionStatus;
  createdAt: string;
  ageMs: number;
}

export interface InboxMessage {
  type: 'INBOX';
  questions: InboxQuestionInfo[];
  totalCount: number;
  pendingCount: number;
  requestId: string;
}

export interface PongMessage {
  type: 'PONG';
  timestamp: string;
}

export interface ErrorMessage {
  type: 'ERROR';
  code: string;
  message: string;
  requestId?: string;
}

export type HubMessage =
  | JoinedMessage
  | LeftMessage
  | MemberJoinedMessage
  | MemberLeftMessage
  | QuestionMessage
  | AnswerMessage
  | QuestionSentMessage
  | InboxMessage
  | PongMessage
  | ErrorMessage;

// ============================================================================
// Serialization Helpers
// ============================================================================

/**
 * Serializes a message to JSON string
 */
export function serializeMessage<T extends ClientMessage | HubMessage>(message: T): string {
  return JSON.stringify(message);
}

/**
 * Parses a client message from JSON string
 */
export function parseClientMessage(data: string): ClientMessage {
  const parsed = JSON.parse(data) as ClientMessage;
  validateClientMessage(parsed);
  return parsed;
}

/**
 * Parses a hub message from JSON string
 */
export function parseHubMessage(data: string): HubMessage {
  return JSON.parse(data) as HubMessage;
}

/**
 * Validates a client message
 */
function validateClientMessage(message: ClientMessage): void {
  if (!message.type) {
    throw new Error('Message must have a type');
  }

  const validTypes: ClientMessageType[] = ['JOIN', 'LEAVE', 'ASK', 'REPLY', 'PING', 'GET_INBOX'];
  if (!validTypes.includes(message.type)) {
    throw new Error(`Invalid message type: ${message.type}`);
  }
}

/**
 * Creates an error message
 */
export function createErrorMessage(
  code: string,
  message: string,
  requestId?: string
): ErrorMessage {
  return {
    type: 'ERROR',
    code,
    message,
    requestId,
  };
}
