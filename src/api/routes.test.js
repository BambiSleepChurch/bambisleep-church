/**
 * BambiSleep™ Church MCP Control Tower
 * Unit Tests - API Routes
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';

describe('API Routes', () => {
  const API_BASE = 'http://localhost:8080/api';

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      try {
        const response = await fetch(`${API_BASE}/health`);
        const data = await response.json();

        assert.strictEqual(response.status, 200);
        assert.strictEqual(data.status, 'ok');
        assert.ok(data.timestamp, 'should have timestamp');
      } catch (error) {
        // Skip if server not running
        if (error.cause?.code === 'ECONNREFUSED') {
          console.log('  ⏭ Skipped: API server not running');
          return;
        }
        throw error;
      }
    });
  });

  describe('GET /api/servers', () => {
    it('should return server list', async () => {
      try {
        const response = await fetch(`${API_BASE}/servers`);
        const data = await response.json();

        assert.strictEqual(response.status, 200);
        assert.ok(Array.isArray(data.servers), 'should have servers array');
        assert.ok(data.stats, 'should have stats object');
        assert.ok(typeof data.stats.total === 'number', 'stats.total should be number');
      } catch (error) {
        if (error.cause?.code === 'ECONNREFUSED') {
          console.log('  ⏭ Skipped: API server not running');
          return;
        }
        throw error;
      }
    });
  });

  describe('GET /api/unknown', () => {
    it('should return 404 for unknown routes', async () => {
      try {
        const response = await fetch(`${API_BASE}/unknown`);
        const data = await response.json();

        assert.strictEqual(response.status, 404);
        assert.ok(data.error, 'should have error message');
      } catch (error) {
        if (error.cause?.code === 'ECONNREFUSED') {
          console.log('  ⏭ Skipped: API server not running');
          return;
        }
        throw error;
      }
    });
  });
});
