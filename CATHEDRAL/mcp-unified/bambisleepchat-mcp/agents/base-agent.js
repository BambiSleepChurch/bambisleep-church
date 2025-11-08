// 🌸 Base Agent Class - Foundation for all MCP-powered agents
// Provides common functionality for Reddit moderation agents

const EventEmitter = require("events");

/**
 * BaseAgent - Abstract base class for MCP-powered Reddit agents
 *
 * @extends EventEmitter
 * @example
 * class MyAgent extends BaseAgent {
 *   constructor(config) {
 *     super('my-agent', config);
 *   }
 *
 *   async process(data) {
 *     return await this.callMcp('sequential-thinking', { query: data });
 *   }
 * }
 */
class BaseAgent extends EventEmitter {
  constructor(agentName, config = {}) {
    super();

    this.agentName = agentName;
    this.config = config;
    this.mcpServers = config.mcpServers || [];
    this.isInitialized = false;
    this.metrics = {
      requests: 0,
      successes: 0,
      failures: 0,
      avgResponseTime: 0,
    };

    this.log("INFO", `🌸 Agent initialized: ${agentName}`);
  }

  /**
   * Initialize agent and verify MCP server connections
   */
  async initialize() {
    if (this.isInitialized) {
      this.log("WARN", "⚠️ Agent already initialized");
      return;
    }

    this.log("INFO", `✨ Initializing MCP connections for ${this.agentName}`);

    // Verify each required MCP server is available
    for (const server of this.mcpServers) {
      try {
        await this.verifyMcpServer(server);
        this.log("INFO", `✅ MCP server connected: ${server}`);
      } catch (error) {
        this.log("ERROR", `🔥 Failed to connect to MCP server ${server}: ${error.message}`);
        throw error;
      }
    }

    this.isInitialized = true;
    this.emit("initialized");
    this.log("INFO", `💎 Agent ready: ${this.agentName}`);
  }

  /**
   * Verify MCP server availability
   * @param {string} serverName - Name of MCP server
   */
  async verifyMcpServer(serverName) {
    // Placeholder for actual MCP server verification
    // In production, this would check server health endpoint
    return new Promise((resolve) => setTimeout(resolve, 100));
  }

  /**
   * Call MCP server with request
   * @param {string} serverName - MCP server to call
   * @param {object} request - Request payload
   * @returns {Promise<object>} - Server response
   */
  async callMcp(serverName, request) {
    const startTime = Date.now();

    try {
      this.metrics.requests++;
      this.log("DEBUG", `✨ MCP call: ${serverName}`, request);

      // Placeholder for actual MCP communication
      // In production, this would use MCP protocol
      const response = await this.simulateMcpCall(serverName, request);

      const duration = Date.now() - startTime;
      this.updateMetrics(true, duration);

      this.log("DEBUG", `🌸 MCP response: ${serverName} (${duration}ms)`);
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.updateMetrics(false, duration);

      this.log("ERROR", `🔥 MCP error: ${serverName} - ${error.message}`);
      throw error;
    }
  }

  /**
   * Simulate MCP call (placeholder)
   * Replace with actual MCP protocol implementation
   */
  async simulateMcpCall(serverName, request) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          server: serverName,
          timestamp: new Date().toISOString(),
          data: { processed: true },
        });
      }, Math.random() * 500);
    });
  }

  /**
   * Update agent metrics
   */
  updateMetrics(success, duration) {
    if (success) {
      this.metrics.successes++;
    } else {
      this.metrics.failures++;
    }

    // Update rolling average response time
    const total = this.metrics.successes + this.metrics.failures;
    this.metrics.avgResponseTime = (this.metrics.avgResponseTime * (total - 1) + duration) / total;
  }

  /**
   * Get agent metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.requests > 0 ? this.metrics.successes / this.metrics.requests : 0,
      errorRate: this.metrics.requests > 0 ? this.metrics.failures / this.metrics.requests : 0,
    };
  }

  /**
   * Log message with emoji prefix
   */
  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] [${this.agentName}] ${message}`;

    if (data) {
      console.log(logMessage, data);
    } else {
      console.log(logMessage);
    }

    this.emit("log", { level, message, data, timestamp });
  }

  /**
   * Shutdown agent gracefully
   */
  async shutdown() {
    this.log("INFO", `🦋 Shutting down agent: ${this.agentName}`);
    this.isInitialized = false;
    this.emit("shutdown");
  }
}

module.exports = BaseAgent;
