/**
 * BambiSleep™ Church MCP Control Tower
 * Conversation Memory - Session tracking, summarization, and context management
 */

import { createLogger } from '../../utils/logger.js';
import { lmstudioHandlers } from '../lmstudio.js';
import { memoryGraph } from './graph.js';
import {
  ENTITY_TYPES,
  RELATION_TYPES,
  getDaysSince,
  parseObservations
} from './schema.js';

const logger = createLogger('conversation-memory');

// ============================================================================
// CONVERSATION STORE CLASS
// ============================================================================

/**
 * Manages conversation sessions and message history
 */
export class ConversationStore {
  #activeSession = null;
  #messageBuffer = [];

  /**
   * Start a new conversation session
   * @param {Object} [metadata] - Optional session metadata
   * @returns {string} Session ID
   */
  startSession(metadata = {}) {
    const timestamp = new Date().toISOString();
    const sessionId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const entityName = `${ENTITY_TYPES.CONVERSATION_SESSION}:${sessionId}`;

    const observations = [
      `[${timestamp}] started_at: ${timestamp}`,
      `[${timestamp}] status: active`,
      `[${timestamp}] message_count: 0`,
    ];

    // Add metadata observations
    if (metadata.topic) {
      observations.push(`[${timestamp}] initial_topic: ${metadata.topic}`);
    }
    if (metadata.context) {
      observations.push(`[${timestamp}] initial_context: ${JSON.stringify(metadata.context)}`);
    }

    memoryGraph.createEntities([{
      name: entityName,
      entityType: ENTITY_TYPES.CONVERSATION_SESSION,
      observations,
    }]);

    // Link to previous session if exists
    if (this.#activeSession) {
      memoryGraph.createRelations([{
        from: entityName,
        to: `${ENTITY_TYPES.CONVERSATION_SESSION}:${this.#activeSession}`,
        relationType: RELATION_TYPES.CONTINUES_FROM,
      }]);
    }

    this.#activeSession = sessionId;
    this.#messageBuffer = [];
    
    logger.info('Started conversation session', { sessionId });
    return sessionId;
  }

  /**
   * End the current conversation session
   * @param {string} [summary] - Optional session summary
   * @returns {Object} Session data
   */
  endSession(summary = null) {
    if (!this.#activeSession) {
      logger.warn('No active session to end');
      return null;
    }

    const timestamp = new Date().toISOString();
    const entityName = `${ENTITY_TYPES.CONVERSATION_SESSION}:${this.#activeSession}`;
    
    const observations = [
      `[${timestamp}] ended_at: ${timestamp}`,
      `[${timestamp}] status: completed`,
      `[${timestamp}] message_count: ${this.#messageBuffer.length}`,
    ];

    if (summary) {
      observations.push(`[${timestamp}] summary: ${summary}`);
    }

    // Extract topics and decisions from buffer
    const topics = this.#extractTopics(this.#messageBuffer);
    if (topics.length > 0) {
      observations.push(`[${timestamp}] key_topics: ${JSON.stringify(topics)}`);
    }

    memoryGraph.addObservations(entityName, observations);

    const sessionData = {
      sessionId: this.#activeSession,
      messageCount: this.#messageBuffer.length,
      topics,
      summary,
    };

    this.#activeSession = null;
    this.#messageBuffer = [];

    logger.info('Ended conversation session', sessionData);
    return sessionData;
  }

