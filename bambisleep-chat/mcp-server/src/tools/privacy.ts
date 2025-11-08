/**
 * 🔐 Privacy Tools - MCP Tool Definitions (Phase 5: GDPR Compliance)
 * Handles user data rights: consent management, data export, deletion
 */

import { z } from 'zod';
import { ConsentService, ConsentType, ConsentStatus } from '../services/consent.js';
import { memoryService } from './memory.js';
import { logger } from '../utils/logger.js';

// Initialize consent service
const consentService = new ConsentService(memoryService['db']);

interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  execute: (args: any) => Promise<any>;
}

const GrantConsentSchema = z.object({
  userId: z.string().describe('User identifier'),
  consentType: z
    .enum(['memory_storage', 'avatar_data_sharing', 'personalization', 'analytics', 'data_retention'])
    .describe('Type of consent to grant'),
  expiresInDays: z.number().optional().describe('Optional expiration in days'),
});

const RevokeConsentSchema = z.object({
  userId: z.string().describe('User identifier'),
  consentType: z
    .enum(['memory_storage', 'avatar_data_sharing', 'personalization', 'analytics', 'data_retention'])
    .describe('Type of consent to revoke'),
});

const CheckConsentSchema = z.object({
  userId: z.string().describe('User identifier'),
  consentType: z
    .enum(['memory_storage', 'avatar_data_sharing', 'personalization', 'analytics', 'data_retention'])
    .describe('Type of consent to check'),
});

const ViewConsentsSchema = z.object({
  userId: z.string().describe('User identifier'),
});

const ExportUserDataSchema = z.object({
  userId: z.string().describe('User identifier for data export (GDPR data portability)'),
});

const DeleteUserDataSchema = z.object({
  userId: z.string().describe('User identifier for data deletion (GDPR right to be forgotten)'),
  confirmDeletion: z
    .boolean()
    .describe('Must be true to confirm permanent deletion'),
});

const ViewAuditLogsSchema = z.object({
  userId: z.string().describe('User identifier'),
  limit: z.number().default(50).describe('Maximum number of audit log entries to return'),
});

/**
 * Grant consent tool
 */
async function executeGrantConsent(args: z.infer<typeof GrantConsentSchema>): Promise<string> {
  const { userId, consentType, expiresInDays } = args;

  const consent = await consentService.grantConsent(
    userId,
    consentType as ConsentType,
    expiresInDays
  );

  logger.info('🔐 Consent granted via MCP tool', { userId, consentType });

  return `✅ Consent granted for ${consentType}. ${
    expiresInDays ? `Expires in ${expiresInDays} days.` : 'No expiration.'
  } Consent ID: ${consent.id}`;
}

/**
 * Revoke consent tool
 */
async function executeRevokeConsent(args: z.infer<typeof RevokeConsentSchema>): Promise<string> {
  const { userId, consentType } = args;

  await consentService.revokeConsent(userId, consentType as ConsentType);

  logger.info('🔐 Consent revoked via MCP tool', { userId, consentType });

  return `✅ Consent revoked for ${consentType}. Data collection for this purpose has been stopped.`;
}

/**
 * Check consent status tool
 */
async function executeCheckConsent(args: z.infer<typeof CheckConsentSchema>): Promise<string> {
  const { userId, consentType } = args;

  const hasConsent = consentService.hasConsent(userId, consentType as ConsentType);

  return hasConsent
    ? `✅ User has active consent for ${consentType}`
    : `❌ User does not have active consent for ${consentType}`;
}

/**
 * View all consents tool
 */
async function executeViewConsents(args: z.infer<typeof ViewConsentsSchema>): Promise<string> {
  const { userId } = args;

  const consents = consentService.getUserConsents(userId);

  if (consents.length === 0) {
    return `No consent records found for user ${userId}.`;
  }

  const consentList = consents
    .map((c) => {
      const status = c.status === ConsentStatus.GRANTED ? '✅' : '❌';
      const expiry = c.expires_at
        ? ` (expires ${new Date(c.expires_at).toISOString()})`
        : ' (no expiration)';
      return `${status} ${c.consent_type}: ${c.status}${c.status === ConsentStatus.GRANTED ? expiry : ''}`;
    })
    .join('\n');

  return `Consent records for user ${userId}:\n\n${consentList}`;
}

/**
 * Export user data tool (GDPR data portability)
 */
async function executeExportUserData(args: z.infer<typeof ExportUserDataSchema>): Promise<string> {
  const { userId } = args;

  const exportData = await consentService.exportUserData(userId);

  logger.info('📦 User data exported via MCP tool', {
    userId,
    totalRecords: exportData.total_records,
  });

  // Return summary (actual data export would be via secure download link in production)
  return `📦 Data export completed for user ${userId}

Export Date: ${new Date(exportData.export_date).toISOString()}
Total Records: ${exportData.total_records}

Breakdown:
- User Profiles: ${exportData.profiles.length}
- Messages: ${exportData.messages.length}
- Sessions: ${exportData.sessions.length}
- Consent Records: ${exportData.consent_records.length}
- Audit Logs: ${exportData.audit_logs.length}

Note: In production, this data would be provided as a secure download link.
For testing, the data is available in the service response.`;
}

