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
 * - Embeddings generation with similarity search
 * - Structured JSON output
 * - Auto model selection and JIT loading
 * - REST API v0 with enhanced stats (tokens/sec, TTFT)
 * - TTL (Time-To-Live) for auto model unloading
 * - Model info (arch, quantization, context length)
 * 
 * Based on bambisleep-church-agent LmStudioClient implementation.
 * 
 * @see https://lmstudio.ai/docs/developer/openai-compat
 * @see https://lmstudio.ai/docs/developer/rest/endpoints
 * @see https://lmstudio.ai/docs/cli
 */

import { getConfig } from '../utils/config.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('lmstudio');

/**
 * Get LM Studio configuration from centralized config
 * Falls back to environment variables and defaults
 * @returns {Object} LM Studio configuration
 */
function getLmStudioConfig() {
  try {
    const config = getConfig();
    return config.lmstudio;
  } catch {
    // Fallback if getConfig() fails
    return {
      host: process.env.LMS_HOST || 'localhost',
      port: parseInt(process.env.LMS_PORT || '1234', 10),
      model: process.env.LMS_MODEL || 'qwen2.5-7b-instruct',
      temperature: parseFloat(process.env.LMS_TEMPERATURE || '0.7'),
      maxTokens: parseInt(process.env.LMS_MAX_TOKENS || '2048', 10),
      timeout: parseInt(process.env.LMS_TIMEOUT || '60000', 10),
      baseUrl: `http://${process.env.LMS_HOST || 'localhost'}:${parseInt(process.env.LMS_PORT || '1234', 10)}/v1`,
    };
  }
}

/**
 * Model preference order - smallest to largest
 * Prefers smaller qwen models first, then other families
 */
const MODEL_PREFERENCE_ORDER = [
  // Qwen - smallest first
  'qwen2.5-0.5b',
  'qwen2.5-1.5b',
  'qwen2.5-3b',
  'qwen3-0.6b',
  'qwen3-1.7b',
  'qwen3-4b',
  'qwen2.5-7b',
  'qwen3-8b',
  'qwen2.5-14b',
  'qwen3-14b',
  'qwen2.5-32b',
  'qwen3-30b',
  // Llama - smallest first
  'llama-3.2-1b',
  'llama-3.2-3b',
  'llama-3.1-8b',
  'llama-3.3-70b',
  // Other small models
  'phi-3-mini',
  'phi-4',
  'gemma-2b',
  'gemma-7b',
  'mistral-7b',
  // Generic fallbacks (partial match)
  'qwen',
  'llama',
  'phi',
  'gemma',
  'mistral',
];

/**
 * LM Studio Client for local inference
 * 
 * Uses centralized config from getConfig().lmstudio
 * Supports all LM Studio OpenAI-compatible features
 * 
 * @example
 * ```javascript
 * const client = getLmStudioClient();
 * await client.testConnection();
 * const response = await client.chat([
 *   { role: 'user', content: 'Hello!' }
 * ]);
 * ```
 */
export class LMStudioClient {
  #config;
  #baseUrl;
  #apiV0Url; // REST API v0 base URL
  #model;
  #temperature;
  #maxTokens;
  #timeout;
  #retries;
  #connected = false;
  #loadedModel = null;
  #availableModels = [];
  #downloadedModels = []; // All downloaded models (loaded + not loaded)

