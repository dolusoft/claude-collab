/**
 * Mock repositories for testing
 */

import type { IMemberRepository } from '../../src/domain/repositories/member.repository.js';
import type { ITeamRepository } from '../../src/domain/repositories/team.repository.js';
import type { IQuestionRepository } from '../../src/domain/repositories/question.repository.js';
import type { MemberId, TeamId, QuestionId } from '../../src/shared/types/branded-types.js';
import type { Member } from '../../src/domain/entities/member.entity.js';
import type { Team } from '../../src/domain/entities/team.entity.js';
import type { Question } from '../../src/domain/entities/question.entity.js';
import type { Answer } from '../../src/domain/entities/answer.entity.js';
import { Team as TeamEntity } from '../../src/domain/entities/team.entity.js';
import { createTeamId } from '../../src/shared/utils/id-generator.js';

export class MockMemberRepository implements IMemberRepository {
  private members = new Map<MemberId, Member>();

  async save(member: Member): Promise<void> {
    this.members.set(member.id, member);
  }

  async findById(id: MemberId): Promise<Member | null> {
    return this.members.get(id) ?? null;
  }

  async findByTeamId(teamId: TeamId): Promise<Member[]> {
    return [...this.members.values()].filter((m) => m.teamId === teamId);
  }

  async findOnlineByTeamId(teamId: TeamId): Promise<Member[]> {
    return [...this.members.values()].filter((m) => m.teamId === teamId && m.isOnline);
  }

  async delete(id: MemberId): Promise<boolean> {
    return this.members.delete(id);
  }

  async exists(id: MemberId): Promise<boolean> {
    return this.members.has(id);
  }

  async findAll(): Promise<Member[]> {
    return [...this.members.values()];
  }

  // Test helpers
  clear(): void {
    this.members.clear();
  }

  getAll(): Member[] {
    return [...this.members.values()];
  }
}

export class MockTeamRepository implements ITeamRepository {
  private teams = new Map<TeamId, Team>();

  async save(team: Team): Promise<void> {
    this.teams.set(team.id, team);
  }

  async findById(id: TeamId): Promise<Team | null> {
    return this.teams.get(id) ?? null;
  }

  async findByName(name: string): Promise<Team | null> {
    const teamId = createTeamId(name);
    return this.teams.get(teamId) ?? null;
  }

  async getOrCreate(name: string): Promise<Team> {
    const existing = await this.findByName(name);
    if (existing) {
      return existing;
    }

    const teamId = createTeamId(name);
    const team = TeamEntity.create({
      id: teamId,
      name: name.trim(),
      createdAt: new Date(),
    });

    await this.save(team);
    return team;
  }

  async delete(id: TeamId): Promise<boolean> {
    return this.teams.delete(id);
  }

  async exists(id: TeamId): Promise<boolean> {
    return this.teams.has(id);
  }

  async findAll(): Promise<Team[]> {
    return [...this.teams.values()];
  }

  async findNonEmpty(): Promise<Team[]> {
    return [...this.teams.values()].filter((t) => !t.isEmpty);
  }

  // Test helpers
  clear(): void {
    this.teams.clear();
  }

  getAll(): Team[] {
    return [...this.teams.values()];
  }
}

export class MockQuestionRepository implements IQuestionRepository {
  private questions = new Map<QuestionId, Question>();

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

  // Test helpers
  clear(): void {
    this.questions.clear();
  }

  getAll(): Question[] {
    return [...this.questions.values()];
  }
}

export class MockAnswerRepository {
  private answers = new Map<string, Answer>();

  async save(answer: Answer): Promise<void> {
    this.answers.set(answer.id, answer);
  }

  // Test helpers
  clear(): void {
    this.answers.clear();
  }

  getAll(): Answer[] {
    return [...this.answers.values()];
  }
}
