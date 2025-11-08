/**
 * Local RAG service with in-memory vector search
 * @module services/rag/local-rag-service
 */

import { EmbeddingService } from './embedding-service.js';
import type { EmbeddingConfig, SearchResult, DocumentMetadata, IndexStats } from './types.js';

interface Document {
  readonly id: string;
  readonly text: string;
  readonly embedding: readonly number[];
  readonly metadata: DocumentMetadata;
}

export class LocalRAGService {
  private readonly embeddingService: EmbeddingService;
  private documents: Document[] = [];
  private readonly config: EmbeddingConfig;

  constructor(config: Partial<EmbeddingConfig> = {}) {
    this.config = {
      model: 'all-MiniLM-L6-v2',
      dimensions: 384,
      indexType: 'Flat',
      ...config,
    };

    this.embeddingService = new EmbeddingService(this.config);
  }

  async initialize(): Promise<void> {
    await this.embeddingService.initialize();
    console.log('[LocalRAGService] Initialized');
  }

  async addDocument(text: string, metadata: Partial<DocumentMetadata> = {}): Promise<string> {
    const id = metadata.id || this.generateId();
    const embedding = await this.embeddingService.generateEmbedding(text);

    const document: Document = {
      id,
      text,
      embedding,
      metadata: {
        id,
        timestamp: Date.now(),
        ...metadata,
      },
    };

    this.documents.push(document);
    console.log(`[LocalRAGService] Added document ${id} (${this.documents.length} total)`);
    
    return id;
  }

  async search(query: string, topK: number = 5): Promise<readonly SearchResult[]> {
    if (this.documents.length === 0) return [];

    const queryEmbedding = await this.embeddingService.generateEmbedding(query);

    const results = this.documents.map((doc, index) => ({
      text: doc.text,
      score: this.cosineSimilarity(queryEmbedding, doc.embedding),
      index,
      metadata: doc.metadata,
    }));

    return results.sort((a, b) => b.score - a.score).slice(0, topK);
  }

  getDocument(id: string): Document | undefined {
    return this.documents.find(doc => doc.id === id);
  }

  deleteDocument(id: string): boolean {
    const index = this.documents.findIndex(doc => doc.id === id);
    if (index === -1) return false;
    this.documents.splice(index, 1);
    return true;
  }

  clear(): void {
    this.documents = [];
    this.embeddingService.clearCache();
  }

  getStats(): IndexStats {
    const memoryUsage = this.documents.reduce(
      (sum, doc) => sum + doc.embedding.length * 8,
      0
    );

    return {
      totalDocuments: this.documents.length,
      dimensions: this.config.dimensions,
      indexType: this.config.indexType,
      memoryUsage,
    };
  }

  private cosineSimilarity(a: readonly number[], b: readonly number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private generateId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
