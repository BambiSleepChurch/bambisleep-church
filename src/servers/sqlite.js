/**
 * BambiSleep™ Church MCP Control Tower
 * SQLite MCP Server Wrapper - Local Database
 */

import { createLogger } from '../utils/logger.js';

const logger = createLogger('sqlite');

/**
 * In-memory SQLite-like storage
 * For full SQLite support, use better-sqlite3 or sql.js
 */
class SQLiteClient {
  constructor(dbPath = './data/local.db') {
    this.dbPath = dbPath;
    this.tables = new Map();
    this.connected = false;
  }

  /**
   * Connect to database (initialize)
   */
  connect() {
    this.connected = true;
    logger.info(`SQLite connected: ${this.dbPath}`);
    return { success: true, path: this.dbPath };
  }

  /**
   * Create table
   */
  createTable(name, columns) {
    if (this.tables.has(name)) {
      throw new Error(`Table ${name} already exists`);
    }

    this.tables.set(name, {
      columns,
      rows: [],
      autoIncrement: 1,
    });

    logger.info(`Created table: ${name}`);
    return { success: true, table: name };
  }

  /**
   * Drop table
   */
  dropTable(name) {
    if (!this.tables.has(name)) {
      throw new Error(`Table ${name} does not exist`);
    }
    this.tables.delete(name);
    logger.info(`Dropped table: ${name}`);
    return { success: true };
  }

  /**
   * List tables
   */
  listTables() {
    return Array.from(this.tables.keys());
  }

  /**
   * Describe table
   */
  describeTable(name) {
    const table = this.tables.get(name);
    if (!table) {
      throw new Error(`Table ${name} does not exist`);
    }
    return {
      name,
      columns: table.columns,
      rowCount: table.rows.length,
    };
  }

  /**
   * Insert row
   */
  insert(tableName, data) {
    const table = this.tables.get(tableName);
    if (!table) {
      throw new Error(`Table ${tableName} does not exist`);
    }

    const row = {
      _id: table.autoIncrement++,
      ...data,
      _created: new Date().toISOString(),
    };

    table.rows.push(row);
    logger.debug(`Inserted row into ${tableName}: ${row._id}`);
    return { success: true, id: row._id };
  }

  /**
   * Select rows
   */
  select(tableName, options = {}) {
    const table = this.tables.get(tableName);
    if (!table) {
      throw new Error(`Table ${tableName} does not exist`);
    }

    let rows = [...table.rows];

    // Apply WHERE filter
    if (options.where) {
      rows = rows.filter((row) => {
        return Object.entries(options.where).every(([key, value]) => row[key] === value);
      });
    }

    // Apply ORDER BY
    if (options.orderBy) {
      const [field, direction] = options.orderBy.split(' ');
      rows.sort((a, b) => {
        if (direction?.toUpperCase() === 'DESC') {
          return b[field] > a[field] ? 1 : -1;
        }
        return a[field] > b[field] ? 1 : -1;
      });
    }

    // Apply LIMIT
    if (options.limit) {
      rows = rows.slice(0, options.limit);
    }

    // Apply column selection
    if (options.columns && options.columns !== '*') {
      const cols = options.columns.split(',').map((c) => c.trim());
      rows = rows.map((row) => {
        const filtered = {};
        cols.forEach((col) => {
          if (row[col] !== undefined) filtered[col] = row[col];
        });
        return filtered;
      });
    }

    return rows;
  }

  /**
   * Update rows
   */
  update(tableName, data, where) {
    const table = this.tables.get(tableName);
    if (!table) {
      throw new Error(`Table ${tableName} does not exist`);
    }

    let updated = 0;
    table.rows = table.rows.map((row) => {
      const matches = Object.entries(where).every(([key, value]) => row[key] === value);
      if (matches) {
        updated++;
        return { ...row, ...data, _updated: new Date().toISOString() };
      }
      return row;
    });

    logger.debug(`Updated ${updated} rows in ${tableName}`);
    return { success: true, updated };
  }

  /**
   * Delete rows
   */
  delete(tableName, where) {
    const table = this.tables.get(tableName);
    if (!table) {
      throw new Error(`Table ${tableName} does not exist`);
    }

    const before = table.rows.length;
    table.rows = table.rows.filter((row) => {
      return !Object.entries(where).every(([key, value]) => row[key] === value);
    });

    const deleted = before - table.rows.length;
    logger.debug(`Deleted ${deleted} rows from ${tableName}`);
    return { success: true, deleted };
  }

  /**
   * Execute raw SQL (simplified parser)
   */
  execute(sql) {
    const trimmed = sql.trim().toUpperCase();

    if (trimmed.startsWith('SELECT')) {
      // Parse simple SELECT
      const match = sql.match(/SELECT\s+(.+)\s+FROM\s+(\w+)/i);
      if (match) {
        return this.select(match[2], { columns: match[1] });
      }
    }

    if (trimmed.startsWith('INSERT')) {
      // Parse simple INSERT
      const match = sql.match(/INSERT\s+INTO\s+(\w+)\s*\((.+)\)\s*VALUES\s*\((.+)\)/i);
      if (match) {
        const columns = match[2].split(',').map((c) => c.trim());
        const values = match[3].split(',').map((v) => v.trim().replace(/['"]/g, ''));
        const data = {};
        columns.forEach((col, i) => {
          data[col] = values[i];
        });
        return this.insert(match[1], data);
      }
    }

    throw new Error('Unsupported SQL statement');
  }

  /**
   * Get database stats
   */
  getStats() {
    let totalRows = 0;
    const tableStats = [];

    for (const [name, table] of this.tables) {
      totalRows += table.rows.length;
      tableStats.push({
        name,
        rows: table.rows.length,
        columns: table.columns.length,
      });
    }

    return {
      path: this.dbPath,
      connected: this.connected,
      tables: this.tables.size,
      totalRows,
      tableStats,
    };
  }
}

// Singleton instance
export const sqliteClient = new SQLiteClient();

/**
 * SQLite API handlers for REST endpoints
 */
export const sqliteHandlers = {
  // Connection
  connect: () => sqliteClient.connect(),
  getStats: () => sqliteClient.getStats(),

  // Tables
  createTable: (name, columns) => sqliteClient.createTable(name, columns),
  dropTable: (name) => sqliteClient.dropTable(name),
  listTables: () => sqliteClient.listTables(),
  describeTable: (name) => sqliteClient.describeTable(name),

  // CRUD
  insert: (table, data) => sqliteClient.insert(table, data),
  select: (table, options) => sqliteClient.select(table, options),
  update: (table, data, where) => sqliteClient.update(table, data, where),
  delete: (table, where) => sqliteClient.delete(table, where),

  // Raw SQL
  execute: (sql) => sqliteClient.execute(sql),
};

export default sqliteHandlers;
