/**
 * BambiSleep™ Church MCP Control Tower
 * Main Application Entry Point
 * 
 * Modular architecture with:
 * - State management (store)
 * - Components (UI rendering)
 * - Effects (side effects/hooks)
 * - Services (API/WebSocket)
 */

// Configuration
import * as Config from './config.js';

// State
import { Actions, AppState, Selectors } from './state/store.js';

// Services
import { fetchServers, startServer, stopServer } from './services/api.js';
import { initWebSocket } from './services/websocket.js';

// Components
import {
    addActivity,
    AgentChatController,
    clearActivityFeed,
    closeAllModals,
    exportConfigs,
    getModal,
    importConfigs,
    initModals,
    initSearchBar,
    initTheme,
    initWorkspace,
    renderActivityFeed,
    renderClarityDashboard,
    renderServerGrid,
    renderToastContainer,
    ServerDrag,
    showToast,
    sortServersByOrder,
    toggleTheme,
    updateStatsBar,
    updateSystemInfo,
    updateWsIndicator,
    WorkspaceAPI
} from './components/index.js';

// Effects
import { useKeyboard } from './effects/useKeyboard.js';
import { usePolling } from './effects/usePolling.js';
import { useSubscription } from './effects/useSubscription.js';

// ============================================================================
// SERVER ACTION DISPATCH TABLE
// Maps serverType -> action -> handler function
// ============================================================================

const SERVER_ACTIONS = {
  memory: {
    readGraph: (api) => api.fetchMemoryGraph(),
    search: async (api) => {
      const query = prompt('Search query:');
      return query ? api.searchMemory(query) : null;
    },
  },
  github: {
    user: (api) => api.fetchGitHubUser(),
    repos: (api) => api.fetchGitHubRepos(),
  },
  mongodb: {
    connect: (api) => api.connectMongoDB(),
    collections: (api) => api.fetchMongoDBCollections(),
    stats: (api) => api.fetchMongoDBStats(),
  },
  stripe: {
    customers: (api) => api.fetchStripeCustomers(),
    balance: (api) => api.fetchStripeBalance(),
  },
  huggingface: {
    models: (api) => {
      const query = prompt('Search models:') || 'llama';
      return api.searchHuggingFaceModels(query);
    },
    datasets: (api) => {
      const query = prompt('Search datasets:') || 'text';
      return api.searchHuggingFaceDatasets(query);
    },
  },
  storage: {
    files: (api) => api.fetchStorageFiles(),
    stats: (api) => api.fetchStorageStats(),
  },
  puppeteer: {
    status: (api) => api.fetchPuppeteerStatus(),
    launch: (api) => api.launchPuppeteer(),
  },
  sqlite: {
    tables: (api) => api.fetchSQLiteTables(),
    stats: (api) => api.fetchSQLiteStats(),
  },
  thinking: {
    sessions: (api) => api.fetchThinkingSessions(),
    stats: (api) => api.fetchThinkingStats(),
  },
  fetch: {
    ping: async (api) => {
      const url = prompt('URL to ping:');
      return url ? api.pingUrl(url) : null;
    },
  },
  clarity: {
    init: (api) => api.initClarity(),
    dashboard: (api) => api.fetchClarityDashboard(),
    identify: async (api) => {
      const userId = prompt('User ID:');
      const friendlyName = prompt('Friendly name (optional):');
      return userId ? api.identifyClarityUser(userId, { friendlyName }) : null;
    },
    tag: async (api) => {
      const key = prompt('Tag key:');
      const value = prompt('Tag value:');
      return (key && value) ? api.setClarityTag(key, value) : null;
    },
    event: async (api) => {
      const eventName = prompt('Event name:');
      return eventName ? api.trackClarityEvent(eventName) : null;
    },
    sessions: (api) => api.fetchClaritySessions(),
    events: (api) => api.fetchClarityEvents(),
    'top-events': (api) => api.fetchClarityTopEvents(),
    'top-pages': (api) => api.fetchClarityTopPages(),
    upgrade: async (api) => {
      const reason = prompt('Upgrade reason:') || 'user_request';
      return api.upgradeClaritySession(reason);
    },
    reset: async (api) => {
      if (confirm('Reset all analytics data?')) {
        return api.resetClarity();
      }
      return null;
    },
  },
};

