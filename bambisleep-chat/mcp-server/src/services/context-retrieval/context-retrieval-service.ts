/**
 * Context Retrieval Service - Semantic search for conversation history
 * @module services/context-retrieval/context-retrieval-service
 */

import { LocalRAGService } from '../rag/index.js';
import type { RetrievalOptions, Message, ConversationContext, ScoringWeights } from './types.js';

export class ContextRetrievalService {
  private readonly rag: LocalRAGService;
  private readonly defaultWeights: ScoringWeights = {
    recency: 0.3,
    semantic: 0.5,
    importance: 0.2,
  };

  constructor(rag: LocalRAGService) {
    this.rag = rag;
  }

  /**
   * Get relevant context for a query
   * Combines semantic search with recency and importance scoring
   */
  async getRelevantContext(
    query: string,
    messages: readonly Message[],
    options: RetrievalOptions = {}
  ): Promise<ConversationContext> {
    const {
      topK = 10,
      minScore = 0.5,
      includeRecent = 5,
      timeWindow = 7 * 24 * 60 * 60 * 1000, // 7 days
    } = options;

    if (messages.length === 0) {
      return this.emptyContext();
    }

    // 1. Get recent messages (always included for continuity)
    const recentMessages = messages.slice(-includeRecent);

    // 2. Index all messages in RAG for semantic search
    await this.indexMessages(messages);

    // 3. Semantic search for relevant history
    const searchResults = await this.rag.search(query, topK * 2);

    // 4. Map search results to messages
    const relevantMessages = searchResults
      .filter(r => r.score >= minScore)
      .map(r => messages[r.index])
      .filter(m => m !== undefined);

    // 5. Filter by time window
    const now = Date.now();
    const filteredMessages = relevantMessages.filter(
      m => now - m.timestamp < timeWindow
    );

    // 6. Combine and deduplicate
    const combined = this.deduplicateMessages([
      ...recentMessages,
      ...filteredMessages,
    ]);

    // 7. Score and rank messages
    const scored = this.scoreMessages(combined, query);

    // 8. Take top K with best scores
    const topMessages = scored.slice(0, topK);

    // 9. Sort by timestamp for chronological context
    const chronological = [...topMessages].sort((a, b) => a.timestamp - b.timestamp);

    return {
      messages: chronological,
      relevanceScores: chronological.map(m => m.relevanceScore || 0),
      totalMessages: chronological.length,
      averageRelevance: this.calculateAverageRelevance(chronological),
    };
  }

  /**
   * Index messages in RAG for searching
   */
  private async indexMessages(messages: readonly Message[]): Promise<void> {
    // Clear existing index
    this.rag.clear();

    // Add all messages
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      await this.rag.addDocument(msg.content, {
        id: msg.id,
        timestamp: msg.timestamp,
        userId: msg.userId,
        conversationId: msg.conversationId,
        importance: msg.importance,
      });
    }
  }

  /**
   * Score messages based on multiple factors
   */
  private scoreMessages(messages: readonly Message[], query: string): Message[] {
    return messages.map(m => ({
      ...m,
      relevanceScore: this.calculateRelevance(m),
    })).sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  }

  /**
   * Calculate relevance score for a message
   */
  private calculateRelevance(message: Message): number {
    const recencyScore = this.getRecencyScore(message.timestamp);
    const semanticScore = message.semanticScore || 0.5;
    const importanceScore = message.importance || 0.5;

    return (
      recencyScore * this.defaultWeights.recency +
      semanticScore * this.defaultWeights.semantic +
      importanceScore * this.defaultWeights.importance
    );
  }

  /**
   * Calculate recency score (exponential decay)
   */
  private getRecencyScore(timestamp: number): number {
    const age = Date.now() - timestamp;
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    return Math.max(0, 1 - age / maxAge);
  }

  /**
   * Deduplicate messages by ID
   */
  private deduplicateMessages(messages: readonly Message[]): Message[] {
    const seen = new Set<string>();
    return messages.filter(m => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
  }

  /**
   * Calculate average relevance score
   */
  private calculateAverageRelevance(messages: readonly Message[]): number {
    if (messages.length === 0) return 0;
    const sum = messages.reduce((acc, m) => acc + (m.relevanceScore || 0), 0);
    return sum / messages.length;
  }

  /**
   * Return empty context
   */
  private emptyContext(): ConversationContext {
    return {
      messages: [],
      relevanceScores: [],
      totalMessages: 0,
      averageRelevance: 0,
    };
  }
}