  constructor(configOverride = {}) {
    // Get configuration from centralized config, with overrides
    const defaultConfig = getLmStudioConfig();
    this.#config = { ...defaultConfig, ...configOverride };
    
    this.#baseUrl = this.#config.baseUrl || `http://${this.#config.host}:${this.#config.port}/v1`;
    // REST API v0 endpoint for model management
    this.#apiV0Url = this.#baseUrl.replace('/v1', '/api/v0');
    this.#model = this.#config.model;
    this.#temperature = this.#config.temperature;
    this.#maxTokens = this.#config.maxTokens;
    this.#timeout = this.#config.timeout;
    this.#retries = this.#config.retries || 2;

    logger.info(`LM Studio client initialized`, { 
      baseUrl: this.#baseUrl,
      model: this.#model,
      timeout: this.#timeout,
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
   * Get selected/loaded model
   * @returns {string|null}
   */
  getSelectedModel() {
    return this.#loadedModel || this.#model;
  }

  /**
   * Get configuration object
   * @returns {Object}
   */
  getConfig() {
    return { ...this.#config };
  }

  /**
   * Test connection to LM Studio server
   * @returns {Promise<boolean>} True if connected
   */
  async testConnection() {
    try {
      const models = await this.listModels();
      this.#connected = true;
      this.#availableModels = models;
      logger.info(`[LmStudio] Connected. ${models.length} model(s) available`);
      return true;
    } catch (error) {
      logger.warn('[LmStudio] Connection test failed', { error: error.message });
      this.#connected = false;
      return false;
    }
  }

  /**
   * List loaded models from LM Studio (OpenAI-compatible endpoint)
   * Only returns models currently loaded in memory
   * @returns {Promise<Array>} List of loaded models
   */
  async listModels() {
    try {
      const response = await fetch(`${this.#baseUrl}/models`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`Failed to list models: ${response.status}`);
      }

      const data = await response.json();
      this.#availableModels = data.data || [];
      return this.#availableModels;
    } catch (error) {
      logger.error('Failed to list models:', error.message);
      throw error;
    }
  }

  /**
   * List ALL downloaded models from LM Studio (REST API v0)
   * Returns both loaded and not-loaded models with state info
   * @returns {Promise<Array>} List of all downloaded models
   */
  async listDownloadedModels() {
    try {
      const response = await fetch(`${this.#apiV0Url}/models`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`Failed to list downloaded models: ${response.status}`);
      }

      const data = await response.json();
      this.#downloadedModels = data.data || [];
      
      logger.debug('[LmStudio] Downloaded models:', {
        total: this.#downloadedModels.length,
        loaded: this.#downloadedModels.filter(m => m.state === 'loaded').length,
        notLoaded: this.#downloadedModels.filter(m => m.state === 'not-loaded').length,
      });
      
      return this.#downloadedModels;
    } catch (error) {
      logger.error('Failed to list downloaded models:', error.message);
      throw error;
    }
  }

  /**
   * Get detailed info about a specific model (REST API v0)
   * @param {string} modelId - Model identifier
   * @returns {Promise<Object>} Model info with arch, quantization, context length, etc.
   */
  async getModelInfo(modelId) {
    try {
      const response = await fetch(`${this.#apiV0Url}/models/${encodeURIComponent(modelId)}`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`Failed to get model info: ${response.status}`);
      }

      const data = await response.json();
      logger.debug('[LmStudio] Model info:', data);
      return data;
    } catch (error) {
      logger.error(`Failed to get model info for ${modelId}:`, error.message);
      throw error;
    }
  }

  /**
   * Select a loaded model (or use the first available)
   * Auto-selects model matching configured model name
   * @param {string} [modelName] - Optional model name to search for
   * @returns {Promise<string|null>} Selected model ID or null
   */
  async selectLoadedModel(modelName = null) {
    const targetModel = modelName || this.#model;

    try {
      const models = await this.listModels();

      if (models.length === 0) {
        logger.warn('No models loaded, attempting auto-load...');
        return await this.autoLoadModel();
      }

      // Find model matching target name (case-insensitive partial match)
      const matchedModel = models.find(m =>
        m.id.toLowerCase().includes(targetModel.toLowerCase())
      );

      if (matchedModel) {
        this.#loadedModel = matchedModel.id;
        logger.info(`Selected model: ${this.#loadedModel}`);
        return this.#loadedModel;
      }

      // Fallback to first available model
      this.#loadedModel = models[0].id;
      logger.warn(`Model '${targetModel}' not found, using: ${this.#loadedModel}`);
      return this.#loadedModel;
    } catch (error) {
      logger.error('Model selection failed:', error.message);
      return null;
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
    // Auto-select model if not already done
    if (!this.#loadedModel) {
      await this.selectLoadedModel();
    }

    const model = options.model || this.#loadedModel || this.#model;
    const temperature = options.temperature ?? this.#temperature;
    const maxTokens = options.maxTokens ?? this.#maxTokens;

    const payload = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: options.stream ?? false,
    };

    // Add TTL for JIT-loaded models (seconds until auto-unload when idle)
    if (options.ttl !== undefined) {
      payload.ttl = options.ttl;
    }

    // Add tools if provided
    if (options.tools && options.tools.length > 0) {
      payload.tools = options.tools;
      payload.tool_choice = options.toolChoice ?? 'auto';
    }

    // Add response format for structured output
    if (options.responseFormat) {
      payload.response_format = options.responseFormat;
    }

    logger.debug('[LmStudio] Chat request:', { 
      model, 
      messageCount: messages.length,
      ttl: options.ttl,
    });

    // Retry logic for timeouts
    let lastError;
    for (let attempt = 1; attempt <= this.#retries; attempt++) {
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
          const errorText = await response.text();
          throw new Error(`Chat completion failed: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        this.#connected = true;

        logger.debug('[LmStudio] Chat response received', { 
          model: data.model,
          tokens: data.usage?.total_tokens 
        });

        return data;
      } catch (error) {
        lastError = error;
        
        if (error.name === 'TimeoutError') {
          logger.warn(`[LmStudio] Request timeout (attempt ${attempt}/${this.#retries})`, { 
            timeout: this.#timeout 
          });
          
          if (attempt < this.#retries) {
            // Wait briefly before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
          
          logger.error('[LmStudio] All retry attempts failed');
          throw new Error('LM Studio request timed out after retries');
        }
        
        // Non-timeout errors - don't retry
        logger.error('[LmStudio] Chat completion error:', error.message);
        throw error;
      }
    }
    
    throw lastError;
  }

  /**
   * Chat using REST API v0 with enhanced stats
   * Returns tokens_per_second, time_to_first_token, model_info, runtime
   * 
   * @param {Array<{role: string, content: string}>} messages - Chat messages
   * @param {Object} options - Additional options (ttl, temperature, maxTokens, etc.)
   * @returns {Promise<Object>} Response with enhanced stats
   * 
   * @example
   * ```javascript
   * const response = await client.chatV0([
   *   { role: 'user', content: 'Hello!' }
   * ], { ttl: 300 }); // Auto-unload after 5 min idle
   * 
   * console.log(response.stats.tokens_per_second);
   * console.log(response.stats.time_to_first_token);
   * console.log(response.model_info.arch);
   * ```
   */
  async chatV0(messages, options = {}) {
    if (!this.#loadedModel) {
      await this.selectLoadedModel();
    }

    const model = options.model || this.#loadedModel || this.#model;
    const temperature = options.temperature ?? this.#temperature;
    const maxTokens = options.maxTokens ?? this.#maxTokens;

    const payload = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: options.stream ?? false,
    };

    // TTL for JIT-loaded models (seconds)
    if (options.ttl !== undefined) {
      payload.ttl = options.ttl;
    }

    // Stop sequences
    if (options.stop) {
      payload.stop = options.stop;
    }

    logger.debug('[LmStudio] REST API v0 chat request:', { model, ttl: options.ttl });

    try {
      const response = await fetch(`${this.#apiV0Url}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.#timeout),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`REST API v0 chat failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      this.#connected = true;

      // Log enhanced stats
      if (data.stats) {
        logger.info('[LmStudio] Stats:', {
          tokensPerSecond: data.stats.tokens_per_second?.toFixed(2),
          ttft: data.stats.time_to_first_token,
          generationTime: data.stats.generation_time,
        });
      }

      return data;
    } catch (error) {
      if (error.name === 'TimeoutError') {
        throw new Error('LM Studio REST API v0 request timed out');
      }
      logger.error('[LmStudio] REST API v0 error:', error.message);
      throw error;
    }
  }

  /**
   * Text completion using REST API v0 with enhanced stats
   * @param {string} prompt - Text prompt
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Response with text and stats
   */
  async completeV0(prompt, options = {}) {
    const model = options.model || this.#loadedModel || this.#model;
    const temperature = options.temperature ?? this.#temperature;
    const maxTokens = options.maxTokens ?? this.#maxTokens;

    const payload = {
      model,
      prompt,
      temperature,
      max_tokens: maxTokens,
      stream: false,
    };

    if (options.ttl !== undefined) payload.ttl = options.ttl;
    if (options.stop) payload.stop = options.stop;

    try {
      const response = await fetch(`${this.#apiV0Url}/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.#timeout),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`REST API v0 completion failed: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('[LmStudio] REST API v0 completion error:', error.message);
      throw error;
    }
  }

  /**
   * Chat with tool calling
   * Returns structured response with toolCalls array
   * 
   * @param {Array<{role: string, content: string}>} messages - Chat messages
   * @param {Array<Object>} tools - Tool definitions
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Response with potential tool calls
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
   * if (response.toolCalls.length > 0) {
   *   // Handle tool calls
   * }
   * ```
   */
  async chatWithTools(messages, tools, options = {}) {
    const response = await this.chat(messages, {
      ...options,
      tools,
      toolChoice: options.toolChoice ?? 'auto',
    });

    const message = response.choices?.[0]?.message;

    return {
      content: message?.content || null,
      toolCalls: message?.tool_calls || [],
      finishReason: response.choices?.[0]?.finish_reason,
      usage: response.usage,
    };
  }

  /**
   * Stream chat completion response
   * 
   * @param {Array<{role: string, content: string}>} messages - Chat messages
   * @param {Object} [options] - Additional options
   * @param {Function} onChunk - Callback for each streamed chunk
   * @returns {Promise<string>} Full accumulated response
   */
  async streamChat(messages, options = {}, onChunk = null) {
    // Support legacy signature: streamChat(messages, onChunk, options)
    if (typeof options === 'function') {
      onChunk = options;
      options = {};
    }

    if (!this.#loadedModel) {
      await this.selectLoadedModel();
    }

    const model = options.model || this.#loadedModel || this.#model;
    const temperature = options.temperature ?? this.#temperature;
    const maxTokens = options.maxTokens ?? this.#maxTokens;

    const payload = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    };

    if (options.tools && options.tools.length > 0) {
      payload.tools = options.tools;
      payload.tool_choice = options.toolChoice ?? 'auto';
    }

    logger.debug('[LmStudio] Stream chat request', { model, messageCount: messages.length });

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
        throw new Error(`Stream failed: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content || '';
              if (delta) {
                fullContent += delta;
                if (onChunk) onChunk(delta, fullContent);
              }
            } catch {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }

      this.#connected = true;
      return fullContent;
    } catch (error) {
      logger.error('[LmStudio] Stream error:', error.message);
      throw error;
    }
  }

  // Alias for backwards compatibility
  async chatStream(messages, onChunk, options = {}) {
    return this.streamChat(messages, options, onChunk);
  }

  /**
   * Simple text completion (legacy endpoint)
   * 
   * @param {string} prompt - Text prompt
   * @param {Object} options - Additional options
   * @returns {Promise<string>} Generated text
   */
  async complete(prompt, options = {}) {
    const model = options.model || this.#loadedModel || this.#model;
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

  // ═══════════════════════════════════════════════════════════════
  // 📊 EMBEDDINGS (requires embedding model)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Generate embeddings for text
   * 
   * @param {string|Array<string>} input - Text or array of texts to embed
   * @param {Object} [options] - Additional options
   * @returns {Promise<Object>} Embeddings response (raw API response)
   */
  async embed(input, options = {}) {
    const model = options.model || this.#loadedModel || 'text-embedding-nomic-embed-text-v1.5';

    const payload = {
      model,
      input: Array.isArray(input) ? input : [input],
    };

    logger.debug('[LmStudio] Embedding request:', { 
      model, 
      inputCount: Array.isArray(input) ? input.length : 1 
    });

    try {
      const response = await fetch(`${this.#baseUrl}/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.#timeout),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Embedding failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      this.#connected = true;

      logger.debug('[LmStudio] Embedding response received', {
        model: data.model,
        vectorCount: data.data?.length,
      });

      return data;
    } catch (error) {
      logger.error('[LmStudio] Embedding error:', error.message);
      throw error;
    }
  }

  /**
   * Get embedding vector for single text
   * @param {string} text - Text to embed
   * @param {Object} [options] - Additional options
   * @returns {Promise<Array<number>>} Embedding vector
   */
  async getEmbedding(text, options = {}) {
    const result = await this.embed(text, options);
    return result.data?.[0]?.embedding || [];
  }

  /**
   * Get embedding vectors for multiple texts
   * @param {Array<string>} texts - Texts to embed
   * @param {Object} [options] - Additional options
   * @returns {Promise<Array<Array<number>>>} Array of embedding vectors
   */
  async getEmbeddings(texts, options = {}) {
    const result = await this.embed(texts, options);
    return result.data?.map(d => d.embedding) || [];
  }

  /**
   * Calculate cosine similarity between two vectors
   * @param {Array<number>} vecA - First vector
   * @param {Array<number>} vecB - Second vector
   * @returns {number} Similarity score (0-1)
   */
  static cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Find most similar text from candidates
   * @param {string} query - Query text
   * @param {Array<string>} candidates - Candidate texts to compare
   * @param {Object} [options] - Additional options
   * @returns {Promise<Array<{text: string, similarity: number}>>} Ranked results
   */
  async findSimilar(query, candidates, options = {}) {
    const [queryEmbedding, candidateEmbeddings] = await Promise.all([
      this.getEmbedding(query, options),
      this.getEmbeddings(candidates, options),
    ]);

    const results = candidates.map((text, i) => ({
      text,
      similarity: LMStudioClient.cosineSimilarity(queryEmbedding, candidateEmbeddings[i]),
    }));

    // Sort by similarity (highest first)
    return results.sort((a, b) => b.similarity - a.similarity);
  }

  // ═══════════════════════════════════════════════════════════════
  // 🖼️ VISION / IMAGE INPUT (requires vision-enabled model like LLaVA)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Chat with image input (vision model required)
   * @param {string} text - Text prompt
   * @param {Array<string>} images - Array of base64 encoded images or data URLs
   * @param {Object} [options] - Additional options
   * @returns {Promise<Object>} Chat completion response with content, usage, model
   */
  async chatWithImage(text, images, options = {}) {
    if (!this.#loadedModel) {
      await this.selectLoadedModel();
    }

    const model = options.model || this.#loadedModel || this.#model;

    // Build multimodal content array
    const content = [{ type: 'text', text }];

    // Add each image
    for (const image of images) {
      const imageUrl = image.startsWith('data:')
        ? image
        : `data:image/png;base64,${image}`;
      
      content.push({
        type: 'image_url',
        image_url: { url: imageUrl },
      });
    }

    const messages = [
      ...(options.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
      { role: 'user', content },
    ];

    const payload = {
      model,
      messages,
      temperature: options.temperature ?? this.#temperature,
      max_tokens: options.maxTokens ?? this.#maxTokens,
      stream: false,
    };

    try {
      logger.debug('[LmStudio] Vision request:', { model, imageCount: images.length });

      const response = await fetch(`${this.#baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.#timeout),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vision request failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      logger.debug('[LmStudio] Vision response received', {
        model: data.model,
        tokens: data.usage?.total_tokens,
      });

      return {
        content: data.choices?.[0]?.message?.content || '',
        usage: data.usage,
        model: data.model,
      };
    } catch (error) {
      logger.error('[LmStudio] Vision error:', error.message);
      throw error;
    }
  }

  /**
   * Describe an image using vision model
   * @param {string} imageBase64 - Base64 encoded image
   * @param {string} [prompt] - Custom prompt (default: "What is this image?")
   * @param {Object} [options] - Additional options
   * @returns {Promise<string>} Image description
   */
  async describeImage(imageBase64, prompt = 'What is this image?', options = {}) {
    const result = await this.chatWithImage(prompt, [imageBase64], options);
    return result.content;
  }

  /**
   * Analyze multiple images with a question
   * @param {Array<string>} images - Array of base64 encoded images
   * @param {string} question - Question about the images
   * @param {Object} [options] - Additional options
   * @returns {Promise<string>} Analysis result
   */
  async analyzeImages(images, question, options = {}) {
    const result = await this.chatWithImage(question, images, options);
    return result.content;
  }

  /**
   * Auto-load a model from downloaded models using JIT loading
   * Queries LM Studio for available models, sorts by preference (smallest qwen first), JIT loads best match
   * @returns {Promise<string|null>} Loaded model ID or null
   */
  async autoLoadModel() {
    // First check if any models are already loaded
    const loadedModels = await this.listModels();
    if (loadedModels.length > 0) {
      // Use the best loaded model based on preference
      const bestLoaded = this.#selectBestModel(loadedModels.map(m => ({ id: m.id, type: 'llm' })));
      if (bestLoaded) {
        this.#loadedModel = bestLoaded.id;
        logger.info(`Using already loaded model: ${this.#loadedModel}`);
        return this.#loadedModel;
      }
      // Fallback to first available
      this.#loadedModel = loadedModels[0].id;
      logger.info(`Using first available model: ${this.#loadedModel}`);
      return this.#loadedModel;
    }

    // No models loaded - discover available models via REST API v0
    try {
      const downloadedModels = await this.listDownloadedModels();
      
      if (downloadedModels.length === 0) {
        logger.error('❌ NO MODELS DOWNLOADED in LM Studio!');
        logger.error('   Please open LM Studio GUI and download a model first.');
        logger.error('   Recommended: Search for "qwen2.5-0.5b" or "qwen3-0.6b" (small, fast)');
        return null;
      }

      // Filter to LLM/VLM models only (not embeddings)
      const llmModels = downloadedModels.filter(m => m.type === 'llm' || m.type === 'vlm');
      
      if (llmModels.length === 0) {
        logger.error('❌ No LLM models downloaded. Only embedding models found.');
        logger.error('   Please download an LLM model in LM Studio GUI.');
        return null;
      }

      logger.info(`Found ${llmModels.length} downloaded LLM model(s):`);
      llmModels.forEach(m => logger.debug(`  - ${m.id} (${m.state})`));

      // Select best model based on preference order (smallest qwen first)
      const bestModel = this.#selectBestModel(llmModels);
      
      if (bestModel) {
        logger.info(`Selected model: ${bestModel.id} (state: ${bestModel.state})`);
        if (await this.loadModel(bestModel.id)) {
          return this.#loadedModel;
        }
      }

      // Fallback: try to load each model in order
      for (const model of llmModels) {
        logger.info(`Fallback: trying ${model.id}...`);
        if (await this.loadModel(model.id)) {
          return this.#loadedModel;
        }
      }

    } catch (error) {
      logger.error('Failed to discover downloaded models:', error.message);
    }

    logger.error('Could not auto-load any model. Please ensure LM Studio has models downloaded.');
    return null;
  }

  /**
   * Select the best model from a list based on preference order
   * Prefers smaller qwen models, then other small models
   * @param {Array<{id: string}>} models - List of models with id property
   * @returns {Object|null} Best model or null
   */
  #selectBestModel(models) {
    if (!models || models.length === 0) return null;
    
    // Score each model based on preference order
    const scored = models.map(model => {
      const modelLower = model.id.toLowerCase();
      let score = MODEL_PREFERENCE_ORDER.length + 1; // Default worst score
      
      for (let i = 0; i < MODEL_PREFERENCE_ORDER.length; i++) {
        const pref = MODEL_PREFERENCE_ORDER[i].toLowerCase();
        if (modelLower.includes(pref)) {
          score = i;
          break;
        }
      }
      
      return { ...model, score };
    });
    
    // Sort by score (lower = better preference)
    scored.sort((a, b) => a.score - b.score);
    
    logger.debug(`Model ranking: ${scored.map(m => `${m.id}(${m.score})`).join(', ')}`);
    
    return scored[0];
  }

  /**
   * JIT load a model by making a minimal request
   * LM Studio will automatically load the model if it's downloaded
   * @param {string} modelId - Model identifier to load
   * @returns {Promise<boolean>} True if model loaded successfully
   */
  async loadModel(modelId, options = {}) {
    const { ttl, gpu, contextLength, identifier } = options;
    
    logger.info(`JIT loading model: ${modelId}`, { ttl, gpu, contextLength, identifier });

    try {
      // Build payload with optional load parameters
      const payload = {
        model: identifier || modelId, // Use custom identifier if provided
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 1,
        temperature: 0,
      };

      // Add TTL for auto-unload after idle (seconds)
      if (ttl !== undefined) {
        payload.ttl = ttl;
      }

      // Make a minimal chat request to trigger JIT loading
      // LM Studio will auto-load the model if it's downloaded
      const response = await fetch(`${this.#baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(180000), // 3 min timeout for model loading
      });

      if (response.ok) {
        this.#loadedModel = identifier || modelId;
        logger.info(`✅ Model JIT loaded successfully: ${this.#loadedModel}`);
        return true;
      }

      const error = await response.json();
      logger.warn(`Failed to JIT load model ${modelId}:`, error.error?.message);
      return false;
    } catch (error) {
      if (error.name === 'TimeoutError') {
        logger.error(`Model loading timeout for ${modelId} (model may be too large)`);
      } else {
        logger.error(`Error loading model ${modelId}:`, error.message);
      }
      return false;
    }
  }

  /**
   * Unload a model from memory
   * Note: LM Studio doesn't have a direct unload API, but TTL can be used
   * @param {string} [modelId] - Model to unload (optional, uses current if not specified)
   * @returns {Promise<boolean>} True if operation completed
   */
  async unloadModel(modelId = null) {
    const targetModel = modelId || this.#loadedModel;
    
    if (!targetModel) {
      logger.warn('No model to unload');
      return false;
    }

    // LM Studio doesn't have a direct REST API for unloading
    // The recommended approach is to use TTL or the CLI (lms unload)
    logger.info(`Model unloading requires LM Studio CLI: lms unload ${targetModel}`);
    logger.info('Or set a TTL when loading: loadModel(modelId, { ttl: 300 })');
    
    // Clear local state
    if (this.#loadedModel === targetModel) {
      this.#loadedModel = null;
    }
    
    return true;
  }

  /**
   * Get server health/status
   * @returns {Promise<Object>} Server status info
   */
  async getServerStatus() {
    try {
      // Check if server is responding
      const connected = await this.testConnection();
      const models = await this.listDownloadedModels();
      
      const loadedModels = models.filter(m => m.state === 'loaded');
      
      return {
        connected,
        loadedModelCount: loadedModels.length,
        downloadedModelCount: models.length,
        loadedModels: loadedModels.map(m => ({
          id: m.id,
          type: m.type,
          arch: m.arch,
          quantization: m.quantization,
          maxContextLength: m.max_context_length,
        })),
        currentModel: this.#loadedModel,
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message,
      };
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
 * Exposes all LMStudioClient methods via REST API
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
   * List loaded models (OpenAI-compatible endpoint)
   */
  listModels: async () => {
    const client = getLmStudioClient();
    const models = await client.listModels();
    return { models, count: models.length };
  },

  /**
   * List ALL downloaded models (REST API v0)
   * Includes both loaded and not-loaded models
   */
  listDownloadedModels: async () => {
    const client = getLmStudioClient();
    const models = await client.listDownloadedModels();
    return { 
      models, 
      count: models.length,
      loaded: models.filter(m => m.state === 'loaded').length,
      notLoaded: models.filter(m => m.state === 'not-loaded').length,
    };
  },

  /**
   * Select loaded model
   */
  selectLoadedModel: async (modelName = null) => {
    const client = getLmStudioClient();
    const model = await client.selectLoadedModel(modelName);
    return { model, success: !!model };
  },

  /**
   * Chat completion
   */
  chat: async (messages, options = {}) => {
    const client = getLmStudioClient();
    return client.chat(messages, options);
  },

  /**
   * Chat using REST API v0 with enhanced stats
   * Returns tokens_per_second, time_to_first_token, model_info
   */
  chatV0: async (messages, options = {}) => {
    const client = getLmStudioClient();
    return client.chatV0(messages, options);
  },

  /**
   * Text completion using REST API v0 with enhanced stats
   */
  completeV0: async (prompt, options = {}) => {
    const client = getLmStudioClient();
    return client.completeV0(prompt, options);
  },

  /**
   * Chat with tools (function calling)
   * Returns structured response with toolCalls array
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
   * Describe a single image
   */
  describeImage: async (imageBase64, prompt, options = {}) => {
    const client = getLmStudioClient();
    const description = await client.describeImage(imageBase64, prompt, options);
    return { description };
  },

  /**
   * Analyze multiple images
   */
  analyzeImages: async (images, question, options = {}) => {
    const client = getLmStudioClient();
    const analysis = await client.analyzeImages(images, question, options);
    return { analysis };
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
   * Stream chat (alternate method name)
   */
  streamChat: async (messages, options = {}, onChunk = null) => {
    const client = getLmStudioClient();
    return client.streamChat(messages, options, onChunk);
  },

  /**
   * Execute tool loop until completion
   */
  executeToolLoop: async (messages, tools, toolHandlers, options = {}) => {
    const client = getLmStudioClient();
    return client.executeToolLoop(messages, tools, toolHandlers, options);
  },

  /**
   * Generate embeddings (raw response)
   */
  embed: async (input, options = {}) => {
    const client = getLmStudioClient();
    return client.embed(input, options);
  },

  /**
   * Get single embedding vector
   */
  getEmbedding: async (text, options = {}) => {
    const client = getLmStudioClient();
    const embedding = await client.getEmbedding(text, options);
    return { embedding, dimensions: embedding.length };
  },

  /**
   * Get multiple embedding vectors
   */
  getEmbeddings: async (texts, options = {}) => {
    const client = getLmStudioClient();
    const embeddings = await client.getEmbeddings(texts, options);
    return { embeddings, count: embeddings.length };
  },

  /**
   * Find similar texts
   */
  findSimilar: async (query, candidates, options = {}) => {
    const client = getLmStudioClient();
    return client.findSimilar(query, candidates, options);
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
   * Attempt to load a specific model with options
   * @param {string} modelId - Model identifier
   * @param {Object} options - Load options (ttl, gpu, contextLength, identifier)
   */
  loadModel: async (modelId, options = {}) => {
    const client = getLmStudioClient();
    const success = await client.loadModel(modelId, options);
    return { modelId, success, options };
  },

  /**
   * Unload a model from memory
   */
  unloadModel: async (modelId = null) => {
    const client = getLmStudioClient();
    const success = await client.unloadModel(modelId);
    return { modelId, success };
  },

  /**
   * Get detailed info about a specific model
   */
  getModelInfo: async (modelId) => {
    const client = getLmStudioClient();
    return client.getModelInfo(modelId);
  },

  /**
   * Get server status with loaded models info
   */
  getServerStatus: async () => {
    const client = getLmStudioClient();
    return client.getServerStatus();
  },

  /**
   * Get connection status and config
   */
  getStatus: () => {
    const client = getLmStudioClient();
    return {
      connected: client.isConnected,
      model: client.getSelectedModel(),
      baseUrl: client.baseUrl,
      config: client.getConfig(),
    };
  },

  /**
   * Calculate cosine similarity (static utility)
   */
  cosineSimilarity: (vecA, vecB) => {
    return {
      similarity: LMStudioClient.cosineSimilarity(vecA, vecB),
    };
  },
};

export default lmstudioHandlers;