/**
 * Execute a server action using the dispatch table
 * @param {Object} api - API module
 * @param {string} serverType - Server type (memory, github, etc.)
 * @param {string} action - Action name
 * @returns {Promise<any>} Action result
 */
async function executeServerAction(api, serverType, action) {
  const serverActions = SERVER_ACTIONS[serverType];
  if (!serverActions) {
    return { error: `Unknown server type: ${serverType}` };
  }
  
  const handler = serverActions[action];
  if (!handler) {
    return { error: `Unknown action: ${action} for ${serverType}` };
  }
  
  return handler(api);
}

// ============================================================================
// GLOBAL DASHBOARD API
// Exposed to window for onclick handlers in templates
// ============================================================================

window.Dashboard = {
  // Server actions
  async startServer(name) {
    try {
      showToast('info', 'Starting', `Starting ${name}...`);
      await startServer(name);
      await refreshData();
    } catch (error) {
      showToast('error', 'Failed to Start', error.message);
    }
  },

  async stopServer(name) {
    try {
      showToast('info', 'Stopping', `Stopping ${name}...`);
      await stopServer(name);
      await refreshData();
    } catch (error) {
      showToast('error', 'Failed to Stop', error.message);
    }
  },

  // Modal actions
  openServerModal(serverName) {
    const server = Selectors.serverByName(serverName)(AppState.getState());
    if (server) {
      getModal('server')?.showServer(server);
    }
  },

  closeModal() {
    closeAllModals();
  },

  toggleShortcutsHelp() {
    const modal = getModal('shortcuts');
    if (modal) {
      modal.isOpen() ? modal.close() : modal.open();
    }
  },

  // Log actions
  clearServerLogs(serverName) {
    Actions.clearServerLogs(serverName);
    const logStream = document.getElementById(`log-stream-${serverName}`);
    if (logStream) {
      logStream.innerHTML = '<div class="log-entry log-info">Logs cleared</div>';
    }
  },

  // Theme actions
  toggleTheme() {
    const newTheme = toggleTheme();
    showToast('info', 'Theme Changed', `Switched to ${newTheme} mode`);
    addActivity('theme:changed', `Switched to ${newTheme} mode`);
    // Update theme toggle button
    const btn = document.querySelector('.theme-toggle');
    if (btn) {
      btn.innerHTML = newTheme === 'dark' ? '🌙' : '☀️';
      btn.title = newTheme === 'dark' ? 'Light Mode' : 'Dark Mode';
    }
  },

  // Activity feed actions
  clearActivityFeed() {
    clearActivityFeed();
    showToast('info', 'Cleared', 'Activity feed cleared');
  },

  // Config export/import
  exportConfigs() {
    const servers = AppState.getState().servers;
    exportConfigs(servers);
    addActivity('config:exported', `Exported ${servers.length} server configs`);
  },

  importConfigs() {
    importConfigs((imported) => {
      addActivity('config:imported', `Imported ${imported.length} server configs`);
      // Note: In a full implementation, this would update the server config
      showToast('info', 'Note', 'Imported configs can be applied via settings.json');
    });
  },

  // Server-specific actions (dispatch table pattern)
  async serverAction(serverType, action) {
    const resultEl = document.querySelector(`[id^="server-action-result"]`);
    if (resultEl) resultEl.innerHTML = '<em>Loading...</em>';

    try {
      const api = await import('./services/api.js');
      const result = await executeServerAction(api, serverType, action);
      
      if (resultEl && result) {
        resultEl.innerHTML = `<pre>${JSON.stringify(result, null, 2)}</pre>`;
      }
      
      addActivity(`${serverType}:${action}`, `Executed ${action} on ${serverType}`);
      showToast('success', 'Action Complete', `${serverType}:${action}`);
      
    } catch (error) {
      if (resultEl) resultEl.innerHTML = `<span class="error">Error: ${error.message}</span>`;
      showToast('error', 'Action Failed', error.message);
    }
  },

  // Refresh
  async refresh() {
    await refreshData();
  },

  // Clarity Analytics
  async refreshClarity() {
    try {
      const container = document.getElementById('clarity-container');
      if (!container) return;
      
      // Show loading state
      container.innerHTML = `
        <div class="glass-card skeleton-card">
          <div class="loading-spinner"></div>
          <p>Loading analytics...</p>
        </div>
      `;
      
      // Fetch dashboard data
      const api = await import('./services/api.js');
      const data = await api.fetchClarityDashboard();
      
      // Render dashboard
      container.innerHTML = renderClarityDashboard(data);
      
      addActivity('clarity:refreshed', 'Analytics dashboard refreshed');
    } catch (error) {
      const container = document.getElementById('clarity-container');
      if (container) {
        container.innerHTML = `
          <div class="glass-card skeleton-card">
            <p class="error">⚠️ ${error.message}</p>
            <button class="btn btn-outline" onclick="window.Dashboard.refreshClarity()">Retry</button>
          </div>
        `;
      }
      showToast('error', 'Analytics Error', error.message);
    }
  },

  // Sidebar toggle
  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (window.innerWidth <= 1024) {
      // Mobile: slide in/out
      sidebar?.classList.toggle('open');
      overlay?.classList.toggle('visible');
    } else {
      // Desktop: collapse/expand
      sidebar?.classList.toggle('collapsed');
    }
  },

  // Agent Workspace toggle
  toggleWorkspace() {
    const layout = document.getElementById('agent-layout');
    const panel = document.getElementById('agent-workspace-panel');
    const toggle = document.getElementById('workspace-toggle');
    
    if (!layout || !panel) return;
    
    const isCollapsed = panel.classList.toggle('collapsed');
    layout.classList.toggle('workspace-collapsed', isCollapsed);
    
    if (toggle) {
      toggle.innerHTML = isCollapsed ? '📂' : '📁';
      toggle.title = isCollapsed ? 'Show Workspace' : 'Hide Workspace';
    }
    
    addActivity('workspace:toggle', `Workspace ${isCollapsed ? 'hidden' : 'shown'}`);
  },

  // Workspace history panel toggle
  toggleWorkspaceHistory() {
    const historyPanel = document.getElementById('workspace-history');
    if (!historyPanel) return;
    
    const isVisible = historyPanel.classList.toggle('visible');
    addActivity('workspace:history', `History panel ${isVisible ? 'shown' : 'hidden'}`);
  },

  // Clear workspace content
  clearWorkspace() {
    if (WorkspaceAPI) {
      WorkspaceAPI.clearWorkspace();
      showToast('info', 'Cleared', 'Workspace content cleared');
      addActivity('workspace:clear', 'Workspace cleared');
    }
  },

  // Set workspace layout mode
  setWorkspaceLayout(mode) {
    if (WorkspaceAPI) {
      WorkspaceAPI.setLayoutMode(mode);
      addActivity('workspace:layout', `Layout set to ${mode}`);
    }
  },

  // Section navigation
  showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.dashboard-section').forEach(section => {
      section.style.display = 'none';
    });
    
    // Show selected section
    const targetSection = document.getElementById(`section-${sectionId}`);
    if (targetSection) {
      targetSection.style.display = 'block';
    }
    
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    document.querySelector(`.nav-item[data-section="${sectionId}"]`)?.classList.add('active');
    
    // Close sidebar on mobile
    if (window.innerWidth <= 1024) {
      const sidebar = document.getElementById('sidebar');
      const overlay = document.getElementById('sidebar-overlay');
      sidebar?.classList.remove('open');
      overlay?.classList.remove('visible');
    }
    
    // Track section change
    addActivity('navigation', `Navigated to ${sectionId}`);
  },

  // Show keyboard shortcuts
  showShortcuts() {
    this.toggleShortcutsHelp();
  },

  // Clear activity feed
  clearActivity() {
    clearActivityFeed();
    showToast('info', 'Cleared', 'Activity feed cleared');
  },

  // Update metrics
  updateMetrics(stats) {
    const serverCount = document.getElementById('metric-servers');
    const connectionCount = document.getElementById('metric-connections');
    const requestCount = document.getElementById('metric-requests');
    const uptimeEl = document.getElementById('metric-uptime');
    const serverBadge = document.getElementById('server-count');
    
    if (serverCount) serverCount.textContent = stats?.servers || stats?.total || '0';
    if (connectionCount) connectionCount.textContent = stats?.connections || '0';
    if (requestCount) requestCount.textContent = stats?.requests || '0';
    if (serverBadge) serverBadge.textContent = stats?.servers || stats?.total || '0';
    
    if (uptimeEl && stats?.uptime) {
      const seconds = Math.floor(stats.uptime / 1000);
      if (seconds < 60) {
        uptimeEl.textContent = `${seconds}s`;
      } else if (seconds < 3600) {
        uptimeEl.textContent = `${Math.floor(seconds / 60)}m`;
      } else if (seconds < 86400) {
        uptimeEl.textContent = `${Math.floor(seconds / 3600)}h`;
      } else {
        uptimeEl.textContent = `${Math.floor(seconds / 86400)}d`;
      }
    }
  },

  // Clarity action handler (used by ClarityDashboard component)
  async clarityAction(action) {
    const api = await import('./services/api.js');
    
    try {
      switch (action) {
        case 'refresh':
          await this.refreshClarity();
          break;
          
        case 'identify': {
          const userId = prompt('Enter user ID:');
          const friendlyName = prompt('Friendly name (optional):');
          if (userId) {
            await api.identifyClarityUser(userId, { friendlyName });
            showToast('success', 'User Identified', userId);
            addActivity('clarity:identify', `Identified user: ${userId}`);
            await this.refreshClarity();
          }
          break;
        }
          
        case 'tag': {
          const key = prompt('Tag key:');
          const value = prompt('Tag value:');
          if (key && value) {
            await api.setClarityTag(key, value);
            showToast('success', 'Tag Set', `${key}=${value}`);
            addActivity('clarity:tag', `Set tag: ${key}=${value}`);
            await this.refreshClarity();
          }
          break;
        }
          
        case 'event': {
          const eventName = prompt('Event name:');
          if (eventName) {
            await api.trackClarityEvent(eventName);
            showToast('success', 'Event Tracked', eventName);
            addActivity('clarity:event', `Tracked event: ${eventName}`);
            await this.refreshClarity();
          }
          break;
        }
          
        case 'upgrade': {
          const reason = prompt('Upgrade reason:') || 'important_session';
          await api.upgradeClaritySession(reason);
          showToast('success', 'Session Upgraded', reason);
          addActivity('clarity:upgrade', `Upgraded session: ${reason}`);
          await this.refreshClarity();
          break;
        }
          
        default:
          console.warn('Unknown clarity action:', action);
      }
    } catch (error) {
      showToast('error', 'Clarity Action Failed', error.message);
    }
  },

  // Refresh servers (re-fetch and re-render)
  async refreshServers() {
    await refreshData();
  },

  // Reset server order
  resetServerOrder() {
    ServerDrag.resetOrder();
  }
};

