/**
 * Team Entity
 * Represents a communication channel for a group of members
 * @module domain/entities/team
 */

import type { TeamId, MemberId } from '../../shared/types/branded-types.js';
import type { Member } from './member.entity.js';

/**
 * Properties required to create a Team
 */
export interface TeamProps {
  readonly id: TeamId;
  readonly name: string;
  readonly createdAt: Date;
}

/**
 * Team entity - a communication channel
 */
export class Team {
  private readonly _id: TeamId;
  private readonly _name: string;
  private readonly _createdAt: Date;
  private readonly _memberIds: Set<MemberId>;

  private constructor(props: TeamProps) {
    this._id = props.id;
    this._name = props.name;
    this._createdAt = props.createdAt;
    this._memberIds = new Set();
  }

  /**
   * Creates a new Team instance
   */
  public static create(props: TeamProps): Team {
    if (!props.name.trim()) {
      throw new Error('Team name cannot be empty');
    }
    return new Team(props);
  }

  /**
   * Reconstitutes a Team from persistence
   */
  public static reconstitute(props: TeamProps & { memberIds: MemberId[] }): Team {
    const team = new Team(props);
    for (const memberId of props.memberIds) {
      team._memberIds.add(memberId);
    }
    return team;
  }

  // Getters
  public get id(): TeamId {
    return this._id;
  }

  public get name(): string {
    return this._name;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get memberIds(): ReadonlySet<MemberId> {
    return this._memberIds;
  }

  public get memberCount(): number {
    return this._memberIds.size;
  }

  public get isEmpty(): boolean {
    return this._memberIds.size === 0;
  }

  // Behaviors
  /**
   * Adds a member to the team
   * @returns true if the member was added, false if already present
   */
  public addMember(memberId: MemberId): boolean {
    if (this._memberIds.has(memberId)) {
      return false;
    }
    this._memberIds.add(memberId);
    return true;
  }

  /**
   * Removes a member from the team
   * @returns true if the member was removed, false if not present
   */
  public removeMember(memberId: MemberId): boolean {
    return this._memberIds.delete(memberId);
  }

  /**
   * Checks if a member is in the team
   */
  public hasMember(memberId: MemberId): boolean {
    return this._memberIds.has(memberId);
  }

  /**
   * Gets all member IDs except the specified one
   * Useful for broadcasting to other team members
   */
  public getOtherMemberIds(excludeMemberId: MemberId): MemberId[] {
    return [...this._memberIds].filter((id) => id !== excludeMemberId);
  }

  /**
   * Converts entity to plain object for serialization
   */
  public toJSON(): TeamProps & { memberIds: MemberId[] } {
    return {
      id: this._id,
      name: this._name,
      createdAt: this._createdAt,
      memberIds: [...this._memberIds],
    };
  }
}
