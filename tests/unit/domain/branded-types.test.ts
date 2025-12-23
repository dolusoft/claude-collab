import { describe, it, expect } from 'vitest';
import { MemberId, TeamId, QuestionId, AnswerId } from '../../../src/shared/types/branded-types.js';

describe('Branded Types', () => {
  describe('MemberId', () => {
    it('should create a valid MemberId', () => {
      const id = MemberId.create('test-id');
      expect(id).toBe('test-id');
    });

    it('should validate MemberId', () => {
      expect(MemberId.isValid('valid-id')).toBe(true);
      expect(MemberId.isValid('')).toBe(false);
    });
  });

  describe('TeamId', () => {
    it('should create a valid TeamId', () => {
      const id = TeamId.create('Frontend');
      expect(id).toBe('frontend');
    });

    it('should normalize TeamId to lowercase', () => {
      const id = TeamId.create('BACKEND');
      expect(id).toBe('backend');
    });

    it('should validate TeamId', () => {
      expect(TeamId.isValid('frontend')).toBe(true);
      expect(TeamId.isValid('backend-team')).toBe(true);
      expect(TeamId.isValid('team123')).toBe(true);
      expect(TeamId.isValid('')).toBe(false);
      expect(TeamId.isValid('123team')).toBe(false);
      expect(TeamId.isValid('team_name')).toBe(false);
    });
  });

  describe('QuestionId', () => {
    it('should create a valid QuestionId', () => {
      const id = QuestionId.create('q_123');
      expect(id).toBe('q_123');
    });

    it('should validate QuestionId', () => {
      expect(QuestionId.isValid('q_123')).toBe(true);
      expect(QuestionId.isValid('')).toBe(false);
    });
  });

  describe('AnswerId', () => {
    it('should create a valid AnswerId', () => {
      const id = AnswerId.create('a_456');
      expect(id).toBe('a_456');
    });

    it('should validate AnswerId', () => {
      expect(AnswerId.isValid('a_456')).toBe(true);
      expect(AnswerId.isValid('')).toBe(false);
    });
  });
});
