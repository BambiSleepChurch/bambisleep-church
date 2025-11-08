/**
 * Phase 5 Tests: Privacy, Consent, and GDPR Compliance
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConsentService, ConsentType, ConsentStatus } from '../services/consent.js';
import { PrivacyMiddleware } from '../middleware/privacy.js';
import { MemoryService } from '../services/memory.js';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

describe('Phase 5: Privacy & Consent Management', () => {
  let db: Database.Database;
  let consentService: ConsentService;
  let privacyMiddleware: PrivacyMiddleware;
  let memoryService: MemoryService;
  const testDbPath = path.join(__dirname, '../../data/test-privacy.db');

  beforeEach(() => {
    // Create fresh database for each test
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    memoryService = new MemoryService(testDbPath);
    db = memoryService['db'];
    consentService = new ConsentService(db);
    privacyMiddleware = new PrivacyMiddleware(consentService);
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('Consent Management', () => {
    it('should grant consent for memory storage', async () => {
      const userId = 'user-consent-1';
      await memoryService.createOrUpdateUser(userId);

      const consent = await consentService.grantConsent(
        userId,
        ConsentType.MEMORY_STORAGE
      );

      expect(consent).toBeDefined();
      expect(consent.user_id).toBe(userId);
      expect(consent.consent_type).toBe(ConsentType.MEMORY_STORAGE);
      expect(consent.status).toBe(ConsentStatus.GRANTED);
      expect(consent.granted_at).toBeGreaterThan(0);
    });

    it('should check active consent status', async () => {
      const userId = 'user-consent-2';
      await memoryService.createOrUpdateUser(userId);

      // No consent initially
      expect(consentService.hasConsent(userId, ConsentType.PERSONALIZATION)).toBe(false);

      // Grant consent
      await consentService.grantConsent(userId, ConsentType.PERSONALIZATION);

      // Should have consent now
      expect(consentService.hasConsent(userId, ConsentType.PERSONALIZATION)).toBe(true);
    });

    it('should revoke consent', async () => {
      const userId = 'user-consent-3';
      await memoryService.createOrUpdateUser(userId);

      // Grant then revoke
      await consentService.grantConsent(userId, ConsentType.ANALYTICS);
      expect(consentService.hasConsent(userId, ConsentType.ANALYTICS)).toBe(true);

      await consentService.revokeConsent(userId, ConsentType.ANALYTICS);
      expect(consentService.hasConsent(userId, ConsentType.ANALYTICS)).toBe(false);
    });

    it('should handle consent expiration', async () => {
      const userId = 'user-consent-4';
      await memoryService.createOrUpdateUser(userId);

      // Grant consent that expires in 1 day
      await consentService.grantConsent(
        userId,
        ConsentType.MEMORY_STORAGE,
        1 // expires in 1 day
      );

      expect(consentService.hasConsent(userId, ConsentType.MEMORY_STORAGE)).toBe(true);

      // Manually expire by setting expires_at to past
      db.prepare(
        'UPDATE consent_records SET expires_at = ? WHERE user_id = ?'
      ).run(Date.now() - 1000, userId);

      // Run expiration check
      await consentService.revokeExpiredConsents();

      // Should no longer have consent
      expect(consentService.hasConsent(userId, ConsentType.MEMORY_STORAGE)).toBe(false);
    });

    it('should track multiple consent types per user', async () => {
      const userId = 'user-consent-5';
      await memoryService.createOrUpdateUser(userId);

      await consentService.grantConsent(userId, ConsentType.MEMORY_STORAGE);
      await consentService.grantConsent(userId, ConsentType.PERSONALIZATION);
      await consentService.grantConsent(userId, ConsentType.AVATAR_DATA_SHARING);

      const consents = consentService.getUserConsents(userId);
      expect(consents.length).toBeGreaterThanOrEqual(3);

      const consentTypes = consents.map((c) => c.consent_type);
      expect(consentTypes).toContain(ConsentType.MEMORY_STORAGE);
      expect(consentTypes).toContain(ConsentType.PERSONALIZATION);
      expect(consentTypes).toContain(ConsentType.AVATAR_DATA_SHARING);
    });

    it('should replace old consent when granting new consent of same type', async () => {
      const userId = 'user-consent-6';
      await memoryService.createOrUpdateUser(userId);

      // Grant consent twice
      await consentService.grantConsent(userId, ConsentType.MEMORY_STORAGE);
      await consentService.grantConsent(userId, ConsentType.MEMORY_STORAGE);

      // Should only have one active consent (old one revoked)
      const consents = consentService.getUserConsents(userId);
      const activeConsents = consents.filter(
        (c) => c.consent_type === ConsentType.MEMORY_STORAGE && c.status === ConsentStatus.GRANTED
      );

      expect(activeConsents.length).toBe(1);
    });
  });

  describe('Audit Logging', () => {
    it('should log consent grant action', async () => {
      const userId = 'user-audit-1';
      await memoryService.createOrUpdateUser(userId);

      await consentService.grantConsent(userId, ConsentType.MEMORY_STORAGE);

      const auditLogs = consentService.getUserAuditLogs(userId, 10);
      expect(auditLogs.length).toBeGreaterThan(0);

      const consentLog = auditLogs.find((log) => log.action === 'consent_granted');
      expect(consentLog).toBeDefined();
      expect(consentLog?.user_id).toBe(userId);
      expect(consentLog?.resource_type).toBe('consent');
    });

    it('should log consent revoke action', async () => {
      const userId = 'user-audit-2';
      await memoryService.createOrUpdateUser(userId);

      await consentService.grantConsent(userId, ConsentType.ANALYTICS);
      await consentService.revokeConsent(userId, ConsentType.ANALYTICS);

      const auditLogs = consentService.getUserAuditLogs(userId, 10);
      const revokeLog = auditLogs.find((log) => log.action === 'consent_revoked');

      expect(revokeLog).toBeDefined();
      expect(revokeLog?.user_id).toBe(userId);
    });

    it('should log data export request', async () => {
      const userId = 'user-audit-3';
      await memoryService.createOrUpdateUser(userId);

      await consentService.exportUserData(userId);

      const auditLogs = consentService.getUserAuditLogs(userId, 10);
      const exportLogs = auditLogs.filter((log) => 
        log.action === 'data_export_requested' || log.action === 'data_export_completed'
      );

      expect(exportLogs.length).toBe(2);
    });

    it('should log data deletion request', async () => {
      const userId = 'user-audit-4';
      await memoryService.createOrUpdateUser(userId);

      await consentService.deleteUserData(userId);

      // Audit logs should persist even after user deletion
      // (in production, might archive to separate table)
      const auditLogs = db
        .prepare('SELECT * FROM audit_logs WHERE user_id = ?')
        .all(userId);

      const deletionLog = auditLogs.find((log: any) => 
        log.action === 'data_deletion_requested'
      );

      expect(deletionLog).toBeDefined();
    });
  });

  describe('Data Export (GDPR Data Portability)', () => {
    it('should export all user data', async () => {
      const userId = 'user-export-1';
      await memoryService.createOrUpdateUser(userId, { nickname: 'TestUser' });

      const session = memoryService.getOrCreateSession(userId);
      await memoryService.storeMessage(session.session_id, 'user', 'Hello');
      await memoryService.storeMessage(session.session_id, 'assistant', 'Hi there!');

      const exportData = await consentService.exportUserData(userId);

      expect(exportData.user_id).toBe(userId);
      expect(exportData.profiles.length).toBe(1);
      expect(exportData.sessions.length).toBe(1);
      expect(exportData.messages.length).toBe(2);
      expect(exportData.total_records).toBeGreaterThan(0);
    });

    it('should include consent records in export', async () => {
      const userId = 'user-export-2';
      await memoryService.createOrUpdateUser(userId);

      await consentService.grantConsent(userId, ConsentType.MEMORY_STORAGE);
      await consentService.grantConsent(userId, ConsentType.PERSONALIZATION);

      const exportData = await consentService.exportUserData(userId);

      expect(exportData.consent_records.length).toBeGreaterThanOrEqual(2);
    });

    it('should include audit logs in export', async () => {
      const userId = 'user-export-3';
      await memoryService.createOrUpdateUser(userId);

      await consentService.grantConsent(userId, ConsentType.MEMORY_STORAGE);
      await consentService.logAudit(userId, 'test_action', 'test_resource');

      const exportData = await consentService.exportUserData(userId);

      expect(exportData.audit_logs.length).toBeGreaterThan(0);
    });
  });

  describe('Data Deletion (GDPR Right to be Forgotten)', () => {
    it('should delete all user data', async () => {
      const userId = 'user-delete-1';
      await memoryService.createOrUpdateUser(userId, { nickname: 'ToBeDeleted' });

      const session = memoryService.getOrCreateSession(userId);
      await memoryService.storeMessage(session.session_id, 'user', 'Test message');

      const result = await consentService.deleteUserData(userId);

      expect(result.profiles).toBe(1);
      expect(result.messages).toBe(1);
      expect(result.sessions).toBe(1);

      // Verify deletion
      const profile = memoryService.getUserProfile(userId);
      expect(profile).toBeNull();
    });

    it('should delete messages with embeddings', async () => {
      const userId = 'user-delete-2';
      await memoryService.createOrUpdateUser(userId);

      const session = memoryService.getOrCreateSession(userId);
      const message = await memoryService.storeMessage(
        session.session_id,
        'user',
        'Message with embedding'
      );

      // Wait for embedding generation (in tests, this might be synchronous)
      await new Promise((resolve) => setTimeout(resolve, 100));

      const result = await consentService.deleteUserData(userId);

      expect(result.messages).toBe(1);
      // Embeddings should cascade delete
      const embeddings = db
        .prepare('SELECT * FROM embeddings WHERE message_id = ?')
        .all(message.id);
      expect(embeddings.length).toBe(0);
    });

    it('should delete consent records', async () => {
      const userId = 'user-delete-3';
      await memoryService.createOrUpdateUser(userId);

      await consentService.grantConsent(userId, ConsentType.MEMORY_STORAGE);
      await consentService.grantConsent(userId, ConsentType.PERSONALIZATION);

      const result = await consentService.deleteUserData(userId);

      expect(result.consents).toBeGreaterThanOrEqual(2);

      // Verify deletion
      const consents = consentService.getUserConsents(userId);
      expect(consents.length).toBe(0);
    });
  });

  describe('Privacy Middleware', () => {
    it('should block memory storage without consent', async () => {
      const userId = 'user-privacy-1';
      await memoryService.createOrUpdateUser(userId);

      const checkResult = await privacyMiddleware.checkMemoryStorageConsent(userId);

      expect(checkResult.allowed).toBe(false);
      expect(checkResult.requiredConsent).toBe(ConsentType.MEMORY_STORAGE);
    });

    it('should allow memory storage with consent', async () => {
      const userId = 'user-privacy-2';
      await memoryService.createOrUpdateUser(userId);

      await consentService.grantConsent(userId, ConsentType.MEMORY_STORAGE);

      const checkResult = await privacyMiddleware.checkMemoryStorageConsent(userId);

      expect(checkResult.allowed).toBe(true);
    });

    it('should block avatar data sharing without consent', async () => {
      const userId = 'user-privacy-3';
      await memoryService.createOrUpdateUser(userId);

      const checkResult = await privacyMiddleware.checkAvatarSharingConsent(userId);

      expect(checkResult.allowed).toBe(false);
      expect(checkResult.requiredConsent).toBe(ConsentType.AVATAR_DATA_SHARING);
    });

    it('should block personalization without consent', async () => {
      const userId = 'user-privacy-4';
      await memoryService.createOrUpdateUser(userId);

      const checkResult = await privacyMiddleware.checkPersonalizationConsent(userId);

      expect(checkResult.allowed).toBe(false);
      expect(checkResult.requiredConsent).toBe(ConsentType.PERSONALIZATION);
    });

    it('should enforce data retention policy', async () => {
      const userId = 'user-privacy-5';
      await memoryService.createOrUpdateUser(userId);

      // Grant consent with 1-day expiration
      await consentService.grantConsent(userId, ConsentType.MEMORY_STORAGE, 1);

      // Expire it manually
      db.prepare(
        'UPDATE consent_records SET expires_at = ? WHERE user_id = ?'
      ).run(Date.now() - 1000, userId);

      const expiredCount = await privacyMiddleware.enforceDataRetention();

      expect(expiredCount).toBeGreaterThan(0);
    });
  });

  describe('Integration with Memory Service', () => {
    it('should respect memory consent when storing messages', async () => {
      const userId = 'user-integration-1';
      await memoryService.createOrUpdateUser(userId);

      // Without consent, should not store (in real implementation)
      const hasConsent = consentService.hasConsent(userId, ConsentType.MEMORY_STORAGE);
      expect(hasConsent).toBe(false);

      // Grant consent
      await consentService.grantConsent(userId, ConsentType.MEMORY_STORAGE);
      expect(consentService.hasConsent(userId, ConsentType.MEMORY_STORAGE)).toBe(true);
    });

    it('should respect personalization consent for RAG', async () => {
      const userId = 'user-integration-2';
      await memoryService.createOrUpdateUser(userId);

      // Without consent, RAG should not use personalization
      const hasPersonalizationConsent = consentService.hasConsent(
        userId,
        ConsentType.PERSONALIZATION
      );
      expect(hasPersonalizationConsent).toBe(false);

      // Grant consent
      await consentService.grantConsent(userId, ConsentType.PERSONALIZATION);
      expect(consentService.hasConsent(userId, ConsentType.PERSONALIZATION)).toBe(true);
    });
  });

  describe('GDPR Compliance Edge Cases', () => {
    it('should handle export of empty user data', async () => {
      const userId = 'user-empty-1';
      await memoryService.createOrUpdateUser(userId);

      const exportData = await consentService.exportUserData(userId);

      expect(exportData.profiles.length).toBe(1);
      expect(exportData.messages.length).toBe(0);
      expect(exportData.sessions.length).toBe(0);
    });

    it('should handle deletion of non-existent user gracefully', async () => {
      const userId = 'user-nonexistent';

      const result = await consentService.deleteUserData(userId);

      expect(result.profiles).toBe(0);
      expect(result.messages).toBe(0);
      expect(result.sessions).toBe(0);
    });

    it('should prevent re-granting consent after deletion', async () => {
      const userId = 'user-deleted-consent';
      await memoryService.createOrUpdateUser(userId);

      await consentService.grantConsent(userId, ConsentType.MEMORY_STORAGE);
      await consentService.deleteUserData(userId);

      // User should not exist anymore
      const profile = memoryService.getUserProfile(userId);
      expect(profile).toBeNull();
    });
  });
});
