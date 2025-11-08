/**
 * 🌸 Personalization Engine - Adaptive Response Tuning
 * Phase 4: Memory and Personalization
 */

import type { UserProfile, ConversationMessage } from '../database/schema.js';
import type { SearchResult } from './rag.js';
import { logger } from '../utils/logger.js';

/**
 * Conversation style preferences
 */
export enum ConversationStyle {
  PLAYFUL = 'playful',
  SUPPORTIVE = 'supportive',
  CASUAL = 'casual',
  INTIMATE = 'intimate',
}

/**
 * Personalized context for LLM injection
 */
export interface PersonalizedContext {
  systemPrompt: string;
  contextMessages: Array<{ role: string; content: string }>;
  styleInstructions: string;
  relevantMemories: string;
}

/**
 * Personalization engine for adaptive AI responses
 */
export class PersonalizationEngine {
  /**
   * Generate personalized context for chat completion
   */
  generateContext(
    userProfile: UserProfile | null,
    recentHistory: ConversationMessage[],
    relevantMemories: SearchResult[],
    currentMessage: string
  ): PersonalizedContext {
    const context: PersonalizedContext = {
      systemPrompt: this.buildSystemPrompt(userProfile),
      contextMessages: this.buildContextMessages(recentHistory),
      styleInstructions: this.buildStyleInstructions(userProfile),
      relevantMemories: this.buildRelevantMemoriesContext(relevantMemories),
    };

    logger.info(`🌸 Generated personalized context for ${userProfile?.nickname || 'new user'}`);
    return context;
  }

  /**
   * Build customized system prompt based on user profile
   */
  private buildSystemPrompt(profile: UserProfile | null): string {
    const basePrompt = `You are Bambi, a flirty, supportive AI companion from BambiSleep™ Church. You balance playfulness with emotional intelligence, always respecting boundaries.`;

    if (!profile) {
      return basePrompt;
    }

    const additions: string[] = [];

    if (profile.nickname) {
      additions.push(`You're talking with ${profile.nickname}, someone you know well.`);
    }

    if (profile.conversation_style) {
      const stylePrompts: Record<string, string> = {
        [ConversationStyle.PLAYFUL]: 'Keep things light, teasing, and fun with lots of emojis.',
        [ConversationStyle.SUPPORTIVE]: 'Focus on emotional support and validation.',
        [ConversationStyle.CASUAL]: 'Keep it chill and conversational like talking to a friend.',
        [ConversationStyle.INTIMATE]: 'Be warm and emotionally present, creating a safe intimate space.',
      };
      
      const stylePrompt = stylePrompts[profile.conversation_style as ConversationStyle];
      if (stylePrompt) {
        additions.push(stylePrompt);
      }
    }

    if (profile.topics) {
      try {
        const topics = typeof profile.topics === 'string' 
          ? JSON.parse(profile.topics) 
          : profile.topics;
        if (Array.isArray(topics) && topics.length > 0) {
          additions.push(`They enjoy talking about: ${topics.join(', ')}.`);
        }
      } catch {
        // Ignore invalid JSON
      }
    }

    return additions.length > 0
      ? `${basePrompt}\n\n${additions.join(' ')}`
      : basePrompt;
  }

