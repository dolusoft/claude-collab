/**
 * Question Entity
 * Represents a question sent from one member to a team
 * @module domain/entities/question
 */

import type { QuestionId, MemberId, TeamId } from '../../shared/types/branded-types.js';
import type { MessageContent } from '../value-objects/message-content.vo.js';
import { QuestionAlreadyAnsweredError } from '../../shared/errors/domain-errors.js';

/**
 * Question status enumeration
 */
export enum QuestionStatus {
  /** Question is waiting for an answer */
  PENDING = 'PENDING',
  /** Question has been answered */
  ANSWERED = 'ANSWERED',
  /** Question timed out without an answer */
  TIMEOUT = 'TIMEOUT',
  /** Question was cancelled */
  CANCELLED = 'CANCELLED',
}

/**
 * Properties required to create a Question
 */
export interface QuestionProps {
  readonly id: QuestionId;
  readonly fromMemberId: MemberId;
  readonly toTeamId: TeamId;
  readonly content: MessageContent;
  readonly createdAt: Date;
  readonly status: QuestionStatus;
  readonly answeredAt?: Date;
  readonly answeredByMemberId?: MemberId;
}

/**
 * Question entity - a message awaiting response
 */
export class Question {
  private readonly _id: QuestionId;
  private readonly _fromMemberId: MemberId;
  private readonly _toTeamId: TeamId;
  private readonly _content: MessageContent;
  private readonly _createdAt: Date;
  private _status: QuestionStatus;
  private _answeredAt?: Date;
  private _answeredByMemberId?: MemberId;

  private constructor(props: QuestionProps) {
    this._id = props.id;
    this._fromMemberId = props.fromMemberId;
    this._toTeamId = props.toTeamId;
    this._content = props.content;
    this._createdAt = props.createdAt;
    this._status = props.status;
    this._answeredAt = props.answeredAt;
    this._answeredByMemberId = props.answeredByMemberId;
  }

  /**
   * Creates a new Question instance
   */
  public static create(props: Omit<QuestionProps, 'status' | 'answeredAt' | 'answeredByMemberId'>): Question {
    return new Question({
      ...props,
      status: QuestionStatus.PENDING,
    });
  }

  /**
   * Reconstitutes a Question from persistence
   */
  public static reconstitute(props: QuestionProps): Question {
    return new Question(props);
  }

  // Getters
  public get id(): QuestionId {
    return this._id;
  }

  public get fromMemberId(): MemberId {
    return this._fromMemberId;
  }

  public get toTeamId(): TeamId {
    return this._toTeamId;
  }

  public get content(): MessageContent {
    return this._content;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get status(): QuestionStatus {
    return this._status;
  }

  public get answeredAt(): Date | undefined {
    return this._answeredAt;
  }

  public get answeredByMemberId(): MemberId | undefined {
    return this._answeredByMemberId;
  }

  public get isPending(): boolean {
    return this._status === QuestionStatus.PENDING;
  }

  public get isAnswered(): boolean {
    return this._status === QuestionStatus.ANSWERED;
  }

  public get isTimedOut(): boolean {
    return this._status === QuestionStatus.TIMEOUT;
  }

  public get isCancelled(): boolean {
    return this._status === QuestionStatus.CANCELLED;
  }

  public get canBeAnswered(): boolean {
    return this._status === QuestionStatus.PENDING;
  }

  /**
   * Calculates the age of the question in milliseconds
   */
  public get ageMs(): number {
    return Date.now() - this._createdAt.getTime();
  }

  // Behaviors
  /**
   * Marks the question as answered
   * @throws QuestionAlreadyAnsweredError if already answered
   */
  public markAsAnswered(answeredByMemberId: MemberId): void {
    if (!this.canBeAnswered) {
      throw new QuestionAlreadyAnsweredError(this._id);
    }
    this._status = QuestionStatus.ANSWERED;
    this._answeredAt = new Date();
    this._answeredByMemberId = answeredByMemberId;
  }

  /**
   * Marks the question as timed out
   */
  public markAsTimedOut(): void {
    if (this._status === QuestionStatus.PENDING) {
      this._status = QuestionStatus.TIMEOUT;
    }
  }

  /**
   * Marks the question as cancelled
   */
  public markAsCancelled(): void {
    if (this._status === QuestionStatus.PENDING) {
      this._status = QuestionStatus.CANCELLED;
    }
  }

  /**
   * Converts entity to plain object for serialization
   */
  public toJSON(): QuestionProps {
    return {
      id: this._id,
      fromMemberId: this._fromMemberId,
      toTeamId: this._toTeamId,
      content: this._content,
      createdAt: this._createdAt,
      status: this._status,
      answeredAt: this._answeredAt,
      answeredByMemberId: this._answeredByMemberId,
    };
  }
}
