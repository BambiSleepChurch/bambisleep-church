/**
 * BambiSleep™ Church MCP Control Tower
 * User Model - Preferences, patterns, and profile management
 */

import { createLogger } from '../../utils/logger.js';
import { memoryGraph } from './graph.js';
import {
    ENTITY_TYPES,
    OBSERVATION_SOURCES,
    RELATION_TYPES,
    calculateConfidence,
    createEntity,
    formatObservation,
    getDaysSince,
    parseObservations
} from './schema.js';

const logger = createLogger('user-model');

// ============================================================================
// USER PREFERENCES CLASS
// ============================================================================

/**
 * Manages user preferences with confidence tracking
 */
export class UserPreferences {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Get a preference value
   * @param {string} category - Category (e.g., 'theme', 'editor', 'ai')
   * @param {string} key - Preference key
   * @returns {*} Preference value or null
   */
  get(category, key) {
    const entityName = `${ENTITY_TYPES.USER_PREFERENCE}:${category}`;
    const cached = this.cache.get(`${category}:${key}`);
    
    if (cached && Date.now() - cached.timestamp < 60000) {
      return cached.value;
    }

    // Load from memory graph
    const nodes = memoryGraph.openNodes([entityName]);
    if (nodes.length === 0) return null;

    const parsed = parseObservations(nodes[0].observations);
    const value = parsed[key]?.value ?? null;

    // Update cache
    this.cache.set(`${category}:${key}`, { value, timestamp: Date.now() });
    
    return value;
  }

  /**
   * Set a preference value
   * @param {string} category - Category
   * @param {string} key - Preference key
   * @param {*} value - Preference value
   * @param {string} [source='explicit_setting'] - How we learned this
   * @returns {boolean} Success
   */
  set(category, key, value, source = 'explicit_setting') {
    const entityName = `${ENTITY_TYPES.USER_PREFERENCE}:${category}`;
    const sourceConfig = OBSERVATION_SOURCES[source.toUpperCase().replace(/_/g, '_')] || 
                         OBSERVATION_SOURCES.EXPLICIT_SETTING;
    
    // Check if entity exists
    const existing = memoryGraph.openNodes([entityName]);
    
    if (existing.length === 0) {
      // Create new preference entity
      const entity = createEntity(
        ENTITY_TYPES.USER_PREFERENCE,
        category,
        { [key]: value },
        sourceConfig.name
      );
      memoryGraph.createEntities([entity]);
    } else {
      // Add observation to existing entity
      const observations = formatObservation(key, value, sourceConfig.name, sourceConfig.baseConfidence).split('\n');
      memoryGraph.addObservations(entityName, observations);
    }

    // Clear cache
    this.cache.delete(`${category}:${key}`);
    
    logger.info(`Set preference ${category}.${key}`, { value, source: sourceConfig.name });
    return true;
  }

  /**
   * Learn a preference from observation (lower confidence than explicit set)
   * @param {string} category - Category
   * @param {string} key - Preference key
   * @param {*} value - Observed value
   * @param {number} [confidence=0.5] - Initial confidence
   * @returns {boolean} Success
   */
  learn(category, key, value, confidence = 0.5) {
    const entityName = `${ENTITY_TYPES.USER_PREFERENCE}:${category}`;
    const existing = memoryGraph.openNodes([entityName]);
    
    // Don't override explicit settings with inferred ones
    if (existing.length > 0) {
      const parsed = parseObservations(existing[0].observations);
      if (parsed[key]?.source === 'explicit_setting') {
        logger.debug(`Skipping learned preference - explicit setting exists for ${key}`);
        return false;
      }
    }

    const observations = formatObservation(key, value, 'inference', confidence).split('\n');
    
    if (existing.length === 0) {
      const entity = {
        name: entityName,
        entityType: ENTITY_TYPES.USER_PREFERENCE,
        observations,
      };
      memoryGraph.createEntities([entity]);
    } else {
      memoryGraph.addObservations(entityName, observations);
    }

    this.cache.delete(`${category}:${key}`);
    logger.info(`Learned preference ${category}.${key}`, { value, confidence });
    return true;
  }

  /**
   * Get all preferences, optionally filtered by category
   * @param {string} [category] - Optional category filter
   * @returns {Object} Preferences by category
   */
  getAll(category = null) {
    const results = {};
    const graph = memoryGraph.readGraph();
    
    for (const entity of graph.entities) {
      if (entity.entityType !== ENTITY_TYPES.USER_PREFERENCE) continue;
      
      const entityCategory = entity.name.split(':').slice(2).join(':');
      if (category && entityCategory !== category) continue;
      
      const parsed = parseObservations(entity.observations);
      results[entityCategory] = {};
      
      for (const [key, data] of Object.entries(parsed)) {
        if (key !== 'source' && key !== 'confidence') {
          results[entityCategory][key] = data.value;
        }
      }
    }
    
    return results;
  }

