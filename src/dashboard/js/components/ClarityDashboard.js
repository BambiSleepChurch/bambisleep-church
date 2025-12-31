/**
 * BambiSleep™ Church MCP Control Tower
 * Clarity Analytics Dashboard Component
 */

/**
 * Render the Clarity analytics dashboard
 * @param {Object} data - Dashboard data from API
 * @returns {string} HTML string
 */
export function renderClarityDashboard(data = {}) {
  const {
    initialized = false,
    projectId = 'utux7nv0pm',
    currentSession = null,
    sessions = [],
    events = [],
    pageViews = [],
    topEvents = [],
    topPages = [],
  } = data;

  const statusClass = initialized ? 'connected' : 'disconnected';
  const statusText = initialized ? 'Active' : 'Inactive';

  return `
    <section class="clarity-dashboard glass-card" id="clarity-dashboard">
      <header class="clarity-header">
        <div class="clarity-title">
          <span class="clarity-icon">📊</span>
          <h2>Microsoft Clarity Analytics</h2>
          <span class="status-badge ${statusClass}">${statusText}</span>
        </div>
        <div class="clarity-actions">
          <button class="btn btn-small btn-outline" onclick="clarityAction('refresh')">
            <span>🔄</span> Refresh
          </button>
          <a href="https://clarity.microsoft.com/projects/view/${projectId}/dashboard" 
             target="_blank" class="btn btn-small btn-primary">
            <span>🔗</span> Open Clarity
          </a>
        </div>
      </header>

      <div class="clarity-grid">
        ${renderClarityStats(data)}
        ${renderCurrentSession(currentSession)}
        ${renderTopEvents(topEvents)}
        ${renderTopPages(topPages)}
        ${renderRecentSessions(sessions)}
        ${renderEventTimeline(events)}
      </div>
    </section>
  `;
}

/**
 * Render clarity stats cards
 */
