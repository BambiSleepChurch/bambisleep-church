/**
 * BambiSleep™ Church MCP Control Tower
 * API Service - HTTP requests to backend
 */

import { API_BASE } from '../config.js';
import { Actions } from '../state/store.js';

// ============================================================================
// API HELPERS
// ============================================================================

/**
 * Generic API request with error handling
 * @param {string} path - API path (appended to API_BASE)
 * @param {Object} options - Fetch options
 * @param {string} errorMsg - Error message prefix
 * @returns {Promise<any>} Response JSON
 */
async function apiRequest(path, options = {}, errorMsg = 'API request failed') {
  const response = await fetch(`${API_BASE}${path}`, options);
  if (!response.ok) throw new Error(`${errorMsg}: ${response.status}`);
  return response.json();
}

/**
 * GET request helper
 */
const apiGet = (path, errorMsg) => apiRequest(path, {}, errorMsg);

/**
 * POST request helper
 */
const apiPost = (path, body, errorMsg) => apiRequest(
  path,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  },
  errorMsg
);

// ============================================================================
// SERVER MANAGEMENT
// ============================================================================

/**
 * Fetch all servers from API
 */
export async function fetchServers() {
  try {
    const data = await apiGet('/servers', 'Failed to fetch servers');
    Actions.setServers(data.servers);
    Actions.setApiStatus('connected');
    return data;
  } catch (error) {
    console.error('Failed to fetch servers:', error);
    Actions.setApiStatus('disconnected');
    return null;
  }
}

/**
 * Start a server
 */
export async function startServer(name) {
  try {
    const response = await fetch(`${API_BASE}/servers/${name}/start`, { 
      method: 'POST' 
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to start server');
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Failed to start server ${name}:`, error);
    throw error;
  }
}

/**
 * Stop a server
 */
export async function stopServer(name) {
  try {
    const response = await fetch(`${API_BASE}/servers/${name}/stop`, { 
      method: 'POST' 
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to stop server');
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Failed to stop server ${name}:`, error);
    throw error;
  }
}

/**
 * Fetch health status
 */
export async function fetchHealth() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    if (!response.ok) throw new Error('Health check failed');
    return await response.json();
  } catch (error) {
    console.error('Health check failed:', error);
    return null;
  }
}

/**
 * Fetch WebSocket stats
 */
export async function fetchWsStats() {
  try {
    const response = await fetch(`${API_BASE}/stats/websocket`);
    if (!response.ok) throw new Error('Failed to fetch WS stats');
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch WS stats:', error);
    return null;
  }
}

/**
 * Fetch rate limit stats
 */
export async function fetchRateLimitStats() {
  try {
    const response = await fetch(`${API_BASE}/stats/rate-limit`);
    if (!response.ok) throw new Error('Failed to fetch rate limit stats');
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch rate limit stats:', error);
    return null;
  }
}

// ============================================================================
// MEMORY API
// ============================================================================

export async function fetchMemoryGraph() {
  const response = await fetch(`${API_BASE}/memory`);
  if (!response.ok) throw new Error('Failed to fetch memory graph');
  return await response.json();
}

export async function searchMemory(query) {
  const response = await fetch(`${API_BASE}/memory/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error('Failed to search memory');
  return await response.json();
}

// ============================================================================
// GITHUB API
// ============================================================================

export async function fetchGitHubUser() {
  const response = await fetch(`${API_BASE}/github/user`);
  if (!response.ok) throw new Error('Failed to fetch GitHub user');
  return await response.json();
}

export async function fetchGitHubRepos(options = {}) {
  const params = new URLSearchParams({
    per_page: options.perPage || 30,
    page: options.page || 1,
  });
  const response = await fetch(`${API_BASE}/github/repos?${params}`);
  if (!response.ok) throw new Error('Failed to fetch GitHub repos');
  return await response.json();
}

// ============================================================================
// HUGGINGFACE API
// ============================================================================

export async function searchHuggingFaceModels(query, options = {}) {
  const params = new URLSearchParams({ q: query, limit: options.limit || 20 });
  const response = await fetch(`${API_BASE}/huggingface/models?${params}`);
  if (!response.ok) throw new Error('Failed to search HuggingFace models');
  return await response.json();
}

export async function searchHuggingFaceDatasets(query, options = {}) {
  const params = new URLSearchParams({ q: query, limit: options.limit || 20 });
  const response = await fetch(`${API_BASE}/huggingface/datasets?${params}`);
  if (!response.ok) throw new Error('Failed to search HuggingFace datasets');
  return await response.json();
}

// ============================================================================
// STRIPE API
// ============================================================================

export async function fetchStripeCustomers(options = {}) {
  const params = new URLSearchParams({ limit: options.limit || 10 });
  if (options.email) params.set('email', options.email);
  const response = await fetch(`${API_BASE}/stripe/customers?${params}`);
  if (!response.ok) throw new Error('Failed to fetch Stripe customers');
  return await response.json();
}

export async function fetchStripeBalance() {
  const response = await fetch(`${API_BASE}/stripe/balance`);
  if (!response.ok) throw new Error('Failed to fetch Stripe balance');
  return await response.json();
}

// ============================================================================
// MONGODB API
// ============================================================================

export async function connectMongoDB(database) {
  const response = await fetch(`${API_BASE}/mongodb/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ database }),
  });
  if (!response.ok) throw new Error('Failed to connect to MongoDB');
  return await response.json();
}

