/**
 * Personalization Engine - Main orchestrator
 * @module services/personalization/personalization-engine
 */

import { UserProfileService } from './user-profile-service.js';
import { AdaptiveResponseService } from './adaptive-response-service.js';
import type { UserProfile, PersonalizationContext, AdaptiveResponse } from './types.js';

export class PersonalizationEngine {
  private readonly profileService: UserProfileService;
  private readonly adaptiveService: AdaptiveResponseService;

  constructor() {
    this.profileService = new UserProfileService();
    this.adaptiveService = new AdaptiveResponseService();
  }

  /**
   * Learn from user message
   */
  learn(userId: string, message: string): UserProfile {
    const isQuestion = message.includes('?');
    return this.profileService.updateProfile(userId, message, isQuestion);
  }

  /**
   * Personalize response for user
   */
  personalize(userId: string, response: string): AdaptiveResponse {
    const profile = this.profileService.getProfile(userId);
    const context = this.adaptiveService.getContext(profile);
    return this.adaptiveService.adaptResponse(response, profile, context);
  }

  /**
   * Get user profile
   */
  getProfile(userId: string): UserProfile {
    return this.profileService.getProfile(userId);
  }

  /**
   * Update preferences
   */
  updatePreferences(userId: string, preferences: any): UserProfile {
    return this.profileService.updatePreferences(userId, preferences);
  }

  /**
   * Add user interest
   */
  addInterest(userId: string, interest: string): UserProfile {
    return this.profileService.addInterest(userId, interest);
  }

  /**
   * Get stats for all users
   */
  getStats() {
    const profiles = this.profileService.getAllProfiles();
    return {
      totalUsers: profiles.length,
      avgSatisfaction: profiles.reduce((sum, p) => sum + p.conversationHistory.satisfactionScore, 0) / profiles.length,
      avgEngagement: profiles.reduce((sum, p) => sum + p.conversationHistory.engagementLevel, 0) / profiles.length,
    };
  }
}
