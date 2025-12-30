/**
 * BambiSleep™ Church MCP Control Tower
 * Dashboard Frontend Application
 */

const API_BASE = 'http://localhost:8080/api';

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
 * Render server cards
 */
function renderServers(servers) {
  const container = document.getElementById('servers');
  
  if (!servers || servers.length === 0) {
    container.innerHTML = `
      <div class="bg-gray-800 rounded-lg p-4 col-span-full text-center text-gray-400">
        No MCP servers configured
      </div>
    `;
    return;
  }

  container.innerHTML = servers.map(server => `
    <div class="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition">
      <div class="flex items-center justify-between mb-2">
        <h3 class="font-semibold text-lg">${getServerIcon(server.name)} ${server.name}</h3>
        <span class="status-${server.status} text-sm font-medium">
          ${getStatusIcon(server.status)} ${server.status}
        </span>
      </div>
      <div class="text-sm text-gray-400 mb-3">
        <code class="bg-gray-900 px-2 py-1 rounded text-xs">
          ${server.config.command} ${(server.config.args || []).slice(0, 2).join(' ')}...
        </code>
      </div>
      <div class="flex gap-2">
        <button onclick="startServer('${server.name}')" 
                class="flex-1 bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm transition"
                ${server.status === 'running' ? 'disabled class="opacity-50"' : ''}>
          ▶ Start
        </button>
        <button onclick="stopServer('${server.name}')" 
                class="flex-1 bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition"
                ${server.status !== 'running' ? 'disabled class="opacity-50"' : ''}>
          ⏹ Stop
        </button>
      </div>
      ${server.error ? `<p class="text-red-400 text-xs mt-2">${server.error}</p>` : ''}
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
function renderStats(stats) {
  const el = document.getElementById('stats');
  el.innerHTML = `
    <span class="text-green-400">${stats.running} running</span> •
    <span class="text-gray-400">${stats.stopped} stopped</span> •
    <span class="text-red-400">${stats.error} errors</span> •
    <span class="text-bambi-light">${stats.total} total</span>
  `;
}

/**
 * Start a server
 */
async function startServer(name) {
  try {
    await fetch(`${API_BASE}/servers/${name}/start`, { method: 'POST' });
    await refreshServers();
  } catch (error) {
    console.error('Failed to start server:', error);
  }
}

/**
 * Stop a server
 */
async function stopServer(name) {
  try {
    await fetch(`${API_BASE}/servers/${name}/stop`, { method: 'POST' });
    await refreshServers();
  } catch (error) {
    console.error('Failed to stop server:', error);
  }
}

/**
 * Refresh all server data
 */
async function refreshServers() {
  const data = await fetchServers();
  
  if (data) {
    renderServers(data.servers);
    renderStats(data.stats);
    document.getElementById('connection-status').textContent = 'Connected';
    document.getElementById('connection-status').className = 'text-green-500';
  } else {
    document.getElementById('connection-status').textContent = 'Disconnected';
    document.getElementById('connection-status').className = 'text-red-500';
  }
}

/**
 * Update system info
 */
function updateSystemInfo() {
  const el = document.getElementById('system-info');
  el.innerHTML = `
    <div class="grid grid-cols-2 gap-4 text-sm">
      <div>
        <span class="text-gray-400">Dashboard:</span>
        <span class="text-bambi-light">:3000</span>
      </div>
      <div>
        <span class="text-gray-400">API:</span>
        <span class="text-bambi-light">:8080</span>
      </div>
      <div>
        <span class="text-gray-400">Environment:</span>
        <span class="text-bambi-light">${location.hostname === 'localhost' ? 'Development' : 'Production'}</span>
      </div>
      <div>
        <span class="text-gray-400">Updated:</span>
        <span class="text-bambi-light">${new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  `;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  refreshServers();
  updateSystemInfo();
  
  // Auto-refresh every 10 seconds
  setInterval(() => {
    refreshServers();
    updateSystemInfo();
  }, 10000);
});