// Expose ServerDrag for drag-and-drop handlers
window.ServerDrag = ServerDrag;

// Expose Toast API for components
window.Toast = {
  show: showToast,
  success: (msg) => showToast('success', 'Success', msg),
  error: (msg) => showToast('error', 'Error', msg),
  info: (msg) => showToast('info', 'Info', msg),
  warning: (msg) => showToast('warning', 'Warning', msg)
};

// Also expose config for components
window.DashboardConfig = Config;

// Backwards-compatible alias for clarityAction (used by ClarityDashboard onclick handlers)
window.clarityAction = (action) => window.Dashboard.clarityAction(action);

// ============================================================================
// RENDERING
// ============================================================================

/**
 * Render servers grid with saved order
 */
function renderServers() {
  const state = AppState.getState();
  const container = document.getElementById('servers');
  
  if (!container) return;
  
  const emptyMessage = state.searchQuery || state.currentFilter !== 'all'
    ? 'No servers match your filter'
    : 'No MCP servers configured';
  
  // Sort servers by saved order before rendering
  const sortedServers = sortServersByOrder(state.filteredServers);
  container.innerHTML = renderServerGrid(sortedServers, emptyMessage);
}

/**
 * Refresh all data from API
 */
async function refreshData() {
  const data = await fetchServers();
  if (data) {
    updateStatsBar(Selectors.stats(AppState.getState()));
    updateSystemInfo();
  }
}

