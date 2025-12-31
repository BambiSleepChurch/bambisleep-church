/**
 * BambiSleep™ Church MCP Control Tower
 * SystemInfo Component - System information display
 */

/**
 * Render system info grid
 * @param {Object} [health] - Optional health data
 * @returns {string} HTML string
 */
export function renderSystemInfo(health = {}) {
  const isDev = window.location.hostname === 'localhost';
  const dashboardPort = window.location.port || (window.location.protocol === 'https:' ? '443' : '80');
  const apiPort = health.apiPort || sessionStorage.getItem('apiPort') || 'detecting...';
  
  return `
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Dashboard</span>
        <span class="info-value">:${dashboardPort}</span>
      </div>
      <div class="info-item">
        <span class="info-label">API</span>
        <span class="info-value">:${apiPort}</span>
      </div>
      <div class="info-item">
        <span class="info-label">WebSocket</span>
        <span class="info-value">ws://:${apiPort}/ws</span>
      </div>
      <div class="info-item">
        <span class="info-label">Environment</span>
        <span class="info-value">${isDev ? 'Development' : 'Production'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Last Updated</span>
        <span class="info-value">${new Date().toLocaleTimeString()}</span>
      </div>
      ${health.version ? `
        <div class="info-item">
          <span class="info-label">Version</span>
          <span class="info-value">${health.version}</span>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Update system info in DOM
 * @param {Object} [health] - Optional health data
 */
export function updateSystemInfo(health = {}) {
  const el = document.getElementById('system-info');
  if (el) {
    el.innerHTML = renderSystemInfo(health);
  }
}
