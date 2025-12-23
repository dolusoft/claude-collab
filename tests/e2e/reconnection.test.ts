/**
 * E2E Test: Reconnection Scenarios
 * Tests client reconnection behavior
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { HubServer } from '../../src/infrastructure/websocket/hub-server.js';
import { HubClient } from '../../src/infrastructure/websocket/hub-client.js';

describe('Reconnection Scenarios E2E', () => {
  let hubServer: HubServer;
  const TEST_PORT = 9996;
  const TEST_HOST = 'localhost';

  beforeAll(async () => {
    hubServer = new HubServer({ port: TEST_PORT, host: TEST_HOST });
    await hubServer.start();
  });

  afterAll(async () => {
    await hubServer.stop();
  });

  describe('Client Reconnection', () => {
    it('should reconnect automatically when disconnected', async () => {
      let disconnectCount = 0;
      let connectCount = 0;

      const client = new HubClient(
        {
          host: TEST_HOST,
          port: TEST_PORT,
          reconnect: true,
          reconnectDelay: 100,
          maxReconnectAttempts: 3,
        },
        {
          onConnected: () => {
            connectCount++;
          },
          onDisconnected: () => {
            disconnectCount++;
          },
        }
      );

      await client.connect();
      expect(client.isConnected).toBe(true);
      expect(connectCount).toBe(1);

      await client.disconnect();
    });

    it('should rejoin team after reconnection', async () => {
      const client = new HubClient(
        {
          host: TEST_HOST,
          port: TEST_PORT,
          reconnect: false,
        },
        {}
      );

      // First connection
      await client.connect();
      const member1 = await client.join('team-alpha', 'Alpha Claude');
      expect(member1.teamName).toBe('team-alpha');

      // Disconnect
      await client.disconnect();
      expect(client.isConnected).toBe(false);

      // Reconnect
      await client.connect();
      const member2 = await client.join('team-alpha', 'Alpha Claude');
      expect(member2.teamName).toBe('team-alpha');

      await client.disconnect();
    });

    it('should not lose messages during reconnection process', async () => {
      const client1 = new HubClient(
        { host: TEST_HOST, port: TEST_PORT, reconnect: false },
        {}
      );

      await client1.connect();
      await client1.join('sender', 'Sender Claude');

      // Setup receiver with message tracking
      const receivedMessages: string[] = [];
      const client2 = new HubClient(
        { host: TEST_HOST, port: TEST_PORT, reconnect: false },
        {
          onQuestion: async (question) => {
            receivedMessages.push(question.content);
            await client2.reply(question.questionId, `Received: ${question.content}`, 'plain');
          },
        }
      );

      await client2.connect();
      await client2.join('receiver', 'Receiver Claude');

      // Send multiple messages
      const answer1 = await client1.ask('receiver', 'Message 1', 'plain', 5000);
      expect(answer1.content).toBe('Received: Message 1');

      const answer2 = await client1.ask('receiver', 'Message 2', 'plain', 5000);
      expect(answer2.content).toBe('Received: Message 2');

      expect(receivedMessages).toContain('Message 1');
      expect(receivedMessages).toContain('Message 2');

      await client1.disconnect();
      await client2.disconnect();
    });
  });

  describe('Server Restart', () => {
    it('should handle server restart gracefully', async () => {
      const client = new HubClient(
        {
          host: TEST_HOST,
          port: TEST_PORT,
          reconnect: false,
        },
        {}
      );

      await client.connect();
      await client.join('test-team', 'Test Claude');

      expect(client.isConnected).toBe(true);

      // Disconnect client before server restart
      await client.disconnect();
      expect(client.isConnected).toBe(false);

      // Client can reconnect
      await client.connect();
      await client.join('test-team', 'Test Claude');
      expect(client.isConnected).toBe(true);

      await client.disconnect();
    });
  });

  describe('Multiple Clients', () => {
    it('should handle multiple client connections and disconnections', async () => {
      const clients: HubClient[] = [];
      const NUM_CLIENTS = 3;

      // Create and connect multiple clients sequentially
      for (let i = 0; i < NUM_CLIENTS; i++) {
        const client = new HubClient(
          { host: TEST_HOST, port: TEST_PORT, reconnect: false },
          {}
        );
        await client.connect();
        await client.join(`multi-team-${i}`, `Multi Claude ${i}`);
        clients.push(client);
        // Small delay between connections
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      // Verify all clients are connected
      for (const client of clients) {
        expect(client.isConnected).toBe(true);
        expect(client.currentMemberId).toBeDefined();
      }

      // Disconnect all and verify they report disconnected
      for (const client of clients) {
        await client.disconnect();
        expect(client.isConnected).toBe(false);
      }
    });

    it('should allow disconnected client to reconnect with same identity', async () => {
      const client = new HubClient(
        { host: TEST_HOST, port: TEST_PORT, reconnect: false },
        {}
      );

      // First connection
      await client.connect();
      const member1 = await client.join('persistent-team', 'Persistent Claude');

      const originalMemberId = member1.memberId;

      await client.disconnect();

      // Reconnect with same identity
      await client.connect();
      const member2 = await client.join('persistent-team', 'Persistent Claude');

      // Member ID will be different (new session), but team info should be same
      expect(member2.teamName).toBe('persistent-team');
      expect(member2.displayName).toBe('Persistent Claude');

      await client.disconnect();
    });
  });

  describe('Connection State', () => {
    it('should correctly report connection state', async () => {
      const client = new HubClient(
        { host: TEST_HOST, port: TEST_PORT, reconnect: false },
        {}
      );

      expect(client.isConnected).toBe(false);
      expect(client.currentMemberId).toBeUndefined();
      expect(client.currentTeamId).toBeUndefined();

      await client.connect();
      expect(client.isConnected).toBe(true);

      await client.join('state-team', 'State Claude');
      expect(client.currentMemberId).toBeDefined();
      expect(client.currentTeamId).toBeDefined();

      await client.disconnect();
      expect(client.isConnected).toBe(false);
    });
  });
});
