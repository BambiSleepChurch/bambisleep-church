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
import { clarityHandlers } from './clarity.js';
import { fetchHandlers } from './fetch.js';
import { githubHandlers } from './github.js';
import { huggingfaceHandlers } from './huggingface.js';
import { getLmStudioClient } from './lmstudio.js';
import { memoryHandlers } from './memory/graph.js';
import { mongoHandlers } from './mongodb.js';
import { thinkingHandlers } from './sequential-thinking.js';
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
 * Available tools that the agent can call
 */
const AGENT_TOOLS = {
  // Memory MCP - Knowledge Graph
  memory_read_graph: {
    name: 'memory_read_graph',
    description: 'Read the entire knowledge graph from memory storage',
    parameters: {},
    handler: () => memoryHandlers.readGraph(),
  },
  memory_search: {
    name: 'memory_search',
    description: 'Search the knowledge graph for nodes matching a query',
    parameters: { query: 'string - the search query' },
    handler: (args) => memoryHandlers.searchNodes(args.query),
  },
  memory_create_entities: {
    name: 'memory_create_entities',
    description: 'Create new entities in the knowledge graph',
    parameters: { entities: 'array - entities to create with name, entityType, observations' },
    handler: (args) => memoryHandlers.createEntities(args.entities),
  },
  memory_create_relations: {
    name: 'memory_create_relations',
    description: 'Create relations between entities in the knowledge graph',
    parameters: { relations: 'array - relations with from, to, relationType' },
    handler: (args) => memoryHandlers.createRelations(args.relations),
  },

  // GitHub MCP
  github_get_user: {
    name: 'github_get_user',
    description: 'Get authenticated GitHub user information',
    parameters: {},
    handler: () => githubHandlers.getUser(),
  },
  github_list_repos: {
    name: 'github_list_repos',
    description: 'List repositories for the authenticated user',
    parameters: { per_page: 'number - results per page', page: 'number - page number' },
    handler: (args) => githubHandlers.listRepos(args),
  },
  github_get_repo: {
    name: 'github_get_repo',
    description: 'Get details about a specific repository',
    parameters: { owner: 'string - repo owner', repo: 'string - repo name' },
    handler: (args) => githubHandlers.getRepo(args.owner, args.repo),
  },
  github_search_code: {
    name: 'github_search_code',
    description: 'Search for code across GitHub repositories',
    parameters: { query: 'string - search query' },
    handler: (args) => githubHandlers.searchCode(args.query),
  },

  // MongoDB MCP
  mongodb_connect: {
    name: 'mongodb_connect',
    description: 'Connect to MongoDB database',
    parameters: { database: 'string - database name' },
    handler: (args) => mongoHandlers.connect(args.database),
  },
  mongodb_list_collections: {
    name: 'mongodb_list_collections',
    description: 'List all collections in the connected database',
    parameters: {},
    handler: () => mongoHandlers.listCollections(),
  },
  mongodb_find: {
    name: 'mongodb_find',
    description: 'Find documents in a collection',
    parameters: { collection: 'string', query: 'object - MongoDB query', limit: 'number' },
    handler: (args) => mongoHandlers.find(args.collection, args.query, args.limit),
  },
  mongodb_insert: {
    name: 'mongodb_insert',
    description: 'Insert a document into a collection',
    parameters: { collection: 'string', document: 'object - document to insert' },
    handler: (args) => mongoHandlers.insertOne(args.collection, args.document),
  },

  // Stripe MCP
  stripe_list_customers: {
    name: 'stripe_list_customers',
    description: 'List Stripe customers',
    parameters: { limit: 'number - max results', email: 'string - filter by email' },
    handler: (args) => stripeHandlers.listCustomers(args),
  },
  stripe_get_balance: {
    name: 'stripe_get_balance',
    description: 'Get Stripe account balance',
    parameters: {},
    handler: () => stripeHandlers.getBalance(),
  },
  stripe_create_customer: {
    name: 'stripe_create_customer',
    description: 'Create a new Stripe customer',
    parameters: { email: 'string', name: 'string' },
    handler: (args) => stripeHandlers.createCustomer(args),
  },

  // HuggingFace MCP
  huggingface_search_models: {
    name: 'huggingface_search_models',
    description: 'Search for ML models on HuggingFace Hub',
    parameters: { query: 'string', limit: 'number', task: 'string - model task type' },
    handler: (args) => huggingfaceHandlers.searchModels(args),
  },
  huggingface_search_datasets: {
    name: 'huggingface_search_datasets',
    description: 'Search for datasets on HuggingFace Hub',
    parameters: { query: 'string', limit: 'number' },
    handler: (args) => huggingfaceHandlers.searchDatasets(args),
  },
  huggingface_inference: {
    name: 'huggingface_inference',
    description: 'Run inference on a HuggingFace model',
    parameters: { model: 'string - model ID', inputs: 'string or object - model inputs' },
    handler: (args) => huggingfaceHandlers.inference(args.model, args.inputs),
  },

  // Storage MCP
  storage_list_files: {
    name: 'storage_list_files',
    description: 'List files in storage',
    parameters: { folder: 'string - folder path' },
    handler: (args) => storageHandlers.listFiles(args.folder),
  },
  storage_upload: {
    name: 'storage_upload',
    description: 'Upload a file to storage',
    parameters: { filename: 'string', content: 'string', folder: 'string' },
    handler: (args) => storageHandlers.uploadFile(args.filename, args.content, args.folder),
  },
  storage_get_url: {
    name: 'storage_get_url',
    description: 'Get URL for a stored file',
    parameters: { filename: 'string' },
    handler: (args) => storageHandlers.getFileUrl(args.filename),
  },

  // Clarity Analytics
  clarity_track_event: {
    name: 'clarity_track_event',
    description: 'Track a custom analytics event',
    parameters: { eventName: 'string', data: 'object - event data' },
    handler: (args) => clarityHandlers.event(args.eventName, args.data),
  },
  clarity_get_dashboard: {
    name: 'clarity_get_dashboard',
    description: 'Get analytics dashboard data',
    parameters: {},
    handler: () => clarityHandlers.getDashboardData(),
  },

  // Sequential Thinking
  thinking_start: {
    name: 'thinking_start',
    description: 'Start a sequential thinking chain for complex reasoning',
    parameters: { thought: 'string - initial thought', totalThoughts: 'number - estimated total' },
    handler: (args) => thinkingHandlers.think(args),
  },
  thinking_continue: {
    name: 'thinking_continue',
    description: 'Continue a thinking chain with next thought',
    parameters: { sessionId: 'string', thought: 'string', thoughtNumber: 'number' },
    handler: (args) => thinkingHandlers.continueChain(args),
  },

  // Fetch MCP
  fetch_url: {
    name: 'fetch_url',
    description: 'Fetch content from a URL',
    parameters: { url: 'string - URL to fetch' },
    handler: (args) => fetchHandlers.get(args.url),
  },
  fetch_to_markdown: {
    name: 'fetch_to_markdown',
    description: 'Fetch a URL and convert to markdown',
    parameters: { url: 'string - URL to fetch' },
    handler: (args) => fetchHandlers.convertToMarkdown(args.url),
  },
};

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
  #tools = AGENT_TOOLS;
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
    logger.info('🌸 Agent Orchestrator initialized');
  }

  get conversations() { return this.#conversations; }
  get tools() { return this.#tools; }
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
        if (parsed.tool && this.#tools[parsed.tool]) {
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
    const tool = this.#tools[toolName];
    if (!tool) {
      throw new Error(`Unknown tool: ${toolName}`);
    }

    logger.info(`Executing tool: ${toolName}`, { args });
    
    try {
      const result = await tool.handler(args);
      
      // Update stats
      this.#stats.totalToolCalls++;
      this.#stats.toolUsage[toolName] = (this.#stats.toolUsage[toolName] || 0) + 1;
      this.#stats.lastActivity = new Date().toISOString();
      
      emitEvent('toolExecuted', { tool: toolName, args, result });
      
      return {
        success: true,
        tool: toolName,
        result,
      };
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
    return Object.entries(this.#tools).map(([name, tool]) => ({
      name,
      description: tool.description,
      parameters: tool.parameters,
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
