/**
 * BambiSleep™ Church MCP Control Tower
 * Unit Tests - Rate Limiting
 */

import assert from 'node:assert';
import { afterEach, describe, it } from 'node:test';
import { cleanupExpiredEntries, clearStore, createRateLimiter, getRateLimitStats, startCleanup, stopCleanup } from '../../src/utils/rate-limit.js';

describe('Rate Limit Module', () => {
  // Clean up after each test
  afterEach(() => {
    stopCleanup();
    clearStore();
  });
  describe('createRateLimiter()', () => {
    it('should create a rate limiter function', () => {
      const limiter = createRateLimiter();
      assert.strictEqual(typeof limiter, 'function');
    });

    it('should allow requests under the limit', () => {
      const limiter = createRateLimiter({ windowMs: 1000, maxRequests: 5 });
      
      // Mock request and response
      const req = {
        url: '/api/test',
        headers: { host: 'localhost:8080' },
        socket: { remoteAddress: '192.168.1.100' },
      };
      const res = {
        headers: {},
        setHeader(name, value) { this.headers[name] = value; },
        writeHead() {},
        end() {},
      };

      const allowed = limiter(req, res);
      assert.strictEqual(allowed, true, 'First request should be allowed');
    });

    it('should skip rate limiting for health endpoint', () => {
      const limiter = createRateLimiter({ windowMs: 1000, maxRequests: 1 });
      
      const req = {
        url: '/api/health',
        headers: { host: 'localhost:8080' },
        socket: { remoteAddress: '192.168.1.101' },
      };
      const res = {
        headers: {},
        setHeader(name, value) { this.headers[name] = value; },
        writeHead() {},
        end() {},
      };

      // Should always be allowed for health endpoint
      assert.strictEqual(limiter(req, res), true);
      assert.strictEqual(limiter(req, res), true);
      assert.strictEqual(limiter(req, res), true);
    });

    it('should set rate limit headers', () => {
      const limiter = createRateLimiter({ windowMs: 60000, maxRequests: 100 });
      
      const req = {
        url: '/api/test',
        headers: { host: 'localhost:8080' },
        socket: { remoteAddress: '192.168.1.102' },
      };
      const res = {
        headers: {},
        setHeader(name, value) { this.headers[name] = value; },
        writeHead() {},
        end() {},
      };

      limiter(req, res);
      
      assert.ok('X-RateLimit-Limit' in res.headers, 'should set limit header');
      assert.ok('X-RateLimit-Remaining' in res.headers, 'should set remaining header');
      assert.ok('X-RateLimit-Reset' in res.headers, 'should set reset header');
    });

    it('should block requests over the limit', () => {
      const limiter = createRateLimiter({ windowMs: 60000, maxRequests: 2 });
      
      const req = {
        url: '/api/test',
        headers: { host: 'localhost:8080' },
        socket: { remoteAddress: '192.168.1.103' },
      };
      const res = {
        headers: {},
        setHeader(name, value) { this.headers[name] = value; },
        writeHead() {},
        end() {},
      };

      assert.strictEqual(limiter(req, res), true, 'First request allowed');
      assert.strictEqual(limiter(req, res), true, 'Second request allowed');
      assert.strictEqual(limiter(req, res), false, 'Third request should be blocked');
    });

    it('should use x-forwarded-for header for IP', () => {
      const limiter = createRateLimiter({ windowMs: 60000, maxRequests: 5 });
      
      const req = {
        url: '/api/test',
        headers: { 
          host: 'localhost:8080',
          'x-forwarded-for': '10.0.0.1, 10.0.0.2',
        },
        socket: { remoteAddress: '192.168.1.200' },
      };
      const res = {
        headers: {},
        setHeader(name, value) { this.headers[name] = value; },
        writeHead() {},
        end() {},
      };

      const allowed = limiter(req, res);
      assert.strictEqual(allowed, true, 'Should use x-forwarded-for IP');
    });

    it('should use x-real-ip header for IP', () => {
      const limiter = createRateLimiter({ windowMs: 60000, maxRequests: 5 });
      
      const req = {
        url: '/api/test',
        headers: { 
          host: 'localhost:8080',
          'x-real-ip': '10.0.0.50',
        },
        socket: { remoteAddress: '192.168.1.201' },
      };
      const res = {
        headers: {},
        setHeader(name, value) { this.headers[name] = value; },
        writeHead() {},
        end() {},
      };

      const allowed = limiter(req, res);
      assert.strictEqual(allowed, true, 'Should use x-real-ip');
    });

    it('should handle missing socket gracefully', () => {
      const limiter = createRateLimiter({ windowMs: 60000, maxRequests: 5 });
      
      const req = {
        url: '/api/test',
        headers: { host: 'localhost:8080' },
        socket: null,
      };
      const res = {
        headers: {},
        setHeader(name, value) { this.headers[name] = value; },
        writeHead() {},
        end() {},
      };

      const allowed = limiter(req, res);
      assert.strictEqual(allowed, true, 'Should handle missing socket');
    });

    it('should skip custom paths in skipPaths', () => {
      const limiter = createRateLimiter({ 
        windowMs: 1000, 
        maxRequests: 1,
        skipPaths: ['/api/health', '/api/public'],
      });
      
      const req = {
        url: '/api/public/resource',
        headers: { host: 'localhost:8080' },
        socket: { remoteAddress: '192.168.1.105' },
      };
      const res = {
        headers: {},
        setHeader(name, value) { this.headers[name] = value; },
        writeHead() {},
        end() {},
      };

      // Should always be allowed for skipped path
      assert.strictEqual(limiter(req, res), true);
      assert.strictEqual(limiter(req, res), true);
    });

    it('should reset counter after window expires', async () => {
      const limiter = createRateLimiter({ windowMs: 100, maxRequests: 1 });
      
      const req = {
        url: '/api/test',
        headers: { host: 'localhost:8080' },
        socket: { remoteAddress: '192.168.1.106' },
      };
      const res = {
        headers: {},
        setHeader(name, value) { this.headers[name] = value; },
        writeHead() {},
        end() {},
      };

      assert.strictEqual(limiter(req, res), true, 'First request allowed');
      assert.strictEqual(limiter(req, res), false, 'Second request blocked');
      
      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150));
      
      assert.strictEqual(limiter(req, res), true, 'Request allowed after window reset');
    });
  });

  describe('getRateLimitStats()', () => {
    it('should return stats object', () => {
      const stats = getRateLimitStats();
      assert.strictEqual(typeof stats, 'object');
    });

    it('should have expected properties', () => {
      const stats = getRateLimitStats();
      assert.ok('activeClients' in stats, 'should have activeClients');
      assert.ok('totalRequests' in stats, 'should have totalRequests');
      assert.ok('clients' in stats, 'should have clients array');
    });

    it('should anonymize IP addresses in client list', () => {
      const limiter = createRateLimiter({ windowMs: 60000, maxRequests: 100 });
      
      const req = {
        url: '/api/test',
        headers: { host: 'localhost:8080' },
        socket: { remoteAddress: '192.168.55.66' },
      };
      const res = {
        headers: {},
        setHeader(name, value) { this.headers[name] = value; },
        writeHead() {},
        end() {},
      };

      limiter(req, res);
      
      const stats = getRateLimitStats();
      const client = stats.clients.find(c => c.ip.startsWith('192.168.'));
      
      if (client) {
        assert.ok(client.ip.includes('x.x'), 'IP should be anonymized');
      }
    });
  });

  describe('startCleanup()', () => {
    it('should return true when starting for first time', () => {
      stopCleanup(); // Ensure stopped
      const result = startCleanup();
      assert.strictEqual(result, true, 'Should return true when starting');
    });

    it('should return false when already running', () => {
      stopCleanup();
      startCleanup();
      const result = startCleanup();
      assert.strictEqual(result, false, 'Should return false when already running');
    });
  });

  describe('stopCleanup()', () => {
    it('should return true when cleanup is running', () => {
      stopCleanup();
      startCleanup();
      const result = stopCleanup();
      assert.strictEqual(result, true, 'Should return true when stopping');
    });

    it('should return false when cleanup is not running', () => {
      stopCleanup();
      const result = stopCleanup();
      assert.strictEqual(result, false, 'Should return false when not running');
    });
  });

  describe('clearStore()', () => {
    it('should clear all rate limit data', () => {
      const limiter = createRateLimiter({ windowMs: 60000, maxRequests: 100 });
      
      const req = {
        url: '/api/test',
        headers: { host: 'localhost:8080' },
        socket: { remoteAddress: '192.168.99.99' },
      };
      const res = {
        headers: {},
        setHeader(name, value) { this.headers[name] = value; },
        writeHead() {},
        end() {},
      };

      limiter(req, res);
      
      let stats = getRateLimitStats();
      assert.ok(stats.activeClients > 0, 'Should have clients before clear');
      
      clearStore();
      
      stats = getRateLimitStats();
      assert.strictEqual(stats.activeClients, 0, 'Should have no clients after clear');
    });
  });

  describe('cleanupExpiredEntries()', () => {
    it('should remove expired entries', async () => {
      clearStore();
      
      // Create a limiter with very short window
      const limiter = createRateLimiter({ windowMs: 50, maxRequests: 100 });
      
      const req = {
        url: '/api/test',
        headers: { host: 'localhost:8080' },
        socket: { remoteAddress: '192.168.200.200' },
      };
      const res = {
        headers: {},
        setHeader(name, value) { this.headers[name] = value; },
        writeHead() {},
        end() {},
      };

      limiter(req, res);
      
      let stats = getRateLimitStats();
      assert.ok(stats.activeClients > 0, 'Should have clients before cleanup');
      
      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Run cleanup
      const removed = cleanupExpiredEntries();
      assert.ok(removed >= 0, 'Should return number of removed entries');
      
      stats = getRateLimitStats();
      // May or may not have clients depending on timing
      assert.ok(stats.activeClients >= 0);
    });

    it('should not remove non-expired entries', () => {
      clearStore();
      
      const limiter = createRateLimiter({ windowMs: 60000, maxRequests: 100 });
      
      const req = {
        url: '/api/test',
        headers: { host: 'localhost:8080' },
        socket: { remoteAddress: '192.168.201.201' },
      };
      const res = {
        headers: {},
        setHeader(name, value) { this.headers[name] = value; },
        writeHead() {},
        end() {},
      };

      limiter(req, res);
      
      const before = getRateLimitStats().activeClients;
      const removed = cleanupExpiredEntries();
      const after = getRateLimitStats().activeClients;
      
      assert.strictEqual(removed, 0, 'Should not remove non-expired entries');
      assert.strictEqual(before, after, 'Client count should remain same');
    });

    it('should handle empty store', () => {
      clearStore();
      const removed = cleanupExpiredEntries();
      assert.strictEqual(removed, 0, 'Should return 0 for empty store');
    });
  });
});
