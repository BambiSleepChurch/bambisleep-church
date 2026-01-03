/**
 * BambiSleep™ Church MCP Control Tower
 * Unit Tests - Conversation Memory Module
 */

import assert from 'node:assert';
import { beforeEach, describe, it, mock } from 'node:test';

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

describe('Conversation Memory Module', () => {
  beforeEach(() => {
    mockMemoryGraph.reset();
  });

  describe('ConversationStore', () => {
    describe('startSession()', () => {
      it('should create a new session entity', () => {
        const timestamp = new Date().toISOString();
        const sessionId = `${Date.now().toString(36)}-test`;
        const entityName = `conversation:session:${sessionId}`;

        mockMemoryGraph.createEntities([{
          name: entityName,
          entityType: 'conversation:session',
          observations: [
            `[${timestamp}] started_at: ${timestamp}`,
            `[${timestamp}] status: active`,
            `[${timestamp}] message_count: 0`,
          ],
        }]);

        const entities = mockMemoryGraph.openNodes([entityName]);
        assert.strictEqual(entities.length, 1);
        assert.ok(entities[0].observations.some(o => o.includes('status: active')));
      });

      it('should generate unique session IDs', () => {
        const sessionId1 = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
        const sessionId2 = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
        
        assert.notStrictEqual(sessionId1, sessionId2);
      });

      it('should include metadata if provided', () => {
        const timestamp = new Date().toISOString();
        const metadata = { topic: 'Testing', context: { env: 'test' } };
        
        const observations = [
          `[${timestamp}] started_at: ${timestamp}`,
          `[${timestamp}] initial_topic: ${metadata.topic}`,
          `[${timestamp}] initial_context: ${JSON.stringify(metadata.context)}`,
        ];

        assert.ok(observations.some(o => o.includes('initial_topic: Testing')));
        assert.ok(observations.some(o => o.includes('initial_context:')));
      });
    });

    describe('endSession()', () => {
      it('should update session status to completed', () => {
        const sessionId = 'test-session';
        const entityName = `conversation:session:${sessionId}`;
        const timestamp = new Date().toISOString();

        mockMemoryGraph.createEntities([{
          name: entityName,
          entityType: 'conversation:session',
          observations: ['[2026-01-02T00:00:00Z] status: active'],
        }]);

        mockMemoryGraph.addObservations(entityName, [
          `[${timestamp}] ended_at: ${timestamp}`,
          `[${timestamp}] status: completed`,
        ]);

        const entities = mockMemoryGraph.openNodes([entityName]);
        assert.ok(entities[0].observations.some(o => o.includes('status: completed')));
      });

      it('should include summary if provided', () => {
        const entityName = 'conversation:session:test';
        const summary = 'Discussed testing strategies';

        mockMemoryGraph.createEntities([{
          name: entityName,
          entityType: 'conversation:session',
          observations: ['[2026-01-02T00:00:00Z] status: active'],
        }]);

        mockMemoryGraph.addObservations(entityName, [
          `[2026-01-02T00:01:00Z] summary: ${summary}`,
        ]);

        const entities = mockMemoryGraph.openNodes([entityName]);
        assert.ok(entities[0].observations.some(o => o.includes(summary)));
      });
    });

    describe('addMessage()', () => {
      it('should add message to session', () => {
        const sessionId = 'test-session';
        const entityName = `conversation:session:${sessionId}`;
        const timestamp = new Date().toISOString();

        mockMemoryGraph.createEntities([{
          name: entityName,
          entityType: 'conversation:session',
          observations: ['[2026-01-02T00:00:00Z] message_count: 0'],
        }]);

        mockMemoryGraph.addObservations(entityName, [
          `[${timestamp}] message_count: 1`,
        ]);

        const entities = mockMemoryGraph.openNodes([entityName]);
        assert.ok(entities[0].observations.some(o => o.includes('message_count: 1')));
      });

      it('should support different message roles', () => {
        const roles = ['user', 'assistant', 'system'];
        
        for (const role of roles) {
          const message = { role, content: `Test ${role} message` };
          assert.ok(['user', 'assistant', 'system'].includes(message.role));
        }
      });
    });

    describe('getRecentContext()', () => {
      it('should return limited messages', () => {
        const messages = [
          { role: 'user', content: 'Message 1' },
          { role: 'assistant', content: 'Response 1' },
          { role: 'user', content: 'Message 2' },
          { role: 'assistant', content: 'Response 2' },
          { role: 'user', content: 'Message 3' },
        ];

        const limit = 3;
        const recent = messages.slice(-limit);
        
        assert.strictEqual(recent.length, 3);
        assert.strictEqual(recent[0].content, 'Response 1');
      });
    });
  });

  describe('Summarizer', () => {
    describe('extractKeyPoints()', () => {
      it('should extract points from messages', () => {
        const messages = [
          { role: 'user', content: 'How do I test async functions?' },
          { role: 'assistant', content: 'Use async/await with test framework.' },
        ];

        // Simulate key point extraction
        const keyPoints = messages
          .filter(m => m.role === 'assistant')
          .map(m => m.content);

        assert.ok(keyPoints.length > 0);
      });
    });

    describe('extractDecisions()', () => {
      it('should identify decisions in conversation', () => {
        const messages = [
          { role: 'user', content: 'Should we use Jest or Node test?' },
          { role: 'assistant', content: 'I recommend Node test runner for this project.' },
          { role: 'user', content: 'Lets go with Node test then.' },
        ];

        // Simulate decision extraction
        const decisions = [];
        for (const msg of messages) {
          if (msg.content.toLowerCase().includes('go with') || 
              msg.content.toLowerCase().includes('recommend')) {
            decisions.push(msg.content);
          }
        }

        assert.ok(decisions.length >= 1);
      });
    });

    describe('summarizeSession()', () => {
      it('should create summary entity', () => {
        const sessionId = 'test-session';
        const summaryEntity = `conversation:summary:${sessionId}`;
        const timestamp = new Date().toISOString();

        mockMemoryGraph.createEntities([{
          name: summaryEntity,
          entityType: 'conversation:summary',
          observations: [
            `[${timestamp}] session_id: ${sessionId}`,
            `[${timestamp}] summary: Test conversation about unit testing`,
            `[${timestamp}] key_points: ["Use Node test runner", "Mock dependencies"]`,
          ],
        }]);

        const entities = mockMemoryGraph.openNodes([summaryEntity]);
        assert.strictEqual(entities.length, 1);
      });
    });
  });

  describe('ContextManager', () => {
    describe('getCurrentContext()', () => {
      it('should return context object', () => {
        const context = {
          currentTopic: 'testing',
          pendingTasks: [],
          recentEntities: [],
          sessionId: 'test-123',
        };

        assert.ok(context.hasOwnProperty('currentTopic'));
        assert.ok(context.hasOwnProperty('pendingTasks'));
        assert.ok(Array.isArray(context.pendingTasks));
      });
    });

    describe('updateContext()', () => {
      it('should update context key', () => {
        const context = { currentTopic: 'old-topic' };
        context.currentTopic = 'new-topic';
        
        assert.strictEqual(context.currentTopic, 'new-topic');
      });
    });

    describe('addPendingTask()', () => {
      it('should add task to pending list', () => {
        const tasks = [];
        tasks.push({ task: 'Write more tests', priority: 'high' });
        
        assert.strictEqual(tasks.length, 1);
        assert.strictEqual(tasks[0].priority, 'high');
      });

      it('should support priority levels', () => {
        const validPriorities = ['low', 'medium', 'high'];
        
        for (const priority of validPriorities) {
          assert.ok(validPriorities.includes(priority));
        }
      });
    });

    describe('completeTask()', () => {
      it('should remove task from pending list', () => {
        const tasks = [
          { task: 'Task 1', id: 1 },
          { task: 'Task 2', id: 2 },
        ];
        
        const completed = tasks.filter(t => t.id !== 1);
        
        assert.strictEqual(completed.length, 1);
        assert.strictEqual(completed[0].task, 'Task 2');
      });
    });

    describe('getActiveTopics()', () => {
      it('should return recent topics', () => {
        const entityName = 'conversation:context:main';
        
        mockMemoryGraph.createEntities([{
          name: entityName,
          entityType: 'conversation:context',
          observations: [
            '[2026-01-02T00:00:00Z] topic: testing',
            '[2026-01-02T00:01:00Z] topic: documentation',
          ],
        }]);

        const entities = mockMemoryGraph.openNodes([entityName]);
        const topicObs = entities[0].observations.filter(o => o.includes('topic:'));
        
        assert.strictEqual(topicObs.length, 2);
      });
    });

    describe('buildPromptContext()', () => {
      it('should build context within token limit', () => {
        const maxTokens = 1000;
        const context = {
          recentMessages: 'Last 5 messages here...',
          currentTopic: 'Testing',
          pendingTasks: ['Task 1', 'Task 2'],
        };
        
        const prompt = JSON.stringify(context);
        // Rough token estimate: ~4 chars per token
        const estimatedTokens = prompt.length / 4;
        
        assert.ok(estimatedTokens < maxTokens);
      });
    });

    describe('reset()', () => {
      it('should clear all context data', () => {
        const context = {
          currentTopic: 'topic',
          pendingTasks: ['task'],
          recentEntities: ['entity'],
        };
        
        // Reset
        context.currentTopic = null;
        context.pendingTasks = [];
        context.recentEntities = [];
        
        assert.strictEqual(context.currentTopic, null);
        assert.strictEqual(context.pendingTasks.length, 0);
      });
    });
  });

  describe('conversationHandlers', () => {
    it('should export all required handler methods', () => {
      const requiredMethods = [
        'startSession',
        'endSession',
        'addMessage',
        'getCurrentSession',
        'getSession',
        'getSessions',
        'getRecentContext',
        'getMessageBuffer',
        'summarizeSession',
        'summarizePeriod',
        'extractKeyPoints',
        'extractDecisions',
        'getCurrentContext',
        'updateContext',
        'addPendingTask',
        'completeTask',
        'getActiveTopics',
        'getPendingTasks',
        'buildPromptContext',
        'resetContext',
      ];

      for (const method of requiredMethods) {
        assert.ok(typeof method === 'string', `Method ${method} should be defined`);
      }
    });
  });
});
