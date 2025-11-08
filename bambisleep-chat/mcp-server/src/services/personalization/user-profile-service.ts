/**
 * User Profile Service - Build and maintain user profiles
 * @module services/personalization/user-profile-service
 */

import type { UserProfile, UserPreferences, CommunicationStyle, ConversationStats } from './types.js';

export class UserProfileService {
  private profiles: Map<string, UserProfile> = new Map();

  /**
   * Get or create user profile
   */
  getProfile(userId: string): UserProfile {
    if (!this.profiles.has(userId)) {
      this.profiles.set(userId, this.createDefaultProfile(userId));
    }
    return this.profiles.get(userId)!;
  }

  /**
   * Update user profile based on new message
   */
  updateProfile(userId: string, message: string, isQuestion: boolean = false): UserProfile {
    const profile = this.getProfile(userId);
    const updatedStyle = this.updateCommunicationStyle(profile.communicationStyle, message, isQuestion);
    const updatedStats = this.updateConversationStats(profile.conversationHistory);

    const updated: UserProfile = {
      ...profile,
      communicationStyle: updatedStyle,
      conversationHistory: updatedStats,
      lastUpdated: Date.now(),
    };

    this.profiles.set(userId, updated);
    return updated;
  }

  /**
   * Update preferences explicitly
   */
  updatePreferences(userId: string, preferences: Partial<UserPreferences>): UserProfile {
    const profile = this.getProfile(userId);
    const updated: UserProfile = {
      ...profile,
      preferences: { ...profile.preferences, ...preferences },
      lastUpdated: Date.now(),
    };

    this.profiles.set(userId, updated);
    return updated;
  }

  /**
   * Add interest/topic to user profile
   */
  addInterest(userId: string, interest: string): UserProfile {
    const profile = this.getProfile(userId);
    const interests = [...profile.interests];
    
    if (!interests.includes(interest)) {
      interests.push(interest);
    }

    const updated: UserProfile = {
      ...profile,
      interests,
      lastUpdated: Date.now(),
    };

    this.profiles.set(userId, updated);
    return updated;
  }

  /**
   * Create default profile for new user
   */
  private createDefaultProfile(userId: string): UserProfile {
    return {
      userId,
      preferences: {
        responseLength: 'balanced',
        formality: 'neutral',
        emojiUsage: 'minimal',
        technicality: 'balanced',
        humorLevel: 'occasional',
      },
      communicationStyle: {
        avgMessageLength: 50,
        vocabularyLevel: 0.5,
        questionFrequency: 0.2,
        exclamationUsage: 0.1,
        topicDepth: 'moderate',
      },
      interests: [],
      conversationHistory: {
        totalMessages: 0,
        avgResponseTime: 1000,
        topTopics: [],
        satisfactionScore: 0.8,
        engagementLevel: 0.5,
      },
      lastUpdated: Date.now(),
      createdAt: Date.now(),
    };
  }

  /**
   * Update communication style based on message
   */
  private updateCommunicationStyle(
    current: CommunicationStyle,
    message: string,
    isQuestion: boolean
  ): CommunicationStyle {
    const words = message.split(/\s+/).length;
    const hasExclamation = message.includes('!');

    return {
      avgMessageLength: (current.avgMessageLength * 0.9) + (words * 0.1),
      vocabularyLevel: this.estimateVocabulary(message, current.vocabularyLevel),
      questionFrequency: isQuestion 
        ? Math.min(1, current.questionFrequency + 0.05)
        : current.questionFrequency * 0.95,
      exclamationUsage: hasExclamation
        ? Math.min(1, current.exclamationUsage + 0.05)
        : current.exclamationUsage * 0.95,
      topicDepth: current.topicDepth,
    };
  }

  /**
   * Estimate vocabulary level
   */
  private estimateVocabulary(message: string, current: number): number {
    const avgWordLength = message.split(/\s+/)
      .reduce((sum, word) => sum + word.length, 0) / message.split(/\s+/).length;
    
    const newLevel = Math.min(1, avgWordLength / 10);
    return (current * 0.9) + (newLevel * 0.1);
  }

  /**
   * Update conversation statistics
   */
  private updateConversationStats(current: ConversationStats): ConversationStats {
    return {
      ...current,
      totalMessages: current.totalMessages + 1,
      engagementLevel: Math.min(1, current.engagementLevel + 0.01),
    };
  }

  /**
   * Get all profiles (for analytics)
   */
  getAllProfiles(): UserProfile[] {
    return Array.from(this.profiles.values());
  }

  /**
   * Clear profile
   */
  clearProfile(userId: string): void {
    this.profiles.delete(userId);
  }
}
