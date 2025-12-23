/**
 * AskQuestion DTOs
 * @module application/dtos/ask-question
 */

import type { QuestionId, MemberId, TeamId } from '../../shared/types/branded-types.js';
import type { QuestionStatus } from '../../domain/entities/question.entity.js';
import type { MessageFormat } from '../../domain/value-objects/message-content.vo.js';

/**
 * Input DTO for asking a question
 */
export interface AskQuestionInput {
  readonly fromMemberId: MemberId;
  readonly toTeamName: string;
  readonly content: string;
  readonly format?: MessageFormat;
  readonly timeoutMs?: number;
}

/**
 * Output DTO for asking a question
 */
export interface AskQuestionOutput {
  readonly questionId: QuestionId;
  readonly toTeamId: TeamId;
  readonly status: QuestionStatus;
  readonly createdAt: Date;
}

/**
 * Output DTO when an answer is received
 */
export interface QuestionAnswerOutput {
  readonly questionId: QuestionId;
  readonly answeredByMemberId: MemberId;
  readonly answeredByDisplayName: string;
  readonly answerContent: string;
  readonly answerFormat: MessageFormat;
  readonly answeredAt: Date;
}
