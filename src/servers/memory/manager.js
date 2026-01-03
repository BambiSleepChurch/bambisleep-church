/**
 * BambiSleep™ Church MCP Control Tower
 * Memory Manager - Lifecycle, search, and persistence operations
 */

import { createLogger } from '../../utils/logger.js';
import { mongoHandlers } from '../mongodb.js';
import { memoryGraph } from './graph.js';
import {
    applyDecay,
    getDaysSince,
    getSourceConfig,
    parseObservations
} from './schema.js';

const logger = createLogger('memory-manager');

// ============================================================================
// MEMORY LIFECYCLE CLASS
// ============================================================================

/**
 * Manages memory lifecycle - decay, cleanup, archiving
 */
export class MemoryLifecycle {
  #archiveCollection = 'memory_archive';
  #lastDecayRun = null;

  /**
   * Apply confidence decay to all entities based on age
   * @returns {Object} Decay statistics
   */
  applyDecay() {
    const graph = memoryGraph.readGraph();
    const stats = {
      processed: 0,
      decayed: 0,
      unchanged: 0,
    };

    for (const entity of graph.entities) {
      stats.processed++;
      
      const parsed = parseObservations(entity.observations);
      const lastSeen = parsed.last_seen?.timestamp || 
                       parsed.last_accessed?.timestamp ||
                       parsed.created_at?.timestamp;
      
      if (!lastSeen) {
        stats.unchanged++;
        continue;
      }

      const daysSince = getDaysSince(lastSeen);
      const source = parsed.source?.value || 'default';
      const sourceConfig = getSourceConfig(source);
      
      if (!sourceConfig || !Number.isFinite(sourceConfig.decayHalfLife)) {
        stats.unchanged++;
        continue;
      }

      const currentConfidence = parsed.confidence?.value;
      if (currentConfidence === undefined) {
        stats.unchanged++;
        continue;
      }

      const newConfidence = applyDecay(
        currentConfidence,
        daysSince,
        sourceConfig.decayHalfLife
      );

      // Only update if confidence changed significantly
      if (Math.abs(newConfidence - currentConfidence) > 0.01) {
        const timestamp = new Date().toISOString();
        memoryGraph.addObservations(entity.name, [
          `[${timestamp}] confidence: ${newConfidence.toFixed(3)}`,
          `[${timestamp}] decay_applied: ${timestamp}`,
        ]);
        stats.decayed++;
      } else {
        stats.unchanged++;
      }
    }

    this.#lastDecayRun = new Date();
    logger.info('Applied decay to memory', stats);
    return stats;
  }

  /**
   * Cleanup low-confidence entities
   * @param {number} [threshold=0.1] - Minimum confidence to keep
   * @returns {Object} Cleanup statistics
   */
  cleanup(threshold = 0.1) {
    const graph = memoryGraph.readGraph();
    const toDelete = [];
    
    for (const entity of graph.entities) {
      // Skip system entities
      if (entity.entityType.startsWith('memory:')) continue;
      
      const parsed = parseObservations(entity.observations);
      const confidence = parsed.confidence?.value;
      
      if (confidence !== undefined && confidence < threshold) {
        toDelete.push(entity.name);
      }
    }

    if (toDelete.length > 0) {
      memoryGraph.deleteEntities(toDelete);
      logger.info('Cleaned up low-confidence entities', { 
        count: toDelete.length, 
        threshold 
      });
    }

    return {
      deleted: toDelete.length,
      threshold,
      deletedEntities: toDelete,
    };
  }

  /**
   * Archive old entities to MongoDB
   * @param {number} [olderThanDays=30] - Archive entities older than this
   * @returns {Promise<Object>} Archive statistics
   */
  async archive(olderThanDays = 30) {
    const graph = memoryGraph.readGraph();
    const toArchive = [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    for (const entity of graph.entities) {
      const parsed = parseObservations(entity.observations);
      const lastSeen = parsed.last_seen?.timestamp || 
                       parsed.last_accessed?.timestamp;
      
      if (lastSeen && new Date(lastSeen) < cutoffDate) {
        toArchive.push({
          entity,
          archivedAt: new Date().toISOString(),
          reason: `older_than_${olderThanDays}_days`,
        });
      }
    }

    if (toArchive.length === 0) {
      return { archived: 0 };
    }

    try {
      // Store in MongoDB
      await mongoHandlers.insert(this.#archiveCollection, toArchive);
      
      // Remove from active memory
      const entityNames = toArchive.map(a => a.entity.name);
      memoryGraph.deleteEntities(entityNames);

      logger.info('Archived entities to MongoDB', { 
        count: toArchive.length,
        olderThanDays 
      });

      return {
        archived: toArchive.length,
        cutoffDate: cutoffDate.toISOString(),
      };
    } catch (error) {
      logger.error('Failed to archive entities', { error: error.message });
      return {
        archived: 0,
        error: error.message,
      };
    }
  }

  /**
   * Restore archived entities from MongoDB
   * @param {string[]} entityNames - Entity names to restore
   * @returns {Promise<Object>} Restore statistics
   */
  async restore(entityNames) {
    try {
      const archived = await mongoHandlers.query(this.#archiveCollection, {
        'entity.name': { $in: entityNames },
      });

      if (archived.length === 0) {
        return { restored: 0 };
      }

      // Restore to memory graph
      const entities = archived.map(a => a.entity);
      memoryGraph.createEntities(entities);

      // Remove from archive
      await mongoHandlers.delete(this.#archiveCollection, {
        'entity.name': { $in: entityNames },
      });

      logger.info('Restored entities from archive', { count: entities.length });

      return {
        restored: entities.length,
        entities: entityNames,
      };
    } catch (error) {
      logger.error('Failed to restore entities', { error: error.message });
      return {
        restored: 0,
        error: error.message,
      };
    }
  }

