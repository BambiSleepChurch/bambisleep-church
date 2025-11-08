// 🌸 CAG Agent - Context-Augmented Generation Agent
// Dynamically builds and manages context from multiple sources for enhanced generation

const BaseAgent = require("./base-agent");

/**
 * CAGAgent - Context-Augmented Generation with dynamic context management
 * 
 * Features:
 * - Multi-source context aggregation
 * - Real-time context updates
 * - Context prioritization and filtering
 * - Conversation history management
 * - Cross-session context persistence
 * 
 * @extends BaseAgent
 */
class CAGAgent extends BaseAgent {
  constructor(config = {}) {
    super("cag-agent", config);

    this.contextSources = config.contextSources || [];
    this.contextStore = new Map();
    this.conversationHistory = [];
    this.maxContextWindow = config.maxContextWindow || 8000;
    this.maxHistoryItems = config.maxHistoryItems || 50;
    this.contextPriority = config.contextPriority || {
      user: 1.0,
      conversation: 0.9,
      system: 0.8,
      external: 0.7,
      cached: 0.5,
    };

    this.mcpServers = [
      "sequential-thinking",
      "memory",
      "context-manager",
      ...this.mcpServers,
    ];

    this.log("INFO", "🎯 CAG Agent initialized", {
      sources: this.contextSources.length,
      maxWindow: this.maxContextWindow,
    });
  }

  /**
   * Initialize CAG agent and context sources
   */
  async initialize() {
    await super.initialize();

    this.log("INFO", "🔄 Loading context sources...");

    for (const source of this.contextSources) {
      try {
        await this.loadContextSource(source);
        this.log("INFO", `✅ Loaded context: ${source.name}`);
      } catch (error) {
        this.log("ERROR", `🔥 Failed to load ${source.name}: ${error.message}`);
      }
    }

    this.log("INFO", `💎 CAG Agent ready with ${this.contextStore.size} context items`);
  }

  /**
   * Load a context source
   */
  async loadContextSource(source) {
    const { name, type, provider, priority } = source;

    const contextData = await this.fetchContextData(type, provider);

    this.contextStore.set(name, {
      name,
      type,
      priority: priority || this.contextPriority[type] || 0.5,
      data: contextData,
      lastUpdate: Date.now(),
      accessCount: 0,
    });
  }

  /**
   * Fetch context data from provider
   */
  async fetchContextData(type, provider) {
    switch (type) {
      case "user":
        return await this.fetchUserContext(provider);
      case "system":
        return await this.fetchSystemContext(provider);
      case "external":
        return await this.fetchExternalContext(provider);
      case "conversation":
        return this.conversationHistory;
      default:
        return {};
    }
  }

  /**
   * Fetch user-specific context
   */
  async fetchUserContext(provider) {
    // User preferences, history, profile
    return {
      userId: provider.userId,
      preferences: provider.preferences || {},
      history: provider.history || [],
      metadata: provider.metadata || {},
    };
  }

  /**
   * Fetch system context
   */
  async fetchSystemContext(provider) {
    // System state, configurations, policies
    return {
      timestamp: new Date().toISOString(),
      version: provider.version || "1.0.0",
      capabilities: provider.capabilities || [],
      constraints: provider.constraints || {},
    };
  }

  /**
   * Fetch external context (APIs, databases)
   */
  async fetchExternalContext(provider) {
    // External data sources
    this.log("DEBUG", `🌐 Fetching external context: ${provider.source}`);
    
    // Placeholder for actual API calls
    return {
      source: provider.source,
      data: provider.mockData || {},
      fetchedAt: Date.now(),
    };
  }

  /**
   * Add message to conversation history
   */
  addToHistory(role, content, metadata = {}) {
    const historyItem = {
      role,
      content,
      metadata,
      timestamp: Date.now(),
    };

    this.conversationHistory.push(historyItem);

    // Trim history if too long
    if (this.conversationHistory.length > this.maxHistoryItems) {
      this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryItems);
    }

    // Update conversation context
    if (this.contextStore.has("conversation")) {
      const convContext = this.contextStore.get("conversation");
      convContext.data = this.conversationHistory;
      convContext.lastUpdate = Date.now();
    }

