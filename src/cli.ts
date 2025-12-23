#!/usr/bin/env node

/**
 * CLI entry point
 * Provides command-line interface for claude-collab
 * @module cli
 */

import { Command } from 'commander';
import { HubServer } from './infrastructure/websocket/hub-server.js';
import { HubClient } from './infrastructure/websocket/hub-client.js';
import { startMcpServer } from './presentation/mcp/server.js';
import { ensureHubRunning } from './infrastructure/hub-launcher/auto-start.service.js';
import { config } from './config/index.js';

const program = new Command();

program
  .name('claude-collab')
  .description('Real-time team collaboration between Claude Code terminals')
  .version('0.1.0');

// Hub commands
const hubCmd = program.command('hub').description('Hub server commands');

hubCmd
  .command('start')
  .description('Start the Hub server')
  .option('-p, --port <port>', 'Port to listen on', String(config.hub.port))
  .option('--host <host>', 'Host to bind to', config.hub.host)
  .action(async (options: { port: string; host: string }) => {
    const port = parseInt(options.port, 10);
    const host = options.host;

    const server = new HubServer({ host, port });

    // Handle shutdown signals
    const shutdown = async (): Promise<void> => {
      console.log('\nShutting down hub server...');
      await server.stop();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    try {
      await server.start();
      console.log(`Claude Collab Hub Server running on ${host}:${port}`);
    } catch (error) {
      console.error('Failed to start hub server:', error);
      process.exit(1);
    }
  });

// Client command
program
  .command('client')
  .description('Start MCP client (connects to Claude Code)')
  .option('-t, --team <team>', 'Team to auto-join (e.g., frontend, backend)')
  .option('--auto-hub', 'Auto-start hub if not running', false)
  .option('-p, --port <port>', 'Hub port to connect to', String(config.hub.port))
  .option('--host <host>', 'Hub host to connect to', config.hub.host)
  .action(
    async (options: { team?: string; autoHub: boolean; port: string; host: string }) => {
      const port = parseInt(options.port, 10);
      const host = options.host;

      // Auto-start hub if requested
      if (options.autoHub) {
        const hubRunning = await ensureHubRunning({ host, port });
        if (!hubRunning) {
          console.error('Failed to start hub server. Exiting.');
          process.exit(1);
        }
      }

      // Create hub client
      const hubClient = new HubClient(
        { host, port, reconnect: true },
        {
          onError: (error) => {
            console.error('Hub client error:', error.message);
          },
          onQuestion: (question) => {
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
  );

program.parse();
