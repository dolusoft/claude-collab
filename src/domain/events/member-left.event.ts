/**
 * MemberLeft Domain Event
 * Raised when a member leaves a team
 * @module domain/events/member-left
 */

import type { MemberId, TeamId } from '../../shared/types/branded-types.js';
import { BaseDomainEvent } from './base.event.js';

/**
 * Event raised when a member leaves a team
 */
export class MemberLeftEvent extends BaseDomainEvent {
  public static readonly EVENT_TYPE = 'MEMBER_LEFT';

  constructor(
    public readonly memberId: MemberId,
    public readonly teamId: TeamId
  ) {
    super();
  }

  public get eventType(): string {
    return MemberLeftEvent.EVENT_TYPE;
  }

  public get payload(): Record<string, unknown> {
    return {
      memberId: this.memberId,
      teamId: this.teamId,
    };
  }
}
