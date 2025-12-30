/**
 * BambiSleep™ Church MCP Control Tower
 * Logging utility
 */

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
};

/**
 * Create a logger instance
 * @param {string} namespace - Logger namespace (e.g., 'server', 'api')
 * @returns {Object} Logger instance
 */
export function createLogger(namespace = 'app') {
  const level = LOG_LEVELS[process.env.LOG_LEVEL] ?? LOG_LEVELS.info;

  const format = (lvl, color, message, ...args) => {
    const timestamp = new Date().toISOString();
    const prefix = `${COLORS.gray}${timestamp}${COLORS.reset} ${color}[${lvl.toUpperCase()}]${COLORS.reset} ${COLORS.magenta}${namespace}${COLORS.reset}`;
    return [prefix, message, ...args];
  };

  return {
    error: (message, ...args) => {
      if (level >= LOG_LEVELS.error) {
        console.error(...format('error', COLORS.red, message, ...args));
      }
    },
    warn: (message, ...args) => {
      if (level >= LOG_LEVELS.warn) {
        console.warn(...format('warn', COLORS.yellow, message, ...args));
      }
    },
    info: (message, ...args) => {
      if (level >= LOG_LEVELS.info) {
        console.info(...format('info', COLORS.cyan, message, ...args));
      }
    },
    debug: (message, ...args) => {
      if (level >= LOG_LEVELS.debug) {
        console.debug(...format('debug', COLORS.gray, message, ...args));
      }
    },
  };
}

export const logger = createLogger('mcp-tower');
export default logger;
