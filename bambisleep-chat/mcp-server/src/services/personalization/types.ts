/**
 * Type definitions for personalization engine
 * @module services/personalization/types
 */

export interface UserProfile {
  readonly userId: string;
  readonly name?: string;
  readonly preferences: UserPreferences;
  readonly communicationStyle: CommunicationStyle;
  readonly interests: readonly string[];
  readonly conversationHistory: ConversationStats;
  readonly lastUpdated: number;
  readonly createdAt: number;
}

export interface UserPreferences {
  readonly responseLength: 'concise' | 'balanced' | 'detailed';
  readonly formality: 'casual' | 'neutral' | 'formal';
  readonly emojiUsage: 'none' | 'minimal' | 'moderate' | 'frequent';
  readonly technicality: 'simplified' | 'balanced' | 'technical';
  readonly humorLevel: 'serious' | 'occasional' | 'playful';
  readonly customSettings?: Record<string, unknown>;
}

export interface CommunicationStyle {
  readonly avgMessageLength: number;
  readonly vocabularyLevel: number;
  readonly questionFrequency: number;
  readonly exclamationUsage: number;
  readonly topicDepth: 'surface' | 'moderate' | 'deep';
}

export interface ConversationStats {
  readonly totalMessages: number;
  readonly avgResponseTime: number;
  readonly topTopics: readonly string[];
  readonly satisfactionScore: number;
  readonly engagementLevel: number;
}

export interface PersonalizationContext {
  readonly profile: UserProfile;
  readonly currentTopic?: string;
  readonly mood?: 'positive' | 'neutral' | 'negative';
  readonly timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
}

export interface AdaptiveResponse {
  readonly content: string;
  readonly confidence: number;
  readonly adjustments: readonly string[];
  readonly styleMatch: number;
}
