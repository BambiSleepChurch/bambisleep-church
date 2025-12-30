/**
 * BambiSleep™ Church MCP Control Tower
 * Dashboard Frontend Application
 * 
 * Features:
 * - WebSocket real-time updates
 * - Toast notifications
 * - Server detail modals
 * - Keyboard shortcuts
 * - Search/filter servers
 */

const API_BASE = 'http://localhost:8080/api';
const WS_URL = 'ws://localhost:8080/ws';

// Global state
let servers = [];
let ws = null;
let wsReconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000;

// ============================================================================
// WEBSOCKET CONNECTION
// ============================================================================

/**
 * Initialize WebSocket connection
 */
function initWebSocket() {
  updateWsIndicator('connecting');
  
  try {
    ws = new WebSocket(WS_URL);
    
    ws.onopen = () => {
      console.log('🔌 WebSocket connected');
      wsReconnectAttempts = 0;
      updateWsIndicator('connected');
      showToast('success', 'Connected', 'Real-time updates enabled');
      
      // Subscribe to all server events
      ws.send(JSON.stringify({ 
        type: 'SUBSCRIBE', 
        channels: ['servers', 'health'] 
      }));
    };
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleWsMessage(message);
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };
    
    ws.onclose = () => {
      console.log('🔌 WebSocket disconnected');
      updateWsIndicator('disconnected');
      
      // Attempt reconnection
      if (wsReconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        wsReconnectAttempts++;
        console.log(`Reconnecting (${wsReconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
        setTimeout(initWebSocket, RECONNECT_DELAY);
      } else {
        showToast('error', 'Connection Lost', 'Real-time updates unavailable');
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      updateWsIndicator('disconnected');
    };
  } catch (error) {
    console.error('Failed to create WebSocket:', error);
    updateWsIndicator('disconnected');
  }
}

/**
 * Handle incoming WebSocket messages
 */
function handleWsMessage(message) {
  switch (message.type) {
    case 'SERVER_STATUS':
    case 'SERVER_STARTED':
    case 'SERVER_STOPPED':
      updateServerStatus(message.payload);
      if (message.type === 'SERVER_STARTED') {
        showToast('success', 'Server Started', `${message.payload.name} is now running`);
      } else if (message.type === 'SERVER_STOPPED') {
        showToast('info', 'Server Stopped', `${message.payload.name} has stopped`);
      }
      break;
      
    case 'SERVER_ERROR':
      showToast('error', 'Server Error', `${message.payload.name}: ${message.payload.error}`);
      updateServerStatus(message.payload);
      break;
      
    case 'SERVER_LOG':
      // Handle live log streaming (if modal open)
      appendServerLog(message.payload);
      break;
      
    case 'HEALTH_UPDATE':
      updateHealthDisplay(message.payload);
      break;
      
    case 'PONG':
      // Heartbeat response
      break;
      
    default:
      console.log('Unknown message type:', message.type);
  }
}

/**
 * Update WebSocket indicator UI
 */
function updateWsIndicator(status) {
  const indicator = document.getElementById('ws-indicator');
  const label = indicator.querySelector('.ws-label');
  
  indicator.className = 'ws-indicator ws-' + status;
  
  switch (status) {
    case 'connected':
      label.textContent = 'Live';
      break;
    case 'connecting':
      label.textContent = 'Connecting...';
      break;
    case 'disconnected':
      label.textContent = 'Offline';
      break;
  }
}

// ============================================================================
// TOAST NOTIFICATIONS
// ============================================================================

/**
 * Show a toast notification
 */
function showToast(type, title, message, duration = 4000) {
  const container = document.getElementById('toast-container');
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };
  
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || 'ℹ'}</span>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      ${message ? `<div class="toast-message">${message}</div>` : ''}
    </div>
  `;
  
  container.appendChild(toast);
  
  // Auto-dismiss
  setTimeout(() => {
    toast.classList.add('toast-hiding');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ============================================================================
// MODAL FUNCTIONS
// ============================================================================

/**
 * Open server detail modal
 */
function openServerModal(serverName) {
  const server = servers.find(s => s.name === serverName);
  if (!server) return;
  
  const modal = document.getElementById('server-modal');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  
  title.innerHTML = `${getServerIcon(server.name)} ${server.name}`;
  
  body.innerHTML = `
    <div class="server-detail-section">
      <div class="server-detail-label">Status</div>
      <div class="server-detail-value">
        <span class="status-badge status-${server.status}">
          ${getStatusIcon(server.status)} ${server.status}
        </span>
      </div>
    </div>
    
    <div class="server-detail-section">
      <div class="server-detail-label">Command</div>
      <div class="server-detail-value">${server.config.command}</div>
    </div>
    
    <div class="server-detail-section">
      <div class="server-detail-label">Arguments</div>
      <div class="server-detail-value">${(server.config.args || []).join(' ') || 'None'}</div>
    </div>
    
    ${server.config.env ? `
      <div class="server-detail-section">
        <div class="server-detail-label">Environment Variables</div>
        <div class="server-detail-config">
          <pre>${JSON.stringify(server.config.env, null, 2)}</pre>
        </div>
      </div>
    ` : ''}
    
    <div class="server-detail-section">
      <div class="server-detail-label">Full Configuration</div>
      <div class="server-detail-config">
        <pre>${JSON.stringify(server.config, null, 2)}</pre>
      </div>
    </div>
    
    ${server.error ? `
      <div class="server-detail-section">
        <div class="server-detail-label">Last Error</div>
        <div class="server-error">${server.error}</div>
      </div>
    ` : ''}
    
    <div class="server-detail-section">
      <div class="server-detail-label">Live Logs</div>
      <div class="log-stream" id="log-stream-${serverName}">
        <div class="log-entry log-info">Waiting for logs...</div>
      </div>
    </div>
  `;
  
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
}

/**
 * Close any open modal
 */
function closeModal() {
  document.getElementById('server-modal').hidden = true;
  document.getElementById('shortcuts-modal').hidden = true;
  document.body.style.overflow = '';
}

/**
 * Toggle keyboard shortcuts help
 */
function toggleShortcutsHelp() {
  const modal = document.getElementById('shortcuts-modal');
  modal.hidden = !modal.hidden;
  document.body.style.overflow = modal.hidden ? '' : 'hidden';
}

/**
 * Append log entry to server detail modal
 */
function appendServerLog(logData) {
  const logStream = document.getElementById(`log-stream-${logData.server}`);
  if (!logStream) return;
  
  const entry = document.createElement('div');
  entry.className = `log-entry log-${logData.level || 'info'}`;
  entry.innerHTML = `
    <span class="log-time">${new Date().toLocaleTimeString()}</span>
    ${logData.message}
  `;
  
  logStream.appendChild(entry);
  logStream.scrollTop = logStream.scrollHeight;
  
  // Keep only last 100 entries
  while (logStream.children.length > 100) {
    logStream.removeChild(logStream.firstChild);
  }
}

// ============================================================================
// SEARCH & FILTER
// ============================================================================

let currentFilter = 'all';
let searchQuery = '';

/**
 * Initialize search and filter handlers
 */
function initSearchFilter() {
  const searchInput = document.getElementById('server-search');
  const filterBtns = document.querySelectorAll('.filter-btn');
  
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase();
    renderServers(filterServers());
  });
  
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderServers(filterServers());
    });
  });
}

