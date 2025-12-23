/**
 * In-Memory Question Repository
 * @module infrastructure/repositories/in-memory-question
 */

import type { IQuestionRepository } from '../../domain/repositories/question.repository.js';
import type { Question } from '../../domain/entities/question.entity.js';
import type { QuestionId, MemberId, TeamId } from '../../shared/types/branded-types.js';

/**
 * In-memory implementation of IQuestionRepository
 */
export class InMemoryQuestionRepository implements IQuestionRepository {
  private readonly questions = new Map<QuestionId, Question>();

  async save(question: Question): Promise<void> {
    this.questions.set(question.id, question);
  }

  async findById(id: QuestionId): Promise<Question | null> {
    return this.questions.get(id) ?? null;
  }

  async findPendingByTeamId(teamId: TeamId): Promise<Question[]> {
    return [...this.questions.values()].filter((q) => q.toTeamId === teamId && q.isPending);
  }

  async findByFromMemberId(memberId: MemberId): Promise<Question[]> {
    return [...this.questions.values()].filter((q) => q.fromMemberId === memberId);
  }

  async findPendingByFromMemberId(memberId: MemberId): Promise<Question[]> {
    return [...this.questions.values()].filter(
      (q) => q.fromMemberId === memberId && q.isPending
    );
  }

  async delete(id: QuestionId): Promise<boolean> {
    return this.questions.delete(id);
  }

  async exists(id: QuestionId): Promise<boolean> {
    return this.questions.has(id);
  }

  async findAll(): Promise<Question[]> {
    return [...this.questions.values()];
  }

  async markTimedOut(olderThanMs: number): Promise<number> {
    let count = 0;
    const now = Date.now();

    for (const question of this.questions.values()) {
      if (question.isPending && now - question.createdAt.getTime() > olderThanMs) {
        question.markAsTimedOut();
        count++;
      }
    }

    return count;
  }

  /**
   * Clears all data (useful for testing)
   */
  clear(): void {
    this.questions.clear();
  }

  /**
   * Gets the count of questions
   */
  get count(): number {
    return this.questions.size;
  }
}
