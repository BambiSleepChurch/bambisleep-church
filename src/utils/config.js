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
    ...defaults,
    mcp: {
      ...defaults.mcp,
      servers: loadMcpServers(),
    },
    env: {
      nodeEnv: process.env.NODE_ENV || 'development',
      isDev: process.env.NODE_ENV !== 'production',
    },
  };
}

export default getConfig;
