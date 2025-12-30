/**
 * BambiSleep™ Church MCP Control Tower
 * Unit Tests - Memory Module (Knowledge Graph)
 */

import assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { memoryGraph, memoryHandlers } from '../../src/servers/memory.js';

describe('Memory Module', () => {
  // Reset graph before each test
  beforeEach(() => {
    // Clear the graph by deleting all entities
    const graph = memoryGraph.readGraph();
    if (graph.entities.length > 0) {
      memoryGraph.deleteEntities(graph.entities.map(e => e.name));
    }
  });

  describe('MemoryGraph', () => {
    describe('createEntities()', () => {
      it('should create new entities', () => {
        const entities = [
          { name: 'Entity1', entityType: 'Type1', observations: ['obs1'] },
          { name: 'Entity2', entityType: 'Type2', observations: [] },
        ];

        const created = memoryGraph.createEntities(entities);

        assert.strictEqual(created.length, 2);
        assert.ok(created.includes('Entity1'));
        assert.ok(created.includes('Entity2'));
      });

      it('should not duplicate existing entities', () => {
        memoryGraph.createEntities([{ name: 'Existing', entityType: 'Type' }]);
        
        const created = memoryGraph.createEntities([
          { name: 'Existing', entityType: 'Type' },
          { name: 'New', entityType: 'Type' },
        ]);

        assert.strictEqual(created.length, 1);
        assert.ok(created.includes('New'));
      });

      it('should default observations to empty array', () => {
        memoryGraph.createEntities([{ name: 'NoObs', entityType: 'Type' }]);
        
        const graph = memoryGraph.readGraph();
        const entity = graph.entities.find(e => e.name === 'NoObs');
        
        assert.ok(Array.isArray(entity.observations));
        assert.strictEqual(entity.observations.length, 0);
      });
    });

    describe('createRelations()', () => {
      beforeEach(() => {
        memoryGraph.createEntities([
          { name: 'A', entityType: 'Node' },
          { name: 'B', entityType: 'Node' },
          { name: 'C', entityType: 'Node' },
        ]);
      });

      it('should create relations between existing entities', () => {
        const relations = [
          { from: 'A', to: 'B', relationType: 'connects' },
          { from: 'B', to: 'C', relationType: 'links' },
        ];

        const created = memoryGraph.createRelations(relations);

        assert.strictEqual(created.length, 2);
      });

      it('should reject relations with non-existent entities', () => {
        const relations = [
          { from: 'A', to: 'NonExistent', relationType: 'invalid' },
        ];

        const created = memoryGraph.createRelations(relations);

        assert.strictEqual(created.length, 0);
      });

      it('should allow multiple relations between same entities', () => {
        memoryGraph.createRelations([
          { from: 'A', to: 'B', relationType: 'type1' },
          { from: 'A', to: 'B', relationType: 'type2' },
        ]);

        const graph = memoryGraph.readGraph();
        const abRelations = graph.relations.filter(
          r => r.from === 'A' && r.to === 'B'
        );

        assert.strictEqual(abRelations.length, 2);
      });
    });

    describe('addObservations()', () => {
      beforeEach(() => {
        memoryGraph.createEntities([
          { name: 'Target', entityType: 'Type', observations: ['initial'] },
        ]);
      });

      it('should add observations to existing entity', () => {
        const result = memoryGraph.addObservations('Target', ['new1', 'new2']);

        assert.strictEqual(result, true);
        
        const graph = memoryGraph.readGraph();
        const entity = graph.entities.find(e => e.name === 'Target');
        assert.strictEqual(entity.observations.length, 3);
      });

      it('should return false for non-existent entity', () => {
        const result = memoryGraph.addObservations('NonExistent', ['obs']);

        assert.strictEqual(result, false);
      });
    });

    describe('deleteObservations()', () => {
      beforeEach(() => {
        memoryGraph.createEntities([
          { name: 'Target', entityType: 'Type', observations: ['keep', 'remove', 'also-keep'] },
        ]);
      });

      it('should delete specified observations', () => {
        const result = memoryGraph.deleteObservations('Target', ['remove']);

        assert.strictEqual(result, true);
        
        const graph = memoryGraph.readGraph();
        const entity = graph.entities.find(e => e.name === 'Target');
        assert.strictEqual(entity.observations.length, 2);
        assert.ok(!entity.observations.includes('remove'));
      });

      it('should return false for non-existent entity', () => {
        const result = memoryGraph.deleteObservations('NonExistent', ['obs']);

        assert.strictEqual(result, false);
      });
    });

    describe('deleteEntities()', () => {
      beforeEach(() => {
        memoryGraph.createEntities([
          { name: 'A', entityType: 'Node' },
          { name: 'B', entityType: 'Node' },
          { name: 'C', entityType: 'Node' },
        ]);
        memoryGraph.createRelations([
          { from: 'A', to: 'B', relationType: 'link' },
          { from: 'B', to: 'C', relationType: 'link' },
        ]);
      });

      it('should delete entities', () => {
        memoryGraph.deleteEntities(['A']);

        const graph = memoryGraph.readGraph();
        assert.strictEqual(graph.entities.length, 2);
        assert.ok(!graph.entities.some(e => e.name === 'A'));
      });

      it('should also delete related relations', () => {
        memoryGraph.deleteEntities(['B']);

        const graph = memoryGraph.readGraph();
        // Both relations involving B should be deleted
        assert.strictEqual(graph.relations.length, 0);
      });
    });

    describe('deleteRelations()', () => {
      beforeEach(() => {
        memoryGraph.createEntities([
          { name: 'A', entityType: 'Node' },
          { name: 'B', entityType: 'Node' },
        ]);
        memoryGraph.createRelations([
          { from: 'A', to: 'B', relationType: 'link1' },
          { from: 'A', to: 'B', relationType: 'link2' },
        ]);
      });

      it('should delete specific relations', () => {
        const deleted = memoryGraph.deleteRelations([
          { from: 'A', to: 'B', relationType: 'link1' },
        ]);

        assert.strictEqual(deleted, 1);
        
        const graph = memoryGraph.readGraph();
        assert.strictEqual(graph.relations.length, 1);
        assert.strictEqual(graph.relations[0].relationType, 'link2');
      });
    });

    describe('searchNodes()', () => {
      beforeEach(() => {
        memoryGraph.createEntities([
          { name: 'BambiSleep', entityType: 'Project', observations: ['MCP server'] },
          { name: 'GitHub', entityType: 'Service', observations: ['repository'] },
          { name: 'Memory', entityType: 'MCP', observations: ['knowledge graph'] },
        ]);
      });

      it('should search by entity name', () => {
        const results = memoryGraph.searchNodes('bambi');

        assert.strictEqual(results.length, 1);
        assert.strictEqual(results[0].name, 'BambiSleep');
      });

      it('should search by entity type', () => {
        const results = memoryGraph.searchNodes('mcp');

        assert.strictEqual(results.length, 2); // Project has 'MCP server' observation, Memory is type MCP
      });

      it('should search by observations', () => {
        const results = memoryGraph.searchNodes('knowledge');

        assert.strictEqual(results.length, 1);
        assert.strictEqual(results[0].name, 'Memory');
      });

      it('should be case-insensitive', () => {
        const results = memoryGraph.searchNodes('GITHUB');

        assert.strictEqual(results.length, 1);
      });

      it('should return empty array for no matches', () => {
        const results = memoryGraph.searchNodes('nonexistent');

        assert.deepStrictEqual(results, []);
      });
    });

    describe('openNodes()', () => {
      beforeEach(() => {
        memoryGraph.createEntities([
          { name: 'A', entityType: 'Type' },
          { name: 'B', entityType: 'Type' },
        ]);
      });

      it('should return requested nodes', () => {
        const nodes = memoryGraph.openNodes(['A', 'B']);

        assert.strictEqual(nodes.length, 2);
      });

      it('should filter out non-existent nodes', () => {
        const nodes = memoryGraph.openNodes(['A', 'NonExistent']);

        assert.strictEqual(nodes.length, 1);
        assert.strictEqual(nodes[0].name, 'A');
      });
    });

    describe('readGraph()', () => {
      it('should return complete graph structure', () => {
        memoryGraph.createEntities([{ name: 'Test', entityType: 'Type' }]);

        const graph = memoryGraph.readGraph();

        assert.ok('entities' in graph);
        assert.ok('relations' in graph);
        assert.ok(Array.isArray(graph.entities));
        assert.ok(Array.isArray(graph.relations));
      });
    });
  });

  describe('memoryHandlers', () => {
    it('should expose all required handler methods', () => {
      assert.strictEqual(typeof memoryHandlers.readGraph, 'function');
      assert.strictEqual(typeof memoryHandlers.createEntities, 'function');
      assert.strictEqual(typeof memoryHandlers.deleteEntities, 'function');
      assert.strictEqual(typeof memoryHandlers.createRelations, 'function');
      assert.strictEqual(typeof memoryHandlers.deleteRelations, 'function');
      assert.strictEqual(typeof memoryHandlers.addObservations, 'function');
      assert.strictEqual(typeof memoryHandlers.deleteObservations, 'function');
      assert.strictEqual(typeof memoryHandlers.searchNodes, 'function');
      assert.strictEqual(typeof memoryHandlers.openNodes, 'function');
    });

    it('should delegate to memoryGraph instance', () => {
      memoryHandlers.createEntities([{ name: 'Handler', entityType: 'Test' }]);
      
      const graph = memoryHandlers.readGraph();
      
      assert.ok(graph.entities.some(e => e.name === 'Handler'));
    });
  });
});
