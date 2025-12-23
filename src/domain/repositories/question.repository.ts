/**
 * Question Repository Interface
 * @module domain/repositories/question
 */

import type { QuestionId, MemberId, TeamId } from '../../shared/types/branded-types.js';
import type { Question } from '../entities/question.entity.js';

/**
 * Repository interface for Question entity
 */
export interface IQuestionRepository {
  /**
   * Saves a question
   */
  save(question: Question): Promise<void>;

  /**
   * Finds a question by ID
   */
  findById(id: QuestionId): Promise<Question | null>;

  /**
   * Finds all pending questions for a team
   */
  findPendingByTeamId(teamId: TeamId): Promise<Question[]>;

  /**
   * Finds all questions asked by a member
   */
  findByFromMemberId(memberId: MemberId): Promise<Question[]>;

  /**
   * Finds pending questions asked by a member
   */
  findPendingByFromMemberId(memberId: MemberId): Promise<Question[]>;

  /**
   * Deletes a question
   */
  delete(id: QuestionId): Promise<boolean>;

  /**
   * Checks if a question exists
   */
  exists(id: QuestionId): Promise<boolean>;

  /**
   * Gets all questions
   */
  findAll(): Promise<Question[]>;

  /**
   * Marks timed out questions
   * @param olderThanMs Questions older than this many milliseconds
   * @returns Number of questions marked as timed out
   */
  markTimedOut(olderThanMs: number): Promise<number>;
}
