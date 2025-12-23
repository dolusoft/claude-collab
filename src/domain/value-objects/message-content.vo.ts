/**
 * MessageContent Value Object
 * Represents the content of a message with format information
 * @module domain/value-objects/message-content
 */

import { ValidationError } from '../../shared/errors/domain-errors.js';
import { config } from '../../config/index.js';

/**
 * Message format type
 */
export type MessageFormat = 'plain' | 'markdown';

/**
 * Properties for creating a MessageContent
 */
export interface MessageContentProps {
  readonly text: string;
  readonly format: MessageFormat;
}

/**
 * MessageContent value object
 * Immutable representation of message content
 */
export class MessageContent {
  private readonly _text: string;
  private readonly _format: MessageFormat;

  private constructor(text: string, format: MessageFormat) {
    this._text = text;
    this._format = format;
  }

  /**
   * Creates a new MessageContent
   * @throws ValidationError if content is invalid
   */
  public static create(text: string, format: MessageFormat = 'markdown'): MessageContent {
    const trimmedText = text.trim();

    if (!trimmedText) {
      throw new ValidationError('text', 'Message content cannot be empty');
    }

    if (trimmedText.length > config.communication.maxMessageLength) {
      throw new ValidationError(
        'text',
        `Message content exceeds maximum length of ${config.communication.maxMessageLength} characters`
      );
    }

    return new MessageContent(trimmedText, format);
  }

  /**
   * Creates a plain text message
   */
  public static plain(text: string): MessageContent {
    return MessageContent.create(text, 'plain');
  }

  /**
   * Creates a markdown message
   */
  public static markdown(text: string): MessageContent {
    return MessageContent.create(text, 'markdown');
  }

  /**
   * Reconstitutes from persistence
   */
  public static reconstitute(props: MessageContentProps): MessageContent {
    return new MessageContent(props.text, props.format);
  }

  // Getters
  public get text(): string {
    return this._text;
  }

  public get format(): MessageFormat {
    return this._format;
  }

  public get length(): number {
    return this._text.length;
  }

  public get isMarkdown(): boolean {
    return this._format === 'markdown';
  }

  public get isPlain(): boolean {
    return this._format === 'plain';
  }

  /**
   * Returns a preview of the content (first 100 chars)
   */
  public get preview(): string {
    if (this._text.length <= 100) {
      return this._text;
    }
    return `${this._text.substring(0, 97)}...`;
  }

  /**
   * Checks equality with another MessageContent
   */
  public equals(other: MessageContent): boolean {
    return this._text === other._text && this._format === other._format;
  }

  /**
   * Converts to plain object for serialization
   */
  public toJSON(): MessageContentProps {
    return {
      text: this._text,
      format: this._format,
    };
  }

  /**
   * String representation
   */
  public toString(): string {
    return this._text;
  }
}
