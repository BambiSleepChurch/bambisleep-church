/**
 * Type definitions for context retrieval service
 * @module services/context-retrieval/types
 */

export interface RetrievalOptions {
  readonly topK?: number;
  readonly minScore?: number;
  readonly includeRecent?: number;
  readonly timeWindow?: number;
  readonly userId?: string;
  readonly conversationId?: string;
}

export interface Message {
  readonly id: string;
  readonly role: 'user' | 'assistant' | 'system';
  readonly content: string;
  readonly timestamp: number;
  readonly semanticScore?: number;
  readonly importance?: number;
  readonly relevanceScore?: number;
  readonly userId?: string;
  readonly conversationId?: string;
}

export interface ConversationContext {
  readonly messages: readonly Message[];
  readonly relevanceScores: readonly number[];
  readonly summary?: string;
  readonly totalMessages: number;
  readonly averageRelevance: number;
}

export interface ScoringWeights {
  readonly recency: number;
  readonly semantic: number;
  readonly importance: number;
}
