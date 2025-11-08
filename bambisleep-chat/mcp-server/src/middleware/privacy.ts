/**
 * 🔐 Privacy Middleware - Consent Enforcement
 * Phase 5: Ensures GDPR compliance by checking consent before data operations
 */

import { ConsentService, ConsentType } from '../services/consent.js';
import { logger } from '../utils/logger.js';

export interface PrivacyCheckResult {
  allowed: boolean;
  reason?: string;
  requiredConsent?: ConsentType;
}

/**
 * Privacy middleware for consent enforcement
 */
export class PrivacyMiddleware {
  private consentService: ConsentService;

  constructor(consentService: ConsentService) {
    this.consentService = consentService;
  }

  /**
   * Check if memory storage is allowed for user
   */
  async checkMemoryStorageConsent(userId: string): Promise<PrivacyCheckResult> {
    const hasConsent = this.consentService.hasConsent(userId, ConsentType.MEMORY_STORAGE);

    if (!hasConsent) {
      logger.warn('🔐 Memory storage blocked: no consent', { userId });
      return {
        allowed: false,
        reason: 'User has not granted consent for memory storage',
        requiredConsent: ConsentType.MEMORY_STORAGE,
      };
    }

    return { allowed: true };
  }

  /**
   * Check if avatar data sharing is allowed
   */
  async checkAvatarSharingConsent(userId: string): Promise<PrivacyCheckResult> {
    const hasConsent = this.consentService.hasConsent(userId, ConsentType.AVATAR_DATA_SHARING);

    if (!hasConsent) {
      logger.warn('🔐 Avatar data sharing blocked: no consent', { userId });
      return {
        allowed: false,
        reason: 'User has not granted consent for avatar data sharing',
        requiredConsent: ConsentType.AVATAR_DATA_SHARING,
      };
    }

    return { allowed: true };
  }

  /**
   * Check if personalization is allowed
   */
  async checkPersonalizationConsent(userId: string): Promise<PrivacyCheckResult> {
    const hasConsent = this.consentService.hasConsent(userId, ConsentType.PERSONALIZATION);

    if (!hasConsent) {
      logger.warn('🔐 Personalization blocked: no consent', { userId });
      return {
        allowed: false,
        reason: 'User has not granted consent for personalization',
        requiredConsent: ConsentType.PERSONALIZATION,
      };
    }

    return { allowed: true };
  }

  /**
   * Check if analytics is allowed
   */
  async checkAnalyticsConsent(userId: string): Promise<PrivacyCheckResult> {
    const hasConsent = this.consentService.hasConsent(userId, ConsentType.ANALYTICS);

    if (!hasConsent) {
      logger.debug('🔐 Analytics blocked: no consent', { userId });
      return {
        allowed: false,
        reason: 'User has not granted consent for analytics',
        requiredConsent: ConsentType.ANALYTICS,
      };
    }

    return { allowed: true };
  }

  /**
   * Log privacy-sensitive action with audit trail
   */
  async logPrivacyAction(
    userId: string,
    action: string,
    resourceType: string,
    resourceId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.consentService.logAudit(userId, action, resourceType, resourceId, details);
  }

  /**
   * Check and enforce data retention policy
   */
  async enforceDataRetention(): Promise<number> {
    // This would be called periodically (e.g., daily cron job)
    const expiredCount = await this.consentService.revokeExpiredConsents();
    
    if (expiredCount > 0) {
      logger.info('🔐 Expired consents enforced', { count: expiredCount });
    }

    return expiredCount;
  }
}
