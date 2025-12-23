/**
 * MCP Server
 * Provides MCP tools for Claude Code integration
 * @module presentation/mcp/server
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
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
  const server = new McpServer({
    name: 'claude-collab',
    version: '0.1.0',
  });

  // Register all tools
  registerJoinTool(server, options.hubClient);
  registerAskTool(server, options.hubClient);
  registerInboxTool(server, options.hubClient);
  registerReplyTool(server, options.hubClient);

  return server;
}

/**
 * Starts the MCP server with stdio transport
 */
export async function startMcpServer(options: McpServerOptions): Promise<void> {
  const server = createMcpServer(options);
  const transport = new StdioServerTransport();

  await server.connect(transport);
}
