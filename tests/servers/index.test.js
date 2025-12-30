/**
 * BambiSleep™ Church MCP Control Tower
 * Unit Tests - Server Registry
 */

import assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { ServerRegistry, ServerStatus } from '../../src/servers/index.js';

describe('Server Registry', () => {
  let registry;

  beforeEach(() => {
    registry = new ServerRegistry();
  });

  describe('loadFromConfig()', () => {
    it('should load servers from config object', () => {
      const config = {
        'test-server': { command: 'echo', args: ['hello'] },
        'another-server': { command: 'node', args: ['-v'] },
      };

      registry.loadFromConfig(config);

      assert.strictEqual(registry.servers.size, 2);
    });

    it('should set initial status to stopped', () => {
      registry.loadFromConfig({
        'test-server': { command: 'echo' },
      });

      const server = registry.get('test-server');
      assert.strictEqual(server.status, ServerStatus.STOPPED);
    });
  });

  describe('get()', () => {
    it('should return server by name', () => {
      registry.loadFromConfig({
        'my-server': { command: 'test', args: ['arg1'] },
      });

      const server = registry.get('my-server');
      
      assert.ok(server);
      assert.strictEqual(server.name, 'my-server');
      assert.strictEqual(server.config.command, 'test');
    });

    it('should return undefined for non-existent server', () => {
      const server = registry.get('non-existent');
      assert.strictEqual(server, undefined);
    });
  });

  describe('getAll()', () => {
    it('should return array of all servers', () => {
      registry.loadFromConfig({
        'server-1': { command: 'a' },
        'server-2': { command: 'b' },
        'server-3': { command: 'c' },
      });

      const servers = registry.getAll();
      
      assert.ok(Array.isArray(servers));
      assert.strictEqual(servers.length, 3);
    });

    it('should return empty array when no servers', () => {
      const servers = registry.getAll();
      assert.deepStrictEqual(servers, []);
    });
  });

  describe('getStats()', () => {
    it('should return stats object with counts', () => {
      registry.loadFromConfig({
        'server-1': { command: 'a' },
        'server-2': { command: 'b' },
      });

      const stats = registry.getStats();
      
      assert.strictEqual(stats.total, 2);
      assert.strictEqual(stats.stopped, 2);
      assert.strictEqual(stats.running, 0);
      assert.strictEqual(stats.error, 0);
    });
  });

  describe('ServerStatus', () => {
    it('should have expected status values', () => {
      assert.strictEqual(ServerStatus.RUNNING, 'running');
      assert.strictEqual(ServerStatus.STOPPED, 'stopped');
      assert.strictEqual(ServerStatus.STARTING, 'starting');
      assert.strictEqual(ServerStatus.ERROR, 'error');
    });
  });
});
