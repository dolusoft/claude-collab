/**
 * GetInbox DTOs
 * @module application/dtos/get-inbox
 */

import type { QuestionId, MemberId, TeamId } from '../../shared/types/branded-types.js';
import type { QuestionStatus } from '../../domain/entities/question.entity.js';
import type { MessageFormat } from '../../domain/value-objects/message-content.vo.js';

/**
 * Input DTO for getting inbox
 */
export interface GetInboxInput {
  readonly memberId: MemberId;
  readonly teamId: TeamId;
  readonly includeAnswered?: boolean;
}

/**
 * A question item in the inbox
 */
export interface InboxQuestionItem {
  readonly questionId: QuestionId;
  readonly fromMemberId: MemberId;
  readonly fromDisplayName: string;
  readonly fromTeamName: string;
  readonly content: string;
  readonly format: MessageFormat;
  readonly status: QuestionStatus;
  readonly createdAt: Date;
  readonly ageMs: number;
}

/**
 * Output DTO for getting inbox
 */
export interface GetInboxOutput {
  readonly teamId: TeamId;
  readonly teamName: string;
  readonly questions: InboxQuestionItem[];
  readonly totalCount: number;
  readonly pendingCount: number;
}
