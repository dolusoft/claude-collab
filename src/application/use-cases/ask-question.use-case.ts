/**
 * AskQuestion Use Case
 * Handles asking a question to another team
 * @module application/use-cases/ask-question
 */

import type { AskQuestionInput, AskQuestionOutput } from '../dtos/ask-question.dto.js';
import type { IMemberRepository } from '../../domain/repositories/member.repository.js';
import type { ITeamRepository } from '../../domain/repositories/team.repository.js';
import type { IQuestionRepository } from '../../domain/repositories/question.repository.js';
import { Question } from '../../domain/entities/question.entity.js';
import { MessageContent } from '../../domain/value-objects/message-content.vo.js';
import { QuestionAskedEvent } from '../../domain/events/question-asked.event.js';
import { generateQuestionId, createTeamId } from '../../shared/utils/id-generator.js';
import {
  MemberNotFoundError,
  TeamNotFoundError,
  ValidationError,
} from '../../shared/errors/domain-errors.js';

/**
 * Event handler type for domain events
 */
export type EventHandler = (event: QuestionAskedEvent) => void | Promise<void>;

/**
 * AskQuestion use case dependencies
 */
export interface AskQuestionDependencies {
  readonly memberRepository: IMemberRepository;
  readonly teamRepository: ITeamRepository;
  readonly questionRepository: IQuestionRepository;
  readonly onQuestionAsked?: EventHandler;
}

/**
 * AskQuestion use case
 * Creates and sends a question to a team
 */
export class AskQuestionUseCase {
  constructor(private readonly deps: AskQuestionDependencies) {}

  /**
   * Executes the use case
   */
  public async execute(input: AskQuestionInput): Promise<AskQuestionOutput> {
    // Validate member exists
    const member = await this.deps.memberRepository.findById(input.fromMemberId);
    if (!member) {
      throw new MemberNotFoundError(input.fromMemberId);
    }

    // Validate target team exists
    const targetTeamId = createTeamId(input.toTeamName);
    const targetTeam = await this.deps.teamRepository.findById(targetTeamId);
    if (!targetTeam) {
      throw new TeamNotFoundError(input.toTeamName);
    }

    // Validate not asking own team
    if (member.teamId === targetTeamId) {
      throw new ValidationError('toTeamName', 'Cannot ask question to your own team');
    }

    // Create message content
    const content = MessageContent.create(input.content, input.format ?? 'markdown');

    // Create question
    const questionId = generateQuestionId();
    const question = Question.create({
      id: questionId,
      fromMemberId: input.fromMemberId,
      toTeamId: targetTeamId,
      content,
      createdAt: new Date(),
    });

    // Save question
    await this.deps.questionRepository.save(question);

    // Record member activity
    member.recordActivity();
    await this.deps.memberRepository.save(member);

    // Emit event
    if (this.deps.onQuestionAsked) {
      const event = new QuestionAskedEvent(
        questionId,
        input.fromMemberId,
        targetTeamId,
        content.preview
      );
      await this.deps.onQuestionAsked(event);
    }

    return {
      questionId,
      toTeamId: targetTeamId,
      status: question.status,
      createdAt: question.createdAt,
    };
  }
}