  /**
   * Export all preferences as JSON
   * @returns {Object} Exportable preferences
   */
  export() {
    return this.getAll();
  }
}

// ============================================================================
// USER PATTERNS CLASS
// ============================================================================

/**
 * Tracks and detects user behavior patterns
 */
export class UserPatterns {
  constructor() {
    this.trackingBuffer = new Map();
  }

  /**
   * Track an occurrence of a pattern
   * @param {string} patternName - Pattern identifier
   * @param {Object} data - Pattern data/context
   * @returns {number} New occurrence count
   */
  track(patternName, data = {}) {
    const entityName = `${ENTITY_TYPES.USER_PATTERN}:${patternName}`;
    const existing = memoryGraph.openNodes([entityName]);
    
    const timestamp = new Date().toISOString();
    let occurrences = 1;
    
    if (existing.length > 0) {
      const parsed = parseObservations(existing[0].observations);
      occurrences = (parsed.occurrences?.value || 0) + 1;
      
      // Update observations
      const updates = [
        `[${timestamp}] occurrences: ${occurrences}`,
        `[${timestamp}] last_seen: ${timestamp}`,
      ];
      
      if (Object.keys(data).length > 0) {
        updates.push(`[${timestamp}] example: ${JSON.stringify(data)}`);
      }
      
      memoryGraph.addObservations(entityName, updates);
    } else {
      // Create new pattern entity
      const observations = [
        `[${timestamp}] description: ${patternName}`,
        `[${timestamp}] occurrences: 1`,
        `[${timestamp}] first_seen: ${timestamp}`,
        `[${timestamp}] last_seen: ${timestamp}`,
        `[${timestamp}] source: single_observation`,
        `[${timestamp}] confidence: 0.5`,
      ];
      
      if (Object.keys(data).length > 0) {
        observations.push(`[${timestamp}] example: ${JSON.stringify(data)}`);
      }
      
      memoryGraph.createEntities([{
        name: entityName,
        entityType: ENTITY_TYPES.USER_PATTERN,
        observations,
      }]);

      // Link to user profile
      this.#linkToProfile(entityName);
    }
    
    logger.debug(`Tracked pattern: ${patternName}`, { occurrences });
    return occurrences;
  }

