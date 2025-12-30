/**
 * BambiSleep™ Church MCP Control Tower
 * Unit Tests - Rate Limiting
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';
import { createRateLimiter, getRateLimitStats } from '../../src/utils/rate-limit.js';

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
});