// ============================================================================
// STATE SUBSCRIPTIONS
// ============================================================================

function setupSubscriptions() {
  // Re-render servers when filtered list changes
  useSubscription(Selectors.filteredServers, () => {
    renderServers();
  });

  // Update stats when servers change
  useSubscription(Selectors.servers, () => {
    const stats = Selectors.stats(AppState.getState());
    updateStatsBar(stats);
    window.Dashboard.updateMetrics(stats);
  });

  // Update WS indicator when status changes
  useSubscription(Selectors.wsStatus, (status) => {
    updateWsIndicator(status);
  });

  // Update connection status in footer
  useSubscription(Selectors.apiStatus, (status) => {
    const el = document.getElementById('connection-status');
    if (el) {
      el.textContent = status === 'connected' ? 'API Connected' : 'API Disconnected';
      el.className = status === 'connected' ? 'connection-connected' : 'connection-disconnected';
    }
  });

  // Update server logs in modal
  useSubscription(Selectors.serverLogs, (logs) => {
    const { selectedServer } = AppState.getState();
    if (selectedServer) {
      getModal('server')?.renderLogs(selectedServer);
    }
  });
}

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🌸 BambiSleep™ MCP Control Tower initializing...');
  
  // Initialize theme system
  initTheme();
  
  // Initialize components
  renderToastContainer();
  initModals();
  initSearchBar();
  
  // Render activity feed sections
  const activityContainer = document.getElementById('activity-feed');
  if (activityContainer) {
    activityContainer.innerHTML = renderActivityFeed([]);
  }
  const activityFullContainer = document.getElementById('activity-feed-full');
  if (activityFullContainer) {
    activityFullContainer.innerHTML = renderActivityFeed([]);
  }
  
  // Setup state subscriptions
  setupSubscriptions();
  
  // Initialize keyboard shortcuts
  useKeyboard({
    onRefresh: refreshData,
    onToggleServer: async (server) => {
      if (server.status === 'running') {
        await window.Dashboard.stopServer(server.name);
      } else {
        await window.Dashboard.startServer(server.name);
      }
    },
  });
  
  // Discover API port FIRST (critical for dev mode)
  if (Config.isDev) {
    console.log('🔍 Discovering API port...');
    await Config.discoverApiPort();
    console.log(`✅ API: ${Config.getApiBase()}`);
    console.log(`✅ WS:  ${Config.getWsUrl()}`);
  }
  
  // Initialize WebSocket (after port discovery)
  initWebSocket();
  
  // Initial data fetch
  await refreshData();
  updateSystemInfo();
  
  // Initialize metrics with initial stats
  const initialStats = Selectors.stats(AppState.getState());
  window.Dashboard.updateMetrics(initialStats);
  
  // Initialize Clarity dashboard
  await window.Dashboard.refreshClarity();
  
  // Initialize Agent Chat
  await AgentChatController.init();
  
  // Initialize Agent Workspace (Phase 6)
  const workspaceContainer = document.getElementById('workspace-container');
  if (workspaceContainer) {
    initWorkspace(workspaceContainer);
    console.log('🎨 Agent Workspace initialized');
  }
  
  // Handle mobile menu button visibility
  const updateMobileMenuVisibility = () => {
    const btn = document.querySelector('.mobile-menu-btn');
    if (btn) {
      btn.style.display = window.innerWidth <= 1024 ? 'flex' : 'none';
    }
  };
  updateMobileMenuVisibility();
  window.addEventListener('resize', updateMobileMenuVisibility);
  
  // Fallback polling (30s interval)
  const polling = usePolling(async () => {
    await refreshData();
    updateSystemInfo();
  }, { autoStart: true, interval: 30000 });
  
  console.log('🌸 Dashboard ready!');
});
