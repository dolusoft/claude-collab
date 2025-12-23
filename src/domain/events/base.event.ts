/**
 * Base Domain Event
 * @module domain/events/base
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Base interface for all domain events
 */
export interface DomainEvent {
  readonly eventId: string;
  readonly eventType: string;
  readonly timestamp: Date;
  readonly payload: Record<string, unknown>;
}

/**
 * Base class for domain events
 */
export abstract class BaseDomainEvent implements DomainEvent {
  public readonly eventId: string;
  public readonly timestamp: Date;

  constructor() {
    this.eventId = uuidv4();
    this.timestamp = new Date();
  }

  public abstract get eventType(): string;
  public abstract get payload(): Record<string, unknown>;

  /**
   * Converts event to JSON
   */
  public toJSON(): DomainEvent {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      timestamp: this.timestamp,
      payload: this.payload,
    };
  }
}
