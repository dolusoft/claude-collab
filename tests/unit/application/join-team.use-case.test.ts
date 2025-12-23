import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JoinTeamUseCase } from '../../../src/application/use-cases/join-team.use-case.js';
import { MemberStatus } from '../../../src/domain/entities/member.entity.js';
import { MemberJoinedEvent } from '../../../src/domain/events/member-joined.event.js';
import { ValidationError } from '../../../src/shared/errors/domain-errors.js';
import { MockMemberRepository, MockTeamRepository } from '../../helpers/mock-repositories.js';

describe('JoinTeamUseCase', () => {
  let memberRepository: MockMemberRepository;
  let teamRepository: MockTeamRepository;
  let useCase: JoinTeamUseCase;
  let onMemberJoined: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    memberRepository = new MockMemberRepository();
    teamRepository = new MockTeamRepository();
    onMemberJoined = vi.fn();

    useCase = new JoinTeamUseCase({
      memberRepository,
      teamRepository,
      onMemberJoined,
    });
  });

  it('should create a new member and join a team', async () => {
    const result = await useCase.execute({
      teamName: 'frontend',
      displayName: 'Frontend Claude',
    });

    expect(result.teamName).toBe('frontend');
    expect(result.displayName).toBe('Frontend Claude');
    expect(result.status).toBe(MemberStatus.ONLINE);
    expect(result.memberCount).toBe(1);
  });

  it('should create team if not exists', async () => {
    await useCase.execute({
      teamName: 'new-team',
      displayName: 'Test Member',
    });

    const teams = teamRepository.getAll();
    expect(teams).toHaveLength(1);
    expect(teams[0]?.name).toBe('new-team');
  });

  it('should add member to existing team', async () => {
    // First member
    await useCase.execute({
      teamName: 'frontend',
      displayName: 'Member 1',
    });

    // Second member
    const result = await useCase.execute({
      teamName: 'frontend',
      displayName: 'Member 2',
    });

    expect(result.memberCount).toBe(2);
  });

  it('should emit MemberJoinedEvent', async () => {
    await useCase.execute({
      teamName: 'frontend',
      displayName: 'Test Member',
    });

    expect(onMemberJoined).toHaveBeenCalledTimes(1);
    expect(onMemberJoined).toHaveBeenCalledWith(expect.any(MemberJoinedEvent));
  });

  it('should throw error for empty team name', async () => {
    await expect(
      useCase.execute({
        teamName: '   ',
        displayName: 'Test',
      })
    ).rejects.toThrow(ValidationError);
  });

  it('should throw error for empty display name', async () => {
    await expect(
      useCase.execute({
        teamName: 'frontend',
        displayName: '   ',
      })
    ).rejects.toThrow(ValidationError);
  });

  it('should normalize team name to lowercase', async () => {
    const result = await useCase.execute({
      teamName: 'FRONTEND',
      displayName: 'Test',
    });

    expect(result.teamId).toBe('frontend');
  });
});
