/**
 * BambiSleep™ Church MCP Control Tower
 * Unit Tests - Sequential Thinking Module (Reasoning Chains)
 */

import assert from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { thinkingClient, thinkingHandlers } from '../../src/servers/sequential-thinking.js';

describe('Sequential Thinking Module', () => {
  let sessionId;

  // Clean up sessions after each test
  afterEach(() => {
    try {
      const sessions = thinkingClient.listSessions();
      for (const session of sessions) {
        thinkingClient.deleteSession(session.id);
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('SequentialThinkingClient', () => {
    describe('startSession()', () => {
      it('should create a new session with unique ID', () => {
        const result = thinkingClient.startSession('Test Session', 'Description');

        assert.strictEqual(result.success, true);
        assert.ok(result.sessionId.startsWith('session_'));
        sessionId = result.sessionId;
      });

      it('should generate unique session IDs', () => {
        const result1 = thinkingClient.startSession('Session 1');
        const result2 = thinkingClient.startSession('Session 2');

        assert.notStrictEqual(result1.sessionId, result2.sessionId);
      });

      it('should initialize session with active status', () => {
        const { sessionId } = thinkingClient.startSession('Test');
        const session = thinkingClient.getSession(sessionId);

        assert.strictEqual(session.status, 'active');
        assert.ok(session.startTime);
      });
    });

    describe('addThought()', () => {
      beforeEach(() => {
        sessionId = thinkingClient.startSession('Thought Test').sessionId;
      });

      it('should add thought to session', () => {
        const result = thinkingClient.addThought(sessionId, {
          thought: 'First thought',
          isRevision: false,
        });

        assert.strictEqual(result.success, true);
        assert.strictEqual(result.thoughtNumber, 1);
      });

      it('should increment thought numbers', () => {
        thinkingClient.addThought(sessionId, { thought: 'Thought 1' });
        const result = thinkingClient.addThought(sessionId, { thought: 'Thought 2' });

        assert.strictEqual(result.thoughtNumber, 2);
        assert.strictEqual(result.totalThoughts, 2);
      });

      it('should throw for non-existent session', () => {
        assert.throws(() => {
          thinkingClient.addThought('invalid_session', { thought: 'Test' });
        }, /not found/);
      });

      it('should track revision metadata', () => {
        thinkingClient.addThought(sessionId, { thought: 'Original' });
        thinkingClient.addThought(sessionId, {
          thought: 'Revised thinking',
          isRevision: true,
          revisesThought: 1,
        });

        const session = thinkingClient.getSession(sessionId);
        const revision = session.thoughts[1];

        assert.strictEqual(revision.isRevision, true);
        assert.strictEqual(revision.revisesThought, 1);
      });

      it('should support branching', () => {
        thinkingClient.addThought(sessionId, { thought: 'Main thought 1' });
        thinkingClient.addThought(sessionId, {
          thought: 'Branch thought',
          branchId: 'alt-branch',
          branchFromThought: 1,
        });

        const session = thinkingClient.getSession(sessionId);
        
        assert.strictEqual(session.branches.length, 1);
        assert.strictEqual(session.branches[0].id, 'alt-branch');
      });
    });

    describe('getSession()', () => {
      beforeEach(() => {
        sessionId = thinkingClient.startSession('Get Test', 'Testing retrieval').sessionId;
      });

      it('should retrieve session by ID', () => {
        const session = thinkingClient.getSession(sessionId);

        assert.strictEqual(session.title, 'Get Test');
        assert.strictEqual(session.description, 'Testing retrieval');
      });

      it('should throw for non-existent session', () => {
        assert.throws(() => {
          thinkingClient.getSession('non_existent');
        }, /not found/);
      });

      it('should include thoughts array', () => {
        thinkingClient.addThought(sessionId, { thought: 'Test thought' });
        
        const session = thinkingClient.getSession(sessionId);
        
        assert.ok(Array.isArray(session.thoughts));
        assert.strictEqual(session.thoughts.length, 1);
      });
    });

    describe('generateHypothesis()', () => {
      beforeEach(() => {
        sessionId = thinkingClient.startSession('Hypothesis Test').sessionId;
        thinkingClient.addThought(sessionId, { thought: 'Analysis step 1' });
      });

      it('should generate hypothesis', () => {
        const result = thinkingClient.generateHypothesis(sessionId, 'The answer is 42');

        assert.strictEqual(result.success, true);
        assert.strictEqual(result.hypothesis.content, 'The answer is 42');
        assert.strictEqual(result.hypothesis.verified, false);
      });

      it('should throw for non-existent session', () => {
        assert.throws(() => {
          thinkingClient.generateHypothesis('invalid', 'Test');
        }, /not found/);
      });
    });

    describe('verifyHypothesis()', () => {
      beforeEach(() => {
        sessionId = thinkingClient.startSession('Verify Test').sessionId;
        thinkingClient.addThought(sessionId, { thought: 'Step 1' });
        thinkingClient.generateHypothesis(sessionId, 'Hypothesis to verify');
      });

      it('should verify hypothesis as valid', () => {
        const result = thinkingClient.verifyHypothesis(sessionId, true, 'Evidence supports');

        assert.strictEqual(result.success, true);
        assert.strictEqual(result.hypothesis.verified, true);
        assert.strictEqual(result.hypothesis.isValid, true);
        assert.strictEqual(result.hypothesis.verification, 'Evidence supports');
      });

      it('should verify hypothesis as invalid', () => {
        const result = thinkingClient.verifyHypothesis(sessionId, false, 'Contradicted by data');

        assert.strictEqual(result.hypothesis.isValid, false);
      });

      it('should throw when no hypothesis exists', () => {
        const newSession = thinkingClient.startSession('No Hypothesis').sessionId;
        
        assert.throws(() => {
          thinkingClient.verifyHypothesis(newSession, true, 'Test');
        }, /not found/);
      });
    });

    describe('conclude()', () => {
      beforeEach(() => {
        sessionId = thinkingClient.startSession('Conclude Test').sessionId;
        thinkingClient.addThought(sessionId, { thought: 'Final analysis' });
      });

      it('should conclude session with final answer', () => {
        const result = thinkingClient.conclude(sessionId, 'The final answer');

        assert.strictEqual(result.success, true);
        assert.strictEqual(result.finalAnswer, 'The final answer');
        assert.ok(result.thoughtCount > 0);
      });

      it('should set session status to concluded', () => {
        thinkingClient.conclude(sessionId, 'Answer');
        
        const session = thinkingClient.getSession(sessionId);
        
        assert.strictEqual(session.status, 'concluded');
        assert.ok(session.endTime);
        assert.ok(session.duration >= 0);
      });

      it('should throw for non-existent session', () => {
        assert.throws(() => {
          thinkingClient.conclude('invalid', 'Answer');
        }, /not found/);
      });
    });

    describe('switchBranch()', () => {
      beforeEach(() => {
        sessionId = thinkingClient.startSession('Branch Test').sessionId;
        thinkingClient.addThought(sessionId, { thought: 'Main' });
        thinkingClient.addThought(sessionId, {
          thought: 'Alt path',
          branchId: 'alternative',
          branchFromThought: 1,
        });
      });

      it('should switch to existing branch', () => {
        const result = thinkingClient.switchBranch(sessionId, 'alternative');

        assert.strictEqual(result.success, true);
        assert.strictEqual(result.currentBranch, 'alternative');
      });

      it('should switch to main branch', () => {
        thinkingClient.switchBranch(sessionId, 'alternative');
        const result = thinkingClient.switchBranch(sessionId, 'main');

        assert.strictEqual(result.currentBranch, 'main');
      });

      it('should throw for non-existent branch', () => {
        assert.throws(() => {
          thinkingClient.switchBranch(sessionId, 'nonexistent');
        }, /not found/);
      });
    });

    describe('listSessions()', () => {
      it('should return empty array when no sessions', () => {
        const sessions = thinkingClient.listSessions();
        
        assert.ok(Array.isArray(sessions));
      });

      it('should list all sessions with summary info', () => {
        thinkingClient.startSession('Session A');
        thinkingClient.startSession('Session B');

        const sessions = thinkingClient.listSessions();

        assert.strictEqual(sessions.length, 2);
        assert.ok(sessions.every(s => s.id && s.title && s.status));
      });
    });

    describe('deleteSession()', () => {
      beforeEach(() => {
        sessionId = thinkingClient.startSession('Delete Test').sessionId;
      });

      it('should delete existing session', () => {
        const result = thinkingClient.deleteSession(sessionId);

        assert.strictEqual(result.success, true);
        
        assert.throws(() => {
          thinkingClient.getSession(sessionId);
        }, /not found/);
      });

      it('should throw for non-existent session', () => {
        assert.throws(() => {
          thinkingClient.deleteSession('invalid_id');
        }, /not found/);
      });
    });
  });

  describe('thinkingHandlers', () => {
    it('should expose all required handler methods', () => {
      assert.strictEqual(typeof thinkingHandlers.startSession, 'function');
      assert.strictEqual(typeof thinkingHandlers.addThought, 'function');
      assert.strictEqual(typeof thinkingHandlers.getSession, 'function');
      assert.strictEqual(typeof thinkingHandlers.listSessions, 'function');
      assert.strictEqual(typeof thinkingHandlers.deleteSession, 'function');
      assert.strictEqual(typeof thinkingHandlers.generateHypothesis, 'function');
      assert.strictEqual(typeof thinkingHandlers.verifyHypothesis, 'function');
      assert.strictEqual(typeof thinkingHandlers.conclude, 'function');
      assert.strictEqual(typeof thinkingHandlers.switchBranch, 'function');
    });
  });
});
