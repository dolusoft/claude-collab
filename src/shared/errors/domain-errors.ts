/**
 * Domain-specific errors
 * @module shared/errors/domain-errors
 */

/**
 * Base class for all domain errors
 */
export abstract class DomainError extends Error {
  public readonly code: string;
  public readonly timestamp: Date;

  constructor(message: string, code: string) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.timestamp = new Date();
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error thrown when an entity is not found
 */
export class EntityNotFoundError extends DomainError {
  constructor(entityName: string, id: string) {
    super(`${entityName} with id '${id}' not found`, 'ENTITY_NOT_FOUND');
  }
}

/**
 * Error thrown when a team is not found
 */
export class TeamNotFoundError extends DomainError {
  constructor(teamId: string) {
    super(`Team '${teamId}' not found`, 'TEAM_NOT_FOUND');
  }
}

/**
 * Error thrown when a member is not found
 */
export class MemberNotFoundError extends DomainError {
  constructor(memberId: string) {
    super(`Member '${memberId}' not found`, 'MEMBER_NOT_FOUND');
  }
}

/**
 * Error thrown when a question is not found
 */
export class QuestionNotFoundError extends DomainError {
  constructor(questionId: string) {
    super(`Question '${questionId}' not found`, 'QUESTION_NOT_FOUND');
  }
}

/**
 * Error thrown when a question has already been answered
 */
export class QuestionAlreadyAnsweredError extends DomainError {
  constructor(questionId: string) {
    super(`Question '${questionId}' has already been answered`, 'QUESTION_ALREADY_ANSWERED');
  }
}

/**
 * Error thrown when a member is already in a team
 */
export class MemberAlreadyInTeamError extends DomainError {
  constructor(memberId: string, teamId: string) {
    super(`Member '${memberId}' is already in team '${teamId}'`, 'MEMBER_ALREADY_IN_TEAM');
  }
}

/**
 * Error thrown when a timeout occurs
 */
export class TimeoutError extends DomainError {
  constructor(operation: string, timeoutMs: number) {
    super(`Operation '${operation}' timed out after ${timeoutMs}ms`, 'TIMEOUT');
  }
}

/**
 * Error thrown when connection fails
 */
export class ConnectionError extends DomainError {
  constructor(message: string) {
    super(message, 'CONNECTION_ERROR');
  }
}

/**
 * Error thrown when validation fails
 */
export class ValidationError extends DomainError {
  public readonly field: string;

  constructor(field: string, message: string) {
    super(message, 'VALIDATION_ERROR');
    this.field = field;
  }
}
