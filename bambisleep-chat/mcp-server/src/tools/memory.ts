/**
 * 💎 Memory Tools - Conversation Memory & Personalization (Phase 4)
 * MCP tools for storing and retrieving conversation context with SQLite persistence
 */

import { z } from 'zod';
import { MemoryService } from '../services/memory.js';
import { logger } from '../utils/logger.js';

interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  execute: (args: any) => Promise<any>;
}

// Initialize memory service with SQLite persistence
const memoryService = new MemoryService();

// Schemas
const StoreMemorySchema = z.object({
  userId: z.string(),
  key: z.string(),
  value: z.any(),
});

const RetrieveMemorySchema = z.object({
  userId: z.string(),
  key: z.string(),
});

const RecallConversationSchema = z.object({
  userId: z.string(),
  sessionId: z.string().optional(),
  limit: z.number().default(20).describe('Number of recent messages to retrieve'),
});

const ForgetConversationSchema = z.object({
  sessionId: z.string(),
});

const DeleteUserDataSchema = z.object({
  userId: z.string(),
});

const UpdateProfileSchema = z.object({
  userId: z.string(),
  nickname: z.string().optional(),
  conversationStyle: z.enum(['playful', 'supportive', 'balanced']).optional(),
  topics: z.array(z.string()).optional(),
  memoryEnabled: z.boolean().optional(),
  dataRetentionDays: z.number().optional(),
});

/**
 * Store memory/preference for a user (legacy compatibility)
 */
async function executeStoreMemory(args: z.infer<typeof StoreMemorySchema>): Promise<string> {
  const { userId, key, value } = args;

  // Update user profile with the key-value pair
  const profile = await memoryService.createOrUpdateUser(userId, {
    [key]: value,
  } as any);

  logger.info('💎 Memory stored', { userId, key });
  return `Memory stored: ${key} = ${JSON.stringify(value)}`;
}

/**
 * Retrieve memory/preference for a user (legacy compatibility)
 */
async function executeRetrieveMemory(args: z.infer<typeof RetrieveMemorySchema>): Promise<any> {
  const { userId, key } = args;
  
  const profile = memoryService.getUserProfile(userId);
  
  if (!profile) {
    return null;
  }

  // Map profile fields to keys
  const fieldMap: Record<string, any> = {
    nickname: profile.nickname,
    conversation_style: profile.conversation_style,
    topics: profile.topics,
    memory_enabled: profile.memory_enabled,
    data_retention_days: profile.data_retention_days,
  };

  return fieldMap[key] || null;
}

/**
 * Recall conversation history
 */
async function executeRecallConversation(args: z.infer<typeof RecallConversationSchema>): Promise<any> {
  const { userId, sessionId, limit } = args;

  let messages;
  
  if (sessionId) {
    // Get specific session history
    messages = memoryService.getConversationHistory(sessionId, limit);
  } else {
    // Get recent messages across all sessions
    messages = memoryService.getRecentMessagesByUser(userId, limit);
  }

  const profile = memoryService.getUserProfile(userId);

  logger.info('🔮 Conversation recalled', { userId, sessionId, messageCount: messages.length });

  return {
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
      timestamp: new Date(m.timestamp).toISOString(),
      emotion: m.emotion,
    })),
    profile: profile ? {
      nickname: profile.nickname,
      conversationStyle: profile.conversation_style,
      topics: profile.topics,
    } : null,
  };
}

/**
 * Forget a specific conversation (delete session)
 */
async function executeForgetConversation(args: z.infer<typeof ForgetConversationSchema>): Promise<string> {
  const { sessionId } = args;
  
  memoryService.endSession(sessionId);
  
  // Note: This doesn't delete messages, just ends the session
  // For full deletion, use delete_user_data
  
  logger.info('🌸 Conversation forgotten', { sessionId });
  return `Session ${sessionId} has been ended. Messages remain for data retention period.`;
}

/**
 * Delete all user data (GDPR compliance)
 */
