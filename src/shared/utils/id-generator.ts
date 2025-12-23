/**
 * ID generation utilities
 * @module shared/utils/id-generator
 */

import { v4 as uuidv4 } from 'uuid';
import type { MemberId, TeamId, QuestionId, AnswerId } from '../types/branded-types.js';
import {
  MemberId as MemberIdFactory,
  TeamId as TeamIdFactory,
  QuestionId as QuestionIdFactory,
  AnswerId as AnswerIdFactory,
} from '../types/branded-types.js';

/**
 * Generates a new unique Member ID
 */
export function generateMemberId(): MemberId {
  return MemberIdFactory.create(uuidv4());
}

/**
 * Creates a Team ID from a team name
 */
export function createTeamId(name: string): TeamId {
  return TeamIdFactory.create(name);
}

/**
 * Generates a new unique Question ID
 */
export function generateQuestionId(): QuestionId {
  return QuestionIdFactory.create(`q_${uuidv4()}`);
}

/**
 * Generates a new unique Answer ID
 */
export function generateAnswerId(): AnswerId {
  return AnswerIdFactory.create(`a_${uuidv4()}`);
}
