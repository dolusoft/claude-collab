#!/usr/bin/env node

/**
 * Hub Server entry point
 * This is the main entry point for the WebSocket Hub server
 * @module hub-main
 */

import { HubServer } from './infrastructure/websocket/hub-server.js';
import { config } from './config/index.js';

const args = process.argv.slice(2);

function parseArgs(): { host: string; port: number } {
  let host = config.hub.host;
  let port = config.hub.port;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];
    if (arg === '--host' && nextArg) {
      host = nextArg;
      i++;
    } else if (arg === '--port' && nextArg) {
      port = parseInt(nextArg, 10);
      i++;
    } else if (arg === '-h' || arg === '--help') {
      console.log(`
Claude Collab Hub Server

Usage:
  hub-main [options]

Options:
  --host <host>   Host to bind to (default: ${config.hub.host})
  --port <port>   Port to listen on (default: ${config.hub.port})
  -h, --help      Show this help message
`);
      process.exit(0);
    }
  }

  return { host, port };
}

async function main(): Promise<void> {
  const { host, port } = parseArgs();

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
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
