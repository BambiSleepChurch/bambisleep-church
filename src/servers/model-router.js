/**
 * BambiSleep™ Church MCP Control Tower
 * Smart Model Router - Auto-select optimal model per task type
 * 
 * Automatically selects the optimal model for each task type based on:
 * - Benchmark results (quality scores per task)
 * - Performance metrics (tokens/sec, latency)
 * - Model availability (loaded vs needs loading)
 * - Task requirements (speed vs quality trade-off)
 */

import { createLogger } from '../utils/logger.js';

const logger = createLogger('model-router');

/**
 * Model performance profiles based on benchmark results
 * Scores: per-task scores from actual benchmarks
 * Speed: avg tokens/sec from benchmark
 */
export const MODEL_PROFILES = Object.freeze({
  // === TOP TIER: Best Overall Quality ===
  'l3-sthenomaidblackroot-8b-v1-i1@q4_k_s': {
    quality: 74,
    speed: 11.7,
    taskScores: {
      reasoning: 60,
      creative: 70,
      instruction: 80,
      chat: 60,
      toolUse: 90,
      summarize: 60,
    },
    strengths: ['instruction', 'toolUse'],
    weaknesses: [],
    contextLength: 8192,
    notes: 'Best for structured output. Top performer for tool calling.',
    tier: 'quality',
  },

  'l3-sthenomaidblackroot-8b-v1@q4_k_s': {
    quality: 74,
    speed: 16.7,
    taskScores: {
      reasoning: 75,
      creative: 50,
      instruction: 80,
      chat: 60,
      toolUse: 90,
      summarize: 60,
    },
    strengths: ['reasoning', 'instruction', 'toolUse'],
    weaknesses: ['creative'],
    contextLength: 8192,
    notes: 'Best for agent tasks - highest reasoning + tool use combo.',
    tier: 'quality',
  },

  // === SPEED TIER: Fast + Good Quality ===
  'liquid/lfm2-1.2b': {
    quality: 73,
    speed: 29.1,
    taskScores: {
      reasoning: 75,
      creative: 70,
      instruction: 80,
      chat: 60,
      toolUse: 80,
      summarize: 60,
    },
    strengths: ['reasoning', 'creative', 'instruction', 'toolUse'],
    weaknesses: [],
    contextLength: 128000,
    notes: 'Excellent speed/quality ratio. Good for real-time chat with tool support.',
    tier: 'speed',
  },

  'qwen/qwen2.5-7b-instruct': {
    quality: 70,
    speed: 25.0,
    taskScores: {
      reasoning: 70,
      creative: 65,
      instruction: 75,
      chat: 70,
      toolUse: 85,
      summarize: 70,
    },
    strengths: ['toolUse', 'instruction'],
    weaknesses: [],
    contextLength: 32768,
    notes: 'Good all-rounder with strong tool use.',
    tier: 'balanced',
  },

  'qwen/qwen2.5-coder-7b-instruct': {
    quality: 72,
    speed: 24.0,
    taskScores: {
      reasoning: 75,
      creative: 50,
      instruction: 85,
      chat: 55,
      toolUse: 90,
      summarize: 60,
    },
    strengths: ['instruction', 'toolUse', 'reasoning'],
    weaknesses: ['creative', 'chat'],
    contextLength: 32768,
    notes: 'Excellent for code and structured tasks.',
    tier: 'balanced',
  },

  'qwen/qwen3-1.7b': {
    quality: 20,
    speed: 141.2,
    taskScores: {
      reasoning: 0,
      creative: 0,
      instruction: 0,
      chat: 0,
      toolUse: 45,
      summarize: 0,
    },
    strengths: [],
    weaknesses: ['reasoning', 'creative', 'instruction', 'chat', 'summarize'],
    contextLength: 32768,
    notes: 'VERY FAST but needs /think mode. Not recommended without it.',
    tier: 'speed',
    requiresThinkingMode: true,
  },

  'qwen/qwen3-4b': {
    quality: 35,
    speed: 91.8,
    taskScores: {
      reasoning: 30,
      creative: 25,
      instruction: 40,
      chat: 35,
      toolUse: 50,
      summarize: 30,
    },
    strengths: [],
    weaknesses: ['reasoning', 'creative'],
    contextLength: 32768,
    notes: 'Fast but limited quality. Better than 1.7b.',
    tier: 'speed',
  },

  // === BALANCED TIER ===
  'llama-3.1-8b-instruct': {
    quality: 68,
    speed: 22.0,
    taskScores: {
      reasoning: 65,
      creative: 60,
      instruction: 70,
      chat: 65,
      toolUse: 75,
      summarize: 65,
    },
    strengths: ['toolUse'],
    weaknesses: [],
    contextLength: 131072,
    notes: 'Good balance across all tasks.',
    tier: 'balanced',
  },

  'mistral-7b-instruct': {
    quality: 65,
    speed: 28.0,
    taskScores: {
      reasoning: 60,
      creative: 65,
      instruction: 70,
      chat: 70,
      toolUse: 65,
      summarize: 65,
    },
    strengths: ['chat', 'creative'],
    weaknesses: [],
    contextLength: 32768,
    notes: 'Fast and good for conversational tasks.',
    tier: 'speed',
  },

  'phi-4': {
    quality: 70,
    speed: 20.0,
    taskScores: {
      reasoning: 75,
      creative: 55,
      instruction: 80,
      chat: 60,
      toolUse: 70,
      summarize: 70,
    },
    strengths: ['reasoning', 'instruction'],
    weaknesses: ['creative'],
    contextLength: 16384,
    notes: 'Strong reasoning, good for analytical tasks.',
    tier: 'balanced',
  },
});

