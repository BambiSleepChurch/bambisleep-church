/**
 * BambiSleep™ Church MCP Control Tower
 * API Service - HTTP requests to backend
 */

import { getApiBase } from '../config.js';
import { Actions } from '../state/store.js';

// Local getter for API_BASE - evaluated at call time, not import time
const API_BASE = () => getApiBase();

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
  const apiBase = getApiBase();
  const response = await fetch(`${apiBase}${path}`, options);
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
    const apiBase = getApiBase();
    const response = await fetch(`${apiBase}/servers/${name}/start`, { 
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
    const apiBase = getApiBase();
    const response = await fetch(`${apiBase}/servers/${name}/stop`, { 
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
    const apiBase = getApiBase();
    const response = await fetch(`${apiBase}/health`);
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
    const response = await fetch(`${API_BASE()}/stats/websocket`);
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
    const response = await fetch(`${API_BASE()}/stats/rate-limit`);
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
  const response = await fetch(`${API_BASE()}/memory`);
  if (!response.ok) throw new Error('Failed to fetch memory graph');
  return await response.json();
}

export async function searchMemory(query) {
  const response = await fetch(`${API_BASE()}/memory/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error('Failed to search memory');
  return await response.json();
}

// ============================================================================
// GITHUB API
// ============================================================================

export async function fetchGitHubUser() {
  const response = await fetch(`${API_BASE()}/github/user`);
  if (!response.ok) throw new Error('Failed to fetch GitHub user');
  return await response.json();
}

export async function fetchGitHubRepos(options = {}) {
  const params = new URLSearchParams({
    per_page: options.perPage || 30,
    page: options.page || 1,
  });
  const response = await fetch(`${API_BASE()}/github/repos?${params}`);
  if (!response.ok) throw new Error('Failed to fetch GitHub repos');
  return await response.json();
}

// ============================================================================
// HUGGINGFACE API
// ============================================================================

export async function searchHuggingFaceModels(query, options = {}) {
  const params = new URLSearchParams({ q: query, limit: options.limit || 20 });
  const response = await fetch(`${API_BASE()}/huggingface/models?${params}`);
  if (!response.ok) throw new Error('Failed to search HuggingFace models');
  return await response.json();
}

export async function searchHuggingFaceDatasets(query, options = {}) {
  const params = new URLSearchParams({ q: query, limit: options.limit || 20 });
  const response = await fetch(`${API_BASE()}/huggingface/datasets?${params}`);
  if (!response.ok) throw new Error('Failed to search HuggingFace datasets');
  return await response.json();
}

// ============================================================================
// STRIPE API
// ============================================================================

export async function fetchStripeCustomers(options = {}) {
  const params = new URLSearchParams({ limit: options.limit || 10 });
  if (options.email) params.set('email', options.email);
  const response = await fetch(`${API_BASE()}/stripe/customers?${params}`);
  if (!response.ok) throw new Error('Failed to fetch Stripe customers');
  return await response.json();
}

export async function fetchStripeBalance() {
  const response = await fetch(`${API_BASE()}/stripe/balance`);
  if (!response.ok) throw new Error('Failed to fetch Stripe balance');
  return await response.json();
}

// ============================================================================
// MONGODB API
// ============================================================================

export async function connectMongoDB(database) {
  const response = await fetch(`${API_BASE()}/mongodb/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ database }),
  });
  if (!response.ok) throw new Error('Failed to connect to MongoDB');
  return await response.json();
}

export async function fetchMongoDBInfo() {
  const response = await fetch(`${API_BASE()}/mongodb/info`);
  if (!response.ok) throw new Error('Failed to fetch MongoDB info');
  return await response.json();
}

export async function fetchMongoDBCollections() {
  const response = await fetch(`${API_BASE()}/mongodb/collections`);
  if (!response.ok) throw new Error('Failed to fetch MongoDB collections');
  return await response.json();
}

export async function fetchMongoDBStats() {
  const response = await fetch(`${API_BASE()}/mongodb/stats`);
  if (!response.ok) throw new Error('Failed to fetch MongoDB stats');
  return await response.json();
}

// ============================================================================
// SQLITE API
// ============================================================================

