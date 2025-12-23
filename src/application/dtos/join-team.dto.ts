/**
 * JoinTeam DTOs
 * @module application/dtos/join-team
 */

import type { MemberId, TeamId } from '../../shared/types/branded-types.js';
import type { MemberStatus } from '../../domain/entities/member.entity.js';

/**
 * Input DTO for joining a team
 */
export interface JoinTeamInput {
  readonly teamName: string;
  readonly displayName: string;
}

/**
 * Output DTO for joining a team
 */
export interface JoinTeamOutput {
  readonly memberId: MemberId;
  readonly teamId: TeamId;
  readonly teamName: string;
  readonly displayName: string;
  readonly status: MemberStatus;
  readonly memberCount: number;
}
