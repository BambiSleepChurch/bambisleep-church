/**
 * BambiSleep™ Church MCP Control Tower
 * Rate Limiting Middleware
 */

import { createLogger } from './logger.js';

const logger = createLogger('rate-limit');

/**
 * In-memory rate limit store
 * Key: IP address, Value: { count, resetTime }
 */
const store = new Map();

/**
 * Cleanup interval reference (for graceful shutdown)
 */
let cleanupInterval = null;

/**
 * Start cleanup interval for expired entries
 */
function startCleanup() {
  if (cleanupInterval) return;
  
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, value] of store.entries()) {
      if (now > value.resetTime) {
        store.delete(key);
      }
    }
  }, 60000); // Clean every minute
  
  // Don't prevent process exit
  cleanupInterval.unref();
}

/**
 * Get client IP from request
 * @param {http.IncomingMessage} req 
 * @returns {string} Client IP address
 */
function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

/**
 * Create rate limiter middleware
 * @param {Object} options Rate limit options
 * @param {number} options.windowMs Time window in milliseconds
 * @param {number} options.maxRequests Max requests per window
 * @param {string[]} options.skipPaths Paths to skip rate limiting
 * @returns {Function} Middleware function
 */
export function createRateLimiter(options = {}) {
  const {
    windowMs = 60000,
    maxRequests = 100,
    skipPaths = ['/api/health'],
  } = options;

  // Start cleanup on first use
  startCleanup();

  logger.info(`Rate limiter: ${maxRequests} requests per ${windowMs / 1000}s`);

  /**
   * Rate limit middleware
   * @param {http.IncomingMessage} req 
   * @param {http.ServerResponse} res 
   * @returns {boolean} True if request should proceed, false if rate limited
   */
  return function rateLimit(req, res) {
    const path = new URL(req.url, `http://${req.headers.host}`).pathname;
    
    // Skip rate limiting for certain paths
    if (skipPaths.some(skip => path.startsWith(skip))) {
      return true;
    }

    const ip = getClientIp(req);
    const now = Date.now();

    let record = store.get(ip);

    if (!record || now > record.resetTime) {
      // New window
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      store.set(ip, record);
    } else {
      // Existing window
      record.count++;
    }

    // Set rate limit headers
    const remaining = Math.max(0, maxRequests - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetSeconds);

    // Check if over limit
    if (record.count > maxRequests) {
      logger.warn(`Rate limit exceeded for ${ip} (${record.count}/${maxRequests})`);
      
      res.writeHead(429, {
        'Content-Type': 'application/json',
        'Retry-After': resetSeconds,
      });
      res.end(JSON.stringify({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${resetSeconds} seconds.`,
        retryAfter: resetSeconds,
      }));
      
      return false;
    }

    return true;
  };
}

/**
 * Get current rate limit stats
 * @returns {Object} Rate limit statistics
 */
export function getRateLimitStats() {
  const entries = Array.from(store.entries());
  return {
    activeClients: entries.length,
    totalRequests: entries.reduce((sum, [, v]) => sum + v.count, 0),
    clients: entries.map(([ip, data]) => ({
      ip: ip.replace(/\d+\.\d+$/, 'x.x'), // Anonymize last two octets
      requests: data.count,
      resetsIn: Math.max(0, Math.ceil((data.resetTime - Date.now()) / 1000)),
    })),
  };
}

export default createRateLimiter;
