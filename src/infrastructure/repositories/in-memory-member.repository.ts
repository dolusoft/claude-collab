/**
 * In-Memory Member Repository
 * @module infrastructure/repositories/in-memory-member
 */

import type { IMemberRepository } from '../../domain/repositories/member.repository.js';
import type { Member } from '../../domain/entities/member.entity.js';
import type { MemberId, TeamId } from '../../shared/types/branded-types.js';

/**
 * In-memory implementation of IMemberRepository
 */
export class InMemoryMemberRepository implements IMemberRepository {
  private readonly members = new Map<MemberId, Member>();

  async save(member: Member): Promise<void> {
    this.members.set(member.id, member);
  }

  async findById(id: MemberId): Promise<Member | null> {
    return this.members.get(id) ?? null;
  }

  async findByTeamId(teamId: TeamId): Promise<Member[]> {
    return [...this.members.values()].filter((m) => m.teamId === teamId);
  }

  async findOnlineByTeamId(teamId: TeamId): Promise<Member[]> {
    return [...this.members.values()].filter((m) => m.teamId === teamId && m.isOnline);
  }

  async delete(id: MemberId): Promise<boolean> {
    return this.members.delete(id);
  }

  async exists(id: MemberId): Promise<boolean> {
    return this.members.has(id);
  }

  async findAll(): Promise<Member[]> {
    return [...this.members.values()];
  }

  /**
   * Clears all data (useful for testing)
   */
  clear(): void {
    this.members.clear();
  }

  /**
   * Gets the count of members
   */
  get count(): number {
    return this.members.size;
  }
}
