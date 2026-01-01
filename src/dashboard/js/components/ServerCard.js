/**
 * BambiSleep™ Church MCP Control Tower
 * ServerCard Component - Individual server display card with drag-and-drop
 */

import { SERVER_ICONS, STATUS_ICONS } from '../config.js';

// Storage key for server order
const SERVER_ORDER_KEY = 'mcp-tower-server-order';

/**
 * Get saved server order from localStorage
 * @returns {string[]} Array of server names in saved order
 */
export function getSavedServerOrder() {
  try {
    const saved = localStorage.getItem(SERVER_ORDER_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

/**
 * Save server order to localStorage
 * @param {string[]} order - Array of server names
 */
export function saveServerOrder(order) {
  try {
    localStorage.setItem(SERVER_ORDER_KEY, JSON.stringify(order));
  } catch (e) {
    console.warn('Failed to save server order:', e);
  }
}

/**
 * Sort servers by saved order
 * @param {Array} servers - Array of server objects
 * @returns {Array} Sorted servers
 */
export function sortServersByOrder(servers) {
  const savedOrder = getSavedServerOrder();
  if (savedOrder.length === 0) return servers;
  
  return [...servers].sort((a, b) => {
    const indexA = savedOrder.indexOf(a.name);
    const indexB = savedOrder.indexOf(b.name);
    
    // Items not in saved order go to the end
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    
    return indexA - indexB;
  });
}

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
    <div class="glass-card server-card" 
         data-server="${server.name}"
         draggable="true"
         ondragstart="window.ServerDrag.handleDragStart(event)"
         ondragend="window.ServerDrag.handleDragEnd(event)"
         ondragover="window.ServerDrag.handleDragOver(event)"
         ondragenter="window.ServerDrag.handleDragEnter(event)"
         ondragleave="window.ServerDrag.handleDragLeave(event)"
         ondrop="window.ServerDrag.handleDrop(event)">
      <div class="drag-handle" title="Drag to reorder">⠿</div>
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
 * Drag and drop controller for server cards
 */
class ServerDragController {
  constructor() {
    this.draggedElement = null;
    this.draggedServer = null;
  }

  handleDragStart(event) {
    this.draggedElement = event.target.closest('.server-card');
    this.draggedServer = this.draggedElement?.dataset.server;
    
    if (!this.draggedElement) return;
    
    // Set drag data
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', this.draggedServer);
    
    // Add dragging class after a frame (to avoid flash)
    requestAnimationFrame(() => {
      this.draggedElement.classList.add('dragging');
    });
  }

  handleDragEnd(event) {
    if (this.draggedElement) {
      this.draggedElement.classList.remove('dragging');
    }
    
    // Remove all drag-over states
    document.querySelectorAll('.server-card').forEach(card => {
      card.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom');
    });
    
    this.draggedElement = null;
    this.draggedServer = null;
  }

  handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    
    const card = event.target.closest('.server-card');
    if (!card || card === this.draggedElement) return;
    
    // Determine if dragging over top or bottom half
    const rect = card.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    
    card.classList.remove('drag-over-top', 'drag-over-bottom');
    if (event.clientY < midY) {
      card.classList.add('drag-over-top');
    } else {
      card.classList.add('drag-over-bottom');
    }
  }

  handleDragEnter(event) {
    event.preventDefault();
    const card = event.target.closest('.server-card');
    if (card && card !== this.draggedElement) {
      card.classList.add('drag-over');
    }
  }

  handleDragLeave(event) {
    const card = event.target.closest('.server-card');
    if (card) {
      // Only remove if leaving the card entirely
      const related = event.relatedTarget?.closest('.server-card');
      if (related !== card) {
        card.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom');
      }
    }
  }

  handleDrop(event) {
    event.preventDefault();
    
    const targetCard = event.target.closest('.server-card');
    if (!targetCard || !this.draggedElement || targetCard === this.draggedElement) {
      return;
    }
    
    const targetServer = targetCard.dataset.server;
    const rect = targetCard.getBoundingClientRect();
    const insertBefore = event.clientY < rect.top + rect.height / 2;
    
    // Get current order from DOM
    const container = document.getElementById('servers');
    const cards = Array.from(container.querySelectorAll('.server-card'));
    const currentOrder = cards.map(c => c.dataset.server);
    
    // Remove dragged item from order
    const draggedIndex = currentOrder.indexOf(this.draggedServer);
    if (draggedIndex > -1) {
      currentOrder.splice(draggedIndex, 1);
    }
    
    // Find target index and insert
    let targetIndex = currentOrder.indexOf(targetServer);
    if (!insertBefore) {
      targetIndex += 1;
    }
    currentOrder.splice(targetIndex, 0, this.draggedServer);
    
    // Save new order
    saveServerOrder(currentOrder);
    
    // Visually reorder cards without full re-render
    this.reorderCards(container, currentOrder);
    
    // Clean up
    targetCard.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom');
    
    // Show toast
    if (window.Toast) {
      window.Toast.show('Server order saved', 'success');
    }
  }

  /**
   * Reorder cards in DOM based on order array
   */
  reorderCards(container, order) {
    const fragment = document.createDocumentFragment();
    
    order.forEach((serverName, index) => {
      const card = container.querySelector(`[data-server="${serverName}"]`);
      if (card) {
        // Update index display
        const indexEl = card.querySelector('.server-index');
        if (indexEl) {
          indexEl.textContent = index + 1;
          indexEl.title = `Press ${index + 1} to toggle`;
        }
        fragment.appendChild(card);
      }
    });
    
    container.appendChild(fragment);
  }

  /**
   * Reset server order to default
   */
  resetOrder() {
    localStorage.removeItem(SERVER_ORDER_KEY);
    if (window.Toast) {
      window.Toast.show('Server order reset', 'info');
    }
    // Trigger re-render
    if (window.Dashboard?.refreshServers) {
      window.Dashboard.refreshServers();
    }
  }
}

// Create global instance
const serverDragController = new ServerDragController();

// Export for window binding
export const ServerDrag = {
  handleDragStart: (e) => serverDragController.handleDragStart(e),
  handleDragEnd: (e) => serverDragController.handleDragEnd(e),
  handleDragOver: (e) => serverDragController.handleDragOver(e),
  handleDragEnter: (e) => serverDragController.handleDragEnter(e),
  handleDragLeave: (e) => serverDragController.handleDragLeave(e),
  handleDrop: (e) => serverDragController.handleDrop(e),
  resetOrder: () => serverDragController.resetOrder()
};

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
