/**
 * Integration tests for complete chat system
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { IntegratedChatService } from '../integrated-chat.js';

describe('IntegratedChatService', () => {
  let chat: IntegratedChatService;

  beforeAll(async () => {
    chat = new IntegratedChatService();
    await chat.initialize();
  });

  it('should handle basic chat interaction', async () => {
    const response = await chat.chat('Hello, how are you?', {
      userId: 'test-user-1',
    });

    expect(response.content).toBeDefined();
    expect(response.confidence).toBeGreaterThanOrEqual(0);
    expect(response.metadata.processingTime).toBeGreaterThan(0);
  });

  it('should retrieve relevant context', async () => {
    await chat.chat('I love machine learning', { userId: 'test-user-2' });
    await chat.chat('Tell me about neural networks', { userId: 'test-user-2' });
    
    const response = await chat.chat('What did I ask about earlier?', {
      userId: 'test-user-2',
    });

    expect(response.context.length).toBeGreaterThan(0);
  });

  it('should personalize responses', async () => {
    await chat.chat('hey! quick question!', { userId: 'test-user-3' });
    
    const response = await chat.chat('cool!', {
      userId: 'test-user-3',
      enablePersonalization: true,
    });

    expect(response.personalization).toBeDefined();
    expect(response.personalization?.styleMatch).toBeGreaterThan(0);
  });

  it('should track conversation history', async () => {
    await chat.chat('First message', { userId: 'test-user-4' });
    await chat.chat('Second message', { userId: 'test-user-4' });
    await chat.chat('Third message', { userId: 'test-user-4' });

    const profile = chat.getUserProfile('test-user-4');
    expect(profile.conversationHistory.totalMessages).toBeGreaterThanOrEqual(3);
  });

  it('should provide system stats', () => {
    const stats = chat.getStats();
    expect(stats.totalConversations).toBeGreaterThan(0);
    expect(stats.personalization).toBeDefined();
  });

  it('should clear history', async () => {
    await chat.chat('Test', { userId: 'test-user-5' });
    chat.clearHistory('test-user-5');
    
    const response = await chat.chat('Another test', { userId: 'test-user-5' });
    expect(response.context.length).toBe(0);
  });
});
