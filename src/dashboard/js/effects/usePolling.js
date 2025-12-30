/**
 * BambiSleep™ Church MCP Control Tower
 * usePolling Effect - Fallback polling when WebSocket unavailable
 */

import { POLLING_CONFIG } from '../config.js';

let pollingInterval = null;

/**
 * Start polling
 * @param {Function} callback - Function to call on each interval
 * @param {number} [interval] - Polling interval in ms
 */
export function startPolling(callback, interval = POLLING_CONFIG.interval) {
  stopPolling();
  
  // Immediate first call
  callback();
  
  // Set interval
  pollingInterval = setInterval(callback, interval);
  
  console.log(`📡 Polling started (every ${interval / 1000}s)`);
}

/**
 * Stop polling
 */
export function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    console.log('📡 Polling stopped');
  }
}

/**
 * Check if polling is active
 */
export function isPolling() {
  return pollingInterval !== null;
}

/**
 * usePolling hook - manages polling lifecycle
 * @param {Function} callback - Function to call on each interval
 * @param {Object} options - Options
 * @returns {Object} Control functions
 */
export function usePolling(callback, options = {}) {
  const { autoStart = false, interval = POLLING_CONFIG.interval } = options;
  
  if (autoStart) {
    startPolling(callback, interval);
  }
  
  return {
    start: () => startPolling(callback, interval),
    stop: stopPolling,
    isActive: isPolling,
  };
}
