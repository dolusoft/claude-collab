import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AskQuestionUseCase } from '../../../src/application/use-cases/ask-question.use-case.js';
import { Member, MemberStatus } from '../../../src/domain/entities/member.entity.js';
import { Team } from '../../../src/domain/entities/team.entity.js';
import { QuestionStatus } from '../../../src/domain/entities/question.entity.js';
import { QuestionAskedEvent } from '../../../src/domain/events/question-asked.event.js';
import {
  MemberNotFoundError,
  TeamNotFoundError,
  ValidationError,
} from '../../../src/shared/errors/domain-errors.js';
import { MemberId, TeamId } from '../../../src/shared/types/branded-types.js';
import {
  MockMemberRepository,
  MockTeamRepository,
  MockQuestionRepository,
} from '../../helpers/mock-repositories.js';

describe('AskQuestionUseCase', () => {
  let memberRepository: MockMemberRepository;
  let teamRepository: MockTeamRepository;
  let questionRepository: MockQuestionRepository;
  let useCase: AskQuestionUseCase;
  let onQuestionAsked: ReturnType<typeof vi.fn>;

  const frontendMemberId = MemberId.create('frontend-member-1');
  const frontendTeamId = TeamId.create('frontend');
  const backendTeamId = TeamId.create('backend');

  beforeEach(async () => {
    memberRepository = new MockMemberRepository();
    teamRepository = new MockTeamRepository();
    questionRepository = new MockQuestionRepository();
    onQuestionAsked = vi.fn();

    useCase = new AskQuestionUseCase({
      memberRepository,
      teamRepository,
      questionRepository,
      onQuestionAsked,
    });

    // Setup: Create frontend member
    const frontendMember = Member.create({
      id: frontendMemberId,
      teamId: frontendTeamId,
      displayName: 'Frontend Claude',
      connectedAt: new Date(),
      status: MemberStatus.ONLINE,
    });
    await memberRepository.save(frontendMember);

    // Setup: Create frontend team
    const frontendTeam = Team.create({
      id: frontendTeamId,
      name: 'Frontend',
      createdAt: new Date(),
    });
    frontendTeam.addMember(frontendMemberId);
    await teamRepository.save(frontendTeam);

    // Setup: Create backend team
    const backendTeam = Team.create({
      id: backendTeamId,
      name: 'Backend',
      createdAt: new Date(),
    });
    await teamRepository.save(backendTeam);
  });

  it('should create a question', async () => {
    const result = await useCase.execute({
      fromMemberId: frontendMemberId,
      toTeamName: 'backend',
      content: 'What is the API format?',
    });

    expect(result.toTeamId).toBe(backendTeamId);
    expect(result.status).toBe(QuestionStatus.PENDING);
    expect(result.questionId).toBeDefined();
  });

  it('should emit QuestionAskedEvent', async () => {
    await useCase.execute({
      fromMemberId: frontendMemberId,
      toTeamName: 'backend',
      content: 'Test question',
    });

    expect(onQuestionAsked).toHaveBeenCalledTimes(1);
    expect(onQuestionAsked).toHaveBeenCalledWith(expect.any(QuestionAskedEvent));
  });

  it('should throw error for non-existent member', async () => {
    await expect(
      useCase.execute({
        fromMemberId: MemberId.create('non-existent'),
        toTeamName: 'backend',
        content: 'Test',
      })
    ).rejects.toThrow(MemberNotFoundError);
  });

  it('should throw error for non-existent team', async () => {
    await expect(
      useCase.execute({
        fromMemberId: frontendMemberId,
        toTeamName: 'non-existent-team',
        content: 'Test',
      })
    ).rejects.toThrow(TeamNotFoundError);
  });

  it('should throw error when asking own team', async () => {
    await expect(
      useCase.execute({
        fromMemberId: frontendMemberId,
        toTeamName: 'frontend',
        content: 'Test',
      })
    ).rejects.toThrow(ValidationError);
  });

  it('should use markdown format by default', async () => {
    await useCase.execute({
      fromMemberId: frontendMemberId,
      toTeamName: 'backend',
      content: '**Bold** question',
    });

    const questions = questionRepository.getAll();
    expect(questions[0]?.content.format).toBe('markdown');
  });

  it('should support plain text format', async () => {
    await useCase.execute({
      fromMemberId: frontendMemberId,
      toTeamName: 'backend',
      content: 'Plain question',
      format: 'plain',
    });

    const questions = questionRepository.getAll();
    expect(questions[0]?.content.format).toBe('plain');
  });
});
