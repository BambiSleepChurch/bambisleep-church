/**
 * BambiSleep™ Church MCP Control Tower
 * WebSocket Service - Real-time connection management
 */

import { addActivity } from '../components/ActivityFeed.js';
import { showToast } from '../components/Toast.js';
import { WS_CONFIG, WS_URL } from '../config.js';
import { Actions } from '../state/store.js';

let ws = null;
let reconnectAttempts = 0;
let heartbeatInterval = null;

/**
 * Initialize WebSocket connection
 */
export function initWebSocket() {
  Actions.setWsStatus('connecting');
  
  try {
    ws = new WebSocket(WS_URL);
    
    ws.onopen = handleOpen;
    ws.onmessage = handleMessage;
    ws.onclose = handleClose;
    ws.onerror = handleError;
  } catch (error) {
    console.error('Failed to create WebSocket:', error);
    Actions.setWsStatus('disconnected');
  }
}

/**
 * Handle WebSocket open
 */
function handleOpen() {
  console.log('🔌 WebSocket connected');
  reconnectAttempts = 0;
  Actions.setWsStatus('connected');
  showToast('success', 'Connected', 'Real-time updates enabled');
  addActivity('ws:connected', 'WebSocket connected', { level: 'success' });
  
  // Subscribe to channels
  send({ 
    type: 'SUBSCRIBE', 
    channels: ['servers', 'health'] 
  });
  
  // Start heartbeat
  startHeartbeat();
}

/**
 * Handle incoming messages
 */
function handleMessage(event) {
  try {
    const message = JSON.parse(event.data);
    
    switch (message.type) {
      case 'connected':
        console.log('✅ WebSocket connection confirmed');
        break;
        
      case 'heartbeat':
        // Server heartbeat - connection is healthy
        break;
        
      case 'SERVER_STATUS':
        Actions.updateServer(message.payload);
        break;
        
      case 'SERVER_STARTED':
        Actions.updateServer(message.payload);
        showToast('success', 'Server Started', `${message.payload.name} is now running`);
        addActivity('server:started', `${message.payload.name} started`, { 
          server: message.payload.name, 
          level: 'success' 
        });
        break;
        
      case 'SERVER_STOPPED':
        Actions.updateServer(message.payload);
        showToast('info', 'Server Stopped', `${message.payload.name} has stopped`);
        addActivity('server:stopped', `${message.payload.name} stopped`, { 
          server: message.payload.name, 
          level: 'info' 
        });
        break;
        
      case 'SERVER_ERROR':
        Actions.updateServer(message.payload);
        showToast('error', 'Server Error', `${message.payload.name}: ${message.payload.error}`);
        addActivity('server:error', `${message.payload.name}: ${message.payload.error}`, { 
          server: message.payload.name, 
          level: 'error' 
        });
        break;
        
      case 'SERVER_LOG':
        Actions.appendServerLog(message.payload.server, {
          level: message.payload.level || 'info',
          message: message.payload.message,
          timestamp: new Date()
        });
        break;
        
      case 'HEALTH_UPDATE':
        addActivity('health:update', 'Health check received', { level: 'info' });
        break;
        
      case 'PONG':
        // Heartbeat acknowledged
        break;
        
      default:
        console.log('Unknown WS message type:', message.type);
    }
  } catch (err) {
    console.error('Failed to parse WebSocket message:', err);
  }
}

/**
 * Handle WebSocket close
 */
function handleClose() {
  console.log('🔌 WebSocket disconnected');
  Actions.setWsStatus('disconnected');
  stopHeartbeat();
  
  // Attempt reconnection
  if (reconnectAttempts < WS_CONFIG.maxReconnectAttempts) {
    reconnectAttempts++;
    console.log(`Reconnecting (${reconnectAttempts}/${WS_CONFIG.maxReconnectAttempts})...`);
    setTimeout(initWebSocket, WS_CONFIG.reconnectDelay);
  } else {
    showToast('error', 'Connection Lost', 'Real-time updates unavailable');
  }
}

/**
 * Handle WebSocket error
 */
function handleError(error) {
  console.error('WebSocket error:', error);
  Actions.setWsStatus('disconnected');
}

/**
 * Send message through WebSocket
 */
export function send(data) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

/**
 * Start heartbeat interval
 */
function startHeartbeat() {
  stopHeartbeat();
  heartbeatInterval = setInterval(() => {
    send({ type: 'PING' });
  }, WS_CONFIG.heartbeatInterval);
}

/**
 * Stop heartbeat interval
 */
function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

/**
 * Close WebSocket connection
 */
export function closeWebSocket() {
  stopHeartbeat();
  if (ws) {
    ws.close();
    ws = null;
  }
}

/**
 * Get WebSocket ready state
 */
export function isConnected() {
  return ws && ws.readyState === WebSocket.OPEN;
}
