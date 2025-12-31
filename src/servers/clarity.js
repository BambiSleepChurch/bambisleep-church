/**
 * BambiSleep™ Church MCP Control Tower
 * Microsoft Clarity MCP Server Wrapper - Analytics Operations
 * Reference: docs/CLARITY_MCP_REFERENCE.md
 * 
 * Integrates Microsoft Clarity behavioral analytics with dashboard tracking.
 * Uses @microsoft/clarity npm package API.
 */

import { createLogger } from '../utils/logger.js';

const logger = createLogger('clarity');

/**
 * Clarity project configuration
 */
const CLARITY_PROJECT_ID = process.env.CLARITY_PROJECT_ID || 'utux7nv0pm';

/**
 * Analytics event types for tracking
 */
export const AnalyticsEventTypes = {
  // Server events
  SERVER_START: 'server:start',
  SERVER_STOP: 'server:stop',
  SERVER_ERROR: 'server:error',
  
  // User actions
  USER_LOGIN: 'user:login',
  USER_ACTION: 'user:action',
  
  // Dashboard events
  DASHBOARD_VIEW: 'dashboard:view',
  DASHBOARD_SEARCH: 'dashboard:search',
  DASHBOARD_FILTER: 'dashboard:filter',
  
  // API events
  API_CALL: 'api:call',
  API_ERROR: 'api:error',
  
  // Custom events
  CUSTOM: 'custom',
};

/**
 * Analytics session tracking
 */
class AnalyticsSession {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.startTime = new Date();
    this.events = [];
    this.pageViews = [];
    this.tags = new Map();
    this.userId = null;
    this.friendlyName = null;
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  addEvent(eventName, data = {}) {
    const event = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: eventName,
      data,
      timestamp: new Date().toISOString(),
    };
    this.events.push(event);
    return event;
  }

  addPageView(page, data = {}) {
    const view = {
      page,
      data,
      timestamp: new Date().toISOString(),
    };
    this.pageViews.push(view);
    return view;
  }

  setTag(key, value) {
    this.tags.set(key, value);
  }

  identify(userId, friendlyName = null) {
    this.userId = userId;
    this.friendlyName = friendlyName;
  }

  getDuration() {
    return Date.now() - this.startTime.getTime();
  }

  toJSON() {
    return {
      sessionId: this.sessionId,
      startTime: this.startTime.toISOString(),
      duration: this.getDuration(),
      userId: this.userId,
      friendlyName: this.friendlyName,
      eventCount: this.events.length,
      pageViewCount: this.pageViews.length,
      tags: Object.fromEntries(this.tags),
    };
  }
}

/**
 * Clarity Analytics Client
 * Provides server-side analytics tracking that mirrors Clarity's client API
 */
class ClarityClient {
  constructor(projectId = CLARITY_PROJECT_ID) {
    this.projectId = projectId;
    this.initialized = false;
    this.sessions = new Map();
    this.currentSession = null;
    this.eventHistory = [];
    this.maxEventHistory = 1000;
    
    // Analytics aggregates
    this.stats = {
      totalSessions: 0,
      totalEvents: 0,
      totalPageViews: 0,
      eventsByType: {},
      pagesByPath: {},
      tagUsage: {},
      identifiedUsers: new Set(),
    };
  }

  /**
   * Initialize Clarity tracking
   */
  init() {
    if (this.initialized) {
      logger.warn('Clarity already initialized');
      return { success: true, message: 'Already initialized' };
    }

    this.initialized = true;
    this.startSession();
    
    logger.info(`Clarity initialized with project: ${this.projectId}`);
    return {
      success: true,
      projectId: this.projectId,
      sessionId: this.currentSession?.sessionId,
      message: 'Clarity initialized',
    };
  }

  /**
   * Start a new analytics session
   */
  startSession() {
    const session = new AnalyticsSession();
    this.sessions.set(session.sessionId, session);
    this.currentSession = session;
    this.stats.totalSessions++;
    
    logger.debug(`Started session: ${session.sessionId}`);
    return session;
  }

