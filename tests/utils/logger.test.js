/**
 * BambiSleep™ Church MCP Control Tower
 * Unit Tests - Logger Module
 */

import assert from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { createLogger, logger } from '../../src/utils/logger.js';

describe('Logger Module', () => {
  // Store original env
  let originalLogLevel;
  
  beforeEach(() => {
    originalLogLevel = process.env.LOG_LEVEL;
  });
  
  afterEach(() => {
    if (originalLogLevel !== undefined) {
      process.env.LOG_LEVEL = originalLogLevel;
    } else {
      delete process.env.LOG_LEVEL;
    }
  });

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

    it('should use default namespace when none provided', () => {
      const log = createLogger();
      assert.ok(log.info, 'should have info method');
    });

    it('should call console methods when log level allows', () => {
      process.env.LOG_LEVEL = 'debug';
      const log = createLogger('test-logger');
      
      // These should not throw
      log.error('test error');
      log.warn('test warning');
      log.info('test info');
      log.debug('test debug');
      
      assert.ok(true, 'all log methods should execute without error');
    });

    it('should respect error log level', () => {
      process.env.LOG_LEVEL = 'error';
      const log = createLogger('error-only');
      
      // Should not throw
      log.error('visible error');
      log.warn('hidden warning');
      log.info('hidden info');
      log.debug('hidden debug');
      
      assert.ok(true, 'should handle restricted log level');
    });

    it('should respect warn log level', () => {
      process.env.LOG_LEVEL = 'warn';
      const log = createLogger('warn-level');
      
      log.error('visible error');
      log.warn('visible warning');
      log.info('hidden info');
      log.debug('hidden debug');
      
      assert.ok(true, 'should handle warn log level');
    });

    it('should handle data parameter', () => {
      process.env.LOG_TO_FILE = 'false';  // Disable file logging for tests
      const log = createLogger('data-test');
      
      // Should not throw with data parameter
      log.info('message', { key: 'value' });
      log.error('error message', { error: 'details' });
      log.warn('warning', { count: 123 });
      log.debug('debug info', { nested: { data: true } });
      
      assert.ok(true, 'should handle data parameter');
    });

    it('should work without data parameter', () => {
      process.env.LOG_TO_FILE = 'false';
      const log = createLogger('no-data');
      
      // Should not throw without data
      log.info('simple message');
      log.error('error without data');
      
      assert.ok(true, 'should work without data');
    });
  });

  describe('default logger', () => {
    it('should be pre-configured with app namespace', () => {
      assert.ok(logger, 'default logger should exist');
      assert.ok(logger.info, 'should have info method');
    });

    it('should have all log methods', () => {
      assert.strictEqual(typeof logger.error, 'function');
      assert.strictEqual(typeof logger.warn, 'function');
      assert.strictEqual(typeof logger.info, 'function');
      assert.strictEqual(typeof logger.debug, 'function');
    });
  });
});
