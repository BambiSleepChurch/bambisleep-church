/**
 * 🧠 CAG Service - Context-Aware Generation
 * Combines RAG with dynamic context assembly for enhanced generation
 */

import Database from 'better-sqlite3';
import { RAGService, SearchResult } from './rag.js';
import { logger } from '../utils/logger.js';
import type { ConversationMessage } from '../database/schema.js';

export interface CAGContext {
  /** Current conversation messages */
  currentMessages: ConversationMessage[];
  /** Retrieved relevant context from RAG */
  retrievedContext: SearchResult[];
  /** User profile data */
  userProfile?: {
    userId: string;
    preferences?: Record<string, any>;
    communicationStyle?: string;
  };
  /** Temporal context (recency, time of day, etc) */
  temporalContext?: {
    sessionStartTime: number;
    lastMessageTime: number;
    conversationDuration: number;
  };
  /** Metadata about context quality */
  metadata: {
    contextRelevanceScore: number;
    retrievalLatency: number;
    totalTokens: number;
  };
}

export interface CAGOptions {
  /** Maximum context window size in tokens */
  maxContextTokens?: number;
  /** Minimum relevance threshold for retrieved context */
  minRelevanceScore?: number;
  /** Number of messages to retrieve from RAG */
  retrievalTopK?: number;
  /** Whether to include user profile data */
  includeUserProfile?: boolean;
  /** Whether to include temporal signals */
  includeTemporalContext?: boolean;
}

/**
 * Context-Aware Generation Service
 * Intelligently assembles context from multiple sources for LLM generation
 */
export class CAGService {
  private db: Database.Database;
  private ragService: RAGService;

  constructor(db: Database.Database, ragService: RAGService) {
    this.db = db;
    this.ragService = ragService;
    logger.info('🧠 CAG Service initialized');
  }

  /**
   * Assemble complete context for generation
   * @param currentMessage The current user message
   * @param userId User identifier
   * @param sessionId Current session identifier
   * @param options Context assembly options
   * @returns Assembled CAG context ready for LLM
   */
  async assembleContext(
    currentMessage: string,
    userId: string,
    sessionId: string,
    options: CAGOptions = {}
  ): Promise<CAGContext> {
    const startTime = Date.now();
    const {
      maxContextTokens = 4000,
      minRelevanceScore = 0.6,
      retrievalTopK = 5,
      includeUserProfile = true,
      includeTemporalContext = true,
    } = options;

    try {
      // 1. Get current session messages
      const currentMessages = this.getCurrentSessionMessages(sessionId, maxContextTokens * 0.5);

      // 2. Retrieve relevant context from RAG
      const retrievedContext = await this.ragService.semanticSearch(currentMessage, {
        userId,
        topK: retrievalTopK,
        minSimilarity: minRelevanceScore,
        sessionId: null, // Search across all sessions
        excludeMessageIds: currentMessages.map(m => m.id),
      });

      // 3. Get user profile if enabled
      let userProfile;
      if (includeUserProfile) {
        userProfile = this.getUserProfile(userId);
      }

      // 4. Calculate temporal context
      let temporalContext;
      if (includeTemporalContext) {
        temporalContext = this.getTemporalContext(sessionId, currentMessages);
      }

      // 5. Calculate context quality metrics
      const avgRelevance = retrievedContext.length > 0
        ? retrievedContext.reduce((sum, r) => sum + r.similarity, 0) / retrievedContext.length
        : 0;

      const estimatedTokens = this.estimateTokenCount(currentMessages, retrievedContext);

      const context: CAGContext = {
        currentMessages,
        retrievedContext,
        userProfile,
        temporalContext,
        metadata: {
          contextRelevanceScore: avgRelevance,
          retrievalLatency: Date.now() - startTime,
          totalTokens: estimatedTokens,
        },
      };

      logger.info('🧠 CAG context assembled', {
        userId,
        currentMessages: currentMessages.length,
        retrievedItems: retrievedContext.length,
        relevanceScore: avgRelevance.toFixed(3),
        tokens: estimatedTokens,
        latency: `${context.metadata.retrievalLatency}ms`,
      });

      return context;
    } catch (error) {
      logger.error('❌ CAG context assembly failed:', error instanceof Error ? { message: error.message } : {});
      // Return minimal context on failure
      return {
        currentMessages: this.getCurrentSessionMessages(sessionId, maxContextTokens * 0.5),
        retrievedContext: [],
        metadata: {
          contextRelevanceScore: 0,
          retrievalLatency: Date.now() - startTime,
          totalTokens: 0,
        },
      };
    }
  }

