/**
 * BambiSleep™ Church MCP Control Tower
 * Modal Component - Reusable modal dialogs
 */

import { Actions, AppState, Selectors } from '../state/store.js';

/**
 * Base Modal class
 */
export class Modal {
  constructor(id) {
    this.id = id;
    this.element = null;
  }

  /**
   * Create modal element
   */
  create() {
    this.element = document.createElement('div');
    this.element.id = this.id;
    this.element.className = 'modal';
    this.element.hidden = true;
    
    this.element.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-content glass-card">
        <div class="modal-header">
          <h3 class="modal-title"></h3>
          <button class="modal-close" aria-label="Close">✕</button>
        </div>
        <div class="modal-body"></div>
        <div class="modal-footer"></div>
      </div>
    `;
    
    // Event listeners
    this.element.querySelector('.modal-backdrop').addEventListener('click', () => this.close());
    this.element.querySelector('.modal-close').addEventListener('click', () => this.close());
    
    document.body.appendChild(this.element);
    return this;
  }

  /**
   * Set modal title
   */
  setTitle(html) {
    const title = this.element.querySelector('.modal-title');
    if (title) title.innerHTML = html;
    return this;
  }

  /**
   * Set modal body content
   */
  setBody(html) {
    const body = this.element.querySelector('.modal-body');
    if (body) body.innerHTML = html;
    return this;
  }

  /**
   * Set modal footer content
   */
  setFooter(html) {
    const footer = this.element.querySelector('.modal-footer');
    if (footer) footer.innerHTML = html;
    return this;
  }

  /**
   * Open modal
   */
  open() {
    this.element.hidden = false;
    document.body.style.overflow = 'hidden';
    return this;
  }

  /**
   * Close modal
   */
  close() {
    this.element.hidden = true;
    document.body.style.overflow = '';
    Actions.closeModal();
    return this;
  }

  /**
   * Check if modal is open
   */
  isOpen() {
    return !this.element.hidden;
  }

  /**
   * Destroy modal
   */
  destroy() {
    this.element?.remove();
    this.element = null;
  }
}

/**
 * Server Detail Modal
 */
export class ServerDetailModal extends Modal {
  constructor() {
    super('server-modal');
  }

  /**
   * Get server-specific quick actions
   */
  getServerActions(server) {
    const name = server.name?.toLowerCase();
    
    const actionSets = {
      memory: `
        <button class="btn btn-secondary" onclick="window.Dashboard.serverAction('memory', 'readGraph')">
          📊 View Graph
        </button>
        <button class="btn btn-secondary" onclick="window.Dashboard.serverAction('memory', 'search')">
          🔍 Search
        </button>
      `,
      github: `
        <button class="btn btn-secondary" onclick="window.Dashboard.serverAction('github', 'user')">
          👤 My Profile
        </button>
        <button class="btn btn-secondary" onclick="window.Dashboard.serverAction('github', 'repos')">
          📦 My Repos
        </button>
      `,
      mongodb: `
        <button class="btn btn-secondary" onclick="window.Dashboard.serverAction('mongodb', 'connect')">
          🔌 Connect
        </button>
        <button class="btn btn-secondary" onclick="window.Dashboard.serverAction('mongodb', 'collections')">
          📚 Collections
        </button>
        <button class="btn btn-secondary" onclick="window.Dashboard.serverAction('mongodb', 'stats')">
          📊 Stats
        </button>
      `,
      postgres: `
        <button class="btn btn-secondary" onclick="window.Dashboard.serverAction('postgres', 'connect')">
          🔌 Connect
        </button>
        <button class="btn btn-secondary" onclick="window.Dashboard.serverAction('postgres', 'tables')">
          📋 Tables
        </button>
      `,
      stripe: `
        <button class="btn btn-secondary" onclick="window.Dashboard.serverAction('stripe', 'customers')">
          👥 Customers
        </button>
        <button class="btn btn-secondary" onclick="window.Dashboard.serverAction('stripe', 'balance')">
          💰 Balance
        </button>
      `,
      huggingface: `
        <button class="btn btn-secondary" onclick="window.Dashboard.serverAction('huggingface', 'models')">
          🤖 Search Models
        </button>
        <button class="btn btn-secondary" onclick="window.Dashboard.serverAction('huggingface', 'datasets')">
          📊 Search Datasets
        </button>
      `,
      storage: `
        <button class="btn btn-secondary" onclick="window.Dashboard.serverAction('storage', 'files')">
          📁 List Files
        </button>
        <button class="btn btn-secondary" onclick="window.Dashboard.serverAction('storage', 'stats')">
          📊 Stats
        </button>
      `,
      puppeteer: `
        <button class="btn btn-secondary" onclick="window.Dashboard.serverAction('puppeteer', 'status')">
          📊 Status
        </button>
        <button class="btn btn-secondary" onclick="window.Dashboard.serverAction('puppeteer', 'launch')">
          🚀 Launch
        </button>
      `,
      sqlite: `
        <button class="btn btn-secondary" onclick="window.Dashboard.serverAction('sqlite', 'tables')">
          📋 Tables
        </button>
        <button class="btn btn-secondary" onclick="window.Dashboard.serverAction('sqlite', 'stats')">
          📊 Stats
        </button>
      `,
      'sequential-thinking': `
        <button class="btn btn-secondary" onclick="window.Dashboard.serverAction('thinking', 'sessions')">
          📋 Sessions
        </button>
        <button class="btn btn-secondary" onclick="window.Dashboard.serverAction('thinking', 'stats')">
          📊 Stats
        </button>
      `,
      thinking: `
        <button class="btn btn-secondary" onclick="window.Dashboard.serverAction('thinking', 'sessions')">
          📋 Sessions
        </button>
        <button class="btn btn-secondary" onclick="window.Dashboard.serverAction('thinking', 'stats')">
          📊 Stats
        </button>
      `,
      fetch: `
        <button class="btn btn-secondary" onclick="window.Dashboard.serverAction('fetch', 'ping')">
          🔔 Ping URL
        </button>
      `,
    };
    
    return actionSets[name] || '';
  }

  /**
   * Show server details
   */
  showServer(server) {
    if (!server) return;
    
    const { SERVER_ICONS, STATUS_ICONS } = window.DashboardConfig || {};
    const icon = SERVER_ICONS?.[server.name] || '⚙️';
    const statusIcon = STATUS_ICONS?.[server.status] || '?';
    const serverActions = this.getServerActions(server);
    
    this.setTitle(`${icon} ${server.name}`);
    
    this.setBody(`
      <div class="server-detail-section">
        <div class="server-detail-label">Status</div>
        <div class="server-detail-value">
          <span class="status-badge status-${server.status}">
            ${statusIcon} ${server.status}
          </span>
        </div>
      </div>
      
      <div class="server-detail-section">
        <div class="server-detail-label">Command</div>
        <div class="server-detail-value">${server.config?.command || 'N/A'}</div>
      </div>
      
      <div class="server-detail-section">
        <div class="server-detail-label">Arguments</div>
        <div class="server-detail-value">${(server.config?.args || []).join(' ') || 'None'}</div>
      </div>
      
      ${serverActions ? `
        <div class="server-detail-section">
          <div class="server-detail-label">Quick Actions</div>
          <div class="server-actions-grid">
            ${serverActions}
          </div>
        </div>
      ` : ''}
      
      <div class="server-detail-section">
        <div class="server-detail-label">Action Result</div>
        <div class="server-action-result" id="server-action-result-${server.name}">
          <em>Run an action to see results...</em>
        </div>
      </div>
      
      ${server.config?.env ? `
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
        <div class="log-stream" id="log-stream-${server.name}">
          <div class="log-entry log-info">Waiting for logs...</div>
        </div>
      </div>
    `);
    
    this.setFooter(`
      <button class="btn btn-secondary" onclick="window.Dashboard.clearServerLogs('${server.name}')">Clear Logs</button>
      <button class="btn btn-primary" onclick="window.Dashboard.closeModal()">Close</button>
    `);
    
    this.open();
    
    // Render existing logs
    this.renderLogs(server.name);
  }

