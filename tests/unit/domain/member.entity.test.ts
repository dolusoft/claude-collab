import { describe, it, expect, beforeEach } from 'vitest';
import { Member, MemberStatus } from '../../../src/domain/entities/member.entity.js';
import { MemberId, TeamId } from '../../../src/shared/types/branded-types.js';

describe('Member Entity', () => {
  const validProps = {
    id: MemberId.create('member-1'),
    teamId: TeamId.create('frontend'),
    displayName: 'Frontend Claude',
    connectedAt: new Date('2024-01-01T10:00:00Z'),
    status: MemberStatus.ONLINE,
  };

  describe('create', () => {
    it('should create a member with valid props', () => {
      const member = Member.create(validProps);

      expect(member.id).toBe(validProps.id);
      expect(member.teamId).toBe(validProps.teamId);
      expect(member.displayName).toBe(validProps.displayName);
      expect(member.connectedAt).toEqual(validProps.connectedAt);
      expect(member.status).toBe(MemberStatus.ONLINE);
    });

    it('should throw error for empty display name', () => {
      expect(() =>
        Member.create({
          ...validProps,
          displayName: '   ',
        })
      ).toThrow('Display name cannot be empty');
    });
  });

  describe('status transitions', () => {
    let member: Member;

    beforeEach(() => {
      member = Member.create(validProps);
    });

    it('should go idle', () => {
      member.goIdle();
      expect(member.status).toBe(MemberStatus.IDLE);
      expect(member.isOnline).toBe(true);
    });

    it('should go offline', () => {
      member.goOffline();
      expect(member.status).toBe(MemberStatus.OFFLINE);
      expect(member.isOnline).toBe(false);
    });

    it('should go online from idle', () => {
      member.goIdle();
      member.goOnline();
      expect(member.status).toBe(MemberStatus.ONLINE);
    });
  });

  describe('recordActivity', () => {
    it('should update last activity timestamp', () => {
      const member = Member.create(validProps);
      const originalActivity = member.lastActivityAt;

      // Wait a bit to ensure timestamp changes
      member.recordActivity();

      expect(member.lastActivityAt.getTime()).toBeGreaterThanOrEqual(originalActivity.getTime());
    });

    it('should change status from IDLE to ONLINE on activity', () => {
      const member = Member.create(validProps);
      member.goIdle();

      member.recordActivity();

      expect(member.status).toBe(MemberStatus.ONLINE);
    });
  });

  describe('toJSON', () => {
    it('should serialize to JSON correctly', () => {
      const member = Member.create(validProps);
      const json = member.toJSON();

      expect(json.id).toBe(validProps.id);
      expect(json.teamId).toBe(validProps.teamId);
      expect(json.displayName).toBe(validProps.displayName);
      expect(json.status).toBe(MemberStatus.ONLINE);
    });
  });
});