/**
 * Filter servers based on search and status
 */
function filterServers() {
  return servers.filter(server => {
    // Search filter
    const matchesSearch = !searchQuery || 
      server.name.toLowerCase().includes(searchQuery) ||
      (server.config.command || '').toLowerCase().includes(searchQuery);
    
    // Status filter
    let matchesStatus = true;
    if (currentFilter !== 'all') {
      if (currentFilter === 'error') {
        matchesStatus = server.status === 'error' || server.error;
      } else {
        matchesStatus = server.status === currentFilter;
      }
    }
    
    return matchesSearch && matchesStatus;
  });
}

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================

/**
 * Initialize keyboard shortcuts
 */
function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ignore if typing in input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      if (e.key === 'Escape') {
        e.target.blur();
        document.getElementById('server-search').value = '';
        searchQuery = '';
        renderServers(filterServers());
      }
      return;
    }
    
    // Ctrl+R - Refresh
    if (e.ctrlKey && e.key === 'r') {
      e.preventDefault();
      refreshServers();
      showToast('info', 'Refreshing', 'Fetching latest server status...');
    }
    
    // Ctrl+K - Focus search
    if (e.ctrlKey && e.key === 'k') {
      e.preventDefault();
      document.getElementById('server-search').focus();
    }
    
    // ? - Show shortcuts help
    if (e.key === '?') {
      toggleShortcutsHelp();
    }
    
    // Escape - Close modal
    if (e.key === 'Escape') {
      closeModal();
    }
    
    // Number keys 1-9 - Toggle server by index
    if (e.key >= '1' && e.key <= '9') {
      const index = parseInt(e.key) - 1;
      const filteredServers = filterServers();
      if (filteredServers[index]) {
        const server = filteredServers[index];
        if (server.status === 'running') {
          stopServer(server.name);
        } else {
          startServer(server.name);
        }
      }
    }
  });
}

