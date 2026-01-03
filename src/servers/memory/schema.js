/**
 * BambiSleep™ Church MCP Control Tower
 * Memory Schema - Entity types, relations, and observation utilities
 */

import { createLogger } from '../../utils/logger.js';

const logger = createLogger('memory-schema');

// ============================================================================
// ENTITY TYPE DEFINITIONS
// ============================================================================

/**
 * Entity type prefixes for compartmentalization
 */
export const ENTITY_TYPES = Object.freeze({
  // User data
  USER_PROFILE: 'user:profile',
  USER_PREFERENCE: 'user:preference',
  USER_PATTERN: 'user:pattern',
  USER_EXPERTISE: 'user:expertise',
  USER_GOAL: 'user:goal',

  // Conversation data
  CONVERSATION_SESSION: 'conversation:session',
  CONVERSATION_SUMMARY: 'conversation:summary',
  CONVERSATION_CONTEXT: 'conversation:context',
  CONVERSATION_TOPIC: 'conversation:topic',
  CONVERSATION_DECISION: 'conversation:decision',

  // Workspace data
  WORKSPACE_PROJECT: 'workspace:project',
  WORKSPACE_FILE: 'workspace:file',
  WORKSPACE_PATTERN: 'workspace:pattern',
  WORKSPACE_CONVENTION: 'workspace:convention',
  WORKSPACE_DEPENDENCY: 'workspace:dependency',

  // Memory metadata
  MEMORY_INDEX: 'memory:index',
  MEMORY_STATS: 'memory:stats',
  MEMORY_CHECKPOINT: 'memory:checkpoint',
});

/**
 * Get all entity types for a compartment
 * @param {string} compartment - 'user' | 'conversation' | 'workspace' | 'memory'
 * @returns {string[]} Array of entity types
 */
export function getEntityTypesByCompartment(compartment) {
  return Object.values(ENTITY_TYPES).filter(type => type.startsWith(`${compartment}:`));
}

// ============================================================================
// RELATION TYPE DEFINITIONS
// ============================================================================

/**
 * Relation type vocabulary
 */
export const RELATION_TYPES = Object.freeze({
  // User relations
  HAS_PREFERENCE: 'has_preference',
  EXHIBITS_PATTERN: 'exhibits_pattern',
  HAS_EXPERTISE_IN: 'has_expertise_in',
  WORKING_ON: 'working_on',

  // Conversation relations
  SUMMARIZED_IN: 'summarized_in',
  DISCUSSED_TOPIC: 'discussed_topic',
  MADE_DECISION: 'made_decision',
  MENTIONED: 'mentioned',
  CONTINUES_FROM: 'continues_from',

  // Workspace relations
  CONTAINS_FILE: 'contains_file',
  IMPORTS: 'imports',
  EXPORTS_TO: 'exports_to',
  FOLLOWS_PATTERN: 'follows_pattern',
  FOLLOWS_CONVENTION: 'follows_convention',

  // Cross-domain relations
  MODIFIED_IN: 'modified_in',
  PREFERS_FOR: 'prefers_for',
  LEARNED_FROM: 'learned_from',
});

// ============================================================================
// OBSERVATION SOURCE DEFINITIONS
// ============================================================================

/**
 * Observation source types with base confidence
 */
export const OBSERVATION_SOURCES = Object.freeze({
  EXPLICIT_SETTING: { name: 'explicit_setting', baseConfidence: 1.0, decayHalfLife: Infinity },
  USER_CORRECTION: { name: 'user_correction', baseConfidence: 0.95, decayHalfLife: 180 },
  DIRECT_STATEMENT: { name: 'direct_statement', baseConfidence: 0.9, decayHalfLife: 90 },
  REPEATED_BEHAVIOR: { name: 'repeated_behavior', baseConfidence: 0.8, decayHalfLife: 30 },
  SINGLE_OBSERVATION: { name: 'single_observation', baseConfidence: 0.5, decayHalfLife: 14 },
  INFERENCE: { name: 'inference', baseConfidence: 0.5, decayHalfLife: 7 },
  DEFAULT: { name: 'default', baseConfidence: 0.1, decayHalfLife: Infinity },
});

/**
 * Get source config by name
 * @param {string} sourceName - Source name
 * @returns {Object|null} Source config or null
 */
export function getSourceConfig(sourceName) {
  return Object.values(OBSERVATION_SOURCES).find(s => s.name === sourceName) || null;
}

// ============================================================================
// OBSERVATION UTILITIES
// ============================================================================

/**
 * Format an observation with timestamp and metadata
 * @param {string} key - Observation key (e.g., 'theme', 'value')
 * @param {*} value - Observation value
 * @param {string} [source] - Source type name
 * @param {number} [confidence] - Confidence score (0-1)
 * @returns {string} Formatted observation string
 */
