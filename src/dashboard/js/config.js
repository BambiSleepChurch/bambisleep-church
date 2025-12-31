/**
 * BambiSleep™ Church MCP Control Tower
 * Dashboard Configuration
 */

// Detect environment
export const isDev = window.location.hostname === 'localhost';

// Default API port for development
const DEFAULT_API_PORT = 8080;

// Common ports to probe for API server in dev mode
const API_PORTS_TO_TRY = [8080, 3001, 8081, 3000];

/**
 * Get API port - from sessionStorage or default
 */
export function getApiPort() {
  if (!isDev) {
    return window.location.port || (window.location.protocol === 'https:' ? '443' : '80');
  }
  return sessionStorage.getItem('apiPort') || DEFAULT_API_PORT;
}

/**
 * Set API port in sessionStorage
 */
export function setApiPort(port) {
  sessionStorage.setItem('apiPort', port);
  console.log(`✅ API port set to ${port}`);
}

/**
 * Discover API port by probing common ports
 * @returns {Promise<number|null>} Discovered port or null
 */
export async function discoverApiPort() {
  // Check if already discovered
  const cached = sessionStorage.getItem('apiPort');
  if (cached) {
    // Verify it still works
    try {
      const response = await fetch(`http://localhost:${cached}/api/health`, { 
        method: 'GET',
        signal: AbortSignal.timeout(2000)
      });
      if (response.ok) {
        console.log(`✅ Using cached API port ${cached}`);
        return parseInt(cached);
      }
    } catch {
      // Cached port no longer valid
      sessionStorage.removeItem('apiPort');
    }
  }

  // Probe ports
  for (const port of API_PORTS_TO_TRY) {
    try {
      const response = await fetch(`http://localhost:${port}/api/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(1000)
      });
      if (response.ok) {
        setApiPort(port);
        return port;
      }
    } catch {
      // Port not responding, try next
    }
  }

  console.warn('⚠️ Could not discover API port, using default:', DEFAULT_API_PORT);
  setApiPort(DEFAULT_API_PORT);
  return DEFAULT_API_PORT;
}

/**
 * Get API base URL (dynamic getter)
 */
export function getApiBase() {
  if (!isDev) return '/api';
  const port = getApiPort();
  return `http://localhost:${port}/api`;
}

/**
 * Get WebSocket URL (dynamic getter)
 */
export function getWsUrl() {
  if (!isDev) return `ws://${window.location.host}/ws`;
  const port = getApiPort();
  return `ws://localhost:${port}/ws`;
}

// Legacy exports for backward compatibility (will use default port initially)
export const API_BASE = isDev ? `http://localhost:${DEFAULT_API_PORT}/api` : '/api';
export const WS_URL = isDev ? `ws://localhost:${DEFAULT_API_PORT}/ws` : `ws://${window.location.host}/ws`;

// WebSocket Configuration
export const WS_CONFIG = {
  maxReconnectAttempts: 5,
  reconnectDelay: 3000,
  heartbeatInterval: 30000,
};

// Polling Configuration (fallback when WebSocket fails)
export const POLLING_CONFIG = {
  interval: 30000, // 30 seconds
};

// Toast Configuration
export const TOAST_CONFIG = {
  defaultDuration: 4000,
  animationDuration: 300,
};

// Server Icons
export const SERVER_ICONS = {
  filesystem: '🗂️',
  git: '🔀',
  github: '🐙',
  puppeteer: '🎭',
  fetch: '🌐',
  sqlite: '💾',
  memory: '🧠',
  'sequential-thinking': '🔗',
  thinking: '💭',
  mongodb: '🍃',
  stripe: '💳',
  huggingface: '🤗',
  clarity: '📊',
  storage: '📁',
  default: '⚙️',
};

// Status Icons
export const STATUS_ICONS = {
  running: '●',
  stopped: '○',
  starting: '◐',
  error: '✕',
  default: '?',
};

// Toast Icons
export const TOAST_ICONS = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

// Keyboard Shortcuts
export const SHORTCUTS = [
  { keys: ['Ctrl', 'R'], action: 'Refresh servers' },
  { keys: ['Ctrl', 'K'], action: 'Focus search' },
  { keys: ['Escape'], action: 'Close modal/clear search' },
  { keys: ['1-9'], action: 'Toggle server #' },
  { keys: ['?'], action: 'Show this help' },
];
