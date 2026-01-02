/**
 * BambiSleep™ Church MCP Control Tower
 * AgentWorkspace - Container for agent-generated dynamic content
 * 
 * Provides the UI container where agents can render dynamic components
 * using render_* tools. Manages workspace state, history, and layout.
 */

import DynamicRenderer, {
  clearComponents,
  getAllComponents,
  processRenderCommand,
  registerActionHandler,
} from './DynamicRenderer.js';

/**
 * Workspace layout modes
 */
export const LAYOUT_MODES = Object.freeze({
  STACK: 'stack',       // Vertical stack (default)
  GRID: 'grid',         // Auto-fit grid
  COLUMNS: 'columns',   // Fixed columns
  FREE: 'free',         // Absolute positioning
});

/**
 * Rate limit configuration
 */
const RATE_LIMIT_CONFIG = {
  maxComponents: 50,           // Max components at once
  maxRendersPerMinute: 60,     // Max renders per minute
  maxRendersPerSecond: 5,      // Burst limit
  throttleDelayMs: 200,        // Min delay between renders
  maxMemoryMB: 50,             // Max DOM memory estimate
};

/**
 * Rate limit state
 */
const rateLimitState = {
  renderTimestamps: [],
  lastRenderTime: 0,
  pendingRenders: [],
  throttleTimer: null,
  isThrottled: false,
};

/**
 * Workspace state
 */
const workspaceState = {
  containerId: null,
  container: null,
  layoutMode: LAYOUT_MODES.STACK,
  columns: 2,
  history: [],
  maxHistory: 50,
  isConnected: false,
  wsConnection: null,
  rateLimitConfig: { ...RATE_LIMIT_CONFIG },
};

/**
 * Initialize the agent workspace
 * @param {string} containerId - DOM element ID for workspace
 * @param {Object} options - Initialization options
 * @returns {Object} Workspace API
 */
