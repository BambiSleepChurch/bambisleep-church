/**
 * BambiSleep™ Church MCP Control Tower
 * Activity Feed Component - Timeline of events
 */

import { AppState } from '../state/store.js';

const MAX_FEED_ITEMS = 50;

/**
 * Activity types with icons
 */
const ACTIVITY_ICONS = {
  'server:started': '▶️',
  'server:stopped': '⏹️',
  'server:error': '❌',
  'server:log': '📝',
  'health:update': '💓',
  'ws:connected': '🔌',
  'ws:disconnected': '🔴',
  'api:request': '📡',
};

/**
 * Format timestamp for display
 */
function formatTime(date) {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Render single activity item
 */
function renderActivityItem(item) {
  const icon = ACTIVITY_ICONS[item.type] || '📌';
  const levelClass = item.level || 'info';
  
  return `
    <div class="activity-item activity-${levelClass}" data-type="${item.type}">
      <span class="activity-icon">${icon}</span>
      <span class="activity-time">${formatTime(item.timestamp)}</span>
      <span class="activity-message">${item.message}</span>
      ${item.server ? `<span class="activity-server">${item.server}</span>` : ''}
    </div>
  `;
}

/**
 * Render activity feed panel
 */
export function renderActivityFeed(activities = []) {
  if (activities.length === 0) {
    return `
      <div class="activity-feed glass-card">
        <div class="activity-header">
          <h3>📋 Activity Feed</h3>
          <button class="btn btn-sm btn-secondary" onclick="window.Dashboard.clearActivityFeed()">Clear</button>
        </div>
        <div class="activity-list">
          <div class="activity-empty">No recent activity</div>
        </div>
      </div>
    `;
  }

  const items = activities
    .slice(-MAX_FEED_ITEMS)
    .reverse()
    .map(renderActivityItem)
    .join('');

  return `
    <div class="activity-feed glass-card">
      <div class="activity-header">
        <h3>📋 Activity Feed</h3>
        <span class="activity-count">${activities.length} events</span>
        <button class="btn btn-sm btn-secondary" onclick="window.Dashboard.clearActivityFeed()">Clear</button>
      </div>
      <div class="activity-list">
        ${items}
      </div>
    </div>
  `;
}

/**
 * Update activity feed in DOM
 */
export function updateActivityFeed() {
  const container = document.getElementById('activity-feed');
  if (!container) return;
  
  const activities = AppState.getState().activities || [];
  container.innerHTML = renderActivityFeed(activities);
}

/**
 * Add activity to feed
 */
export function addActivity(type, message, options = {}) {
  const state = AppState.getState();
  const activities = state.activities || [];
  
  const newActivity = {
    id: Date.now(),
    type,
    message,
    timestamp: new Date(),
    server: options.server || null,
    level: options.level || 'info',
  };
  
  // Keep last MAX_FEED_ITEMS
  const updated = [...activities, newActivity].slice(-MAX_FEED_ITEMS);
  
  AppState.setState({ activities: updated });
  updateActivityFeed();
}

/**
 * Clear activity feed
 */
export function clearActivityFeed() {
  AppState.setState({ activities: [] });
  updateActivityFeed();
}