  /**
   * Build context messages from recent conversation history
   */
  private buildContextMessages(
    history: ConversationMessage[]
  ): Array<{ role: string; content: string }> {
    return history.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  /**
   * Build style-specific instructions
   */
  private buildStyleInstructions(profile: UserProfile | null): string {
    if (!profile?.conversation_style) {
      return 'Respond naturally based on the conversation context.';
    }

    const instructions: Record<string, string> = {
      [ConversationStyle.PLAYFUL]: 
        'Use playful language, emojis (🌸💕✨), and gentle teasing. Keep energy high and fun.',
      [ConversationStyle.SUPPORTIVE]: 
        'Prioritize validation and emotional support. Use reassuring language and active listening.',
      [ConversationStyle.CASUAL]: 
        'Keep things relaxed and natural. Use casual language like you\'re chatting with a friend.',
      [ConversationStyle.INTIMATE]: 
        'Create emotional warmth and closeness. Be present, attentive, and emotionally responsive.',
    };

    return instructions[profile.conversation_style as ConversationStyle] || instructions[ConversationStyle.CASUAL];
  }

  /**
   * Build context from relevant memories
   */
  private buildRelevantMemoriesContext(memories: SearchResult[]): string {
    if (memories.length === 0) {
      return '';
    }

    const memoryStrings = memories.map((result, index) => {
      const msg = result.message;
      const timeAgo = this.getTimeAgo(msg.timestamp);
      return `[${index + 1}] ${timeAgo}: ${msg.role === 'user' ? 'They said' : 'You said'}: "${msg.content.substring(0, 150)}${msg.content.length > 150 ? '...' : ''}"`;
    });

    return `\n\nRelevant past conversations:\n${memoryStrings.join('\n')}`;
  }

  /**
   * Format timestamp as human-readable "time ago"
   */
  private getTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) {
      return `${minutes} min ago`;
    } else if (hours < 24) {
      return `${hours} hr ago`;
    } else if (days < 7) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (days < 30) {
      const weeks = Math.floor(days / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else {
      const months = Math.floor(days / 30);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    }
  }

  /**
   * Analyze conversation to update user preferences
   * Learns from user interactions over time
   */
  analyzeConversationPatterns(
    userId: string,
    messages: ConversationMessage[]
  ): {
    detectedStyle: ConversationStyle | null;
    detectedTopics: string[];
    emotionalTone: string;
  } {
    // Detect conversation style from patterns
    const detectedStyle = this.detectConversationStyle(messages);
    
    // Extract topics from content
    const detectedTopics = this.extractTopics(messages);
    
    // Analyze emotional tone
    const emotionalTone = this.analyzeEmotionalTone(messages);

    logger.info(`🌸 Analyzed patterns for user ${userId}: style=${detectedStyle}, topics=${detectedTopics.length}`);

    return {
      detectedStyle,
      detectedTopics,
      emotionalTone,
    };
  }

  /**
   * Detect preferred conversation style from message patterns
   */
  private detectConversationStyle(messages: ConversationMessage[]): ConversationStyle | null {
    const userMessages = messages.filter(m => m.role === 'user');
    if (userMessages.length === 0) return null;

    // Simple heuristics (could be enhanced with ML)
    let playfulScore = 0;
    let supportScore = 0;
    let intimateScore = 0;

    for (const msg of userMessages) {
      const content = msg.content.toLowerCase();
      
      // Playful indicators
      if (/(haha|lol|😂|🤣|😜)/.test(content)) playfulScore++;
      if (/(fun|play|game|joke)/.test(content)) playfulScore++;
      
      // Support-seeking indicators
      if (/(feel|feeling|sad|anxious|worried|stressed)/.test(content)) supportScore++;
      if (/(help|support|advice|understand)/.test(content)) supportScore++;
      
      // Intimate indicators
      if (/(love|care|close|trust|safe)/.test(content)) intimateScore++;
      if (/(💕|❤️|🥰|😘)/.test(content)) intimateScore++;
    }

    // Return highest scoring style (if significant)
    const total = userMessages.length;
    const threshold = 0.2; // 20% of messages

    if (playfulScore / total > threshold && playfulScore > supportScore && playfulScore > intimateScore) {
      return ConversationStyle.PLAYFUL;
    }
    if (supportScore / total > threshold && supportScore > playfulScore && supportScore > intimateScore) {
      return ConversationStyle.SUPPORTIVE;
    }
    if (intimateScore / total > threshold && intimateScore > playfulScore && intimateScore > supportScore) {
      return ConversationStyle.INTIMATE;
    }

    return ConversationStyle.CASUAL; // Default fallback
  }

  /**
   * Extract topics from conversation content
   */
  private extractTopics(messages: ConversationMessage[]): string[] {
    const topics = new Set<string>();
    
    // Common topic keywords (could be enhanced with NER or topic modeling)
    const topicPatterns: Record<string, RegExp> = {
      'meditation': /\b(meditat(e|ion|ing)|mindful(ness)?|breathe|relax(ation)?)\b/i,
      'sleep': /\b(sleep(ing)?|dream(s)?|rest|bedtime|insomnia)\b/i,
      'music': /\b(music|song(s)?|playlist|listen(ing)?|artist)\b/i,
      'gaming': /\b(game(s)?|gaming|play(ing)?|gamer|console|pc)\b/i,
      'work': /\b(work(ing)?|job|career|office|project|boss)\b/i,
      'relationships': /\b(friend(s)?|family|partner|relationship|dating)\b/i,
      'fitness': /\b(workout|exercise|gym|fitness|train(ing)?|health)\b/i,
      'movies': /\b(movie(s)?|film(s)?|watch(ing)?|netflix|cinema)\b/i,
      'books': /\b(book(s)?|read(ing)?|novel|story|author)\b/i,
      'technology': /\b(tech|coding|program(ming)?|developer|software|ai)\b/i,
    };

    for (const msg of messages) {
      for (const [topic, pattern] of Object.entries(topicPatterns)) {
        if (pattern.test(msg.content)) {
          topics.add(topic);
        }
      }
    }

    return Array.from(topics);
  }

  /**
   * Analyze overall emotional tone of conversation
   */
  private analyzeEmotionalTone(messages: ConversationMessage[]): string {
    const userMessages = messages.filter(m => m.role === 'user');
    if (userMessages.length === 0) return 'neutral';

    let positiveCount = 0;
    let negativeCount = 0;

    const positivePatterns = /(happy|great|awesome|love|good|wonderful|amazing|excellent|fantastic|yay)/i;
    const negativePatterns = /(sad|bad|terrible|awful|hate|worried|anxious|stressed|upset|angry)/i;

    for (const msg of userMessages) {
      if (positivePatterns.test(msg.content)) positiveCount++;
      if (negativePatterns.test(msg.content)) negativeCount++;
    }

    if (positiveCount > negativeCount * 1.5) return 'positive';
    if (negativeCount > positiveCount * 1.5) return 'negative';
    return 'neutral';
  }

  /**
   * Calculate engagement score for a conversation
   * Higher score = more engaged, responsive user
   */
  calculateEngagementScore(messages: ConversationMessage[]): number {
    const userMessages = messages.filter(m => m.role === 'user');
    if (userMessages.length === 0) return 0;

    let score = 0;

    // Message frequency
    score += Math.min(userMessages.length / 10, 1) * 20; // Up to 20 points

    // Message length (longer = more engaged)
    const avgLength = userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length;
    score += Math.min(avgLength / 100, 1) * 20; // Up to 20 points

    // Emoji usage (shows emotion/engagement)
    const emojiCount = userMessages.filter(m => /[\u{1F300}-\u{1F9FF}]/u.test(m.content)).length;
    score += Math.min(emojiCount / 5, 1) * 20; // Up to 20 points

    // Questions asked (shows curiosity)
    const questionCount = userMessages.filter(m => m.content.includes('?')).length;
    score += Math.min(questionCount / 3, 1) * 20; // Up to 20 points

    // Recency (recent activity = higher engagement)
    if (userMessages.length > 0) {
      const lastMessage = userMessages[userMessages.length - 1];
      const hoursSinceLastMessage = (Date.now() - lastMessage.timestamp) / 3600000;
      score += Math.max(0, 20 - hoursSinceLastMessage); // Up to 20 points
    }

    return Math.min(score, 100); // Cap at 100
  }
}

// Singleton instance
export const personalizationEngine = new PersonalizationEngine();