export function initWorkspace(containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Workspace container not found: ${containerId}`);
    return null;
  }

  workspaceState.containerId = containerId;
  workspaceState.container = container;
  workspaceState.layoutMode = options.layoutMode || LAYOUT_MODES.STACK;
  workspaceState.columns = options.columns || 2;

  // Apply initial styles
  container.classList.add('agent-workspace', `layout-${workspaceState.layoutMode}`);
  if (workspaceState.layoutMode === LAYOUT_MODES.COLUMNS) {
    container.style.setProperty('--workspace-columns', workspaceState.columns);
  }

  // Register default action handlers
  registerDefaultHandlers();

  // Set up WebSocket listener if ws option provided
  if (options.ws) {
    connectWebSocket(options.ws);
  }

  return getWorkspaceAPI();
}

/**
 * Get workspace public API
 * @returns {Object} API methods
 */
function getWorkspaceAPI() {
  return {
    render: renderToWorkspace,
    clear: clearWorkspace,
    setLayout: setLayoutMode,
    getComponents: getAllComponents,
    getHistory: () => [...workspaceState.history],
    getState: () => ({ ...workspaceState, container: undefined, wsConnection: undefined }),
    connectWs: connectWebSocket,
    disconnectWs: disconnectWebSocket,
    // Rate limiting
    getRateLimitStats,
    setRateLimitConfig,
    clearPendingRenders: () => { rateLimitState.pendingRenders = []; },
  };
}

/**
 * Render content to workspace
 * @param {string} type - Component type
 * @param {Object} props - Component properties
 * @returns {HTMLElement|null} Rendered element
 */
export function renderToWorkspace(type, props) {
  if (!workspaceState.container) {
    console.error('Workspace not initialized');
    return null;
  }

  // Check rate limits
  const rateLimitResult = checkRateLimit();
  if (!rateLimitResult.allowed) {
    console.warn(`Render rate limited: ${rateLimitResult.reason}`);
    
    // Queue if throttled, reject if over limits
    if (rateLimitResult.reason === 'throttled') {
      queueRender(type, props);
      return null;
    }
    
    return null;
  }

  // Record this render
  recordRender();

  // Add to history
  addToHistory({ type, props, timestamp: Date.now() });

  return DynamicRenderer.renderComponent(type, props, workspaceState.container);
}

/**
 * Check if render is allowed by rate limits
 * @returns {{allowed: boolean, reason?: string}}
 */
function checkRateLimit() {
  const config = workspaceState.rateLimitConfig;
  const now = Date.now();
  
  // Check max components
  const currentComponents = getAllComponents();
  if (currentComponents.length >= config.maxComponents) {
    return { allowed: false, reason: 'max_components' };
  }
  
  // Clean old timestamps (older than 1 minute)
  rateLimitState.renderTimestamps = rateLimitState.renderTimestamps.filter(
    ts => now - ts < 60000
  );
  
  // Check renders per minute
  if (rateLimitState.renderTimestamps.length >= config.maxRendersPerMinute) {
    return { allowed: false, reason: 'rate_limit_minute' };
  }
  
  // Check burst limit (renders in last second)
  const recentRenders = rateLimitState.renderTimestamps.filter(
    ts => now - ts < 1000
  ).length;
  if (recentRenders >= config.maxRendersPerSecond) {
    return { allowed: false, reason: 'rate_limit_burst' };
  }
  
  // Check throttle (min delay between renders)
  if (now - rateLimitState.lastRenderTime < config.throttleDelayMs) {
    return { allowed: false, reason: 'throttled' };
  }
  
  return { allowed: true };
}

/**
 * Record a render timestamp
 */
function recordRender() {
  const now = Date.now();
  rateLimitState.renderTimestamps.push(now);
  rateLimitState.lastRenderTime = now;
}

/**
 * Queue a render for later (when throttled)
 * @param {string} type - Component type
 * @param {Object} props - Component properties
 */
function queueRender(type, props) {
  const config = workspaceState.rateLimitConfig;
  
  // Add to queue
  rateLimitState.pendingRenders.push({ type, props });
  
  // Process queue after throttle delay
  if (!rateLimitState.throttleTimer) {
    rateLimitState.throttleTimer = setTimeout(() => {
      processRenderQueue();
    }, config.throttleDelayMs);
  }
}

/**
 * Process queued renders
 */
function processRenderQueue() {
  rateLimitState.throttleTimer = null;
  
  if (rateLimitState.pendingRenders.length === 0) return;
  
  // Process one render from queue
  const { type, props } = rateLimitState.pendingRenders.shift();
  renderToWorkspace(type, props);
  
  // Schedule next if more pending
  if (rateLimitState.pendingRenders.length > 0) {
    rateLimitState.throttleTimer = setTimeout(() => {
      processRenderQueue();
    }, workspaceState.rateLimitConfig.throttleDelayMs);
  }
}

/**
 * Get rate limit stats
 * @returns {Object} Rate limit statistics
 */
export function getRateLimitStats() {
  const config = workspaceState.rateLimitConfig;
  const currentComponents = getAllComponents();
  const now = Date.now();
  
  // Clean old timestamps
  const recentTimestamps = rateLimitState.renderTimestamps.filter(
    ts => now - ts < 60000
  );
  
  return {
    currentComponents: currentComponents.length,
    maxComponents: config.maxComponents,
    rendersLastMinute: recentTimestamps.length,
    maxRendersPerMinute: config.maxRendersPerMinute,
    pendingRenders: rateLimitState.pendingRenders.length,
    isThrottled: rateLimitState.throttleTimer !== null,
    utilizationPercent: Math.round((currentComponents.length / config.maxComponents) * 100),
  };
}

/**
 * Update rate limit configuration
 * @param {Object} newConfig - New configuration values
 */
export function setRateLimitConfig(newConfig) {
  workspaceState.rateLimitConfig = {
    ...workspaceState.rateLimitConfig,
    ...newConfig,
  };
}

/**
 * Clear workspace
 * @param {string} [type] - Component type to clear (omit for all)
 */
export function clearWorkspace(type) {
  clearComponents(type);
}

/**
 * Set workspace layout mode
 * @param {string} mode - Layout mode from LAYOUT_MODES
 * @param {Object} options - Layout options
 */
export function setLayoutMode(mode, options = {}) {
  if (!Object.values(LAYOUT_MODES).includes(mode)) {
    console.warn(`Invalid layout mode: ${mode}`);
    return;
  }

  const { container } = workspaceState;
  if (!container) return;

  // Remove old layout class
  container.classList.remove(`layout-${workspaceState.layoutMode}`);
  
  // Apply new layout
  workspaceState.layoutMode = mode;
  container.classList.add(`layout-${mode}`);

  if (mode === LAYOUT_MODES.COLUMNS && options.columns) {
    workspaceState.columns = options.columns;
    container.style.setProperty('--workspace-columns', options.columns);
  }
}

/**
 * Add entry to history
 * @param {Object} entry - History entry
 */
function addToHistory(entry) {
  workspaceState.history.push(entry);
  if (workspaceState.history.length > workspaceState.maxHistory) {
    workspaceState.history.shift();
  }
}

/**
 * Register default action handlers
 */
function registerDefaultHandlers() {
  // Clear workspace action
  registerActionHandler('workspace-clear', () => {
    clearWorkspace();
  });

  // Change layout action
  registerActionHandler('workspace-layout', (data) => {
    if (data.mode) {
      setLayoutMode(data.mode, data.options);
    }
  });

  // Scroll to component action
  registerActionHandler('workspace-scroll-to', (data) => {
    if (data.componentId) {
      const comp = document.querySelector(`[data-component-id="${data.componentId}"]`);
      comp?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}

/**
 * Connect to WebSocket for real-time render commands
 * @param {string|WebSocket} wsOrUrl - WebSocket instance or URL
 */
export function connectWebSocket(wsOrUrl) {
  if (workspaceState.wsConnection) {
    disconnectWebSocket();
  }

  const ws = typeof wsOrUrl === 'string' ? new WebSocket(wsOrUrl) : wsOrUrl;
  workspaceState.wsConnection = ws;

  ws.addEventListener('message', handleWebSocketMessage);
  ws.addEventListener('open', () => {
    workspaceState.isConnected = true;
    console.log('AgentWorkspace: WebSocket connected');
  });
  ws.addEventListener('close', () => {
    workspaceState.isConnected = false;
    console.log('AgentWorkspace: WebSocket disconnected');
  });
  ws.addEventListener('error', (err) => {
    console.error('AgentWorkspace: WebSocket error', err);
  });
}

/**
 * Disconnect WebSocket
 */
export function disconnectWebSocket() {
  if (workspaceState.wsConnection) {
    workspaceState.wsConnection.removeEventListener('message', handleWebSocketMessage);
    if (workspaceState.wsConnection.readyState === WebSocket.OPEN) {
      workspaceState.wsConnection.close();
    }
    workspaceState.wsConnection = null;
    workspaceState.isConnected = false;
  }
}

/**
 * Handle incoming WebSocket message
 * @param {MessageEvent} event - WebSocket message event
 */
function handleWebSocketMessage(event) {
  try {
    const data = JSON.parse(event.data);
    
    // Check if this is a render command
    if (data.type === 'render' && data.payload) {
      processRenderCommand(data.payload, workspaceState.container);
      addToHistory({ 
        type: data.payload.type, 
        props: data.payload, 
        timestamp: Date.now(),
        source: 'websocket',
      });
    }
  } catch (err) {
    // Not a JSON message or not a render command, ignore
  }
}

/**
 * Render the workspace container HTML
 * @param {Object} options - Render options
 * @returns {string} HTML string
 */
export function renderWorkspaceContainer(options = {}) {
  const {
    id = 'agent-workspace',
    title = 'Agent Workspace',
    showControls = true,
    showHistory = false,
  } = options;

  return `
    <div class="glass-card workspace-wrapper">
      <div class="workspace-header">
        <h2 class="workspace-title">
          <span class="workspace-icon">🤖</span>
          ${title}
        </h2>
        ${showControls ? `
          <div class="workspace-controls">
            <select class="layout-select" data-action="change-layout">
              <option value="stack">Stack</option>
              <option value="grid">Grid</option>
              <option value="columns">Columns</option>
            </select>
            <button class="btn btn-sm" data-action="workspace-clear" title="Clear workspace">
              🗑️
            </button>
            ${showHistory ? `
              <button class="btn btn-sm" data-action="toggle-history" title="Show history">
                📜
              </button>
            ` : ''}
          </div>
        ` : ''}
      </div>
      <div id="${id}" class="workspace-content"></div>
      ${showHistory ? `
        <div class="workspace-history collapsed">
          <h4>Render History</h4>
          <div class="history-list"></div>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Mount workspace controls event listeners
 * @param {HTMLElement} wrapper - Workspace wrapper element
 */
export function mountWorkspaceControls(wrapper) {
  // Layout select
  const layoutSelect = wrapper.querySelector('.layout-select');
  if (layoutSelect) {
    layoutSelect.value = workspaceState.layoutMode;
    layoutSelect.addEventListener('change', (e) => {
      setLayoutMode(e.target.value);
    });
  }

  // History toggle
  const historyToggle = wrapper.querySelector('[data-action="toggle-history"]');
  const historyPanel = wrapper.querySelector('.workspace-history');
  if (historyToggle && historyPanel) {
    historyToggle.addEventListener('click', () => {
      historyPanel.classList.toggle('collapsed');
      if (!historyPanel.classList.contains('collapsed')) {
        updateHistoryDisplay(historyPanel.querySelector('.history-list'));
      }
    });
  }
}

/**
 * Update history display
 * @param {HTMLElement} container - History list container
 */
function updateHistoryDisplay(container) {
  if (!container) return;
  
  container.innerHTML = workspaceState.history
    .slice(-20)
    .reverse()
    .map(entry => `
      <div class="history-entry">
        <span class="entry-type">${entry.type}</span>
        <span class="entry-time">${new Date(entry.timestamp).toLocaleTimeString()}</span>
        ${entry.source ? `<span class="entry-source">${entry.source}</span>` : ''}
      </div>
    `).join('');
}

export default {
  initWorkspace,
  renderToWorkspace,
  clearWorkspace,
  setLayoutMode,
  connectWebSocket,
  disconnectWebSocket,
  renderWorkspaceContainer,
  mountWorkspaceControls,
  LAYOUT_MODES,
};
