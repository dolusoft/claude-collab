/**
 * QuestionAnswered Domain Event
 * Raised when a question is answered
 * @module domain/events/question-answered
 */

import type { QuestionId, AnswerId, MemberId } from '../../shared/types/branded-types.js';
import { BaseDomainEvent } from './base.event.js';

/**
 * Event raised when a question is answered
 */
export class QuestionAnsweredEvent extends BaseDomainEvent {
  public static readonly EVENT_TYPE = 'QUESTION_ANSWERED';

  constructor(
    public readonly questionId: QuestionId,
    public readonly answerId: AnswerId,
    public readonly answeredByMemberId: MemberId,
    public readonly contentPreview: string
  ) {
    super();
  }

  public get eventType(): string {
    return QuestionAnsweredEvent.EVENT_TYPE;
  }

  public get payload(): Record<string, unknown> {
    return {
      questionId: this.questionId,
      answerId: this.answerId,
      answeredByMemberId: this.answeredByMemberId,
      contentPreview: this.contentPreview,
    };
  }
}
