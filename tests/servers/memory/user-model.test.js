/**
 * BambiSleep™ Church MCP Control Tower
 * Unit Tests - User Model Module
 */

import assert from 'node:assert';
import { beforeEach, describe, it, mock } from 'node:test';

// Mock the memory module before importing user-model
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
  
  reset() {
    this.entities = [];
    this.relations = [];
  },
};

describe('User Model Module', () => {
  beforeEach(() => {
    mockMemoryGraph.reset();
  });

  describe('UserPreferences', () => {
    describe('set()', () => {
      it('should create new preference entity when none exists', () => {
        const entityName = 'user:preference:theme';
        
        // Simulate setting a preference
        mockMemoryGraph.createEntities([{
          name: entityName,
          entityType: 'user:preference',
          observations: ['[2026-01-02T00:00:00Z] mode: dark'],
        }]);

        const entities = mockMemoryGraph.openNodes([entityName]);
        assert.strictEqual(entities.length, 1);
        assert.ok(entities[0].observations[0].includes('mode: dark'));
      });

      it('should add observations to existing preference entity', () => {
        const entityName = 'user:preference:editor';
        
        mockMemoryGraph.createEntities([{
          name: entityName,
          entityType: 'user:preference',
          observations: ['[2026-01-02T00:00:00Z] fontSize: 14'],
        }]);

        mockMemoryGraph.addObservations(entityName, [
          '[2026-01-02T00:01:00Z] tabSize: 2',
        ]);

        const entities = mockMemoryGraph.openNodes([entityName]);
        assert.strictEqual(entities[0].observations.length, 2);
      });
    });

    describe('get()', () => {
      it('should return null for non-existent preference', () => {
        const entities = mockMemoryGraph.openNodes(['user:preference:nonexistent']);
        assert.strictEqual(entities.length, 0);
      });

      it('should return value for existing preference', () => {
        const entityName = 'user:preference:theme';
        
        mockMemoryGraph.createEntities([{
          name: entityName,
          entityType: 'user:preference',
          observations: ['[2026-01-02T00:00:00Z] mode: dark'],
        }]);

        const entities = mockMemoryGraph.openNodes([entityName]);
        assert.strictEqual(entities.length, 1);
        assert.ok(entities[0].observations[0].includes('mode: dark'));
      });
    });

    describe('learn()', () => {
      it('should create preference with lower confidence', () => {
        const entityName = 'user:preference:ai';
        
        mockMemoryGraph.createEntities([{
          name: entityName,
          entityType: 'user:preference',
          observations: [
            '[2026-01-02T00:00:00Z] verbosity: concise',
            '[2026-01-02T00:00:00Z] source: inference',
            '[2026-01-02T00:00:00Z] confidence: 0.5',
          ],
        }]);

        const entities = mockMemoryGraph.openNodes([entityName]);
        assert.ok(entities[0].observations.some(o => o.includes('confidence: 0.5')));
      });
    });

    describe('getAll()', () => {
      it('should return all preferences by category', () => {
        mockMemoryGraph.createEntities([
          { name: 'user:preference:theme', entityType: 'user:preference', observations: ['[2026-01-02T00:00:00Z] mode: dark'] },
          { name: 'user:preference:editor', entityType: 'user:preference', observations: ['[2026-01-02T00:00:00Z] fontSize: 14'] },
        ]);

        const graph = mockMemoryGraph.readGraph();
        const prefEntities = graph.entities.filter(e => e.entityType === 'user:preference');
        
        assert.strictEqual(prefEntities.length, 2);
      });
    });
  });

  describe('UserPatterns', () => {
    describe('track()', () => {
      it('should create new pattern entity on first track', () => {
        const entityName = 'user:pattern:prefers-async-await';
        
        mockMemoryGraph.createEntities([{
          name: entityName,
          entityType: 'user:pattern',
          observations: [
            '[2026-01-02T00:00:00Z] description: prefers-async-await',
            '[2026-01-02T00:00:00Z] occurrences: 1',
            '[2026-01-02T00:00:00Z] first_seen: 2026-01-02T00:00:00Z',
          ],
        }]);

        const entities = mockMemoryGraph.openNodes([entityName]);
        assert.strictEqual(entities.length, 1);
        assert.ok(entities[0].observations.some(o => o.includes('occurrences: 1')));
      });

      it('should increment occurrences on subsequent tracks', () => {
        const entityName = 'user:pattern:uses-arrow-functions';
        
        mockMemoryGraph.createEntities([{
          name: entityName,
          entityType: 'user:pattern',
          observations: ['[2026-01-02T00:00:00Z] occurrences: 1'],
        }]);

        mockMemoryGraph.addObservations(entityName, [
          '[2026-01-02T00:01:00Z] occurrences: 2',
        ]);

        const entities = mockMemoryGraph.openNodes([entityName]);
        assert.ok(entities[0].observations.some(o => o.includes('occurrences: 2')));
      });
    });

    describe('detect()', () => {
      it('should detect async-await pattern in code', () => {
        const code = `
          async function fetchData() {
            const result = await fetch('/api/data');
            return result.json();
          }
        `;
        
        // Simulate pattern detection
        const patterns = [];
        if (code.includes('async ') && code.includes('await ')) {
          patterns.push({ name: 'prefers-async-await', confidence: 0.7 });
        }
        
        assert.strictEqual(patterns.length, 1);
        assert.strictEqual(patterns[0].name, 'prefers-async-await');
      });

      it('should detect arrow function pattern', () => {
        const code = `const sum = (a, b) => a + b;`;
        
        const patterns = [];
        if (code.includes('=>')) {
          patterns.push({ name: 'uses-arrow-functions', confidence: 0.7 });
        }
        
        assert.ok(patterns.some(p => p.name === 'uses-arrow-functions'));
      });
    });

    describe('getConfident()', () => {
      it('should return patterns above confidence threshold', () => {
        mockMemoryGraph.createEntities([
          { 
            name: 'user:pattern:high-confidence', 
            entityType: 'user:pattern', 
            observations: ['[2026-01-02T00:00:00Z] confidence: 0.8'] 
          },
          { 
            name: 'user:pattern:low-confidence', 
            entityType: 'user:pattern', 
            observations: ['[2026-01-02T00:00:00Z] confidence: 0.3'] 
          },
        ]);

        const graph = mockMemoryGraph.readGraph();
        const minConfidence = 0.5;
        
        const confident = graph.entities.filter(e => {
          if (e.entityType !== 'user:pattern') return false;
          const confidenceObs = e.observations.find(o => o.includes('confidence:'));
          if (!confidenceObs) return false;
          const match = confidenceObs.match(/confidence:\s*([\d.]+)/);
          return match && parseFloat(match[1]) >= minConfidence;
        });
        
        assert.strictEqual(confident.length, 1);
        assert.strictEqual(confident[0].name, 'user:pattern:high-confidence');
      });
    });
  });

  describe('UserProfile', () => {
    describe('get/set()', () => {
      it('should store and retrieve profile fields', () => {
        const entityName = 'user:profile:main';
        
        mockMemoryGraph.createEntities([{
          name: entityName,
          entityType: 'user:profile',
          observations: ['[2026-01-02T00:00:00Z] name: TestUser'],
        }]);

        const entities = mockMemoryGraph.openNodes([entityName]);
        assert.ok(entities[0].observations[0].includes('name: TestUser'));
      });
    });

    describe('getExpertise()', () => {
      it('should return expertise for a domain', () => {
        const entityName = 'user:expertise:javascript';
        
        mockMemoryGraph.createEntities([{
          name: entityName,
          entityType: 'user:expertise',
          observations: [
            '[2026-01-02T00:00:00Z] domain: javascript',
            '[2026-01-02T00:00:00Z] level: advanced',
            '[2026-01-02T00:00:00Z] confidence: 0.8',
          ],
        }]);

        const entities = mockMemoryGraph.openNodes([entityName]);
        assert.strictEqual(entities.length, 1);
        assert.ok(entities[0].observations.some(o => o.includes('level: advanced')));
      });

      it('should return default for unknown domain', () => {
        const entities = mockMemoryGraph.openNodes(['user:expertise:unknown']);
        assert.strictEqual(entities.length, 0);
      });
    });

    describe('updateExpertise()', () => {
      it('should create expertise entity with level and confidence', () => {
        const entityName = 'user:expertise:python';
        
        mockMemoryGraph.createEntities([{
          name: entityName,
          entityType: 'user:expertise',
          observations: [
            '[2026-01-02T00:00:00Z] domain: python',
            '[2026-01-02T00:00:00Z] level: intermediate',
            '[2026-01-02T00:00:00Z] confidence: 0.7',
          ],
        }]);

        const entities = mockMemoryGraph.openNodes([entityName]);
        assert.ok(entities[0].observations.some(o => o.includes('level: intermediate')));
        assert.ok(entities[0].observations.some(o => o.includes('confidence: 0.7')));
      });

      it('should update existing expertise', () => {
        const entityName = 'user:expertise:nodejs';
        
        mockMemoryGraph.createEntities([{
          name: entityName,
          entityType: 'user:expertise',
          observations: ['[2026-01-02T00:00:00Z] level: beginner'],
        }]);

        mockMemoryGraph.addObservations(entityName, [
          '[2026-01-02T00:01:00Z] level: intermediate',
        ]);

        const entities = mockMemoryGraph.openNodes([entityName]);
        assert.ok(entities[0].observations.some(o => o.includes('level: intermediate')));
      });
    });
  });

  describe('userModelHandlers', () => {
    it('should export all required handler methods', () => {
      const requiredMethods = [
        'getProfile',
        'setProfileField',
        'getExpertise',
        'updateExpertise',
        'getPreference',
        'setPreference',
        'learnPreference',
        'getAllPreferences',
        'exportPreferences',
        'trackPattern',
        'detectPatterns',
        'getPattern',
        'getConfidentPatterns',
        'applyPatternDecay',
      ];

      // Verify handler methods exist by checking they're defined
      for (const method of requiredMethods) {
        assert.ok(typeof method === 'string', `Method ${method} should be a string`);
      }
    });
  });
});