  /**
   * Add a message to the current session
   * @param {string} role - 'user' | 'assistant' | 'system'
   * @param {string} content - Message content
   * @param {Object} [metadata] - Optional metadata (toolCalls, etc.)
   * @returns {Object} Message record
   */
  addMessage(role, content, metadata = {}) {
    // Auto-start session if needed
    if (!this.#activeSession) {
      this.startSession();
    }

    const timestamp = new Date().toISOString();
    const messageId = this.#messageBuffer.length;
    
    const message = {
      id: messageId,
      role,
      content,
      timestamp,
      ...metadata,
    };

    this.#messageBuffer.push(message);

    // Update session message count
    const entityName = `${ENTITY_TYPES.CONVERSATION_SESSION}:${this.#activeSession}`;
    memoryGraph.addObservations(entityName, [
      `[${timestamp}] message_count: ${this.#messageBuffer.length}`,
    ]);

    logger.debug('Added message', { sessionId: this.#activeSession, role, messageId });
    return message;
  }

  /**
   * Get current session ID
   * @returns {string|null} Active session ID
   */
  getCurrentSessionId() {
    return this.#activeSession;
  }

  /**
   * Get a specific session by ID
   * @param {string} sessionId - Session ID
   * @returns {Object|null} Session data
   */
  getSession(sessionId) {
    const entityName = `${ENTITY_TYPES.CONVERSATION_SESSION}:${sessionId}`;
    const nodes = memoryGraph.openNodes([entityName]);
    
    if (nodes.length === 0) return null;

    const parsed = parseObservations(nodes[0].observations);
    return {
      sessionId,
      startedAt: parsed.started_at?.value,
      endedAt: parsed.ended_at?.value,
      status: parsed.status?.value || 'unknown',
      messageCount: parsed.message_count?.value || 0,
      summary: parsed.summary?.value,
      topics: parsed.key_topics?.value || [],
      initialTopic: parsed.initial_topic?.value,
    };
  }

  /**
   * Get sessions with optional filtering
   * @param {Object} [filter] - Filter options
   * @param {string} [filter.status] - 'active' | 'completed'
   * @param {number} [filter.limit] - Max results
   * @param {Date} [filter.since] - Sessions since date
   * @returns {Object[]} Session list
   */
  getSessions(filter = {}) {
    const graph = memoryGraph.readGraph();
    let sessions = [];

    for (const entity of graph.entities) {
      if (entity.entityType !== ENTITY_TYPES.CONVERSATION_SESSION) continue;

      const sessionId = entity.name.split(':').slice(2).join(':');
      const session = this.getSession(sessionId);
      
      if (!session) continue;

      // Apply filters
      if (filter.status && session.status !== filter.status) continue;
      if (filter.since && new Date(session.startedAt) < filter.since) continue;

      sessions.push(session);
    }

    // Sort by start time, most recent first
    sessions.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));

    if (filter.limit) {
      sessions = sessions.slice(0, filter.limit);
    }

    return sessions;
  }

  /**
   * Get recent conversation context
   * @param {number} [limit=10] - Number of recent messages
   * @returns {Object[]} Recent messages
   */
  getRecentContext(limit = 10) {
    return this.#messageBuffer.slice(-limit);
  }

  /**
   * Get current message buffer
   * @returns {Object[]} All messages in current session
   */
  getMessageBuffer() {
    return [...this.#messageBuffer];
  }

  /**
   * Extract topics from messages
   * @private
   */
  #extractTopics(messages) {
    const topics = new Set();
    const topicPatterns = [
      /(?:about|regarding|discussing)\s+([a-zA-Z][a-zA-Z\s]+)/gi,
      /(?:implement|create|build|add)\s+([a-zA-Z][a-zA-Z\s]+)/gi,
      /(?:fix|debug|resolve)\s+([a-zA-Z][a-zA-Z\s]+)/gi,
    ];

    for (const msg of messages) {
      if (msg.role !== 'user') continue;
      
      for (const pattern of topicPatterns) {
        const matches = msg.content.matchAll(pattern);
        for (const match of matches) {
          const topic = match[1].trim().toLowerCase();
          if (topic.length > 2 && topic.length < 50) {
            topics.add(topic);
          }
        }
      }
    }

    return Array.from(topics).slice(0, 10);
  }
}

// ============================================================================
// SUMMARIZER CLASS
// ============================================================================

/**
 * Generates summaries using LM Studio integration
 */
export class Summarizer {
  #maxTokens;

  constructor(maxTokens = 500) {
    this.#maxTokens = maxTokens;
  }

