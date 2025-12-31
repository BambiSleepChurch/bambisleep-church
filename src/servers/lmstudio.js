/**
 * BambiSleep™ Church MCP Control Tower
 * LM Studio Client - OpenAI-Compatible Local Inference
 * 
 * Connects to LM Studio's local server for AI inference.
 * Uses OpenAI-compatible /v1/chat/completions endpoint.
 * 
 * Features:
 * - Chat completions with tool calling
 * - Streaming responses
 * - Vision/image input (requires vision-enabled model like LLaVA)
 * - Embeddings generation
 * - Structured JSON output
 * 
 * @see https://lmstudio.ai/docs/developer/openai-compat
 */

import { createLogger } from '../utils/logger.js';

const logger = createLogger('lmstudio');

/**
 * Default LM Studio configuration
 */
const DEFAULT_CONFIG = {
  host: process.env.LMS_HOST || 'localhost',
  port: parseInt(process.env.LMS_PORT || '1234', 10),
  model: process.env.LMS_MODEL || 'qwen2.5-7b-instruct',
  temperature: parseFloat(process.env.LMS_TEMPERATURE || '0.7'),
  maxTokens: parseInt(process.env.LMS_MAX_TOKENS || '2048', 10),
  timeout: parseInt(process.env.LMS_TIMEOUT || '60000', 10),
};

/**
 * Default models to try loading (in priority order)
 */
const DEFAULT_MODEL_CANDIDATES = [
  'qwen3',
  'qwen2.5',
  'llama',
  'mistral',
  'gemma',
  'phi',
];

/**
 * LM Studio Client for local inference
 * 
 * @example
 * ```javascript
 * const client = new LMStudioClient();
 * await client.testConnection();
 * const response = await client.chat([
 *   { role: 'user', content: 'Hello!' }
 * ]);
 * ```
 */
export class LMStudioClient {
  #baseUrl;
  #model;
  #temperature;
  #maxTokens;
  #timeout;
  #connected = false;
  #selectedModel = null;

  constructor(config = {}) {
    const mergedConfig = { ...DEFAULT_CONFIG, ...config };
    
    this.#baseUrl = `http://${mergedConfig.host}:${mergedConfig.port}/v1`;
    this.#model = mergedConfig.model;
    this.#temperature = mergedConfig.temperature;
    this.#maxTokens = mergedConfig.maxTokens;
    this.#timeout = mergedConfig.timeout;

    logger.info('LM Studio client initialized', { 
      baseUrl: this.#baseUrl,
      model: this.#model 
    });
  }

  /**
   * Get the base URL
   */
  get baseUrl() {
    return this.#baseUrl;
  }

  /**
   * Check if connected
   */
  get isConnected() {
    return this.#connected;
  }

  /**
   * Get selected model
   */
  getSelectedModel() {
    return this.#selectedModel || this.#model;
  }

  /**
   * Test connection to LM Studio server
   * @returns {Promise<boolean>} True if connected
   */
  async testConnection() {
    try {
      const response = await fetch(`${this.#baseUrl}/models`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const data = await response.json();
        this.#connected = true;
        logger.info('LM Studio connection successful', { 
          modelsAvailable: data.data?.length || 0 
        });
        return true;
      }

      this.#connected = false;
      return false;
    } catch (error) {
      logger.warn('LM Studio connection failed', { error: error.message });
      this.#connected = false;
      return false;
    }
  }

