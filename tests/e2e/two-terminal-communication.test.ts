/**
 * E2E Test: Two Terminal Communication
 * Tests the communication between two Claude Code terminals via Hub
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { HubServer } from '../../src/infrastructure/websocket/hub-server.js';
import { HubClient } from '../../src/infrastructure/websocket/hub-client.js';
import type { QuestionMessage } from '../../src/infrastructure/websocket/message-protocol.js';

describe('Two Terminal Communication E2E', () => {
  let hubServer: HubServer;
  const TEST_PORT = 9998;
  const TEST_HOST = 'localhost';

  beforeAll(async () => {
    hubServer = new HubServer({ port: TEST_PORT, host: TEST_HOST });
    await hubServer.start();
  });

  afterAll(async () => {
    await hubServer.stop();
  });

  describe('Basic Question-Answer Flow', () => {
    let frontendClient: HubClient;
    let backendClient: HubClient;

    beforeEach(async () => {
      frontendClient = new HubClient(
        { host: TEST_HOST, port: TEST_PORT, reconnect: false },
        {}
      );
      backendClient = new HubClient(
        { host: TEST_HOST, port: TEST_PORT, reconnect: false },
        {}
      );
    });

    afterEach(async () => {
      await frontendClient.disconnect();
      await backendClient.disconnect();
    });

    it('should allow two terminals to join different teams', async () => {
      await frontendClient.connect();
      await backendClient.connect();

      const frontendMember = await frontendClient.join('frontend', 'Frontend Claude');
      const backendMember = await backendClient.join('backend', 'Backend Claude');

      expect(frontendMember.teamName).toBe('frontend');
      expect(frontendMember.displayName).toBe('Frontend Claude');
      expect(backendMember.teamName).toBe('backend');
      expect(backendMember.displayName).toBe('Backend Claude');
    });

    it('should deliver question from frontend to backend team', async () => {
      await frontendClient.connect();
      await backendClient.connect();

      await frontendClient.join('frontend', 'Frontend Claude');
      await backendClient.join('backend', 'Backend Claude');

      // Setup listener for incoming question
      const questionReceived = new Promise<QuestionMessage>((resolve) => {
        backendClient = new HubClient(
          { host: TEST_HOST, port: TEST_PORT, reconnect: false },
          {
            onQuestion: (question) => {
              resolve(question);
            },
          }
        );
      });

      // Reconnect backend client with question listener
      await backendClient.connect();
      await backendClient.join('backend', 'Backend Claude');

      // Frontend asks a question
      const askPromise = frontendClient.ask(
        'backend',
        'Why is the SignalR connection dropping?',
        'markdown',
        5000
      );

      // Wait for backend to receive the question
      const receivedQuestion = await questionReceived;
      expect(receivedQuestion.content).toBe('Why is the SignalR connection dropping?');
      expect(receivedQuestion.from.teamName).toBe('frontend');

      // Backend replies
      await backendClient.reply(
        receivedQuestion.questionId,
        'The connection is dropping due to a timeout setting issue.',
        'markdown'
      );

      // Frontend should receive the answer
      const answer = await askPromise;
      expect(answer.content).toBe('The connection is dropping due to a timeout setting issue.');
      expect(answer.from.teamName).toBe('backend');
    });

    it('should support markdown content in questions and answers', async () => {
      await frontendClient.connect();
      await backendClient.connect();

      await frontendClient.join('frontend', 'Frontend Claude');

      const backendWithListener = new HubClient(
        { host: TEST_HOST, port: TEST_PORT, reconnect: false },
        {
          onQuestion: async (question) => {
            // Reply with markdown
            await backendWithListener.reply(
              question.questionId,
              `## Analysis\n\n- Point 1\n- Point 2\n\n\`\`\`typescript\nconsole.log('example');\n\`\`\``,
              'markdown'
            );
          },
        }
      );
      await backendWithListener.connect();
      await backendWithListener.join('backend', 'Backend Claude');

      const markdownQuestion = `# Question\n\nHere is a code snippet:\n\n\`\`\`typescript\nconst x = 1;\n\`\`\``;

      const answer = await frontendClient.ask('backend', markdownQuestion, 'markdown', 5000);

      expect(answer.content).toContain('## Analysis');
      expect(answer.content).toContain('```typescript');
      expect(answer.format).toBe('markdown');

      await backendWithListener.disconnect();
    });

    it('should allow multiple teams to communicate', async () => {
      const team1Client = new HubClient(
        { host: TEST_HOST, port: TEST_PORT, reconnect: false },
        {}
      );
      const team2Client = new HubClient(
        { host: TEST_HOST, port: TEST_PORT, reconnect: false },
        {}
      );
      const team3Client = new HubClient(
        { host: TEST_HOST, port: TEST_PORT, reconnect: false },
        {}
      );

      await team1Client.connect();
      await team2Client.connect();
      await team3Client.connect();

      await team1Client.join('team1', 'Team 1 Claude');
      await team2Client.join('team2', 'Team 2 Claude');
      await team3Client.join('team3', 'Team 3 Claude');

      // Setup auto-reply for team2 and team3
      const team2WithListener = new HubClient(
        { host: TEST_HOST, port: TEST_PORT, reconnect: false },
        {
          onQuestion: async (question) => {
            await team2WithListener.reply(question.questionId, 'Response from Team 2', 'plain');
          },
        }
      );
      await team2WithListener.connect();
      await team2WithListener.join('team2', 'Team 2 Responder');

      const team3WithListener = new HubClient(
        { host: TEST_HOST, port: TEST_PORT, reconnect: false },
        {
          onQuestion: async (question) => {
            await team3WithListener.reply(question.questionId, 'Response from Team 3', 'plain');
          },
        }
      );
      await team3WithListener.connect();
      await team3WithListener.join('team3', 'Team 3 Responder');

      // Team 1 asks Team 2
      const answer2 = await team1Client.ask('team2', 'Question to team 2', 'plain', 5000);
      expect(answer2.content).toBe('Response from Team 2');

      // Team 1 asks Team 3
      const answer3 = await team1Client.ask('team3', 'Question to team 3', 'plain', 5000);
      expect(answer3.content).toBe('Response from Team 3');

      // Cleanup
      await team1Client.disconnect();
      await team2Client.disconnect();
      await team3Client.disconnect();
      await team2WithListener.disconnect();
      await team3WithListener.disconnect();
    });
  });

  describe('Inbox Feature', () => {
    let client1: HubClient;
    let client2: HubClient;

    beforeEach(async () => {
      client1 = new HubClient(
        { host: TEST_HOST, port: TEST_PORT, reconnect: false },
        {}
      );
      client2 = new HubClient(
        { host: TEST_HOST, port: TEST_PORT, reconnect: false },
        {}
      );

      await client1.connect();
      await client2.connect();
    });

    afterEach(async () => {
      await client1.disconnect();
      await client2.disconnect();
    });

    it('should show pending questions in inbox', async () => {
      await client1.join('asker', 'Asker Claude');
      await client2.join('responder', 'Responder Claude');

      // Send a question but don't answer yet
      const askPromise = client1.ask('responder', 'Pending question 1', 'plain', 10000);

      // Small delay to ensure question is delivered
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Check inbox
      const inbox = await client2.getInbox();
      expect(inbox.pendingCount).toBeGreaterThanOrEqual(1);

      const pendingQuestion = inbox.questions.find(
        (q) => q.content === 'Pending question 1'
      );
      expect(pendingQuestion).toBeDefined();
      expect(pendingQuestion?.status).toBe('PENDING');

      // Reply to the question
      if (pendingQuestion) {
        await client2.reply(pendingQuestion.questionId, 'Here is the answer', 'plain');
      }

      // Wait for the answer
      const answer = await askPromise;
      expect(answer.content).toBe('Here is the answer');
    });
  });
});