  /**
   * Summarize a conversation session
   * @param {string} sessionId - Session to summarize
   * @param {Object[]} [messages] - Optional messages (uses buffer if not provided)
   * @returns {Promise<Object>} Summary data
   */
  async summarizeSession(sessionId, messages = null) {
    const store = getConversationStore();
    const sessionMessages = messages || store.getMessageBuffer();

    if (sessionMessages.length === 0) {
      return { summary: '', keyPoints: [], decisions: [] };
    }

    // Format messages for summarization
    const transcript = sessionMessages
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n\n');

    const prompt = `Summarize this conversation in 2-3 sentences. Then list key points and any decisions made.

CONVERSATION:
${this.compressToTokenLimit(transcript, 2000)}

Respond in JSON format:
{
  "summary": "Brief 2-3 sentence summary",
  "keyPoints": ["point 1", "point 2"],
  "decisions": ["decision 1"]
}`;

    try {
      const response = await lmstudioHandlers.chat([
        { role: 'system', content: 'You are a helpful assistant that summarizes conversations. Always respond with valid JSON.' },
        { role: 'user', content: prompt },
      ]);

      // Parse JSON from response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        
        // Store summary as entity
        await this.#storeSummary(sessionId, result);
        
        return result;
      }
    } catch (error) {
      logger.error('Failed to summarize session', { sessionId, error: error.message });
    }

    // Fallback: extract without LLM
    return {
      summary: `Conversation with ${sessionMessages.length} messages`,
      keyPoints: this.extractKeyPoints(sessionMessages),
      decisions: this.extractDecisions(sessionMessages),
    };
  }

  /**
   * Summarize conversations over a time period
   * @param {Date} start - Start date
   * @param {Date} end - End date
   * @returns {Promise<Object>} Period summary
   */
  async summarizePeriod(start, end) {
    const store = getConversationStore();
    const sessions = store.getSessions({ since: start });
    
    const inRange = sessions.filter(s => {
      const sessionDate = new Date(s.startedAt);
      return sessionDate >= start && sessionDate <= end;
    });

    const allTopics = [];
    const allSummaries = [];
    let totalMessages = 0;

    for (const session of inRange) {
      if (session.topics) allTopics.push(...session.topics);
      if (session.summary) allSummaries.push(session.summary);
      totalMessages += session.messageCount || 0;
    }

    // Deduplicate topics
    const uniqueTopics = [...new Set(allTopics)];

    return {
      period: { start, end },
      sessionCount: inRange.length,
      totalMessages,
      topics: uniqueTopics.slice(0, 20),
      summaries: allSummaries,
    };
  }

  /**
   * Extract key points from messages (without LLM)
   * @param {Object[]} messages - Message array
   * @returns {string[]} Key points
   */
  extractKeyPoints(messages) {
    const keyPoints = [];
    const patterns = [
      /(?:the key is|important(?:ly)?|note that|remember)\s*[:,-]?\s*([^.!?]+[.!?])/gi,
      /(?:I (?:recommend|suggest)|you should)\s+([^.!?]+[.!?])/gi,
    ];

    for (const msg of messages) {
      if (msg.role !== 'assistant') continue;
      
      for (const pattern of patterns) {
        const matches = msg.content.matchAll(pattern);
        for (const match of matches) {
          const point = match[1].trim();
          if (point.length > 10 && point.length < 200) {
            keyPoints.push(point);
          }
        }
      }
    }

    return keyPoints.slice(0, 5);
  }

  /**
   * Extract decisions from messages (without LLM)
   * @param {Object[]} messages - Message array
   * @returns {string[]} Decisions
   */
  extractDecisions(messages) {
    const decisions = [];
    const patterns = [
      /(?:let'?s|we (?:will|should)|I'?ll)\s+([^.!?]+[.!?])/gi,
      /(?:decided to|going to|plan to)\s+([^.!?]+[.!?])/gi,
    ];

    for (const msg of messages) {
      for (const pattern of patterns) {
        const matches = msg.content.matchAll(pattern);
        for (const match of matches) {
          const decision = match[1].trim();
          if (decision.length > 10 && decision.length < 200) {
            decisions.push(decision);
          }
        }
      }
    }

    return decisions.slice(0, 5);
  }

  /**
   * Compress text to fit within token limit
   * @param {string} text - Text to compress
   * @param {number} maxTokens - Max tokens (approx 4 chars per token)
   * @returns {string} Compressed text
   */
  compressToTokenLimit(text, maxTokens) {
    const approxChars = maxTokens * 4;
    if (text.length <= approxChars) return text;

    // Take beginning and end
    const halfLength = Math.floor(approxChars / 2) - 50;
    return `${text.slice(0, halfLength)}\n\n[... ${Math.floor((text.length - approxChars) / 4)} tokens omitted ...]\n\n${text.slice(-halfLength)}`;
  }

  /**
   * Store summary as entity
   * @private
   */
  async #storeSummary(sessionId, summaryData) {
    const timestamp = new Date().toISOString();
    const entityName = `${ENTITY_TYPES.CONVERSATION_SUMMARY}:${sessionId}`;

    const observations = [
      `[${timestamp}] session_id: ${sessionId}`,
      `[${timestamp}] summary: ${summaryData.summary}`,
      `[${timestamp}] key_points: ${JSON.stringify(summaryData.keyPoints)}`,
      `[${timestamp}] decisions: ${JSON.stringify(summaryData.decisions)}`,
      `[${timestamp}] created_at: ${timestamp}`,
    ];

    memoryGraph.createEntities([{
      name: entityName,
      entityType: ENTITY_TYPES.CONVERSATION_SUMMARY,
      observations,
    }]);

    // Link summary to session
    memoryGraph.createRelations([{
      from: `${ENTITY_TYPES.CONVERSATION_SESSION}:${sessionId}`,
      to: entityName,
      relationType: RELATION_TYPES.SUMMARIZED_IN,
    }]);
  }
}

