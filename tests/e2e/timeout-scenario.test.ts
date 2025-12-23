/**
 * E2E Test: Timeout Scenarios
 * Tests timeout behavior when questions are not answered in time
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { HubServer } from '../../src/infrastructure/websocket/hub-server.js';
import { HubClient } from '../../src/infrastructure/websocket/hub-client.js';

describe('Timeout Scenarios E2E', () => {
  let hubServer: HubServer;
  const TEST_PORT = 9997;
  const TEST_HOST = 'localhost';

  beforeAll(async () => {
    hubServer = new HubServer({ port: TEST_PORT, host: TEST_HOST });
    await hubServer.start();
  });

  afterAll(async () => {
    await hubServer.stop();
  });

  describe('Question Timeout', () => {
    let askerClient: HubClient;
    let receiverClient: HubClient;

    beforeEach(async () => {
      askerClient = new HubClient(
        { host: TEST_HOST, port: TEST_PORT, reconnect: false },
        {}
      );
      receiverClient = new HubClient(
        { host: TEST_HOST, port: TEST_PORT, reconnect: false },
        {}
      );
    });

    afterEach(async () => {
      await askerClient.disconnect();
      await receiverClient.disconnect();
    });

    it('should timeout when no response is received within timeout period', async () => {
      await askerClient.connect();
      await receiverClient.connect();

      await askerClient.join('asker', 'Asker Claude');
      await receiverClient.join('receiver', 'Receiver Claude');

      // Ask with very short timeout (500ms)
      const startTime = Date.now();

      await expect(
        askerClient.ask('receiver', 'This will timeout', 'plain', 500)
      ).rejects.toThrow('Request timed out');

      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeGreaterThanOrEqual(500);
      expect(elapsed).toBeLessThan(1000); // Should not wait much longer than timeout
    });

    it('should not timeout when response comes before timeout', async () => {
      await askerClient.connect();

      // Setup receiver with auto-reply
      const receiverWithReply = new HubClient(
        { host: TEST_HOST, port: TEST_PORT, reconnect: false },
        {
          onQuestion: async (question) => {
            // Reply after 100ms (before 2000ms timeout)
            await new Promise((resolve) => setTimeout(resolve, 100));
            await receiverWithReply.reply(question.questionId, 'Quick response', 'plain');
          },
        }
      );
      await receiverWithReply.connect();

      await askerClient.join('asker', 'Asker Claude');
      await receiverWithReply.join('receiver', 'Receiver Claude');

      const startTime = Date.now();
      const answer = await askerClient.ask('receiver', 'Quick question', 'plain', 2000);
      const elapsed = Date.now() - startTime;

      expect(answer.content).toBe('Quick response');
      expect(elapsed).toBeLessThan(1000); // Should be much less than 2000ms

      await receiverWithReply.disconnect();
    });

    it('should handle multiple concurrent timeouts independently', async () => {
      await askerClient.connect();
      await receiverClient.connect();

      await askerClient.join('asker', 'Asker Claude');
      await receiverClient.join('receiver', 'Receiver Claude');

      // Send multiple questions with different timeouts
      const results = await Promise.allSettled([
        askerClient.ask('receiver', 'Question 1', 'plain', 300),
        askerClient.ask('receiver', 'Question 2', 'plain', 500),
        askerClient.ask('receiver', 'Question 3', 'plain', 700),
      ]);

      // All should timeout since no one is replying
      expect(results[0].status).toBe('rejected');
      expect(results[1].status).toBe('rejected');
      expect(results[2].status).toBe('rejected');

      if (results[0].status === 'rejected') {
        expect(results[0].reason.message).toBe('Request timed out');
      }
    });
  });

  describe('Connection Timeout', () => {
    it('should timeout when connecting to non-existent server', async () => {
      const client = new HubClient(
        {
          host: 'localhost',
          port: 12345, // Non-existent port
          reconnect: false,
          maxReconnectAttempts: 0,
        },
        {}
      );

      await expect(client.connect()).rejects.toThrow();
    });
  });

  describe('Late Response Handling', () => {
    let client1: HubClient;

    beforeEach(async () => {
      client1 = new HubClient(
        { host: TEST_HOST, port: TEST_PORT, reconnect: false },
        {}
      );
    });

    afterEach(async () => {
      await client1.disconnect();
    });

    it('should handle late responses gracefully', async () => {
      await client1.connect();

      // Setup receiver that replies very slowly
      const slowResponder = new HubClient(
        { host: TEST_HOST, port: TEST_PORT, reconnect: false },
        {
          onQuestion: async (question) => {
            // Reply after timeout has occurred
            await new Promise((resolve) => setTimeout(resolve, 1000));
            await slowResponder.reply(question.questionId, 'Late response', 'plain');
          },
        }
      );
      await slowResponder.connect();

      await client1.join('asker', 'Asker Claude');
      await slowResponder.join('slow-team', 'Slow Claude');

      // Ask with short timeout
      await expect(
        client1.ask('slow-team', 'Question', 'plain', 200)
      ).rejects.toThrow('Request timed out');

      // Wait for slow response to be sent (should not crash)
      await new Promise((resolve) => setTimeout(resolve, 1200));

      await slowResponder.disconnect();
    });
  });
});
