/**
 * BambiSleep™ Church MCP Control Tower
 * MongoDB MCP Server Wrapper - Document Database
 * Reference: docs/MONGODB_MCP_REFERENCE.md
 * 
 * Supports both local MongoDB and MongoDB Atlas connections.
 * Set MONGODB_URI env var for Atlas connection strings.
 */

import { createLogger } from '../utils/logger.js';

const logger = createLogger('mongodb');

/**
 * Default MongoDB connection options optimized for Atlas
 */
const DEFAULT_OPTIONS = {
  // Connection pool settings
  maxPoolSize: 10,
  minPoolSize: 2,
  
  // Timeouts (ms)
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 10000,
  
  // Retry settings
  retryWrites: true,
  retryReads: true,
  
  // Write concern for data safety
  w: 'majority',
};

/**
 * MongoDB client wrapper
 * Requires mongodb package: npm install mongodb
 */
class MongoDBClient {
  constructor(uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bambisleep') {
    this.uri = uri;
    this.client = null;
    this.db = null;
    this.defaultDatabase = this.extractDatabaseFromUri(uri) || process.env.MONGODB_DATABASE || 'bambisleep';
    this.connected = false;
    this.isAtlas = uri.includes('mongodb+srv://') || uri.includes('.mongodb.net');
  }