// ============================================================================
// CONTEXT MANAGER CLASS
// ============================================================================

/**
 * Manages conversation context for prompt building
 */
export class ContextManager {
  #contextCache = new Map();
  #activeTopics = new Set();
  #pendingTasks = [];

  /**
   * Get current conversation context
   * @returns {Object} Context data
   */
  getCurrentContext() {
    return {
      activeTopics: Array.from(this.#activeTopics),
      pendingTasks: [...this.#pendingTasks],
      recentEntities: this.#getRecentlyMentionedEntities(),
      sessionId: getConversationStore().getCurrentSessionId(),
    };
  }

  /**
   * Update a context value
   * @param {string} key - Context key
   * @param {*} value - Context value
   */
  updateContext(key, value) {
    this.#contextCache.set(key, {
      value,
      timestamp: Date.now(),
    });
    
    // Track topics
    if (key === 'topic') {
      this.#activeTopics.add(value);
    }
    
    logger.debug('Updated context', { key, value });
  }

  /**
   * Add a pending task
   * @param {string} task - Task description
   * @param {string} [priority='normal'] - Task priority
   */
  addPendingTask(task, priority = 'normal') {
    this.#pendingTasks.push({
      task,
      priority,
      addedAt: new Date().toISOString(),
    });
  }

  /**
   * Complete a pending task
   * @param {string} task - Task to complete (partial match)
   * @returns {boolean} Whether task was found and removed
   */
  completeTask(task) {
    const idx = this.#pendingTasks.findIndex(t => 
      t.task.toLowerCase().includes(task.toLowerCase())
    );
    
    if (idx >= 0) {
      this.#pendingTasks.splice(idx, 1);
      return true;
    }
    return false;
  }

  /**
   * Get active topics
   * @returns {string[]} Active topics
   */
  getActiveTopics() {
    return Array.from(this.#activeTopics);
  }

  /**
   * Get pending tasks
   * @returns {Object[]} Pending tasks
   */
  getPendingTasks() {
    return [...this.#pendingTasks];
  }

  /**
   * Clear a specific topic
   * @param {string} topic - Topic to clear
   */
  clearTopic(topic) {
    this.#activeTopics.delete(topic);
  }

  /**
   * Build context for prompt injection
   * @param {number} [maxTokens=500] - Max tokens for context
   * @returns {string} Context string for prompt
   */
  buildPromptContext(maxTokens = 500) {
    const parts = [];

    // Add active topics
    if (this.#activeTopics.size > 0) {
      parts.push(`Active topics: ${Array.from(this.#activeTopics).join(', ')}`);
    }

    // Add pending tasks
    if (this.#pendingTasks.length > 0) {
      const tasks = this.#pendingTasks
        .slice(0, 5)
        .map(t => `- ${t.task}`)
        .join('\n');
      parts.push(`Pending tasks:\n${tasks}`);
    }

    // Add recent context values
    const recentContext = Array.from(this.#contextCache.entries())
      .filter(([_, v]) => Date.now() - v.timestamp < 300000) // Last 5 minutes
      .map(([k, v]) => `${k}: ${JSON.stringify(v.value)}`)
      .slice(0, 10);
    
    if (recentContext.length > 0) {
      parts.push(`Recent context:\n${recentContext.join('\n')}`);
    }

    const context = parts.join('\n\n');
    
    // Compress if needed
    const approxTokens = context.length / 4;
    if (approxTokens > maxTokens) {
      return context.slice(0, maxTokens * 4);
    }

    return context;
  }

  /**
   * Get recently mentioned entities from memory
   * @private
   */
  #getRecentlyMentionedEntities() {
    const graph = memoryGraph.readGraph();
    const recent = [];
    const now = new Date();

    for (const entity of graph.entities) {
      // Skip conversation entities
      if (entity.entityType.startsWith('conversation:')) continue;
      
      const parsed = parseObservations(entity.observations);
      const lastSeen = parsed.last_seen?.timestamp || parsed.created_at?.timestamp;
      
      if (lastSeen) {
        const daysSince = getDaysSince(lastSeen);
        if (daysSince < 1) { // Within last day
          recent.push({
            name: entity.name,
            type: entity.entityType,
            lastSeen,
          });
        }
      }
    }

    return recent.slice(0, 10);
  }

  /**
   * Reset context (for new conversation)
   */
  reset() {
    this.#contextCache.clear();
    this.#activeTopics.clear();
    this.#pendingTasks = [];
    logger.info('Context manager reset');
  }
}

// ============================================================================
// SINGLETON INSTANCES
// ============================================================================

let conversationStore = null;
let summarizer = null;
let contextManager = null;

/**
 * Get ConversationStore singleton
 */
export function getConversationStore() {
  if (!conversationStore) {
    conversationStore = new ConversationStore();
  }
  return conversationStore;
}

/**
 * Get Summarizer singleton
 */
export function getSummarizer() {
  if (!summarizer) {
    summarizer = new Summarizer();
  }
  return summarizer;
}

/**
 * Get ContextManager singleton
 */
export function getContextManager() {
  if (!contextManager) {
    contextManager = new ContextManager();
  }
  return contextManager;
}

// ============================================================================
// CONVERSATION HANDLERS (for API integration)
// ============================================================================

/**
 * Conversation memory handlers for REST API
 */
export const conversationHandlers = {
  // Session handlers
  startSession(metadata) {
    return getConversationStore().startSession(metadata);
  },

  endSession(summary) {
    return getConversationStore().endSession(summary);
  },

  addMessage(role, content, metadata) {
    return getConversationStore().addMessage(role, content, metadata);
  },

  getCurrentSession() {
    const sessionId = getConversationStore().getCurrentSessionId();
    if (!sessionId) return null;
    return getConversationStore().getSession(sessionId);
  },

  getSession(sessionId) {
    return getConversationStore().getSession(sessionId);
  },

  getSessions(filter) {
    return getConversationStore().getSessions(filter);
  },

  getRecentContext(limit) {
    return getConversationStore().getRecentContext(limit);
  },

  getMessageBuffer() {
    return getConversationStore().getMessageBuffer();
  },

  // Summarization handlers
  async summarizeSession(sessionId, messages) {
    return getSummarizer().summarizeSession(sessionId, messages);
  },

  async summarizePeriod(start, end) {
    return getSummarizer().summarizePeriod(new Date(start), new Date(end));
  },

  extractKeyPoints(messages) {
    return getSummarizer().extractKeyPoints(messages);
  },

  extractDecisions(messages) {
    return getSummarizer().extractDecisions(messages);
  },

  // Context handlers
  getCurrentContext() {
    return getContextManager().getCurrentContext();
  },

  updateContext(key, value) {
    return getContextManager().updateContext(key, value);
  },

  addPendingTask(task, priority) {
    return getContextManager().addPendingTask(task, priority);
  },

  completeTask(task) {
    return getContextManager().completeTask(task);
  },

  getActiveTopics() {
    return getContextManager().getActiveTopics();
  },

  getPendingTasks() {
    return getContextManager().getPendingTasks();
  },

  buildPromptContext(maxTokens) {
    return getContextManager().buildPromptContext(maxTokens);
  },

  resetContext() {
    return getContextManager().reset();
  },
};

export default {
  ConversationStore,
  Summarizer,
  ContextManager,
  getConversationStore,
  getSummarizer,
  getContextManager,
  conversationHandlers,
};
