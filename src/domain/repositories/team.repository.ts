/**
 * Team Repository Interface
 * @module domain/repositories/team
 */

import type { TeamId } from '../../shared/types/branded-types.js';
import type { Team } from '../entities/team.entity.js';

/**
 * Repository interface for Team entity
 */
export interface ITeamRepository {
  /**
   * Saves a team
   */
  save(team: Team): Promise<void>;

  /**
   * Finds a team by ID
   */
  findById(id: TeamId): Promise<Team | null>;

  /**
   * Finds a team by name (case-insensitive)
   */
  findByName(name: string): Promise<Team | null>;

  /**
   * Gets or creates a team by name
   */
  getOrCreate(name: string): Promise<Team>;

  /**
   * Deletes a team
   */
  delete(id: TeamId): Promise<boolean>;

  /**
   * Checks if a team exists
   */
  exists(id: TeamId): Promise<boolean>;

  /**
   * Gets all teams
   */
  findAll(): Promise<Team[]>;

  /**
   * Gets all non-empty teams (teams with at least one member)
   */
  findNonEmpty(): Promise<Team[]>;
}
