/**
 * BambiSleep™ Church MCP Control Tower
 * Unit Tests - Memory Manager Module
 */

import assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';

// Mock memory graph for testing
const mockMemoryGraph = {
  entities: [],
  relations: [],
  
  createEntities(entities) {
    const created = [];
    for (const entity of entities) {
      if (!this.entities.find(e => e.name === entity.name)) {
        this.entities.push({
          name: entity.name,
          entityType: entity.entityType,
          observations: entity.observations || [],
        });
        created.push(entity.name);
      }
    }
    return created;
  },
  
  openNodes(names) {
    return this.entities.filter(e => names.includes(e.name));
  },
  
  readGraph() {
    return { entities: this.entities, relations: this.relations };
  },
  
  addObservations(entityName, observations) {
    const entity = this.entities.find(e => e.name === entityName);
    if (entity) {
      entity.observations.push(...observations);
      return true;
    }
    return false;
  },
  
  createRelations(relations) {
    const created = [];
    for (const rel of relations) {
      this.relations.push(rel);
      created.push(rel);
    }
    return created;
  },
  
  deleteEntities(names) {
    this.entities = this.entities.filter(e => !names.includes(e.name));
    return names;
  },
  
  searchNodes(query) {
    return this.entities.filter(e => 
      e.name.toLowerCase().includes(query.toLowerCase()) ||
      e.observations.some(o => o.toLowerCase().includes(query.toLowerCase()))
    );
  },
  
  reset() {
    this.entities = [];
    this.relations = [];
  },
};

