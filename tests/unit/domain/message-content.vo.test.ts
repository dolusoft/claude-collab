import { describe, it, expect } from 'vitest';
import { MessageContent } from '../../../src/domain/value-objects/message-content.vo.js';
import { ValidationError } from '../../../src/shared/errors/domain-errors.js';

describe('MessageContent Value Object', () => {
  describe('create', () => {
    it('should create a markdown message by default', () => {
      const content = MessageContent.create('Hello **world**');

      expect(content.text).toBe('Hello **world**');
      expect(content.format).toBe('markdown');
      expect(content.isMarkdown).toBe(true);
      expect(content.isPlain).toBe(false);
    });

    it('should create a plain text message', () => {
      const content = MessageContent.create('Hello world', 'plain');

      expect(content.format).toBe('plain');
      expect(content.isPlain).toBe(true);
    });

    it('should trim whitespace', () => {
      const content = MessageContent.create('  Hello  ');

      expect(content.text).toBe('Hello');
    });

    it('should throw error for empty content', () => {
      expect(() => MessageContent.create('')).toThrow(ValidationError);
      expect(() => MessageContent.create('   ')).toThrow(ValidationError);
    });
  });

  describe('factory methods', () => {
    it('should create plain text via plain()', () => {
      const content = MessageContent.plain('Hello');

      expect(content.format).toBe('plain');
    });

    it('should create markdown via markdown()', () => {
      const content = MessageContent.markdown('# Title');

      expect(content.format).toBe('markdown');
    });
  });

  describe('preview', () => {
    it('should return full text if under 100 chars', () => {
      const content = MessageContent.create('Short message');

      expect(content.preview).toBe('Short message');
    });

    it('should truncate long text with ellipsis', () => {
      const longText = 'A'.repeat(150);
      const content = MessageContent.create(longText);

      expect(content.preview.length).toBe(100);
      expect(content.preview.endsWith('...')).toBe(true);
    });
  });

  describe('equals', () => {
    it('should return true for equal content', () => {
      const content1 = MessageContent.create('Hello', 'markdown');
      const content2 = MessageContent.create('Hello', 'markdown');

      expect(content1.equals(content2)).toBe(true);
    });

    it('should return false for different text', () => {
      const content1 = MessageContent.create('Hello');
      const content2 = MessageContent.create('World');

      expect(content1.equals(content2)).toBe(false);
    });

    it('should return false for different format', () => {
      const content1 = MessageContent.create('Hello', 'plain');
      const content2 = MessageContent.create('Hello', 'markdown');

      expect(content1.equals(content2)).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should serialize correctly', () => {
      const content = MessageContent.create('Test', 'markdown');
      const json = content.toJSON();

      expect(json).toEqual({
        text: 'Test',
        format: 'markdown',
      });
    });
  });

  describe('toString', () => {
    it('should return the text', () => {
      const content = MessageContent.create('Hello');

      expect(content.toString()).toBe('Hello');
    });
  });
});
