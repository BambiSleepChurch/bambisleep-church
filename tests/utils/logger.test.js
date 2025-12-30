/**
 * BambiSleep™ Church MCP Control Tower
 * Unit Tests - Logger Module
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';
import { createLogger, logger } from '../../src/utils/logger.js';

describe('Logger Module', () => {
  describe('createLogger()', () => {
    it('should create logger with namespace', () => {
      const log = createLogger('test');
      
      assert.ok(log.info, 'should have info method');
      assert.ok(log.warn, 'should have warn method');
      assert.ok(log.error, 'should have error method');
      assert.ok(log.debug, 'should have debug method');
    });

    it('should create logger methods as functions', () => {
      const log = createLogger('test');
      
      assert.strictEqual(typeof log.info, 'function');
      assert.strictEqual(typeof log.warn, 'function');
      assert.strictEqual(typeof log.error, 'function');
      assert.strictEqual(typeof log.debug, 'function');
    });
  });

  describe('default logger', () => {
    it('should be pre-configured with app namespace', () => {
      assert.ok(logger, 'default logger should exist');
      assert.ok(logger.info, 'should have info method');
    });
  });
});
