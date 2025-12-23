/**
 * Branded types for type-safe IDs
 * @module shared/types/branded-types
 */

declare const brand: unique symbol;

/**
 * Creates a branded type for nominal typing
 */
export type Brand<T, B> = T & { readonly [brand]: B };

/**
 * Member ID - unique identifier for a connected Claude Code terminal
 */
export type MemberId = Brand<string, 'MemberId'>;

/**
 * Team ID - identifier for a team channel (e.g., "frontend", "backend")
 */
export type TeamId = Brand<string, 'TeamId'>;

/**
 * Question ID - unique identifier for a question
 */
export type QuestionId = Brand<string, 'QuestionId'>;

/**
 * Answer ID - unique identifier for an answer
 */
export type AnswerId = Brand<string, 'AnswerId'>;

/**
 * Type guard functions for branded types
 */
export const MemberId = {
  create: (id: string): MemberId => id as MemberId,
  isValid: (id: string): boolean => id.length > 0,
};

export const TeamId = {
  create: (id: string): TeamId => id.toLowerCase().trim() as TeamId,
  isValid: (id: string): boolean => /^[a-z][a-z0-9-]*$/.test(id.toLowerCase().trim()),
};

export const QuestionId = {
  create: (id: string): QuestionId => id as QuestionId,
  isValid: (id: string): boolean => id.length > 0,
};

export const AnswerId = {
  create: (id: string): AnswerId => id as AnswerId,
  isValid: (id: string): boolean => id.length > 0,
};