export function formatObservation(key, value, source = null, confidence = null) {
  const timestamp = new Date().toISOString();
  
  // Handle different value types
  let valueStr;
  if (value === null || value === undefined) {
    valueStr = 'null';
  } else if (typeof value === 'object') {
    valueStr = JSON.stringify(value);
  } else {
    valueStr = String(value);
  }

  // Build observation parts
  const parts = [`[${timestamp}] ${key}: ${valueStr}`];
  
  if (source) {
    parts.push(`[${timestamp}] source: ${source}`);
  }
  if (confidence !== null) {
    parts.push(`[${timestamp}] confidence: ${confidence.toFixed(2)}`);
  }

  return parts.join('\n');
}

/**
 * Format a simple observation without key-value structure
 * @param {string} text - Observation text
 * @returns {string} Timestamped observation
 */
export function formatSimpleObservation(text) {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] ${text}`;
}

/**
 * Parse an observation string into components
 * @param {string} observationString - Raw observation string
 * @returns {Object} Parsed observation { timestamp, key, value, raw }
 */
export function parseObservation(observationString) {
  const result = {
    timestamp: null,
    key: null,
    value: null,
    raw: observationString,
  };

  // Extract timestamp [YYYY-MM-DDTHH:mm:ss.sssZ]
  const timestampMatch = observationString.match(/^\[(\d{4}-\d{2}-\d{2}T[\d:.]+Z?)\]\s*/);
  if (timestampMatch) {
    result.timestamp = new Date(timestampMatch[1]);
    observationString = observationString.slice(timestampMatch[0].length);
  }

  // Check for key: value format
  const keyValueMatch = observationString.match(/^(\w+):\s*(.*)$/);
  if (keyValueMatch) {
    result.key = keyValueMatch[1];
    const rawValue = keyValueMatch[2].trim();
    
    // Try to parse JSON values
    if (rawValue.startsWith('{') || rawValue.startsWith('[')) {
      try {
        result.value = JSON.parse(rawValue);
      } catch {
        result.value = rawValue;
      }
    } else if (rawValue === 'null') {
      result.value = null;
    } else if (rawValue === 'true') {
      result.value = true;
    } else if (rawValue === 'false') {
      result.value = false;
    } else if (!isNaN(Number(rawValue)) && rawValue !== '') {
      result.value = Number(rawValue);
    } else {
      result.value = rawValue;
    }
  } else {
    // Simple observation without key
    result.value = observationString;
  }

  return result;
}

/**
 * Parse multiple observations from an entity
 * @param {string[]} observations - Array of observation strings
 * @returns {Object} Map of key to { value, timestamp, confidence, source }
 */
export function parseObservations(observations) {
  const result = {};
  let currentSource = null;
  let currentConfidence = null;

  for (const obs of observations) {
    const parsed = parseObservation(obs);
    
    if (parsed.key === 'source') {
      currentSource = parsed.value;
    } else if (parsed.key === 'confidence') {
      currentConfidence = parsed.value;
    } else if (parsed.key) {
      result[parsed.key] = {
        value: parsed.value,
        timestamp: parsed.timestamp,
        source: currentSource,
        confidence: currentConfidence,
      };
      // Reset for next key
      currentSource = null;
      currentConfidence = null;
    }
  }

  return result;
}

// ============================================================================
// ENTITY VALIDATION
// ============================================================================

/**
 * Validate an entity matches its type schema
 * @param {Object} entity - Entity to validate { name, entityType, observations }
 * @param {string} [expectedType] - Expected entity type (if known)
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateEntity(entity, expectedType = null) {
  const errors = [];

  // Basic structure validation
  if (!entity || typeof entity !== 'object') {
    return { valid: false, errors: ['Entity must be an object'] };
  }
  if (!entity.name || typeof entity.name !== 'string') {
    errors.push('Entity must have a string name');
  }
  if (!entity.entityType || typeof entity.entityType !== 'string') {
    errors.push('Entity must have a string entityType');
  }
  if (!Array.isArray(entity.observations)) {
    errors.push('Entity must have an observations array');
  }

  // Type-specific validation
  if (expectedType && entity.entityType !== expectedType) {
    errors.push(`Expected entityType '${expectedType}', got '${entity.entityType}'`);
  }

  // Name should match type prefix
  if (entity.name && entity.entityType) {
    const expectedPrefix = entity.entityType.split(':').slice(0, 2).join(':');
    if (!entity.name.startsWith(expectedPrefix)) {
      errors.push(`Entity name '${entity.name}' should start with '${expectedPrefix}'`);
    }
  }

  // Validate observation format
  if (Array.isArray(entity.observations)) {
    for (let i = 0; i < entity.observations.length; i++) {
      const obs = entity.observations[i];
      if (typeof obs !== 'string') {
        errors.push(`Observation at index ${i} must be a string`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Create a valid entity from parts
 * @param {string} type - Entity type from ENTITY_TYPES
 * @param {string} suffix - Entity name suffix (e.g., 'main', 'theme')
 * @param {Object} [data] - Initial data as key-value pairs
 * @param {string} [source] - Default source for observations
 * @returns {Object} Valid entity object
 */
export function createEntity(type, suffix, data = {}, source = 'default') {
  const name = `${type}:${suffix}`;
  const observations = [];

  for (const [key, value] of Object.entries(data)) {
    const sourceConfig = getSourceConfig(source);
    const confidence = sourceConfig ? sourceConfig.baseConfidence : 0.5;
    observations.push(...formatObservation(key, value, source, confidence).split('\n'));
  }

  return {
    name,
    entityType: type,
    observations,
  };
}

// ============================================================================
// CONFIDENCE CALCULATIONS
// ============================================================================

/**
 * Calculate confidence score based on source, age, and occurrences
 * @param {string} source - Source type name
 * @param {number} [daysSince=0] - Days since observation
 * @param {number} [occurrences=1] - Number of occurrences (for patterns)
 * @returns {number} Confidence score (0-1)
 */
export function calculateConfidence(source, daysSince = 0, occurrences = 1) {
  const sourceConfig = getSourceConfig(source);
  if (!sourceConfig) {
    logger.warn(`Unknown source type: ${source}`);
    return 0.5;
  }

  let confidence = sourceConfig.baseConfidence;

  // Apply occurrence boost (for repeated observations)
  if (occurrences > 1) {
    // Logarithmic boost: 2 occurrences = +0.1, 10 occurrences = +0.3
    const boost = Math.min(0.3, Math.log10(occurrences) * 0.15);
    confidence = Math.min(1.0, confidence + boost);
  }

  // Apply time decay
  confidence = applyDecay(confidence, daysSince, sourceConfig.decayHalfLife);

  return confidence;
}

/**
 * Apply exponential decay to a confidence value
 * @param {number} confidence - Initial confidence
 * @param {number} daysSince - Days since observation
 * @param {number} halfLife - Half-life in days (Infinity = no decay)
 * @returns {number} Decayed confidence
 */
export function applyDecay(confidence, daysSince, halfLife) {
  if (!Number.isFinite(halfLife) || halfLife <= 0 || daysSince <= 0) {
    return confidence;
  }

  // Exponential decay: C(t) = C0 * e^(-λt) where λ = ln(2)/halfLife
  const decayConstant = Math.LN2 / halfLife;
  const decayFactor = Math.exp(-decayConstant * daysSince);
  
  return confidence * decayFactor;
}

/**
 * Get days since a timestamp
 * @param {Date|string} timestamp - Timestamp to compare
 * @returns {number} Days since timestamp
 */
export function getDaysSince(timestamp) {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return diffMs / (1000 * 60 * 60 * 24);
}

// ============================================================================
// ENTITY NAME UTILITIES
// ============================================================================

/**
 * Generate a unique entity name
 * @param {string} type - Entity type
 * @param {string} [suffix] - Optional suffix
 * @returns {string} Unique entity name
 */
export function generateEntityName(type, suffix = null) {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 6);
  const id = suffix || `${timestamp}-${random}`;
  return `${type}:${id}`;
}

/**
 * Parse an entity name into components
 * @param {string} name - Entity name (e.g., 'user:preference:theme')
 * @returns {{ compartment: string, type: string, suffix: string }}
 */
export function parseEntityName(name) {
  const parts = name.split(':');
  return {
    compartment: parts[0] || null,
    type: parts.slice(0, 2).join(':'),
    suffix: parts.slice(2).join(':') || null,
  };
}

// ============================================================================
// SCHEMA HANDLERS (for API integration)
// ============================================================================

/**
 * Memory schema handlers for API routes
 */
export const memorySchemaHandlers = {
  /**
   * Get all entity types
   */
  getEntityTypes() {
    return ENTITY_TYPES;
  },

  /**
   * Get all relation types
   */
  getRelationTypes() {
    return RELATION_TYPES;
  },

  /**
   * Get observation sources with metadata
   */
  getObservationSources() {
    return OBSERVATION_SOURCES;
  },

  /**
   * Validate an entity
   */
  validateEntity(entity, expectedType = null) {
    return validateEntity(entity, expectedType);
  },

  /**
   * Create an entity from data
   */
  createEntity(type, suffix, data, source) {
    return createEntity(type, suffix, data, source);
  },

  /**
   * Calculate confidence
   */
  calculateConfidence(source, daysSince, occurrences) {
    return calculateConfidence(source, daysSince, occurrences);
  },
};

export default {
  ENTITY_TYPES,
  RELATION_TYPES,
  OBSERVATION_SOURCES,
  formatObservation,
  formatSimpleObservation,
  parseObservation,
  parseObservations,
  validateEntity,
  createEntity,
  calculateConfidence,
  applyDecay,
  getDaysSince,
  generateEntityName,
  parseEntityName,
  getEntityTypesByCompartment,
  getSourceConfig,
  memorySchemaHandlers,
};
