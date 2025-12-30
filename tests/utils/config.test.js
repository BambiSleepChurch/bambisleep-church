/**
 * BambiSleep™ Church MCP Control Tower
 * Unit Tests - Config Module
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';
import { getConfig, loadMcpServers } from '../../src/utils/config.js';

describe('Config Module', () => {
  describe('getConfig()', () => {
    it('should return configuration object with required properties', () => {
      const config = getConfig();
      
      assert.ok(config.dashboard, 'should have dashboard config');
      assert.ok(config.api, 'should have api config');
      assert.ok(config.mcp, 'should have mcp config');
      assert.ok(config.env, 'should have env config');
    });

    it('should have correct default ports', () => {
      const config = getConfig();
      
      assert.strictEqual(config.dashboard.port, 3000, 'dashboard port should be 3000');
      assert.strictEqual(config.api.port, 8080, 'api port should be 8080');
    });

    it('should detect development environment by default', () => {
      const config = getConfig();
      
      assert.strictEqual(config.env.isDev, true, 'should be development by default');
    });

    it('should have database configuration', () => {
      const config = getConfig();
      
      assert.ok(config.database, 'should have database config');
      assert.ok(config.database.mongodb, 'should have mongodb config');
      assert.ok(config.database.postgres, 'should have postgres config');
    });

    it('should have services configuration', () => {
      const config = getConfig();
      
      assert.ok(config.services, 'should have services config');
      assert.ok('github' in config.services, 'should have github service');
      assert.ok('stripe' in config.services, 'should have stripe service');
    });
  });

  describe('loadMcpServers()', () => {
    it('should return object (possibly empty)', () => {
      const servers = loadMcpServers();
      assert.strictEqual(typeof servers, 'object');
    });
  });
});
