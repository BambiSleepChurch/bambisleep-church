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
    clearActivityFeed,
    closeAllModals,
    exportConfigs,
    getModal,
    importConfigs,
    initModals,
    initSearchBar,
    renderActivityFeed,
    renderServerGrid,
    renderToastContainer,
    showToast,
    updateActivityFeed,
    updateStatsBar,
    updateSystemInfo,
    updateWsIndicator,
    initTheme,
    toggleTheme,
    getCurrentTheme,
    renderThemeToggle,
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

  // Refresh
  async refresh() {
    await refreshData();
  },
};

// Also expose config for components
window.DashboardConfig = Config;

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
  
  // Fallback polling (30s interval)
  const polling = usePolling(async () => {
    await refreshData();
    updateSystemInfo();
  }, { autoStart: true, interval: 30000 });
  
  console.log('🌸 Dashboard ready!');
});