  /**
   * Extract database name from MongoDB URI
   */
  extractDatabaseFromUri(uri) {
    try {
      // Handle mongodb+srv:// and mongodb:// URIs
      const match = uri.match(/\/([^/?]+)(\?|$)/);
      if (match && match[1] && !match[1].includes('.mongodb.net')) {
        return match[1];
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Check if mongodb package is available
   */
  async checkAvailable() {
    try {
      await import('mongodb');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Connect to MongoDB
   */
  async connect(database = this.defaultDatabase) {
    try {
      const { MongoClient } = await import('mongodb');
      
      // Merge default options with any URI params
      const options = this.isAtlas ? { ...DEFAULT_OPTIONS } : {};
      
      this.client = new MongoClient(this.uri, options);
      await this.client.connect();
      this.db = this.client.db(database);
      this.connected = true;
      
      const connectionType = this.isAtlas ? 'MongoDB Atlas' : 'MongoDB';
      logger.info(`Connected to ${connectionType}: ${database}`);
      return { 
        success: true, 
        database, 
        message: `Connected to ${connectionType}`,
        isAtlas: this.isAtlas,
      };
    } catch (error) {
      logger.error(`Connection failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      this.connected = false;
      logger.info('Disconnected from MongoDB');
    }
    return { success: true };
  }

  /**
   * Switch database
   */
  useDatabase(name) {
    if (!this.client) {
      throw new Error('Not connected. Call connect() first.');
    }
    this.db = this.client.db(name);
    return { success: true, database: name };
  }

  /**
   * List all databases
   */
  async listDatabases() {
    if (!this.client) throw new Error('Not connected');
    const result = await this.client.db().admin().listDatabases();
    return result.databases;
  }

  /**
   * List collections in current database
   */
  async listCollections() {
    if (!this.db) throw new Error('Not connected');
    const collections = await this.db.listCollections().toArray();
    return collections.map((c) => c.name);
  }

  /**
   * Create a collection
   */
  async createCollection(name, options = {}) {
    if (!this.db) throw new Error('Not connected');
    await this.db.createCollection(name, options);
    logger.info(`Created collection: ${name}`);
    return { success: true, collection: name };
  }

  /**
   * Drop a collection
   */
  async dropCollection(name) {
    if (!this.db) throw new Error('Not connected');
    await this.db.collection(name).drop();
    logger.info(`Dropped collection: ${name}`);
    return { success: true };
  }

  // ============ CRUD OPERATIONS ============

  /**
   * Insert one document
   */
  async insertOne(collection, document) {
    if (!this.db) throw new Error('Not connected');
    const result = await this.db.collection(collection).insertOne(document);
    logger.debug(`Inserted document into ${collection}: ${result.insertedId}`);
    return {
      success: true,
      insertedId: result.insertedId,
      acknowledged: result.acknowledged,
    };
  }

  /**
   * Insert many documents
   */
  async insertMany(collection, documents) {
    if (!this.db) throw new Error('Not connected');
    const result = await this.db.collection(collection).insertMany(documents);
    logger.debug(`Inserted ${result.insertedCount} documents into ${collection}`);
    return {
      success: true,
      insertedCount: result.insertedCount,
      insertedIds: result.insertedIds,
    };
  }

  /**
   * Find one document
   */
  async findOne(collection, filter = {}, options = {}) {
    if (!this.db) throw new Error('Not connected');
    return await this.db.collection(collection).findOne(filter, options);
  }

  /**
   * Find many documents
   */
  async find(collection, filter = {}, options = {}) {
    if (!this.db) throw new Error('Not connected');
    
    let cursor = this.db.collection(collection).find(filter);
    
    if (options.projection) {
      cursor = cursor.project(options.projection);
    }
    if (options.sort) {
      cursor = cursor.sort(options.sort);
    }
    if (options.skip) {
      cursor = cursor.skip(options.skip);
    }
    if (options.limit) {
      cursor = cursor.limit(options.limit);
    }
    
    return await cursor.toArray();
  }

  /**
   * Update one document
   */
  async updateOne(collection, filter, update, options = {}) {
    if (!this.db) throw new Error('Not connected');
    const result = await this.db.collection(collection).updateOne(filter, update, options);
    return {
      success: true,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      upsertedId: result.upsertedId,
    };
  }

  /**
   * Update many documents
   */
  async updateMany(collection, filter, update, options = {}) {
    if (!this.db) throw new Error('Not connected');
    const result = await this.db.collection(collection).updateMany(filter, update, options);
    return {
      success: true,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    };
  }

  /**
   * Replace one document
   */
  async replaceOne(collection, filter, replacement, options = {}) {
    if (!this.db) throw new Error('Not connected');
    const result = await this.db.collection(collection).replaceOne(filter, replacement, options);
    return {
      success: true,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    };
  }

  /**
   * Find one and update
   */
  async findOneAndUpdate(collection, filter, update, options = {}) {
    if (!this.db) throw new Error('Not connected');
    return await this.db.collection(collection).findOneAndUpdate(filter, update, {
      returnDocument: 'after',
      ...options,
    });
  }

  /**
   * Delete one document
   */
  async deleteOne(collection, filter) {
    if (!this.db) throw new Error('Not connected');
    const result = await this.db.collection(collection).deleteOne(filter);
    return {
      success: true,
      deletedCount: result.deletedCount,
    };
  }

  /**
   * Delete many documents
   */
  async deleteMany(collection, filter) {
    if (!this.db) throw new Error('Not connected');
    const result = await this.db.collection(collection).deleteMany(filter);
    return {
      success: true,
      deletedCount: result.deletedCount,
    };
  }

  /**
   * Find one and delete
   */
  async findOneAndDelete(collection, filter, options = {}) {
    if (!this.db) throw new Error('Not connected');
    return await this.db.collection(collection).findOneAndDelete(filter, options);
  }

  /**
   * Count documents
   */
  async countDocuments(collection, filter = {}) {
    if (!this.db) throw new Error('Not connected');
    return await this.db.collection(collection).countDocuments(filter);
  }

  /**
   * Distinct values
   */
  async distinct(collection, field, filter = {}) {
    if (!this.db) throw new Error('Not connected');
    return await this.db.collection(collection).distinct(field, filter);
  }

  // ============ AGGREGATION ============

  /**
   * Run aggregation pipeline
   */
  async aggregate(collection, pipeline, options = {}) {
    if (!this.db) throw new Error('Not connected');
    return await this.db.collection(collection).aggregate(pipeline, options).toArray();
  }

  // ============ INDEXES ============

  /**
   * Create index
   */
  async createIndex(collection, keys, options = {}) {
    if (!this.db) throw new Error('Not connected');
    const indexName = await this.db.collection(collection).createIndex(keys, options);
    logger.info(`Created index on ${collection}: ${indexName}`);
    return { success: true, indexName };
  }

  /**
   * Create multiple indexes
   */
  async createIndexes(collection, indexes) {
    if (!this.db) throw new Error('Not connected');
    const result = await this.db.collection(collection).createIndexes(indexes);
    return { success: true, indexes: result };
  }

  /**
   * List indexes
   */
  async listIndexes(collection) {
    if (!this.db) throw new Error('Not connected');
    return await this.db.collection(collection).indexes();
  }

  /**
   * Drop index
   */
  async dropIndex(collection, indexName) {
    if (!this.db) throw new Error('Not connected');
    await this.db.collection(collection).dropIndex(indexName);
    logger.info(`Dropped index ${indexName} from ${collection}`);
    return { success: true };
  }

  /**
   * Drop all indexes (except _id)
   */
  async dropAllIndexes(collection) {
    if (!this.db) throw new Error('Not connected');
    await this.db.collection(collection).dropIndexes();
    return { success: true };
  }

  // ============ STATS & INFO ============

  /**
   * Get collection stats
   */
  async collectionStats(collection) {
    if (!this.db) throw new Error('Not connected');
    return await this.db.command({ collStats: collection });
  }

  /**
   * Get database stats
   */
  async databaseStats() {
    if (!this.db) throw new Error('Not connected');
    return await this.db.stats();
  }

  /**
   * Get server status
   */
  async serverStatus() {
    if (!this.client) throw new Error('Not connected');
    return await this.client.db().admin().serverStatus();
  }

  /**
   * Get connection info
   */
  getConnectionInfo() {
    return {
      connected: this.connected,
      uri: this.uri.replace(/:[^:@]+@/, ':***@'), // Hide password
      database: this.db?.databaseName || null,
      isAtlas: this.isAtlas,
      defaultDatabase: this.defaultDatabase,
    };
  }
}

// Singleton instance
export const mongoClient = new MongoDBClient();

/**
 * MongoDB API handlers for REST endpoints
 */
export const mongoHandlers = {
  // Connection
  checkAvailable: () => mongoClient.checkAvailable(),
  connect: (database) => mongoClient.connect(database),
  disconnect: () => mongoClient.disconnect(),
  useDatabase: (name) => mongoClient.useDatabase(name),
  getConnectionInfo: () => mongoClient.getConnectionInfo(),

  // Database management
  listDatabases: () => mongoClient.listDatabases(),
  listCollections: () => mongoClient.listCollections(),
  createCollection: (name, options) => mongoClient.createCollection(name, options),
  dropCollection: (name) => mongoClient.dropCollection(name),

  // CRUD - Create
  insertOne: (collection, document) => mongoClient.insertOne(collection, document),
  insertMany: (collection, documents) => mongoClient.insertMany(collection, documents),

  // CRUD - Read
  findOne: (collection, filter, options) => mongoClient.findOne(collection, filter, options),
  find: (collection, filter, options) => mongoClient.find(collection, filter, options),
  countDocuments: (collection, filter) => mongoClient.countDocuments(collection, filter),
  distinct: (collection, field, filter) => mongoClient.distinct(collection, field, filter),

  // CRUD - Update
  updateOne: (collection, filter, update, options) => mongoClient.updateOne(collection, filter, update, options),
  updateMany: (collection, filter, update, options) => mongoClient.updateMany(collection, filter, update, options),
  replaceOne: (collection, filter, replacement, options) => mongoClient.replaceOne(collection, filter, replacement, options),
  findOneAndUpdate: (collection, filter, update, options) => mongoClient.findOneAndUpdate(collection, filter, update, options),

  // CRUD - Delete
  deleteOne: (collection, filter) => mongoClient.deleteOne(collection, filter),
  deleteMany: (collection, filter) => mongoClient.deleteMany(collection, filter),
  findOneAndDelete: (collection, filter, options) => mongoClient.findOneAndDelete(collection, filter, options),

  // Aggregation
  aggregate: (collection, pipeline, options) => mongoClient.aggregate(collection, pipeline, options),

  // Indexes
  createIndex: (collection, keys, options) => mongoClient.createIndex(collection, keys, options),
  createIndexes: (collection, indexes) => mongoClient.createIndexes(collection, indexes),
  listIndexes: (collection) => mongoClient.listIndexes(collection),
  dropIndex: (collection, indexName) => mongoClient.dropIndex(collection, indexName),
  dropAllIndexes: (collection) => mongoClient.dropAllIndexes(collection),

  // Stats
  collectionStats: (collection) => mongoClient.collectionStats(collection),
  databaseStats: () => mongoClient.databaseStats(),
  serverStatus: () => mongoClient.serverStatus(),
};

export default mongoHandlers;
