/**
 * GetInbox Use Case
 * Retrieves pending questions for a team member
 * @module application/use-cases/get-inbox
 */

import type { GetInboxInput, GetInboxOutput, InboxQuestionItem } from '../dtos/get-inbox.dto.js';
import type { IMemberRepository } from '../../domain/repositories/member.repository.js';
import type { ITeamRepository } from '../../domain/repositories/team.repository.js';
import type { IQuestionRepository } from '../../domain/repositories/question.repository.js';
import { QuestionStatus } from '../../domain/entities/question.entity.js';
import { MemberNotFoundError, TeamNotFoundError } from '../../shared/errors/domain-errors.js';

/**
 * GetInbox use case dependencies
 */
export interface GetInboxDependencies {
  readonly memberRepository: IMemberRepository;
  readonly teamRepository: ITeamRepository;
  readonly questionRepository: IQuestionRepository;
}

/**
 * GetInbox use case
 * Retrieves questions directed to the member's team
 */
export class GetInboxUseCase {
  constructor(private readonly deps: GetInboxDependencies) {}

  /**
   * Executes the use case
   */
  public async execute(input: GetInboxInput): Promise<GetInboxOutput> {
    // Validate member exists
    const member = await this.deps.memberRepository.findById(input.memberId);
    if (!member) {
      throw new MemberNotFoundError(input.memberId);
    }

    // Validate team exists
    const team = await this.deps.teamRepository.findById(input.teamId);
    if (!team) {
      throw new TeamNotFoundError(input.teamId);
    }

    // Get questions for team
    const allQuestions = await this.deps.questionRepository.findPendingByTeamId(input.teamId);

    // Filter based on includeAnswered flag
    const questions = input.includeAnswered
      ? allQuestions
      : allQuestions.filter((q) => q.isPending);

    // Map to DTOs with member info
    const questionItems: InboxQuestionItem[] = [];

    for (const question of questions) {
      const fromMember = await this.deps.memberRepository.findById(question.fromMemberId);
      const fromTeam = fromMember
        ? await this.deps.teamRepository.findById(fromMember.teamId)
        : null;

      questionItems.push({
        questionId: question.id,
        fromMemberId: question.fromMemberId,
        fromDisplayName: fromMember?.displayName ?? 'Unknown',
        fromTeamName: fromTeam?.name ?? 'Unknown',
        content: question.content.text,
        format: question.content.format,
        status: question.status,
        createdAt: question.createdAt,
        ageMs: question.ageMs,
      });
    }

    // Sort by creation date (newest first)
    questionItems.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const pendingCount = questionItems.filter((q) => q.status === QuestionStatus.PENDING).length;

    return {
      teamId: team.id,
      teamName: team.name,
      questions: questionItems,
      totalCount: questionItems.length,
      pendingCount,
    };
  }
}
