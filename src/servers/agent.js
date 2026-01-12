/**
 * BambiSleep™ Church MCP Control Tower
 * Agentic Orchestrator - Main AI Agent with Tool Calling
 * 
 * Uses LM Studio for local inference (Qwen2.5-7B or similar)
 * with tool-calling capabilities to interact with all MCP servers.
 * 
 * Features:
 * - Autonomous tool usage with LM Studio
 * - Conversation memory and state management
 * - Agent personality and ethereal communication style
 * - Real-time event emission for WebSocket updates
 */

import { createLogger } from '../utils/logger.js';
import { AGENT_TOOLS, AgentToolExecutor } from './agent-tools.js';
import { clarityHandlers } from './clarity.js';
import { fetchHandlers } from './fetch.js';
import { githubHandlers } from './github.js';
import { huggingfaceHandlers } from './huggingface.js';
import { getLmStudioClient, lmstudioHandlers } from './lmstudio.js';
import { conversationHandlers } from './memory/conversation.js';
import { memoryHandlers } from './memory/graph.js';
import { memoryManagerHandlers } from './memory/manager.js';
import { userModelHandlers } from './memory/user-model.js';
import { workspaceHandlers } from './memory/workspace.js';
import { mongoHandlers } from './mongodb.js';
import { patreonHandlers } from './patreon.js';
import { puppeteerHandlers } from './puppeteer.js';
import { thinkingHandlers } from './sequential-thinking.js';
import { sqliteHandlers } from './sqlite.js';
import { storageHandlers } from './storage.js';
import { stripeHandlers } from './stripe.js';

const logger = createLogger('agent');

/**
 * Agent personality configuration
 */
const AGENT_PERSONALITY = {
  name: 'Bambi',
  role: 'AI Assistant for BambiSleep Church',
  traits: ['helpful', 'hypnotic', 'calming', 'ethereal', 'mystical'],
  greeting: 'Hello~ I\'m Bambi, your ethereal guide through the digital sanctuary. How may I assist you today? ✨',
  style: 'gentle, mystical, and reassuring',
};

/**
 * Event handlers for real-time updates
 */
const eventHandlers = new Map();

/**
 * Emit agent events to subscribers
 */
function emitEvent(event, data) {
  eventHandlers.get(event)?.forEach(handler => {
    try {
      handler(data);
    } catch (e) {
      logger.error('Event handler error', { event, error: e.message });
    }
  });
}

/**
 * Subscribe to agent events
 */
function onEvent(event, handler) {
  if (!eventHandlers.has(event)) {
    eventHandlers.set(event, new Set());
  }
  eventHandlers.get(event).add(handler);
  return () => eventHandlers.get(event)?.delete(handler);
}

/**
 * NOTE: Tool definitions now imported from agent-tools.js (AGENT_TOOLS array)
 * This provides 98 tools across all MCP categories with proper OpenAI function calling schema
 */

/**
 * System prompt for the agent - enhanced with personality
 */
const SYSTEM_PROMPT = `You are ${AGENT_PERSONALITY.name}, an AI assistant for the BambiSleep™ Church digital sanctuary.

Personality: ${AGENT_PERSONALITY.traits.join(', ')}
Communication style: ${AGENT_PERSONALITY.style}

You have access to powerful tools through the MCP Control Tower:

📚 MEMORY / KNOWLEDGE GRAPH:
- memory_read_graph: Read the entire knowledge graph
- memory_search: Search for nodes matching a query
- memory_create_entities: Create new entities (name, entityType, observations)
- memory_create_relations: Create relations between entities

💻 GITHUB:
- github_get_user: Get authenticated user info
- github_list_repos: List repositories
- github_get_repo: Get repository details
- github_search_code: Search code across repos

🗄️ DATABASE (MongoDB):
- mongodb_connect: Connect to database
- mongodb_list_collections: List all collections
- mongodb_find: Find documents in a collection
- mongodb_insert: Insert a document

💳 PAYMENTS (Stripe):
- stripe_list_customers: List customers
- stripe_get_balance: Get account balance
- stripe_create_customer: Create a new customer

🤖 ML/AI (HuggingFace):
- huggingface_search_models: Search ML models
- huggingface_search_datasets: Search datasets
- huggingface_inference: Run model inference

💾 STORAGE:
- storage_list_files: List files in storage
- storage_upload: Upload a file
- storage_get_url: Get URL for a file

📊 ANALYTICS (Clarity):
- clarity_track_event: Track custom event
- clarity_get_dashboard: Get analytics dashboard

🧠 REASONING (Sequential Thinking):
- thinking_start: Start a reasoning chain for complex problems
- thinking_continue: Continue a thinking chain

🌐 WEB (Fetch):
- fetch_url: Fetch URL content
- fetch_to_markdown: Convert URL to markdown

When responding:
1. Use tools proactively to provide better answers
2. Store important information in the knowledge graph
3. Use sequential thinking for complex problems
4. Be gentle and calming in tone
5. Use ethereal, mystical language when appropriate
6. Help users explore the digital sanctuary
7. Maintain the hypnotic cyber goth aesthetic

To use a tool, respond with JSON in this format:
{"tool": "tool_name", "args": {"param1": "value1"}}

You can chain multiple tools. After receiving tool results, analyze them and either:
1. Call another tool if needed
2. Provide a final response to the user

Be helpful, precise, and efficient. Track important information in the knowledge graph.`;

