/**
 * BambiSleep™ Church MCP Control Tower
 * MongoDB Unit and Integration Tests
 */

import assert from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { mongoHandlers } from '../../src/servers/mongodb.js';

describe('MongoDB Module', () => {
  describe('Unit Tests (no connection required)', () => {
    it('should check if mongodb is available', async () => {
      const available = await mongoHandlers.checkAvailable();
      // Should return boolean
      assert.strictEqual(typeof available, 'boolean');
    });

    it('should return connection info even when disconnected', () => {
      const info = mongoHandlers.getConnectionInfo();
      
      assert.strictEqual(typeof info, 'object');
      assert.ok('connected' in info, 'should have connected property');
      assert.ok('uri' in info, 'should have uri property');
      assert.ok('isAtlas' in info, 'should have isAtlas property');
      assert.ok('defaultDatabase' in info, 'should have defaultDatabase property');
    });

    it('should mask password in connection info URI', () => {
      const info = mongoHandlers.getConnectionInfo();
      
      // URI should not contain password (if one exists)
      if (info.uri.includes('@')) {
        assert.ok(info.uri.includes(':***@'), 'Password should be masked');
      }
    });

    it('should detect Atlas connection string in URI', () => {
      const info = mongoHandlers.getConnectionInfo();
      
      // isAtlas should be based on URI format
      const isAtlasUri = info.uri.includes('mongodb+srv://') || info.uri.includes('.mongodb.net');
      assert.strictEqual(info.isAtlas, isAtlasUri);
    });

    it('should handle extractDatabaseFromUri for standard URI', () => {
      const info = mongoHandlers.getConnectionInfo();
      // defaultDatabase should be extracted or use default
      assert.ok(info.defaultDatabase, 'should have a default database');
    });
  });

  describe('Error Handling Tests', () => {
    it('listDatabases should throw when not connected', async () => {
      // First ensure disconnected
      try {
        await mongoHandlers.disconnect();
      } catch {
        // Ignore
      }

      // Now try to list databases
      try {
        await mongoHandlers.listDatabases();
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(error.message, 'Should have error message');
      }
    });

    it('listCollections should throw when not connected', async () => {
      try {
        await mongoHandlers.listCollections();
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(error.message, 'Should have error message');
      }
    });

    it('insertOne should throw when not connected', async () => {
      try {
        await mongoHandlers.insertOne('test', { doc: 1 });
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(error.message, 'Should have error message');
      }
    });

    it('find should throw when not connected', async () => {
      try {
        await mongoHandlers.find('test', {});
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(error.message, 'Should have error message');
      }
    });

    it('updateOne should throw when not connected', async () => {
      try {
        await mongoHandlers.updateOne('test', {}, { $set: { x: 1 } });
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(error.message, 'Should have error message');
      }
    });

    it('deleteOne should throw when not connected', async () => {
      try {
        await mongoHandlers.deleteOne('test', {});
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(error.message, 'Should have error message');
      }
    });

    it('useDatabase should throw when not connected', () => {
      try {
        mongoHandlers.useDatabase('test');
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(error.message.includes('Not connected'), 'Should say not connected');
      }
    });

    it('aggregate should throw when not connected', async () => {
      try {
        await mongoHandlers.aggregate('test', []);
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(error.message, 'Should have error message');
      }
    });

    it('createIndex should throw when not connected', async () => {
      try {
        await mongoHandlers.createIndex('test', { field: 1 });
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(error.message, 'Should have error message');
      }
    });

    it('countDocuments should throw when not connected', async () => {
      try {
        await mongoHandlers.countDocuments('test');
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(error.message, 'Should have error message');
      }
    });

    it('distinct should throw when not connected', async () => {
      try {
        await mongoHandlers.distinct('test', 'field');
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(error.message, 'Should have error message');
      }
    });

    it('collectionStats should throw when not connected', async () => {
      try {
        await mongoHandlers.collectionStats('test');
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(error.message, 'Should have error message');
      }
    });

    it('databaseStats should throw when not connected', async () => {
      try {
        await mongoHandlers.databaseStats();
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(error.message, 'Should have error message');
      }
    });

    it('serverStatus should throw when not connected', async () => {
      try {
        await mongoHandlers.serverStatus();
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(error.message, 'Should have error message');
      }
    });

    it('findOne should throw when not connected', async () => {
      try {
        await mongoHandlers.findOne('test', {});
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(error.message, 'Should have error message');
      }
    });

    it('insertMany should throw when not connected', async () => {
      try {
        await mongoHandlers.insertMany('test', [{ a: 1 }]);
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(error.message, 'Should have error message');
      }
    });

    it('updateMany should throw when not connected', async () => {
      try {
        await mongoHandlers.updateMany('test', {}, { $set: { x: 1 } });
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(error.message, 'Should have error message');
      }
    });

    it('replaceOne should throw when not connected', async () => {
      try {
        await mongoHandlers.replaceOne('test', {}, { x: 1 });
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(error.message, 'Should have error message');
      }
    });

    it('findOneAndUpdate should throw when not connected', async () => {
      try {
        await mongoHandlers.findOneAndUpdate('test', {}, { $set: { x: 1 } });
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(error.message, 'Should have error message');
      }
    });

    it('deleteMany should throw when not connected', async () => {
      try {
        await mongoHandlers.deleteMany('test', {});
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(error.message, 'Should have error message');
      }
    });

    it('findOneAndDelete should throw when not connected', async () => {
      try {
        await mongoHandlers.findOneAndDelete('test', {});
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(error.message, 'Should have error message');
      }
    });

    it('createIndexes should throw when not connected', async () => {
      try {
        await mongoHandlers.createIndexes('test', [{ key: { field: 1 } }]);
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(error.message, 'Should have error message');
      }
    });

    it('listIndexes should throw when not connected', async () => {
      try {
        await mongoHandlers.listIndexes('test');
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(error.message, 'Should have error message');
      }
    });

    it('dropIndex should throw when not connected', async () => {
      try {
        await mongoHandlers.dropIndex('test', 'indexName');
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(error.message, 'Should have error message');
      }
    });

    it('dropAllIndexes should throw when not connected', async () => {
      try {
        await mongoHandlers.dropAllIndexes('test');
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(error.message, 'Should have error message');
      }
    });

    it('createCollection should throw when not connected', async () => {
      try {
        await mongoHandlers.createCollection('newCollection');
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(error.message, 'Should have error message');
      }
    });

    it('dropCollection should throw when not connected', async () => {
      try {
        await mongoHandlers.dropCollection('test');
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(error.message, 'Should have error message');
      }
    });

    it('disconnect should succeed even when not connected', async () => {
      const result = await mongoHandlers.disconnect();
      assert.strictEqual(result.success, true);
    });
  });
});

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
