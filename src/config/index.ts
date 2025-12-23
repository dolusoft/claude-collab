/**
 * Configuration module
 * @module config
 */

/**
 * Application configuration
 */
export const config = {
  /**
   * WebSocket Hub configuration
   */
  hub: {
    /**
     * Default port for the Hub server
     */
    port: parseInt(process.env['CLAUDE_COLLAB_PORT'] ?? '9999', 10),

    /**
     * Host to bind the Hub server to
     */
    host: process.env['CLAUDE_COLLAB_HOST'] ?? 'localhost',

    /**
     * Heartbeat interval in milliseconds
     */
    heartbeatInterval: 30000,

    /**
     * Client timeout in milliseconds (no heartbeat received)
     */
    clientTimeout: 60000,
  },

  /**
   * Communication configuration
   */
  communication: {
    /**
     * Default timeout for waiting for an answer (in milliseconds)
     */
    defaultTimeout: 30000,

    /**
     * Maximum message content length
     */
    maxMessageLength: 50000,
  },

  /**
   * Auto-start configuration
   */
  autoStart: {
    /**
     * Whether to auto-start the hub if not running
     */
    enabled: true,

    /**
     * Maximum retries when connecting to hub
     */
    maxRetries: 3,

    /**
     * Delay between retries in milliseconds
     */
    retryDelay: 1000,
  },
} as const;

export type Config = typeof config;
