/**
 * Answer Entity
 * Represents a response to a question
 * @module domain/entities/answer
 */

import type { AnswerId, QuestionId, MemberId } from '../../shared/types/branded-types.js';
import type { MessageContent } from '../value-objects/message-content.vo.js';

/**
 * Properties required to create an Answer
 */
export interface AnswerProps {
  readonly id: AnswerId;
  readonly questionId: QuestionId;
  readonly fromMemberId: MemberId;
  readonly content: MessageContent;
  readonly createdAt: Date;
}

/**
 * Answer entity - a response to a question
 */
export class Answer {
  private readonly _id: AnswerId;
  private readonly _questionId: QuestionId;
  private readonly _fromMemberId: MemberId;
  private readonly _content: MessageContent;
  private readonly _createdAt: Date;

  private constructor(props: AnswerProps) {
    this._id = props.id;
    this._questionId = props.questionId;
    this._fromMemberId = props.fromMemberId;
    this._content = props.content;
    this._createdAt = props.createdAt;
  }

  /**
   * Creates a new Answer instance
   */
  public static create(props: AnswerProps): Answer {
    return new Answer(props);
  }

  /**
   * Reconstitutes an Answer from persistence
   */
  public static reconstitute(props: AnswerProps): Answer {
    return new Answer(props);
  }

  // Getters
  public get id(): AnswerId {
    return this._id;
  }

  public get questionId(): QuestionId {
    return this._questionId;
  }

  public get fromMemberId(): MemberId {
    return this._fromMemberId;
  }

  public get content(): MessageContent {
    return this._content;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  /**
   * Converts entity to plain object for serialization
   */
  public toJSON(): AnswerProps {
    return {
      id: this._id,
      questionId: this._questionId,
      fromMemberId: this._fromMemberId,
      content: this._content,
      createdAt: this._createdAt,
    };
  }
}
