/**
 * Ask Tool
 * Asks a question to another team and waits for response
 * @module presentation/mcp/tools/ask
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { HubClient } from '../../../infrastructure/websocket/hub-client.js';
import { config } from '../../../config/index.js';

/**
 * Ask tool input schema
 */
const askSchema = {
  team: z.string().describe('Target team name to ask (e.g., "backend", "frontend")'),
  question: z.string().describe('The question to ask (supports markdown)'),
  timeout: z
    .number()
    .optional()
    .describe(`Timeout in seconds to wait for answer (default: ${config.communication.defaultTimeout / 1000}s)`),
};

/**
 * Registers the ask tool with the MCP server
 */
export function registerAskTool(server: McpServer, hubClient: HubClient): void {
  server.tool('ask', askSchema, async (args) => {
    const targetTeam = args.team;
    const question = args.question;
    const timeoutMs = (args.timeout ?? config.communication.defaultTimeout / 1000) * 1000;

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

      // Ask the question and wait for answer
      const answer = await hubClient.ask(targetTeam, question, 'markdown', timeoutMs);

      return {
        content: [
          {
            type: 'text',
            text: `**Answer from ${answer.from.displayName} (${answer.from.teamName}):**\n\n${answer.content}`,
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('timed out')) {
        return {
          content: [
            {
              type: 'text',
              text: `No response received from team "${targetTeam}" within ${timeoutMs / 1000} seconds. The question has been delivered but no one answered yet.`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: `Failed to ask question: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  });
}