  /**
   * Get memory statistics
   * @returns {Object} Memory stats
   */
  getStats() {
    const graph = memoryGraph.readGraph();
    const stats = {
      totalEntities: graph.entities.length,
      totalRelations: graph.relations.length,
      byType: {},
      byConfidence: {
        high: 0,    // >= 0.8
        medium: 0,  // >= 0.5
        low: 0,     // < 0.5
      },
      lastDecayRun: this.#lastDecayRun?.toISOString() || null,
    };

    for (const entity of graph.entities) {
      // Count by type
      const type = entity.entityType;
      stats.byType[type] = (stats.byType[type] || 0) + 1;

      // Count by confidence
      const parsed = parseObservations(entity.observations);
      const confidence = parsed.confidence?.value;
      
      if (confidence !== undefined) {
        if (confidence >= 0.8) stats.byConfidence.high++;
        else if (confidence >= 0.5) stats.byConfidence.medium++;
        else stats.byConfidence.low++;
      }
    }

    return stats;
  }
}

// ============================================================================
// MEMORY SEARCH CLASS
// ============================================================================

/**
 * Advanced search capabilities for the knowledge graph
 */
export class MemorySearch {
  /**
   * Search entities by query
   * @param {string} query - Search query
   * @param {Object} [options] - Search options
   * @param {string[]} [options.types] - Filter by entity types
   * @param {number} [options.limit] - Max results
   * @returns {Object[]} Matching entities
   */
  search(query, options = {}) {
    const graph = memoryGraph.readGraph();
    const results = [];
    const queryLower = query.toLowerCase();

    for (const entity of graph.entities) {
      // Apply type filter
      if (options.types && !options.types.includes(entity.entityType)) {
        continue;
      }

      // Search in name
      let score = 0;
      if (entity.name.toLowerCase().includes(queryLower)) {
        score += 10;
      }

      // Search in observations
      for (const obs of entity.observations) {
        if (obs.toLowerCase().includes(queryLower)) {
          score += 5;
        }
      }

      if (score > 0) {
        const parsed = parseObservations(entity.observations);
        results.push({
          entity,
          score,
          confidence: parsed.confidence?.value,
          lastSeen: parsed.last_seen?.value || parsed.last_accessed?.value,
        });
      }
    }

    // Sort by score, then confidence
    results.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.confidence || 0) - (a.confidence || 0);
    });

    const limited = options.limit ? results.slice(0, options.limit) : results;
    return limited.map(r => ({
      name: r.entity.name,
      type: r.entity.entityType,
      score: r.score,
      confidence: r.confidence,
      lastSeen: r.lastSeen,
      observations: r.entity.observations,
    }));
  }

  /**
   * Search by entity type
   * @param {string} entityType - Entity type to search
   * @param {string} [query] - Optional text query
   * @returns {Object[]} Matching entities
   */
  searchByType(entityType, query = null) {
    const options = { types: [entityType] };
    
    if (query) {
      return this.search(query, options);
    }

    // Return all of type
    const graph = memoryGraph.readGraph();
    return graph.entities
      .filter(e => e.entityType === entityType)
      .map(entity => {
        const parsed = parseObservations(entity.observations);
        return {
          name: entity.name,
          type: entity.entityType,
          confidence: parsed.confidence?.value,
          lastSeen: parsed.last_seen?.value || parsed.last_accessed?.value,
          observations: entity.observations,
        };
      });
  }

  /**
   * Search entities within a time range
   * @param {Date} start - Start date
   * @param {Date} end - End date
   * @returns {Object[]} Entities in range
   */
  searchByTimeRange(start, end) {
    const graph = memoryGraph.readGraph();
    const results = [];

    for (const entity of graph.entities) {
      const parsed = parseObservations(entity.observations);
      const timestamp = parsed.last_seen?.timestamp || 
                       parsed.last_accessed?.timestamp ||
                       parsed.created_at?.timestamp;
      
      if (!timestamp) continue;

      const date = new Date(timestamp);
      if (date >= start && date <= end) {
        results.push({
          name: entity.name,
          type: entity.entityType,
          timestamp: timestamp.toISOString ? timestamp.toISOString() : timestamp,
          observations: entity.observations,
        });
      }
    }

    return results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Search by confidence range
   * @param {number} min - Minimum confidence
   * @param {number} max - Maximum confidence
   * @returns {Object[]} Entities in confidence range
   */
  searchByConfidence(min, max) {
    const graph = memoryGraph.readGraph();
    const results = [];

    for (const entity of graph.entities) {
      const parsed = parseObservations(entity.observations);
      const confidence = parsed.confidence?.value;
      
      if (confidence !== undefined && confidence >= min && confidence <= max) {
        results.push({
          name: entity.name,
          type: entity.entityType,
          confidence,
          observations: entity.observations,
        });
      }
    }

    return results.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get related entities
   * @param {string} entityName - Entity to find relations for
   * @param {number} [depth=1] - Relation depth to traverse
   * @returns {Object} Related entities graph
   */
  getRelated(entityName, depth = 1) {
    const graph = memoryGraph.readGraph();
    const related = new Map();
    const queue = [{ name: entityName, depth: 0 }];
    const visited = new Set([entityName]);

    while (queue.length > 0) {
      const { name, depth: currentDepth } = queue.shift();
      
      if (currentDepth >= depth) continue;

      // Find relations
      for (const relation of graph.relations) {
        let targetName = null;
        let direction = null;

        if (relation.from === name && !visited.has(relation.to)) {
          targetName = relation.to;
          direction = 'outgoing';
        } else if (relation.to === name && !visited.has(relation.from)) {
          targetName = relation.from;
          direction = 'incoming';
        }

        if (targetName) {
          visited.add(targetName);
          queue.push({ name: targetName, depth: currentDepth + 1 });
          
          const targetEntity = graph.entities.find(e => e.name === targetName);
          if (targetEntity) {
            related.set(targetName, {
              entity: targetEntity,
              relation: relation.relationType,
              direction,
              depth: currentDepth + 1,
            });
          }
        }
      }
    }

    return {
      source: entityName,
      maxDepth: depth,
      related: Array.from(related.values()),
    };
  }
}

// ============================================================================
// MEMORY SYNC CLASS
// ============================================================================

/**
 * Persistence layer for memory synchronization
 */
export class MemorySync {
  #syncCollection = 'memory_sync';
  #lastSyncTime = null;

  /**
   * Save memory graph to MongoDB
   * @returns {Promise<Object>} Sync result
   */
  async saveToMongoDB() {
    const graph = memoryGraph.readGraph();
    const timestamp = new Date();

    try {
      // Create snapshot document
      const snapshot = {
        timestamp: timestamp.toISOString(),
        entityCount: graph.entities.length,
        relationCount: graph.relations.length,
        entities: graph.entities,
        relations: graph.relations,
      };

      // Upsert to sync collection
      await mongoHandlers.update(
        this.#syncCollection,
        { _id: 'current' },
        { $set: snapshot },
        true // upsert
      );

      this.#lastSyncTime = timestamp;
      logger.info('Saved memory to MongoDB', {
        entities: graph.entities.length,
        relations: graph.relations.length,
      });

      return {
        success: true,
        timestamp: timestamp.toISOString(),
        entityCount: graph.entities.length,
        relationCount: graph.relations.length,
      };
    } catch (error) {
      logger.error('Failed to save memory to MongoDB', { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Load memory graph from MongoDB
   * @returns {Promise<Object>} Load result
   */
  async loadFromMongoDB() {
    try {
      const snapshots = await mongoHandlers.query(this.#syncCollection, {
        _id: 'current',
      });

      if (snapshots.length === 0) {
        logger.info('No saved memory found in MongoDB');
        return { success: true, loaded: 0 };
      }

      const snapshot = snapshots[0];
      
      // Restore entities
      if (snapshot.entities && snapshot.entities.length > 0) {
        memoryGraph.createEntities(snapshot.entities);
      }

      // Restore relations
      if (snapshot.relations && snapshot.relations.length > 0) {
        memoryGraph.createRelations(snapshot.relations);
      }

      this.#lastSyncTime = new Date(snapshot.timestamp);
      logger.info('Loaded memory from MongoDB', {
        entities: snapshot.entityCount,
        relations: snapshot.relationCount,
        savedAt: snapshot.timestamp,
      });

      return {
        success: true,
        loaded: snapshot.entityCount,
        relations: snapshot.relationCount,
        savedAt: snapshot.timestamp,
      };
    } catch (error) {
      logger.error('Failed to load memory from MongoDB', { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Save memory graph to JSON file
   * @param {string} path - File path
   * @returns {Promise<Object>} Save result
   */
  async saveToFile(path) {
    const { writeFile } = await import('fs/promises');
    const graph = memoryGraph.readGraph();
    const timestamp = new Date();

    try {
      const data = {
        version: '1.0.0',
        timestamp: timestamp.toISOString(),
        entities: graph.entities,
        relations: graph.relations,
      };

      await writeFile(path, JSON.stringify(data, null, 2), 'utf-8');

      logger.info('Saved memory to file', { path });
      return {
        success: true,
        path,
        timestamp: timestamp.toISOString(),
      };
    } catch (error) {
      logger.error('Failed to save memory to file', { path, error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Load memory graph from JSON file
   * @param {string} path - File path
   * @returns {Promise<Object>} Load result
   */
  async loadFromFile(path) {
    const { readFile, access } = await import('fs/promises');

    try {
      await access(path);
      const content = await readFile(path, 'utf-8');
      const data = JSON.parse(content);

      // Restore entities
      if (data.entities && data.entities.length > 0) {
        memoryGraph.createEntities(data.entities);
      }

      // Restore relations
      if (data.relations && data.relations.length > 0) {
        memoryGraph.createRelations(data.relations);
      }

      this.#lastSyncTime = new Date(data.timestamp);
      logger.info('Loaded memory from file', {
        path,
        entities: data.entities?.length || 0,
        savedAt: data.timestamp,
      });

      return {
        success: true,
        loaded: data.entities?.length || 0,
        relations: data.relations?.length || 0,
        savedAt: data.timestamp,
      };
    } catch (error) {
      logger.error('Failed to load memory from file', { path, error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get last sync time
   * @returns {Date|null} Last sync timestamp
   */
  getLastSyncTime() {
    return this.#lastSyncTime;
  }
}

// ============================================================================
// SINGLETON INSTANCES
// ============================================================================

let memoryLifecycle = null;
let memorySearch = null;
let memorySync = null;

/**
 * Get MemoryLifecycle singleton
 */
export function getMemoryLifecycle() {
  if (!memoryLifecycle) {
    memoryLifecycle = new MemoryLifecycle();
  }
  return memoryLifecycle;
}

/**
 * Get MemorySearch singleton
 */
export function getMemorySearch() {
  if (!memorySearch) {
    memorySearch = new MemorySearch();
  }
  return memorySearch;
}

/**
 * Get MemorySync singleton
 */
export function getMemorySync() {
  if (!memorySync) {
    memorySync = new MemorySync();
  }
  return memorySync;
}

// ============================================================================
// MEMORY MANAGER HANDLERS (for API integration)
// ============================================================================

/**
 * Memory manager handlers for REST API
 */
export const memoryManagerHandlers = {
  // Lifecycle handlers
  applyDecay() {
    return getMemoryLifecycle().applyDecay();
  },

  cleanup(threshold) {
    return getMemoryLifecycle().cleanup(threshold);
  },

  async archive(olderThanDays) {
    return getMemoryLifecycle().archive(olderThanDays);
  },

  async restore(entityNames) {
    return getMemoryLifecycle().restore(entityNames);
  },

  getStats() {
    return getMemoryLifecycle().getStats();
  },

  // Search handlers
  search(query, options) {
    return getMemorySearch().search(query, options);
  },

  searchByType(entityType, query) {
    return getMemorySearch().searchByType(entityType, query);
  },

  searchByTimeRange(start, end) {
    return getMemorySearch().searchByTimeRange(new Date(start), new Date(end));
  },

  searchByConfidence(min, max) {
    return getMemorySearch().searchByConfidence(min, max);
  },

  getRelated(entityName, depth) {
    return getMemorySearch().getRelated(entityName, depth);
  },

  // Sync handlers
  async saveToMongoDB() {
    return getMemorySync().saveToMongoDB();
  },

  async loadFromMongoDB() {
    return getMemorySync().loadFromMongoDB();
  },

  async saveToFile(path) {
    return getMemorySync().saveToFile(path);
  },

  async loadFromFile(path) {
    return getMemorySync().loadFromFile(path);
  },

  getLastSyncTime() {
    const time = getMemorySync().getLastSyncTime();
    return time ? time.toISOString() : null;
  },
};

export default {
  MemoryLifecycle,
  MemorySearch,
  MemorySync,
  getMemoryLifecycle,
  getMemorySearch,
  getMemorySync,
  memoryManagerHandlers,
};
