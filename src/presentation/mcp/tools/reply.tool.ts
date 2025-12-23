/**
 * Reply Tool
 * Replies to a pending question
 * @module presentation/mcp/tools/reply
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { HubClient } from '../../../infrastructure/websocket/hub-client.js';
import type { QuestionId } from '../../../shared/types/branded-types.js';

/**
 * Reply tool input schema
 */
const replySchema = {
  questionId: z.string().describe('The ID of the question to reply to (from inbox)'),
  answer: z.string().describe('Your answer to the question (supports markdown)'),
};

/**
 * Registers the reply tool with the MCP server
 */
export function registerReplyTool(server: McpServer, hubClient: HubClient): void {
  server.tool('reply', replySchema, async (args) => {
    const questionId = args.questionId as QuestionId;
    const answer = args.answer;

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

      // Send the reply
      await hubClient.reply(questionId, answer, 'markdown');

      return {
        content: [
          {
            type: 'text',
            text: `Reply sent successfully to question \`${questionId}\`.`,
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [
          {
            type: 'text',
            text: `Failed to send reply: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  });
}
