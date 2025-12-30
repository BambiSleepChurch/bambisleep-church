/**
 * BambiSleep™ Church MCP Control Tower
 * MCP Server Registry - Manages server lifecycle and status
 */

import { spawn } from 'child_process';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('servers');

/**
 * Server status enumeration
 */
export const ServerStatus = {
  STOPPED: 'stopped',
  STARTING: 'starting',
  RUNNING: 'running',
  ERROR: 'error',
};

/**
 * MCP Server Registry
 * Manages all configured MCP servers
 */
export class ServerRegistry {
  constructor() {
    this.servers = new Map();
    this.processes = new Map();
  }

  /**
   * Register servers from configuration
   * @param {Object} mcpConfig - MCP servers configuration from settings.json
   */
  loadFromConfig(mcpConfig) {
    for (const [name, config] of Object.entries(mcpConfig)) {
      this.servers.set(name, {
        name,
        config,
        status: ServerStatus.STOPPED,
        startedAt: null,
        error: null,
      });
    }
    logger.info(`Loaded ${this.servers.size} MCP servers from config`);
  }

  /**
   * Get all registered servers
   * @returns {Array} Array of server objects
   */
  getAll() {
    return Array.from(this.servers.values());
  }

  /**
   * Get a specific server by name
   * @param {string} name - Server name
   * @returns {Object|undefined} Server object
   */
  get(name) {
    return this.servers.get(name);
  }

  /**
   * Start a specific MCP server
   * @param {string} name - Server name
   * @returns {Promise<boolean>} Success status
   */
  async start(name) {
    const server = this.servers.get(name);
    if (!server) {
      logger.error(`Server not found: ${name}`);
      return false;
    }

    if (server.status === ServerStatus.RUNNING) {
      logger.warn(`Server already running: ${name}`);
      return true;
    }

    try {
      server.status = ServerStatus.STARTING;
      const { command, args = [] } = server.config;

      logger.info(`Starting server: ${name} (${command} ${args.join(' ')})`);

      const proc = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
      });

      this.processes.set(name, proc);

      proc.on('error', (err) => {
        logger.error(`Server ${name} error:`, err.message);
        server.status = ServerStatus.ERROR;
        server.error = err.message;
      });

      proc.on('exit', (code) => {
        logger.info(`Server ${name} exited with code ${code}`);
        server.status = ServerStatus.STOPPED;
        this.processes.delete(name);
      });

      // Give it a moment to start
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (proc.exitCode === null) {
        server.status = ServerStatus.RUNNING;
        server.startedAt = new Date();
        server.error = null;
        logger.info(`Server started: ${name}`);
        return true;
      }

      return false;
    } catch (error) {
      logger.error(`Failed to start ${name}:`, error.message);
      server.status = ServerStatus.ERROR;
      server.error = error.message;
      return false;
    }
  }

  /**
   * Stop a specific MCP server
   * @param {string} name - Server name
   * @returns {boolean} Success status
   */
  stop(name) {
    const proc = this.processes.get(name);
    const server = this.servers.get(name);

    if (!proc || !server) {
      return false;
    }

    logger.info(`Stopping server: ${name}`);
    // Use SIGKILL on Windows for reliable termination
    proc.kill(process.platform === 'win32' ? 'SIGKILL' : 'SIGTERM');
    server.status = ServerStatus.STOPPED;
    this.processes.delete(name);
    return true;
  }

  /**
   * Stop all running servers
   */
  stopAll() {
    logger.info('Stopping all servers...');
    for (const name of this.processes.keys()) {
      this.stop(name);
    }
  }

  /**
   * Get summary statistics
   * @returns {Object} Status counts
   */
  getStats() {
    const stats = {
      total: this.servers.size,
      running: 0,
      stopped: 0,
      error: 0,
    };

    for (const server of this.servers.values()) {
      if (server.status === ServerStatus.RUNNING) stats.running++;
      else if (server.status === ServerStatus.ERROR) stats.error++;
      else stats.stopped++;
    }

    return stats;
  }
}

// Singleton instance
export const registry = new ServerRegistry();
export default registry;
