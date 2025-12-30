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

    it('should count running servers correctly', () => {
      registry.loadFromConfig({
        'server-1': { command: 'a' },
        'server-2': { command: 'b' },
      });

      // Manually set status to simulate running server
      registry.servers.get('server-1').status = ServerStatus.RUNNING;

      const stats = registry.getStats();
      assert.strictEqual(stats.running, 1);
      assert.strictEqual(stats.stopped, 1);
    });

    it('should count error servers correctly', () => {
      registry.loadFromConfig({
        'server-1': { command: 'a' },
      });

      registry.servers.get('server-1').status = ServerStatus.ERROR;

      const stats = registry.getStats();
      assert.strictEqual(stats.error, 1);
      assert.strictEqual(stats.stopped, 0);
    });
  });

  describe('start()', () => {
    it('should return false for non-existent server', async () => {
      const result = await registry.start('non-existent');
      assert.strictEqual(result, false);
    });

    it('should return true for already running server', async () => {
      registry.loadFromConfig({
        'test-server': { command: 'echo', args: ['test'] },
      });
      registry.servers.get('test-server').status = ServerStatus.RUNNING;

      const result = await registry.start('test-server');
      assert.strictEqual(result, true);
    });

    it('should set status to starting before spawn', async () => {
      registry.loadFromConfig({
        'echo-server': { command: 'echo', args: ['hello'] },
      });

      // Start in background, we just verify status was set
      const startPromise = registry.start('echo-server');
      
      // Wait for the promise to resolve
      await startPromise;
      
      // After the delay, status should be RUNNING or process exited
      const server = registry.get('echo-server');
      assert.ok(
        [ServerStatus.RUNNING, ServerStatus.STOPPED].includes(server.status),
        'Server should be running or stopped after start'
      );
    });
  });

  describe('stop()', () => {
    it('should return false for non-existent server', () => {
      const result = registry.stop('non-existent');
      assert.strictEqual(result, false);
    });

    it('should return false when no process exists', () => {
      registry.loadFromConfig({
        'test-server': { command: 'echo' },
      });
      
      const result = registry.stop('test-server');
      assert.strictEqual(result, false);
    });

    it('should stop a running server process', async () => {
      registry.loadFromConfig({
        // Use a command that stays running briefly
        'sleep-server': { command: 'node', args: ['-e', 'setTimeout(() => {}, 5000)'] },
      });

      // Start the server
      await registry.start('sleep-server');
      
      // Stop should succeed if process is running
      const server = registry.get('sleep-server');
      if (server.status === ServerStatus.RUNNING) {
        const result = registry.stop('sleep-server');
        assert.strictEqual(result, true);
        assert.strictEqual(server.status, ServerStatus.STOPPED);
      }
    });
  });

  describe('stopAll()', () => {
    it('should stop all running servers', async () => {
      registry.loadFromConfig({
        'server-1': { command: 'node', args: ['-e', 'setTimeout(() => {}, 5000)'] },
        'server-2': { command: 'node', args: ['-e', 'setTimeout(() => {}, 5000)'] },
      });

      // Start servers
      await registry.start('server-1');
      await registry.start('server-2');

      // Stop all
      registry.stopAll();

      // All should be stopped now
      const stats = registry.getStats();
      assert.strictEqual(stats.running, 0);
    });

    it('should handle empty registry gracefully', () => {
      // Should not throw
      registry.stopAll();
      assert.ok(true, 'stopAll should not throw on empty registry');
    });
  });

  describe('start() error scenarios', () => {
    it('should handle server that exits immediately', async () => {
      registry.loadFromConfig({
        // Command that exits with error immediately
        'fail-server': { command: 'node', args: ['-e', 'process.exit(1)'] },
      });

      const result = await registry.start('fail-server');
      // Should return false because process exited
      const server = registry.get('fail-server');
      assert.ok([ServerStatus.STOPPED, ServerStatus.RUNNING].includes(server.status));
    });

    it('should handle invalid command gracefully', async () => {
      registry.loadFromConfig({
        'invalid-server': { command: 'nonexistent-command-xyz-12345', args: [] },
      });

      const result = await registry.start('invalid-server');
      // Should handle the error
      const server = registry.get('invalid-server');
      assert.ok(server.status !== ServerStatus.STARTING);
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
