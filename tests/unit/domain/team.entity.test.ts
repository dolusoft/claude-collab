import { describe, it, expect, beforeEach } from 'vitest';
import { Team } from '../../../src/domain/entities/team.entity.js';
import { TeamId, MemberId } from '../../../src/shared/types/branded-types.js';

describe('Team Entity', () => {
  const validProps = {
    id: TeamId.create('frontend'),
    name: 'Frontend',
    createdAt: new Date('2024-01-01T10:00:00Z'),
  };

  describe('create', () => {
    it('should create a team with valid props', () => {
      const team = Team.create(validProps);

      expect(team.id).toBe(validProps.id);
      expect(team.name).toBe(validProps.name);
      expect(team.createdAt).toEqual(validProps.createdAt);
      expect(team.isEmpty).toBe(true);
      expect(team.memberCount).toBe(0);
    });

    it('should throw error for empty name', () => {
      expect(() =>
        Team.create({
          ...validProps,
          name: '   ',
        })
      ).toThrow('Team name cannot be empty');
    });
  });

  describe('member management', () => {
    let team: Team;
    const member1 = MemberId.create('member-1');
    const member2 = MemberId.create('member-2');

    beforeEach(() => {
      team = Team.create(validProps);
    });

    it('should add a member', () => {
      const result = team.addMember(member1);

      expect(result).toBe(true);
      expect(team.hasMember(member1)).toBe(true);
      expect(team.memberCount).toBe(1);
      expect(team.isEmpty).toBe(false);
    });

    it('should return false when adding duplicate member', () => {
      team.addMember(member1);
      const result = team.addMember(member1);

      expect(result).toBe(false);
      expect(team.memberCount).toBe(1);
    });

    it('should remove a member', () => {
      team.addMember(member1);
      const result = team.removeMember(member1);

      expect(result).toBe(true);
      expect(team.hasMember(member1)).toBe(false);
      expect(team.isEmpty).toBe(true);
    });

    it('should return false when removing non-existent member', () => {
      const result = team.removeMember(member1);

      expect(result).toBe(false);
    });

    it('should get other member IDs', () => {
      team.addMember(member1);
      team.addMember(member2);

      const otherMembers = team.getOtherMemberIds(member1);

      expect(otherMembers).toHaveLength(1);
      expect(otherMembers).toContain(member2);
      expect(otherMembers).not.toContain(member1);
    });
  });

  describe('toJSON', () => {
    it('should serialize to JSON correctly', () => {
      const team = Team.create(validProps);
      const member1 = MemberId.create('member-1');
      team.addMember(member1);

      const json = team.toJSON();

      expect(json.id).toBe(validProps.id);
      expect(json.name).toBe(validProps.name);
      expect(json.memberIds).toContain(member1);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute from persistence', () => {
      const member1 = MemberId.create('member-1');
      const team = Team.reconstitute({
        ...validProps,
        memberIds: [member1],
      });

      expect(team.hasMember(member1)).toBe(true);
      expect(team.memberCount).toBe(1);
    });
  });
});
