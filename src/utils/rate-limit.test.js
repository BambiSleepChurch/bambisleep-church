/**
 * BambiSleep™ Church MCP Control Tower
 * Unit Tests - Rate Limiting
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';
import { createRateLimiter, getRateLimitStats } from './rate-limit.js';

describe('Rate Limit Module', () => {
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
      
      assert.strictEqual(res.headers['X-RateLimit-Limit'], 100);
      assert.strictEqual(res.headers['X-RateLimit-Remaining'], 99);
      assert.ok(res.headers['X-RateLimit-Reset'] > 0);
    });
  });

  describe('getRateLimitStats()', () => {
    it('should return stats object', () => {
      const stats = getRateLimitStats();
      
      assert.ok(typeof stats === 'object');
      assert.ok(typeof stats.activeClients === 'number');
      assert.ok(typeof stats.totalRequests === 'number');
      assert.ok(Array.isArray(stats.clients));
    });
  });
});
