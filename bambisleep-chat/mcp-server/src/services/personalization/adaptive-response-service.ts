/**
 * Adaptive Response Service - Adjust responses to match user style
 * @module services/personalization/adaptive-response-service
 */

import type { UserProfile, PersonalizationContext, AdaptiveResponse } from './types.js';

export class AdaptiveResponseService {
  /**
   * Adapt response to match user's communication style
   */
  adaptResponse(
    baseResponse: string,
    profile: UserProfile,
    context?: Partial<PersonalizationContext>
  ): AdaptiveResponse {
    const adjustments: string[] = [];
    let content = baseResponse;
    let confidence = 0.8;

    // 1. Adjust length
    content = this.adjustLength(content, profile.preferences.responseLength);
    adjustments.push(`length:${profile.preferences.responseLength}`);

    // 2. Adjust formality
    content = this.adjustFormality(content, profile.preferences.formality);
    adjustments.push(`formality:${profile.preferences.formality}`);

    // 3. Adjust emoji usage
    content = this.adjustEmojis(content, profile.preferences.emojiUsage);
    adjustments.push(`emojis:${profile.preferences.emojiUsage}`);

    // 4. Adjust technicality
    confidence = this.matchTechnicality(content, profile.preferences.technicality);
    adjustments.push(`technicality:${profile.preferences.technicality}`);

    // 5. Calculate style match
    const styleMatch = this.calculateStyleMatch(content, profile);

    return {
      content,
      confidence,
      adjustments,
      styleMatch,
    };
  }

  /**
   * Adjust response length
   */
  private adjustLength(response: string, preference: string): string {
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);

    switch (preference) {
      case 'concise':
        return sentences.slice(0, 2).join('. ') + '.';
      case 'detailed':
        return response;
      case 'balanced':
      default:
        return sentences.slice(0, 4).join('. ') + '.';
    }
  }

  /**
   * Adjust formality level
   */
  private adjustFormality(response: string, preference: string): string {
    let adjusted = response;

    switch (preference) {
      case 'casual':
        adjusted = adjusted.replace(/However,/g, 'But');
        adjusted = adjusted.replace(/Therefore,/g, 'So');
        adjusted = adjusted.replace(/Additionally,/g, 'Also');
        break;
      case 'formal':
        adjusted = adjusted.replace(/\bcan't\b/g, 'cannot');
        adjusted = adjusted.replace(/\bdon't\b/g, 'do not');
        adjusted = adjusted.replace(/\bwon't\b/g, 'will not');
        break;
      case 'neutral':
      default:
        break;
    }

    return adjusted;
  }

  /**
   * Adjust emoji usage
   */
  private adjustEmojis(response: string, preference: string): string {
    const emojis = ['✅', '��', '💡', '🎯', '⚡', '🔥', '💪', '🌟'];

    switch (preference) {
      case 'none':
        return response.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
      case 'frequent':
        return response + ' ' + emojis[Math.floor(Math.random() * emojis.length)];
      case 'moderate':
        return Math.random() > 0.5 ? response + ' ' + emojis[0] : response;
      case 'minimal':
      default:
        return response;
    }
  }

  /**
   * Check if response matches technicality preference
   */
  private matchTechnicality(response: string, preference: string): number {
    const technicalTerms = ['algorithm', 'implementation', 'architecture', 'optimization'];
    const hasTechnical = technicalTerms.some(term => 
      response.toLowerCase().includes(term)
    );

    if (preference === 'technical' && hasTechnical) return 0.9;
    if (preference === 'simplified' && !hasTechnical) return 0.9;
    return 0.7;
  }

  /**
   * Calculate how well response matches user style
   */
  private calculateStyleMatch(response: string, profile: UserProfile): number {
    const responseLength = response.split(/\s+/).length;
    const targetLength = profile.communicationStyle.avgMessageLength;
    
    const lengthScore = 1 - Math.min(1, Math.abs(responseLength - targetLength) / targetLength);
    
    const exclamations = (response.match(/!/g) || []).length;
    const exclamationScore = 1 - Math.abs(
      exclamations / responseLength - profile.communicationStyle.exclamationUsage
    );

    return (lengthScore + exclamationScore) / 2;
  }

  /**
   * Get personalization context
   */
  getContext(profile: UserProfile): PersonalizationContext {
    const hour = new Date().getHours();
    let timeOfDay: PersonalizationContext['timeOfDay'];

    if (hour < 12) timeOfDay = 'morning';
    else if (hour < 17) timeOfDay = 'afternoon';
    else if (hour < 21) timeOfDay = 'evening';
    else timeOfDay = 'night';

    return {
      profile,
      timeOfDay,
    };
  }
}
