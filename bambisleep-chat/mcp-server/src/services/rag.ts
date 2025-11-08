/**
 * 🔮 RAG Service - Retrieval-Augmented Generation
 * Phase 4: Semantic Search & Context Retrieval
 */

import Database from 'better-sqlite3';
import { EmbeddingsService, embeddingsService } from './embeddings.js';
import { logger } from '../utils/logger.js';
import type { ConversationMessage } from '../database/schema.js';

/**
 * Result from semantic search with relevance score
 */
export interface SearchResult {
  message: ConversationMessage;
  similarity: number;
  rank: number;
}

/**
 * Options for semantic search
 */
export interface SearchOptions {
  userId: string;
  topK?: number;
  minSimilarity?: number;
  sessionId?: string | null;
  excludeMessageIds?: number[];
}

/**
 * RAG Service for semantic search over conversation history
 */
export class RAGService {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
    logger.info('🔮 RAG Service initialized');
  }

  /**
   * Perform semantic search to find relevant messages
   * @param query Search query text
   * @param options Search configuration
   * @returns Array of messages ranked by semantic similarity
   */
  async semanticSearch(
    query: string,
    options: SearchOptions
  ): Promise<SearchResult[]> {
    const {
      userId,
      topK = 5,
      minSimilarity = 0.5,
      sessionId = null,
      excludeMessageIds = []
    } = options;

    try {
      // Generate embedding for query
      const queryEmbedding = await embeddingsService.generateEmbedding(query);

      // Build SQL query
      let sql = `
        SELECT m.*, e.embedding
        FROM messages m
        JOIN embeddings e ON m.id = e.message_id
        WHERE m.user_id = ?
      `;
      const params: any[] = [userId];

      if (sessionId) {
        sql += ' AND m.session_id = ?';
        params.push(sessionId);
      }

      if (excludeMessageIds.length > 0) {
        sql += ` AND m.id NOT IN (${excludeMessageIds.map(() => '?').join(',')})`;
        params.push(...excludeMessageIds);
      }

      // Execute query
      const stmt = this.db.prepare(sql);
      const rows = stmt.all(...params) as Array<ConversationMessage & { embedding: Buffer }>;

      // Calculate similarity scores
      const results: SearchResult[] = [];

      for (const row of rows) {
        const messageEmbedding = EmbeddingsService.deserializeEmbedding(row.embedding);
        const similarity = EmbeddingsService.cosineSimilarity(queryEmbedding, messageEmbedding);

        if (similarity >= minSimilarity) {
          // Remove embedding from result
          const { embedding, ...message } = row;
          results.push({
            message,
            similarity,
            rank: 0, // Will be set after sorting
          });
        }
      }

      // Sort by similarity descending
      results.sort((a, b) => b.similarity - a.similarity);

      // Limit results and add rank
      const topResults = results.slice(0, topK);
      topResults.forEach((result, index) => {
        result.rank = index + 1;
      });

      logger.info(`🔮 Semantic search found ${topResults.length} relevant messages (query: "${query.substring(0, 50)}...")`);

      return topResults;
    } catch (error) {
      logger.error('❌ Semantic search failed:', error instanceof Error ? { message: error.message } : {});
      throw error;
    }
  }

  /**
   * Find contextually relevant messages for a conversation
   * Optimized for chat context injection
   */
  async getRelevantContext(
    currentMessage: string,
    userId: string,
    sessionId: string,
    options?: {
      maxMessages?: number;
      minSimilarity?: number;
      includeCurrentSession?: boolean;
    }
  ): Promise<ConversationMessage[]> {
    const {
      maxMessages = 3,
      minSimilarity = 0.6,
      includeCurrentSession = false
    } = options || {};

    try {
      // Get current session messages to exclude
      const excludeMessageIds: number[] = [];
      
      if (!includeCurrentSession) {
        const sessionMessages = this.db
          .prepare('SELECT id FROM messages WHERE session_id = ?')
          .all(sessionId) as Array<{ id: number }>;
        
        excludeMessageIds.push(...sessionMessages.map(m => m.id));
      }

      // Perform semantic search
      const results = await this.semanticSearch(currentMessage, {
        userId,
        topK: maxMessages,
        minSimilarity,
        excludeMessageIds,
      });

      return results.map(r => r.message);
    } catch (error) {
      logger.error('❌ Failed to get relevant context:', error instanceof Error ? { message: error.message } : {});
      return [];
    }
  }

  /**
   * Find similar past conversations
   * Useful for "remember when we talked about..." scenarios
   */
  async findSimilarConversations(
    query: string,
    userId: string,
    options?: {
      topK?: number;
      minSimilarity?: number;
    }
  ): Promise<Array<{ sessionId: string; messages: SearchResult[] }>> {
    const results = await this.semanticSearch(query, {
      userId,
      topK: options?.topK || 10,
      minSimilarity: options?.minSimilarity || 0.6,
    });

    // Group by session
    const sessionMap = new Map<string, SearchResult[]>();
    
    for (const result of results) {
      const sessionId = result.message.session_id;
      if (!sessionMap.has(sessionId)) {
        sessionMap.set(sessionId, []);
      }
      sessionMap.get(sessionId)!.push(result);
    }

    // Convert to array and sort by best similarity in each session
    const conversations = Array.from(sessionMap.entries()).map(([sessionId, messages]) => ({
      sessionId,
      messages,
    }));

    conversations.sort((a, b) => {
      const maxSimA = Math.max(...a.messages.map(m => m.similarity));
      const maxSimB = Math.max(...b.messages.map(m => m.similarity));
      return maxSimB - maxSimA;
    });

    return conversations;
  }

  /**
   * Generate relevance score for a message based on multiple factors
   * Combines semantic similarity with recency and conversation flow
   */
  calculateRelevanceScore(
    message: ConversationMessage,
    query: string,
    similarity: number,
    currentTime: number
  ): number {
    // Base score from semantic similarity (0-1)
    let score = similarity;

    // Recency bonus: newer messages get slight boost
    const ageInDays = (currentTime - message.timestamp) / (1000 * 60 * 60 * 24);
    const recencyFactor = Math.exp(-ageInDays / 30); // Decay over 30 days
    score += recencyFactor * 0.1; // Max 0.1 boost

    // Longer messages might be more informative
    const lengthFactor = Math.min(message.content.length / 500, 1) * 0.05;
    score += lengthFactor;

    // User messages vs assistant messages (user context often more relevant)
    if (message.role === 'user') {
      score += 0.05;
    }

    return Math.min(score, 1); // Cap at 1.0
  }

  /**
   * Batch process messages to add embeddings
   * Useful for backfilling existing conversations
   */
  async addEmbeddingsToMessages(
    messageIds: number[]
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const messageId of messageIds) {
      try {
        // Get message
        const message = this.db
          .prepare('SELECT * FROM messages WHERE id = ?')
          .get(messageId) as ConversationMessage | undefined;

        if (!message) {
          failed++;
          continue;
        }

        // Check if embedding already exists
        const existing = this.db
          .prepare('SELECT 1 FROM embeddings WHERE message_id = ?')
          .get(messageId);

        if (existing) {
          continue; // Skip if already embedded
        }

        // Generate embedding
        const embedding = await embeddingsService.generateEmbedding(message.content);
        const embeddingBuffer = EmbeddingsService.serializeEmbedding(embedding);

        // Store embedding
        this.db
          .prepare(
            `INSERT INTO embeddings (message_id, embedding, dimension, model, created_at)
             VALUES (?, ?, ?, ?, ?)`
          )
          .run(
            messageId,
            embeddingBuffer,
            EmbeddingsService.getDimension(),
            EmbeddingsService.getModelName(),
            Date.now()
          );

        success++;
      } catch (error) {
        logger.error(`❌ Failed to add embedding for message ${messageId}:`, error instanceof Error ? { message: error.message } : {});
        failed++;
      }
    }

    logger.info(`🦋 Batch embedding complete: ${success} success, ${failed} failed`);
    return { success, failed };
  }
}
