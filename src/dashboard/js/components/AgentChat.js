/**
 * BambiSleep™ Church MCP Control Tower
 * Agent Chat Component - AI Orchestrator Frontend
 */

import { Actions } from '../state/store.js';

/**
 * Format tool call for display
 */
function formatToolCall(toolCall) {
  const statusIcon = toolCall.result?.success ? '✓' : '✗';
  const statusClass = toolCall.result?.success ? 'success' : 'error';
  
  return `
    <div class="tool-call ${statusClass}">
      <span class="tool-icon">${statusIcon}</span>
      <span class="tool-name">${toolCall.tool}</span>
      <span class="tool-args">${JSON.stringify(toolCall.args)}</span>
    </div>
  `;
}

/**
 * Format message for display
 */
function formatMessage(message) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const isTool = message.role === 'tool';
  
  if (isSystem) return ''; // Don't display system messages
  
  let content = message.content;
  
  // Try to format JSON in tool responses
  if (isTool) {
    try {
      const parsed = JSON.parse(content);
      content = `<pre class="tool-result">${JSON.stringify(parsed, null, 2)}</pre>`;
    } catch {
      content = `<pre class="tool-result">${content}</pre>`;
    }
  }
  
  // Check for tool call JSON in assistant messages
  if (message.role === 'assistant') {
    const toolMatch = content.match(/\{"tool":\s*"[^"]+"/);
    if (toolMatch) {
      content = content.replace(
        /\{[^}]*"tool":\s*"([^"]+)"[^}]*\}/g,
        '<span class="inline-tool-call">🔧 Calling: $1</span>'
      );
    }
  }
  
  return `
    <div class="chat-message ${message.role}" data-id="${message.id}">
      <div class="message-avatar">
        ${isUser ? '👤' : isTool ? '🔧' : '🤖'}
      </div>
      <div class="message-content">
        <div class="message-header">
          <span class="message-role">${isUser ? 'You' : isTool ? 'Tool Result' : 'BambiAgent™'}</span>
          <span class="message-time">${new Date(message.timestamp).toLocaleTimeString()}</span>
        </div>
        <div class="message-text">${content}</div>
      </div>
    </div>
  `;
}

/**
 * Render the Agent Chat interface
 */
