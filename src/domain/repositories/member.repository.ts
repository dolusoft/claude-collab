/**
 * Member Repository Interface
 * @module domain/repositories/member
 */

import type { MemberId, TeamId } from '../../shared/types/branded-types.js';
import type { Member } from '../entities/member.entity.js';

/**
 * Repository interface for Member entity
 */
export interface IMemberRepository {
  /**
   * Saves a member
   */
  save(member: Member): Promise<void>;

  /**
   * Finds a member by ID
   */
  findById(id: MemberId): Promise<Member | null>;

  /**
   * Finds all members in a team
   */
  findByTeamId(teamId: TeamId): Promise<Member[]>;

  /**
   * Finds all online members in a team
   */
  findOnlineByTeamId(teamId: TeamId): Promise<Member[]>;

  /**
   * Deletes a member
   */
  delete(id: MemberId): Promise<boolean>;

  /**
   * Checks if a member exists
   */
  exists(id: MemberId): Promise<boolean>;

  /**
   * Gets all members
   */
  findAll(): Promise<Member[]>;
}
