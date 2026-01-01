/**
 * BambiSleep™ Church MCP Control Tower
 * Logging System - Console & File
 *
 * ES2024+ compliant logging with structured JSON file output
 */

import { existsSync } from 'fs';
import { appendFile, mkdir } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOGS_DIR = join(__dirname, '..', '..', 'logs');

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
  neonPink: '\x1b[38;5;199m',
  neonPurple: '\x1b[38;5;135m',
};

const LEVEL_ICONS = {
  error: '💀',
  warn: '⚠️',
  info: '🌸',
  debug: '🔮',
};

/**
 * Write log entry to file
 * @param {Object} entry - Log entry object
 */
async function writeToFile(entry) {
  try {
    if (!existsSync(LOGS_DIR)) {
      await mkdir(LOGS_DIR, { recursive: true });
    }

    const date = new Date().toISOString().split('T')[0];
    const filename = join(LOGS_DIR, `mcp-tower-${date}.log`);
    await appendFile(filename, JSON.stringify(entry) + '\n');
  } catch {
    // Silent fail for file logging - don't break app if disk is full
  }
}

/**
 * Create a logger instance
 * @param {string} namespace - Logger namespace (e.g., 'server', 'api')
 * @returns {Object} Logger instance
 */
export function createLogger(namespace = 'app') {
  const level = LOG_LEVELS[process.env.LOG_LEVEL] ?? LOG_LEVELS.info;
  const enableFileLogging = process.env.LOG_TO_FILE !== 'false';

  const format = (lvl, color, message, ...args) => {
    const timestamp = new Date().toISOString();
    const icon = LEVEL_ICONS[lvl] || '';
    const prefix = `${COLORS.gray}${timestamp}${COLORS.reset} ${icon} ${color}[${lvl.toUpperCase()}]${COLORS.reset} ${COLORS.magenta}${namespace}${COLORS.reset}`;
    return [prefix, message, ...args];
  };

  const log = (lvl, message, data = null) => {
    const numericLevel = LOG_LEVELS[lvl];
    if (numericLevel > level) return;

    const timestamp = new Date().toISOString();
    const color = {
      error: COLORS.red,
      warn: COLORS.yellow,
      info: COLORS.cyan,
      debug: COLORS.gray,
    }[lvl] || COLORS.reset;

    // Console output
    const consoleMethod = {
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug,
    }[lvl] || console.log;

    if (data) {
      consoleMethod(...format(lvl, color, message), data);
    } else {
      consoleMethod(...format(lvl, color, message));
    }

    // File output (JSON structured logs)
    if (enableFileLogging) {
      const entry = {
        timestamp,
        level: lvl,
        namespace,
        message,
        ...(data && { data }),
      };
      writeToFile(entry);
    }
  };

  return {
    error: (message, data) => log('error', message, data),
    warn: (message, data) => log('warn', message, data),
    info: (message, data) => log('info', message, data),
    debug: (message, data) => log('debug', message, data),
  };
}

export const logger = createLogger('mcp-tower');
export default logger;
