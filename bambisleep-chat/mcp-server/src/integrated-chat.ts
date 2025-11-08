/**
 * Integrated Chat Service - Combines all Phase 4 services
 * @module integrated-chat
 */

import { LocalRAGService } from './services/rag/index.js';
import { ContextRetrievalService } from './services/context-retrieval/index.js';
import { PersonalizationEngine } from './services/personalization/index.js';
import type { Message } from './services/context-retrieval/types.js';

export interface ChatConfig {
  readonly userId: string;
  readonly sessionId?: string;
  readonly contextWindow?: number;
  readonly enablePersonalization?: boolean;
}

export interface ChatResponse {
  readonly content: string;
  readonly confidence: number;
  readonly context: readonly Message[];
  readonly personalization?: {
    readonly styleMatch: number;
    readonly adjustments: readonly string[];
  };
  readonly metadata: {
    readonly processingTime: number;
    readonly contextSize: number;
    readonly ragResults: number;
  };
}

/**
 * Integrated Chat Service
 * Combines RAG, Context Retrieval, and Personalization
 */
export class IntegratedChatService {
  private readonly rag: LocalRAGService;
  private readonly contextRetrieval: ContextRetrievalService;
  private readonly personalization: PersonalizationEngine;
  private readonly conversationHistory: Map<string, Message[]> = new Map();

  constructor() {
    this.rag = new LocalRAGService();
    this.contextRetrieval = new ContextRetrievalService(this.rag);
    this.personalization = new PersonalizationEngine();
  }

  /**
   * Initialize all services
   */
  async initialize(): Promise<void> {
    await this.rag.initialize();
  }

  /**
   * Process user message with full AI pipeline
   */
  async chat(userMessage: string, config: ChatConfig): Promise<ChatResponse> {
    const startTime = Date.now();
    const { userId, contextWindow = 10, enablePersonalization = true } = config;

    // 1. Learn from user message (personalization)
    if (enablePersonalization) {
      this.personalization.learn(userId, userMessage);
    }

    // 2. Get conversation history
    const history = this.getHistory(userId);

    // 3. Retrieve relevant context using RAG + semantic search
    let relevantContext;
    try {
      relevantContext = await this.contextRetrieval.getRelevantContext(
        userMessage,
        history,
        { topK: contextWindow }
      );
    } catch (error) {
      // Fallback if RAG fails
      relevantContext = {
        messages: history.slice(-contextWindow),
        totalMessages: history.length,
        confidence: 0.5,
      };
    }

    // 4. Add current message to history
    const currentMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
    };
    this.addToHistory(userId, currentMessage);

    // 5. Generate base response (this would call Claude/LLM in production)
    const baseResponse = await this.generateResponse(userMessage, relevantContext.messages);

    // 6. Personalize response
    let finalResponse = baseResponse;
    let personalizationData;

    if (enablePersonalization) {
      const adapted = this.personalization.personalize(userId, baseResponse);
      finalResponse = adapted.content;
      personalizationData = {
        styleMatch: adapted.styleMatch,
        adjustments: adapted.adjustments,
      };
    }

    // 7. Add assistant response to history
    const assistantMessage: Message = {
      id: `msg_${Date.now() + 1}`,
      role: 'assistant',
      content: finalResponse,
      timestamp: Date.now(),
    };
    this.addToHistory(userId, assistantMessage);

    const processingTime = Date.now() - startTime;

    return {
      content: finalResponse,
      confidence: relevantContext.confidence || 0.5,
      context: relevantContext.messages,
      personalization: personalizationData,
      metadata: {
        processingTime,
        contextSize: relevantContext.messages.length,
        ragResults: relevantContext.totalMessages,
      },
    };
  }

  /**
   * Generate base response (stub for LLM integration)
   */
  private async generateResponse(query: string, context: readonly Message[]): Promise<string> {
    // In production, this would call Claude or another LLM
    // For now, return a simple acknowledgment
    
    if (context.length > 0) {
      return `Based on our conversation history, I understand you're asking about: "${query}". Let me help you with that.`;
    }
    
    return `I'd be happy to help with: "${query}". What would you like to know?`;
  }

  /**
   * Get conversation history for user
   */
  private getHistory(userId: string): Message[] {
    return this.conversationHistory.get(userId) || [];
  }

  /**
   * Add message to history
   */
  private addToHistory(userId: string, message: Message): void {
    const history = this.getHistory(userId);
    this.conversationHistory.set(userId, [...history, message]);
  }

  /**
   * Clear history for user
   */
  clearHistory(userId: string): void {
    this.conversationHistory.delete(userId);
  }

  /**
   * Get user profile
   */
  getUserProfile(userId: string) {
    return this.personalization.getProfile(userId);
  }

  /**
   * Get system stats
   */
  getStats() {
    return {
      personalization: this.personalization.getStats(),
      totalConversations: this.conversationHistory.size,
      ragStatus: {
        initialized: true,
        documentCount: 0, // Would come from RAG service
      },
    };
  }
}