export async function fetchMongoDBInfo() {
  const response = await fetch(`${API_BASE}/mongodb/info`);
  if (!response.ok) throw new Error('Failed to fetch MongoDB info');
  return await response.json();
}

export async function fetchMongoDBCollections() {
  const response = await fetch(`${API_BASE}/mongodb/collections`);
  if (!response.ok) throw new Error('Failed to fetch MongoDB collections');
  return await response.json();
}

export async function fetchMongoDBStats() {
  const response = await fetch(`${API_BASE}/mongodb/stats`);
  if (!response.ok) throw new Error('Failed to fetch MongoDB stats');
  return await response.json();
}

// ============================================================================
// SQLITE API
// ============================================================================

export async function fetchSQLiteTables() {
  const response = await fetch(`${API_BASE}/sqlite/tables`);
  if (!response.ok) throw new Error('Failed to fetch SQLite tables');
  return await response.json();
}

export async function fetchSQLiteStats() {
  const response = await fetch(`${API_BASE}/sqlite/stats`);
  if (!response.ok) throw new Error('Failed to fetch SQLite stats');
  return await response.json();
}

// ============================================================================
// STORAGE API
// ============================================================================

export async function fetchStorageStatus() {
  const response = await fetch(`${API_BASE}/storage/status`);
  if (!response.ok) throw new Error('Failed to fetch storage status');
  return await response.json();
}

export async function fetchStorageFiles(folder = 'all') {
  const response = await fetch(`${API_BASE}/storage/files?folder=${folder}`);
  if (!response.ok) throw new Error('Failed to fetch storage files');
  return await response.json();
}

export async function fetchStorageStats() {
  const response = await fetch(`${API_BASE}/storage/stats`);
  if (!response.ok) throw new Error('Failed to fetch storage stats');
  return await response.json();
}

// ============================================================================
// PUPPETEER API
// ============================================================================

export async function fetchPuppeteerStatus() {
  const response = await fetch(`${API_BASE}/puppeteer/status`);
  if (!response.ok) throw new Error('Failed to fetch Puppeteer status');
  return await response.json();
}

export async function launchPuppeteer(options = {}) {
  const response = await fetch(`${API_BASE}/puppeteer/launch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });
  if (!response.ok) throw new Error('Failed to launch Puppeteer');
  return await response.json();
}

// ============================================================================
// SEQUENTIAL THINKING API
// ============================================================================

export async function fetchThinkingSessions() {
  const response = await fetch(`${API_BASE}/thinking/sessions`);
  if (!response.ok) throw new Error('Failed to fetch thinking sessions');
  return await response.json();
}

export async function fetchThinkingStats() {
  const response = await fetch(`${API_BASE}/thinking/stats`);
  if (!response.ok) throw new Error('Failed to fetch thinking stats');
  return await response.json();
}

export async function createThinkingSession(title, description = '') {
  const response = await fetch(`${API_BASE}/thinking/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description }),
  });
  if (!response.ok) throw new Error('Failed to create thinking session');
  return await response.json();
}

// ============================================================================
// FETCH API
// ============================================================================

export async function pingUrl(url) {
  const response = await fetch(`${API_BASE}/fetch/ping?url=${encodeURIComponent(url)}`);
  if (!response.ok) throw new Error('Failed to ping URL');
  return await response.json();
}

