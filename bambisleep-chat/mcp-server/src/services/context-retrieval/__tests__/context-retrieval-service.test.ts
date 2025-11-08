/**
 * Tests for ContextRetrievalService
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ContextRetrievalService } from '../context-retrieval-service.js';
import { LocalRAGService } from '../../rag/index.js';
import type { Message } from '../types.js';

describe('ContextRetrievalService', () => {
  let service: ContextRetrievalService;
  let rag: LocalRAGService;

  beforeEach(async () => {
    rag = new LocalRAGService();
    await rag.initialize();
    service = new ContextRetrievalService(rag);
  });

  const createMessage = (content: string, timestamp?: number): Message => ({
    id: `msg_${Math.random()}`,
    role: 'user',
    content,
    timestamp: timestamp || Date.now(),
  });

  it('should retrieve relevant context', async () => {
    const messages: Message[] = [
      createMessage('I love machine learning'),
      createMessage('Pizza is great'),
      createMessage('Neural networks are fascinating'),
    ];

    const context = await service.getRelevantContext('AI', messages, { topK: 2 });

    expect(context.totalMessages).toBeGreaterThan(0);
    expect(context.messages.length).toBeLessThanOrEqual(2);
  });

  it('should handle empty message list', async () => {
    const context = await service.getRelevantContext('test', []);
    expect(context.totalMessages).toBe(0);
  });
});
