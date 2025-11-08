/**
 * 💎 Memory Service - Conversation Storage & Retrieval
 * Phase 4: Memory and Personalization
 */

import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { 
  initializeDatabase, 
  type ConversationMessage, 
  type UserProfile, 
  type SessionContext,
  cleanupOldMessages 
} from '../database/schema.js';
import { logger } from '../utils/logger.js';
import { embeddingsService, EmbeddingsService } from './embeddings.js';

export class MemoryService {
  private db: Database.Database;

  constructor(dbPath?: string) {
    this.db = initializeDatabase(dbPath);
    logger.info('💎 MemoryService initialized with SQLite persistence');
  }

  /**
   * Create or update user profile
   */
  async createOrUpdateUser(
    userId: string,
    profile?: Partial<Omit<UserProfile, 'user_id' | 'created_at' | 'last_active'>>
  ): Promise<UserProfile> {
    const now = Date.now();
    
    const existing = this.db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(userId) as UserProfile | undefined;

    if (existing) {
      // Update existing profile
      const updates: string[] = [];
      const values: any[] = [];

      if (profile?.nickname !== undefined) {
        updates.push('nickname = ?');
        values.push(profile.nickname);
      }
      if (profile?.conversation_style !== undefined) {
        updates.push('conversation_style = ?');
        values.push(profile.conversation_style);
      }
      if (profile?.topics !== undefined) {
        updates.push('topics = ?');
        values.push(JSON.stringify(profile.topics));
      }
      if (profile?.memory_enabled !== undefined) {
        updates.push('memory_enabled = ?');
        values.push(profile.memory_enabled ? 1 : 0);
      }
      if (profile?.data_retention_days !== undefined) {
        updates.push('data_retention_days = ?');
        values.push(profile.data_retention_days);
      }
      if (profile?.share_with_avatar !== undefined) {
        updates.push('share_with_avatar = ?');
        values.push(profile.share_with_avatar ? 1 : 0);
      }

      updates.push('last_active = ?');
      values.push(now);
      values.push(userId);

      if (updates.length > 0) {
        const stmt = this.db.prepare(`
          UPDATE user_profiles 
          SET ${updates.join(', ')}
          WHERE user_id = ?
        `);
        stmt.run(...values);
      }

      return this.getUserProfile(userId)!;
    } else {
      // Create new profile
      const stmt = this.db.prepare(`
        INSERT INTO user_profiles (
          user_id, nickname, conversation_style, topics, 
          memory_enabled, data_retention_days, share_with_avatar,
          created_at, last_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        userId,
        profile?.nickname || null,
        profile?.conversation_style || 'balanced',
        profile?.topics ? JSON.stringify(profile.topics) : null,
        profile?.memory_enabled !== false ? 1 : 0,
        profile?.data_retention_days || 30,
        profile?.share_with_avatar !== false ? 1 : 0,
        now,
        now
      );

      return this.getUserProfile(userId)!;
    }
  }

  /**
   * Get user profile
   */
  getUserProfile(userId: string): UserProfile | null {
    const row = this.db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(userId) as any;
    
    if (!row) return null;

    return {
      user_id: row.user_id,
      nickname: row.nickname,
      conversation_style: row.conversation_style,
      topics: row.topics ? JSON.parse(row.topics) : undefined,
      memory_enabled: row.memory_enabled === 1,
      data_retention_days: row.data_retention_days,
      share_with_avatar: row.share_with_avatar === 1,
      created_at: row.created_at,
      last_active: row.last_active,
    };
  }

  /**
   * Create new session
   */
  createSession(userId: string): SessionContext {
    const sessionId = uuidv4();
    const now = Date.now();

    const stmt = this.db.prepare(`
      INSERT INTO sessions (session_id, user_id, start_time, last_activity, message_count, status)
      VALUES (?, ?, ?, ?, 0, 'active')
    `);

    stmt.run(sessionId, userId, now, now);

    logger.info('🌸 New session created', { sessionId, userId });

    return {
      session_id: sessionId,
      user_id: userId,
      start_time: now,
      last_activity: now,
      message_count: 0,
      status: 'active',
    };
  }

  /**
   * Get active session for user or create new one
   */
  getOrCreateSession(userId: string): SessionContext {
    // Try to find active session
    const row = this.db.prepare(`
      SELECT * FROM sessions 
      WHERE user_id = ? AND status = 'active'
      ORDER BY last_activity DESC
      LIMIT 1
    `).get(userId) as any;

    if (row) {
      return {
        session_id: row.session_id,
        user_id: row.user_id,
        start_time: row.start_time,
        last_activity: row.last_activity,
        message_count: row.message_count,
        status: row.status,
      };
    }

    // Create new session
    return this.createSession(userId);
  }

  /**
   * Store conversation message
   */
  async storeMessage(
    sessionId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata?: {
      tokens?: number;
      emotion?: string;
      safetyCheck?: any;
    }
  ): Promise<ConversationMessage> {
    const messageId = uuidv4();
    const now = Date.now();

    const stmt = this.db.prepare(`
      INSERT INTO messages (
        id, session_id, user_id, role, content, timestamp, tokens, emotion, safety_check
      )
      SELECT ?, ?, user_id, ?, ?, ?, ?, ?, ?
      FROM sessions WHERE session_id = ?
    `);

    stmt.run(
      messageId,
      sessionId,
      role,
      content,
      now,
      metadata?.tokens || 0,
      metadata?.emotion || null,
      metadata?.safetyCheck ? JSON.stringify(metadata.safetyCheck) : null,
      sessionId
    );

    // Update session activity
    this.db.prepare(`
      UPDATE sessions 
      SET last_activity = ?, message_count = message_count + 1
      WHERE session_id = ?
    `).run(now, sessionId);

    logger.debug('💎 Message stored', { messageId, sessionId, role });

    // Get user_id for return value
    const session = this.db.prepare('SELECT user_id FROM sessions WHERE session_id = ?').get(sessionId) as { user_id: string };

    // Generate and store embedding asynchronously (don't block return)
    this.generateAndStoreEmbedding(messageId, content).catch((error: unknown) => {
      logger.error('Failed to generate embedding:', error instanceof Error ? { message: error.message } : {});
    });

    return {
      id: messageId,
      session_id: sessionId,
      user_id: session.user_id,
      role,
      content,
      timestamp: now,
      tokens: metadata?.tokens || 0,
      emotion: metadata?.emotion,
      safety_check: metadata?.safetyCheck ? JSON.stringify(metadata.safetyCheck) : undefined,
    };
  }

  /**
   * Generate and store embedding for a message
   * Called asynchronously after message is stored
   */
  private async generateAndStoreEmbedding(messageId: string, content: string): Promise<void> {
    try {
      // Generate embedding
      const embedding = await embeddingsService.generateEmbedding(content);
      const embeddingBuffer = EmbeddingsService.serializeEmbedding(embedding);

      // Store in embeddings table
      this.db
        .prepare(
          `INSERT INTO embeddings (message_id, embedding, dimension, model, created_at)
           VALUES (?, ?, ?, ?, ?)`
        )
        .run(
          messageId,
          embeddingBuffer,
          EmbeddingsService.getDimension(),
          EmbeddingsService.getModelName(),
          Date.now()
        );

      logger.debug('🦋 Embedding generated and stored', { messageId });
    } catch (error) {
      logger.error('Failed to generate/store embedding:', error instanceof Error ? { message: error.message } : {});
      throw error;
    }
  }

  /**
   * Get conversation history for session
   */
  getConversationHistory(
    sessionId: string,
    limit: number = 50,
    offset: number = 0
  ): ConversationMessage[] {
    const rows = this.db.prepare(`
      SELECT * FROM messages
      WHERE session_id = ?
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `).all(sessionId, limit, offset) as any[];

    return rows.reverse().map(row => ({
      id: row.id,
      session_id: row.session_id,
      user_id: row.user_id,
      role: row.role,
      content: row.content,
      timestamp: row.timestamp,
      tokens: row.tokens,
      embedding: row.embedding,
      safety_check: row.safety_check,
      emotion: row.emotion,
    }));
  }

  /**
   * Get recent messages for user across all sessions
   */
  getRecentMessagesByUser(userId: string, limit: number = 20): ConversationMessage[] {
    const rows = this.db.prepare(`
      SELECT m.* FROM messages m
      JOIN sessions s ON m.session_id = s.session_id
      WHERE s.user_id = ?
      ORDER BY m.timestamp DESC
      LIMIT ?
    `).all(userId, limit) as any[];

    return rows.reverse().map(row => ({
      id: row.id,
      session_id: row.session_id,
      user_id: row.user_id,
      role: row.role,
      content: row.content,
      timestamp: row.timestamp,
      tokens: row.tokens,
      embedding: row.embedding,
      safety_check: row.safety_check,
      emotion: row.emotion,
    }));
  }

  /**
   * End a session
   */
  endSession(sessionId: string): void {
    this.db.prepare(`
      UPDATE sessions 
      SET status = 'ended', last_activity = ?
      WHERE session_id = ?
    `).run(Date.now(), sessionId);

    logger.info('🌸 Session ended', { sessionId });
  }

  /**
   * Delete all data for a user (GDPR right to be forgotten)
   */
  deleteUserData(userId: string): { messagesDeleted: number; sessionsDeleted: number } {
    const messagesStmt = this.db.prepare(`
      DELETE FROM messages 
      WHERE session_id IN (SELECT session_id FROM sessions WHERE user_id = ?)
    `);
    const sessionsStmt = this.db.prepare('DELETE FROM sessions WHERE user_id = ?');
    const profileStmt = this.db.prepare('DELETE FROM user_profiles WHERE user_id = ?');

    const messagesResult = messagesStmt.run(userId);
    const sessionsResult = sessionsStmt.run(userId);
    profileStmt.run(userId);

    logger.info('🔐 User data deleted', { userId, messagesDeleted: messagesResult.changes, sessionsDeleted: sessionsResult.changes });

    return {
      messagesDeleted: messagesResult.changes,
      sessionsDeleted: sessionsResult.changes,
    };
  }

  /**
   * Run cleanup job (should be called periodically)
   */
  runCleanup(): number {
    const deleted = cleanupOldMessages(this.db);
    if (deleted > 0) {
      logger.info('🧹 Cleanup complete', { messagesDeleted: deleted });
    }
    return deleted;
  }

  /**
   * Summarize conversation history for a session
   * Creates condensed version for long conversations
   */
  async summarizeConversation(
    sessionId: string,
    options?: {
      maxMessages?: number;
      preserveRecent?: number;
    }
  ): Promise<{
    summary: string;
    messagesSummarized: number;
    oldestTimestamp: number;
    newestTimestamp: number;
  }> {
    const {
      maxMessages = 50,
      preserveRecent = 10,
    } = options || {};

    // Get messages from session (excluding most recent ones)
    const messages = this.db
      .prepare(
        `SELECT * FROM messages 
         WHERE session_id = ? 
         ORDER BY timestamp ASC 
         LIMIT ?`
      )
      .all(sessionId, maxMessages) as ConversationMessage[];

    if (messages.length === 0) {
      return {
        summary: '',
        messagesSummarized: 0,
        oldestTimestamp: 0,
        newestTimestamp: 0,
      };
    }

    // Don't summarize if we have fewer messages than preserve threshold
    if (messages.length <= preserveRecent) {
      return {
        summary: '',
        messagesSummarized: 0,
        oldestTimestamp: messages[0].timestamp,
        newestTimestamp: messages[messages.length - 1].timestamp,
      };
    }

    // Build summary from message content
    const summary = this.buildConversationSummary(messages.slice(0, -preserveRecent));

    return {
      summary,
      messagesSummarized: messages.length - preserveRecent,
      oldestTimestamp: messages[0].timestamp,
      newestTimestamp: messages[messages.length - 1].timestamp,
    };
  }

  /**
   * Build a concise summary of conversation messages
   * Extracts key topics and emotional flow
   */
  private buildConversationSummary(messages: ConversationMessage[]): string {
    if (messages.length === 0) return '';

    // Group messages into conversation turns
    const turns: string[] = [];
    let currentTurn = '';
    let currentRole = '';

    for (const msg of messages) {
      if (msg.role !== currentRole) {
        if (currentTurn) {
          turns.push(`${currentRole === 'user' ? 'User' : 'Bambi'}: ${currentTurn}`);
        }
        currentTurn = msg.content;
        currentRole = msg.role;
      } else {
        currentTurn += ' ' + msg.content;
      }
    }
    
    // Add last turn
    if (currentTurn) {
      turns.push(`${currentRole === 'user' ? 'User' : 'Bambi'}: ${currentTurn}`);
    }

    // Create condensed summary
    const summaryParts: string[] = [];
    
    // Extract topics (simple keyword extraction)
    const topicKeywords = this.extractKeywords(messages.map(m => m.content).join(' '));
    if (topicKeywords.length > 0) {
      summaryParts.push(`Topics discussed: ${topicKeywords.slice(0, 5).join(', ')}`);
    }

    // Extract emotional tone
    const emotionalTone = this.detectEmotionalTone(messages);
    if (emotionalTone) {
      summaryParts.push(`Emotional tone: ${emotionalTone}`);
    }

    // Add sample exchanges (first and last)
    if (turns.length > 0) {
      summaryParts.push(`\nKey exchanges:\n- ${turns[0]}`);
      if (turns.length > 1) {
        summaryParts.push(`- ${turns[turns.length - 1]}`);
      }
    }

    return summaryParts.join('\n');
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    // Remove common words
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
      'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'should', 'could', 'can', 'may', 'might', 'i', 'you', 'he',
      'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my',
      'your', 'his', 'her', 'its', 'our', 'their', 'this', 'that', 'these',
      'those', 'what', 'which', 'who', 'when', 'where', 'why', 'how',
    ]);

    // Tokenize and filter
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const wordCounts = new Map<string, number>();

    for (const word of words) {
      if (word.length > 3 && !stopWords.has(word)) {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      }
    }

    // Sort by frequency
    const sorted = Array.from(wordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([word]) => word);

    return sorted.slice(0, 10);
  }

  /**
   * Detect emotional tone from messages
   */
  private detectEmotionalTone(messages: ConversationMessage[]): string {
    const text = messages.map(m => m.content).join(' ').toLowerCase();

    const patterns = {
      positive: /(happy|joy|love|great|wonderful|amazing|excited|good|nice|thanks)/g,
      negative: /(sad|angry|upset|frustrated|worried|anxious|bad|terrible|hate)/g,
      playful: /(haha|lol|😂|🤣|😜|fun|play|tease)/g,
      supportive: /(support|help|care|understand|here for you|comfort)/g,
    };

    const scores: Record<string, number> = {};
    for (const [tone, pattern] of Object.entries(patterns)) {
      const matches = text.match(pattern);
      scores[tone] = matches ? matches.length : 0;
    }

    // Find dominant tone
    const maxScore = Math.max(...Object.values(scores));
    if (maxScore === 0) return 'neutral';

    const dominantTone = Object.entries(scores).find(([, score]) => score === maxScore)?.[0];
    return dominantTone || 'neutral';
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
    logger.info('💎 MemoryService closed');
  }
}

