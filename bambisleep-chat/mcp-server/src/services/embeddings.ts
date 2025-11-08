/**
 * 🦋 Embeddings Service - Text-to-Vector Transformation
 * Phase 4: RAG & Semantic Search Foundation
 */

import { pipeline, type FeatureExtractionPipeline } from '@xenova/transformers';
import { logger } from '../utils/logger.js';

/**
 * Embedding model configuration
 */
const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2';
const EMBEDDING_DIMENSION = 384; // all-MiniLM-L6-v2 produces 384-dim vectors

/**
 * Service for generating text embeddings using local transformers
 */
export class EmbeddingsService {
  private pipeline: FeatureExtractionPipeline | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the embedding model
   * Uses lazy loading - model downloads on first use
   */
  private async initialize(): Promise<void> {
    if (this.pipeline) return;

    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    this.initPromise = (async () => {
      logger.info(`🦋 Loading embedding model: ${EMBEDDING_MODEL}`);
      try {
        this.pipeline = await pipeline('feature-extraction', EMBEDDING_MODEL) as FeatureExtractionPipeline;
        logger.info('✅ Embeddings model loaded successfully');
      } catch (error) {
        logger.error('❌ Failed to load embeddings model:', error instanceof Error ? { message: error.message } : {});
        throw new Error('Embeddings model initialization failed');
      }
    })();

    await this.initPromise;
  }

  /**
   * Generate embedding vector for text
   * @param text Input text to embed
   * @returns Float32Array of embedding vector (384 dimensions)
   */
  async generateEmbedding(text: string): Promise<Float32Array> {
    await this.initialize();

    if (!this.pipeline) {
      throw new Error('Embeddings pipeline not initialized');
    }

    try {
      // Generate embedding
      const output = await this.pipeline(text, {
        pooling: 'mean',
        normalize: true,
      });

      // Extract the embedding array
      const embedding = Array.from(output.data) as number[];
      
      if (embedding.length !== EMBEDDING_DIMENSION) {
        throw new Error(`Expected ${EMBEDDING_DIMENSION} dimensions, got ${embedding.length}`);
      }

      return new Float32Array(embedding);
    } catch (error) {
      logger.error('❌ Failed to generate embedding:', error instanceof Error ? { message: error.message } : {});
      throw new Error('Embedding generation failed');
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   * More efficient than calling generateEmbedding multiple times
   */
  async generateBatchEmbeddings(texts: string[]): Promise<Float32Array[]> {
    await this.initialize();

    if (!this.pipeline) {
      throw new Error('Embeddings pipeline not initialized');
    }

    try {
      const embeddings: Float32Array[] = [];

      for (const text of texts) {
        const embedding = await this.generateEmbedding(text);
        embeddings.push(embedding);
      }

      return embeddings;
    } catch (error) {
      logger.error('❌ Failed to generate batch embeddings:', error instanceof Error ? { message: error.message } : {});
      throw new Error('Batch embedding generation failed');
    }
  }

  /**
   * Calculate cosine similarity between two embedding vectors
   * Returns value between -1 (opposite) and 1 (identical)
   */
  static cosineSimilarity(a: Float32Array, b: Float32Array): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have same dimension');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    
    if (denominator === 0) {
      return 0;
    }

    return dotProduct / denominator;
  }

  /**
   * Serialize embedding to Buffer for SQLite storage
   */
  static serializeEmbedding(embedding: Float32Array): Buffer {
    return Buffer.from(embedding.buffer);
  }

  /**
   * Deserialize embedding from SQLite Buffer
   */
  static deserializeEmbedding(buffer: Buffer): Float32Array {
    return new Float32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 4);
  }

  /**
   * Get embedding dimension for this model
   */
  static getDimension(): number {
    return EMBEDDING_DIMENSION;
  }

  /**
   * Get model name
   */
  static getModelName(): string {
    return EMBEDDING_MODEL;
  }
}

// Singleton instance
export const embeddingsService = new EmbeddingsService();
