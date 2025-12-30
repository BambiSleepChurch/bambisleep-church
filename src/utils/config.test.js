/**
 * BambiSleep™ Church MCP Control Tower
 * Unit Tests - Config Module
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';
import { getConfig, loadMcpServers } from './config.js';

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
      
      assert.strictEqual(config.env.isDev, true, 'should be in dev mode');
    });
  });

  describe('loadMcpServers()', () => {
    it('should return an object', () => {
      const servers = loadMcpServers();
      
      assert.strictEqual(typeof servers, 'object', 'should return object');
    });

    it('should load servers from .vscode/settings.json', () => {
      const servers = loadMcpServers();
      
      // Should have at least the core servers
      const serverNames = Object.keys(servers);
      assert.ok(serverNames.length > 0, 'should have at least one server');
    });
  });
});
