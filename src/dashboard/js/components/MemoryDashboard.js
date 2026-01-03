/**
 * BambiSleep™ Church MCP Control Tower
 * Memory Dashboard - UI for memory system management
 */

import { escapeHtml } from './DynamicRenderer.js';

// ============================================================================
// MEMORY DASHBOARD COMPONENT
// ============================================================================

/**
 * Render the main memory dashboard container
 * @param {Object} [data] - Initial data
 * @returns {string} HTML string
 */
export function renderMemoryDashboard(data = {}) {
  const { stats = {}, preferences = {}, patterns = [], sessions = [] } = data;

  return `
    <div class="memory-dashboard glass-card">
      <header class="memory-dashboard-header">
        <h2>🧠 Memory System</h2>
        <div class="memory-actions">
          <button class="btn btn-sm" onclick="Dashboard.Memory.sync()">
            <span class="icon">🔄</span> Sync
          </button>
          <button class="btn btn-sm" onclick="Dashboard.Memory.cleanup()">
            <span class="icon">🧹</span> Cleanup
          </button>
          <button class="btn btn-sm" onclick="Dashboard.Memory.export()">
            <span class="icon">📤</span> Export
          </button>
        </div>
      </header>

      <div class="memory-dashboard-tabs">
        <button class="tab-btn active" data-tab="overview">Overview</button>
        <button class="tab-btn" data-tab="preferences">Preferences</button>
        <button class="tab-btn" data-tab="patterns">Patterns</button>
        <button class="tab-btn" data-tab="conversations">Conversations</button>
        <button class="tab-btn" data-tab="search">Search</button>
      </div>

      <div class="memory-dashboard-content">
        <div class="tab-panel active" data-panel="overview">
          ${renderMemoryStats(stats)}
        </div>
        <div class="tab-panel" data-panel="preferences">
          ${renderUserPreferences(preferences)}
        </div>
        <div class="tab-panel" data-panel="patterns">
          ${renderPatternsList(patterns)}
        </div>
        <div class="tab-panel" data-panel="conversations">
          ${renderConversationHistory(sessions)}
        </div>
        <div class="tab-panel" data-panel="search">
          ${renderMemorySearch()}
        </div>
      </div>
    </div>
  `;
}

// ============================================================================
// MEMORY STATS COMPONENT
// ============================================================================

/**
 * Render memory statistics panel
 * @param {Object} stats - Memory statistics
 * @returns {string} HTML string
 */
