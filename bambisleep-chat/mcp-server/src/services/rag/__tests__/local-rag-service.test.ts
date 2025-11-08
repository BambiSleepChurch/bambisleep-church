/**
 * Tests for LocalRAGService
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LocalRAGService } from '../local-rag-service.js';

describe('LocalRAGService', () => {
  let rag: LocalRAGService;

  beforeEach(async () => {
    rag = new LocalRAGService();
    await rag.initialize();
  });

  it('should add and search documents', async () => {
    await rag.addDocument('Machine learning is fascinating');
    await rag.addDocument('Pizza is delicious');
    
    const results = await rag.search('AI', 2);
    expect(results.length).toBeGreaterThan(0);
  });

  it('should track statistics', async () => {
    await rag.addDocument('Test');
    const stats = rag.getStats();
    expect(stats.totalDocuments).toBe(1);
  });
});
