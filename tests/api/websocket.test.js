/**
 * BambiSleep™ Church MCP Control Tower
 * Unit Tests - WebSocket Module
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';
import {
    MessageTypes,
    getWebSocketStats,
} from '../../src/api/websocket.js';

describe('WebSocket Module', () => {
  describe('MessageTypes', () => {
    it('should define server event types', () => {
      assert.strictEqual(MessageTypes.SERVER_STATUS, 'server:status');
      assert.strictEqual(MessageTypes.SERVER_STARTED, 'server:started');
      assert.strictEqual(MessageTypes.SERVER_STOPPED, 'server:stopped');
      assert.strictEqual(MessageTypes.SERVER_ERROR, 'server:error');
      assert.strictEqual(MessageTypes.SERVER_LOG, 'server:log');
    });

    it('should define system event types', () => {
      assert.strictEqual(MessageTypes.HEALTH_UPDATE, 'health:update');
      assert.strictEqual(MessageTypes.STATS_UPDATE, 'stats:update');
    });

    it('should define client command types', () => {
      assert.strictEqual(MessageTypes.SUBSCRIBE, 'subscribe');
      assert.strictEqual(MessageTypes.UNSUBSCRIBE, 'unsubscribe');
      assert.strictEqual(MessageTypes.PING, 'ping');
      assert.strictEqual(MessageTypes.PONG, 'pong');
    });

    it('should have all expected message types', () => {
      const expectedTypes = [
        'SERVER_STATUS', 'SERVER_STARTED', 'SERVER_STOPPED', 
        'SERVER_ERROR', 'SERVER_LOG', 'HEALTH_UPDATE', 
        'STATS_UPDATE', 'SUBSCRIBE', 'UNSUBSCRIBE', 'PING', 'PONG'
      ];

      for (const type of expectedTypes) {
        assert.ok(type in MessageTypes, `Missing message type: ${type}`);
      }
    });
  });

  describe('getWebSocketStats()', () => {
    it('should return stats object', () => {
      const stats = getWebSocketStats();

      assert.strictEqual(typeof stats, 'object');
    });

    it('should have connectedClients property', () => {
      const stats = getWebSocketStats();

      assert.ok('connectedClients' in stats);
      assert.strictEqual(typeof stats.connectedClients, 'number');
      assert.ok(stats.connectedClients >= 0);
    });

    it('should have clients array property', () => {
      const stats = getWebSocketStats();

      assert.ok('clients' in stats);
      assert.ok(Array.isArray(stats.clients));
    });

    it('should return zero clients when no connections', () => {
      const stats = getWebSocketStats();

      // Without a running server, there should be no clients
      assert.strictEqual(stats.connectedClients, 0);
      assert.strictEqual(stats.clients.length, 0);
    });
  });

  describe('Message Type Values', () => {
    it('should use colon-separated namespacing', () => {
      const serverEvents = [
        MessageTypes.SERVER_STATUS,
        MessageTypes.SERVER_STARTED,
        MessageTypes.SERVER_STOPPED,
        MessageTypes.SERVER_ERROR,
        MessageTypes.SERVER_LOG,
      ];

      for (const event of serverEvents) {
        assert.ok(event.startsWith('server:'), `${event} should start with 'server:'`);
      }
    });

    it('should use consistent naming convention', () => {
      // All values should be lowercase with colons
      for (const [key, value] of Object.entries(MessageTypes)) {
        assert.strictEqual(value, value.toLowerCase(), `${key} value should be lowercase`);
        assert.ok(!value.includes('_'), `${key} value should use colons, not underscores`);
      }
    });
  });
});
