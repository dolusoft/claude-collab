#!/usr/bin/env node

/**
 * MCP Server entry point
 * This is the main entry point for the MCP client that connects to Claude Code
 * @module mcp-main
 */

import { HubClient } from './infrastructure/websocket/hub-client.js';
import { startMcpServer } from './presentation/mcp/server.js';
import { ensureHubRunning } from './infrastructure/hub-launcher/auto-start.service.js';
import { config } from './config/index.js';

const args = process.argv.slice(2);

interface ClientOptions {
  team?: string;
  host: string;
  port: number;
  autoHub: boolean;
}

function parseArgs(): ClientOptions {
  const options: ClientOptions = {
    host: config.hub.host,
    port: config.hub.port,
    autoHub: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    if (arg === '--team' && nextArg) {
      options.team = nextArg;
      i++;
    } else if (arg === '--host' && nextArg) {
      options.host = nextArg;
      i++;
    } else if (arg === '--port' && nextArg) {
      options.port = parseInt(nextArg, 10);
      i++;
    } else if (arg === '--auto-hub') {
      options.autoHub = true;
    } else if (arg === '-h' || arg === '--help') {
      console.error(`
Claude Collab MCP Client

Usage:
  mcp-main [options]

Options:
  --team <team>   Team to auto-join (optional)
  --host <host>   Hub host (default: ${config.hub.host})
  --port <port>   Hub port (default: ${config.hub.port})
  --auto-hub      Auto-start hub if not running
  -h, --help      Show this help message
`);
      process.exit(0);
    }
  }

  return options;
}

async function main(): Promise<void> {
  const options = parseArgs();

  // Auto-start hub if requested
  if (options.autoHub) {
    const hubRunning = await ensureHubRunning({
      host: options.host,
      port: options.port,
    });

    if (!hubRunning) {
      console.error('Failed to start hub server. Exiting.');
      process.exit(1);
    }
  }

  // Create hub client
  const hubClient = new HubClient(
    {
      host: options.host,
      port: options.port,
      reconnect: true,
    },
    {
      onError: (error) => {
        console.error('Hub client error:', error.message);
      },
      onQuestion: (question) => {
        // Questions will be handled by inbox tool
        console.error(`[Question received from ${question.from.displayName}]`);
      },
    }
  );

  // Connect to hub
  try {
    await hubClient.connect();

    // Auto-join team if specified
    if (options.team) {
      await hubClient.join(options.team, `${options.team} Claude`);
      console.error(`Auto-joined team: ${options.team}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to connect to hub: ${errorMessage}`);
    console.error('Make sure the hub server is running or use --auto-hub flag.');
    process.exit(1);
  }

  // Start MCP server
  await startMcpServer({ hubClient });
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