  /**
   * List available models from LM Studio
   * @returns {Promise<Array>} List of available models
   */
  async listModels() {
    try {
      const response = await fetch(`${this.#baseUrl}/models`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      logger.error('Failed to list models', { error: error.message });
      throw error;
    }
  }

  /**
   * Select a loaded model (or use the first available)
   * @returns {Promise<string>} Selected model ID
   */
  async selectLoadedModel() {
    try {
      const models = await this.listModels();
      
      if (models.length === 0) {
        throw new Error('No models loaded in LM Studio');
      }

      // Prefer a model matching our configured model name
      const preferred = models.find(m => 
        m.id?.toLowerCase().includes(this.#model.toLowerCase())
      );

      this.#selectedModel = preferred?.id || models[0].id;
      logger.info('Model selected', { model: this.#selectedModel });
      
      return this.#selectedModel;
    } catch (error) {
      logger.error('Failed to select model', { error: error.message });
      throw error;
    }
  }

  /**
   * Send a chat completion request
   * 
   * @param {Array<{role: string, content: string}>} messages - Chat messages
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Chat completion response
   * 
   * @example
   * ```javascript
   * const response = await client.chat([
   *   { role: 'system', content: 'You are a helpful assistant.' },
   *   { role: 'user', content: 'What is 2+2?' }
   * ]);
   * console.log(response.choices[0].message.content);
   * ```
   */
  async chat(messages, options = {}) {
    const model = options.model || this.#selectedModel || this.#model;
    const temperature = options.temperature ?? this.#temperature;
    const maxTokens = options.maxTokens ?? this.#maxTokens;

    const payload = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: false,
      ...options.extra,
    };

    logger.debug('Chat request', { 
      model, 
      messageCount: messages.length,
      temperature 
    });

    try {
      const response = await fetch(`${this.#baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.#timeout),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      this.#connected = true;

      logger.debug('Chat response', { 
        model: data.model,
        tokens: data.usage?.total_tokens 
      });

      return data;
    } catch (error) {
      if (error.name === 'TimeoutError') {
        logger.error('LM Studio request timeout', { timeout: this.#timeout });
        throw new Error('LM Studio request timed out');
      }
      
      logger.error('Chat request failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Send a chat completion request with tools (function calling)
   * 
   * @param {Array<{role: string, content: string}>} messages - Chat messages
   * @param {Array<Object>} tools - Tool definitions
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Chat completion response with potential tool calls
   * 
   * @example
   * ```javascript
   * const tools = [{
   *   type: 'function',
   *   function: {
   *     name: 'get_weather',
   *     description: 'Get the current weather',
   *     parameters: {
   *       type: 'object',
   *       properties: {
   *         location: { type: 'string' }
   *       },
   *       required: ['location']
   *     }
   *   }
   * }];
   * 
   * const response = await client.chatWithTools(messages, tools);
   * if (response.choices[0].message.tool_calls) {
   *   // Handle tool calls
   * }
   * ```
   */
  async chatWithTools(messages, tools, options = {}) {
    const model = options.model || this.#selectedModel || this.#model;
    const temperature = options.temperature ?? this.#temperature;
    const maxTokens = options.maxTokens ?? this.#maxTokens;

    const payload = {
      model,
      messages,
      tools,
      temperature,
      max_tokens: maxTokens,
      stream: false,
      ...options.extra,
    };

    logger.debug('Chat with tools request', { 
      model, 
      messageCount: messages.length,
      toolCount: tools.length 
    });

    try {
      const response = await fetch(`${this.#baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.#timeout),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      this.#connected = true;

      logger.debug('Chat with tools response', { 
        model: data.model,
        finishReason: data.choices?.[0]?.finish_reason,
        hasToolCalls: !!data.choices?.[0]?.message?.tool_calls
      });

      return data;
    } catch (error) {
      logger.error('Chat with tools failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate a streaming chat completion
   * 
   * @param {Array<{role: string, content: string}>} messages - Chat messages
   * @param {Function} onChunk - Callback for each chunk
   * @param {Object} options - Additional options
   * @returns {Promise<string>} Complete response text
   */
  async chatStream(messages, onChunk, options = {}) {
    const model = options.model || this.#selectedModel || this.#model;
    const temperature = options.temperature ?? this.#temperature;
    const maxTokens = options.maxTokens ?? this.#maxTokens;

    const payload = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    };

    logger.debug('Stream chat request', { model, messageCount: messages.length });

    try {
      const response = await fetch(`${this.#baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.#timeout),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullContent += content;
                if (onChunk) onChunk(content, parsed);
              }
            } catch {
              // Skip invalid JSON chunks
            }
          }
        }
      }

      this.#connected = true;
      return fullContent;
    } catch (error) {
      logger.error('Stream chat failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Simple text completion (legacy endpoint)
   * 
   * @param {string} prompt - Text prompt
   * @param {Object} options - Additional options
   * @returns {Promise<string>} Generated text
   */
  async complete(prompt, options = {}) {
    const model = options.model || this.#selectedModel || this.#model;
    const temperature = options.temperature ?? this.#temperature;
    const maxTokens = options.maxTokens ?? this.#maxTokens;

    const payload = {
      model,
      prompt,
      temperature,
      max_tokens: maxTokens,
      stream: false,
    };

    logger.debug('Completion request', { model, promptLength: prompt.length });

    try {
      const response = await fetch(`${this.#baseUrl}/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.#timeout),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      this.#connected = true;

      return data.choices?.[0]?.text || '';
    } catch (error) {
      logger.error('Completion failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate embeddings for text
   * 
   * @param {string|Array<string>} input - Text to embed
   * @param {Object} options - Additional options
   * @returns {Promise<Array>} Embeddings
   */
  async embed(input, options = {}) {
    const model = options.model || 'text-embedding-nomic-embed-text-v1.5';

    const payload = {
      model,
      input: Array.isArray(input) ? input : [input],
    };

    logger.debug('Embedding request', { 
      model, 
      inputCount: Array.isArray(input) ? input.length : 1 
    });

    try {
      const response = await fetch(`${this.#baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.#timeout),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      this.#connected = true;

      return data.data?.map(d => d.embedding) || [];
    } catch (error) {
      logger.error('Embedding failed', { error: error.message });
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 🖼️ VISION / IMAGE INPUT (requires vision-enabled model like LLaVA)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Chat with image input (vision model required)
   * @param {string} text - Text prompt
   * @param {Array<string>} images - Array of base64 encoded images or data URLs
   * @param {Object} [options] - Additional options
   * @returns {Promise<Object>} Chat completion response
   */
  async chatWithImage(text, images, options = {}) {
    const model = options.model || this.#selectedModel || this.#model;

    // Build multimodal content array
    const content = [{ type: 'text', text }];

    // Add each image
    for (const image of images) {
      const imageUrl = image.startsWith('data:')
        ? image
        : `data:image/jpeg;base64,${image}`;
      
      content.push({
        type: 'image_url',
        image_url: { url: imageUrl },
      });
    }

    const messages = [
      ...(options.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
      { role: 'user', content },
    ];

    logger.debug('Vision request', { model, imageCount: images.length });

    return this.chat(messages, { ...options, model });
  }

  // ═══════════════════════════════════════════════════════════════
  // 🔧 STRUCTURED OUTPUT & TOOL EXECUTION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Chat with structured JSON output
   * @param {Array} messages - Chat messages
   * @param {Object} schema - JSON schema for response format
   * @param {Object} [options] - Additional options
   * @returns {Promise<Object>} Parsed JSON response
   */
  async chatStructured(messages, schema, options = {}) {
    const responseFormat = {
      type: 'json_schema',
      json_schema: {
        name: schema.name || 'response',
        strict: true,
        schema: schema.schema || schema,
      },
    };

    const payload = {
      model: options.model || this.#selectedModel || this.#model,
      messages,
      temperature: options.temperature ?? this.#temperature,
      max_tokens: options.maxTokens ?? this.#maxTokens,
      response_format: responseFormat,
    };

    logger.debug('Structured chat request', { model: payload.model });

    try {
      const response = await fetch(`${this.#baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.#timeout),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      try {
        return JSON.parse(content);
      } catch {
        logger.warn('Failed to parse structured response as JSON');
        return { raw: content };
      }
    } catch (error) {
      logger.error('Structured chat failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Execute tool calls and get final response
   * @param {Array} messages - Original messages
   * @param {Array} tools - Tool definitions
   * @param {Object} toolHandlers - Map of tool name to handler function
   * @param {Object} [options] - Additional options
   * @returns {Promise<Object>} Final response after tool execution
   */
  async executeToolLoop(messages, tools, toolHandlers, options = {}) {
    const maxIterations = options.maxIterations || 5;
    let currentMessages = [...messages];
    let iteration = 0;

    while (iteration < maxIterations) {
      const response = await this.chatWithTools(currentMessages, tools, options);
      const message = response.choices?.[0]?.message;
      const toolCalls = message?.tool_calls;

      // If no tool calls, return the final response
      if (!toolCalls || toolCalls.length === 0) {
        return {
          content: message?.content,
          iterations: iteration + 1,
          usage: response.usage,
        };
      }

      // Add assistant message with tool calls
      currentMessages.push({
        role: 'assistant',
        content: message.content,
        tool_calls: toolCalls,
      });

      // Execute each tool call
      for (const toolCall of toolCalls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments || '{}');

        logger.debug(`Executing tool: ${toolName}`, toolArgs);

        let result;
        try {
          if (toolHandlers[toolName]) {
            result = await toolHandlers[toolName](toolArgs);
          } else {
            result = { error: `Unknown tool: ${toolName}` };
          }
        } catch (error) {
          result = { error: error.message };
          logger.error(`Tool ${toolName} failed:`, error.message);
        }

        // Add tool result
        currentMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: typeof result === 'string' ? result : JSON.stringify(result),
        });
      }

      iteration++;
    }

    logger.warn('Max tool iterations reached');
    return {
      content: 'Maximum tool call iterations reached',
      iterations: maxIterations,
      error: 'MAX_ITERATIONS',
    };
  }

  /**
   * Auto-load a model from configured or default candidates
   * @returns {Promise<string|null>} Loaded model ID or null
   */
  async autoLoadModel() {
    // First check if any models are already loaded
    const loadedModels = await this.listModels();
    if (loadedModels.length > 0) {
      // Find one matching our preference
      const targetModel = this.#model;
      const matched = loadedModels.find(m =>
        m.id.toLowerCase().includes(targetModel.toLowerCase())
      );

      if (matched) {
        this.#selectedModel = matched.id;
        logger.info(`Using already loaded model: ${this.#selectedModel}`);
        return this.#selectedModel;
      }

      // Use first available
      this.#selectedModel = loadedModels[0].id;
      logger.info(`Using first available model: ${this.#selectedModel}`);
      return this.#selectedModel;
    }

    // No models loaded - try to JIT load configured model first
    const candidates = [this.#model, ...DEFAULT_MODEL_CANDIDATES];

    for (const candidate of candidates) {
      if (await this.loadModel(candidate)) {
        return this.#selectedModel;
      }
    }

    logger.error('Could not auto-load any model. Please load a model in LM Studio.');
    return null;
  }

  /**
   * Attempt to load a model by making a minimal request (JIT loading)
   * @param {string} modelId - Model identifier to load
   * @returns {Promise<boolean>} True if model loaded successfully
   */
  async loadModel(modelId) {
    logger.info(`Attempting to load model: ${modelId}`);

    try {
      // Make a minimal chat request to trigger JIT loading
      const response = await fetch(`${this.#baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1,
          temperature: 0,
        }),
      });

      if (response.ok) {
        this.#selectedModel = modelId;
        logger.info(`✅ Model loaded successfully: ${modelId}`);
        return true;
      }

      const error = await response.json();
      logger.warn(`Failed to load model ${modelId}:`, error.error?.message);
      return false;
    } catch (error) {
      logger.error(`Error loading model ${modelId}:`, error.message);
      return false;
    }
  }
}

// Singleton instance with lazy initialization
let _instance = null;

/**
 * Get the singleton LM Studio client
 * @param {Object} config - Optional configuration override
 * @returns {LMStudioClient}
 */
export function getLmStudioClient(config = null) {
  if (!_instance || config) {
    _instance = new LMStudioClient(config || {});
  }
  return _instance;
}

/**
 * LM Studio handlers for API routes
 */
export const lmstudioHandlers = {
  /**
   * Test connection to LM Studio
   */
  testConnection: async () => {
    const client = getLmStudioClient();
    const connected = await client.testConnection();
    return { connected, baseUrl: client.baseUrl };
  },

  /**
   * List available models
   */
  listModels: async () => {
    const client = getLmStudioClient();
    const models = await client.listModels();
    return { models, count: models.length };
  },

  /**
   * Chat completion
   */
  chat: async (messages, options = {}) => {
    const client = getLmStudioClient();
    return client.chat(messages, options);
  },

  /**
   * Chat with tools (function calling)
   */
  chatWithTools: async (messages, tools, options = {}) => {
    const client = getLmStudioClient();
    return client.chatWithTools(messages, tools, options);
  },

  /**
   * Chat with image input (vision)
   */
  chatWithImage: async (text, images, options = {}) => {
    const client = getLmStudioClient();
    return client.chatWithImage(text, images, options);
  },

  /**
   * Chat with structured JSON output
   */
  chatStructured: async (messages, schema, options = {}) => {
    const client = getLmStudioClient();
    return client.chatStructured(messages, schema, options);
  },

  /**
   * Stream chat completion
   */
  chatStream: async (messages, onChunk, options = {}) => {
    const client = getLmStudioClient();
    return client.chatStream(messages, onChunk, options);
  },

  /**
   * Execute tool loop until completion
   */
  executeToolLoop: async (messages, tools, toolHandlers, options = {}) => {
    const client = getLmStudioClient();
    return client.executeToolLoop(messages, tools, toolHandlers, options);
  },

  /**
   * Generate embeddings
   */
  embed: async (input, options = {}) => {
    const client = getLmStudioClient();
    return client.embed(input, options);
  },

  /**
   * Auto-load best available model
   */
  autoLoadModel: async () => {
    const client = getLmStudioClient();
    const model = await client.autoLoadModel();
    return { model, success: !!model };
  },

  /**
   * Get connection status
   */
  getStatus: () => {
    const client = getLmStudioClient();
    return {
      connected: client.isConnected,
      model: client.getSelectedModel(),
      baseUrl: client.baseUrl,
    };
  },
};

export default lmstudioHandlers;
