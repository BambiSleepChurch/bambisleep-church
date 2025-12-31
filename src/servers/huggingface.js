/**
 * BambiSleep™ Church MCP Control Tower
 * HuggingFace MCP Server Wrapper - ML Model Operations
 */

import { createLogger } from '../utils/logger.js';

const logger = createLogger('huggingface');

const HF_API = 'https://huggingface.co/api';
const HF_INFERENCE_API = 'https://router.huggingface.co';

/**
 * HuggingFace API client
 */
class HuggingFaceClient {
  constructor(token = process.env.HUGGINGFACE_TOKEN || process.env.HF_ACCESS_TOKEN) {
    this.token = token;
    this.headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      this.headers.Authorization = `Bearer ${token}`;
    }
  }

  /**
   * Make HuggingFace API request
   */
  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${HF_API}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: { ...this.headers, ...options.headers },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HuggingFace API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Search models
   */
  async searchModels(query, options = {}) {
    const params = new URLSearchParams({
      search: query,
      limit: options.limit || 20,
      sort: options.sort || 'downloads',
      direction: options.direction || -1,
    });
    if (options.filter) params.set('filter', options.filter);
    
    return this.request(`/models?${params}`);
  }

  /**
   * Get model details
   */
  async getModel(modelId) {
    return this.request(`/models/${modelId}`);
  }

  /**
   * Search datasets
   */
  async searchDatasets(query, options = {}) {
    const params = new URLSearchParams({
      search: query,
      limit: options.limit || 20,
      sort: options.sort || 'downloads',
    });
    
    return this.request(`/datasets?${params}`);
  }

  /**
   * Get dataset details
   */
  async getDataset(datasetId) {
    return this.request(`/datasets/${datasetId}`);
  }

  /**
   * List spaces
   */
  async searchSpaces(query, options = {}) {
    const params = new URLSearchParams({
      search: query,
      limit: options.limit || 20,
    });
    
    return this.request(`/spaces?${params}`);
  }

  /**
   * Get repo details (model, dataset, or space)
   */
  async getRepoDetails(repoId, type = 'model') {
    const endpoints = {
      model: `/models/${repoId}`,
      dataset: `/datasets/${repoId}`,
      space: `/spaces/${repoId}`,
    };
    return this.request(endpoints[type] || endpoints.model);
  }

  /**
   * Run inference on a model
   */
  async inference(modelId, inputs, options = {}) {
    const response = await fetch(`${HF_INFERENCE_API}/models/${modelId}`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ inputs, ...options }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `Inference error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Text generation
   */
  async textGeneration(modelId, prompt, options = {}) {
    return this.inference(modelId, prompt, {
      parameters: {
        max_new_tokens: options.maxTokens || 100,
        temperature: options.temperature || 0.7,
        ...options.parameters,
      },
    });
  }

  /**
   * Text classification
   */
  async textClassification(modelId, text) {
    return this.inference(modelId, text);
  }

  /**
   * Feature extraction (embeddings)
   */
  async featureExtraction(modelId, text) {
    return this.inference(modelId, text);
  }

  /**
   * Question answering
   */
  async questionAnswering(modelId, question, context) {
    return this.inference(modelId, { question, context });
  }

  /**
   * Summarization
   */
  async summarization(modelId, text, options = {}) {
    return this.inference(modelId, text, {
      parameters: {
        max_length: options.maxLength || 130,
        min_length: options.minLength || 30,
      },
    });
  }

  /**
   * Translation
   */
  async translation(modelId, text) {
    return this.inference(modelId, text);
  }

  /**
   * Get current user info
   */
  async whoami() {
    return this.request('/whoami-v2');
  }
}

// Singleton instance
export const huggingfaceClient = new HuggingFaceClient();

/**
 * HuggingFace API handlers for REST endpoints
 */
export const huggingfaceHandlers = {
  // GET /api/huggingface/models - Search models
  searchModels: (query, options) => huggingfaceClient.searchModels(query, options),

  // GET /api/huggingface/models/:id - Get model details
  getModel: (modelId) => huggingfaceClient.getModel(modelId),

  // GET /api/huggingface/datasets - Search datasets
  searchDatasets: (query, options) => huggingfaceClient.searchDatasets(query, options),

  // GET /api/huggingface/datasets/:id - Get dataset details
  getDataset: (datasetId) => huggingfaceClient.getDataset(datasetId),

  // GET /api/huggingface/spaces - Search spaces
  searchSpaces: (query, options) => huggingfaceClient.searchSpaces(query, options),

  // GET /api/huggingface/repo/:type/:id - Get repo details
  getRepoDetails: (repoId, type) => huggingfaceClient.getRepoDetails(repoId, type),

  // POST /api/huggingface/inference/:model - Run inference
  inference: (modelId, inputs, options) =>
    huggingfaceClient.inference(modelId, inputs, options),

  // POST /api/huggingface/generate - Text generation
  textGeneration: (modelId, prompt, options) =>
    huggingfaceClient.textGeneration(modelId, prompt, options),

  // POST /api/huggingface/classify - Text classification
  textClassification: (modelId, text) =>
    huggingfaceClient.textClassification(modelId, text),

  // POST /api/huggingface/embeddings - Feature extraction
  featureExtraction: (modelId, text) =>
    huggingfaceClient.featureExtraction(modelId, text),

  // POST /api/huggingface/qa - Question answering
  questionAnswering: (modelId, question, context) =>
    huggingfaceClient.questionAnswering(modelId, question, context),

  // POST /api/huggingface/summarize - Summarization
  summarization: (modelId, text, options) =>
    huggingfaceClient.summarization(modelId, text, options),

  // POST /api/huggingface/translate - Translation
  translation: (modelId, text) => huggingfaceClient.translation(modelId, text),

  // GET /api/huggingface/whoami - Get current user
  whoami: () => huggingfaceClient.whoami(),
};

export default huggingfaceHandlers;
