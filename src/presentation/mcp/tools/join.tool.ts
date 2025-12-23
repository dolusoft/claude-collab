/**
 * Join Tool
 * Joins a team channel for collaboration
 * @module presentation/mcp/tools/join
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { HubClient } from '../../../infrastructure/websocket/hub-client.js';

/**
 * Join tool input schema
 */
const joinSchema = {
  team: z.string().describe('Team name to join (e.g., "frontend", "backend", "devops")'),
  displayName: z
    .string()
    .optional()
    .describe('Display name for this terminal (default: team + " Claude")'),
};

/**
 * Registers the join tool with the MCP server
 */
export function registerJoinTool(server: McpServer, hubClient: HubClient): void {
  server.tool('join', joinSchema, async (args) => {
    const teamName = args.team;
    const displayName = args.displayName ?? `${teamName} Claude`;

    try {
      // Ensure connected to hub
      if (!hubClient.isConnected) {
        await hubClient.connect();
      }

      // Join the team
      const member = await hubClient.join(teamName, displayName);

      return {
        content: [
          {
            type: 'text',
            text: `Successfully joined team "${member.teamName}" as "${member.displayName}".\n\nYour member ID: ${member.memberId}\nTeam ID: ${member.teamId}\nStatus: ${member.status}`,
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [
          {
            type: 'text',
            text: `Failed to join team: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  });
}