// ============================================================================
// SERVER OPERATIONS
// ============================================================================

/**
 * Fetch servers from API
 */
async function fetchServers() {
  try {
    const response = await fetch(`${API_BASE}/servers`);
    if (!response.ok) throw new Error('API error');
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch servers:', error);
    return null;
  }
}

/**
 * Update server status from WebSocket
 */
function updateServerStatus(payload) {
  const index = servers.findIndex(s => s.name === payload.name);
  if (index >= 0) {
    servers[index] = { ...servers[index], ...payload };
    renderServers(filterServers());
    updateStats();
  }
}

/**
 * Update health display from WebSocket
 */
function updateHealthDisplay(health) {
  // Update system info or health indicators
  updateSystemInfo(health);
}

/**
 * Render server cards
 */
function renderServers(serversToRender) {
  const container = document.getElementById('servers');
  
  if (!serversToRender || serversToRender.length === 0) {
    container.innerHTML = `
      <div class="glass-card empty-state">
        ${searchQuery || currentFilter !== 'all' 
          ? 'No servers match your filter' 
          : 'No MCP servers configured'}
      </div>
    `;
    return;
  }

  container.innerHTML = serversToRender.map((server, index) => `
    <div class="glass-card server-card" data-server="${server.name}">
      <div class="server-header">
        <h3 class="server-name" onclick="openServerModal('${server.name}')" style="cursor: pointer;">
          <span class="server-icon">${getServerIcon(server.name)}</span>
          ${server.name}
          <span class="server-index" title="Press ${index + 1} to toggle">${index + 1}</span>
        </h3>
        <span class="status-badge status-${server.status}">
          ${getStatusIcon(server.status)} ${server.status}
        </span>
      </div>
      <div class="server-command">
        ${server.config.command} ${(server.config.args || []).slice(0, 3).join(' ')}${(server.config.args || []).length > 3 ? '...' : ''}
      </div>
      <div class="server-actions">
        <button onclick="startServer('${server.name}')" 
                class="btn btn-success"
                ${server.status === 'running' ? 'disabled' : ''}>
          ▶ Start
        </button>
        <button onclick="stopServer('${server.name}')" 
                class="btn btn-danger"
                ${server.status !== 'running' ? 'disabled' : ''}>
          ⏹ Stop
        </button>
        <button onclick="openServerModal('${server.name}')" 
                class="btn btn-secondary" 
                title="View details">
          ⚙
        </button>
      </div>
      ${server.error ? `<div class="server-error">⚠ ${server.error}</div>` : ''}
    </div>
  `).join('');
}

