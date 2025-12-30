/**
 * BambiSleep™ Church MCP Control Tower
 * PostgreSQL MCP Server Wrapper - Database Operations
 */

import { createLogger } from '../utils/logger.js';

const logger = createLogger('postgres');

/**
 * PostgreSQL client
 * Requires pg package for full functionality
 */
class PostgresClient {
  constructor(connectionString = process.env.POSTGRES_URL || 'postgresql://localhost:5432/bambisleep') {
    this.connectionString = connectionString;
    this.pool = null;
    this.connected = false;
  }

  /**
   * Check if pg package is available
   */
  async checkAvailable() {
    try {
      await import('pg');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Connect to PostgreSQL
   */
  async connect() {
    try {
      const pg = await import('pg');
      this.pool = new pg.default.Pool({
        connectionString: this.connectionString,
      });

      // Test connection
      const client = await this.pool.connect();
      client.release();
      
      this.connected = true;
      logger.info('PostgreSQL connected');
      return { success: true, message: 'Connected to PostgreSQL' };
    } catch (error) {
      logger.error(`Connection failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Execute SQL query
   */
  async query(sql, params = []) {
    if (!this.pool) {
      throw new Error('Not connected. Call connect() first.');
    }

    const result = await this.pool.query(sql, params);
    return {
      rows: result.rows,
      rowCount: result.rowCount,
      fields: result.fields?.map((f) => ({ name: f.name, dataType: f.dataTypeID })),
    };
  }

  /**
   * List databases
   */
  async listDatabases() {
    const result = await this.query(
      `SELECT datname FROM pg_database WHERE datistemplate = false`
    );
    return result.rows.map((r) => r.datname);
  }

  /**
   * List schemas
   */
  async listSchemas() {
    const result = await this.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('pg_catalog', 'information_schema')`
    );
    return result.rows.map((r) => r.schema_name);
  }

  /**
   * List tables
   */
  async listTables(schema = 'public') {
    const result = await this.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = $1 AND table_type = 'BASE TABLE'`,
      [schema]
    );
    return result.rows.map((r) => r.table_name);
  }

  /**
   * Describe table
   */
  async describeTable(table, schema = 'public') {
    const result = await this.query(
      `SELECT column_name, data_type, is_nullable, column_default 
       FROM information_schema.columns 
       WHERE table_schema = $1 AND table_name = $2 
       ORDER BY ordinal_position`,
      [schema, table]
    );
    return {
      table,
      schema,
      columns: result.rows,
    };
  }

  /**
   * Get table indexes
   */
  async getIndexes(table, schema = 'public') {
    const result = await this.query(
      `SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = $1 AND tablename = $2`,
      [schema, table]
    );
    return result.rows;
  }

  /**
   * Get table constraints
   */
  async getConstraints(table, schema = 'public') {
    const result = await this.query(
      `SELECT constraint_name, constraint_type 
       FROM information_schema.table_constraints 
       WHERE table_schema = $1 AND table_name = $2`,
      [schema, table]
    );
    return result.rows;
  }

  /**
   * Insert row
   */
  async insert(table, data, returning = '*') {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map((_, i) => `$${i + 1}`);

    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING ${returning}`;
    return this.query(sql, values);
  }

  /**
   * Select rows
   */
  async select(table, options = {}) {
    let sql = `SELECT ${options.columns || '*'} FROM ${table}`;
    const params = [];

    if (options.where) {
      const conditions = Object.entries(options.where).map(([key, value], i) => {
        params.push(value);
        return `${key} = $${i + 1}`;
      });
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    if (options.orderBy) {
      sql += ` ORDER BY ${options.orderBy}`;
    }

    if (options.limit) {
      sql += ` LIMIT ${options.limit}`;
    }

    if (options.offset) {
      sql += ` OFFSET ${options.offset}`;
    }

    return this.query(sql, params);
  }

  /**
   * Update rows
   */
  async update(table, data, where) {
    const setClauses = Object.keys(data).map((key, i) => `${key} = $${i + 1}`);
    const values = [...Object.values(data)];

    const whereClauses = Object.keys(where).map((key, i) => {
      values.push(where[key]);
      return `${key} = $${Object.keys(data).length + i + 1}`;
    });

    const sql = `UPDATE ${table} SET ${setClauses.join(', ')} WHERE ${whereClauses.join(' AND ')} RETURNING *`;
    return this.query(sql, values);
  }

  /**
   * Delete rows
   */
  async delete(table, where) {
    const whereClauses = Object.keys(where).map((key, i) => `${key} = $${i + 1}`);
    const values = Object.values(where);

    const sql = `DELETE FROM ${table} WHERE ${whereClauses.join(' AND ')} RETURNING *`;
    return this.query(sql, values);
  }

  /**
   * Begin transaction
   */
  async beginTransaction() {
    await this.query('BEGIN');
    return { success: true, message: 'Transaction started' };
  }

  /**
   * Commit transaction
   */
  async commit() {
    await this.query('COMMIT');
    return { success: true, message: 'Transaction committed' };
  }

  /**
   * Rollback transaction
   */
  async rollback() {
    await this.query('ROLLBACK');
    return { success: true, message: 'Transaction rolled back' };
  }

  /**
   * Get database version
   */
  async getVersion() {
    const result = await this.query('SELECT version()');
    return result.rows[0].version;
  }

  /**
   * Get database size
   */
  async getDatabaseSize(dbName = 'bambisleep') {
    const result = await this.query(`SELECT pg_size_pretty(pg_database_size($1)) as size`, [dbName]);
    return result.rows[0].size;
  }

  /**
   * Get connection stats
   */
  async getStats() {
    const result = await this.query(
      `SELECT numbackends as connections, xact_commit as commits, xact_rollback as rollbacks 
       FROM pg_stat_database WHERE datname = current_database()`
    );
    return {
      connected: this.connected,
      connectionString: this.connectionString.replace(/:[^:@]+@/, ':***@'), // Hide password
      ...result.rows[0],
    };
  }

  /**
   * Close connection pool
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.connected = false;
      logger.info('PostgreSQL connection closed');
    }
    return { success: true };
  }
}

// Singleton instance
export const postgresClient = new PostgresClient();

/**
 * PostgreSQL API handlers for REST endpoints
 */
export const postgresHandlers = {
  // Connection
  checkAvailable: () => postgresClient.checkAvailable(),
  connect: () => postgresClient.connect(),
  close: () => postgresClient.close(),
  getStats: () => postgresClient.getStats(),
  getVersion: () => postgresClient.getVersion(),
  getDatabaseSize: (dbName) => postgresClient.getDatabaseSize(dbName),

  // Schema inspection
  listDatabases: () => postgresClient.listDatabases(),
  listSchemas: () => postgresClient.listSchemas(),
  listTables: (schema) => postgresClient.listTables(schema),
  describeTable: (table, schema) => postgresClient.describeTable(table, schema),
  getIndexes: (table, schema) => postgresClient.getIndexes(table, schema),
  getConstraints: (table, schema) => postgresClient.getConstraints(table, schema),

  // CRUD
  query: (sql, params) => postgresClient.query(sql, params),
  insert: (table, data, returning) => postgresClient.insert(table, data, returning),
  select: (table, options) => postgresClient.select(table, options),
  update: (table, data, where) => postgresClient.update(table, data, where),
  delete: (table, where) => postgresClient.delete(table, where),

  // Transactions
  beginTransaction: () => postgresClient.beginTransaction(),
  commit: () => postgresClient.commit(),
  rollback: () => postgresClient.rollback(),
};

export default postgresHandlers;
