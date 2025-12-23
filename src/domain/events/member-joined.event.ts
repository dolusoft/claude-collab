/**
 * MemberJoined Domain Event
 * Raised when a member joins a team
 * @module domain/events/member-joined
 */

import type { MemberId, TeamId } from '../../shared/types/branded-types.js';
import { BaseDomainEvent } from './base.event.js';

/**
 * Event raised when a member joins a team
 */
export class MemberJoinedEvent extends BaseDomainEvent {
  public static readonly EVENT_TYPE = 'MEMBER_JOINED';

  constructor(
    public readonly memberId: MemberId,
    public readonly teamId: TeamId,
    public readonly displayName: string
  ) {
    super();
  }

  public get eventType(): string {
    return MemberJoinedEvent.EVENT_TYPE;
  }

  public get payload(): Record<string, unknown> {
    return {
      memberId: this.memberId,
      teamId: this.teamId,
      displayName: this.displayName,
    };
  }
}
