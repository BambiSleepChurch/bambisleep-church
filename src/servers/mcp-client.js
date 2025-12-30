/**
 * BambiSleep™ Church MCP Control Tower
 * MCP Tool Client - Invokes MCP server tools via stdio
 */

import { spawn } from 'child_process';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('mcp-client');

/**
 * MCP Tool Client
 * Communicates with MCP servers using JSON-RPC over stdio
 */
export class McpToolClient {
  constructor(serverConfig) {
    this.command = serverConfig.command;
    this.args = serverConfig.args || [];
    this.process = null;
    this.requestId = 0;
    this.pendingRequests = new Map();
  }

  /**
   * Start the MCP server process
   */
  async connect() {
    return new Promise((resolve, reject) => {
      this.process = spawn(this.command, this.args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
      });

      let buffer = '';

      this.process.stdout.on('data', (data) => {
        buffer += data.toString();
        
        // Process complete JSON-RPC messages
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.trim()) {
            try {
              const message = JSON.parse(line);
              this.handleMessage(message);
            } catch (e) {
              logger.debug('Non-JSON output:', line);
            }
          }
        }
      });

      this.process.stderr.on('data', (data) => {
        logger.debug('MCP stderr:', data.toString());
      });

      this.process.on('error', (err) => {
        logger.error('MCP process error:', err.message);
        reject(err);
      });

      this.process.on('spawn', () => {
        logger.info('MCP server connected');
        // Initialize the connection
        this.initialize().then(resolve).catch(reject);
      });
    });
  }

  /**
   * Handle incoming JSON-RPC message
   */
  handleMessage(message) {
    if (message.id !== undefined && this.pendingRequests.has(message.id)) {
      const { resolve, reject } = this.pendingRequests.get(message.id);
      this.pendingRequests.delete(message.id);
      
      if (message.error) {
        reject(new Error(message.error.message || 'MCP error'));
      } else {
        resolve(message.result);
      }
    }
  }

  /**
   * Send JSON-RPC request
   */
  async request(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.requestId;
      const message = {
        jsonrpc: '2.0',
        id,
        method,
        params,
      };

      this.pendingRequests.set(id, { resolve, reject });
      
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error('MCP request timeout'));
      }, 30000);

      this.pendingRequests.set(id, {
        resolve: (result) => {
          clearTimeout(timeout);
          resolve(result);
        },
        reject: (err) => {
          clearTimeout(timeout);
          reject(err);
        },
      });

      this.process.stdin.write(JSON.stringify(message) + '\n');
    });
  }

  /**
   * Initialize MCP connection
   */
  async initialize() {
    return this.request('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'BambiSleep MCP Control Tower',
        version: '1.0.0',
      },
    });
  }

  /**
   * List available tools
   */
  async listTools() {
    return this.request('tools/list');
  }

  /**
   * Call a tool
   */
  async callTool(name, args = {}) {
    return this.request('tools/call', { name, arguments: args });
  }

  /**
   * Disconnect from MCP server
   */
  disconnect() {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }
}

export default McpToolClient;