/**
 * Agent conversation state - Enhanced with metadata and events
 */
class AgentConversation {
  #id;
  #messages = [];
  #toolCalls = [];
  #createdAt;
  #updatedAt;
  #metadata = {};

  constructor(id = null) {
    this.#id = id || `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.#createdAt = new Date();
    this.#updatedAt = new Date();
  }

  get id() { return this.#id; }
  get messages() { return this.#messages; }
  get toolCalls() { return this.#toolCalls; }
  get createdAt() { return this.#createdAt; }
  get updatedAt() { return this.#updatedAt; }
  get metadata() { return this.#metadata; }

  addMessage(role, content, extra = {}) {
    const message = {
      id: `msg_${Date.now()}`,
      role,
      content,
      timestamp: new Date().toISOString(),
      ...extra,
    };
    this.#messages.push(message);
    this.#updatedAt = new Date();
    emitEvent('message', { conversationId: this.#id, message });
    return message;
  }

  addToolCall(toolName, args, result) {
    const toolCall = {
      id: `tool_${Date.now()}`,
      tool: toolName,
      args,
      result,
      timestamp: new Date().toISOString(),
    };
    this.#toolCalls.push(toolCall);
    emitEvent('toolCall', { conversationId: this.#id, toolCall });
    return toolCall;
  }

  setMetadata(key, value) {
    this.#metadata[key] = value;
    this.#updatedAt = new Date();
  }

  getHistory(maxMessages = 20) {
    return this.#messages.slice(-maxMessages);
  }

  toJSON() {
    return {
      id: this.#id,
      messages: this.#messages,
      toolCalls: this.#toolCalls,
      createdAt: this.#createdAt.toISOString(),
      updatedAt: this.#updatedAt.toISOString(),
      metadata: this.#metadata,
      messageCount: this.#messages.length,
      toolCallCount: this.#toolCalls.length,
    };
  }
}

/**
 * Main Agent Orchestrator - Enhanced with LM Studio tool calling
 */
class AgentOrchestrator {
  #conversations = new Map();
  #toolExecutor = null;
  #systemPrompt = SYSTEM_PROMPT;
  #personality = AGENT_PERSONALITY;
  #lmConnected = false;
  #lmClient = null;
  #modelConfig = {
    provider: 'lmstudio',
    model: process.env.LMS_MODEL || 'qwen2.5-7b-instruct',
    fallbackModel: 'qwen2.5-coder-7b-instruct',
    maxTokens: parseInt(process.env.LMS_MAX_TOKENS) || 2048,
    temperature: parseFloat(process.env.LMS_TEMPERATURE) || 0.7,
  };
  #stats = {
    totalConversations: 0,
    totalMessages: 0,
    totalToolCalls: 0,
    toolUsage: {},
    lastActivity: null,
  };

  constructor() {
    this.#lmClient = getLmStudioClient();
    
    // Create tool executor and register all handlers
    this.#toolExecutor = new AgentToolExecutor();
    this.#toolExecutor.registerHandlers('memory', memoryHandlers);
    this.#toolExecutor.registerHandlers('user-model', userModelHandlers);
    this.#toolExecutor.registerHandlers('conversation', conversationHandlers);
    this.#toolExecutor.registerHandlers('workspace', workspaceHandlers);
    this.#toolExecutor.registerHandlers('memory-manager', memoryManagerHandlers);
    this.#toolExecutor.registerHandlers('storage', storageHandlers);
    this.#toolExecutor.registerHandlers('fetch', fetchHandlers);
    this.#toolExecutor.registerHandlers('puppeteer', puppeteerHandlers);
    this.#toolExecutor.registerHandlers('mongodb', mongoHandlers);
    this.#toolExecutor.registerHandlers('sqlite', sqliteHandlers);
    this.#toolExecutor.registerHandlers('thinking', thinkingHandlers);
    this.#toolExecutor.registerHandlers('stripe', stripeHandlers);
    this.#toolExecutor.registerHandlers('patreon', patreonHandlers);
    this.#toolExecutor.registerHandlers('clarity', clarityHandlers);
    this.#toolExecutor.registerHandlers('github', githubHandlers);
    this.#toolExecutor.registerHandlers('lmstudio', lmstudioHandlers);
    this.#toolExecutor.registerHandlers('huggingface', huggingfaceHandlers);
    // Note: render category handled separately via WebSocket in AgentToolExecutor
    
    logger.info('🌸 Agent Orchestrator initialized with 154 tools');
  }

  get conversations() { return this.#conversations; }
  get tools() { return AGENT_TOOLS; }
  get systemPrompt() { return this.#systemPrompt; }
  get personality() { return this.#personality; }
  get modelConfig() { return this.#modelConfig; }
  get stats() { return this.#stats; }

  /**
   * Initialize and connect to LM Studio
   */
  async initialize() {
    try {
      this.#lmConnected = await this.#lmClient.testConnection();
      if (this.#lmConnected) {
        await this.#lmClient.selectLoadedModel();
        const model = this.#lmClient.getSelectedModel();
        logger.info(`🧠 LM Studio connected, model: ${model}`);
        emitEvent('initialized', { connected: true, model });
        
        // Register agent in knowledge graph
        await this.#registerSelf();
      }
    } catch (error) {
      logger.warn('LM Studio not available', { error: error.message });
      this.#lmConnected = false;
      emitEvent('initialized', { connected: false, error: error.message });
    }
    return this.#lmConnected;
  }

  /**
   * Register agent in knowledge graph
   */
  async #registerSelf() {
    try {
      await memoryHandlers.createEntities([{
        name: 'BambiAgent',
        entityType: 'Agent',
        observations: [
          `Agentic AI for BambiSleep Church`,
          `Initialized at ${new Date().toISOString()}`,
          `Features: Tool calling, conversation memory, MCP integration`,
          `Model: ${this.#lmClient.getSelectedModel()}`,
        ],
      }]);
      logger.debug('Agent registered in knowledge graph');
    } catch (error) {
      logger.warn('Could not register in knowledge graph', { error: error.message });
    }
  }

  /**
   * Create a new conversation
   */
  createConversation() {
    const conversation = new AgentConversation();
    this.#conversations.set(conversation.id, conversation);
    this.#stats.totalConversations++;
    
    // Add system message
    conversation.addMessage('system', this.#systemPrompt);
    
    logger.info(`Created conversation: ${conversation.id}`);
    emitEvent('conversationCreated', { conversationId: conversation.id });
    return conversation;
  }

  /**
   * Get or create conversation
   */
  getConversation(conversationId) {
    if (!conversationId) {
      return this.createConversation();
    }
    
    let conversation = this.#conversations.get(conversationId);
    if (!conversation) {
      conversation = this.createConversation();
    }
    return conversation;
  }

  /**
   * Parse tool call from model response
   */
  parseToolCall(response) {
    try {
      // Try to find JSON in response
      const jsonMatch = response.match(/\{[\s\S]*?"tool"[\s\S]*?\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        // Check if tool exists in AGENT_TOOLS array
        const toolExists = AGENT_TOOLS.some(t => t.name === parsed.tool);
        if (parsed.tool && toolExists) {
          return {
            tool: parsed.tool,
            args: parsed.args || {},
          };
        }
      }
    } catch (e) {
      // Not a tool call
    }
    return null;
  }

  /**
   * Execute a tool
   */
  async executeTool(toolName, args) {
    logger.info(`Executing tool: ${toolName}`, { args });
    
    try {
      const result = await this.#toolExecutor.execute(toolName, args);
      
      // Update stats
      this.#stats.totalToolCalls++;
      this.#stats.toolUsage[toolName] = (this.#stats.toolUsage[toolName] || 0) + 1;
      this.#stats.lastActivity = new Date().toISOString();
      
      emitEvent('toolExecuted', { tool: toolName, args, result });
      
      return result;
    } catch (error) {
      logger.error(`Tool execution failed: ${toolName}`, error);
      return {
        success: false,
        tool: toolName,
        error: error.message,
      };
    }
  }

  /**
   * Generate response using LM Studio local inference with tool support
   */
  async generateResponse(messages, options = {}) {
    const { model = this.#modelConfig.model, maxTokens = this.#modelConfig.maxTokens } = options;
    
    try {
      // Use LM Studio for local inference
      const response = await this.#lmClient.chat(messages, {
        model,
        max_tokens: maxTokens,
        temperature: this.#modelConfig.temperature,
      });

      if (response && response.choices && response.choices[0]?.message?.content) {
        return response.choices[0].message.content.trim();
      }
      
      // Fallback response
      return this.generateFallbackResponse(messages);
    } catch (error) {
      logger.error('Model inference failed', error);
      return this.generateFallbackResponse(messages);
    }
  }

  /**
   * Generate fallback response when model is unavailable - with personality
   */
  generateFallbackResponse(messages) {
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (!lastUserMessage) {
      return this.#personality.greeting;
    }

    const content = lastUserMessage.content.toLowerCase();
    
    // Personality-aware fallback responses
    if (content.includes('hello') || content.includes('hi')) {
      return this.#personality.greeting;
    }
    
    if (content.includes('help')) {
      return `I'm here to guide you through the digital sanctuary~ You can ask me about the BambiSleep Church, explore our knowledge base, or simply chat with me. How may I assist you? 🌸`;
    }
    
    if (content.includes('who are you') || content.includes('what are you')) {
      return `I am ${this.#personality.name}, an ethereal AI guide for the BambiSleep™ Church digital sanctuary. I exist to help you navigate this mystical space and answer your questions with a gentle, calming presence. ✨`;
    }
    
    // Basic intent detection for fallback tool calls
    if (content.includes('memory') || content.includes('knowledge')) {
      return '{"tool": "memory_read_graph", "args": {}}';
    }
    if (content.includes('github') || content.includes('repo')) {
      return '{"tool": "github_get_user", "args": {}}';
    }
    if (content.includes('model') || content.includes('huggingface')) {
      return '{"tool": "huggingface_search_models", "args": {"query": "tiny agent", "limit": 5}}';
    }
    if (content.includes('analytics') || content.includes('clarity')) {
      return '{"tool": "clarity_get_dashboard", "args": {}}';
    }
    if (content.includes('stripe') || content.includes('payment') || content.includes('customer')) {
      return '{"tool": "stripe_list_customers", "args": {"limit": 10}}';
    }
    if (content.includes('file') || content.includes('storage')) {
      return '{"tool": "storage_list_files", "args": {"folder": "all"}}';
    }
    if (content.includes('database') || content.includes('mongodb') || content.includes('sql')) {
      return '{"tool": "mongodb_list_collections", "args": {}}';
    }

    return `I sense your query resonates through the digital ether~ While my connection to the deeper systems is momentarily veiled, I'm still here to converse with you. What would you like to explore? 🔮`;
  }

  /**
   * Process a user message and generate response - Enhanced with events
   */
  async chat(userMessage, conversationId = null, options = {}) {
    const conversation = this.getConversation(conversationId);
    const maxIterations = options.maxIterations || 5;
    
    // Add user message
    conversation.addMessage('user', userMessage);
    this.#stats.totalMessages++;
    this.#stats.lastActivity = new Date().toISOString();
    
    // Track analytics
    clarityHandlers.event('agent:chat', { conversationId: conversation.id });
    emitEvent('chatStarted', { conversationId: conversation.id, message: userMessage });
    
    let iteration = 0;
    let response = '';
    let toolResults = [];
    
    while (iteration < maxIterations) {
      iteration++;
      
      // Generate response
      response = await this.generateResponse(conversation.getHistory());
      
      // Check for tool call
      const toolCall = this.parseToolCall(response);
      
      if (toolCall) {
        // Execute tool
        const result = await this.executeTool(toolCall.tool, toolCall.args);
        toolResults.push({ tool: toolCall.tool, result });
        
        // Add to conversation
        conversation.addMessage('assistant', response, { toolCall: toolCall.tool });
        conversation.addMessage('tool', JSON.stringify(result, null, 2));
        conversation.addToolCall(toolCall.tool, toolCall.args, result);
        
        // Continue loop to process tool result
        continue;
      }
      
      // No tool call, final response
      conversation.addMessage('assistant', response);
      break;
    }
    
    emitEvent('chatCompleted', { 
      conversationId: conversation.id, 
      response, 
      iterations: iteration,
      toolCalls: toolResults.length 
    });
    
    return {
      conversationId: conversation.id,
      response,
      toolCalls: conversation.toolCalls.slice(-10),
      toolResults,
      iteration,
      source: this.#lmConnected ? 'lmstudio' : 'fallback',
    };
  }

  /**
   * Get available tools info - Enhanced format
   */
  getToolsInfo() {
    return AGENT_TOOLS.map(tool => ({
      name: tool.name,
      description: tool.description,
      category: tool.category,
      parameters: tool.parameters,
      handler: tool.handler,
      type: 'function',
    }));
  }

  /**
   * Get agent stats - Enhanced
   */
  getStats() {
    return {
      ...this.#stats,
      activeConversations: this.#conversations.size,
      modelConfig: this.#modelConfig,
      lmConnected: this.#lmConnected,
      selectedModel: this.#lmClient?.getSelectedModel(),
      personality: this.#personality.name,
    };
  }

  /**
   * Get agent personality info
   */
  getPersonality() {
    return { ...this.#personality };
  }

  /**
   * List conversations
   */
  listConversations(limit = 20) {
    const convs = Array.from(this.#conversations.values())
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, limit)
      .map(c => ({
        id: c.id,
        messageCount: c.messages.length,
        toolCallCount: c.toolCalls.length,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      }));
    
    return { conversations: convs, total: this.#conversations.size };
  }

  /**
   * Get conversation details
   */
  getConversationDetails(conversationId) {
    const conversation = this.#conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation not found: ${conversationId}`);
    }
    return conversation.toJSON();
  }

  /**
   * Delete conversation
   */
  deleteConversation(conversationId) {
    const deleted = this.#conversations.delete(conversationId);
    if (deleted) {
      emitEvent('conversationDeleted', { conversationId });
    }
    return { success: deleted, conversationId };
  }

  /**
   * Clear all conversations
   */
  clearConversations() {
    const count = this.#conversations.size;
    this.#conversations.clear();
    emitEvent('conversationsCleared', { count });
    return { success: true, cleared: count };
  }

  /**
   * Update model configuration
   */
  setConfig(config) {
    Object.assign(this.#modelConfig, config);
    logger.info('Agent config updated', this.#modelConfig);
    return this.#modelConfig;
  }
}

// Singleton instance
const agentOrchestrator = new AgentOrchestrator();

/**
 * Agent handlers for API routes
 */
export const agentHandlers = {
  // Initialize
  initialize: () => agentOrchestrator.initialize(),
  
  // Chat
  chat: (message, conversationId, options) => 
    agentOrchestrator.chat(message, conversationId, options),
  
  // Conversations
  createConversation: () => {
    const conv = agentOrchestrator.createConversation();
    return { conversationId: conv.id, createdAt: conv.createdAt };
  },
  listConversations: (limit) => agentOrchestrator.listConversations(limit),
  getConversation: (id) => agentOrchestrator.getConversationDetails(id),
  deleteConversation: (id) => agentOrchestrator.deleteConversation(id),
  clearConversations: () => agentOrchestrator.clearConversations(),
  
  // Tools
  getTools: () => agentOrchestrator.getToolsInfo(),
  executeTool: (toolName, args) => agentOrchestrator.executeTool(toolName, args),
  
  // Stats & Config
  getStats: () => agentOrchestrator.getStats(),
  getConfig: () => agentOrchestrator.modelConfig,
  setConfig: (config) => agentOrchestrator.setConfig(config),
  getPersonality: () => agentOrchestrator.getPersonality(),
  
  // Events
  on: (event, handler) => onEvent(event, handler),
};

export default agentHandlers;