export function renderAgentChat(state = {}) {
  const {
    messages = [],
    conversationId = null,
    isLoading = false,
    toolCalls = [],
    stats = {},
    config = {},
  } = state;

  return `
    <div class="agent-chat-container">
      <div class="agent-header glass-card">
        <div class="agent-info">
          <h2>🤖 BambiAgent™ Orchestrator</h2>
          <p class="agent-model">${config.model || 'Qwen/Qwen2.5-0.5B-Instruct'}</p>
        </div>
        <div class="agent-stats">
          <span class="stat">
            <span class="stat-value">${stats.totalMessages || 0}</span>
            <span class="stat-label">Messages</span>
          </span>
          <span class="stat">
            <span class="stat-value">${stats.totalToolCalls || 0}</span>
            <span class="stat-label">Tool Calls</span>
          </span>
          <span class="stat">
            <span class="stat-value">${stats.activeConversations || 0}</span>
            <span class="stat-label">Conversations</span>
          </span>
        </div>
        <div class="agent-actions">
          <button class="btn-icon" onclick="window.AgentChat.newConversation()" title="New Conversation">
            <span>➕</span>
          </button>
          <button class="btn-icon" onclick="window.AgentChat.showTools()" title="View Tools">
            <span>🔧</span>
          </button>
          <button class="btn-icon" onclick="window.AgentChat.showConfig()" title="Settings">
            <span>⚙️</span>
          </button>
        </div>
      </div>

      <div class="chat-messages" id="agent-messages">
        ${messages.length === 0 ? `
          <div class="chat-welcome">
            <div class="welcome-icon">🤖</div>
            <h3>Welcome to BambiAgent™</h3>
            <p>I'm your intelligent orchestrator with access to all MCP servers.</p>
            <div class="quick-actions">
              <button onclick="window.AgentChat.quickAction('memory')">📊 Check Memory Graph</button>
              <button onclick="window.AgentChat.quickAction('github')">🐙 GitHub Status</button>
              <button onclick="window.AgentChat.quickAction('analytics')">📈 Analytics</button>
              <button onclick="window.AgentChat.quickAction('storage')">📁 List Files</button>
            </div>
          </div>
        ` : messages.map(formatMessage).join('')}
        ${isLoading ? `
          <div class="chat-message assistant loading">
            <div class="message-avatar">🤖</div>
            <div class="message-content">
              <div class="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        ` : ''}
      </div>

      ${toolCalls.length > 0 ? `
        <div class="tool-calls-panel">
          <h4>Recent Tool Calls</h4>
          <div class="tool-calls-list">
            ${toolCalls.slice(-5).map(formatToolCall).join('')}
          </div>
        </div>
      ` : ''}

      <div class="chat-input-container glass-card">
        <form id="agent-chat-form" onsubmit="window.AgentChat.sendMessage(event)">
          <div class="input-wrapper">
            <textarea 
              id="agent-input" 
              placeholder="Ask BambiAgent™ anything... (Press Enter to send, Shift+Enter for new line)"
              rows="1"
              ${isLoading ? 'disabled' : ''}
            ></textarea>
            <button type="submit" class="send-button" ${isLoading ? 'disabled' : ''}>
              ${isLoading ? '⏳' : '📤'}
            </button>
          </div>
          <div class="input-hints">
            <span>Try: "Show me the knowledge graph" • "Search GitHub for issues" • "List Stripe customers"</span>
          </div>
        </form>
      </div>
    </div>
  `;
}

/**
 * Render Tools Modal
 */
export function renderToolsModal(tools = []) {
  return `
    <div class="modal-header">
      <h2>🔧 Available Tools</h2>
      <button class="modal-close" onclick="window.AgentChat.closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <div class="tools-grid">
        ${tools.map(tool => `
          <div class="tool-card glass-card">
            <div class="tool-header">
              <span class="tool-name">${tool.name}</span>
            </div>
            <p class="tool-description">${tool.description}</p>
            <div class="tool-params">
              ${Object.entries(tool.parameters).map(([key, desc]) => `
                <span class="param"><code>${key}</code>: ${desc}</span>
              `).join('')}
            </div>
            <button class="btn-sm" onclick="window.AgentChat.useToolPrompt('${tool.name}')">
              Use Tool
            </button>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Render Config Modal
 */
export function renderConfigModal(config = {}) {
  return `
    <div class="modal-header">
      <h2>⚙️ Agent Configuration</h2>
      <button class="modal-close" onclick="window.AgentChat.closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <form id="agent-config-form" onsubmit="window.AgentChat.saveConfig(event)">
        <div class="form-group">
          <label for="agent-model">Model</label>
          <select id="agent-model" name="model">
            <option value="Qwen/Qwen2.5-0.5B-Instruct" ${config.model === 'Qwen/Qwen2.5-0.5B-Instruct' ? 'selected' : ''}>
              Qwen2.5-0.5B-Instruct (494M)
            </option>
            <option value="Qwen/Qwen2.5-Coder-0.5B-Instruct" ${config.model === 'Qwen/Qwen2.5-Coder-0.5B-Instruct' ? 'selected' : ''}>
              Qwen2.5-Coder-0.5B-Instruct (494M)
            </option>
            <option value="Qwen/Qwen3-0.6B" ${config.model === 'Qwen/Qwen3-0.6B' ? 'selected' : ''}>
              Qwen3-0.6B (751M)
            </option>
            <option value="microsoft/Phi-3-mini-4k-instruct" ${config.model === 'microsoft/Phi-3-mini-4k-instruct' ? 'selected' : ''}>
              Phi-3-mini-4k-instruct (3.8B)
            </option>
          </select>
        </div>
        <div class="form-group">
          <label for="agent-temperature">Temperature</label>
          <input 
            type="range" 
            id="agent-temperature" 
            name="temperature" 
            min="0" 
            max="1" 
            step="0.1" 
            value="${config.temperature || 0.7}"
          >
          <span class="range-value">${config.temperature || 0.7}</span>
        </div>
        <div class="form-group">
          <label for="agent-max-tokens">Max Tokens</label>
          <input 
            type="number" 
            id="agent-max-tokens" 
            name="maxTokens" 
            min="256" 
            max="4096" 
            value="${config.maxTokens || 2048}"
          >
        </div>
        <div class="form-actions">
          <button type="submit" class="btn-primary">Save Configuration</button>
          <button type="button" class="btn-secondary" onclick="window.AgentChat.closeModal()">Cancel</button>
        </div>
      </form>
    </div>
  `;
}

/**
 * Agent Chat Controller
 */
export const AgentChatController = {
  state: {
    messages: [],
    conversationId: null,
    isLoading: false,
    toolCalls: [],
    stats: {},
    config: {},
    tools: [],
  },

  /**
   * Initialize the agent chat
   */
  async init() {
    // Load initial data
    await Promise.all([
      this.loadStats(),
      this.loadConfig(),
      this.loadTools(),
    ]);
    
    this.render();
    this.setupEventListeners();
  },

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Auto-resize textarea
    const textarea = document.getElementById('agent-input');
    if (textarea) {
      textarea.addEventListener('input', () => {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
      });
      
      // Handle Enter key
      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }
  },

  /**
   * Render the chat
   */
  render() {
    const container = document.getElementById('agent-container');
    if (container) {
      container.innerHTML = renderAgentChat(this.state);
      this.scrollToBottom();
    }
  },

  /**
   * Scroll chat to bottom
   */
  scrollToBottom() {
    const messages = document.getElementById('agent-messages');
    if (messages) {
      messages.scrollTop = messages.scrollHeight;
    }
  },

  /**
   * Load agent stats
   */
  async loadStats() {
    try {
      const response = await fetch('/api/agent/stats');
      if (response.ok) {
        this.state.stats = await response.json();
      }
    } catch (error) {
      console.error('Failed to load agent stats:', error);
    }
  },

  /**
   * Load agent config
   */
  async loadConfig() {
    try {
      const response = await fetch('/api/agent/config');
      if (response.ok) {
        this.state.config = await response.json();
      }
    } catch (error) {
      console.error('Failed to load agent config:', error);
    }
  },

  /**
   * Load available tools
   */
  async loadTools() {
    try {
      const response = await fetch('/api/agent/tools');
      if (response.ok) {
        const data = await response.json();
        this.state.tools = data.tools || [];
      }
    } catch (error) {
      console.error('Failed to load tools:', error);
    }
  },

  /**
   * Send a message to the agent
   */
  async sendMessage(event) {
    if (event) event.preventDefault();
    
    const input = document.getElementById('agent-input');
    const message = input?.value?.trim();
    
    if (!message || this.state.isLoading) return;
    
    // Add user message to state
    this.state.messages.push({
      id: `msg_${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    });
    
    // Clear input and set loading
    input.value = '';
    input.style.height = 'auto';
    this.state.isLoading = true;
    this.render();
    
    try {
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          conversationId: this.state.conversationId,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        this.state.conversationId = data.conversationId;
        
        // Add assistant response
        this.state.messages.push({
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toISOString(),
        });
        
        // Update tool calls
        if (data.toolCalls) {
          this.state.toolCalls = data.toolCalls;
        }
        
        // Update stats
        await this.loadStats();
      } else {
        const error = await response.json();
        this.state.messages.push({
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: `Error: ${error.error || 'Unknown error'}`,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      this.state.messages.push({
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: `Connection error: ${error.message}`,
        timestamp: new Date().toISOString(),
      });
    }
    
    this.state.isLoading = false;
    this.render();
  },

  /**
   * Create a new conversation
   */
  async newConversation() {
    this.state.messages = [];
    this.state.conversationId = null;
    this.state.toolCalls = [];
    this.render();
    
    // Show toast
    Actions.addToast({ type: 'info', message: 'Started new conversation' });
  },

  /**
   * Quick action shortcuts
   */
  async quickAction(action) {
    const prompts = {
      memory: 'Show me the current knowledge graph',
      github: 'Get my GitHub user information',
      analytics: 'Show me the analytics dashboard data',
      storage: 'List all files in storage',
    };
    
    const input = document.getElementById('agent-input');
    if (input && prompts[action]) {
      input.value = prompts[action];
      await this.sendMessage();
    }
  },

  /**
   * Show tools modal
   */
  showTools() {
    const modal = document.getElementById('modal-container');
    if (modal) {
      modal.innerHTML = `
        <div class="modal-backdrop" onclick="window.AgentChat.closeModal()"></div>
        <div class="modal-content glass-card tools-modal">
          ${renderToolsModal(this.state.tools)}
        </div>
      `;
      modal.classList.add('show');
    }
  },

  /**
   * Show config modal
   */
  showConfig() {
    const modal = document.getElementById('modal-container');
    if (modal) {
      modal.innerHTML = `
        <div class="modal-backdrop" onclick="window.AgentChat.closeModal()"></div>
        <div class="modal-content glass-card config-modal">
          ${renderConfigModal(this.state.config)}
        </div>
      `;
      modal.classList.add('show');
      
      // Setup temperature slider
      const slider = document.getElementById('agent-temperature');
      const value = document.querySelector('.range-value');
      if (slider && value) {
        slider.addEventListener('input', () => {
          value.textContent = slider.value;
        });
      }
    }
  },

  /**
   * Close modal
   */
  closeModal() {
    const modal = document.getElementById('modal-container');
    if (modal) {
      modal.classList.remove('show');
      modal.innerHTML = '';
    }
  },

  /**
   * Save config
   */
  async saveConfig(event) {
    if (event) event.preventDefault();
    
    const form = document.getElementById('agent-config-form');
    if (!form) return;
    
    const formData = new FormData(form);
    const config = {
      model: formData.get('model'),
      temperature: parseFloat(formData.get('temperature')),
      maxTokens: parseInt(formData.get('maxTokens')),
    };
    
    try {
      const response = await fetch('/api/agent/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      
      if (response.ok) {
        this.state.config = await response.json();
        this.closeModal();
        Actions.addToast({ type: 'success', message: 'Configuration saved' });
      }
    } catch (error) {
      Actions.addToast({ type: 'error', message: `Failed to save: ${error.message}` });
    }
  },

  /**
   * Use tool prompt
   */
  useToolPrompt(toolName) {
    const tool = this.state.tools.find(t => t.name === toolName);
    if (!tool) return;
    
    const input = document.getElementById('agent-input');
    if (input) {
      input.value = `Use the ${toolName} tool to ${tool.description.toLowerCase()}`;
      this.closeModal();
      input.focus();
    }
  },
};

// Export for global access
if (typeof window !== 'undefined') {
  window.AgentChat = AgentChatController;
}

export default AgentChatController;
