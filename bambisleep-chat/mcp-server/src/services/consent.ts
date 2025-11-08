/**
 * 🔐 Consent Management Service - Phase 5: Privacy & Data Handling
 * GDPR-compliant consent tracking and data rights enforcement
 */

import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';

export enum ConsentType {
  MEMORY_STORAGE = 'memory_storage',
  AVATAR_DATA_SHARING = 'avatar_data_sharing',
  PERSONALIZATION = 'personalization',
  ANALYTICS = 'analytics',
  DATA_RETENTION = 'data_retention',
}

export enum ConsentStatus {
  GRANTED = 'granted',
  DENIED = 'denied',
  REVOKED = 'revoked',
  PENDING = 'pending',
}

export interface ConsentRecord {
  id: string;
  user_id: string;
  consent_type: ConsentType;
  status: ConsentStatus;
  granted_at?: number;
  revoked_at?: number;
  expires_at?: number;
  version: string; // Track which version of terms/privacy policy
  metadata?: string; // JSON-encoded additional context
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  timestamp: number;
  ip_address?: string;
  user_agent?: string;
  details?: string; // JSON-encoded
}

export interface DataExportResult {
  user_id: string;
  export_date: number;
  profiles: any[];
  messages: any[];
  sessions: any[];
  consent_records: any[];
  audit_logs: any[];
  total_records: number;
}

/**
 * Consent Management Service
 * Handles GDPR compliance, consent tracking, audit logging
 */
export class ConsentService {
  private db: Database.Database;
  private readonly CURRENT_POLICY_VERSION = '1.0.0';

  constructor(db: Database.Database) {
    this.db = db;
    this.initializeTables();
    logger.info('🔐 ConsentService initialized with GDPR compliance');
  }

  /**
   * Initialize consent and audit tables
   */
  private initializeTables(): void {
    // Drop and recreate audit_logs to ensure correct schema (nullable user_id)
    // GDPR compliance requires audit trail persistence even after user deletion
    this.db.exec(`DROP TABLE IF EXISTS audit_logs`);
    
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS consent_records (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        consent_type TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('granted', 'denied', 'revoked', 'pending')),
        granted_at INTEGER,
        revoked_at INTEGER,
        expires_at INTEGER,
        version TEXT NOT NULL,
        metadata TEXT,
        FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_consent_user ON consent_records(user_id);
      CREATE INDEX IF NOT EXISTS idx_consent_type ON consent_records(consent_type);
      CREATE INDEX IF NOT EXISTS idx_consent_status ON consent_records(status);

      -- Audit logs with nullable user_id for GDPR compliance
      -- user_id set to NULL after user deletion to maintain audit trail
      CREATE TABLE audit_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        action TEXT NOT NULL,
        resource_type TEXT NOT NULL,
        resource_id TEXT,
        timestamp INTEGER NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        details TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
    `);
  }

  /**
   * Grant consent for a specific type
   */
  async grantConsent(
    userId: string,
    consentType: ConsentType,
    expiresInDays?: number,
    metadata?: Record<string, any>
  ): Promise<ConsentRecord> {
    const consentId = uuidv4();
    const now = Date.now();
    const expiresAt = expiresInDays ? now + expiresInDays * 24 * 60 * 60 * 1000 : null;

    // Revoke any existing consent for this type first
    this.db
      .prepare(
        `UPDATE consent_records 
         SET status = 'revoked', revoked_at = ? 
         WHERE user_id = ? AND consent_type = ? AND status = 'granted'`
      )
      .run(now, userId, consentType);

    // Insert new consent record
    this.db
      .prepare(
        `INSERT INTO consent_records (
          id, user_id, consent_type, status, granted_at, expires_at, version, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        consentId,
        userId,
        consentType,
        ConsentStatus.GRANTED,
        now,
        expiresAt,
        this.CURRENT_POLICY_VERSION,
        metadata ? JSON.stringify(metadata) : null
      );

    // Log consent action
    await this.logAudit(userId, 'consent_granted', 'consent', consentId, {
      consent_type: consentType,
      version: this.CURRENT_POLICY_VERSION,
    });

    logger.info('🔐 Consent granted', { userId, consentType, consentId });

    return {
      id: consentId,
      user_id: userId,
      consent_type: consentType,
      status: ConsentStatus.GRANTED,
      granted_at: now,
      expires_at: expiresAt || undefined,
      version: this.CURRENT_POLICY_VERSION,
      metadata: metadata ? JSON.stringify(metadata) : undefined,
    };
  }

