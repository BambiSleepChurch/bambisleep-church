/**
 * 🦋 Phase 4 RAG Features Test Suite
 * Tests for embeddings, RAG semantic search, personalization, and summarization
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EmbeddingsService } from '../services/embeddings.js';
import { MemoryService } from '../services/memory.js';
import { RAGService } from '../services/rag.js';
import { personalizationEngine, ConversationStyle } from '../services/personalization.js';
import type { UserProfile, ConversationMessage } from '../database/schema.js';

describe('EmbeddingsService', () => {
  const embeddingsService = new EmbeddingsService();

  it('should generate embedding vector with correct dimension', async () => {
    const text = 'Hello, this is a test message';
    const embedding = await embeddingsService.generateEmbedding(text);

    expect(embedding).toBeInstanceOf(Float32Array);
    expect(embedding.length).toBe(384); // all-MiniLM-L6-v2 dimension
  });

  it('should generate normalized embeddings', async () => {
    const text = 'Test message for normalization check';
    const embedding = await embeddingsService.generateEmbedding(text);

    // Calculate L2 norm
    let norm = 0;
    for (let i = 0; i < embedding.length; i++) {
      norm += embedding[i] * embedding[i];
    }
    norm = Math.sqrt(norm);

    // Should be approximately 1.0 (normalized)
    expect(norm).toBeCloseTo(1.0, 2);
  });

  it('should calculate cosine similarity correctly', async () => {
    const text1 = 'I love programming and coding';
    const text2 = 'I enjoy software development';
    const text3 = 'The weather is nice today';

    const emb1 = await embeddingsService.generateEmbedding(text1);
    const emb2 = await embeddingsService.generateEmbedding(text2);
    const emb3 = await embeddingsService.generateEmbedding(text3);

    const similarity12 = EmbeddingsService.cosineSimilarity(emb1, emb2);
    const similarity13 = EmbeddingsService.cosineSimilarity(emb1, emb3);

    // Similar topics should have higher similarity
    expect(similarity12).toBeGreaterThan(similarity13);
    expect(similarity12).toBeGreaterThan(0.5); // Reasonably similar
    expect(similarity13).toBeLessThan(0.5); // Less similar
  });

  it('should serialize and deserialize embeddings correctly', async () => {
    const text = 'Serialization test message';
    const original = await embeddingsService.generateEmbedding(text);

    const serialized = EmbeddingsService.serializeEmbedding(original);
    expect(serialized).toBeInstanceOf(Buffer);

    const deserialized = EmbeddingsService.deserializeEmbedding(serialized);
    expect(deserialized).toBeInstanceOf(Float32Array);
    expect(deserialized.length).toBe(original.length);

    // Values should match
    for (let i = 0; i < original.length; i++) {
      expect(deserialized[i]).toBeCloseTo(original[i], 5);
    }
  });

  it('should generate batch embeddings', async () => {
    const texts = [
      'First message',
      'Second message',
      'Third message'
    ];

    const embeddings = await embeddingsService.generateBatchEmbeddings(texts);

    expect(embeddings).toHaveLength(3);
    embeddings.forEach(emb => {
      expect(emb).toBeInstanceOf(Float32Array);
      expect(emb.length).toBe(384);
    });
  });
});

describe('RAGService with MemoryService', () => {
  let memoryService: MemoryService;
  let ragService: RAGService;
  const testUserId = 'test-rag-user';
  let testSessionId: string;

  beforeEach(async () => {
    memoryService = new MemoryService(':memory:');
    ragService = new RAGService(memoryService['db']);

    // Create user and session
    await memoryService.createOrUpdateUser(testUserId);
    const session = memoryService.getOrCreateSession(testUserId);
    testSessionId = session.session_id;

    // Store test messages with embeddings
    await memoryService.storeMessage(testSessionId, 'user', 'I love meditation and mindfulness');
    await memoryService.storeMessage(testSessionId, 'assistant', 'That sounds peaceful!');
    await memoryService.storeMessage(testSessionId, 'user', 'Tell me about programming languages');
    await memoryService.storeMessage(testSessionId, 'assistant', 'Sure! What language interests you?');

    // Wait for embeddings to be generated (async operation)
    await new Promise(resolve => setTimeout(resolve, 3000));
  });

  afterEach(() => {
    memoryService.close();
  });

  it('should perform semantic search and find relevant messages', async () => {
    const query = 'mindfulness practice';
    const results = await ragService.semanticSearch(query, {
      userId: testUserId,
      topK: 2,
      minSimilarity: 0.3,
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].message.content).toContain('meditation');
    expect(results[0].similarity).toBeGreaterThan(0.3);
    expect(results[0].rank).toBe(1);
  });

  it('should respect minSimilarity threshold', async () => {
    const query = 'completely unrelated topic about space travel';
    const results = await ragService.semanticSearch(query, {
      userId: testUserId,
      topK: 10,
      minSimilarity: 0.8, // Very high threshold
    });

    // Should return few or no results
    expect(results.length).toBeLessThan(3);
  });

  it('should get relevant context for conversation', async () => {
    const currentMessage = 'Can we talk about relaxation techniques?';
    const relevantMessages = await ragService.getRelevantContext(
      currentMessage,
      testUserId,
      testSessionId,
      {
        maxMessages: 2,
        minSimilarity: 0.4,
        includeCurrentSession: true,
      }
    );

    expect(relevantMessages.length).toBeLessThanOrEqual(2);
    // Should find the meditation message as most relevant
    const hasRelevantContent = relevantMessages.some(msg => 
      msg.content.includes('meditation') || msg.content.includes('mindfulness')
    );
    expect(hasRelevantContent).toBe(true);
  });

  it('should rank results by similarity', async () => {
    const query = 'meditation practice';
    const results = await ragService.semanticSearch(query, {
      userId: testUserId,
      topK: 3,
      minSimilarity: 0.2,
    });

    if (results.length > 1) {
      // Each result should have decreasing or equal similarity
      for (let i = 1; i < results.length; i++) {
        expect(results[i].similarity).toBeLessThanOrEqual(results[i - 1].similarity);
      }

      // Ranks should be sequential
      results.forEach((result, index) => {
        expect(result.rank).toBe(index + 1);
      });
    }
  });

  it('should calculate relevance scores', () => {
    const message: ConversationMessage = {
      id: 'test-msg',
      session_id: testSessionId,
      user_id: testUserId,
      role: 'user',
      content: 'This is a test message about programming',
      timestamp: Date.now() - 60000, // 1 minute ago
      tokens: 10,
    };

    const query = 'programming';
    const similarity = 0.8;
    const currentTime = Date.now();

    const score = ragService.calculateRelevanceScore(message, query, similarity, currentTime);

    expect(score).toBeGreaterThan(similarity);
    expect(score).toBeLessThanOrEqual(1.0);
  });
});

describe('PersonalizationEngine', () => {
  const mockProfile: UserProfile = {
    user_id: 'test-user',
    nickname: 'TestUser',
    conversation_style: 'playful',
    topics: '["meditation", "gaming", "music"]',
    memory_enabled: true,
    data_retention_days: 90,
    share_with_avatar: false,
    created_at: Date.now(),
    last_active: Date.now(),
  };

  const mockMessages: ConversationMessage[] = [
    {
      id: '1',
      session_id: 'session-1',
      user_id: 'test-user',
      role: 'user',
      content: 'I feel really happy today! 😊',
      timestamp: Date.now() - 10000,
      tokens: 8,
    },
    {
      id: '2',
      session_id: 'session-1',
      user_id: 'test-user',
      role: 'assistant',
      content: 'That\'s wonderful to hear! 🌸',
      timestamp: Date.now() - 5000,
      tokens: 10,
    },
  ];

  it('should generate personalized context with user profile', () => {
    const context = personalizationEngine.generateContext(
      mockProfile,
      mockMessages,
      [],
      'Tell me about meditation'
    );

    expect(context.systemPrompt).toContain('TestUser');
    expect(context.systemPrompt).toContain('playful');
    expect(context.contextMessages).toHaveLength(2);
  });

  it('should build style instructions based on conversation style', () => {
    const context = personalizationEngine.generateContext(
      { ...mockProfile, conversation_style: 'supportive' },
      [],
      [],
      'Test message'
    );

    expect(context.styleInstructions).toContain('support');
    expect(context.styleInstructions).toContain('validation');
  });

  it('should detect conversation style from message patterns', () => {
    const playfulMessages: ConversationMessage[] = [
      { id: '1', session_id: 's1', user_id: 'u1', role: 'user', content: 'haha this is fun! 😂', timestamp: Date.now(), tokens: 5 },
      { id: '2', session_id: 's1', user_id: 'u1', role: 'user', content: 'lol I love games', timestamp: Date.now(), tokens: 5 },
      { id: '3', session_id: 's1', user_id: 'u1', role: 'user', content: 'This is hilarious!', timestamp: Date.now(), tokens: 4 },
    ];

    const analysis = personalizationEngine.analyzeConversationPatterns('u1', playfulMessages);
    
    expect(analysis.detectedStyle).toBe(ConversationStyle.PLAYFUL);
    expect(analysis.detectedTopics).toBeInstanceOf(Array);
  });

  it('should extract topics from conversations', () => {
    const messages: ConversationMessage[] = [
      { id: '1', session_id: 's1', user_id: 'u1', role: 'user', content: 'I love meditation and mindfulness', timestamp: Date.now(), tokens: 7 },
      { id: '2', session_id: 's1', user_id: 'u1', role: 'user', content: 'Gaming is my favorite hobby', timestamp: Date.now(), tokens: 6 },
    ];

    const analysis = personalizationEngine.analyzeConversationPatterns('u1', messages);
    
    expect(analysis.detectedTopics).toContain('meditation');
    expect(analysis.detectedTopics).toContain('gaming');
  });

  it('should calculate engagement score', () => {
    const engagedMessages: ConversationMessage[] = [
      { id: '1', session_id: 's1', user_id: 'u1', role: 'user', content: 'This is amazing! 😊 I have so many questions about this topic. Can you tell me more?', timestamp: Date.now() - 1000, tokens: 20 },
      { id: '2', session_id: 's1', user_id: 'u1', role: 'user', content: 'Wow! That makes sense. What about...?', timestamp: Date.now() - 500, tokens: 15 },
      { id: '3', session_id: 's1', user_id: 'u1', role: 'user', content: 'I see! Thanks for explaining 💕', timestamp: Date.now(), tokens: 10 },
    ];

    const score = personalizationEngine.calculateEngagementScore(engagedMessages);
    
    expect(score).toBeGreaterThan(50); // Should be fairly engaged
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe('MemoryService Summarization', () => {
  let memoryService: MemoryService;
  const testUserId = 'test-summary-user';
  let testSessionId: string;

  beforeEach(async () => {
    memoryService = new MemoryService(':memory:');
    await memoryService.createOrUpdateUser(testUserId);
    const session = memoryService.getOrCreateSession(testUserId);
    testSessionId = session.session_id;

    // Add multiple messages
    for (let i = 0; i < 15; i++) {
      await memoryService.storeMessage(
        testSessionId,
        i % 2 === 0 ? 'user' : 'assistant',
        `Message ${i + 1} about meditation and relaxation techniques`
      );
    }
  });

  afterEach(() => {
    memoryService.close();
  });

  it('should summarize conversation history', async () => {
    const summary = await memoryService.summarizeConversation(testSessionId, {
      maxMessages: 15,
      preserveRecent: 5,
    });

    expect(summary.summary).toBeTruthy();
    expect(summary.messagesSummarized).toBe(10); // 15 total - 5 preserved
    expect(summary.oldestTimestamp).toBeLessThan(summary.newestTimestamp);
  });

  it('should extract keywords from conversation', async () => {
    const summary = await memoryService.summarizeConversation(testSessionId);

    expect(summary.summary).toContain('meditation');
    expect(summary.summary).toContain('relaxation');
  });

  it('should not summarize short conversations', async () => {
    // Create user first for foreign key constraint
    await memoryService.createOrUpdateUser(testUserId + '-short');
    const shortSession = memoryService.getOrCreateSession(testUserId + '-short');
    await memoryService.storeMessage(shortSession.session_id, 'user', 'Hello');
    await memoryService.storeMessage(shortSession.session_id, 'assistant', 'Hi there!');

    const summary = await memoryService.summarizeConversation(shortSession.session_id, {
      preserveRecent: 5,
    });

    expect(summary.summary).toBe('');
    expect(summary.messagesSummarized).toBe(0);
  });
});
