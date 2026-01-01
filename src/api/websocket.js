/**
 * BambiSleep™ Church MCP Control Tower
 * WebSocket Server for Real-time Updates
 */

import { WebSocketServer } from 'ws';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('websocket');

/**
 * Connected clients
 */
const clients = new Set();

/**
 * Message types for WebSocket communication
 */
export const MessageTypes = {
  // Server events
  SERVER_STATUS: 'server:status',
  SERVER_STARTED: 'server:started',
  SERVER_STOPPED: 'server:stopped',
  SERVER_ERROR: 'server:error',
  SERVER_LOG: 'server:log',
  
  // System events
  HEALTH_UPDATE: 'health:update',
  STATS_UPDATE: 'stats:update',
  
  // Render events (Phase 6 - Agent UI)
  RENDER: 'render',
  RENDER_CARD: 'render:card',
  RENDER_TABLE: 'render:table',
  RENDER_FORM: 'render:form',
  RENDER_ALERT: 'render:alert',
  RENDER_PROGRESS: 'render:progress',
  RENDER_LIST: 'render:list',
  RENDER_CODE: 'render:code',
  RENDER_CLEAR: 'render:clear',
  RENDER_SPIRAL: 'render:spiral',
  RENDER_NOTIFICATION: 'render:notification',
  RENDER_MODAL: 'render:modal',
  
  // Client commands
  SUBSCRIBE: 'subscribe',
  UNSUBSCRIBE: 'unsubscribe',
  PING: 'ping',
  PONG: 'pong',
};

/**
 * Broadcast message to all connected clients
 * @param {Object} message Message to broadcast
 * @param {WebSocket} exclude Client to exclude (optional)
 */
export function broadcast(message, exclude = null) {
  const data = JSON.stringify(message);
  let sent = 0;
  
  for (const client of clients) {
    if (client !== exclude && client.readyState === 1) { // WebSocket.OPEN = 1
      client.send(data);
      sent++;
    }
  }
  
  logger.debug(`Broadcast ${message.type} to ${sent} clients`);
}

/**
 * Send message to specific client
 * @param {WebSocket} client Target client
 * @param {Object} message Message to send
 */
export function sendTo(client, message) {
  if (client.readyState === 1) {
    client.send(JSON.stringify(message));
  }
}

/**
 * Emit server status update
 * @param {Object} server Server object
 */
export function emitServerStatus(server) {
  broadcast({
    type: MessageTypes.SERVER_STATUS,
    timestamp: new Date().toISOString(),
    data: {
      name: server.name,
      status: server.status,
      startedAt: server.startedAt,
      error: server.error,
    },
  });
}

/**
 * Emit server log entry
 * @param {string} serverName Server name
 * @param {string} level Log level
 * @param {string} message Log message
 */
export function emitServerLog(serverName, level, message) {
  broadcast({
    type: MessageTypes.SERVER_LOG,
    timestamp: new Date().toISOString(),
    data: {
      server: serverName,
      level,
      message,
    },
  });
}

/**
 * Emit stats update
 * @param {Object} stats Stats object
 */
export function emitStatsUpdate(stats) {
  broadcast({
    type: MessageTypes.STATS_UPDATE,
    timestamp: new Date().toISOString(),
    data: stats,
  });
}

/**
 * Handle incoming WebSocket message
 * @param {WebSocket} client Client connection
 * @param {string} data Raw message data
 */
function handleMessage(client, data) {
  try {
    const message = JSON.parse(data);
    const messageType = message.type?.toUpperCase();
    
    switch (messageType) {
      case 'PING':
        sendTo(client, { type: 'PONG', timestamp: Date.now() });
        break;
        
      case 'SUBSCRIBE':
        client.subscriptions = client.subscriptions || new Set();
        if (message.channel) {
          client.subscriptions.add(message.channel);
          logger.debug(`Client subscribed to ${message.channel}`);
        }
        if (message.channels && Array.isArray(message.channels)) {
          message.channels.forEach(ch => client.subscriptions.add(ch));
          logger.debug(`Client subscribed to ${message.channels.join(', ')}`);
        }
        break;
        
      case 'UNSUBSCRIBE':
        if (client.subscriptions && message.channel) {
          client.subscriptions.delete(message.channel);
          logger.debug(`Client unsubscribed from ${message.channel}`);
        }
        break;
        
      default:
        logger.warn(`Unknown message type: ${message.type}`);
    }
  } catch (error) {
    logger.error('Failed to parse WebSocket message:', error.message);
  }
}

/**
 * Create WebSocket server attached to HTTP server
 * @param {http.Server} httpServer HTTP server instance
 * @returns {WebSocketServer} WebSocket server instance
 */
export function createWebSocketServer(httpServer) {
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws',
  });

  wss.on('connection', (ws, req) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
    logger.info(`WebSocket client connected from ${ip}`);
    
    clients.add(ws);
    
    // Send welcome message
    sendTo(ws, {
      type: 'connected',
      timestamp: new Date().toISOString(),
      data: {
        message: 'Welcome to BambiSleep™ MCP Control Tower',
        clientCount: clients.size,
      },
    });

    ws.on('message', (data) => handleMessage(ws, data.toString()));

    ws.on('close', () => {
      clients.delete(ws);
      logger.info(`WebSocket client disconnected (${clients.size} remaining)`);
    });

    ws.on('error', (error) => {
      logger.error('WebSocket error:', error.message);
      clients.delete(ws);
    });
  });

  // Heartbeat interval
  const heartbeat = setInterval(() => {
    broadcast({ type: 'heartbeat', timestamp: Date.now() });
  }, 30000);
  heartbeat.unref();

  logger.info('WebSocket server initialized on /ws');
  
  return wss;
}

/**
 * Get WebSocket connection stats
 * @returns {Object} Connection statistics
 */
export function getWebSocketStats() {
  return {
    connectedClients: clients.size,
    clients: Array.from(clients).map((client, i) => ({
      id: i + 1,
      readyState: client.readyState,
      subscriptions: client.subscriptions ? Array.from(client.subscriptions) : [],
    })),
  };
}

export default createWebSocketServer;