  /**
   * Link pattern to user profile via relation
   * @private
   */
  #linkToProfile(patternEntityName) {
    const profileName = `${ENTITY_TYPES.USER_PROFILE}:main`;
    memoryGraph.createRelations([{
      from: profileName,
      to: patternEntityName,
      relationType: RELATION_TYPES.EXHIBITS_PATTERN,
    }]);
  }

  /**
   * Detect patterns from behavior data
   * @param {Object} behaviorData - Behavior to analyze
   * @returns {Object[]} Detected patterns
   */
  detect(behaviorData) {
    const detected = [];
    
    // Detect coding style patterns
    if (behaviorData.code) {
      if (behaviorData.code.includes('async ') && behaviorData.code.includes('await ')) {
        detected.push({ name: 'prefers-async-await', confidence: 0.7 });
      }
      if (behaviorData.code.match(/\bconst\b/g)?.length > behaviorData.code.match(/\blet\b/g)?.length) {
        detected.push({ name: 'prefers-const-over-let', confidence: 0.6 });
      }
      if (behaviorData.code.includes('=>')) {
        detected.push({ name: 'uses-arrow-functions', confidence: 0.7 });
      }
    }

    // Detect communication patterns
    if (behaviorData.message) {
      if (behaviorData.message.length < 50) {
        detected.push({ name: 'prefers-concise-messages', confidence: 0.5 });
      }
      if (behaviorData.message.includes('?')) {
        detected.push({ name: 'asks-questions', confidence: 0.4 });
      }
    }

    // Track detected patterns
    for (const pattern of detected) {
      this.track(pattern.name, behaviorData);
    }

    return detected;
  }

  /**
   * Get a specific pattern's details
   * @param {string} patternName - Pattern name
   * @returns {Object|null} Pattern data
   */
  get(patternName) {
    const entityName = `${ENTITY_TYPES.USER_PATTERN}:${patternName}`;
    const nodes = memoryGraph.openNodes([entityName]);
    
    if (nodes.length === 0) return null;
    
    const parsed = parseObservations(nodes[0].observations);
    const daysSince = parsed.last_seen?.timestamp 
      ? getDaysSince(parsed.last_seen.timestamp) 
      : 0;
    
    return {
      name: patternName,
      description: parsed.description?.value || patternName,
      occurrences: parsed.occurrences?.value || 0,
      firstSeen: parsed.first_seen?.value,
      lastSeen: parsed.last_seen?.value,
      confidence: calculateConfidence(
        parsed.source?.value || 'single_observation',
        daysSince,
        parsed.occurrences?.value || 1
      ),
      examples: this.#getExamples(nodes[0].observations),
    };
  }

  /**
   * Extract examples from observations
   * @private
   */
  #getExamples(observations) {
    const examples = [];
    for (const obs of observations) {
      if (obs.includes('example:')) {
        try {
          const json = obs.split('example:')[1].trim();
          examples.push(JSON.parse(json));
        } catch {
          // Skip invalid JSON
        }
      }
    }
    return examples.slice(-5); // Last 5 examples
  }

  /**
   * Get all patterns above minimum confidence
   * @param {number} [minConfidence=0.5] - Minimum confidence threshold
   * @returns {Object[]} Confident patterns
   */
  getConfident(minConfidence = 0.5) {
    const graph = memoryGraph.readGraph();
    const patterns = [];
    
    for (const entity of graph.entities) {
      if (entity.entityType !== ENTITY_TYPES.USER_PATTERN) continue;
      
      const patternName = entity.name.split(':').slice(2).join(':');
      const pattern = this.get(patternName);
      
      if (pattern && pattern.confidence >= minConfidence) {
        patterns.push(pattern);
      }
    }
    
    return patterns.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Apply time-based decay to all patterns
   * @returns {number} Number of patterns decayed
   */
  decay() {
    const graph = memoryGraph.readGraph();
    let decayed = 0;
    
    for (const entity of graph.entities) {
      if (entity.entityType !== ENTITY_TYPES.USER_PATTERN) continue;
      
      const parsed = parseObservations(entity.observations);
      if (!parsed.last_seen?.timestamp) continue;
      
      const daysSince = getDaysSince(parsed.last_seen.timestamp);
      if (daysSince > 30) { // 30 day threshold
        decayed++;
        logger.debug(`Pattern decay applied: ${entity.name}`, { daysSince });
      }
    }
    
    return decayed;
  }
}

// ============================================================================
// USER PROFILE CLASS
// ============================================================================

/**
 * Manages core user profile data
 */
export class UserProfile {
  constructor() {
    this.entityName = `${ENTITY_TYPES.USER_PROFILE}:main`;
  }

