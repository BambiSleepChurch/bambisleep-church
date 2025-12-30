/**
 * BambiSleep™ Church MCP Control Tower
 * Unit Tests - Config Module
 */

import assert from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { getConfig, loadMcpServers, stripJsonc } from '../../src/utils/config.js';

describe('Config Module', () => {
  // Store original env vars
  let originalEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original env vars
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    }
    for (const [key, value] of Object.entries(originalEnv)) {
      process.env[key] = value;
    }
  });

  describe('stripJsonc()', () => {
    it('should pass through valid JSON unchanged', () => {
      const json = '{"key": "value"}';
      const result = stripJsonc(json);
      assert.strictEqual(result, json);
    });

    it('should remove single-line comments', () => {
      const jsonc = `{
        // This is a comment
        "key": "value"
      }`;
      const result = stripJsonc(jsonc);
      const parsed = JSON.parse(result);
      assert.strictEqual(parsed.key, 'value');
    });

    it('should remove multi-line comments', () => {
      const jsonc = `{
        /* This is a 
           multi-line comment */
        "key": "value"
      }`;
      const result = stripJsonc(jsonc);
      const parsed = JSON.parse(result);
      assert.strictEqual(parsed.key, 'value');
    });

    it('should remove trailing commas', () => {
      const jsonc = `{
        "key": "value",
      }`;
      const result = stripJsonc(jsonc);
      const parsed = JSON.parse(result);
      assert.strictEqual(parsed.key, 'value');
    });

    it('should handle escaped characters in strings', () => {
      const jsonc = '{"key": "value with \\"quotes\\""}';
      const result = stripJsonc(jsonc);
      const parsed = JSON.parse(result);
      assert.strictEqual(parsed.key, 'value with "quotes"');
    });

    it('should handle backslashes in strings', () => {
      const jsonc = '{"path": "C:\\\\Users\\\\test"}';
      const result = stripJsonc(jsonc);
      const parsed = JSON.parse(result);
      assert.strictEqual(parsed.path, 'C:\\Users\\test');
    });

    it('should not strip slashes inside strings', () => {
      const jsonc = '{"url": "http://example.com"}';
      const result = stripJsonc(jsonc);
      const parsed = JSON.parse(result);
      assert.strictEqual(parsed.url, 'http://example.com');
    });

    it('should handle comment-like content in strings', () => {
      const jsonc = '{"text": "// not a comment"}';
      const result = stripJsonc(jsonc);
      const parsed = JSON.parse(result);
      assert.strictEqual(parsed.text, '// not a comment');
    });

    it('should handle multi-line comment markers in strings', () => {
      const jsonc = '{"text": "/* not a comment */"}';
      const result = stripJsonc(jsonc);
      const parsed = JSON.parse(result);
      assert.strictEqual(parsed.text, '/* not a comment */');
    });

    it('should handle empty input', () => {
      const result = stripJsonc('');
      assert.strictEqual(result, '');
    });

    it('should handle complex JSONC with all features', () => {
      const jsonc = `{
        // Single line comment
        "name": "test",
        /* Multi
           line */
        "path": "C:\\\\Program Files",
        "url": "http://example.com", // inline comment
        "trailing": true,
      }`;
      const result = stripJsonc(jsonc);
      const parsed = JSON.parse(result);
      assert.strictEqual(parsed.name, 'test');
      assert.strictEqual(parsed.trailing, true);
    });
  });

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

    it('should respect environment variable overrides for ports', () => {
      process.env.DASHBOARD_PORT = '4000';
      process.env.API_PORT = '9000';
      
      const config = getConfig();
      
      assert.strictEqual(config.dashboard.port, 4000);
      assert.strictEqual(config.api.port, 9000);
    });

    it('should respect environment variable overrides for hosts', () => {
      process.env.DASHBOARD_HOST = '127.0.0.1';
      process.env.API_HOST = '127.0.0.1';
      
      const config = getConfig();
      
      assert.strictEqual(config.dashboard.host, '127.0.0.1');
      assert.strictEqual(config.api.host, '127.0.0.1');
    });

    it('should have rate limit configuration', () => {
      const config = getConfig();
      
      assert.ok(config.rateLimit, 'should have rateLimit config');
      assert.ok(config.rateLimit.windowMs, 'should have windowMs');
      assert.ok(config.rateLimit.maxRequests, 'should have maxRequests');
    });

    it('should have security configuration', () => {
      const config = getConfig();
      
      assert.ok(config.security, 'should have security config');
      assert.ok(Array.isArray(config.security.corsOrigins), 'corsOrigins should be array');
    });

    it('should detect production environment', () => {
      process.env.NODE_ENV = 'production';
      
      const config = getConfig();
      
      assert.strictEqual(config.env.isDev, false);
      assert.strictEqual(config.env.nodeEnv, 'production');
    });

    it('should use custom log level from env', () => {
      process.env.LOG_LEVEL = 'debug';
      
      const config = getConfig();
      
      assert.strictEqual(config.env.logLevel, 'debug');
    });

    it('should parse CORS origins from comma-separated string', () => {
      process.env.CORS_ORIGINS = 'http://localhost:3000,http://example.com';
      
      const config = getConfig();
      
      assert.strictEqual(config.security.corsOrigins.length, 2);
      assert.ok(config.security.corsOrigins.includes('http://localhost:3000'));
      assert.ok(config.security.corsOrigins.includes('http://example.com'));
    });

    it('should have sqlite configuration', () => {
      const config = getConfig();
      
      assert.ok(config.database.sqlite, 'should have sqlite config');
      assert.ok(config.database.sqlite.path, 'should have sqlite path');
    });

    it('should have postgres configuration', () => {
      const config = getConfig();
      
      assert.ok(config.database.postgres.host, 'should have host');
      assert.ok(config.database.postgres.port, 'should have port');
      assert.ok(config.database.postgres.user, 'should have user');
      assert.ok(config.database.postgres.database, 'should have database');
    });

    it('should override postgres config from environment', () => {
      process.env.POSTGRES_HOST = 'custom-host';
      process.env.POSTGRES_PORT = '5433';
      process.env.POSTGRES_USER = 'custom-user';
      process.env.POSTGRES_DB = 'custom-db';
      
      const config = getConfig();
      
      assert.strictEqual(config.database.postgres.host, 'custom-host');
      assert.strictEqual(config.database.postgres.port, 5433);
      assert.strictEqual(config.database.postgres.user, 'custom-user');
      assert.strictEqual(config.database.postgres.database, 'custom-db');
    });

    it('should have huggingface service config', () => {
      const config = getConfig();
      
      assert.ok('huggingface' in config.services);
      assert.ok('token' in config.services.huggingface);
    });

    it('should have clarity service config', () => {
      const config = getConfig();
      
      assert.ok('clarity' in config.services);
      assert.ok('projectId' in config.services.clarity);
    });

    it('should override rate limit from environment', () => {
      process.env.RATE_LIMIT_WINDOW_MS = '30000';
      process.env.RATE_LIMIT_MAX_REQUESTS = '50';
      
      const config = getConfig();
      
      assert.strictEqual(config.rateLimit.windowMs, 30000);
      assert.strictEqual(config.rateLimit.maxRequests, 50);
    });
  });

  describe('loadMcpServers()', () => {
    it('should return object (possibly empty)', () => {
      const servers = loadMcpServers();
      assert.strictEqual(typeof servers, 'object');
    });

    it('should not throw when config file exists', () => {
      // Should not throw
      const servers = loadMcpServers();
      assert.ok(servers !== undefined, 'should return something');
    });
  });
});
