/**
 * BambiSleep™ Church MCP Control Tower
 * Dashboard Configuration
 */

// Detect environment
const isDev = window.location.hostname === 'localhost';

// API port - discovered from health endpoint and cached in sessionStorage
// In production uses same host (reverse proxy), in dev requires port discovery
const getApiPort = () => {
  // In production, API runs on same host (reverse proxy handles routing)
  if (!isDev) return window.location.port || (window.location.protocol === 'https:' ? '443' : '80');
  // In development, API port MUST be set via sessionStorage (set by initial health check)
  const port = sessionStorage.getItem('apiPort');
  if (!port) {
    console.warn('API port not discovered yet - will retry after health check');
    return null;
  }
  return port;
};

// API Configuration - will be null until port is discovered in dev mode
const apiPort = getApiPort();
export const API_BASE = isDev 
  ? (apiPort ? `http://localhost:${apiPort}/api` : null)
  : '/api';

export const WS_URL = isDev 
  ? (apiPort ? `ws://localhost:${apiPort}/ws` : null)
  : `ws://${window.location.host}/ws`;

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
