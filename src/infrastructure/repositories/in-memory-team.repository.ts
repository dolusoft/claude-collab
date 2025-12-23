/**
 * In-Memory Team Repository
 * @module infrastructure/repositories/in-memory-team
 */

import type { ITeamRepository } from '../../domain/repositories/team.repository.js';
import type { Team } from '../../domain/entities/team.entity.js';
import type { TeamId } from '../../shared/types/branded-types.js';
import { Team as TeamEntity } from '../../domain/entities/team.entity.js';
import { createTeamId } from '../../shared/utils/id-generator.js';

/**
 * In-memory implementation of ITeamRepository
 */
export class InMemoryTeamRepository implements ITeamRepository {
  private readonly teams = new Map<TeamId, Team>();

  async save(team: Team): Promise<void> {
    this.teams.set(team.id, team);
  }

  async findById(id: TeamId): Promise<Team | null> {
    return this.teams.get(id) ?? null;
  }

  async findByName(name: string): Promise<Team | null> {
    const teamId = createTeamId(name);
    return this.teams.get(teamId) ?? null;
  }

  async getOrCreate(name: string): Promise<Team> {
    const existing = await this.findByName(name);
    if (existing) {
      return existing;
    }

    const teamId = createTeamId(name);
    const team = TeamEntity.create({
      id: teamId,
      name: name.trim(),
      createdAt: new Date(),
    });

    await this.save(team);
    return team;
  }

  async delete(id: TeamId): Promise<boolean> {
    return this.teams.delete(id);
  }

  async exists(id: TeamId): Promise<boolean> {
    return this.teams.has(id);
  }

  async findAll(): Promise<Team[]> {
    return [...this.teams.values()];
  }

  async findNonEmpty(): Promise<Team[]> {
    return [...this.teams.values()].filter((t) => !t.isEmpty);
  }

  /**
   * Clears all data (useful for testing)
   */
  clear(): void {
    this.teams.clear();
  }

  /**
   * Gets the count of teams
   */
  get count(): number {
    return this.teams.size;
  }
}
