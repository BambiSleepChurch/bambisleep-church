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
    renderActivityFeed,
    renderClarityDashboard,
    renderServerGrid,
    renderToastContainer,
    showToast,
    toggleTheme,
    updateStatsBar,
    updateSystemInfo,
    updateWsIndicator
} from './components/index.js';

// Effects
import { useKeyboard } from './effects/useKeyboard.js';
import { usePolling } from './effects/usePolling.js';
import { useSubscription } from './effects/useSubscription.js';

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

  // Server-specific actions
  async serverAction(serverType, action) {
    const resultEl = document.querySelector(`[id^="server-action-result"]`);
    if (resultEl) resultEl.innerHTML = '<em>Loading...</em>';

    try {
      let result;
      
      // Import API functions dynamically
      const api = await import('./services/api.js');
      
      switch (serverType) {
        case 'memory':
          if (action === 'readGraph') result = await api.fetchMemoryGraph();
          else if (action === 'search') {
            const query = prompt('Search query:');
            if (query) result = await api.searchMemory(query);
          }
          break;
          
        case 'github':
          if (action === 'user') result = await api.fetchGitHubUser();
          else if (action === 'repos') result = await api.fetchGitHubRepos();
          break;
          
        case 'mongodb':
          if (action === 'connect') result = await api.connectMongoDB();
          else if (action === 'collections') result = await api.fetchMongoDBCollections();
          else if (action === 'stats') result = await api.fetchMongoDBStats();
          break;
          
        case 'postgres':
          if (action === 'connect') result = await api.connectPostgres();
          else if (action === 'tables') result = await api.fetchPostgresTables();
          break;
          
        case 'stripe':
          if (action === 'customers') result = await api.fetchStripeCustomers();
          else if (action === 'balance') result = await api.fetchStripeBalance();
          break;
          
        case 'huggingface':
          if (action === 'models') {
            const query = prompt('Search models:') || 'llama';
            result = await api.searchHuggingFaceModels(query);
          } else if (action === 'datasets') {
            const query = prompt('Search datasets:') || 'text';
            result = await api.searchHuggingFaceDatasets(query);
          }
          break;
          
        case 'storage':
          if (action === 'files') result = await api.fetchStorageFiles();
          else if (action === 'stats') result = await api.fetchStorageStats();
          break;
          
        case 'puppeteer':
          if (action === 'status') result = await api.fetchPuppeteerStatus();
          else if (action === 'launch') result = await api.launchPuppeteer();
          break;
          
        case 'sqlite':
          if (action === 'tables') result = await api.fetchSQLiteTables();
          else if (action === 'stats') result = await api.fetchSQLiteStats();
          break;
          
        case 'thinking':
          if (action === 'sessions') result = await api.fetchThinkingSessions();
          else if (action === 'stats') result = await api.fetchThinkingStats();
          break;
          
        case 'fetch':
          if (action === 'ping') {
            const url = prompt('URL to ping:');
            if (url) result = await api.pingUrl(url);
          }
          break;
          
        case 'clarity':
          if (action === 'init') result = await api.initClarity();
          else if (action === 'dashboard') result = await api.fetchClarityDashboard();
          else if (action === 'identify') {
            const userId = prompt('User ID:');
            const friendlyName = prompt('Friendly name (optional):');
            if (userId) result = await api.identifyClarityUser(userId, { friendlyName });
          }
          else if (action === 'tag') {
            const key = prompt('Tag key:');
            const value = prompt('Tag value:');
            if (key && value) result = await api.setClarityTag(key, value);
          }
          else if (action === 'event') {
            const eventName = prompt('Event name:');
            if (eventName) result = await api.trackClarityEvent(eventName);
          }
          else if (action === 'sessions') result = await api.fetchClaritySessions();
          else if (action === 'events') result = await api.fetchClarityEvents();
          else if (action === 'top-events') result = await api.fetchClarityTopEvents();
          else if (action === 'top-pages') result = await api.fetchClarityTopPages();
          else if (action === 'upgrade') {
            const reason = prompt('Upgrade reason:') || 'user_request';
            result = await api.upgradeClaritySession(reason);
          }
          else if (action === 'reset') {
            if (confirm('Reset all analytics data?')) {
              result = await api.resetClarity();
            }
          }
          break;
        
        default:
          result = { error: 'Unknown server type' };
      }
      
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
        <div class="glass-card" style="padding: var(--spacing-lg); text-align: center;">
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
          <div class="glass-card" style="padding: var(--spacing-lg); text-align: center;">
            <p class="error">⚠️ ${error.message}</p>
            <button class="btn btn-outline" onclick="window.Dashboard.refreshClarity()">Retry</button>
          </div>
        `;
      }
      showToast('error', 'Analytics Error', error.message);
    }
  },
};

// Also expose config for components
window.DashboardConfig = Config;

// Global Clarity action handler (used by ClarityDashboard component)
window.clarityAction = async function(action) {
  const api = await import('./services/api.js');
  
  try {
    switch (action) {
      case 'refresh':
        await window.Dashboard.refreshClarity();
        break;
        
      case 'identify':
        const userId = prompt('Enter user ID:');
        const friendlyName = prompt('Friendly name (optional):');
        if (userId) {
          await api.identifyClarityUser(userId, { friendlyName });
          showToast('success', 'User Identified', userId);
          addActivity('clarity:identify', `Identified user: ${userId}`);
          await window.Dashboard.refreshClarity();
        }
        break;
        
      case 'tag':
        const key = prompt('Tag key:');
        const value = prompt('Tag value:');
        if (key && value) {
          await api.setClarityTag(key, value);
          showToast('success', 'Tag Set', `${key}=${value}`);
          addActivity('clarity:tag', `Set tag: ${key}=${value}`);
          await window.Dashboard.refreshClarity();
        }
        break;
        
      case 'event':
        const eventName = prompt('Event name:');
        if (eventName) {
          await api.trackClarityEvent(eventName);
          showToast('success', 'Event Tracked', eventName);
          addActivity('clarity:event', `Tracked event: ${eventName}`);
          await window.Dashboard.refreshClarity();
        }
        break;
        
      case 'upgrade':
        const reason = prompt('Upgrade reason:') || 'important_session';
        await api.upgradeClaritySession(reason);
        showToast('success', 'Session Upgraded', reason);
        addActivity('clarity:upgrade', `Upgraded session: ${reason}`);
        await window.Dashboard.refreshClarity();
        break;
        
      default:
        console.warn('Unknown clarity action:', action);
    }
  } catch (error) {
    showToast('error', 'Clarity Action Failed', error.message);
  }
};

// ============================================================================
// RENDERING
// ============================================================================

/**
 * Render servers grid
 */
function renderServers() {
  const state = AppState.getState();
  const container = document.getElementById('servers');
  
  if (!container) return;
  
  const emptyMessage = state.searchQuery || state.currentFilter !== 'all'
    ? 'No servers match your filter'
    : 'No MCP servers configured';
  
  container.innerHTML = renderServerGrid(state.filteredServers, emptyMessage);
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
    updateStatsBar(Selectors.stats(AppState.getState()));
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
  
  // Render activity feed section
  const activityContainer = document.getElementById('activity-feed');
  if (activityContainer) {
    activityContainer.innerHTML = renderActivityFeed([]);
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
  
  // Initialize WebSocket
  initWebSocket();
  
  // Initial data fetch
  await refreshData();
  updateSystemInfo();
  
  // Initialize Clarity dashboard
  await window.Dashboard.refreshClarity();
  
  // Initialize Agent Chat
  await AgentChatController.init();
  
  // Fallback polling (30s interval)
  const polling = usePolling(async () => {
    await refreshData();
    updateSystemInfo();
  }, { autoStart: true, interval: 30000 });
  
  console.log('🌸 Dashboard ready!');
});
