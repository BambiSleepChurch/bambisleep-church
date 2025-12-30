/**
 * BambiSleep™ Church MCP Control Tower
 * Memory MCP Server Wrapper - Knowledge Graph Operations
 */

import { createLogger } from '../utils/logger.js';

const logger = createLogger('memory');

/**
 * In-memory knowledge graph (mirrors MCP memory server)
 * Used when MCP server is not available
 */
class MemoryGraph {
  constructor() {
    this.entities = new Map();
    this.relations = [];
  }

  /**
   * Create entities in the graph
   */
  createEntities(entities) {
    const created = [];
    for (const entity of entities) {
      if (!this.entities.has(entity.name)) {
        this.entities.set(entity.name, {
          name: entity.name,
          entityType: entity.entityType,
          observations: entity.observations || [],
        });
        created.push(entity.name);
      }
    }
    logger.info(`Created ${created.length} entities`);
    return created;
  }

  /**
   * Create relations between entities
   */
  createRelations(relations) {
    const created = [];
    for (const relation of relations) {
      // Verify entities exist
      if (this.entities.has(relation.from) && this.entities.has(relation.to)) {
        this.relations.push(relation);
        created.push(relation);
      }
    }
    logger.info(`Created ${created.length} relations`);
    return created;
  }

  /**
   * Add observations to an entity
   */
  addObservations(entityName, observations) {
    const entity = this.entities.get(entityName);
    if (entity) {
      entity.observations.push(...observations);
      logger.info(`Added ${observations.length} observations to ${entityName}`);
      return true;
    }
    return false;
  }

  /**
   * Delete observations from an entity
   */
  deleteObservations(entityName, observations) {
    const entity = this.entities.get(entityName);
    if (entity) {
      entity.observations = entity.observations.filter(
        (obs) => !observations.includes(obs)
      );
      return true;
    }
    return false;
  }

  /**
   * Delete entities and their relations
   */
  deleteEntities(entityNames) {
    for (const name of entityNames) {
      this.entities.delete(name);
      this.relations = this.relations.filter(
        (r) => r.from !== name && r.to !== name
      );
    }
    logger.info(`Deleted ${entityNames.length} entities`);
    return entityNames;
  }

  /**
   * Delete specific relations
   */
  deleteRelations(relations) {
    const before = this.relations.length;
    this.relations = this.relations.filter((r) => {
      return !relations.some(
        (del) =>
          del.from === r.from &&
          del.to === r.to &&
          del.relationType === r.relationType
      );
    });
    return before - this.relations.length;
  }

  /**
   * Search nodes by query
   */
  searchNodes(query) {
    const results = [];
    const lowerQuery = query.toLowerCase();

    for (const entity of this.entities.values()) {
      if (
        entity.name.toLowerCase().includes(lowerQuery) ||
        entity.entityType.toLowerCase().includes(lowerQuery) ||
        entity.observations.some((obs) =>
          obs.toLowerCase().includes(lowerQuery)
        )
      ) {
        results.push(entity);
      }
    }
    return results;
  }

  /**
   * Open specific nodes by name
   */
  openNodes(names) {
    return names
      .map((name) => this.entities.get(name))
      .filter(Boolean);
  }

  /**
   * Read entire graph
   */
  readGraph() {
    return {
      entities: Array.from(this.entities.values()),
      relations: this.relations,
    };
  }
}

// Singleton instance
export const memoryGraph = new MemoryGraph();

/**
 * Memory API handlers for REST endpoints
 */
export const memoryHandlers = {
  // GET /api/memory - Read entire graph
  readGraph: () => memoryGraph.readGraph(),

  // POST /api/memory/entities - Create entities
  createEntities: (entities) => memoryGraph.createEntities(entities),

  // DELETE /api/memory/entities - Delete entities
  deleteEntities: (names) => memoryGraph.deleteEntities(names),

  // POST /api/memory/relations - Create relations
  createRelations: (relations) => memoryGraph.createRelations(relations),

  // DELETE /api/memory/relations - Delete relations
  deleteRelations: (relations) => memoryGraph.deleteRelations(relations),

  // POST /api/memory/observations - Add observations
  addObservations: (entityName, observations) =>
    memoryGraph.addObservations(entityName, observations),

  // DELETE /api/memory/observations - Delete observations
  deleteObservations: (entityName, observations) =>
    memoryGraph.deleteObservations(entityName, observations),

  // GET /api/memory/search?q= - Search nodes
  searchNodes: (query) => memoryGraph.searchNodes(query),

  // GET /api/memory/nodes?names= - Open specific nodes
  openNodes: (names) => memoryGraph.openNodes(names),
};

export default memoryHandlers;
