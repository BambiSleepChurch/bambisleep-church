/**
 * BambiSleep™ Church MCP Control Tower
 * Unit Tests - Server Registry
 */

import assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { ServerRegistry, ServerStatus } from './index.js';

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
        'test-server': { command: 'echo', args: [] },
      });

      const server = registry.get('test-server');
      assert.strictEqual(server.status, ServerStatus.STOPPED);
    });
  });

  describe('getAll()', () => {
    it('should return array of all servers', () => {
      registry.loadFromConfig({
        'server-1': { command: 'echo', args: [] },
        'server-2': { command: 'echo', args: [] },
      });

      const servers = registry.getAll();

      assert.ok(Array.isArray(servers));
      assert.strictEqual(servers.length, 2);
    });
  });

  describe('get()', () => {
    it('should return specific server by name', () => {
      registry.loadFromConfig({
        'my-server': { command: 'test', args: ['arg1'] },
      });

      const server = registry.get('my-server');

      assert.ok(server);
      assert.strictEqual(server.name, 'my-server');
      assert.strictEqual(server.config.command, 'test');
    });

    it('should return undefined for unknown server', () => {
      const server = registry.get('nonexistent');
      assert.strictEqual(server, undefined);
    });
  });

  describe('getStats()', () => {
    it('should return correct statistics', () => {
      registry.loadFromConfig({
        'server-1': { command: 'echo', args: [] },
        'server-2': { command: 'echo', args: [] },
        'server-3': { command: 'echo', args: [] },
      });

      const stats = registry.getStats();

      assert.strictEqual(stats.total, 3);
      assert.strictEqual(stats.stopped, 3);
      assert.strictEqual(stats.running, 0);
      assert.strictEqual(stats.error, 0);
    });
  });

  describe('ServerStatus', () => {
    it('should have all required status values', () => {
      assert.strictEqual(ServerStatus.STOPPED, 'stopped');
      assert.strictEqual(ServerStatus.STARTING, 'starting');
      assert.strictEqual(ServerStatus.RUNNING, 'running');
      assert.strictEqual(ServerStatus.ERROR, 'error');
    });
  });
});
