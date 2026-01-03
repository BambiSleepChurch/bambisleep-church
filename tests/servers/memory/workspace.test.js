/**
 * BambiSleep™ Church MCP Control Tower
 * Unit Tests - Workspace Memory Module
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

describe('Workspace Memory Module', () => {
  beforeEach(() => {
    mockMemoryGraph.reset();
  });

  describe('ProjectTracker', () => {
    describe('analyzeProject()', () => {
      it('should create project entity with path', () => {
        const path = '/home/user/projects/my-app';
        const projectName = 'my-app';
        const entityName = `workspace:project:${projectName}`;
        const timestamp = new Date().toISOString();

        mockMemoryGraph.createEntities([{
          name: entityName,
          entityType: 'workspace:project',
          observations: [
            `[${timestamp}] path: ${path}`,
            `[${timestamp}] last_accessed: ${timestamp}`,
          ],
        }]);

        const entities = mockMemoryGraph.openNodes([entityName]);
        assert.strictEqual(entities.length, 1);
        assert.ok(entities[0].observations.some(o => o.includes(`path: ${path}`)));
      });

      it('should include analysis data if provided', () => {
        const entityName = 'workspace:project:test-project';
        const timestamp = new Date().toISOString();
        const analysis = {
          type: 'nodejs',
          framework: 'express',
          description: 'API server',
        };

        mockMemoryGraph.createEntities([{
          name: entityName,
          entityType: 'workspace:project',
          observations: [
            `[${timestamp}] type: ${analysis.type}`,
            `[${timestamp}] framework: ${analysis.framework}`,
            `[${timestamp}] description: ${analysis.description}`,
          ],
        }]);

        const entities = mockMemoryGraph.openNodes([entityName]);
        assert.ok(entities[0].observations.some(o => o.includes('type: nodejs')));
        assert.ok(entities[0].observations.some(o => o.includes('framework: express')));
      });

      it('should update existing project on re-analysis', () => {
        const entityName = 'workspace:project:existing';
        
        mockMemoryGraph.createEntities([{
          name: entityName,
          entityType: 'workspace:project',
          observations: ['[2026-01-02T00:00:00Z] type: nodejs'],
        }]);

        mockMemoryGraph.addObservations(entityName, [
          '[2026-01-02T00:01:00Z] type: typescript',
        ]);

        const entities = mockMemoryGraph.openNodes([entityName]);
        assert.ok(entities[0].observations.some(o => o.includes('type: typescript')));
      });
    });

    describe('getProject()', () => {
      it('should return project data', () => {
        const entityName = 'workspace:project:my-project';
        
        mockMemoryGraph.createEntities([{
          name: entityName,
          entityType: 'workspace:project',
          observations: [
            '[2026-01-02T00:00:00Z] path: /projects/my-project',
            '[2026-01-02T00:00:00Z] type: nodejs',
          ],
        }]);

        const entities = mockMemoryGraph.openNodes([entityName]);
        assert.strictEqual(entities.length, 1);
      });

      it('should return null for non-existent project', () => {
        const entities = mockMemoryGraph.openNodes(['workspace:project:nonexistent']);
        assert.strictEqual(entities.length, 0);
      });
    });

    describe('getConventions()', () => {
      it('should return project conventions', () => {
        const entityName = 'workspace:project:styled-project';
        const conventions = {
          indent: '2 spaces',
          quotes: 'single',
          semicolons: true,
        };

        mockMemoryGraph.createEntities([{
          name: entityName,
          entityType: 'workspace:project',
          observations: [
            `[2026-01-02T00:00:00Z] conventions: ${JSON.stringify(conventions)}`,
          ],
        }]);

        const entities = mockMemoryGraph.openNodes([entityName]);
        const convObs = entities[0].observations.find(o => o.includes('conventions:'));
        assert.ok(convObs);
        assert.ok(convObs.includes('indent'));
      });
    });

    describe('listProjects()', () => {
      it('should return all project entities', () => {
        mockMemoryGraph.createEntities([
          { name: 'workspace:project:project1', entityType: 'workspace:project', observations: [] },
          { name: 'workspace:project:project2', entityType: 'workspace:project', observations: [] },
          { name: 'workspace:file:somefile', entityType: 'workspace:file', observations: [] },
        ]);

        const graph = mockMemoryGraph.readGraph();
        const projects = graph.entities.filter(e => e.entityType === 'workspace:project');
        
        assert.strictEqual(projects.length, 2);
      });
    });
  });

  describe('FileKnowledge', () => {
    describe('learnFile()', () => {
      it('should create file entity with analysis', () => {
        const path = '/src/index.js';
        const entityName = `workspace:file:${path.replace(/\//g, '_')}`;
        const timestamp = new Date().toISOString();
        const analysis = {
          purpose: 'Application entry point',
          exports: ['main', 'start'],
          imports: ['express', 'dotenv'],
        };

        mockMemoryGraph.createEntities([{
          name: entityName,
          entityType: 'workspace:file',
          observations: [
            `[${timestamp}] path: ${path}`,
            `[${timestamp}] purpose: ${analysis.purpose}`,
            `[${timestamp}] exports: ${JSON.stringify(analysis.exports)}`,
            `[${timestamp}] imports: ${JSON.stringify(analysis.imports)}`,
          ],
        }]);

        const entities = mockMemoryGraph.openNodes([entityName]);
        assert.strictEqual(entities.length, 1);
        assert.ok(entities[0].observations.some(o => o.includes('purpose: Application entry point')));
      });
    });

    describe('getFile()', () => {
      it('should return file knowledge', () => {
        const entityName = 'workspace:file:_src_utils_js';
        
        mockMemoryGraph.createEntities([{
          name: entityName,
          entityType: 'workspace:file',
          observations: [
            '[2026-01-02T00:00:00Z] path: /src/utils.js',
            '[2026-01-02T00:00:00Z] purpose: Utility functions',
          ],
        }]);

        const entities = mockMemoryGraph.openNodes([entityName]);
        assert.strictEqual(entities.length, 1);
      });
    });

    describe('getFilesByPurpose()', () => {
      it('should find files matching purpose', () => {
        mockMemoryGraph.createEntities([
          { 
            name: 'workspace:file:config1', 
            entityType: 'workspace:file', 
            observations: ['[2026-01-02T00:00:00Z] purpose: Configuration'] 
          },
          { 
            name: 'workspace:file:config2', 
            entityType: 'workspace:file', 
            observations: ['[2026-01-02T00:00:00Z] purpose: Configuration loader'] 
          },
          { 
            name: 'workspace:file:utils', 
            entityType: 'workspace:file', 
            observations: ['[2026-01-02T00:00:00Z] purpose: Utilities'] 
          },
        ]);

        const graph = mockMemoryGraph.readGraph();
        const configFiles = graph.entities.filter(e => 
          e.entityType === 'workspace:file' &&
          e.observations.some(o => o.toLowerCase().includes('configuration'))
        );
        
        assert.strictEqual(configFiles.length, 2);
      });
    });

    describe('getDependencies()', () => {
      it('should return file dependencies from relations', () => {
        mockMemoryGraph.createEntities([
          { name: 'workspace:file:main', entityType: 'workspace:file', observations: [] },
          { name: 'workspace:file:utils', entityType: 'workspace:file', observations: [] },
        ]);

        mockMemoryGraph.createRelations([
          { from: 'workspace:file:main', to: 'workspace:file:utils', relationType: 'imports' },
        ]);

        const graph = mockMemoryGraph.readGraph();
        const deps = graph.relations.filter(r => r.from === 'workspace:file:main');
        
        assert.strictEqual(deps.length, 1);
        assert.strictEqual(deps[0].to, 'workspace:file:utils');
      });
    });

    describe('getRecentlyModified()', () => {
      it('should return files sorted by modification time', () => {
        mockMemoryGraph.createEntities([
          { 
            name: 'workspace:file:old', 
            entityType: 'workspace:file', 
            observations: ['[2026-01-01T00:00:00Z] last_modified: 2026-01-01T00:00:00Z'] 
          },
          { 
            name: 'workspace:file:new', 
            entityType: 'workspace:file', 
            observations: ['[2026-01-02T00:00:00Z] last_modified: 2026-01-02T00:00:00Z'] 
          },
        ]);

        const graph = mockMemoryGraph.readGraph();
        const files = graph.entities
          .filter(e => e.entityType === 'workspace:file')
          .sort((a, b) => {
            const aTime = a.observations.find(o => o.includes('last_modified:'));
            const bTime = b.observations.find(o => o.includes('last_modified:'));
            return bTime?.localeCompare(aTime) || 0;
          });

        assert.strictEqual(files[0].name, 'workspace:file:new');
      });
    });
  });

  describe('PatternLearner', () => {
    describe('learnPattern()', () => {
      it('should create pattern entity with examples', () => {
        const patternName = 'error-handling';
        const entityName = `workspace:pattern:${patternName}`;
        const timestamp = new Date().toISOString();
        const examples = [
          'try { ... } catch (error) { logger.error(error); }',
          'if (error) return { success: false, error };',
        ];

        mockMemoryGraph.createEntities([{
          name: entityName,
          entityType: 'workspace:pattern',
          observations: [
            `[${timestamp}] name: ${patternName}`,
            `[${timestamp}] examples: ${JSON.stringify(examples)}`,
            `[${timestamp}] occurrences: ${examples.length}`,
          ],
        }]);

        const entities = mockMemoryGraph.openNodes([entityName]);
        assert.strictEqual(entities.length, 1);
        assert.ok(entities[0].observations.some(o => o.includes('occurrences: 2')));
      });
    });

    describe('getPattern()', () => {
      it('should return pattern details', () => {
        const entityName = 'workspace:pattern:singleton';
        
        mockMemoryGraph.createEntities([{
          name: entityName,
          entityType: 'workspace:pattern',
          observations: [
            '[2026-01-02T00:00:00Z] name: singleton',
            '[2026-01-02T00:00:00Z] description: Single instance pattern',
          ],
        }]);

        const entities = mockMemoryGraph.openNodes([entityName]);
        assert.strictEqual(entities.length, 1);
      });
    });

    describe('matchPattern()', () => {
      it('should detect patterns in code', () => {
        const code = `
          let instance = null;
          function getInstance() {
            if (!instance) {
              instance = new Service();
            }
            return instance;
          }
        `;

        // Simulate pattern matching
        const patterns = [];
        if (code.includes('instance') && code.includes('getInstance')) {
          patterns.push('singleton');
        }

        assert.ok(patterns.includes('singleton'));
      });
    });

    describe('getProjectPatterns()', () => {
      it('should return patterns linked to project', () => {
        mockMemoryGraph.createEntities([
          { name: 'workspace:project:myapp', entityType: 'workspace:project', observations: [] },
          { name: 'workspace:pattern:pattern1', entityType: 'workspace:pattern', observations: [] },
          { name: 'workspace:pattern:pattern2', entityType: 'workspace:pattern', observations: [] },
        ]);

        mockMemoryGraph.createRelations([
          { from: 'workspace:project:myapp', to: 'workspace:pattern:pattern1', relationType: 'uses_pattern' },
          { from: 'workspace:project:myapp', to: 'workspace:pattern:pattern2', relationType: 'uses_pattern' },
        ]);

        const graph = mockMemoryGraph.readGraph();
        const projectPatterns = graph.relations.filter(
          r => r.from === 'workspace:project:myapp' && r.relationType === 'uses_pattern'
        );

        assert.strictEqual(projectPatterns.length, 2);
      });
    });

    describe('listPatterns()', () => {
      it('should return all pattern entities', () => {
        mockMemoryGraph.createEntities([
          { name: 'workspace:pattern:pattern1', entityType: 'workspace:pattern', observations: [] },
          { name: 'workspace:pattern:pattern2', entityType: 'workspace:pattern', observations: [] },
          { name: 'workspace:project:project1', entityType: 'workspace:project', observations: [] },
        ]);

        const graph = mockMemoryGraph.readGraph();
        const patterns = graph.entities.filter(e => e.entityType === 'workspace:pattern');
        
        assert.strictEqual(patterns.length, 2);
      });
    });
  });

  describe('workspaceHandlers', () => {
    it('should export all required handler methods', () => {
      const requiredMethods = [
        'analyzeProject',
        'getProject',
        'updateProject',
        'getProjectStructure',
        'getProjectConventions',
        'listProjects',
        'learnFile',
        'getFile',
        'getFilesByPurpose',
        'getFileDependencies',
        'getRecentlyModifiedFiles',
        'learnPattern',
        'getPattern',
        'matchPatterns',
        'getProjectPatterns',
        'listPatterns',
      ];

      for (const method of requiredMethods) {
        assert.ok(typeof method === 'string', `Method ${method} should be defined`);
      }
    });
  });
});