  /**
   * Get current session or start new one
   */
  getSession() {
    if (!this.currentSession) {
      return this.startSession();
    }
    return this.currentSession;
  }

  /**
   * Identify user (mirrors Clarity.identify)
   * @param {string} customId - Unique user identifier
   * @param {string} customSessionId - Optional custom session ID
   * @param {string} customPageId - Optional custom page ID  
   * @param {string} friendlyName - Optional friendly display name
   */
  identify(customId, customSessionId = null, customPageId = null, friendlyName = null) {
    const session = this.getSession();
    session.identify(customId, friendlyName);
    
    if (customSessionId) {
      session.setTag('customSessionId', customSessionId);
    }
    if (customPageId) {
      session.setTag('customPageId', customPageId);
    }
    
    this.stats.identifiedUsers.add(customId);
    
    logger.info(`Identified user: ${customId} (${friendlyName || 'anonymous'})`);
    return {
      success: true,
      customId,
      sessionId: session.sessionId,
      friendlyName,
    };
  }

  /**
   * Set custom tag (mirrors Clarity.setTag)
   * @param {string} key - Tag key
   * @param {string|string[]} value - Tag value(s)
   */
  setTag(key, value) {
    const session = this.getSession();
    session.setTag(key, value);
    
    // Track tag usage
    this.stats.tagUsage[key] = (this.stats.tagUsage[key] || 0) + 1;
    
    logger.debug(`Set tag: ${key}=${JSON.stringify(value)}`);
    return {
      success: true,
      key,
      value,
      sessionId: session.sessionId,
    };
  }

  /**
   * Track custom event (mirrors Clarity.event)
   * @param {string} eventName - Name of the event
   * @param {Object} data - Optional event data
   */
  event(eventName, data = {}) {
    const session = this.getSession();
    const event = session.addEvent(eventName, data);
    
    // Track in history
    this.eventHistory.push({
      ...event,
      sessionId: session.sessionId,
    });
    
    // Trim history if needed
    if (this.eventHistory.length > this.maxEventHistory) {
      this.eventHistory = this.eventHistory.slice(-this.maxEventHistory);
    }
    
    // Update stats
    this.stats.totalEvents++;
    this.stats.eventsByType[eventName] = (this.stats.eventsByType[eventName] || 0) + 1;
    
    logger.debug(`Event tracked: ${eventName}`);
    return {
      success: true,
      eventId: event.id,
      eventName,
      sessionId: session.sessionId,
    };
  }

  /**
   * Track page view
   * @param {string} path - Page path
   * @param {Object} data - Optional page data
   */
  pageView(path, data = {}) {
    const session = this.getSession();
    const view = session.addPageView(path, data);
    
    // Update stats
    this.stats.totalPageViews++;
    this.stats.pagesByPath[path] = (this.stats.pagesByPath[path] || 0) + 1;
    
    logger.debug(`Page view: ${path}`);
    return {
      success: true,
      path,
      sessionId: session.sessionId,
    };
  }

  /**
   * Upgrade session priority (mirrors Clarity.upgrade)
   * @param {string} reason - Reason for upgrade
   */
  upgrade(reason) {
    const session = this.getSession();
    session.setTag('upgraded', true);
    session.setTag('upgradeReason', reason);
    
    logger.info(`Session upgraded: ${reason}`);
    return {
      success: true,
      sessionId: session.sessionId,
      reason,
    };
  }

  /**
   * Set cookie consent (mirrors Clarity.consent)
   * @param {Object} options - Consent options
   */
  consent(options = { ad_Storage: 'granted', analytics_Storage: 'granted' }) {
    const session = this.getSession();
    session.setTag('consent', options);
    
    logger.info(`Consent set: ${JSON.stringify(options)}`);
    return {
      success: true,
      sessionId: session.sessionId,
      consent: options,
    };
  }

