/**
 * BambiSleep™ Church MCP Control Tower
 * Fetch MCP Server Wrapper - HTTP Requests
 */

import { createLogger } from '../utils/logger.js';

const logger = createLogger('fetch');

/**
 * HTTP Fetch client with enhanced features
 */
class FetchClient {
  constructor() {
    this.defaultHeaders = {
      'User-Agent': 'BambiSleep-MCP-Control-Tower/1.0',
    };
    this.timeout = 30000;
  }

  /**
   * Make HTTP request with timeout
   */
  async request(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: { ...this.defaultHeaders, ...options.headers },
        signal: controller.signal,
      });

      const contentType = response.headers.get('content-type') || '';
      let data;

      if (contentType.includes('application/json')) {
        data = await response.json();
      } else if (contentType.includes('text/')) {
        data = await response.text();
      } else {
        data = await response.arrayBuffer();
      }

      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        contentType,
        data,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * GET request
   */
  async get(url, options = {}) {
    return this.request(url, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post(url, body, options = {}) {
    const headers = { ...options.headers };
    let processedBody = body;

    if (typeof body === 'object' && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      processedBody = JSON.stringify(body);
    }

    return this.request(url, {
      ...options,
      method: 'POST',
      headers,
      body: processedBody,
    });
  }

  /**
   * PUT request
   */
  async put(url, body, options = {}) {
    const headers = { ...options.headers };
    let processedBody = body;

    if (typeof body === 'object' && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      processedBody = JSON.stringify(body);
    }

    return this.request(url, {
      ...options,
      method: 'PUT',
      headers,
      body: processedBody,
    });
  }

  /**
   * PATCH request
   */
  async patch(url, body, options = {}) {
    const headers = { ...options.headers };
    let processedBody = body;

    if (typeof body === 'object') {
      headers['Content-Type'] = 'application/json';
      processedBody = JSON.stringify(body);
    }

    return this.request(url, {
      ...options,
      method: 'PATCH',
      headers,
      body: processedBody,
    });
  }

  /**
   * DELETE request
   */
  async delete(url, options = {}) {
    return this.request(url, { ...options, method: 'DELETE' });
  }

  /**
   * HEAD request (get headers only)
   */
  async head(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      method: 'HEAD',
      headers: { ...this.defaultHeaders, ...options.headers },
    });

    return {
      ok: response.ok,
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
    };
  }

  /**
   * Download file as base64
   */
  async downloadBase64(url) {
    const response = await this.get(url);
    if (response.data instanceof ArrayBuffer) {
      const bytes = new Uint8Array(response.data);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return {
        ...response,
        base64: Buffer.from(response.data).toString('base64'),
      };
    }
    return response;
  }

  /**
   * Fetch and parse RSS/Atom feed
   */
  async fetchFeed(url) {
    const response = await this.get(url, {
      headers: { Accept: 'application/rss+xml, application/atom+xml, application/xml' },
    });
    return response;
  }

  /**
   * Check if URL is reachable
   */
  async ping(url) {
    try {
      const start = Date.now();
      const response = await this.head(url, { timeout: 5000 });
      return {
        reachable: response.ok,
        status: response.status,
        latency: Date.now() - start,
      };
    } catch (error) {
      return {
        reachable: false,
        error: error.message,
      };
    }
  }
}

// Singleton instance
export const fetchClient = new FetchClient();

/**
 * Fetch API handlers for REST endpoints
 */
export const fetchHandlers = {
  // Basic HTTP methods
  get: (url, options) => fetchClient.get(url, options),
  post: (url, body, options) => fetchClient.post(url, body, options),
  put: (url, body, options) => fetchClient.put(url, body, options),
  patch: (url, body, options) => fetchClient.patch(url, body, options),
  delete: (url, options) => fetchClient.delete(url, options),
  head: (url, options) => fetchClient.head(url, options),

  // Utility methods
  downloadBase64: (url) => fetchClient.downloadBase64(url),
  fetchFeed: (url) => fetchClient.fetchFeed(url),
  ping: (url) => fetchClient.ping(url),
};

export default fetchHandlers;