  /**
   * Format CAG context into a prompt suitable for LLM consumption
   */
  formatContextForPrompt(context: CAGContext): string {
    const parts: string[] = [];

    // Add retrieved context if available
    if (context.retrievedContext.length > 0) {
      parts.push('### Relevant Past Context:');
      context.retrievedContext.forEach((result, idx) => {
        parts.push(
          `[${idx + 1}] (Relevance: ${(result.similarity * 100).toFixed(0)}%) ${result.message.role}: ${result.message.content.substring(0, 200)}${result.message.content.length > 200 ? '...' : ''}`
        );
      });
      parts.push('');
    }

    // Add user profile info
    if (context.userProfile && context.userProfile.preferences) {
      parts.push('### User Preferences:');
      parts.push(JSON.stringify(context.userProfile.preferences, null, 2));
      parts.push('');
    }

    // Add temporal context
    if (context.temporalContext) {
      const duration = Math.round(context.temporalContext.conversationDuration / 60000);
      parts.push(`### Conversation Duration: ${duration} minutes`);
      parts.push('');
    }

    // Add current conversation
    parts.push('### Current Conversation:');
    context.currentMessages.forEach(msg => {
      parts.push(`${msg.role}: ${msg.content}`);
    });

    return parts.join('\n');
  }

  /**
   * Get current session messages with token budget
   */
  private getCurrentSessionMessages(
    sessionId: string,
    maxTokens: number
  ): ConversationMessage[] {
    const messages = this.db
      .prepare(
        `SELECT * FROM messages 
         WHERE session_id = ? 
         ORDER BY timestamp DESC`
      )
      .all(sessionId) as ConversationMessage[];

    // Simple token estimation and truncation
    let tokenCount = 0;
    const selected: ConversationMessage[] = [];

    for (const msg of messages) {
      const msgTokens = Math.ceil(msg.content.length / 4); // rough estimate: 1 token ≈ 4 chars
      if (tokenCount + msgTokens > maxTokens) break;
      
      selected.unshift(msg); // Add to front to maintain chronological order
      tokenCount += msgTokens;
    }

    return selected;
  }

  /**
   * Get user profile data
   */
  private getUserProfile(userId: string): CAGContext['userProfile'] | undefined {
    try {
      const profile = this.db
        .prepare('SELECT * FROM user_profiles WHERE user_id = ?')
        .get(userId) as any;

      if (!profile) return undefined;

      return {
        userId,
        preferences: profile.preferences ? JSON.parse(profile.preferences) : undefined,
        communicationStyle: profile.communication_style,
      };
    } catch (error) {
      logger.error('Failed to get user profile:', error instanceof Error ? { message: error.message } : {});
      return undefined;
    }
  }

  /**
   * Calculate temporal context signals
   */
  private getTemporalContext(
    sessionId: string,
    messages: ConversationMessage[]
  ): CAGContext['temporalContext'] {
    if (messages.length === 0) {
      return {
        sessionStartTime: Date.now(),
        lastMessageTime: Date.now(),
        conversationDuration: 0,
      };
    }

    const sortedMessages = [...messages].sort((a, b) => a.timestamp - b.timestamp);
    const firstMsg = sortedMessages[0];
    const lastMsg = sortedMessages[sortedMessages.length - 1];

    return {
      sessionStartTime: firstMsg.timestamp,
      lastMessageTime: lastMsg.timestamp,
      conversationDuration: lastMsg.timestamp - firstMsg.timestamp,
    };
  }

  /**
   * Estimate total token count for context
   */
  private estimateTokenCount(
    currentMessages: ConversationMessage[],
    retrievedContext: SearchResult[]
  ): number {
    let tokens = 0;

    // Current messages
    tokens += currentMessages.reduce((sum, msg) => sum + Math.ceil(msg.content.length / 4), 0);

    // Retrieved context
    tokens += retrievedContext.reduce((sum, result) => 
      sum + Math.ceil(result.message.content.length / 4), 0
    );

    // Add overhead for formatting
    tokens += 100;

    return tokens;
  }

  /**
   * Adaptive context pruning based on relevance and recency
   */
  async pruneContext(
    context: CAGContext,
    targetTokens: number
  ): Promise<CAGContext> {
    let currentTokens = context.metadata.totalTokens;

    if (currentTokens <= targetTokens) {
      return context; // No pruning needed
    }

    // Start by removing least relevant retrieved context
    const prunedRetrieved = [...context.retrievedContext];
    while (currentTokens > targetTokens && prunedRetrieved.length > 0) {
      const removed = prunedRetrieved.pop(); // Remove least relevant (already sorted)
      if (removed) {
        currentTokens -= Math.ceil(removed.message.content.length / 4);
      }
    }

    // If still over budget, trim older current messages
    const prunedCurrent = [...context.currentMessages];
    while (currentTokens > targetTokens && prunedCurrent.length > 1) {
      const removed = prunedCurrent.shift(); // Remove oldest
      if (removed) {
        currentTokens -= Math.ceil(removed.content.length / 4);
      }
    }

    return {
      ...context,
      currentMessages: prunedCurrent,
      retrievedContext: prunedRetrieved,
      metadata: {
        ...context.metadata,
        totalTokens: currentTokens,
      },
    };
  }
}