  /**
   * Get analytics dashboard data
   */
  getDashboardData() {
    const sessions = Array.from(this.sessions.values());
    const recentEvents = this.eventHistory.slice(-50);
    
    return {
      projectId: this.projectId,
      initialized: this.initialized,
      stats: {
        ...this.stats,
        identifiedUsersCount: this.stats.identifiedUsers.size,
        activeSessions: sessions.filter(s => s.getDuration() < 30 * 60 * 1000).length,
      },
      currentSession: this.currentSession?.toJSON(),
      recentEvents,
      topEvents: this.getTopEvents(10),
      topPages: this.getTopPages(10),
    };
  }

  /**
   * Get top events by count
   */
  getTopEvents(limit = 10) {
    return Object.entries(this.stats.eventsByType)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name, count]) => ({ name, count }));
  }

  /**
   * Get top pages by views
   */
  getTopPages(limit = 10) {
    return Object.entries(this.stats.pagesByPath)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([path, views]) => ({ path, views }));
  }

  /**
   * Get session by ID
   */
  getSessionById(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    return {
      ...session.toJSON(),
      events: session.events,
      pageViews: session.pageViews,
    };
  }

  /**
   * List all sessions
   */
  listSessions(options = {}) {
    const { limit = 20, offset = 0 } = options;
    const sessions = Array.from(this.sessions.values())
      .sort((a, b) => b.startTime - a.startTime)
      .slice(offset, offset + limit)
      .map(s => s.toJSON());
    
    return {
      sessions,
      total: this.sessions.size,
      limit,
      offset,
    };
  }

  /**
   * Get event history
   */
  getEventHistory(options = {}) {
    const { limit = 50, eventType = null } = options;
    let events = this.eventHistory;
    
    if (eventType) {
      events = events.filter(e => e.name === eventType);
    }
    
    return {
      events: events.slice(-limit),
      total: events.length,
    };
  }

  /**
   * Clear all data (for testing)
   */
  reset() {
    this.sessions.clear();
    this.currentSession = null;
    this.eventHistory = [];
    this.stats = {
      totalSessions: 0,
      totalEvents: 0,
      totalPageViews: 0,
      eventsByType: {},
      pagesByPath: {},
      tagUsage: {},
      identifiedUsers: new Set(),
    };
    this.initialized = false;
    
    logger.info('Clarity client reset');
    return { success: true, message: 'Analytics data cleared' };
  }

  /**
   * Get client info
   */
  getInfo() {
    return {
      projectId: this.projectId,
      initialized: this.initialized,
      currentSessionId: this.currentSession?.sessionId,
      totalSessions: this.sessions.size,
      totalEvents: this.eventHistory.length,
    };
  }
}

// Singleton instance
const clarityClient = new ClarityClient();

/**
 * Clarity handlers for API routes
 */
export const clarityHandlers = {
  // Initialization
  init: () => clarityClient.init(),
  getInfo: () => clarityClient.getInfo(),
  reset: () => clarityClient.reset(),
  
  // User identification
  identify: (customId, customSessionId, customPageId, friendlyName) => 
    clarityClient.identify(customId, customSessionId, customPageId, friendlyName),
  
  // Tagging
  setTag: (key, value) => clarityClient.setTag(key, value),
  
  // Event tracking
  event: (eventName, data) => clarityClient.event(eventName, data),
  pageView: (path, data) => clarityClient.pageView(path, data),
  
  // Session management
  upgrade: (reason) => clarityClient.upgrade(reason),
  consent: (options) => clarityClient.consent(options),
  
  // Data retrieval
  getDashboardData: () => clarityClient.getDashboardData(),
  getSession: (sessionId) => clarityClient.getSessionById(sessionId),
  listSessions: (options) => clarityClient.listSessions(options),
  getEventHistory: (options) => clarityClient.getEventHistory(options),
  getTopEvents: (limit) => clarityClient.getTopEvents(limit),
  getTopPages: (limit) => clarityClient.getTopPages(limit),
};

export default clarityHandlers;
