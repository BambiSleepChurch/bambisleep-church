/**
 * Tests for EmbeddingService
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { EmbeddingService } from '../embedding-service.js';

describe('EmbeddingService', () => {
  let service: EmbeddingService;

  beforeAll(async () => {
    service = new EmbeddingService();
    await service.initialize();
  });

  it('should initialize successfully', () => {
    expect(service).toBeDefined();
  });

  it('should generate embeddings', async () => {
    const embedding = await service.generateEmbedding('Hello world');
    expect(embedding).toBeDefined();
    expect(embedding.length).toBeGreaterThan(0);
  });

  it('should generate consistent embeddings for same text', async () => {
    const text = 'Test consistency';
    const embedding1 = await service.generateEmbedding(text);
    const embedding2 = await service.generateEmbedding(text);
    
    expect(embedding1).toEqual(embedding2);
  });
});
