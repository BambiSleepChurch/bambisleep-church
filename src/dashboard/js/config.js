/**
 * BambiSleep™ Church MCP Control Tower
 * Dashboard Configuration
 */

// Detect environment
const isDev = window.location.hostname === 'localhost';

// API Configuration
export const API_BASE = isDev 
  ? 'http://localhost:8080/api' 
  : '/api';

export const WS_URL = isDev 
  ? 'ws://localhost:8080/ws' 
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
