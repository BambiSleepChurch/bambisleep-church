/**
 * 💎 Database Schema - SQLite Schema Definitions
 * Phase 4: Memory and Personalization
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface ConversationMessage {
  id: string;
  session_id: string;
  user_id: string; // anonymized
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  tokens: number;
  embedding?: string; // JSON-encoded number array
  safety_check?: string; // JSON-encoded SafetyResult
  emotion?: string;
}

export interface UserProfile {
  user_id: string; // anonymized
  nickname?: string;
  conversation_style?: 'playful' | 'supportive' | 'balanced';
  topics?: string; // JSON-encoded string array
  memory_enabled: boolean;
  data_retention_days: number;
  share_with_avatar: boolean;
  created_at: number;
  last_active: number;
}

export interface SessionContext {
  session_id: string;
  user_id: string;
  start_time: number;
  last_activity: number;
  message_count: number;
  status: 'active' | 'ended';
}

/**
 * Initialize database with schema
 */
export function initializeDatabase(dbPath?: string): Database.Database {
  const resolvedPath = dbPath || path.join(__dirname, '..', '..', 'data', 'bambisleep.db');
  
  // Ensure data directory exists
  const dataDir = path.dirname(resolvedPath);
  if (!require('fs').existsSync(dataDir)) {
    require('fs').mkdirSync(dataDir, { recursive: true });
  }

  const db = new Database(resolvedPath);

  // Enable WAL mode for better concurrency
  db.pragma('journal_mode = WAL');

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      tokens INTEGER DEFAULT 0,
      embedding TEXT,
      safety_check TEXT,
      emotion TEXT,
      FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
    CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id);
    CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);

    CREATE TABLE IF NOT EXISTS user_profiles (
      user_id TEXT PRIMARY KEY,
      nickname TEXT,
      conversation_style TEXT CHECK(conversation_style IN ('playful', 'supportive', 'balanced')),
      topics TEXT, -- JSON array
      memory_enabled INTEGER NOT NULL DEFAULT 1,
      data_retention_days INTEGER NOT NULL DEFAULT 30,
      share_with_avatar INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      last_active INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      session_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      start_time INTEGER NOT NULL,
      last_activity INTEGER NOT NULL,
      message_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'ended')),
      FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);

    CREATE TABLE IF NOT EXISTS embeddings (
      message_id TEXT PRIMARY KEY,
      embedding BLOB NOT NULL,
      dimension INTEGER NOT NULL,
      model TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_embeddings_created ON embeddings(created_at);
  `);

  return db;
}

/**
 * Clean up old messages based on retention policy
 */
export function cleanupOldMessages(db: Database.Database): number {
  const stmt = db.prepare(`
    DELETE FROM messages
    WHERE id IN (
      SELECT m.id
      FROM messages m
      JOIN sessions s ON m.session_id = s.session_id
      JOIN user_profiles u ON s.user_id = u.user_id
      WHERE m.timestamp < (unixepoch() * 1000 - (u.data_retention_days * 24 * 60 * 60 * 1000))
    )
  `);

  const result = stmt.run();
  return result.changes;
}

/**
 * Get database statistics
 */
export function getDatabaseStats(db: Database.Database): {
  totalMessages: number;
  totalUsers: number;
  activeSessions: number;
  totalEmbeddings: number;
} {
  const stats = {
    totalMessages: db.prepare('SELECT COUNT(*) as count FROM messages').get() as { count: number },
    totalUsers: db.prepare('SELECT COUNT(*) as count FROM user_profiles').get() as { count: number },
    activeSessions: db.prepare("SELECT COUNT(*) as count FROM sessions WHERE status = 'active'").get() as { count: number },
    totalEmbeddings: db.prepare('SELECT COUNT(*) as count FROM embeddings').get() as { count: number },
  };

  return {
    totalMessages: stats.totalMessages.count,
    totalUsers: stats.totalUsers.count,
    activeSessions: stats.activeSessions.count,
    totalEmbeddings: stats.totalEmbeddings.count,
  };
}
