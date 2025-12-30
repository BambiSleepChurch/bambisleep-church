/**
 * BambiSleep™ Church MCP Control Tower
 * API Service - HTTP requests to backend
 */

import { API_BASE } from '../config.js';
import { Actions } from '../state/store.js';

/**
 * Fetch all servers from API
 */
export async function fetchServers() {
  try {
    const response = await fetch(`${API_BASE}/servers`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    
    const data = await response.json();
    Actions.setServers(data.servers);
    Actions.setApiStatus('connected');
    
    return data;
  } catch (error) {
    console.error('Failed to fetch servers:', error);
    Actions.setApiStatus('disconnected');
    return null;
  }
}

/**
 * Start a server
 */
export async function startServer(name) {
  try {
    const response = await fetch(`${API_BASE}/servers/${name}/start`, { 
      method: 'POST' 
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to start server');
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Failed to start server ${name}:`, error);
    throw error;
  }
}

/**
 * Stop a server
 */
export async function stopServer(name) {
  try {
    const response = await fetch(`${API_BASE}/servers/${name}/stop`, { 
      method: 'POST' 
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to stop server');
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Failed to stop server ${name}:`, error);
    throw error;
  }
}

/**
 * Fetch health status
 */
export async function fetchHealth() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    if (!response.ok) throw new Error('Health check failed');
    return await response.json();
  } catch (error) {
    console.error('Health check failed:', error);
    return null;
  }
}

/**
 * Fetch WebSocket stats
 */
export async function fetchWsStats() {
  try {
    const response = await fetch(`${API_BASE}/stats/websocket`);
    if (!response.ok) throw new Error('Failed to fetch WS stats');
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch WS stats:', error);
    return null;
  }
}

/**
 * Fetch rate limit stats
 */
export async function fetchRateLimitStats() {
  try {
    const response = await fetch(`${API_BASE}/stats/rate-limit`);
    if (!response.ok) throw new Error('Failed to fetch rate limit stats');
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch rate limit stats:', error);
    return null;
  }
}