    this.log("DEBUG", `💬 Added to history: ${role}`);
  }

  /**
   * Build aggregated context for generation
   */
  async buildContext(query, options = {}) {
    const startTime = Date.now();
    const contextParts = [];
    let totalLength = 0;

    // Sort context sources by priority
    const sortedContexts = Array.from(this.contextStore.values())
      .sort((a, b) => b.priority - a.priority);

    for (const context of sortedContexts) {
      // Skip if excluded in options
      if (options.exclude && options.exclude.includes(context.name)) {
        continue;
      }

      // Format context
      const formatted = this.formatContext(context);
      const estimatedLength = JSON.stringify(formatted).length;

      // Check if adding this context would exceed window
      if (totalLength + estimatedLength > this.maxContextWindow) {
        this.log("DEBUG", `⚠️ Context window limit reached at ${totalLength} chars`);
        break;
      }

      contextParts.push(formatted);
      totalLength += estimatedLength;
      context.accessCount++;
    }

    const duration = Date.now() - startTime;

    this.log("DEBUG", `🎯 Built context in ${duration}ms`, {
      parts: contextParts.length,
      totalLength,
    });

    return {
      parts: contextParts,
      totalLength,
      buildTime: duration,
    };
  }

  /**
   * Format context for inclusion in prompt
   */
  formatContext(context) {
    const { name, type, data, priority } = context;

    return {
      source: name,
      type,
      priority,
      content: this.stringifyContextData(data, type),
    };
  }

  /**
   * Convert context data to string format
   */
  stringifyContextData(data, type) {
    switch (type) {
      case "conversation":
        return this.formatConversationHistory(data);
      case "user":
        return this.formatUserContext(data);
      case "system":
        return this.formatSystemContext(data);
      default:
        return JSON.stringify(data, null, 2);
    }
  }

  /**
   * Format conversation history
   */
  formatConversationHistory(history) {
    if (!Array.isArray(history) || history.length === 0) {
      return "No conversation history";
    }

    return history
      .slice(-10) // Last 10 messages
      .map((item) => `${item.role}: ${item.content}`)
      .join("\n");
  }

  /**
   * Format user context
   */
  formatUserContext(data) {
    return `User ID: ${data.userId}
Preferences: ${JSON.stringify(data.preferences)}
History Items: ${data.history?.length || 0}`;
  }

  /**
   * Format system context
   */
  formatSystemContext(data) {
    return `System Version: ${data.version}
Timestamp: ${data.timestamp}
Capabilities: ${data.capabilities?.join(", ") || "none"}`;
  }

  /**
   * Generate response with augmented context
   */
  async generate(query, options = {}) {
    const startTime = Date.now();

    try {
      // Add query to history
      this.addToHistory("user", query, options.metadata);

      // Build context
      const context = await this.buildContext(query, options);

      // Generate response using MCP
      const response = await this.callMcp("sequential-thinking", {
        query,
        context: context.parts,
        options: {
          temperature: options.temperature || 0.7,
          maxLength: options.maxLength || 1000,
          ...options,
        },
      });

      // Add response to history
      this.addToHistory("assistant", response.data?.text || "No response", {
        contextUsed: context.parts.length,
      });

      const duration = Date.now() - startTime;

      this.log("INFO", `🌸 Generated CAG response in ${duration}ms`, {
        contextParts: context.parts.length,
        contextLength: context.totalLength,
      });

      return {
        query,
        response: response.data,
        context: {
          parts: context.parts.map((p) => ({
            source: p.source,
            type: p.type,
            priority: p.priority,
            length: p.content.length,
          })),
          totalLength: context.totalLength,
        },
        metadata: {
          duration,
          historyLength: this.conversationHistory.length,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.log("ERROR", `🔥 Generation error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update specific context source
   */
  async updateContext(name, newData) {
    if (!this.contextStore.has(name)) {
      this.log("WARN", `⚠️ Context not found: ${name}`);
      return false;
    }

    const context = this.contextStore.get(name);
    context.data = newData;
    context.lastUpdate = Date.now();

    this.log("INFO", `🔄 Updated context: ${name}`);
    return true;
  }

  /**
   * Add new context source dynamically
   */
  async addContextSource(name, type, data, priority = 0.5) {
    this.contextStore.set(name, {
      name,
      type,
      priority,
      data,
      lastUpdate: Date.now(),
      accessCount: 0,
    });

    this.log("INFO", `➕ Added new context source: ${name}`);
  }

  /**
   * Remove context source
   */
  removeContext(name) {
    const removed = this.contextStore.delete(name);
    if (removed) {
      this.log("INFO", `🗑️ Removed context: ${name}`);
    }
    return removed;
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
    if (this.contextStore.has("conversation")) {
      this.contextStore.get("conversation").data = [];
    }
    this.log("INFO", "🗑️ Conversation history cleared");
  }

  /**
   * Get context statistics
   */
  getStats() {
    const contextStats = {};
    for (const [name, context] of this.contextStore.entries()) {
      contextStats[name] = {
        type: context.type,
        priority: context.priority,
        accessCount: context.accessCount,
        lastUpdate: new Date(context.lastUpdate).toISOString(),
        size: JSON.stringify(context.data).length,
      };
    }

    return {
      totalContexts: this.contextStore.size,
      historyLength: this.conversationHistory.length,
      maxWindow: this.maxContextWindow,
      contexts: contextStats,
      metrics: this.getMetrics(),
    };
  }

  /**
   * Export context state for persistence
   */
  exportState() {
    return {
      conversationHistory: this.conversationHistory,
      contextStore: Array.from(this.contextStore.entries()),
      timestamp: Date.now(),
    };
  }

  /**
   * Import context state from previous session
   */
  importState(state) {
    if (state.conversationHistory) {
      this.conversationHistory = state.conversationHistory;
    }

    if (state.contextStore) {
      this.contextStore = new Map(state.contextStore);
    }

    this.log("INFO", "📥 Imported context state", {
      history: this.conversationHistory.length,
      contexts: this.contextStore.size,
    });
  }
}

module.exports = CAGAgent;
