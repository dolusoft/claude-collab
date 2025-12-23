/**
 * Inbox Tool
 * Lists pending questions directed to the current team
 * @module presentation/mcp/tools/inbox
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { HubClient } from '../../../infrastructure/websocket/hub-client.js';

/**
 * Inbox tool input schema (no required parameters)
 */
const inboxSchema = {};

/**
 * Registers the inbox tool with the MCP server
 */
export function registerInboxTool(server: McpServer, hubClient: HubClient): void {
  server.tool('inbox', inboxSchema, async () => {
    try {
      // Check if joined a team
      if (!hubClient.currentTeamId) {
        return {
          content: [
            {
              type: 'text',
              text: 'You must join a team first. Use the "join" tool to join a team.',
            },
          ],
          isError: true,
        };
      }

      // Get inbox
      const inbox = await hubClient.getInbox();

      if (inbox.questions.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: 'No pending questions in your inbox.',
            },
          ],
        };
      }

      // Format questions list
      const questionsList = inbox.questions
        .map((q, i) => {
          const ageSeconds = Math.floor(q.ageMs / 1000);
          const ageStr = ageSeconds < 60 ? `${ageSeconds}s ago` : `${Math.floor(ageSeconds / 60)}m ago`;

          return `### ${i + 1}. Question from ${q.from.displayName} (${q.from.teamName}) - ${ageStr}
**ID:** \`${q.questionId}\`
**Status:** ${q.status}

${q.content}

---`;
        })
        .join('\n\n');

      return {
        content: [
          {
            type: 'text',
            text: `# Inbox (${inbox.pendingCount} pending, ${inbox.totalCount} total)\n\n${questionsList}\n\nUse the "reply" tool with the question ID to answer a question.`,
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [
          {
            type: 'text',
            text: `Failed to get inbox: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  });
}
