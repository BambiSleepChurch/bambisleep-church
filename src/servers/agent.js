/**
 * BambiSleep™ Church MCP Control Tower
 * Agentic Orchestrator - Main AI Agent with Tool Calling
 * 
 * Uses tiny models (Qwen2.5-0.5B or similar) for local inference
 * with tool-calling capabilities to interact with all MCP servers.
 */

import { createLogger } from '../utils/logger.js';
import { clarityHandlers } from './clarity.js';
import { fetchHandlers } from './fetch.js';
import { githubHandlers } from './github.js';
import { huggingfaceHandlers } from './huggingface.js';
import { memoryHandlers } from './memory.js';
import { mongoHandlers } from './mongodb.js';
import { thinkingHandlers } from './sequential-thinking.js';
import { storageHandlers } from './storage.js';
import { stripeHandlers } from './stripe.js';

const logger = createLogger('agent');

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
 * System prompt for the agent
 */
const SYSTEM_PROMPT = `You are BambiAgent™, the intelligent orchestrator for the BambiSleep™ Church MCP Control Tower.

You have access to the following tools to interact with various services:

MEMORY (Knowledge Graph):
- memory_read_graph: Read the entire knowledge graph
- memory_search: Search for nodes
- memory_create_entities: Create new entities
- memory_create_relations: Create relations between entities

GITHUB:
- github_get_user: Get authenticated user info
- github_list_repos: List repositories
- github_get_repo: Get repository details
- github_search_code: Search code

DATABASE (MongoDB):
- mongodb_connect: Connect to database
- mongodb_list_collections: List collections
- mongodb_find: Find documents
- mongodb_insert: Insert document

PAYMENTS (Stripe):
- stripe_list_customers: List customers
- stripe_get_balance: Get account balance
- stripe_create_customer: Create customer

ML/AI (HuggingFace):
- huggingface_search_models: Search ML models
- huggingface_search_datasets: Search datasets
- huggingface_inference: Run model inference

STORAGE:
- storage_list_files: List files
- storage_upload: Upload file
- storage_get_url: Get file URL

ANALYTICS (Clarity):
- clarity_track_event: Track custom event
- clarity_get_dashboard: Get analytics dashboard

REASONING:
- thinking_start: Start a reasoning chain
- thinking_continue: Continue reasoning

WEB:
- fetch_url: Fetch URL content
- fetch_to_markdown: Convert URL to markdown

To use a tool, respond with JSON in this format:
{"tool": "tool_name", "args": {"param1": "value1"}}

You can chain multiple tools. After receiving tool results, analyze them and either:
1. Call another tool if needed
2. Provide a final response to the user

Be helpful, precise, and efficient. Track important information in the knowledge graph.`;

/**
 * Agent conversation state
 */