/**
 * Task type definitions with requirements
 */
export const TASK_TYPES = Object.freeze({
  // General conversation
  chat: {
    name: 'Chat',
    preferTier: 'speed',
    minQuality: 40,
    minTaskScore: 50,
    taskId: 'chat',
    fallbackTask: null,
  },

  // Complex reasoning
  reasoning: {
    name: 'Reasoning',
    preferTier: 'quality',
    minQuality: 60,
    minTaskScore: 60,
    taskId: 'reasoning',
    fallbackTask: 'instruction',
  },

  // Tool calling - needs structured output
  toolUse: {
    name: 'Tool Execution',
    preferTier: 'quality',
    minQuality: 55,
    minTaskScore: 70,
    taskId: 'toolUse',
    fallbackTask: 'instruction',
  },

  // Creative writing
  creative: {
    name: 'Creative Writing',
    preferTier: 'balanced',
    minQuality: 50,
    minTaskScore: 60,
    taskId: 'creative',
    fallbackTask: 'chat',
  },

  // Quick summaries
  summarize: {
    name: 'Summarization',
    preferTier: 'speed',
    minQuality: 40,
    minTaskScore: 50,
    taskId: 'summarize',
    fallbackTask: 'instruction',
  },

  // Following instructions precisely
  instruction: {
    name: 'Instruction Following',
    preferTier: 'balanced',
    minQuality: 50,
    minTaskScore: 70,
    taskId: 'instruction',
    fallbackTask: null,
  },
});

/**
 * Best model per task from benchmarks (precomputed)
 */
export const TASK_BEST_MODELS = Object.freeze({
  reasoning: 'l3-sthenomaidblackroot-8b-v1@q4_k_s',
  creative: 'liquid/lfm2-1.2b',
  instruction: 'l3-sthenomaidblackroot-8b-v1-i1@q4_k_s',
  chat: 'mistral-7b-instruct',
  toolUse: 'l3-sthenomaidblackroot-8b-v1-i1@q4_k_s',
  summarize: 'liquid/lfm2-1.2b',
});

/**
 * Smart Model Router
 * Selects optimal model based on task type and available models
 */
export class ModelRouter {
  #preferSpeed;
  #defaultModel;
  #loadedModels = new Set();
  #availableModels = new Map();