/**
 * Get icon for server type
 */
function getServerIcon(name) {
  const icons = {
    filesystem: '🗂️',
    git: '🔀',
    github: '🐙',
    puppeteer: '🎭',
    postgres: '🐘',
    fetch: '🌐',
    sqlite: '💾',
    memory: '🧠',
    'sequential-thinking': '🔗',
    mongodb: '🍃',
    stripe: '💳',
    huggingface: '🤗',
    clarity: '📊',
  };
  return icons[name] || '⚙️';
}

/**
 * Get status icon
 */
function getStatusIcon(status) {
  const icons = {
    running: '●',
    stopped: '○',
    starting: '◐',
    error: '✕',
  };
  return icons[status] || '?';
}

/**
 * Update stats display
 */
function updateStats() {
  const stats = {
    running: servers.filter(s => s.status === 'running').length,
    stopped: servers.filter(s => s.status === 'stopped').length,
    error: servers.filter(s => s.status === 'error' || s.error).length,
    total: servers.length
  };
  renderStats(stats);
}

/**
 * Render stats bar
 */
function renderStats(stats) {
  const el = document.getElementById('stats');
  el.innerHTML = `
    <span class="stat-item stat-running">● ${stats.running} running</span>
    <span class="stat-item stat-stopped">○ ${stats.stopped} stopped</span>
    <span class="stat-item stat-error">✕ ${stats.error} errors</span>
    <span class="stat-item stat-total">◆ ${stats.total} total</span>
  `;
}

/**
 * Start a server
 */
async function startServer(name) {
  try {
    showToast('info', 'Starting', `Starting ${name}...`);
    await fetch(`${API_BASE}/servers/${name}/start`, { method: 'POST' });
    // WebSocket will handle the update, but refresh anyway for reliability
    await refreshServers();
  } catch (error) {
    console.error('Failed to start server:', error);
    showToast('error', 'Failed to Start', error.message);
  }
}

/**
 * Stop a server
 */
async function stopServer(name) {
  try {
    showToast('info', 'Stopping', `Stopping ${name}...`);
    await fetch(`${API_BASE}/servers/${name}/stop`, { method: 'POST' });
    await refreshServers();
  } catch (error) {
    console.error('Failed to stop server:', error);
    showToast('error', 'Failed to Stop', error.message);
  }
}

/**
 * Refresh all server data
 */
async function refreshServers() {
  const data = await fetchServers();
  
  if (data) {
    servers = data.servers;
    renderServers(filterServers());
    renderStats(data.stats);
    const statusEl = document.getElementById('connection-status');
    statusEl.textContent = 'API Connected';
    statusEl.className = 'connection-connected';
  } else {
    const statusEl = document.getElementById('connection-status');
    statusEl.textContent = 'API Disconnected';
    statusEl.className = 'connection-disconnected';
  }
}

/**
 * Update system info
 */
function updateSystemInfo(health = {}) {
  const el = document.getElementById('system-info');
  el.innerHTML = `
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Dashboard</span>
        <span class="info-value">:3000</span>
      </div>
      <div class="info-item">
        <span class="info-label">API</span>
        <span class="info-value">:8080</span>
      </div>
      <div class="info-item">
        <span class="info-label">WebSocket</span>
        <span class="info-value">ws://:8080/ws</span>
      </div>
      <div class="info-item">
        <span class="info-label">Environment</span>
        <span class="info-value">${location.hostname === 'localhost' ? 'Development' : 'Production'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Last Updated</span>
        <span class="info-value">${new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  `;
}

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Initialize all features
  initWebSocket();
  initSearchFilter();
  initKeyboardShortcuts();
  
  // Initial data load
  refreshServers();
  updateSystemInfo();
  
  // Fallback polling (in case WebSocket fails)
  setInterval(() => {
    refreshServers();
    updateSystemInfo();
  }, 30000); // Every 30 seconds as fallback
});