function renderClarityStats(data) {
  const { totalSessions = 0, totalPageViews = 0, totalEvents = 0, uniqueUsers = 0 } = data;

  return `
    <div class="clarity-stats">
      <div class="clarity-stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-info">
          <span class="stat-value">${totalSessions}</span>
          <span class="stat-label">Sessions</span>
        </div>
      </div>
      <div class="clarity-stat-card">
        <div class="stat-icon">📄</div>
        <div class="stat-info">
          <span class="stat-value">${totalPageViews}</span>
          <span class="stat-label">Page Views</span>
        </div>
      </div>
      <div class="clarity-stat-card">
        <div class="stat-icon">⚡</div>
        <div class="stat-info">
          <span class="stat-value">${totalEvents}</span>
          <span class="stat-label">Events</span>
        </div>
      </div>
      <div class="clarity-stat-card">
        <div class="stat-icon">🎯</div>
        <div class="stat-info">
          <span class="stat-value">${uniqueUsers}</span>
          <span class="stat-label">Unique Users</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render current session info
 */
function renderCurrentSession(session) {
  if (!session) {
    return `
      <div class="clarity-card current-session">
        <h3>📍 Current Session</h3>
        <p class="muted">No active session</p>
      </div>
    `;
  }

  const duration = formatDuration(session.startTime);
  
  return `
    <div class="clarity-card current-session">
      <h3>📍 Current Session</h3>
      <div class="session-details">
        <div class="detail-row">
          <span class="detail-label">Session ID</span>
          <code class="detail-value">${session.id?.slice(0, 12)}...</code>
        </div>
        <div class="detail-row">
          <span class="detail-label">User ID</span>
          <span class="detail-value">${session.userId || 'Anonymous'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Duration</span>
          <span class="detail-value">${duration}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Page Views</span>
          <span class="detail-value">${session.pageViews || 0}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Events</span>
          <span class="detail-value">${session.events || 0}</span>
        </div>
      </div>
      ${session.tags?.length > 0 ? renderSessionTags(session.tags) : ''}
    </div>
  `;
}

/**
 * Render session tags
 */
function renderSessionTags(tags) {
  const tagItems = Object.entries(tags)
    .map(([key, value]) => `<span class="tag">${key}: ${value}</span>`)
    .join('');
  
  return `
    <div class="session-tags">
      <span class="tags-label">Tags:</span>
      ${tagItems}
    </div>
  `;
}

/**
 * Render top events
 */
function renderTopEvents(events = []) {
  if (events.length === 0) {
    return `
      <div class="clarity-card top-events">
        <h3>⚡ Top Events</h3>
        <p class="muted">No events recorded yet</p>
      </div>
    `;
  }

  const eventRows = events
    .slice(0, 5)
    .map((event, index) => `
      <div class="event-row">
        <span class="event-rank">#${index + 1}</span>
        <span class="event-name">${event.name}</span>
        <span class="event-count">${event.count}</span>
      </div>
    `)
    .join('');

  return `
    <div class="clarity-card top-events">
      <h3>⚡ Top Events</h3>
      <div class="events-list">${eventRows}</div>
    </div>
  `;
}

/**
 * Render top pages
 */
function renderTopPages(pages = []) {
  if (pages.length === 0) {
    return `
      <div class="clarity-card top-pages">
        <h3>📄 Top Pages</h3>
        <p class="muted">No page views recorded yet</p>
      </div>
    `;
  }

  const pageRows = pages
    .slice(0, 5)
    .map((page, index) => `
      <div class="page-row">
        <span class="page-rank">#${index + 1}</span>
        <span class="page-path" title="${page.path}">${truncatePath(page.path)}</span>
        <span class="page-views">${page.views}</span>
      </div>
    `)
    .join('');

  return `
    <div class="clarity-card top-pages">
      <h3>📄 Top Pages</h3>
      <div class="pages-list">${pageRows}</div>
    </div>
  `;
}

/**
 * Render recent sessions list
 */
function renderRecentSessions(sessions = []) {
  if (sessions.length === 0) {
    return `
      <div class="clarity-card recent-sessions">
        <h3>🕐 Recent Sessions</h3>
        <p class="muted">No sessions recorded yet</p>
      </div>
    `;
  }

  const sessionRows = sessions
    .slice(0, 10)
    .map(session => `
      <div class="session-row" data-session-id="${session.id}">
        <div class="session-info">
          <span class="session-user">${session.userId || 'Anonymous'}</span>
          <span class="session-time">${formatTime(session.startTime)}</span>
        </div>
        <div class="session-meta">
          <span class="meta-item">📄 ${session.pageViews || 0}</span>
          <span class="meta-item">⚡ ${session.events || 0}</span>
          <span class="session-duration">${formatDuration(session.startTime, session.endTime)}</span>
        </div>
      </div>
    `)
    .join('');

  return `
    <div class="clarity-card recent-sessions">
      <h3>🕐 Recent Sessions</h3>
      <div class="sessions-list">${sessionRows}</div>
    </div>
  `;
}

/**
 * Render event timeline
 */
function renderEventTimeline(events = []) {
  if (events.length === 0) {
    return `
      <div class="clarity-card event-timeline">
        <h3>📊 Event Timeline</h3>
        <p class="muted">No events recorded yet</p>
      </div>
    `;
  }

  const timelineItems = events
    .slice(0, 20)
    .map(event => {
      const icon = getEventIcon(event.type);
      return `
        <div class="timeline-item ${event.type}">
          <span class="timeline-icon">${icon}</span>
          <div class="timeline-content">
            <span class="timeline-event">${event.name}</span>
            <span class="timeline-time">${formatTime(event.timestamp)}</span>
          </div>
        </div>
      `;
    })
    .join('');

  return `
    <div class="clarity-card event-timeline">
      <h3>📊 Event Timeline</h3>
      <div class="timeline">${timelineItems}</div>
    </div>
  `;
}

/**
 * Render quick actions panel
 */
export function renderClarityActions() {
  return `
    <div class="clarity-quick-actions">
      <h4>Quick Actions</h4>
      <div class="action-buttons">
        <button class="btn btn-small" onclick="clarityAction('identify')">
          👤 Identify User
        </button>
        <button class="btn btn-small" onclick="clarityAction('tag')">
          🏷️ Add Tag
        </button>
        <button class="btn btn-small" onclick="clarityAction('event')">
          ⚡ Track Event
        </button>
        <button class="btn btn-small" onclick="clarityAction('upgrade')">
          ⬆️ Upgrade Session
        </button>
      </div>
    </div>
  `;
}

/**
 * Get icon for event type
 */
function getEventIcon(type) {
  const icons = {
    pageview: '📄',
    click: '👆',
    scroll: '📜',
    input: '⌨️',
    custom: '⚡',
    identify: '👤',
    tag: '🏷️',
    error: '❌',
    default: '📌',
  };
  return icons[type] || icons.default;
}

/**
 * Format duration
 */
function formatDuration(startTime, endTime = null) {
  const start = new Date(startTime).getTime();
  const end = endTime ? new Date(endTime).getTime() : Date.now();
  const seconds = Math.floor((end - start) / 1000);

  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

/**
 * Format timestamp
 */
function formatTime(timestamp) {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Truncate long paths
 */
function truncatePath(path, maxLength = 30) {
  if (!path || path.length <= maxLength) return path;
  return `...${path.slice(-maxLength + 3)}`;
}
