/**
 * Member Entity
 * Represents a connected Claude Code terminal in the collaboration network
 * @module domain/entities/member
 */

import type { MemberId, TeamId } from '../../shared/types/branded-types.js';

/**
 * Member status enumeration
 */
export enum MemberStatus {
  /** Member is connected and active */
  ONLINE = 'ONLINE',
  /** Member is connected but idle */
  IDLE = 'IDLE',
  /** Member has disconnected */
  OFFLINE = 'OFFLINE',
}

/**
 * Properties required to create a Member
 */
export interface MemberProps {
  readonly id: MemberId;
  readonly teamId: TeamId;
  readonly displayName: string;
  readonly connectedAt: Date;
  readonly status: MemberStatus;
}

/**
 * Member entity - a connected Claude Code terminal
 */
export class Member {
  private readonly _id: MemberId;
  private readonly _teamId: TeamId;
  private readonly _displayName: string;
  private readonly _connectedAt: Date;
  private _status: MemberStatus;
  private _lastActivityAt: Date;

  private constructor(props: MemberProps) {
    this._id = props.id;
    this._teamId = props.teamId;
    this._displayName = props.displayName;
    this._connectedAt = props.connectedAt;
    this._status = props.status;
    this._lastActivityAt = props.connectedAt;
  }

  /**
   * Creates a new Member instance
   */
  public static create(props: MemberProps): Member {
    if (!props.displayName.trim()) {
      throw new Error('Display name cannot be empty');
    }
    return new Member(props);
  }

  /**
   * Reconstitutes a Member from persistence
   */
  public static reconstitute(props: MemberProps & { lastActivityAt: Date }): Member {
    const member = new Member(props);
    member._lastActivityAt = props.lastActivityAt;
    return member;
  }

  // Getters
  public get id(): MemberId {
    return this._id;
  }

  public get teamId(): TeamId {
    return this._teamId;
  }

  public get displayName(): string {
    return this._displayName;
  }

  public get connectedAt(): Date {
    return this._connectedAt;
  }

  public get status(): MemberStatus {
    return this._status;
  }

  public get lastActivityAt(): Date {
    return this._lastActivityAt;
  }

  public get isOnline(): boolean {
    return this._status === MemberStatus.ONLINE || this._status === MemberStatus.IDLE;
  }

  // Behaviors
  /**
   * Marks the member as online
   */
  public goOnline(): void {
    this._status = MemberStatus.ONLINE;
    this._lastActivityAt = new Date();
  }

  /**
   * Marks the member as idle
   */
  public goIdle(): void {
    this._status = MemberStatus.IDLE;
  }

  /**
   * Marks the member as offline
   */
  public goOffline(): void {
    this._status = MemberStatus.OFFLINE;
  }

  /**
   * Records activity from this member
   */
  public recordActivity(): void {
    this._lastActivityAt = new Date();
    if (this._status === MemberStatus.IDLE) {
      this._status = MemberStatus.ONLINE;
    }
  }

  /**
   * Converts entity to plain object for serialization
   */
  public toJSON(): MemberProps & { lastActivityAt: Date } {
    return {
      id: this._id,
      teamId: this._teamId,
      displayName: this._displayName,
      connectedAt: this._connectedAt,
      status: this._status,
      lastActivityAt: this._lastActivityAt,
    };
  }
}