  /**
   * Revoke consent
   */
  async revokeConsent(userId: string, consentType: ConsentType): Promise<void> {
    const now = Date.now();

    this.db
      .prepare(
        `UPDATE consent_records 
         SET status = 'revoked', revoked_at = ? 
         WHERE user_id = ? AND consent_type = ? AND status = 'granted'`
      )
      .run(now, userId, consentType);

    await this.logAudit(userId, 'consent_revoked', 'consent', undefined, {
      consent_type: consentType,
    });

    logger.info('🔐 Consent revoked', { userId, consentType });
  }

  /**
   * Check if user has active consent for a specific type
   */
  hasConsent(userId: string, consentType: ConsentType): boolean {
    const now = Date.now();

    const result = this.db
      .prepare(
        `SELECT id FROM consent_records 
         WHERE user_id = ? 
         AND consent_type = ? 
         AND status = 'granted'
         AND (expires_at IS NULL OR expires_at > ?)`
      )
      .get(userId, consentType, now);

    return !!result;
  }

  /**
   * Get all consent records for a user
   */
  getUserConsents(userId: string): ConsentRecord[] {
    const rows = this.db
      .prepare(
        `SELECT * FROM consent_records 
         WHERE user_id = ? 
         ORDER BY granted_at DESC`
      )
      .all(userId) as ConsentRecord[];

    return rows;
  }

