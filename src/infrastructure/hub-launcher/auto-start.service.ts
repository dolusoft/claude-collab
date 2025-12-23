/**
 * Auto-Start Service
 * Automatically starts the Hub server if not running
 * @module infrastructure/hub-launcher/auto-start
 */

import { spawn, type ChildProcess } from 'child_process';
import { createConnection } from 'net';
import { config } from '../../config/index.js';

/**
 * Auto-start service options
 */
export interface AutoStartOptions {
  host?: string;
  port?: number;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Checks if the Hub server is running
 */
export async function isHubRunning(
  host: string = config.hub.host,
  port: number = config.hub.port
): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({ host, port }, () => {
      socket.end();
      resolve(true);
    });

    socket.on('error', () => {
      resolve(false);
    });

    socket.setTimeout(1000, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

/**
 * Waits for the Hub server to become available
 */
export async function waitForHub(
  host: string = config.hub.host,
  port: number = config.hub.port,
  maxRetries: number = config.autoStart.maxRetries,
  retryDelay: number = config.autoStart.retryDelay
): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    if (await isHubRunning(host, port)) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, retryDelay));
  }
  return false;
}

/**
 * Starts the Hub server as a background process
 */
export function startHubProcess(options: AutoStartOptions = {}): ChildProcess {
  const host = options.host ?? config.hub.host;
  const port = options.port ?? config.hub.port;

  // Start hub-main.js as a detached process
  const hubProcess = spawn(
    process.execPath,
    [
      '--experimental-specifier-resolution=node',
      new URL('../../hub-main.js', import.meta.url).pathname,
      '--host',
      host,
      '--port',
      port.toString(),
    ],
    {
      detached: true,
      stdio: 'ignore',
    }
  );

  hubProcess.unref();
  return hubProcess;
}

/**
 * Ensures the Hub is running, starting it if necessary
 */
export async function ensureHubRunning(options: AutoStartOptions = {}): Promise<boolean> {
  const host = options.host ?? config.hub.host;
  const port = options.port ?? config.hub.port;
  const maxRetries = options.maxRetries ?? config.autoStart.maxRetries;
  const retryDelay = options.retryDelay ?? config.autoStart.retryDelay;

  // Check if already running
  if (await isHubRunning(host, port)) {
    return true;
  }

  // Try to start the hub
  console.log(`Hub not running. Starting hub on ${host}:${port}...`);
  startHubProcess({ host, port });

  // Wait for it to become available
  const isRunning = await waitForHub(host, port, maxRetries, retryDelay);

  if (isRunning) {
    console.log('Hub started successfully');
  } else {
    console.error('Failed to start hub');
  }

  return isRunning;
}