  /**
   * Render logs for server
   */
  renderLogs(serverName) {
    const logs = Selectors.logsForServer(serverName)(AppState.getState());
    const container = document.getElementById(`log-stream-${serverName}`);
    if (!container || logs.length === 0) return;
    
    container.innerHTML = logs.map(log => `
      <div class="log-entry log-${log.level}">
        <span class="log-time">${log.timestamp.toLocaleTimeString()}</span>
        ${log.message}
      </div>
    `).join('');
    
    container.scrollTop = container.scrollHeight;
  }
}

/**
 * Keyboard Shortcuts Modal
 */
export class ShortcutsModal extends Modal {
  constructor() {
    super('shortcuts-modal');
  }

  create() {
    super.create();
    this.element.querySelector('.modal-content').classList.add('shortcuts-help');
    
    const { SHORTCUTS } = window.DashboardConfig || { SHORTCUTS: [] };
    
    this.setTitle('⌨️ Keyboard Shortcuts');
    this.setBody(`
      <div class="shortcuts-grid">
        ${SHORTCUTS.map(s => `
          <div class="shortcut">
            ${s.keys.map(k => `<kbd>${k}</kbd>`).join('+')}
            <span>${s.action}</span>
          </div>
        `).join('')}
      </div>
    `);
    this.setFooter('');
    
    return this;
  }
}

// ============================================================================
// MODAL MANAGER
// ============================================================================

const modals = {};

/**
 * Initialize all modals
 */
export function initModals() {
  modals.server = new ServerDetailModal().create();
  modals.shortcuts = new ShortcutsModal().create();
}

/**
 * Get modal by name
 */
export function getModal(name) {
  return modals[name];
}

/**
 * Close all modals
 */
export function closeAllModals() {
  Object.values(modals).forEach(m => m.close());
}
