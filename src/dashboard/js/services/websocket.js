/**
 * BambiSleep™ Church MCP Control Tower
 * WebSocket Service - Real-time connection management
 */

import { addActivity } from '../components/ActivityFeed.js';
import { showToast } from '../components/Toast.js';
import { processRenderCommand, WorkspaceAPI } from '../components/AgentWorkspace.js';
import { WS_CONFIG, getWsUrl } from '../config.js';
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
    const wsUrl = getWsUrl();
    ws = new WebSocket(wsUrl);
    
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
      
      // Phase 6 - Render messages for Agent Workspace
      case 'render':
      case 'RENDER':
        if (message.component && message.data) {
          processRenderCommand({
            type: message.component,
            data: message.data,
            options: message.options || {}
          });
          addActivity('render:component', `Rendered ${message.component}`, { level: 'info' });
        }
        break;
        
      case 'render:card':
      case 'RENDER_CARD':
        processRenderCommand({ type: 'card', data: message.data, options: message.options });
        break;
        
      case 'render:table':
      case 'RENDER_TABLE':
        processRenderCommand({ type: 'table', data: message.data, options: message.options });
        break;
        
      case 'render:form':
      case 'RENDER_FORM':
        processRenderCommand({ type: 'form', data: message.data, options: message.options });
        break;
        
      case 'render:alert':
      case 'RENDER_ALERT':
        processRenderCommand({ type: 'alert', data: message.data, options: message.options });
        break;
        
      case 'render:progress':
      case 'RENDER_PROGRESS':
        processRenderCommand({ type: 'progress', data: message.data, options: message.options });
        break;
        
      case 'render:list':
      case 'RENDER_LIST':
        processRenderCommand({ type: 'list', data: message.data, options: message.options });
        break;
        
      case 'render:code':
      case 'RENDER_CODE':
        processRenderCommand({ type: 'code', data: message.data, options: message.options });
        break;
        
      case 'render:wizard':
      case 'RENDER_WIZARD':
        processRenderCommand({ type: 'wizard', data: message.data, options: message.options });
        addActivity('render:wizard', 'Rendered wizard', { level: 'info' });
        break;
        
      case 'render:clear':
      case 'RENDER_CLEAR':
        if (WorkspaceAPI) {
          WorkspaceAPI.clearWorkspace();
          addActivity('render:clear', 'Workspace cleared', { level: 'info' });
        }
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
