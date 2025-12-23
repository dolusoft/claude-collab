import { describe, it, expect, beforeEach } from 'vitest';
import { Question, QuestionStatus } from '../../../src/domain/entities/question.entity.js';
import { MessageContent } from '../../../src/domain/value-objects/message-content.vo.js';
import { QuestionId, MemberId, TeamId } from '../../../src/shared/types/branded-types.js';
import { QuestionAlreadyAnsweredError } from '../../../src/shared/errors/domain-errors.js';

describe('Question Entity', () => {
  const validProps = {
    id: QuestionId.create('q_123'),
    fromMemberId: MemberId.create('member-1'),
    toTeamId: TeamId.create('backend'),
    content: MessageContent.create('What is the API format?'),
    createdAt: new Date('2024-01-01T10:00:00Z'),
  };

  describe('create', () => {
    it('should create a question with PENDING status', () => {
      const question = Question.create(validProps);

      expect(question.id).toBe(validProps.id);
      expect(question.fromMemberId).toBe(validProps.fromMemberId);
      expect(question.toTeamId).toBe(validProps.toTeamId);
      expect(question.content.text).toBe('What is the API format?');
      expect(question.status).toBe(QuestionStatus.PENDING);
      expect(question.isPending).toBe(true);
      expect(question.canBeAnswered).toBe(true);
    });
  });

  describe('markAsAnswered', () => {
    let question: Question;
    const answeredBy = MemberId.create('member-2');

    beforeEach(() => {
      question = Question.create(validProps);
    });

    it('should mark question as answered', () => {
      question.markAsAnswered(answeredBy);

      expect(question.status).toBe(QuestionStatus.ANSWERED);
      expect(question.isAnswered).toBe(true);
      expect(question.answeredByMemberId).toBe(answeredBy);
      expect(question.answeredAt).toBeInstanceOf(Date);
      expect(question.canBeAnswered).toBe(false);
    });

    it('should throw error if already answered', () => {
      question.markAsAnswered(answeredBy);

      expect(() => question.markAsAnswered(answeredBy)).toThrow(QuestionAlreadyAnsweredError);
    });
  });

  describe('markAsTimedOut', () => {
    it('should mark pending question as timed out', () => {
      const question = Question.create(validProps);

      question.markAsTimedOut();

      expect(question.status).toBe(QuestionStatus.TIMEOUT);
      expect(question.isTimedOut).toBe(true);
      expect(question.canBeAnswered).toBe(false);
    });

    it('should not change status if not pending', () => {
      const question = Question.create(validProps);
      question.markAsAnswered(MemberId.create('member-2'));

      question.markAsTimedOut();

      expect(question.status).toBe(QuestionStatus.ANSWERED);
    });
  });

  describe('markAsCancelled', () => {
    it('should mark pending question as cancelled', () => {
      const question = Question.create(validProps);

      question.markAsCancelled();

      expect(question.status).toBe(QuestionStatus.CANCELLED);
      expect(question.isCancelled).toBe(true);
    });
  });

  describe('ageMs', () => {
    it('should calculate age correctly', () => {
      const question = Question.create({
        ...validProps,
        createdAt: new Date(Date.now() - 5000), // 5 seconds ago
      });

      expect(question.ageMs).toBeGreaterThanOrEqual(5000);
      expect(question.ageMs).toBeLessThan(6000);
    });
  });

  describe('toJSON', () => {
    it('should serialize correctly', () => {
      const question = Question.create(validProps);
      const json = question.toJSON();

      expect(json.id).toBe(validProps.id);
      expect(json.fromMemberId).toBe(validProps.fromMemberId);
      expect(json.toTeamId).toBe(validProps.toTeamId);
      expect(json.status).toBe(QuestionStatus.PENDING);
    });
  });
});
