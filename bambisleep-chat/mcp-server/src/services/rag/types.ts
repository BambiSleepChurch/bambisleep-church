/**
 * Type definitions for RAG (Retrieval Augmented Generation) service
 * @module services/rag/types
 */

export interface EmbeddingConfig {
  readonly model: 'all-MiniLM-L6-v2' | 'all-mpnet-base-v2';
  readonly dimensions: number;
  readonly indexType: 'Flat' | 'IVF' | 'HNSW';
  readonly cacheSize?: number;
}

export interface SearchResult {
  readonly text: string;
  readonly score: number;
  readonly index: number;
  readonly metadata?: DocumentMetadata | Record<string, unknown>;
}

export interface DocumentMetadata {
  readonly id: string;
  readonly timestamp: number;
  readonly userId?: string;
  readonly conversationId?: string;
  readonly importance?: number;
  readonly tags?: readonly string[];
}

export interface IndexStats {
  readonly totalDocuments: number;
  readonly dimensions: number;
  readonly indexType: string;
  readonly memoryUsage: number;
}

export interface EmbeddingCache {
  readonly text: string;
  readonly embedding: readonly number[];
  readonly timestamp: number;
}
