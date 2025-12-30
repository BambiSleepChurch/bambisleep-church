/**
 * BambiSleep™ Church MCP Control Tower
 * WsIndicator Component - WebSocket connection status
 */

const STATUS_LABELS = {
  connected: 'Live',
  connecting: 'Connecting...',
  disconnected: 'Offline',
};

/**
 * Render WebSocket indicator
 * @param {'connected' | 'connecting' | 'disconnected'} status
 * @returns {string} HTML string
 */
export function renderWsIndicator(status) {
  return `
    <div class="ws-indicator ws-${status}" title="WebSocket Status">
      <span class="ws-dot"></span>
      <span class="ws-label">${STATUS_LABELS[status] || 'Unknown'}</span>
    </div>
  `;
}

/**
 * Update WebSocket indicator in DOM
 * @param {'connected' | 'connecting' | 'disconnected'} status
 */
export function updateWsIndicator(status) {
  const indicator = document.getElementById('ws-indicator');
  if (!indicator) return;
  
  const label = indicator.querySelector('.ws-label');
  indicator.className = `ws-indicator ws-${status}`;
  
  if (label) {
    label.textContent = STATUS_LABELS[status] || 'Unknown';
  }
}
