/**
 * BambiSleep™ Church MCP Control Tower
 * ServerCard Component - Individual server display card
 */

import { SERVER_ICONS, STATUS_ICONS } from '../config.js';

/**
 * Render a single server card
 * @param {Object} server - Server data
 * @param {number} index - Server index (for keyboard shortcut)
 * @returns {string} HTML string
 */
export function renderServerCard(server, index) {
  const icon = SERVER_ICONS[server.name] || SERVER_ICONS.default;
  const statusIcon = STATUS_ICONS[server.status] || STATUS_ICONS.default;
  const args = server.config?.args || [];
  const argsDisplay = args.slice(0, 3).join(' ') + (args.length > 3 ? '...' : '');
  
  return `
    <div class="glass-card server-card" data-server="${server.name}">
      <div class="server-header">
        <h3 class="server-name" onclick="window.Dashboard.openServerModal('${server.name}')" style="cursor: pointer;">
          <span class="server-icon">${icon}</span>
          ${server.name}
          <span class="server-index" title="Press ${index + 1} to toggle">${index + 1}</span>
        </h3>
        <span class="status-badge status-${server.status}">
          ${statusIcon} ${server.status}
        </span>
      </div>
      <div class="server-command">
        ${server.config?.command || 'N/A'} ${argsDisplay}
      </div>
      <div class="server-actions">
        <button onclick="window.Dashboard.startServer('${server.name}')" 
                class="btn btn-success"
                ${server.status === 'running' ? 'disabled' : ''}>
          ▶ Start
        </button>
        <button onclick="window.Dashboard.stopServer('${server.name}')" 
                class="btn btn-danger"
                ${server.status !== 'running' ? 'disabled' : ''}>
          ⏹ Stop
        </button>
        <button onclick="window.Dashboard.openServerModal('${server.name}')" 
                class="btn btn-secondary" 
                title="View details">
          ⚙
        </button>
      </div>
      ${server.error ? `<div class="server-error">⚠ ${server.error}</div>` : ''}
    </div>
  `;
}

/**
 * Render server grid
 * @param {Array} servers - Array of server objects
 * @param {string} emptyMessage - Message when no servers
 * @returns {string} HTML string
 */
export function renderServerGrid(servers, emptyMessage = 'No MCP servers configured') {
  if (!servers || servers.length === 0) {
    return `
      <div class="glass-card empty-state">
        ${emptyMessage}
      </div>
    `;
  }
  
  return servers.map((server, index) => renderServerCard(server, index)).join('');
}

/**
 * Render skeleton loading state
 * @param {number} count - Number of skeleton cards
 * @returns {string} HTML string
 */
export function renderSkeletonCards(count = 3) {
  return Array(count).fill(`
    <div class="glass-card server-card">
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-text"></div>
    </div>
  `).join('');
}
