/**
 * BambiSleep™ Church MCP Control Tower
 * MongoDB Atlas Connection Test
 */

import assert from 'node:assert';
import { describe, it, before, after } from 'node:test';
import { mongoClient, mongoHandlers } from './mongodb.js';

describe('MongoDB Atlas Connection', () => {
  let skipTests = false;

  before(async () => {
    // Check if mongodb package is available
    const available = await mongoHandlers.checkAvailable();
    if (!available) {
      console.log('⚠️  MongoDB driver not installed, skipping tests');
      skipTests = true;
      return;
    }

    // Check if MONGODB_URI is configured for Atlas
    const uri = process.env.MONGODB_URI || '';
    if (!uri.includes('mongodb+srv://') && !uri.includes('.mongodb.net')) {
      console.log('⚠️  MONGODB_URI not configured for Atlas, skipping integration tests');
      skipTests = true;
    }
  });

  after(async () => {
    if (!skipTests) {
      try {
        await mongoHandlers.disconnect();
      } catch {
        // Ignore disconnect errors
      }
    }
  });

  it('should detect Atlas connection string', () => {
    if (skipTests) return;
    
    const info = mongoHandlers.getConnectionInfo();
    assert.ok(info.isAtlas === true, 'Should detect Atlas connection');
    assert.ok(info.uri.includes('***'), 'Should mask password in URI');
  });

  it('should connect to MongoDB Atlas', async () => {
    if (skipTests) return;

    const result = await mongoHandlers.connect();
    
    assert.strictEqual(result.success, true);
    assert.ok(result.database, 'Should have database name');
    assert.strictEqual(result.isAtlas, true, 'Should indicate Atlas connection');
    
    console.log(`✅ Connected to Atlas database: ${result.database}`);
  });

  it('should list databases', async () => {
    if (skipTests) return;

    const databases = await mongoHandlers.listDatabases();
    
    assert.ok(Array.isArray(databases), 'Should return array of databases');
    console.log(`✅ Found ${databases.length} databases:`, databases.map(d => d.name));
  });

  it('should perform CRUD operations', async () => {
    if (skipTests) return;

    const testCollection = 'test_connection';
    const testDoc = { 
      test: true, 
      timestamp: new Date(),
      message: 'MongoDB Atlas connection test' 
    };

    // Insert
    const insertResult = await mongoHandlers.insertOne(testCollection, testDoc);
    assert.strictEqual(insertResult.success, true);
    assert.ok(insertResult.insertedId, 'Should return insertedId');
    console.log(`✅ Inserted document: ${insertResult.insertedId}`);

    // Find
    const found = await mongoHandlers.findOne(testCollection, { test: true });
    assert.ok(found, 'Should find inserted document');
    assert.strictEqual(found.message, testDoc.message);
    console.log('✅ Found document');

    // Delete (cleanup)
    const deleteResult = await mongoHandlers.deleteOne(testCollection, { _id: insertResult.insertedId });
    assert.strictEqual(deleteResult.success, true);
    assert.strictEqual(deleteResult.deletedCount, 1);
    console.log('✅ Cleaned up test document');
  });

  it('should get connection info with Atlas details', () => {
    if (skipTests) return;

    const info = mongoHandlers.getConnectionInfo();
    
    assert.strictEqual(info.connected, true);
    assert.strictEqual(info.isAtlas, true);
    assert.ok(info.database, 'Should have database name');
    assert.ok(!info.uri.includes('gJAKGq'), 'Should not expose password');
    
    console.log('✅ Connection info:', {
      ...info,
      uri: info.uri.substring(0, 30) + '...',
    });
  });
});
