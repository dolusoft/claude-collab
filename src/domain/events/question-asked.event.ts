/**
 * QuestionAsked Domain Event
 * Raised when a question is asked to a team
 * @module domain/events/question-asked
 */

import type { QuestionId, MemberId, TeamId } from '../../shared/types/branded-types.js';
import { BaseDomainEvent } from './base.event.js';

/**
 * Event raised when a question is asked
 */
export class QuestionAskedEvent extends BaseDomainEvent {
  public static readonly EVENT_TYPE = 'QUESTION_ASKED';

  constructor(
    public readonly questionId: QuestionId,
    public readonly fromMemberId: MemberId,
    public readonly toTeamId: TeamId,
    public readonly contentPreview: string
  ) {
    super();
  }

  public get eventType(): string {
    return QuestionAskedEvent.EVENT_TYPE;
  }

  public get payload(): Record<string, unknown> {
    return {
      questionId: this.questionId,
      fromMemberId: this.fromMemberId,
      toTeamId: this.toTeamId,
      contentPreview: this.contentPreview,
    };
  }
}