// ============================================================================
// CLARITY ANALYTICS API
// ============================================================================

/**
 * Initialize Clarity tracking
 */
export async function initClarity() {
  const response = await fetch(`${API_BASE}/clarity/init`, { method: 'POST' });
  if (!response.ok) throw new Error('Failed to initialize Clarity');
  return await response.json();
}

/**
 * Get Clarity info
 */
export async function fetchClarityInfo() {
  const response = await fetch(`${API_BASE}/clarity/info`);
  if (!response.ok) throw new Error('Failed to fetch Clarity info');
  return await response.json();
}

/**
 * Get Clarity dashboard data
 */
export async function fetchClarityDashboard() {
  const response = await fetch(`${API_BASE}/clarity/dashboard`);
  if (!response.ok) throw new Error('Failed to fetch Clarity dashboard');
  return await response.json();
}

/**
 * Identify user for Clarity tracking
 */
export async function identifyClarityUser(customId, options = {}) {
  const response = await fetch(`${API_BASE}/clarity/identify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customId,
      customSessionId: options.sessionId,
      customPageId: options.pageId,
      friendlyName: options.friendlyName,
    }),
  });
  if (!response.ok) throw new Error('Failed to identify user');
  return await response.json();
}

/**
 * Set custom tag for Clarity
 */
export async function setClarityTag(key, value) {
  const response = await fetch(`${API_BASE}/clarity/tag`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value }),
  });
  if (!response.ok) throw new Error('Failed to set Clarity tag');
  return await response.json();
}

/**
 * Track custom event
 */
export async function trackClarityEvent(eventName, data = {}) {
  const response = await fetch(`${API_BASE}/clarity/event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventName, data }),
  });
  if (!response.ok) throw new Error('Failed to track event');
  return await response.json();
}

/**
 * Track page view
 */
export async function trackClarityPageView(path, data = {}) {
  const response = await fetch(`${API_BASE}/clarity/pageview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, data }),
  });
  if (!response.ok) throw new Error('Failed to track page view');
  return await response.json();
}

/**
 * Upgrade session recording
 */
export async function upgradeClaritySession(reason) {
  const response = await fetch(`${API_BASE}/clarity/upgrade`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  if (!response.ok) throw new Error('Failed to upgrade session');
  return await response.json();
}

/**
 * Set consent for Clarity tracking
 */
export async function setClarityConsent(options = {}) {
  const response = await fetch(`${API_BASE}/clarity/consent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ options }),
  });
  if (!response.ok) throw new Error('Failed to set consent');
  return await response.json();
}

/**
 * List Clarity sessions
 */
export async function fetchClaritySessions(options = {}) {
  const params = new URLSearchParams({
    limit: options.limit || 20,
    offset: options.offset || 0,
  });
  const response = await fetch(`${API_BASE}/clarity/sessions?${params}`);
  if (!response.ok) throw new Error('Failed to fetch Clarity sessions');
  return await response.json();
}

/**
 * Get specific Clarity session
 */
export async function fetchClaritySession(sessionId) {
  const response = await fetch(`${API_BASE}/clarity/sessions/${sessionId}`);
  if (!response.ok) throw new Error('Failed to fetch Clarity session');
  return await response.json();
}

/**
 * Get event history
 */
export async function fetchClarityEvents(options = {}) {
  const params = new URLSearchParams({ limit: options.limit || 50 });
  if (options.type) params.set('type', options.type);
  const response = await fetch(`${API_BASE}/clarity/events?${params}`);
  if (!response.ok) throw new Error('Failed to fetch Clarity events');
  return await response.json();
}

/**
 * Get top events
 */
export async function fetchClarityTopEvents(limit = 10) {
  const response = await fetch(`${API_BASE}/clarity/top-events?limit=${limit}`);
  if (!response.ok) throw new Error('Failed to fetch top events');
  return await response.json();
}

/**
 * Get top pages
 */
export async function fetchClarityTopPages(limit = 10) {
  const response = await fetch(`${API_BASE}/clarity/top-pages?limit=${limit}`);
  if (!response.ok) throw new Error('Failed to fetch top pages');
  return await response.json();
}

/**
 * Reset analytics data
 */
export async function resetClarity() {
  const response = await fetch(`${API_BASE}/clarity/reset`, { method: 'POST' });
  if (!response.ok) throw new Error('Failed to reset Clarity');
  return await response.json();
}
