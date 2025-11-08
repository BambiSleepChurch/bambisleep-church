/**
 * 📝 Logger Utility
 * Structured logging for BambiSleep MCP server
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVEL = (process.env.LOG_LEVEL as LogLevel) || 'info';

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const COLORS = {
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m',  // Green
  warn: '\x1b[33m',  // Yellow
  error: '\x1b[31m', // Red
  reset: '\x1b[0m',
};

function shouldLog(level: LogLevel): boolean {
  return LEVELS[level] >= LEVELS[LOG_LEVEL];
}

function formatMessage(level: LogLevel, message: string, meta?: Record<string, any>): string {
  const timestamp = new Date().toISOString();
  const color = COLORS[level];
  const reset = COLORS.reset;
  const metaStr = meta ? `\n${JSON.stringify(meta, null, 2)}` : '';

  return `${color}[${timestamp}] [${level.toUpperCase()}]${reset} ${message}${metaStr}`;
}

export const logger = {
  debug(message: string, meta?: Record<string, any>): void {
    if (shouldLog('debug')) {
      console.log(formatMessage('debug', message, meta));
    }
  },

  info(message: string, meta?: Record<string, any>): void {
    if (shouldLog('info')) {
      console.log(formatMessage('info', message, meta));
    }
  },

  warn(message: string, meta?: Record<string, any>): void {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', message, meta));
    }
  },

  error(message: string, meta?: Record<string, any>): void {
    if (shouldLog('error')) {
      console.error(formatMessage('error', message, meta));
    }
  },
};
