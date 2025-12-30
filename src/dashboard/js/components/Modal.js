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
   * Show server details
   */
  showServer(server) {
    if (!server) return;
    
    const { SERVER_ICONS, STATUS_ICONS } = window.DashboardConfig || {};
    const icon = SERVER_ICONS?.[server.name] || '⚙️';
    const statusIcon = STATUS_ICONS?.[server.status] || '?';
    
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