/**
 * Delete user data tool (GDPR right to be forgotten)
 */
async function executeDeleteUserData(args: z.infer<typeof DeleteUserDataSchema>): Promise<string> {
  const { userId, confirmDeletion } = args;

  if (!confirmDeletion) {
    return `⚠️ Deletion not confirmed. To permanently delete all data for user ${userId}, set confirmDeletion to true. This action cannot be undone.`;
  }

  const result = await consentService.deleteUserData(userId);

  logger.warn('🗑️ User data deleted via MCP tool (GDPR)', { userId, ...result });

  return `🗑️ All data permanently deleted for user ${userId}

Deleted Records:
- User Profiles: ${result.profiles}
- Sessions: ${result.sessions}
- Messages: ${result.messages}
- Embeddings: ${result.embeddings}
- Consent Records: ${result.consents}
- Audit Logs: ${result.auditLogs}

Total: ${result.profiles + result.sessions + result.messages + result.embeddings + result.consents + result.auditLogs} records deleted.

This action has been logged for compliance purposes.`;
}

/**
 * View audit logs tool
 */
async function executeViewAuditLogs(args: z.infer<typeof ViewAuditLogsSchema>): Promise<string> {
  const { userId, limit } = args;

  const auditLogs = consentService.getUserAuditLogs(userId, limit);

  if (auditLogs.length === 0) {
    return `No audit logs found for user ${userId}.`;
  }

  const logList = auditLogs
    .map((log) => {
      const timestamp = new Date(log.timestamp).toISOString();
      const details = log.details ? ` - ${log.details}` : '';
      return `[${timestamp}] ${log.action} on ${log.resource_type}${log.resource_id ? ` (${log.resource_id})` : ''}${details}`;
    })
    .join('\n');

  return `📝 Audit logs for user ${userId} (last ${auditLogs.length} entries):\n\n${logList}`;
}

/**
 * Export privacy tools for MCP server
 */
export const privacyTools: MCPTool[] = [
  {
    name: 'privacy_grant_consent',
    description:
      'Grant user consent for a specific data processing purpose (GDPR compliance)',
    inputSchema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'User identifier' },
        consentType: {
          type: 'string',
          enum: [
            'memory_storage',
            'avatar_data_sharing',
            'personalization',
            'analytics',
            'data_retention',
          ],
          description: 'Type of consent to grant',
        },
        expiresInDays: {
          type: 'number',
          description: 'Optional expiration in days',
        },
      },
      required: ['userId', 'consentType'],
    },
    execute: executeGrantConsent,
  },
  {
    name: 'privacy_revoke_consent',
    description: 'Revoke user consent for a specific data processing purpose',
    inputSchema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'User identifier' },
        consentType: {
          type: 'string',
          enum: [
            'memory_storage',
            'avatar_data_sharing',
            'personalization',
            'analytics',
            'data_retention',
          ],
          description: 'Type of consent to revoke',
        },
      },
      required: ['userId', 'consentType'],
    },
    execute: executeRevokeConsent,
  },
  {
    name: 'privacy_check_consent',
    description: 'Check if user has active consent for a specific purpose',
    inputSchema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'User identifier' },
        consentType: {
          type: 'string',
          enum: [
            'memory_storage',
            'avatar_data_sharing',
            'personalization',
            'analytics',
            'data_retention',
          ],
          description: 'Type of consent to check',
        },
      },
      required: ['userId', 'consentType'],
    },
    execute: executeCheckConsent,
  },
  {
    name: 'privacy_view_consents',
    description: 'View all consent records for a user',
    inputSchema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'User identifier' },
      },
      required: ['userId'],
    },
    execute: executeViewConsents,
  },
  {
    name: 'privacy_export_data',
    description:
      'Export all user data in machine-readable format (GDPR data portability right)',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User identifier for data export',
        },
      },
      required: ['userId'],
    },
    execute: executeExportUserData,
  },
  {
    name: 'privacy_delete_data',
    description:
      'Permanently delete all user data (GDPR right to be forgotten). This action cannot be undone.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User identifier for data deletion',
        },
        confirmDeletion: {
          type: 'boolean',
          description: 'Must be true to confirm permanent deletion',
        },
      },
      required: ['userId', 'confirmDeletion'],
    },
    execute: executeDeleteUserData,
  },
  {
    name: 'privacy_view_audit_logs',
    description: 'View audit logs for a user (privacy-sensitive actions)',
    inputSchema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'User identifier' },
        limit: {
          type: 'number',
          description: 'Maximum number of log entries (default 50)',
          default: 50,
        },
      },
      required: ['userId'],
    },
    execute: executeViewAuditLogs,
  },
];
