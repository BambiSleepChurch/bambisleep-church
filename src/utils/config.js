/**
 * BambiSleep™ Church MCP Control Tower
 * Configuration loader
 */

import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..', '..');

/**
 * Default configuration
 */
const defaults = {
  dashboard: {
    port: 3000,
    host: '0.0.0.0',
  },
  api: {
    port: 8080,
    host: '0.0.0.0',
  },
  mcp: {
    configPath: join(ROOT_DIR, '.vscode', 'settings.json'),
  },
};

/**
 * Strip JSONC to valid JSON
 * Handles comments and trailing commas
 */
function stripJsonc(content) {
  let result = '';
  let i = 0;
  let inString = false;
  let escaped = false;

  while (i < content.length) {
    const char = content[i];
    const next = content[i + 1];

    if (escaped) {
      result += char;
      escaped = false;
      i++;
      continue;
    }

    if (char === '\\' && inString) {
      result += char;
      escaped = true;
      i++;
      continue;
    }

    if (char === '"' && !escaped) {
      inString = !inString;
      result += char;
      i++;
      continue;
    }

    if (!inString) {
      // Skip single-line comments
      if (char === '/' && next === '/') {
        while (i < content.length && content[i] !== '\n') i++;
        continue;
      }
      // Skip multi-line comments
      if (char === '/' && next === '*') {
        i += 2;
        while (i < content.length && !(content[i] === '*' && content[i + 1] === '/')) i++;
        i += 2;
        continue;
      }
    }

    result += char;
    i++;
  }

  // Remove trailing commas
  return result.replace(/,(\s*[}\]])/g, '$1');
}

/**
 * Load MCP server configuration from VS Code settings
 * @returns {Object} MCP servers configuration
 */
export function loadMcpServers() {
  const configPath = defaults.mcp.configPath;
  
  if (!existsSync(configPath)) {
    console.warn(`MCP config not found at ${configPath}`);
    return {};
  }

  try {
    const content = readFileSync(configPath, 'utf-8');
    const jsonContent = stripJsonc(content);
    const settings = JSON.parse(jsonContent);
    return settings['mcp.servers'] || {};
  } catch (error) {
    console.error('Failed to load MCP config:', error.message);
    return {};
  }
}

/**
 * Get full configuration
 * @returns {Object} Complete configuration object
 */
export function getConfig() {
  return {
    dashboard: {
      port: parseInt(process.env.DASHBOARD_PORT) || defaults.dashboard.port,
      host: process.env.DASHBOARD_HOST || defaults.dashboard.host,
    },
    api: {
      port: parseInt(process.env.API_PORT) || defaults.api.port,
      host: process.env.API_HOST || defaults.api.host,
    },
    mcp: {
      ...defaults.mcp,
      servers: loadMcpServers(),
    },
    database: {
      mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/bambisleep',
      },
      postgres: {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT) || 5432,
        user: process.env.POSTGRES_USER || 'bambisleep',
        password: process.env.POSTGRES_PASSWORD || 'bambisleep',
        database: process.env.POSTGRES_DB || 'bambisleep',
      },
      sqlite: {
        path: process.env.SQLITE_PATH || './data/local.db',
      },
    },
    services: {
      github: { token: process.env.GITHUB_TOKEN || '' },
      stripe: { 
        apiKey: process.env.STRIPE_API_KEY || '',
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
      },
      huggingface: { token: process.env.HUGGINGFACE_TOKEN || '' },
      clarity: { projectId: process.env.CLARITY_PROJECT_ID || '' },
    },
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    },
    security: {
      corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:8080').split(','),
      apiSecretKey: process.env.API_SECRET_KEY || '',
    },
    env: {
      nodeEnv: process.env.NODE_ENV || 'development',
      isDev: process.env.NODE_ENV !== 'production',
      logLevel: process.env.LOG_LEVEL || 'info',
    },
  };
}

export default getConfig;
