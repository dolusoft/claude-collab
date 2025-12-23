/**
 * ReplyQuestion Use Case
 * Handles replying to a question
 * @module application/use-cases/reply-question
 */

import type { ReplyQuestionInput, ReplyQuestionOutput } from '../dtos/reply-question.dto.js';
import type { IMemberRepository } from '../../domain/repositories/member.repository.js';
import type { IQuestionRepository } from '../../domain/repositories/question.repository.js';
import { Answer } from '../../domain/entities/answer.entity.js';
import { MessageContent } from '../../domain/value-objects/message-content.vo.js';
import { QuestionAnsweredEvent } from '../../domain/events/question-answered.event.js';
import { generateAnswerId } from '../../shared/utils/id-generator.js';
import {
  MemberNotFoundError,
  QuestionNotFoundError,
  QuestionAlreadyAnsweredError,
} from '../../shared/errors/domain-errors.js';

/**
 * Event handler type for domain events
 */
export type EventHandler = (event: QuestionAnsweredEvent) => void | Promise<void>;

/**
 * Answer repository interface (simplified for this use case)
 */
export interface IAnswerRepository {
  save(answer: Answer): Promise<void>;
}

/**
 * ReplyQuestion use case dependencies
 */
export interface ReplyQuestionDependencies {
  readonly memberRepository: IMemberRepository;
  readonly questionRepository: IQuestionRepository;
  readonly answerRepository: IAnswerRepository;
  readonly onQuestionAnswered?: EventHandler;
}

/**
 * ReplyQuestion use case
 * Creates an answer to a question
 */
export class ReplyQuestionUseCase {
  constructor(private readonly deps: ReplyQuestionDependencies) {}

  /**
   * Executes the use case
   */
  public async execute(input: ReplyQuestionInput): Promise<ReplyQuestionOutput> {
    // Validate member exists
    const member = await this.deps.memberRepository.findById(input.fromMemberId);
    if (!member) {
      throw new MemberNotFoundError(input.fromMemberId);
    }

    // Validate question exists
    const question = await this.deps.questionRepository.findById(input.questionId);
    if (!question) {
      throw new QuestionNotFoundError(input.questionId);
    }

    // Check if question can be answered
    if (!question.canBeAnswered) {
      throw new QuestionAlreadyAnsweredError(input.questionId);
    }

    // Create message content
    const content = MessageContent.create(input.content, input.format ?? 'markdown');

    // Create answer
    const answerId = generateAnswerId();
    const answer = Answer.create({
      id: answerId,
      questionId: input.questionId,
      fromMemberId: input.fromMemberId,
      content,
      createdAt: new Date(),
    });

    // Mark question as answered
    question.markAsAnswered(input.fromMemberId);

    // Save answer and update question
    await this.deps.answerRepository.save(answer);
    await this.deps.questionRepository.save(question);

    // Record member activity
    member.recordActivity();
    await this.deps.memberRepository.save(member);

    // Emit event
    if (this.deps.onQuestionAnswered) {
      const event = new QuestionAnsweredEvent(
        input.questionId,
        answerId,
        input.fromMemberId,
        content.preview
      );
      await this.deps.onQuestionAnswered(event);
    }

    return {
      answerId,
      questionId: input.questionId,
      deliveredToMemberId: question.fromMemberId,
      createdAt: answer.createdAt,
    };
  }
}