export async function fetchSQLiteTables() {
  const response = await fetch(`${API_BASE()}/sqlite/tables`);
  if (!response.ok) throw new Error('Failed to fetch SQLite tables');
  return await response.json();
}

export async function fetchSQLiteStats() {
  const response = await fetch(`${API_BASE()}/sqlite/stats`);
  if (!response.ok) throw new Error('Failed to fetch SQLite stats');
  return await response.json();
}

// ============================================================================
// STORAGE API
// ============================================================================

export async function fetchStorageStatus() {
  const response = await fetch(`${API_BASE()}/storage/status`);
  if (!response.ok) throw new Error('Failed to fetch storage status');
  return await response.json();
}

export async function fetchStorageFiles(folder = 'all') {
  const response = await fetch(`${API_BASE()}/storage/files?folder=${folder}`);
  if (!response.ok) throw new Error('Failed to fetch storage files');
  return await response.json();
}

export async function fetchStorageStats() {
  const response = await fetch(`${API_BASE()}/storage/stats`);
  if (!response.ok) throw new Error('Failed to fetch storage stats');
  return await response.json();
}

// ============================================================================
// PUPPETEER API
// ============================================================================

export async function fetchPuppeteerStatus() {
  const response = await fetch(`${API_BASE()}/puppeteer/status`);
  if (!response.ok) throw new Error('Failed to fetch Puppeteer status');
  return await response.json();
}