  constructor(options = {}) {
    this.#preferSpeed = options.preferSpeed ?? false;
    this.#defaultModel = options.defaultModel || 'qwen/qwen2.5-7b-instruct';
    
    logger.info('Model router initialized', {
      preferSpeed: this.#preferSpeed,
      defaultModel: this.#defaultModel,
    });
  }

  /**
   * Update available models from LM Studio
   * @param {Array} models - List of model objects from LM Studio
   */
  updateAvailableModels(models) {
    this.#loadedModels.clear();
    this.#availableModels.clear();

    for (const model of models) {
      const modelId = model.id || model;
      this.#loadedModels.add(modelId);
      
      // Try to find profile
      const profile = this.getModelProfile(modelId);
      this.#availableModels.set(modelId, {
        id: modelId,
        profile,
        loaded: true,
      });
    }

    logger.info(`Updated available models: ${this.#loadedModels.size}`);
  }

  /**
   * Get model profile by ID (fuzzy match)
   * @param {string} modelId - Model identifier
   * @returns {Object|null} Model profile or null
   */
  getModelProfile(modelId) {
    const lower = modelId.toLowerCase();
    
    // Exact match first
    if (MODEL_PROFILES[modelId]) {
      return MODEL_PROFILES[modelId];
    }

    // Fuzzy match by partial name
    for (const [key, profile] of Object.entries(MODEL_PROFILES)) {
      if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
        return profile;
      }
    }

    // Check for common model families
    if (lower.includes('qwen')) {
      return MODEL_PROFILES['qwen/qwen2.5-7b-instruct'];
    }
    if (lower.includes('llama')) {
      return MODEL_PROFILES['llama-3.1-8b-instruct'];
    }
    if (lower.includes('mistral')) {
      return MODEL_PROFILES['mistral-7b-instruct'];
    }

    return null;
  }

  /**
   * Detect task type from user message
   * @param {string} message - User's input message
   * @returns {string} Detected task type
   */
  detectTaskType(message) {
    const lower = message.toLowerCase();

    // Creative writing indicators
    if (/\b(write|story|poem|creative|imagine|fiction|narrative)\b/.test(lower)) {
      return 'creative';
    }

    // Reasoning indicators
    if (/\b(why|explain|analyze|reason|logic|think through|step by step)\b/.test(lower)) {
      return 'reasoning';
    }

    // Summarization indicators
    if (/\b(summarize|summary|brief|tldr|main points|key takeaways|overview)\b/.test(lower)) {
      return 'summarize';
    }

    // Tool use indicators
    if (/\b(fetch|search|store|save|memory|remember|find|look up|get.*from|create.*in)\b/.test(lower)) {
      return 'toolUse';
    }

    // Instruction following
    if (/\b(list|steps|instructions|how to|format|exactly|precisely|generate|make)\b/.test(lower)) {
      return 'instruction';
    }

    // Default to chat
    return 'chat';
  }

  /**
   * Select optimal model for a task
   * @param {string} taskType - Type of task (from TASK_TYPES)
   * @param {Object} options - Selection options
   * @returns {Object} Selection result with model and reasoning
   */
  selectModel(taskType, options = {}) {
    const task = TASK_TYPES[taskType] || TASK_TYPES.chat;
    const preferSpeed = options.preferSpeed ?? this.#preferSpeed;
    const requireLoaded = options.requireLoaded ?? true;

    // If we have a known best model for this task, check if it's available
    const bestKnown = TASK_BEST_MODELS[taskType];
    if (bestKnown && this.#loadedModels.has(bestKnown)) {
      const profile = this.getModelProfile(bestKnown);
      if (!profile?.disabled) {
        logger.info(`Using benchmark-best model: ${bestKnown} for ${taskType}`);
        return {
          model: bestKnown,
          profile,
          reasoning: `Benchmark-best model for ${task.name}`,
          taskType,
        };
      }
    }

    // Build candidate list
    let candidates = Array.from(this.#availableModels.entries())
      .map(([id, data]) => ({
        id,
        profile: data.profile || this.#createDefaultProfile(id),
        loaded: data.loaded,
      }))
      .filter(c => {
        if (requireLoaded && !c.loaded) return false;
        if (c.profile.disabled) return false;
        if (c.profile.quality < task.minQuality) return false;
        
        // Filter by task-specific score if available
        const taskScore = c.profile.taskScores?.[task.taskId];
        if (taskScore !== undefined && taskScore < task.minTaskScore) return false;
        
        // Filter by context length if specified
        if (options.minContext && c.profile.contextLength < options.minContext) return false;
        
        return true;
      });

    if (candidates.length === 0) {
      logger.warn(`No models meet requirements for ${taskType}, using default`);
      return {
        model: this.#defaultModel,
        profile: this.getModelProfile(this.#defaultModel),
        reasoning: 'Fallback to default model',
        taskType,
      };
    }

    // Score candidates
    candidates = candidates.map(c => {
      let score = 0;
      
      // Task-specific score (primary factor)
      const taskScore = c.profile.taskScores?.[task.taskId] || 50;
      score += taskScore * 2;

      // Quality score
      score += c.profile.quality;

      // Speed bonus if preferring speed
      if (preferSpeed) {
        score += Math.min(c.profile.speed || 0, 50);
      }

      // Strength bonus
      if (c.profile.strengths?.includes(task.taskId)) {
        score += 15;
      }

      // Weakness penalty
      if (c.profile.weaknesses?.includes(task.taskId)) {
        score -= 15;
      }

      // Tier preference
      if (preferSpeed && c.profile.tier === 'speed') {
        score += 10;
      } else if (!preferSpeed && c.profile.tier === 'quality') {
        score += 10;
      } else if (c.profile.tier === task.preferTier) {
        score += 5;
      }

      return { ...c, score };
    });

    // Sort by score descending
    candidates.sort((a, b) => b.score - a.score);

    const selected = candidates[0];
    logger.info(`Selected model: ${selected.id} (score: ${selected.score}) for ${taskType}`);

    return {
      model: selected.id,
      profile: selected.profile,
      reasoning: `Best available model for ${task.name} (score: ${selected.score})`,
      taskType,
      alternatives: candidates.slice(1, 4).map(c => c.id),
    };
  }

  /**
   * Create default profile for unknown models
   * @param {string} modelId - Model identifier
   * @returns {Object} Default profile
   */
  #createDefaultProfile(modelId) {
    return {
      quality: 50,
      speed: 20,
      taskScores: {
        reasoning: 50,
        creative: 50,
        instruction: 50,
        chat: 50,
        toolUse: 50,
        summarize: 50,
      },
      strengths: [],
      weaknesses: [],
      contextLength: 4096,
      notes: 'Unknown model - using default profile',
      tier: 'balanced',
    };
  }

  /**
   * Get recommendations for all task types
   * @returns {Object} Recommendations per task
   */
  getRecommendations() {
    const recommendations = {};
    
    for (const taskType of Object.keys(TASK_TYPES)) {
      recommendations[taskType] = this.selectModel(taskType);
    }
    
    return recommendations;
  }

  /**
   * Set speed preference
   * @param {boolean} preferSpeed - Whether to prefer speed over quality
   */
  setSpeedPreference(preferSpeed) {
    this.#preferSpeed = preferSpeed;
    logger.info(`Speed preference updated: ${preferSpeed}`);
  }

  /**
   * Get current configuration
   * @returns {Object} Current config
   */
  getConfig() {
    return {
      preferSpeed: this.#preferSpeed,
      defaultModel: this.#defaultModel,
      loadedModels: Array.from(this.#loadedModels),
      availableCount: this.#availableModels.size,
    };
  }
}

/**
 * Singleton instance
 */
let routerInstance = null;

/**
 * Get or create the model router instance
 * @param {Object} options - Router options
 * @returns {ModelRouter}
 */
export function getModelRouter(options = {}) {
  if (!routerInstance) {
    routerInstance = new ModelRouter(options);
  }
  return routerInstance;
}

export default ModelRouter;