async function executeDeleteUserData(args: z.infer<typeof DeleteUserDataSchema>): Promise<string> {
  const { userId } = args;
  
  const result = memoryService.deleteUserData(userId);
  
  logger.info('🔐 User data deleted (GDPR)', { userId, ...result });
  
  return `All data for user ${userId} has been permanently deleted: ${result.messagesDeleted} messages, ${result.sessionsDeleted} sessions.`;
}

/**
 * Update user profile and preferences
 */
async function executeUpdateProfile(args: z.infer<typeof UpdateProfileSchema>): Promise<any> {
  const { userId, nickname, conversationStyle, topics, memoryEnabled, dataRetentionDays } = args;

  const profile = await memoryService.createOrUpdateUser(userId, {
    nickname,
    conversation_style: conversationStyle,
    topics: topics ? JSON.stringify(topics) : undefined,
    memory_enabled: memoryEnabled,
    data_retention_days: dataRetentionDays,
  } as any);

  logger.info('💜 Profile updated', { userId, nickname });

  return {
    userId: profile.user_id,
    nickname: profile.nickname,
    conversationStyle: profile.conversation_style,
    topics: profile.topics,
    memoryEnabled: profile.memory_enabled,
    dataRetentionDays: profile.data_retention_days,
  };
}

export const memoryTools: MCPTool[] = [
  {
    name: 'memory_store',
    description: '[Legacy] Store a preference for a user. Consider using memory_update_profile instead.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User identifier',
        },
        key: {
          type: 'string',
          description: 'Memory key (e.g., "nickname", "conversation_style")',
        },
        value: {
          description: 'Value to store (any JSON-serializable data)',
        },
      },
      required: ['userId', 'key', 'value'],
    },
    execute: executeStoreMemory,
  },
  {
    name: 'memory_retrieve',
    description: '[Legacy] Retrieve a stored preference for a user. Consider using memory_recall instead.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User identifier',
        },
        key: {
          type: 'string',
          description: 'Memory key to retrieve',
        },
      },
      required: ['userId', 'key'],
    },
    execute: executeRetrieveMemory,
  },
  {
    name: 'memory_recall',
    description: 'Recall conversation history and user context. Returns recent messages and user profile.',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User identifier',
        },
        sessionId: {
          type: 'string',
          description: 'Optional: specific session ID to recall',
        },
        limit: {
          type: 'number',
          description: 'Number of recent messages to retrieve (default: 20)',
          default: 20,
        },
      },
      required: ['userId'],
    },
    execute: executeRecallConversation,
  },
  {
    name: 'memory_forget',
    description: 'End a conversation session. Messages remain until data retention period expires.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: {
          type: 'string',
          description: 'Session ID to end',
        },
      },
      required: ['sessionId'],
    },
    execute: executeForgetConversation,
  },
  {
    name: 'memory_delete_user',
    description: 'Permanently delete all data for a user (GDPR right to be forgotten).',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User identifier whose data should be deleted',
        },
      },
      required: ['userId'],
    },
    execute: executeDeleteUserData,
  },
  {
    name: 'memory_update_profile',
    description: 'Update user profile and preferences (nickname, conversation style, topics, etc.).',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User identifier',
        },
        nickname: {
          type: 'string',
          description: 'User nickname that Bambi should use',
        },
        conversationStyle: {
          type: 'string',
          enum: ['playful', 'supportive', 'balanced'],
          description: 'Preferred conversation style',
        },
        topics: {
          type: 'array',
          items: { type: 'string' },
          description: 'Topics user is interested in',
        },
        memoryEnabled: {
          type: 'boolean',
          description: 'Whether to enable conversation memory',
        },
        dataRetentionDays: {
          type: 'number',
          description: 'Number of days to retain conversation data',
        },
      },
      required: ['userId'],
    },
    execute: executeUpdateProfile,
  },
];

// Export memory service for use in other modules
export { memoryService };
