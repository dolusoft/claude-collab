/**
 * ReplyQuestion DTOs
 * @module application/dtos/reply-question
 */

import type { QuestionId, AnswerId, MemberId } from '../../shared/types/branded-types.js';
import type { MessageFormat } from '../../domain/value-objects/message-content.vo.js';

/**
 * Input DTO for replying to a question
 */
export interface ReplyQuestionInput {
  readonly questionId: QuestionId;
  readonly fromMemberId: MemberId;
  readonly content: string;
  readonly format?: MessageFormat;
}

/**
 * Output DTO for replying to a question
 */
export interface ReplyQuestionOutput {
  readonly answerId: AnswerId;
  readonly questionId: QuestionId;
  readonly deliveredToMemberId: MemberId;
  readonly createdAt: Date;
}