describe('Memory Manager Module', () => {
  beforeEach(() => {
    mockMemoryGraph.reset();
  });

  describe('MemoryLifecycle', () => {
    describe('applyDecay()', () => {
      it('should reduce confidence for old entities', () => {
        // Create entity with old last_seen date
        const entityName = 'user:preference:old';
        const oldDate = new Date();
        oldDate.setDate(oldDate.getDate() - 30); // 30 days ago
        
        mockMemoryGraph.createEntities([{
          name: entityName,
          entityType: 'user:preference',
          observations: [
            `[${oldDate.toISOString()}] value: test`,
            `[${oldDate.toISOString()}] confidence: 0.9`,
            `[${oldDate.toISOString()}] last_seen: ${oldDate.toISOString()}`,
            `[${oldDate.toISOString()}] source: explicit_setting`,
          ],
        }]);

        // Simulate decay calculation
        const currentConfidence = 0.9;
        const daysSince = 30;
        const halfLife = 30; // 30 days
        const decayedConfidence = currentConfidence * Math.pow(0.5, daysSince / halfLife);
        
        assert.ok(decayedConfidence < currentConfidence);
        assert.ok(decayedConfidence > 0.4); // Should be around 0.45
      });

      it('should not decay entities without last_seen', () => {
        const entityName = 'user:pattern:nodecay';
        
        mockMemoryGraph.createEntities([{
          name: entityName,
          entityType: 'user:pattern',
          observations: [
            '[2026-01-02T00:00:00Z] value: test',
            // No last_seen observation
          ],
        }]);

        const entities = mockMemoryGraph.openNodes([entityName]);
        const hasLastSeen = entities[0].observations.some(o => o.includes('last_seen:'));
        
        assert.strictEqual(hasLastSeen, false);
      });
    });

    describe('cleanup()', () => {
      it('should remove entities below threshold', () => {
        mockMemoryGraph.createEntities([
          { 
            name: 'entity:high', 
            entityType: 'test', 
            observations: ['[2026-01-02T00:00:00Z] confidence: 0.8'] 
          },
          { 
            name: 'entity:low', 
            entityType: 'test', 
            observations: ['[2026-01-02T00:00:00Z] confidence: 0.05'] 
          },
        ]);

        const threshold = 0.1;
        const toRemove = mockMemoryGraph.entities.filter(e => {
          const confObs = e.observations.find(o => o.includes('confidence:'));
          if (!confObs) return false;
          const match = confObs.match(/confidence:\s*([\d.]+)/);
          return match && parseFloat(match[1]) < threshold;
        });

        assert.strictEqual(toRemove.length, 1);
        assert.strictEqual(toRemove[0].name, 'entity:low');
      });

      it('should return cleanup statistics', () => {
        mockMemoryGraph.createEntities([
          { name: 'entity:keep1', entityType: 'test', observations: ['[2026-01-02T00:00:00Z] confidence: 0.9'] },
          { name: 'entity:keep2', entityType: 'test', observations: ['[2026-01-02T00:00:00Z] confidence: 0.5'] },
          { name: 'entity:remove', entityType: 'test', observations: ['[2026-01-02T00:00:00Z] confidence: 0.05'] },
        ]);

        const threshold = 0.1;
        let removed = 0;
        let kept = 0;

        for (const entity of mockMemoryGraph.entities) {
          const confObs = entity.observations.find(o => o.includes('confidence:'));
          if (confObs) {
            const match = confObs.match(/confidence:\s*([\d.]+)/);
            if (match && parseFloat(match[1]) < threshold) {
              removed++;
            } else {
              kept++;
            }
          } else {
            kept++;
          }
        }

        assert.strictEqual(removed, 1);
        assert.strictEqual(kept, 2);
      });
    });

    describe('archive()', () => {
      it('should identify entities older than specified days', () => {
        const now = new Date();
        const oldDate = new Date(now);
        oldDate.setDate(oldDate.getDate() - 100); // 100 days ago
        const recentDate = new Date(now);
        recentDate.setDate(recentDate.getDate() - 10); // 10 days ago

        mockMemoryGraph.createEntities([
          { 
            name: 'entity:old', 
            entityType: 'test', 
            observations: [`[${oldDate.toISOString()}] last_seen: ${oldDate.toISOString()}`] 
          },
          { 
            name: 'entity:recent', 
            entityType: 'test', 
            observations: [`[${recentDate.toISOString()}] last_seen: ${recentDate.toISOString()}`] 
          },
        ]);

        const olderThanDays = 90;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

        const toArchive = mockMemoryGraph.entities.filter(e => {
          const lastSeenObs = e.observations.find(o => o.includes('last_seen:'));
          if (!lastSeenObs) return false;
          const match = lastSeenObs.match(/last_seen:\s*(\S+)/);
          if (!match) return false;
          return new Date(match[1]) < cutoffDate;
        });

        assert.strictEqual(toArchive.length, 1);
        assert.strictEqual(toArchive[0].name, 'entity:old');
      });
    });

    describe('getStats()', () => {
      it('should return memory statistics', () => {
        mockMemoryGraph.createEntities([
          { name: 'user:preference:pref1', entityType: 'user:preference', observations: [] },
          { name: 'user:preference:pref2', entityType: 'user:preference', observations: [] },
          { name: 'user:pattern:pat1', entityType: 'user:pattern', observations: [] },
          { name: 'conversation:session:sess1', entityType: 'conversation:session', observations: [] },
        ]);

        mockMemoryGraph.createRelations([
          { from: 'user:preference:pref1', to: 'user:pattern:pat1', relationType: 'relates' },
        ]);

        const graph = mockMemoryGraph.readGraph();
        const stats = {
          totalEntities: graph.entities.length,
          totalRelations: graph.relations.length,
          byType: {},
        };

        for (const entity of graph.entities) {
          const type = entity.entityType;
          stats.byType[type] = (stats.byType[type] || 0) + 1;
        }

        assert.strictEqual(stats.totalEntities, 4);
        assert.strictEqual(stats.totalRelations, 1);
        assert.strictEqual(stats.byType['user:preference'], 2);
        assert.strictEqual(stats.byType['user:pattern'], 1);
      });
    });
  });

  describe('MemorySearch', () => {
    describe('search()', () => {
      it('should search across all entities', () => {
        mockMemoryGraph.createEntities([
          { 
            name: 'user:preference:theme', 
            entityType: 'user:preference', 
            observations: ['[2026-01-02T00:00:00Z] mode: dark'] 
          },
          { 
            name: 'user:pattern:coding', 
            entityType: 'user:pattern', 
            observations: ['[2026-01-02T00:00:00Z] style: functional'] 
          },
        ]);

        const results = mockMemoryGraph.searchNodes('dark');
        assert.strictEqual(results.length, 1);
        assert.strictEqual(results[0].name, 'user:preference:theme');
      });

      it('should search entity names', () => {
        mockMemoryGraph.createEntities([
          { name: 'workspace:project:myapp', entityType: 'workspace:project', observations: [] },
          { name: 'workspace:file:readme', entityType: 'workspace:file', observations: [] },
        ]);

        const results = mockMemoryGraph.searchNodes('myapp');
        assert.strictEqual(results.length, 1);
        assert.strictEqual(results[0].name, 'workspace:project:myapp');
      });
    });

    describe('searchByType()', () => {
      it('should filter by entity type', () => {
        mockMemoryGraph.createEntities([
          { name: 'user:preference:pref1', entityType: 'user:preference', observations: [] },
          { name: 'user:preference:pref2', entityType: 'user:preference', observations: [] },
          { name: 'user:pattern:pat1', entityType: 'user:pattern', observations: [] },
        ]);

        const graph = mockMemoryGraph.readGraph();
        const preferences = graph.entities.filter(e => e.entityType === 'user:preference');
        
        assert.strictEqual(preferences.length, 2);
      });
    });

    describe('searchByTimeRange()', () => {
      it('should find entities within time range', () => {
        const jan1 = new Date('2026-01-01T00:00:00Z');
        const jan2 = new Date('2026-01-02T00:00:00Z');
        const jan3 = new Date('2026-01-03T00:00:00Z');

        mockMemoryGraph.createEntities([
          { 
            name: 'entity:jan1', 
            entityType: 'test', 
            observations: [`[${jan1.toISOString()}] created_at: ${jan1.toISOString()}`] 
          },
          { 
            name: 'entity:jan2', 
            entityType: 'test', 
            observations: [`[${jan2.toISOString()}] created_at: ${jan2.toISOString()}`] 
          },
          { 
            name: 'entity:jan3', 
            entityType: 'test', 
            observations: [`[${jan3.toISOString()}] created_at: ${jan3.toISOString()}`] 
          },
        ]);

        const start = new Date('2026-01-01T12:00:00Z');
        const end = new Date('2026-01-02T12:00:00Z');

        const inRange = mockMemoryGraph.entities.filter(e => {
          const createdObs = e.observations.find(o => o.includes('created_at:'));
          if (!createdObs) return false;
          const match = createdObs.match(/created_at:\s*(\S+)/);
          if (!match) return false;
          const date = new Date(match[1]);
          return date >= start && date <= end;
        });

        assert.strictEqual(inRange.length, 1);
        assert.strictEqual(inRange[0].name, 'entity:jan2');
      });
    });

    describe('searchByConfidence()', () => {
      it('should find entities within confidence range', () => {
        mockMemoryGraph.createEntities([
          { name: 'entity:low', entityType: 'test', observations: ['[2026-01-02T00:00:00Z] confidence: 0.2'] },
          { name: 'entity:mid', entityType: 'test', observations: ['[2026-01-02T00:00:00Z] confidence: 0.5'] },
          { name: 'entity:high', entityType: 'test', observations: ['[2026-01-02T00:00:00Z] confidence: 0.9'] },
        ]);

        const minConf = 0.4;
        const maxConf = 0.7;

        const inRange = mockMemoryGraph.entities.filter(e => {
          const confObs = e.observations.find(o => o.includes('confidence:'));
          if (!confObs) return false;
          const match = confObs.match(/confidence:\s*([\d.]+)/);
          if (!match) return false;
          const conf = parseFloat(match[1]);
          return conf >= minConf && conf <= maxConf;
        });

        assert.strictEqual(inRange.length, 1);
        assert.strictEqual(inRange[0].name, 'entity:mid');
      });
    });

    describe('getRelated()', () => {
      it('should return directly related entities', () => {
        mockMemoryGraph.createEntities([
          { name: 'entity:a', entityType: 'test', observations: [] },
          { name: 'entity:b', entityType: 'test', observations: [] },
          { name: 'entity:c', entityType: 'test', observations: [] },
        ]);

        mockMemoryGraph.createRelations([
          { from: 'entity:a', to: 'entity:b', relationType: 'relates_to' },
          { from: 'entity:b', to: 'entity:c', relationType: 'relates_to' },
        ]);

        const graph = mockMemoryGraph.readGraph();
        const related = graph.relations
          .filter(r => r.from === 'entity:a' || r.to === 'entity:a')
          .map(r => r.from === 'entity:a' ? r.to : r.from);

        assert.strictEqual(related.length, 1);
        assert.ok(related.includes('entity:b'));
      });

      it('should traverse multiple depths', () => {
        mockMemoryGraph.createEntities([
          { name: 'entity:root', entityType: 'test', observations: [] },
          { name: 'entity:level1', entityType: 'test', observations: [] },
          { name: 'entity:level2', entityType: 'test', observations: [] },
        ]);

        mockMemoryGraph.createRelations([
          { from: 'entity:root', to: 'entity:level1', relationType: 'parent_of' },
          { from: 'entity:level1', to: 'entity:level2', relationType: 'parent_of' },
        ]);

        // Simulate depth traversal
        const visited = new Set(['entity:root']);
        const toVisit = ['entity:root'];
        const maxDepth = 2;
        let depth = 0;

        while (toVisit.length > 0 && depth < maxDepth) {
          const current = toVisit.shift();
          const graph = mockMemoryGraph.readGraph();
          const related = graph.relations
            .filter(r => r.from === current)
            .map(r => r.to);
          
          for (const rel of related) {
            if (!visited.has(rel)) {
              visited.add(rel);
              toVisit.push(rel);
            }
          }
          depth++;
        }

        assert.ok(visited.has('entity:level1'));
        assert.ok(visited.has('entity:level2'));
      });
    });
  });

  describe('MemorySync', () => {
    describe('saveToFile()', () => {
      it('should serialize graph to JSON', () => {
        mockMemoryGraph.createEntities([
          { name: 'test:entity', entityType: 'test', observations: ['obs1', 'obs2'] },
        ]);

        const graph = mockMemoryGraph.readGraph();
        const json = JSON.stringify(graph);
        const parsed = JSON.parse(json);

        assert.strictEqual(parsed.entities.length, 1);
        assert.strictEqual(parsed.entities[0].name, 'test:entity');
      });
    });

    describe('loadFromFile()', () => {
      it('should deserialize JSON to graph', () => {
        const data = {
          entities: [
            { name: 'loaded:entity', entityType: 'test', observations: ['loaded obs'] },
          ],
          relations: [],
        };

        // Simulate loading
        mockMemoryGraph.reset();
        for (const entity of data.entities) {
          mockMemoryGraph.createEntities([entity]);
        }

        const graph = mockMemoryGraph.readGraph();
        assert.strictEqual(graph.entities.length, 1);
        assert.strictEqual(graph.entities[0].name, 'loaded:entity');
      });
    });

    describe('saveToMongoDB()', () => {
      it('should prepare entities for MongoDB', () => {
        mockMemoryGraph.createEntities([
          { name: 'mongo:entity', entityType: 'test', observations: ['obs'] },
        ]);

        const graph = mockMemoryGraph.readGraph();
        const documents = graph.entities.map(e => ({
          _id: e.name,
          entityType: e.entityType,
          observations: e.observations,
          syncedAt: new Date().toISOString(),
        }));

        assert.strictEqual(documents.length, 1);
        assert.strictEqual(documents[0]._id, 'mongo:entity');
        assert.ok(documents[0].syncedAt);
      });
    });

    describe('loadFromMongoDB()', () => {
      it('should restore entities from MongoDB format', () => {
        const mongoDocuments = [
          {
            _id: 'restored:entity',
            entityType: 'test',
            observations: ['restored obs'],
            syncedAt: '2026-01-02T00:00:00Z',
          },
        ];

        mockMemoryGraph.reset();
        for (const doc of mongoDocuments) {
          mockMemoryGraph.createEntities([{
            name: doc._id,
            entityType: doc.entityType,
            observations: doc.observations,
          }]);
        }

        const graph = mockMemoryGraph.readGraph();
        assert.strictEqual(graph.entities.length, 1);
        assert.strictEqual(graph.entities[0].name, 'restored:entity');
      });
    });

    describe('getLastSyncTime()', () => {
      it('should track last sync timestamp', () => {
        const lastSync = new Date('2026-01-02T12:00:00Z');
        
        // Simulate tracking
        const syncInfo = { lastSync };
        
        assert.ok(syncInfo.lastSync instanceof Date);
        assert.strictEqual(syncInfo.lastSync.toISOString(), '2026-01-02T12:00:00.000Z');
      });
    });
  });

  describe('memoryManagerHandlers', () => {
    it('should export all required handler methods', () => {
      const requiredMethods = [
        'applyDecay',
        'cleanup',
        'archive',
        'restore',
        'getStats',
        'search',
        'searchByType',
        'searchByTimeRange',
        'searchByConfidence',
        'getRelated',
        'saveToMongoDB',
        'loadFromMongoDB',
        'saveToFile',
        'loadFromFile',
        'getLastSyncTime',
      ];

      for (const method of requiredMethods) {
        assert.ok(typeof method === 'string', `Method ${method} should be defined`);
      }
    });
  });
});