export async function launchPuppeteer(options = {}) {
  const response = await fetch(`${API_BASE()}/puppeteer/launch`, {
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
  const response = await fetch(`${API_BASE()}/thinking/sessions`);
  if (!response.ok) throw new Error('Failed to fetch thinking sessions');
  return await response.json();
}

export async function fetchThinkingStats() {
  const response = await fetch(`${API_BASE()}/thinking/stats`);
  if (!response.ok) throw new Error('Failed to fetch thinking stats');
  return await response.json();
}

export async function createThinkingSession(title, description = '') {
  const response = await fetch(`${API_BASE()}/thinking/sessions`, {
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
  const response = await fetch(`${API_BASE()}/fetch/ping?url=${encodeURIComponent(url)}`);
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
  const response = await fetch(`${API_BASE()}/clarity/init`, { method: 'POST' });
  if (!response.ok) throw new Error('Failed to initialize Clarity');
  return await response.json();
}

/**
 * Get Clarity info
 */
export async function fetchClarityInfo() {
  const response = await fetch(`${API_BASE()}/clarity/info`);
  if (!response.ok) throw new Error('Failed to fetch Clarity info');
  return await response.json();
}

/**
 * Get Clarity dashboard data
 */
export async function fetchClarityDashboard() {
  const response = await fetch(`${API_BASE()}/clarity/dashboard`);
  if (!response.ok) throw new Error('Failed to fetch Clarity dashboard');
  return await response.json();
}

/**
 * Identify user for Clarity tracking
 */
export async function identifyClarityUser(customId, options = {}) {
  const response = await fetch(`${API_BASE()}/clarity/identify`, {
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
  const response = await fetch(`${API_BASE()}/clarity/tag`, {
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
  const response = await fetch(`${API_BASE()}/clarity/event`, {
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
  const response = await fetch(`${API_BASE()}/clarity/pageview`, {
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
  const response = await fetch(`${API_BASE()}/clarity/upgrade`, {
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
  const response = await fetch(`${API_BASE()}/clarity/consent`, {
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
  const response = await fetch(`${API_BASE()}/clarity/sessions?${params}`);
  if (!response.ok) throw new Error('Failed to fetch Clarity sessions');
  return await response.json();
}

/**
 * Get specific Clarity session
 */
export async function fetchClaritySession(sessionId) {
  const response = await fetch(`${API_BASE()}/clarity/sessions/${sessionId}`);
  if (!response.ok) throw new Error('Failed to fetch Clarity session');
  return await response.json();
}

/**
 * Get event history
 */
export async function fetchClarityEvents(options = {}) {
  const params = new URLSearchParams({ limit: options.limit || 50 });
  if (options.type) params.set('type', options.type);
  const response = await fetch(`${API_BASE()}/clarity/events?${params}`);
  if (!response.ok) throw new Error('Failed to fetch Clarity events');
  return await response.json();
}

/**
 * Get top events
 */
export async function fetchClarityTopEvents(limit = 10) {
  const response = await fetch(`${API_BASE()}/clarity/top-events?limit=${limit}`);
  if (!response.ok) throw new Error('Failed to fetch top events');
  return await response.json();
}

/**
 * Get top pages
 */
export async function fetchClarityTopPages(limit = 10) {
  const response = await fetch(`${API_BASE()}/clarity/top-pages?limit=${limit}`);
  if (!response.ok) throw new Error('Failed to fetch top pages');
  return await response.json();
}

/**
 * Reset analytics data
 */
export async function resetClarity() {
  const response = await fetch(`${API_BASE()}/clarity/reset`, { method: 'POST' });
  if (!response.ok) throw new Error('Failed to reset Clarity');
  return await response.json();
}

// ============================================================================
// PATREON API
// ============================================================================

/**
 * Get Patreon identity (current user)
 */
export async function fetchPatreonIdentity() {
  const response = await fetch(`${API_BASE()}/patreon/identity`);
  if (!response.ok) throw new Error('Failed to fetch Patreon identity');
  return await response.json();
}

/**
 * List campaigns
 */
export async function fetchPatreonCampaigns(options = {}) {
  const params = new URLSearchParams({ limit: options.limit || 10 });
  const response = await fetch(`${API_BASE()}/patreon/campaigns?${params}`);
  if (!response.ok) throw new Error('Failed to fetch Patreon campaigns');
  return await response.json();
}

/**
 * Get specific campaign
 */
export async function fetchPatreonCampaign(campaignId) {
  const response = await fetch(`${API_BASE()}/patreon/campaigns/${campaignId}`);
  if (!response.ok) throw new Error('Failed to fetch Patreon campaign');
  return await response.json();
}

/**
 * List campaign members/patrons
 */
export async function fetchPatreonMembers(campaignId, options = {}) {
  const params = new URLSearchParams({ limit: options.limit || 20 });
  if (options.pledge_status) params.set('pledge_status', options.pledge_status);
  const response = await fetch(`${API_BASE()}/patreon/campaigns/${campaignId}/members?${params}`);
  if (!response.ok) throw new Error('Failed to fetch Patreon members');
  return await response.json();
}

/**
 * List campaign posts
 */
export async function fetchPatreonPosts(campaignId, options = {}) {
  const params = new URLSearchParams({ limit: options.limit || 20 });
  const response = await fetch(`${API_BASE()}/patreon/campaigns/${campaignId}/posts?${params}`);
  if (!response.ok) throw new Error('Failed to fetch Patreon posts');
  return await response.json();
}

/**
 * Get member info
 */
export async function fetchPatreonMember(memberId) {
  const response = await fetch(`${API_BASE()}/patreon/members/${memberId}`);
  if (!response.ok) throw new Error('Failed to fetch Patreon member');
  return await response.json();
}

/**
 * Get Patreon webhook status
 */
export async function fetchPatreonWebhooks() {
  const response = await fetch(`${API_BASE()}/patreon/webhooks`);
  if (!response.ok) throw new Error('Failed to fetch Patreon webhooks');
  return await response.json();
}

// ============================================================================
// LM STUDIO API
// ============================================================================

/**
 * Get LM Studio status
 */
export async function fetchLMStudioStatus() {
  const response = await fetch(`${API_BASE()}/lmstudio/status`);
  if (!response.ok) throw new Error('Failed to fetch LM Studio status');
  return await response.json();
}

/**
 * List loaded models
 */
export async function fetchLMStudioModels() {
  const response = await fetch(`${API_BASE()}/lmstudio/models`);
  if (!response.ok) throw new Error('Failed to fetch LM Studio models');
  return await response.json();
}

/**
 * Get specific model info
 */
export async function fetchLMStudioModel(modelId) {
  const response = await fetch(`${API_BASE()}/lmstudio/models/${encodeURIComponent(modelId)}`);
  if (!response.ok) throw new Error('Failed to fetch LM Studio model');
  return await response.json();
}

/**
 * Create chat completion
 */
export async function createLMStudioCompletion(options = {}) {
  const response = await fetch(`${API_BASE()}/lmstudio/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: options.model || 'default',
      messages: options.messages || [],
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 500,
      stream: options.stream || false,
    }),
  });
  if (!response.ok) throw new Error('Failed to create chat completion');
  return await response.json();
}

/**
 * Generate text embeddings
 */
export async function createLMStudioEmbedding(input, model = 'default') {
  const response = await fetch(`${API_BASE()}/lmstudio/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input, model }),
  });
  if (!response.ok) throw new Error('Failed to create embedding');
  return await response.json();
}

/**
 * Load a model
 */
export async function loadLMStudioModel(modelPath) {
  const response = await fetch(`${API_BASE()}/lmstudio/models/load`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: modelPath }),
  });
  if (!response.ok) throw new Error('Failed to load model');
  return await response.json();
}

/**
 * Unload a model
 */
export async function unloadLMStudioModel(modelId) {
  const response = await fetch(`${API_BASE()}/lmstudio/models/${encodeURIComponent(modelId)}/unload`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to unload model');
  return await response.json();
}

/**
 * Get model router suggestions
 */
export async function fetchModelRouterSuggestions(taskType) {
  const response = await fetch(`${API_BASE()}/lmstudio/router/suggest?task=${taskType}`);
  if (!response.ok) throw new Error('Failed to fetch model suggestions');
  return await response.json();
}

// ============================================================================
// BAMBISLEEP CHAT API
// ============================================================================

/**
 * List chat triggers
 */
export async function fetchBambiSleepTriggers() {
  const response = await fetch(`${API_BASE()}/bambisleep/triggers`);
  if (!response.ok) throw new Error('Failed to fetch BambiSleep triggers');
  return await response.json();
}

/**
 * Activate a trigger
 */
export async function activateBambiSleepTrigger(triggerId, intensity = 1.0) {
  const response = await fetch(`${API_BASE()}/bambisleep/triggers/${triggerId}/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ intensity }),
  });
  if (!response.ok) throw new Error('Failed to activate trigger');
  return await response.json();
}

/**
 * List spiral types
 */
export async function fetchBambiSleepSpirals() {
  const response = await fetch(`${API_BASE()}/bambisleep/spirals`);
  if (!response.ok) throw new Error('Failed to fetch BambiSleep spirals');
  return await response.json();
}

/**
 * Start a spiral
 */
export async function startBambiSleepSpiral(spiralType, duration = 60) {
  const response = await fetch(`${API_BASE()}/bambisleep/spirals/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: spiralType, duration }),
  });
  if (!response.ok) throw new Error('Failed to start spiral');
  return await response.json();
}

/**
 * Stop current spiral
 */
export async function stopBambiSleepSpiral() {
  const response = await fetch(`${API_BASE()}/bambisleep/spirals/stop`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to stop spiral');
  return await response.json();
}

/**
 * Speak text using TTS
 */
export async function speakBambiSleepText(text, options = {}) {
  const response = await fetch(`${API_BASE()}/bambisleep/speak`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      voice: options.voice || 'bambi',
      speed: options.speed || 1.0,
      pitch: options.pitch || 1.0,
    }),
  });
  if (!response.ok) throw new Error('Failed to speak text');
  return await response.json();
}

/**
 * Get available voices
 */
export async function fetchBambiSleepVoices() {
  const response = await fetch(`${API_BASE()}/bambisleep/voices`);
  if (!response.ok) throw new Error('Failed to fetch BambiSleep voices');
  return await response.json();
}

/**
 * Set avatar expression
 */
export async function setBambiSleepExpression(expression) {
  const response = await fetch(`${API_BASE()}/bambisleep/avatar/expression`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ expression }),
  });
  if (!response.ok) throw new Error('Failed to set expression');
  return await response.json();
}

/**
 * Get chat status
 */
export async function fetchBambiSleepStatus() {
  const response = await fetch(`${API_BASE()}/bambisleep/status`);
  if (!response.ok) throw new Error('Failed to fetch BambiSleep status');
  return await response.json();
}