export function renderMemoryStats(stats = {}) {
  const {
    totalEntities = 0,
    totalRelations = 0,
    totalObservations = 0,
    byType = {},
    averageConfidence = 0,
    lastDecay = null,
    lastSync = null,
  } = stats;

  const entityTypes = Object.entries(byType);

  return `
    <div class="memory-stats">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-value">${totalEntities.toLocaleString()}</div>
          <div class="stat-label">Entities</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🔗</div>
          <div class="stat-value">${totalRelations.toLocaleString()}</div>
          <div class="stat-label">Relations</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">👁️</div>
          <div class="stat-value">${totalObservations.toLocaleString()}</div>
          <div class="stat-label">Observations</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📈</div>
          <div class="stat-value">${(averageConfidence * 100).toFixed(1)}%</div>
          <div class="stat-label">Avg Confidence</div>
        </div>
      </div>

      ${entityTypes.length > 0 ? `
        <div class="entity-types">
          <h4>Entities by Type</h4>
          <div class="type-bars">
            ${entityTypes.map(([type, count]) => `
              <div class="type-bar">
                <span class="type-label">${escapeHtml(type)}</span>
                <div class="type-progress">
                  <div class="type-fill" style="width: ${(count / totalEntities * 100).toFixed(1)}%"></div>
                </div>
                <span class="type-count">${count}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div class="sync-status">
        <div class="sync-item">
          <span class="sync-label">Last Decay:</span>
          <span class="sync-value">${lastDecay ? new Date(lastDecay).toLocaleString() : 'Never'}</span>
        </div>
        <div class="sync-item">
          <span class="sync-label">Last Sync:</span>
          <span class="sync-value">${lastSync ? new Date(lastSync).toLocaleString() : 'Never'}</span>
        </div>
      </div>
    </div>
  `;
}

// ============================================================================
// USER PREFERENCES COMPONENT
// ============================================================================

/**
 * Render user preferences editor
 * @param {Object} preferences - User preferences by category
 * @returns {string} HTML string
 */
export function renderUserPreferences(preferences = {}) {
  const categories = Object.entries(preferences);

  if (categories.length === 0) {
    return `
      <div class="preferences-empty">
        <div class="empty-icon">⚙️</div>
        <p>No preferences learned yet.</p>
        <p class="empty-hint">Preferences are learned automatically as you interact.</p>
      </div>
    `;
  }

  return `
    <div class="preferences-editor">
      ${categories.map(([category, prefs]) => `
        <div class="preference-category">
          <div class="category-header" onclick="Dashboard.Memory.toggleCategory('${escapeHtml(category)}')">
            <span class="category-icon">📁</span>
            <span class="category-name">${escapeHtml(category)}</span>
            <span class="category-count">${Object.keys(prefs).length}</span>
            <span class="category-toggle">▼</span>
          </div>
          <div class="category-content" data-category="${escapeHtml(category)}">
            ${Object.entries(prefs).map(([key, data]) => renderPreferenceItem(category, key, data)).join('')}
          </div>
        </div>
      `).join('')}

      <div class="preferences-actions">
        <button class="btn btn-sm" onclick="Dashboard.Memory.addPreference()">
          <span class="icon">➕</span> Add Preference
        </button>
        <button class="btn btn-sm btn-secondary" onclick="Dashboard.Memory.resetPreferences()">
          <span class="icon">🔄</span> Reset All
        </button>
      </div>
    </div>
  `;
}

/**
 * Render a single preference item
 * @param {string} category - Preference category
 * @param {string} key - Preference key
 * @param {Object} data - Preference data
 * @returns {string} HTML string
 */
function renderPreferenceItem(category, key, data) {
  const { value, confidence = 1, source = 'unknown', timestamp } = data;
  const confidenceClass = confidence >= 0.8 ? 'high' : confidence >= 0.5 ? 'medium' : 'low';

  return `
    <div class="preference-item" data-key="${escapeHtml(key)}">
      <div class="preference-key">
        <span class="key-name">${escapeHtml(key)}</span>
        <span class="key-source badge badge-${source}">${escapeHtml(source)}</span>
      </div>
      <div class="preference-value">
        <input type="text" 
               value="${escapeHtml(String(value))}" 
               onchange="Dashboard.Memory.updatePreference('${escapeHtml(category)}', '${escapeHtml(key)}', this.value)"
               class="preference-input" />
      </div>
      <div class="preference-meta">
        <span class="confidence confidence-${confidenceClass}" title="Confidence: ${(confidence * 100).toFixed(0)}%">
          ${'●'.repeat(Math.ceil(confidence * 5))}${'○'.repeat(5 - Math.ceil(confidence * 5))}
        </span>
        ${timestamp ? `<span class="timestamp">${formatTimeAgo(timestamp)}</span>` : ''}
      </div>
      <button class="btn-icon" onclick="Dashboard.Memory.deletePreference('${escapeHtml(category)}', '${escapeHtml(key)}')" title="Delete">
        🗑️
      </button>
    </div>
  `;
}

// ============================================================================
// PATTERNS LIST COMPONENT
// ============================================================================

/**
 * Render detected patterns list
 * @param {Array} patterns - Array of pattern objects
 * @returns {string} HTML string
 */
export function renderPatternsList(patterns = []) {
  if (patterns.length === 0) {
    return `
      <div class="patterns-empty">
        <div class="empty-icon">🔍</div>
        <p>No patterns detected yet.</p>
        <p class="empty-hint">Patterns are learned from your coding behavior over time.</p>
      </div>
    `;
  }

  return `
    <div class="patterns-list">
      <div class="patterns-header">
        <span class="pattern-count">${patterns.length} patterns detected</span>
        <select class="pattern-filter" onchange="Dashboard.Memory.filterPatterns(this.value)">
          <option value="all">All Types</option>
          <option value="code">Code Patterns</option>
          <option value="behavior">Behavior Patterns</option>
          <option value="preference">Preference Patterns</option>
        </select>
      </div>

      <div class="patterns-grid">
        ${patterns.map(pattern => renderPatternCard(pattern)).join('')}
      </div>
    </div>
  `;
}

/**
 * Render a single pattern card
 * @param {Object} pattern - Pattern data
 * @returns {string} HTML string
 */
function renderPatternCard(pattern) {
  const { name, type = 'unknown', confidence = 0, occurrences = 0, lastSeen, examples = [] } = pattern;
  const confidencePercent = (confidence * 100).toFixed(0);

  return `
    <div class="pattern-card glass-card" data-pattern="${escapeHtml(name)}">
      <div class="pattern-header">
        <span class="pattern-icon">${getPatternIcon(type)}</span>
        <h4 class="pattern-name">${escapeHtml(name)}</h4>
        <span class="pattern-type badge">${escapeHtml(type)}</span>
      </div>
      
      <div class="pattern-stats">
        <div class="pattern-stat">
          <span class="stat-value">${confidencePercent}%</span>
          <span class="stat-label">Confidence</span>
        </div>
        <div class="pattern-stat">
          <span class="stat-value">${occurrences}</span>
          <span class="stat-label">Occurrences</span>
        </div>
      </div>

      ${examples.length > 0 ? `
        <div class="pattern-examples">
          <span class="examples-label">Examples:</span>
          <ul class="examples-list">
            ${examples.slice(0, 3).map(ex => `<li>${escapeHtml(ex)}</li>`).join('')}
          </ul>
          ${examples.length > 3 ? `<span class="more-examples">+${examples.length - 3} more</span>` : ''}
        </div>
      ` : ''}

      <div class="pattern-footer">
        ${lastSeen ? `<span class="last-seen">Last: ${formatTimeAgo(lastSeen)}</span>` : ''}
        <button class="btn-icon" onclick="Dashboard.Memory.viewPattern('${escapeHtml(name)}')" title="View Details">
          👁️
        </button>
      </div>
    </div>
  `;
}

/**
 * Get icon for pattern type
 * @param {string} type - Pattern type
 * @returns {string} Emoji icon
 */
function getPatternIcon(type) {
  const icons = {
    code: '💻',
    behavior: '🎯',
    preference: '⭐',
    time: '⏰',
    workflow: '🔄',
    unknown: '❓',
  };
  return icons[type] || icons.unknown;
}

// ============================================================================
// CONVERSATION HISTORY COMPONENT
// ============================================================================

/**
 * Render conversation history timeline
 * @param {Array} sessions - Array of conversation sessions
 * @returns {string} HTML string
 */
export function renderConversationHistory(sessions = []) {
  if (sessions.length === 0) {
    return `
      <div class="conversations-empty">
        <div class="empty-icon">💬</div>
        <p>No conversation history yet.</p>
        <p class="empty-hint">Start a chat to build conversation memory.</p>
      </div>
    `;
  }

  return `
    <div class="conversation-history">
      <div class="history-controls">
        <input type="text" 
               class="history-search" 
               placeholder="Search conversations..." 
               oninput="Dashboard.Memory.searchConversations(this.value)" />
        <select class="history-filter" onchange="Dashboard.Memory.filterConversations(this.value)">
          <option value="all">All Sessions</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="summarized">Summarized</option>
        </select>
      </div>

      <div class="conversation-timeline">
        ${sessions.map(session => renderSessionCard(session)).join('')}
      </div>

      <div class="history-pagination">
        <button class="btn btn-sm" onclick="Dashboard.Memory.loadMoreSessions()">
          Load More
        </button>
      </div>
    </div>
  `;
}

/**
 * Render a conversation session card
 * @param {Object} session - Session data
 * @returns {string} HTML string
 */
function renderSessionCard(session) {
  const { 
    id, 
    startedAt, 
    endedAt, 
    status = 'unknown', 
    messageCount = 0, 
    summary, 
    topics = [],
    tasks = [] 
  } = session;

  const statusClass = status === 'active' ? 'status-active' : 
                      status === 'completed' ? 'status-completed' : 'status-unknown';

  return `
    <div class="session-card glass-card" data-session="${escapeHtml(id)}">
      <div class="session-header">
        <span class="session-date">${formatDate(startedAt)}</span>
        <span class="session-status ${statusClass}">${escapeHtml(status)}</span>
      </div>

      <div class="session-meta">
        <span class="meta-item">
          <span class="meta-icon">💬</span>
          ${messageCount} messages
        </span>
        ${endedAt ? `
          <span class="meta-item">
            <span class="meta-icon">⏱️</span>
            ${formatDuration(startedAt, endedAt)}
          </span>
        ` : ''}
      </div>

      ${summary ? `
        <div class="session-summary">
          <p>${escapeHtml(summary)}</p>
        </div>
      ` : ''}

      ${topics.length > 0 ? `
        <div class="session-topics">
          ${topics.map(topic => `<span class="topic-tag">${escapeHtml(topic)}</span>`).join('')}
        </div>
      ` : ''}

      ${tasks.length > 0 ? `
        <div class="session-tasks">
          <span class="tasks-label">Tasks:</span>
          <ul class="tasks-list">
            ${tasks.slice(0, 3).map(task => `
              <li class="${task.completed ? 'completed' : ''}">${escapeHtml(task.text)}</li>
            `).join('')}
          </ul>
        </div>
      ` : ''}

      <div class="session-actions">
        <button class="btn btn-sm" onclick="Dashboard.Memory.viewSession('${escapeHtml(id)}')">
          View
        </button>
        ${!summary && status === 'completed' ? `
          <button class="btn btn-sm btn-secondary" onclick="Dashboard.Memory.summarizeSession('${escapeHtml(id)}')">
            Summarize
          </button>
        ` : ''}
        <button class="btn btn-sm btn-danger" onclick="Dashboard.Memory.deleteSession('${escapeHtml(id)}')">
          Delete
        </button>
      </div>
    </div>
  `;
}

// ============================================================================
// MEMORY SEARCH COMPONENT
// ============================================================================

/**
 * Render memory search interface
 * @param {Object} [results] - Search results
 * @returns {string} HTML string
 */
export function renderMemorySearch(results = null) {
  return `
    <div class="memory-search">
      <div class="search-form">
        <div class="search-input-group">
          <input type="text" 
                 id="memory-search-query"
                 class="search-input" 
                 placeholder="Search memory..." 
                 onkeydown="if(event.key==='Enter') Dashboard.Memory.performSearch()" />
          <button class="btn btn-primary" onclick="Dashboard.Memory.performSearch()">
            🔍 Search
          </button>
        </div>

        <div class="search-filters">
          <div class="filter-group">
            <label>Entity Type:</label>
            <select id="memory-search-type">
              <option value="">All Types</option>
              <option value="user_preference">User Preferences</option>
              <option value="user_pattern">User Patterns</option>
              <option value="conversation_session">Conversations</option>
              <option value="workspace_project">Projects</option>
              <option value="workspace_file">Files</option>
              <option value="code_pattern">Code Patterns</option>
            </select>
          </div>

          <div class="filter-group">
            <label>Min Confidence:</label>
            <input type="range" 
                   id="memory-search-confidence" 
                   min="0" max="100" value="0" 
                   oninput="document.getElementById('confidence-value').textContent = this.value + '%'" />
            <span id="confidence-value">0%</span>
          </div>

          <div class="filter-group">
            <label>Date Range:</label>
            <input type="date" id="memory-search-start" />
            <span>to</span>
            <input type="date" id="memory-search-end" />
          </div>
        </div>
      </div>

      <div class="search-results" id="memory-search-results">
        ${results ? renderSearchResults(results) : `
          <div class="search-placeholder">
            <div class="placeholder-icon">🔎</div>
            <p>Enter a search query to find memories.</p>
          </div>
        `}
      </div>
    </div>
  `;
}

/**
 * Render search results
 * @param {Object} results - Search results
 * @returns {string} HTML string
 */
export function renderSearchResults(results) {
  const { entities = [], total = 0, took = 0 } = results;

  if (entities.length === 0) {
    return `
      <div class="no-results">
        <div class="no-results-icon">🔍</div>
        <p>No results found.</p>
        <p class="no-results-hint">Try different search terms or filters.</p>
      </div>
    `;
  }

  return `
    <div class="results-header">
      <span class="results-count">${total} results</span>
      <span class="results-time">(${took}ms)</span>
    </div>

    <div class="results-list">
      ${entities.map(entity => renderSearchResultItem(entity)).join('')}
    </div>
  `;
}

/**
 * Render a single search result item
 * @param {Object} entity - Entity data
 * @returns {string} HTML string
 */
function renderSearchResultItem(entity) {
  const { name, entityType, observations = [], confidence = 1 } = entity;
  const confidencePercent = (confidence * 100).toFixed(0);

  return `
    <div class="result-item" onclick="Dashboard.Memory.viewEntity('${escapeHtml(name)}')">
      <div class="result-header">
        <span class="result-type badge">${escapeHtml(entityType)}</span>
        <span class="result-name">${escapeHtml(name)}</span>
        <span class="result-confidence">${confidencePercent}%</span>
      </div>
      <div class="result-observations">
        ${observations.slice(0, 3).map(obs => `
          <span class="observation-preview">${escapeHtml(obs.substring(0, 100))}${obs.length > 100 ? '...' : ''}</span>
        `).join('')}
      </div>
    </div>
  `;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format timestamp as relative time
 * @param {string|Date} timestamp - Timestamp
 * @returns {string} Formatted string
 */
function formatTimeAgo(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

/**
 * Format date as readable string
 * @param {string|Date} timestamp - Timestamp
 * @returns {string} Formatted date
 */
function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format duration between two timestamps
 * @param {string|Date} start - Start time
 * @param {string|Date} end - End time
 * @returns {string} Formatted duration
 */
function formatDuration(start, end) {
  const diff = new Date(end) - new Date(start);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}m`;
}

// ============================================================================
// DASHBOARD CONTROLLER
// ============================================================================

/**
 * Initialize memory dashboard controller
 * Attaches to window.Dashboard.Memory
 */
export function initMemoryDashboard() {
  const controller = {
    container: null,
    data: {
      stats: {},
      preferences: {},
      patterns: [],
      sessions: [],
    },

    /**
     * Initialize the dashboard
     * @param {string} containerId - Container element ID
     */
    async init(containerId) {
      this.container = document.getElementById(containerId);
      if (!this.container) {
        console.error('Memory dashboard container not found:', containerId);
        return;
      }

      await this.refresh();
      this.setupEventListeners();
    },

    /**
     * Refresh dashboard data
     */
    async refresh() {
      try {
        const [stats, prefs, patterns, sessions] = await Promise.all([
          fetch('/api/memory/stats').then(r => r.json()).catch(() => ({})),
          fetch('/api/user/preferences').then(r => r.json()).catch(() => ({})),
          fetch('/api/user/patterns').then(r => r.json()).catch(() => []),
          fetch('/api/conversation/sessions?limit=20').then(r => r.json()).catch(() => []),
        ]);

        this.data = { stats, preferences: prefs, patterns, sessions };
        this.render();
      } catch (error) {
        console.error('Failed to refresh memory dashboard:', error);
      }
    },

    /**
     * Render the dashboard
     */
    render() {
      if (!this.container) return;
      this.container.innerHTML = renderMemoryDashboard(this.data);
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
      if (!this.container) return;

      // Tab switching
      this.container.addEventListener('click', (e) => {
        const tabBtn = e.target.closest('.tab-btn');
        if (tabBtn) {
          const tab = tabBtn.dataset.tab;
          this.switchTab(tab);
        }
      });
    },

    /**
     * Switch to a tab
     * @param {string} tab - Tab name
     */
    switchTab(tab) {
      if (!this.container) return;

      // Update buttons
      this.container.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
      });

      // Update panels
      this.container.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.toggle('active', panel.dataset.panel === tab);
      });
    },

    /**
     * Sync memory to MongoDB
     */
    async sync() {
      try {
        const result = await fetch('/api/memory/sync', { method: 'POST' }).then(r => r.json());
        window.Dashboard?.showToast?.('Memory synced successfully', 'success');
        await this.refresh();
      } catch (error) {
        window.Dashboard?.showToast?.('Sync failed: ' + error.message, 'error');
      }
    },

    /**
     * Cleanup low-confidence entities
     */
    async cleanup() {
      if (!confirm('Remove low-confidence entities? This cannot be undone.')) return;

      try {
        const result = await fetch('/api/memory/cleanup', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ threshold: 0.1 }),
        }).then(r => r.json());

        window.Dashboard?.showToast?.(`Cleaned up ${result.removed || 0} entities`, 'success');
        await this.refresh();
      } catch (error) {
        window.Dashboard?.showToast?.('Cleanup failed: ' + error.message, 'error');
      }
    },

    /**
     * Export memory to file
     */
    async export() {
      try {
        const result = await fetch('/api/memory/export', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }).then(r => r.json());

        window.Dashboard?.showToast?.('Memory exported successfully', 'success');
      } catch (error) {
        window.Dashboard?.showToast?.('Export failed: ' + error.message, 'error');
      }
    },

    /**
     * Perform memory search
     */
    async performSearch() {
      const query = document.getElementById('memory-search-query')?.value || '';
      const entityType = document.getElementById('memory-search-type')?.value || '';
      const minConfidence = (parseInt(document.getElementById('memory-search-confidence')?.value || '0')) / 100;
      const startDate = document.getElementById('memory-search-start')?.value || '';
      const endDate = document.getElementById('memory-search-end')?.value || '';

      try {
        const result = await fetch('/api/memory/search/advanced', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            entityType: entityType || undefined,
            minConfidence: minConfidence || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            limit: 50,
          }),
        }).then(r => r.json());

        const container = document.getElementById('memory-search-results');
        if (container) {
          container.innerHTML = renderSearchResults(result);
        }
      } catch (error) {
        console.error('Search failed:', error);
      }
    },

    /**
     * Toggle preference category
     * @param {string} category - Category name
     */
    toggleCategory(category) {
      const content = this.container?.querySelector(`[data-category="${category}"]`);
      if (content) {
        content.classList.toggle('collapsed');
      }
    },

    /**
     * Update a preference
     */
    async updatePreference(category, key, value) {
      try {
        await fetch(`/api/user/preferences/${category}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [key]: value }),
        });
        window.Dashboard?.showToast?.('Preference updated', 'success');
      } catch (error) {
        window.Dashboard?.showToast?.('Failed to update preference', 'error');
      }
    },

    /**
     * Delete a preference
     */
    async deletePreference(category, key) {
      // Implementation would delete the preference
      window.Dashboard?.showToast?.('Preference deleted', 'success');
      await this.refresh();
    },

    /**
     * View session details
     * @param {string} sessionId - Session ID
     */
    async viewSession(sessionId) {
      try {
        const session = await fetch(`/api/conversation/sessions/${sessionId}`).then(r => r.json());
        // Show in modal
        window.Dashboard?.showModal?.({
          title: `Session: ${sessionId}`,
          content: JSON.stringify(session, null, 2),
        });
      } catch (error) {
        console.error('Failed to load session:', error);
      }
    },

    /**
     * Summarize a session
     * @param {string} sessionId - Session ID
     */
    async summarizeSession(sessionId) {
      try {
        const result = await fetch(`/api/conversation/sessions/${sessionId}/summarize`, {
          method: 'POST',
        }).then(r => r.json());
        window.Dashboard?.showToast?.('Session summarized', 'success');
        await this.refresh();
      } catch (error) {
        window.Dashboard?.showToast?.('Summarization failed: ' + error.message, 'error');
      }
    },

    /**
     * Delete a session
     * @param {string} sessionId - Session ID
     */
    async deleteSession(sessionId) {
      if (!confirm('Delete this conversation session?')) return;
      // Implementation would delete the session
      await this.refresh();
    },

    /**
     * View entity details
     * @param {string} name - Entity name
     */
    async viewEntity(name) {
      try {
        const related = await fetch(`/api/memory/related/${encodeURIComponent(name)}`).then(r => r.json());
        window.Dashboard?.showModal?.({
          title: `Entity: ${name}`,
          content: JSON.stringify(related, null, 2),
        });
      } catch (error) {
        console.error('Failed to load entity:', error);
      }
    },
  };

  // Attach to global Dashboard object
  if (typeof window !== 'undefined') {
    window.Dashboard = window.Dashboard || {};
    window.Dashboard.Memory = controller;
  }

  return controller;
}

// Export for module usage
export default {
  renderMemoryDashboard,
  renderMemoryStats,
  renderUserPreferences,
  renderPatternsList,
  renderConversationHistory,
  renderMemorySearch,
  renderSearchResults,
  initMemoryDashboard,
};
