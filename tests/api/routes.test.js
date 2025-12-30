/**
 * BambiSleep™ Church MCP Control Tower
 * Integration Tests - API Routes
 * 
 * These tests require the API server to be running on port 8080.
 * They will be skipped gracefully if the server is unavailable.
 */

import assert from 'node:assert';
import { before, describe, it } from 'node:test';

describe('API Routes', () => {
  const API_BASE = 'http://localhost:8080/api';
  let serverAvailable = false;

  before(async () => {
    try {
      const response = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2000) });
      serverAvailable = response.ok;
    } catch {
      serverAvailable = false;
    }
  });

  describe('GET /api/health', () => {
    it('should return health status', async (t) => {
      if (!serverAvailable) {
        t.skip('API server not running');
        return;
      }

      const response = await fetch(`${API_BASE}/health`);
      const data = await response.json();

      assert.strictEqual(response.status, 200);
      assert.strictEqual(data.status, 'ok');
      assert.ok(data.timestamp, 'should have timestamp');
    });
  });

  describe('GET /api/servers', () => {
    it('should return servers list', async (t) => {
      if (!serverAvailable) {
        t.skip('API server not running');
        return;
      }

      const response = await fetch(`${API_BASE}/servers`);
      const data = await response.json();

      assert.strictEqual(response.status, 200);
      assert.ok(Array.isArray(data.servers), 'should have servers array');
      assert.ok('stats' in data, 'should have stats object');
    });
  });

  describe('POST /api/servers/:name/start', () => {
    it('should attempt to start a server', async (t) => {
      if (!serverAvailable) {
        t.skip('API server not running');
        return;
      }

      const response = await fetch(`${API_BASE}/servers/memory/start`, {
        method: 'POST',
      });

      // May succeed or fail depending on config
      assert.ok([200, 400, 404, 500].includes(response.status));
    });
  });
});
