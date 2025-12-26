/**
 * MCP Server
 * Provides MCP tools for Claude Code integration
 * @module presentation/mcp/server
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { HubClient } from '../../infrastructure/websocket/hub-client.js';
import { registerJoinTool } from './tools/join.tool.js';
import { registerAskTool } from './tools/ask.tool.js';
import { registerInboxTool } from './tools/inbox.tool.js';
import { registerReplyTool } from './tools/reply.tool.js';

/**
 * MCP Server options
 */
export interface McpServerOptions {
  hubClient: HubClient;
}

/**
 * Creates and configures the MCP server with all tools
 */
export function createMcpServer(options: McpServerOptions): McpServer {
  const { hubClient } = options;

  const server = new McpServer(
    {
      name: 'claude-collab',
      version: '0.1.2',
    },
    {
      capabilities: {
        resources: {
          subscribe: true,
          listChanged: true,
        },
      },
    }
  );

  // Register all tools
  registerJoinTool(server, hubClient);
  registerAskTool(server, hubClient);
  registerInboxTool(server, hubClient);
  registerReplyTool(server, hubClient);

  // Register resource handlers
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: [
        {
          uri: 'inbox://questions',
          name: 'Pending Questions',
          description: 'Your inbox of pending questions from other teams',
          mimeType: 'application/json',
        },
      ],
    };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    if (request.params.uri === 'inbox://questions') {
      try {
        const inbox = await hubClient.getInbox();
        return {
          contents: [
            {
              uri: 'inbox://questions',
              mimeType: 'application/json',
              text: JSON.stringify(inbox, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to read inbox: ${errorMessage}`);
      }
    }

    throw new Error(`Unknown resource URI: ${request.params.uri}`);
  });

  return server;
}

/**
 * Starts the MCP server with stdio transport and sets up notifications
 */
export async function startMcpServer(options: McpServerOptions): Promise<void> {
  const { hubClient } = options;
  const server = createMcpServer(options);
  const transport = new StdioServerTransport();

  await server.connect(transport);

  // Setup notification when questions arrive
  hubClient.events.onQuestion = async (question) => {
    // Send resource updated notification to Claude
    await server.notification({
      method: 'notifications/resources/updated',
      params: {
        uri: 'inbox://questions',
      },
    });

    // Log for debugging
    console.error(`[📬 New Question] From: ${question.from.displayName}`);
    console.error(`[💡 Tip] Check your inbox with: inbox()`);
  };
}