  /**
   * Ensure profile entity exists
   * @private
   */
  #ensureExists() {
    const existing = memoryGraph.openNodes([this.entityName]);
    if (existing.length === 0) {
      const timestamp = new Date().toISOString();
      memoryGraph.createEntities([{
        name: this.entityName,
        entityType: ENTITY_TYPES.USER_PROFILE,
        observations: [
          `[${timestamp}] created_at: ${timestamp}`,
          `[${timestamp}] source: default`,
        ],
      }]);
      logger.info('Created user profile entity');
    }
  }

  /**
   * Get a profile field
   * @param {string} field - Field name
   * @returns {*} Field value or null
   */
  get(field) {
    this.#ensureExists();
    const nodes = memoryGraph.openNodes([this.entityName]);
    if (nodes.length === 0) return null;
    
    const parsed = parseObservations(nodes[0].observations);
    return parsed[field]?.value ?? null;
  }

  /**
   * Set a profile field
   * @param {string} field - Field name
   * @param {*} value - Field value
   * @returns {boolean} Success
   */
  set(field, value) {
    this.#ensureExists();
    const timestamp = new Date().toISOString();
    const observations = [
      `[${timestamp}] ${field}: ${typeof value === 'object' ? JSON.stringify(value) : value}`,
      `[${timestamp}] source: explicit_setting`,
    ];
    
    memoryGraph.addObservations(this.entityName, observations);
    logger.info(`Set profile field: ${field}`, { value });
    return true;
  }

  /**
   * Get user expertise level in a domain
   * @param {string} domain - Domain/skill name
   * @returns {Object|null} Expertise data
   */
  getExpertise(domain) {
    const entityName = `${ENTITY_TYPES.USER_EXPERTISE}:${domain}`;
    const nodes = memoryGraph.openNodes([entityName]);
    
    if (nodes.length === 0) return null;
    
    const parsed = parseObservations(nodes[0].observations);
    return {
      domain,
      level: parsed.level?.value || 'unknown',
      confidence: parsed.confidence?.value || 0.5,
      lastAssessed: parsed.last_assessed?.value,
    };
  }

  /**
   * Update user expertise in a domain
   * @param {string} domain - Domain/skill name
   * @param {string} level - Level: beginner|intermediate|advanced|expert
   * @param {number} [confidence=0.7] - Confidence in assessment
   * @returns {boolean} Success
   */
  updateExpertise(domain, level, confidence = 0.7) {
    const entityName = `${ENTITY_TYPES.USER_EXPERTISE}:${domain}`;
    const existing = memoryGraph.openNodes([entityName]);
    const timestamp = new Date().toISOString();
    
    const observations = [
      `[${timestamp}] level: ${level}`,
      `[${timestamp}] confidence: ${confidence}`,
      `[${timestamp}] last_assessed: ${timestamp}`,
      `[${timestamp}] source: inference`,
    ];
    
    if (existing.length === 0) {
      memoryGraph.createEntities([{
        name: entityName,
        entityType: ENTITY_TYPES.USER_EXPERTISE,
        observations,
      }]);
      
      // Link to profile
      memoryGraph.createRelations([{
        from: this.entityName,
        to: entityName,
        relationType: RELATION_TYPES.HAS_EXPERTISE_IN,
      }]);
    } else {
      memoryGraph.addObservations(entityName, observations);
    }
    
    logger.info(`Updated expertise: ${domain}`, { level, confidence });
    return true;
  }

  /**
   * Get user's communication style preference
   * @returns {string} Style: concise|detailed|technical
   */
  getCommunicationStyle() {
    return this.get('communication_style') || 'concise';
  }

  /**
   * Get full profile summary
   * @returns {Object} Profile data
   */
  getSummary() {
    this.#ensureExists();
    const nodes = memoryGraph.openNodes([this.entityName]);
    if (nodes.length === 0) return {};
    
    const parsed = parseObservations(nodes[0].observations);
    const summary = {};
    
    for (const [key, data] of Object.entries(parsed)) {
      if (key !== 'source' && key !== 'confidence') {
        summary[key] = data.value;
      }
    }
    
    return summary;
  }
}

// ============================================================================
// SINGLETON INSTANCES
// ============================================================================

let preferences = null;
let patterns = null;
let profile = null;

/**
 * Get UserPreferences singleton
 */
export function getUserPreferences() {
  if (!preferences) {
    preferences = new UserPreferences();
  }
  return preferences;
}

/**
 * Get UserPatterns singleton
 */
export function getUserPatterns() {
  if (!patterns) {
    patterns = new UserPatterns();
  }
  return patterns;
}

/**
 * Get UserProfile singleton
 */
export function getUserProfile() {
  if (!profile) {
    profile = new UserProfile();
  }
  return profile;
}

// ============================================================================
// USER MODEL HANDLERS (for API integration)
// ============================================================================

/**
 * User model handlers for REST API
 */
export const userModelHandlers = {
  // Profile handlers
  getProfile() {
    return getUserProfile().getSummary();
  },

  setProfileField(field, value) {
    return getUserProfile().set(field, value);
  },

  getExpertise(domain) {
    return getUserProfile().getExpertise(domain);
  },

  updateExpertise(domain, level, confidence) {
    return getUserProfile().updateExpertise(domain, level, confidence);
  },

  // Preference handlers
  getPreference(category, key) {
    return getUserPreferences().get(category, key);
  },

  setPreference(category, key, value, source) {
    return getUserPreferences().set(category, key, value, source);
  },

  learnPreference(category, key, value, confidence) {
    return getUserPreferences().learn(category, key, value, confidence);
  },

  getAllPreferences(category) {
    return getUserPreferences().getAll(category);
  },

  exportPreferences() {
    return getUserPreferences().export();
  },

  // Pattern handlers
  trackPattern(patternName, data) {
    return getUserPatterns().track(patternName, data);
  },

  detectPatterns(behaviorData) {
    return getUserPatterns().detect(behaviorData);
  },

  getPattern(patternName) {
    return getUserPatterns().get(patternName);
  },

  getConfidentPatterns(minConfidence) {
    return getUserPatterns().getConfident(minConfidence);
  },

  applyPatternDecay() {
    return getUserPatterns().decay();
  },
};

export default {
  UserPreferences,
  UserPatterns,
  UserProfile,
  getUserPreferences,
  getUserPatterns,
  getUserProfile,
  userModelHandlers,
};
