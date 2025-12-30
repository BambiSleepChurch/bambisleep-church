/**
 * BambiSleep™ Church MCP Control Tower
 * Sequential Thinking MCP Server Wrapper - Reasoning Chains
 */

import { createLogger } from '../utils/logger.js';

const logger = createLogger('thinking');

/**
 * Sequential thinking client for reasoning chains
 */
class SequentialThinkingClient {
  constructor() {
    this.sessions = new Map();
    this.sessionCounter = 0;
  }

  /**
   * Start a new thinking session
   */
  startSession(title, description = '') {
    const id = `session_${++this.sessionCounter}_${Date.now()}`;
    
    this.sessions.set(id, {
      id,
      title,
      description,
      thoughts: [],
      branches: new Map(),
      currentBranch: 'main',
      status: 'active',
      startTime: new Date().toISOString(),
    });

    logger.info(`Started thinking session: ${id}`);
    return { success: true, sessionId: id };
  }

  /**
   * Add a thought to a session
   */
  addThought(sessionId, thought) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const thoughtEntry = {
      number: session.thoughts.length + 1,
      thought: thought.thought,
      isRevision: thought.isRevision || false,
      revisesThought: thought.revisesThought,
      branchId: thought.branchId || session.currentBranch,
      branchFromThought: thought.branchFromThought,
      timestamp: new Date().toISOString(),
    };

    // Handle branching
    if (thought.branchFromThought && thought.branchId) {
      if (!session.branches.has(thought.branchId)) {
        session.branches.set(thought.branchId, {
          id: thought.branchId,
          fromThought: thought.branchFromThought,
          thoughts: [],
        });
      }
      session.branches.get(thought.branchId).thoughts.push(thoughtEntry);
    } else {
      session.thoughts.push(thoughtEntry);
    }