class AgentConversation {
  constructor(id = null) {
    this.id = id || `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.messages = [];
    this.toolCalls = [];
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.metadata = {};
  }

  addMessage(role, content) {
    const message = {
      id: `msg_${Date.now()}`,
      role,
      content,
      timestamp: new Date().toISOString(),
    };
    this.messages.push(message);
    this.updatedAt = new Date();
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
    this.toolCalls.push(toolCall);
    return toolCall;
  }

  getHistory(maxMessages = 20) {
    return this.messages.slice(-maxMessages);
  }

  toJSON() {
    return {
      id: this.id,
      messages: this.messages,
      toolCalls: this.toolCalls,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      metadata: this.metadata,
    };
  }
}

/**
 * Main Agent Orchestrator
 */
class AgentOrchestrator {
  constructor() {
    this.conversations = new Map();
    this.tools = AGENT_TOOLS;
    this.systemPrompt = SYSTEM_PROMPT;
    this.modelConfig = {
      provider: 'huggingface',
      model: 'Qwen/Qwen2.5-0.5B-Instruct',
      fallbackModel: 'Qwen/Qwen2.5-Coder-0.5B-Instruct',
      maxTokens: 2048,
      temperature: 0.7,
    };
    this.stats = {
      totalConversations: 0,
      totalMessages: 0,
      totalToolCalls: 0,
      toolUsage: {},
    };
  }

  /**
   * Create a new conversation
   */
  createConversation() {
    const conversation = new AgentConversation();
    this.conversations.set(conversation.id, conversation);
    this.stats.totalConversations++;
    
    // Add system message
    conversation.addMessage('system', this.systemPrompt);
    
    logger.info(`Created conversation: ${conversation.id}`);
    return conversation;
  }

  /**
   * Get or create conversation
   */
  getConversation(conversationId) {
    if (!conversationId) {
      return this.createConversation();
    }
    
    let conversation = this.conversations.get(conversationId);
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
        if (parsed.tool && this.tools[parsed.tool]) {
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
    const tool = this.tools[toolName];
    if (!tool) {
      throw new Error(`Unknown tool: ${toolName}`);
    }

    logger.info(`Executing tool: ${toolName}`, { args });
    
    try {
      const result = await tool.handler(args);
      
      // Update stats
      this.stats.totalToolCalls++;
      this.stats.toolUsage[toolName] = (this.stats.toolUsage[toolName] || 0) + 1;
      
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
   * Generate response using HuggingFace inference
   */
  async generateResponse(messages, options = {}) {
    const { model = this.modelConfig.model, maxTokens = this.modelConfig.maxTokens } = options;
    
    // Format messages for the model
    const prompt = messages
      .map(m => {
        if (m.role === 'system') return `<|im_start|>system\n${m.content}<|im_end|>`;
        if (m.role === 'user') return `<|im_start|>user\n${m.content}<|im_end|>`;
        if (m.role === 'assistant') return `<|im_start|>assistant\n${m.content}<|im_end|>`;
        if (m.role === 'tool') return `<|im_start|>tool\n${m.content}<|im_end|>`;
        return m.content;
      })
      .join('\n') + '\n<|im_start|>assistant\n';

    try {
      // Use HuggingFace inference
      const response = await huggingfaceHandlers.inference(model, {
        inputs: prompt,
        parameters: {
          max_new_tokens: maxTokens,
          temperature: this.modelConfig.temperature,
          do_sample: true,
          return_full_text: false,
        },
      });

      if (response && response[0]?.generated_text) {
        return response[0].generated_text.trim();
      }
      
      // Fallback response
      return this.generateFallbackResponse(messages);
    } catch (error) {
      logger.error('Model inference failed', error);
      return this.generateFallbackResponse(messages);
    }
  }

  /**
   * Generate fallback response when model is unavailable
   */
  generateFallbackResponse(messages) {
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (!lastUserMessage) {
      return "Hello! I'm BambiAgent™. How can I help you today?";
    }

    const content = lastUserMessage.content.toLowerCase();
    
    // Basic intent detection for fallback
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

    return "I understand you need assistance. Let me check what resources are available. " +
           '{"tool": "memory_read_graph", "args": {}}';
  }

  /**
   * Process a user message and generate response
   */
  async chat(userMessage, conversationId = null, options = {}) {
    const conversation = this.getConversation(conversationId);
    const maxIterations = options.maxIterations || 5;
    
    // Add user message
    conversation.addMessage('user', userMessage);
    this.stats.totalMessages++;
    
    // Track analytics
    clarityHandlers.event('agent:chat', { conversationId: conversation.id });
    
    let iteration = 0;
    let response = '';
    
    while (iteration < maxIterations) {
      iteration++;
      
      // Generate response
      response = await this.generateResponse(conversation.getHistory());
      
      // Check for tool call
      const toolCall = this.parseToolCall(response);
      
      if (toolCall) {
        // Execute tool
        const result = await this.executeTool(toolCall.tool, toolCall.args);
        
        // Add to conversation
        conversation.addMessage('assistant', response);
        conversation.addMessage('tool', JSON.stringify(result, null, 2));
        conversation.addToolCall(toolCall.tool, toolCall.args, result);
        
        // Continue loop to process tool result
        continue;
      }
      
      // No tool call, final response
      conversation.addMessage('assistant', response);
      break;
    }
    
    return {
      conversationId: conversation.id,
      response,
      toolCalls: conversation.toolCalls.slice(-10),
      iteration,
    };
  }

  /**
   * Get available tools info
   */
  getToolsInfo() {
    return Object.entries(this.tools).map(([name, tool]) => ({
      name,
      description: tool.description,
      parameters: tool.parameters,
    }));
  }

  /**
   * Get agent stats
   */
  getStats() {
    return {
      ...this.stats,
      activeConversations: this.conversations.size,
      modelConfig: this.modelConfig,
    };
  }

  /**
   * List conversations
   */
  listConversations(limit = 20) {
    const convs = Array.from(this.conversations.values())
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, limit)
      .map(c => ({
        id: c.id,
        messageCount: c.messages.length,
        toolCallCount: c.toolCalls.length,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      }));
    
    return { conversations: convs, total: this.conversations.size };
  }

  /**
   * Get conversation details
   */
  getConversationDetails(conversationId) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation not found: ${conversationId}`);
    }
    return conversation.toJSON();
  }

  /**
   * Delete conversation
   */
  deleteConversation(conversationId) {
    const deleted = this.conversations.delete(conversationId);
    return { success: deleted, conversationId };
  }

  /**
   * Clear all conversations
   */
  clearConversations() {
    const count = this.conversations.size;
    this.conversations.clear();
    return { success: true, cleared: count };
  }
}

// Singleton instance
const agentOrchestrator = new AgentOrchestrator();

/**
 * Agent handlers for API routes
 */
export const agentHandlers = {
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
  
  // Stats
  getStats: () => agentOrchestrator.getStats(),
  
  // Config
  getConfig: () => agentOrchestrator.modelConfig,
  setConfig: (config) => {
    Object.assign(agentOrchestrator.modelConfig, config);
    return agentOrchestrator.modelConfig;
  },
};

export default agentHandlers;
