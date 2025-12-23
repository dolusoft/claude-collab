/**
 * JoinTeam Use Case
 * Handles joining a team channel
 * @module application/use-cases/join-team
 */

import type { JoinTeamInput, JoinTeamOutput } from '../dtos/join-team.dto.js';
import type { IMemberRepository } from '../../domain/repositories/member.repository.js';
import type { ITeamRepository } from '../../domain/repositories/team.repository.js';
import { Member, MemberStatus } from '../../domain/entities/member.entity.js';
import { MemberJoinedEvent } from '../../domain/events/member-joined.event.js';
import { generateMemberId, createTeamId } from '../../shared/utils/id-generator.js';
import { ValidationError } from '../../shared/errors/domain-errors.js';

/**
 * Event handler type for domain events
 */
export type EventHandler = (event: MemberJoinedEvent) => void | Promise<void>;

/**
 * JoinTeam use case dependencies
 */
export interface JoinTeamDependencies {
  readonly memberRepository: IMemberRepository;
  readonly teamRepository: ITeamRepository;
  readonly onMemberJoined?: EventHandler;
}

/**
 * JoinTeam use case
 * Creates a new member and adds them to a team
 */
export class JoinTeamUseCase {
  constructor(private readonly deps: JoinTeamDependencies) {}

  /**
   * Executes the use case
   */
  public async execute(input: JoinTeamInput): Promise<JoinTeamOutput> {
    // Validate input
    if (!input.teamName.trim()) {
      throw new ValidationError('teamName', 'Team name cannot be empty');
    }
    if (!input.displayName.trim()) {
      throw new ValidationError('displayName', 'Display name cannot be empty');
    }

    // Get or create team
    const team = await this.deps.teamRepository.getOrCreate(input.teamName);

    // Create member
    const memberId = generateMemberId();
    const member = Member.create({
      id: memberId,
      teamId: team.id,
      displayName: input.displayName.trim(),
      connectedAt: new Date(),
      status: MemberStatus.ONLINE,
    });

    // Save member
    await this.deps.memberRepository.save(member);

    // Add member to team
    team.addMember(memberId);
    await this.deps.teamRepository.save(team);

    // Emit event
    if (this.deps.onMemberJoined) {
      const event = new MemberJoinedEvent(memberId, team.id, member.displayName);
      await this.deps.onMemberJoined(event);
    }

    return {
      memberId,
      teamId: team.id,
      teamName: team.name,
      displayName: member.displayName,
      status: member.status,
      memberCount: team.memberCount,
    };
  }
}
