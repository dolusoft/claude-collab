/**
 * In-Memory Answer Repository
 * @module infrastructure/repositories/in-memory-answer
 */

import type { IAnswerRepository } from '../../application/use-cases/reply-question.use-case.js';
import type { Answer } from '../../domain/entities/answer.entity.js';
import type { AnswerId, QuestionId } from '../../shared/types/branded-types.js';

/**
 * In-memory implementation of IAnswerRepository
 */
export class InMemoryAnswerRepository implements IAnswerRepository {
  private readonly answers = new Map<AnswerId, Answer>();

  async save(answer: Answer): Promise<void> {
    this.answers.set(answer.id, answer);
  }

  async findById(id: AnswerId): Promise<Answer | null> {
    return this.answers.get(id) ?? null;
  }

  async findByQuestionId(questionId: QuestionId): Promise<Answer | null> {
    for (const answer of this.answers.values()) {
      if (answer.questionId === questionId) {
        return answer;
      }
    }
    return null;
  }

  async findAll(): Promise<Answer[]> {
    return [...this.answers.values()];
  }

  /**
   * Clears all data (useful for testing)
   */
  clear(): void {
    this.answers.clear();
  }

  /**
   * Gets the count of answers
   */
  get count(): number {
    return this.answers.size;
  }
}
