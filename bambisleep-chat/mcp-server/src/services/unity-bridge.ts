/**
 * 🔮 Unity Bridge - WebSocket Server for Avatar Communication
 * Bidirectional communication between MCP server and Unity avatar
 */

import WebSocket, { WebSocketServer } from 'ws';
import { logger } from '../utils/logger.js';

let wss: WebSocketServer | null = null;
const connectedClients = new Set<WebSocket>();

export interface UnityCommand {
  type: 'emotion' | 'animation' | 'particle' | 'config';
  data: Record<string, any>;
}

export interface UnityEvent {
  type: 'connected' | 'state_change' | 'telemetry' | 'error';
  data: Record<string, any>;
}

/**
 * Start WebSocket server for Unity connections
 */
export function startUnityBridge(port: number): void {
  wss = new WebSocketServer({ port });

  wss.on('listening', () => {
    logger.info(`⚡ Unity WebSocket bridge listening on port ${port}`);
  });

  wss.on('connection', (ws: WebSocket) => {
    logger.info('🎮 Unity client connected');
    connectedClients.add(ws);

    // Send welcome message
    ws.send(
      JSON.stringify({
        type: 'connected',
        data: {
          message: '🌸 Connected to BambiSleep MCP Control Tower',
          timestamp: Date.now(),
        },
      })
    );

    // Handle incoming messages from Unity
    ws.on('message', (data: WebSocket.RawData) => {
      try {
        const message = data.toString();
        const event = JSON.parse(message) as UnityEvent;
        handleUnityEvent(event);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Failed to parse Unity message', { error: errorMessage });
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      logger.info('🎮 Unity client disconnected');
      connectedClients.delete(ws);
    });

    ws.on('error', (error: Error) => {
      logger.error('Unity WebSocket error', { error: error.message });
      connectedClients.delete(ws);
    });
  });

  wss.on('error', (error: Error) => {
    logger.error('WebSocket server error', { error: error.message });
  });
}

/**
 * Send command to Unity avatar
 */
export function sendToUnity(command: UnityCommand): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!wss || connectedClients.size === 0) {
      logger.warn('No Unity clients connected');
      return reject(new Error('No Unity clients connected'));
    }

    const message = JSON.stringify(command);
    let sent = 0;

    connectedClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message, (error?: Error) => {
          if (error) {
            logger.error('Failed to send to Unity client', { error: error.message });
          } else {
            sent++;
          }
        });
      }
    });

    if (sent > 0) {
      logger.debug(`Sent command to ${sent} Unity client(s)`, { command: command.type });
      resolve();
    } else {
      reject(new Error('No clients available to send message'));
    }
  });
}

/**
 * Handle events received from Unity
 */
function handleUnityEvent(event: UnityEvent): void {
  logger.debug('Unity event received', { type: event.type });

  switch (event.type) {
    case 'state_change':
      logger.info('Unity state changed', event.data);
      // Could trigger MCP events or update internal state
      break;

    case 'telemetry':
      logger.debug('Unity telemetry', event.data);
      // Could send to monitoring system
      break;

    case 'error':
      logger.error('Unity reported error', event.data);
      break;

    default:
      logger.warn('Unknown Unity event type', { type: event.type });
  }
}

/**
 * Get connection status
 */
export function getUnityConnectionStatus(): {
  connected: boolean;
  clientCount: number;
} {
  return {
    connected: wss !== null && connectedClients.size > 0,
    clientCount: connectedClients.size,
  };
}