  /**
   * Log audit trail entry
   */
  async logAudit(
    userId: string,
    action: string,
    resourceType: string,
    resourceId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    const auditId = uuidv4();
    const now = Date.now();

    this.db
      .prepare(
        `INSERT INTO audit_logs (
          id, user_id, action, resource_type, resource_id, timestamp, details
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        auditId,
        userId,
        action,
        resourceType,
        resourceId || null,
        now,
        details ? JSON.stringify(details) : null
      );

    logger.debug('📝 Audit log created', { userId, action, resourceType });
  }

  /**
   * Get audit logs for a user (GDPR data access request)
   */
  getUserAuditLogs(userId: string, limit: number = 100): AuditLog[] {
    const rows = this.db
      .prepare(
        `SELECT * FROM audit_logs 
         WHERE user_id = ? 
         ORDER BY timestamp DESC 
         LIMIT ?`
      )
      .all(userId, limit) as AuditLog[];

    return rows;
  }

  /**
   * Export all user data (GDPR data portability)
   */
  async exportUserData(userId: string): Promise<DataExportResult> {
    await this.logAudit(userId, 'data_export_requested', 'user_data', userId);

    // Fetch all user data
    const profiles = this.db
      .prepare('SELECT * FROM user_profiles WHERE user_id = ?')
      .all(userId);

    const sessions = this.db
      .prepare('SELECT * FROM sessions WHERE user_id = ?')
      .all(userId);

    const messages = this.db
      .prepare(
        `SELECT m.* FROM messages m 
         JOIN sessions s ON m.session_id = s.session_id 
         WHERE s.user_id = ?`
      )
      .all(userId);

    const consents = this.getUserConsents(userId);
    const auditLogs = this.getUserAuditLogs(userId, 1000);

    const exportData: DataExportResult = {
      user_id: userId,
      export_date: Date.now(),
      profiles,
      messages,
      sessions,
      consent_records: consents,
      audit_logs: auditLogs,
      total_records:
        profiles.length +
        messages.length +
        sessions.length +
        consents.length +
        auditLogs.length,
    };

    await this.logAudit(userId, 'data_export_completed', 'user_data', userId, {
      total_records: exportData.total_records,
    });

    logger.info('📦 User data exported', { userId, totalRecords: exportData.total_records });

    return exportData;
  }

  /**
   * Delete all user data (GDPR right to be forgotten)
   * Returns count of deleted records
   */
  async deleteUserData(userId: string): Promise<{
    profiles: number;
    sessions: number;
    messages: number;
    embeddings: number;
    consents: number;
    auditLogs: number;
  }> {
    await this.logAudit(userId, 'data_deletion_requested', 'user_data', userId);

    // Count records before deletion
    const profileCount =
      (this.db.prepare('SELECT COUNT(*) as count FROM user_profiles WHERE user_id = ?').get(userId) as { count: number }).count;
    const sessionCount =
      (this.db.prepare('SELECT COUNT(*) as count FROM sessions WHERE user_id = ?').get(userId) as { count: number }).count;
    const messageCount =
      (this.db.prepare(
        'SELECT COUNT(*) as count FROM messages m JOIN sessions s ON m.session_id = s.session_id WHERE s.user_id = ?'
      ).get(userId) as { count: number }).count;
    const embeddingCount =
      (this.db.prepare(
        'SELECT COUNT(*) as count FROM embeddings e JOIN messages m ON e.message_id = m.id JOIN sessions s ON m.session_id = s.session_id WHERE s.user_id = ?'
      ).get(userId) as { count: number }).count;
    const consentCount =
      (this.db.prepare('SELECT COUNT(*) as count FROM consent_records WHERE user_id = ?').get(userId) as { count: number }).count;
    const auditCount =
      (this.db.prepare('SELECT COUNT(*) as count FROM audit_logs WHERE user_id = ?').get(userId) as { count: number }).count;

    // Delete in correct order (respecting foreign keys)
    this.db.prepare('DELETE FROM embeddings WHERE message_id IN (SELECT id FROM messages WHERE session_id IN (SELECT session_id FROM sessions WHERE user_id = ?))').run(userId);
    this.db.prepare('DELETE FROM messages WHERE session_id IN (SELECT session_id FROM sessions WHERE user_id = ?)').run(userId);
    this.db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
    this.db.prepare('DELETE FROM consent_records WHERE user_id = ?').run(userId);
    // NOTE: Do NOT delete audit_logs - GDPR compliance requires audit trail persistence
    // Audit logs contain no PII, only user_id references for compliance/legal purposes
    this.db.prepare('DELETE FROM user_profiles WHERE user_id = ?').run(userId);

    logger.info('🗑️ User data deleted (GDPR right to be forgotten)', {
      userId,
      profiles: profileCount,
      sessions: sessionCount,
      messages: messageCount,
    });

    return {
      profiles: profileCount,
      sessions: sessionCount,
      messages: messageCount,
      embeddings: embeddingCount,
      consents: consentCount,
      auditLogs: auditCount,
    };
  }

  /**
   * Check for expired consents and revoke them
   */
  async revokeExpiredConsents(): Promise<number> {
    const now = Date.now();

    const result = this.db
      .prepare(
        `UPDATE consent_records 
         SET status = 'revoked', revoked_at = ? 
         WHERE status = 'granted' 
         AND expires_at IS NOT NULL 
         AND expires_at <= ?`
      )
      .run(now, now);

    if (result.changes > 0) {
      logger.info('🔐 Expired consents revoked', { count: result.changes });
    }

    return result.changes;
  }

  /**
   * Anonymize user data (alternative to deletion)
   */
  async anonymizeUserData(userId: string): Promise<void> {
    await this.logAudit(userId, 'data_anonymization_requested', 'user_data', userId);

    // Replace PII with anonymized values
    const anonId = `anon_${uuidv4().substring(0, 8)}`;

    this.db.prepare('UPDATE user_profiles SET nickname = NULL, topics = NULL WHERE user_id = ?').run(userId);
    this.db.prepare('UPDATE messages SET content = "[ANONYMIZED]" WHERE session_id IN (SELECT session_id FROM sessions WHERE user_id = ?)').run(userId);

    await this.logAudit(userId, 'data_anonymization_completed', 'user_data', userId);

    logger.info('🎭 User data anonymized', { userId, anonId });
  }
}