    logger.debug(`Added thought #${thoughtEntry.number} to session ${sessionId}`);
    return {
      success: true,
      thoughtNumber: thoughtEntry.number,
      totalThoughts: session.thoughts.length,
    };
  }

  /**
   * Get session status
   */
  getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    return {
      ...session,
      branches: Array.from(session.branches.entries()).map(([id, branch]) => ({
        id,
        ...branch,
      })),
    };
  }

  /**
   * Generate hypothesis
   */
  generateHypothesis(sessionId, hypothesis) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.hypothesis = {
      content: hypothesis,
      verified: false,
      timestamp: new Date().toISOString(),
    };

    logger.info(`Hypothesis generated for session ${sessionId}`);
    return { success: true, hypothesis: session.hypothesis };
  }

  /**
   * Verify hypothesis
   */
  verifyHypothesis(sessionId, isValid, explanation) {
    const session = this.sessions.get(sessionId);
    if (!session || !session.hypothesis) {
      throw new Error(`Session ${sessionId} or hypothesis not found`);
    }

    session.hypothesis.verified = true;
    session.hypothesis.isValid = isValid;
    session.hypothesis.verification = explanation;
    session.hypothesis.verifiedAt = new Date().toISOString();

    return { success: true, hypothesis: session.hypothesis };
  }

  /**
   * Conclude session with final answer
   */
  conclude(sessionId, finalAnswer) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.status = 'concluded';
    session.finalAnswer = finalAnswer;
    session.endTime = new Date().toISOString();
    session.duration = new Date(session.endTime) - new Date(session.startTime);

    logger.info(`Session ${sessionId} concluded`);
    return {
      success: true,
      sessionId,
      finalAnswer,
      duration: session.duration,
      thoughtCount: session.thoughts.length,
    };
  }

  /**
   * Switch to a branch
   */
  switchBranch(sessionId, branchId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (branchId !== 'main' && !session.branches.has(branchId)) {
      throw new Error(`Branch ${branchId} not found`);
    }

    session.currentBranch = branchId;
    return { success: true, currentBranch: branchId };
  }

  /**
   * List all sessions
   */
  listSessions() {
    return Array.from(this.sessions.values()).map((session) => ({
      id: session.id,
      title: session.title,
      status: session.status,
      thoughtCount: session.thoughts.length,
      branchCount: session.branches.size,
      startTime: session.startTime,
      endTime: session.endTime,
    }));
  }

  /**
   * Delete session
   */
  deleteSession(sessionId) {
    if (!this.sessions.has(sessionId)) {
      throw new Error(`Session ${sessionId} not found`);
    }
    this.sessions.delete(sessionId);
    logger.info(`Deleted session: ${sessionId}`);
    return { success: true };
  }

  /**
   * Export session as markdown
   */
  exportAsMarkdown(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    let md = `# ${session.title}\n\n`;
    md += `*${session.description}*\n\n`;
    md += `**Status:** ${session.status}\n`;
    md += `**Started:** ${session.startTime}\n\n`;
    md += `## Thinking Process\n\n`;

    for (const thought of session.thoughts) {
      md += `### Thought ${thought.number}`;
      if (thought.isRevision) {
        md += ` (revises #${thought.revisesThought})`;
      }
      md += `\n\n${thought.thought}\n\n`;
    }

    // Include branches
    for (const [branchId, branch] of session.branches) {
      md += `\n## Branch: ${branchId}\n`;
      md += `*Branched from thought #${branch.fromThought}*\n\n`;
      
      for (const thought of branch.thoughts) {
        md += `### Thought ${thought.number}\n\n${thought.thought}\n\n`;
      }
    }

    if (session.hypothesis) {
      md += `## Hypothesis\n\n${session.hypothesis.content}\n\n`;
      if (session.hypothesis.verified) {
        md += `**Verification:** ${session.hypothesis.isValid ? '✓ Valid' : '✗ Invalid'}\n`;
        md += `${session.hypothesis.verification}\n\n`;
      }
    }

    if (session.finalAnswer) {
      md += `## Final Answer\n\n${session.finalAnswer}\n`;
    }

    return md;
  }

  /**
   * Get stats
   */
  getStats() {
    const sessions = Array.from(this.sessions.values());
    const active = sessions.filter((s) => s.status === 'active').length;
    const concluded = sessions.filter((s) => s.status === 'concluded').length;
    const totalThoughts = sessions.reduce((sum, s) => sum + s.thoughts.length, 0);

    return {
      totalSessions: sessions.length,
      activeSessions: active,
      concludedSessions: concluded,
      totalThoughts,
      averageThoughtsPerSession: sessions.length > 0 ? Math.round(totalThoughts / sessions.length) : 0,
    };
  }
}

// Singleton instance
export const thinkingClient = new SequentialThinkingClient();

/**
 * Sequential Thinking API handlers for REST endpoints
 */
export const thinkingHandlers = {
  // Session management
  startSession: (title, description) => thinkingClient.startSession(title, description),
  getSession: (id) => thinkingClient.getSession(id),
  listSessions: () => thinkingClient.listSessions(),
  deleteSession: (id) => thinkingClient.deleteSession(id),
  getStats: () => thinkingClient.getStats(),

  // Thinking process
  addThought: (sessionId, thought) => thinkingClient.addThought(sessionId, thought),
  switchBranch: (sessionId, branchId) => thinkingClient.switchBranch(sessionId, branchId),

  // Hypothesis
  generateHypothesis: (sessionId, hypothesis) => thinkingClient.generateHypothesis(sessionId, hypothesis),
  verifyHypothesis: (sessionId, isValid, explanation) => thinkingClient.verifyHypothesis(sessionId, isValid, explanation),

  // Conclusion
  conclude: (sessionId, answer) => thinkingClient.conclude(sessionId, answer),

  // Export
  exportAsMarkdown: (id) => thinkingClient.exportAsMarkdown(id),
};

export default thinkingHandlers;
