#!/usr/bin/env node

/**
 * CLI entry point
 * Provides command-line interface for claude-collab
 * @module cli
 */

import { Command } from 'commander';

const program = new Command();

program
  .name('claude-collab')
  .description('Real-time team collaboration between Claude Code terminals')
  .version('0.1.0');

program
  .command('hub')
  .description('Hub server commands')
  .command('start')
  .description('Start the Hub server')
  .option('-p, --port <port>', 'Port to listen on', '9999')
  .option('-h, --host <host>', 'Host to bind to', 'localhost')
  .action((options: { port: string; host: string }) => {
    console.log(`Starting Hub server on ${options.host}:${options.port}...`);
    // TODO: Implement in Phase 4
  });

program
  .command('client')
  .description('Start MCP client')
  .requiredOption('-t, --team <team>', 'Team to join (e.g., frontend, backend)')
  .option('--auto-hub', 'Auto-start hub if not running', false)
  .option('-p, --port <port>', 'Hub port to connect to', '9999')
  .option('-h, --host <host>', 'Hub host to connect to', 'localhost')
  .action((options: { team: string; autoHub: boolean; port: string; host: string }) => {
    console.log(`Starting MCP client for team '${options.team}'...`);
    console.log(`Connecting to hub at ${options.host}:${options.port}`);
    if (options.autoHub) {
      console.log('Auto-hub enabled');
    }
    // TODO: Implement in Phase 5
  });

program.parse();
