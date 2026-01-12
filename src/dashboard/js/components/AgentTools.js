/**
 * BambiSleep™ Church MCP Control Tower
 * AgentTools - Agent Tools Testing Dashboard
 * 
 * Displays and tests all 154 agent tools across 18 categories
 */

import { getApiBase } from '../config.js';

const API_BASE = () => getApiBase();

/**
 * Tool categories with counts
 */
const TOOL_CATEGORIES = {
  memory: { count: 9, label: 'Memory' },
  'user-model': { count: 9, label: 'User Model' },
  conversation: { count: 10, label: 'Conversation' },
  workspace: { count: 8, label: 'Workspace' },
  'memory-manager': { count: 10, label: 'Memory Manager' },
  storage: { count: 7, label: 'Storage' },
  fetch: { count: 4, label: 'Fetch' },
  github: { count: 3, label: 'GitHub' },
  lmstudio: { count: 4, label: 'LM Studio' },
  mongodb: { count: 9, label: 'MongoDB' },
  sqlite: { count: 6, label: 'SQLite' },
  thinking: { count: 4, label: 'Thinking' },
  stripe: { count: 12, label: 'Stripe' },
  patreon: { count: 15, label: 'Patreon' },
  clarity: { count: 7, label: 'Clarity' },
  puppeteer: { count: 12, label: 'Puppeteer' },
  huggingface: { count: 3, label: 'HuggingFace' },
  render: { count: 22, label: 'Render' }
};

/**
 * Component state
 */
let state = {
  tools: [],
  testResults: [],
  selectedCategory: 'all',
  selectedStatus: 'all',
  filterText: '',
  isRunning: false
};

/**
 * Initialize Agent Tools dashboard
 */
export function initAgentTools() {
  setupEventListeners();
  loadTools();
  loadSavedResults();
  return {
    runTests,
    loadResults,
    exportResults,
    refresh: loadTools
  };
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Filter inputs
  const filterInput = document.getElementById('results-filter');
  const categoryFilter = document.getElementById('category-filter');
  const statusFilter = document.getElementById('status-filter');

  if (filterInput) {
    filterInput.addEventListener('input', (e) => {
      state.filterText = e.target.value.toLowerCase();
      renderResults();
    });
  }

  if (categoryFilter) {
    categoryFilter.addEventListener('change', (e) => {
      state.selectedCategory = e.target.value;
      renderResults();
    });
  }

  if (statusFilter) {
    statusFilter.addEventListener('change', (e) => {
      state.selectedStatus = e.target.value;
      renderResults();
    });
  }
}

/**
 * Load all available tools from API
 */
async function loadTools() {
  try {
    const apiBase = getApiBase();
    const response = await fetch(`${apiBase}/api/agent/tools`);
    const data = await response.json();
    
    state.tools = data.tools || [];
    updateSummary();
    renderCategories();
    renderResults();
    
    console.log(`Loaded ${state.tools.length} agent tools`);
  } catch (error) {
    console.error('Failed to load tools:', error);
    showError('Failed to load tools from server');
  }
}

/**
 * Run comprehensive test suite
 */
async function runTests() {
  if (state.isRunning) {
    showError('Tests are already running');
    return;
  }

  state.isRunning = true;
  state.testResults = [];
  
  try {
    // Show loading state
    updateSummary();
    renderResults();
    
    // Test each tool
    const apiBase = getApiBase();
    let completed = 0;
    
    for (const tool of state.tools) {
      try {
        const testArgs = getTestArgs(tool);
        const response = await fetch(`${apiBase}/api/agent/tools/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tool: tool.name,
            args: testArgs
          })
        });
        
        const result = await response.json();
        
        state.testResults.push({
          tool: tool.name,
          category: tool.category,
          status: result.success ? 'pass' : 'fail',
          error: result.error || null,
          result: result.result || null,
          timestamp: Date.now()
        });
        
      } catch (error) {
        state.testResults.push({
          tool: tool.name,
          category: tool.category,
          status: 'error',
          error: error.message,
          result: null,
          timestamp: Date.now()
        });
      }
      
      completed++;
      updateSummary();
      renderResults();
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Save results
    saveResults();
    showSuccess(`Testing complete: ${completed}/${state.tools.length} tools tested`);
    
  } catch (error) {
    console.error('Test suite failed:', error);
    showError('Test suite failed: ' + error.message);
  } finally {
    state.isRunning = false;
    updateSummary();
  }
}

/**
 * Get test arguments for a tool
 */
function getTestArgs(tool) {
  // Return appropriate test arguments based on tool category
  const category = tool.category;
  
  if (category === 'storage') {
    if (tool.name.includes('list')) return { folder: 'all' };
    if (tool.name.includes('search')) return { query: 'test' };
  }
  
  if (category === 'github') {
    if (tool.name.includes('search')) return { query: 'test', limit: 5 };
  }
  
  if (category === 'huggingface') {
    if (tool.name.includes('search')) return { query: 'gpt', limit: 3 };
  }
  
  if (category === 'conversation') {
    if (tool.name.includes('history')) return { limit: 10 };
    if (tool.name.includes('search')) return { query: 'test' };
  }
  
  if (category === 'memory') {
    if (tool.name.includes('search')) return { query: 'test' };
    if (tool.name.includes('open')) return { names: ['test'] };
  }
  
  if (category === 'user-model') {
    if (tool.name.includes('get_preference')) return { key: 'test' };
    if (tool.name.includes('set_preference')) return { key: 'test', value: 'value' };
    if (tool.name.includes('patterns')) return { limit: 5 };
  }
  
  // Default empty args
  return {};
}

/**
 * Load saved test results
 */
function loadSavedResults() {
  try {
    const saved = localStorage.getItem('agent-tool-test-results');
    if (saved) {
      state.testResults = JSON.parse(saved);
      updateSummary();
      renderResults();
    }
  } catch (error) {
    console.error('Failed to load saved results:', error);
  }
}

/**
 * Save test results to localStorage
 */
function saveResults() {
  try {
    localStorage.setItem('agent-tool-test-results', JSON.stringify(state.testResults));
  } catch (error) {
    console.error('Failed to save results:', error);
  }
}

/**
 * Load results (refresh)
 */
function loadResults() {
  loadSavedResults();
  showSuccess('Results reloaded');
}

/**
 * Export results as JSON
 */
function exportResults() {
  const exportData = {
    timestamp: Date.now(),
    totalTools: state.tools.length,
    testedTools: state.testResults.length,
    results: state.testResults,
    summary: calculateSummary()
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `agent-tools-test-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  showSuccess('Results exported');
}

/**
 * Calculate summary statistics
 */
function calculateSummary() {
  const total = state.tools.length;
  const tested = state.testResults.length;
  const passed = state.testResults.filter(r => r.status === 'pass').length;
  const failed = state.testResults.filter(r => r.status === 'fail').length;
  const errors = state.testResults.filter(r => r.status === 'error').length;
  const successRate = tested > 0 ? Math.round((passed / tested) * 100) : 0;
  
  return { total, tested, passed, failed, errors, successRate };
}

/**
 * Update summary display
 */
function updateSummary() {
  const summary = calculateSummary();
  
  // Update stat values
  document.getElementById('total-tools').textContent = summary.total;
  document.getElementById('tested-tools').textContent = summary.tested;
  document.getElementById('passed-tools').textContent = summary.passed;
  document.getElementById('failed-tools').textContent = summary.failed;
  document.getElementById('success-rate').textContent = `${summary.successRate}%`;
  
  // Update progress circle
  const progressCircle = document.getElementById('progress-circle');
  const progressText = document.getElementById('progress-text');
  if (progressCircle && progressText) {
    const circumference = 339.292; // 2 * PI * 54
    const offset = circumference - (circumference * summary.successRate / 100);
    progressCircle.style.strokeDashoffset = offset;
    progressText.textContent = `${summary.successRate}%`;
  }
}

/**
 * Render category breakdown
 */
function renderCategories() {
  const container = document.getElementById('category-list');
  if (!container) return;
  
  const categoryStats = {};
  
  // Initialize all categories
  Object.keys(TOOL_CATEGORIES).forEach(cat => {
    categoryStats[cat] = { total: TOOL_CATEGORIES[cat].count, tested: 0, passed: 0 };
  });
  
  // Count results by category
  state.testResults.forEach(result => {
    if (categoryStats[result.category]) {
      categoryStats[result.category].tested++;
      if (result.status === 'pass') {
        categoryStats[result.category].passed++;
      }
    }
  });
  
  // Render category cards
  const html = Object.entries(TOOL_CATEGORIES)
    .map(([key, info]) => {
      const stats = categoryStats[key];
      const rate = stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0;
      const statusClass = rate === 100 ? 'success' : rate > 50 ? 'warning' : 'error';
      
      return `
        <div class="category-item">
          <div class="category-header">
            <span class="category-name">${info.label}</span>
            <span class="category-count">${stats.passed}/${stats.total}</span>
          </div>
          <div class="category-progress">
            <div class="progress-bar ${statusClass}" style="width: ${rate}%"></div>
          </div>
          <div class="category-rate ${statusClass}">${rate}%</div>
        </div>
      `;
    })
    .join('');
  
  container.innerHTML = html;
}

/**
 * Render results table
 */
function renderResults() {
  const tbody = document.getElementById('results-tbody');
  if (!tbody) return;
  
  // Get filtered tools
  let filtered = state.tools;
  
  // Filter by category
  if (state.selectedCategory !== 'all') {
    filtered = filtered.filter(t => t.category === state.selectedCategory);
  }
  
  // Filter by search text
  if (state.filterText) {
    filtered = filtered.filter(t => 
      t.name.toLowerCase().includes(state.filterText) ||
      t.description?.toLowerCase().includes(state.filterText)
    );
  }
  
  // Filter by status
  if (state.selectedStatus !== 'all') {
    filtered = filtered.filter(t => {
      const result = state.testResults.find(r => r.tool === t.name);
      if (!result) return state.selectedStatus === 'not-tested';
      return result.status === state.selectedStatus;
    });
  }
  
  // Render rows
  const html = filtered.map(tool => {
    const result = state.testResults.find(r => r.tool === tool.name);
    const status = result ? result.status : 'not-tested';
    const statusIcon = {
      pass: '✅',
      fail: '⚠️',
      error: '❌',
      'not-tested': '⚪'
    }[status];
    
    const resultPreview = result 
      ? (result.error ? result.error.substring(0, 50) : 'Success')
      : 'Not tested';
    
    return `
      <tr class="status-${status}">
        <td><span class="status-badge">${statusIcon}</span></td>
        <td><code>${tool.name}</code></td>
        <td><span class="category-badge">${TOOL_CATEGORIES[tool.category]?.label || tool.category}</span></td>
        <td>${tool.description || 'No description'}</td>
        <td class="result-preview">${resultPreview}</td>
        <td>
          <button class="btn-icon" onclick="window.AgentTools.testTool('${tool.name}')" title="Test this tool">
            ▶️
          </button>
          <button class="btn-icon" onclick="window.AgentTools.showDetails('${tool.name}')" title="View details">
            🔍
          </button>
        </td>
      </tr>
    `;
  }).join('');
  
  tbody.innerHTML = html || '<tr><td colspan="6" class="no-results">No tools match the current filters</td></tr>';
}

/**
 * Test a single tool
 */
async function testTool(toolName) {
  const tool = state.tools.find(t => t.name === toolName);
  if (!tool) {
    showError(`Tool not found: ${toolName}`);
    return;
  }
  
  try {
    const apiBase = getApiBase();
    const testArgs = getTestArgs(tool);
    
    const response = await fetch(`${apiBase}/api/agent/tools/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: toolName,
        args: testArgs
      })
    });
    
    const result = await response.json();
    
    // Update or add result
    const existingIndex = state.testResults.findIndex(r => r.tool === toolName);
    const newResult = {
      tool: toolName,
      category: tool.category,
      status: result.success ? 'pass' : 'fail',
      error: result.error || null,
      result: result.result || null,
      timestamp: Date.now()
    };
    
    if (existingIndex >= 0) {
      state.testResults[existingIndex] = newResult;
    } else {
      state.testResults.push(newResult);
    }
    
    saveResults();
    updateSummary();
    renderCategories();
    renderResults();
    
    showSuccess(`${toolName}: ${result.success ? 'PASS' : 'FAIL'}`);
    
  } catch (error) {
    showError(`Test failed: ${error.message}`);
  }
}

/**
 * Show tool details modal
 */
function showDetails(toolName) {
  const tool = state.tools.find(t => t.name === toolName);
  const result = state.testResults.find(r => r.tool === toolName);
  
  if (!tool) return;
  
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal glass-card">
      <div class="modal-header">
        <h3>🔧 ${tool.name}</h3>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✖</button>
      </div>
      <div class="modal-body">
        <div class="detail-row">
          <strong>Category:</strong> ${TOOL_CATEGORIES[tool.category]?.label || tool.category}
        </div>
        <div class="detail-row">
          <strong>Description:</strong> ${tool.description || 'No description'}
        </div>
        ${result ? `
          <div class="detail-row">
            <strong>Status:</strong> <span class="status-badge status-${result.status}">${result.status.toUpperCase()}</span>
          </div>
          <div class="detail-row">
            <strong>Last Tested:</strong> ${new Date(result.timestamp).toLocaleString()}
          </div>
          ${result.error ? `
            <div class="detail-row error">
              <strong>Error:</strong> ${result.error}
            </div>
          ` : ''}
          ${result.result ? `
            <div class="detail-row">
              <strong>Result:</strong>
              <pre>${JSON.stringify(result.result, null, 2)}</pre>
            </div>
          ` : ''}
        ` : '<div class="detail-row warning">Not tested yet</div>'}
        
        <div class="detail-row">
          <strong>Parameters:</strong>
          <pre>${JSON.stringify(tool.parameters || {}, null, 2)}</pre>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" onclick="window.AgentTools.testTool('${toolName}'); this.closest('.modal-overlay').remove()">
          ▶️ Test Now
        </button>
        <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Close</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

/**
 * Show success toast
 */
function showSuccess(message) {
  if (window.showToast) {
    window.showToast(message, 'success');
  } else {
    console.log('✅', message);
  }
}

/**
 * Show error toast
 */
function showError(message) {
  if (window.showToast) {
    window.showToast(message, 'error');
  } else {
    console.error('❌', message);
  }
}

// Export API
export const AgentToolsAPI = {
  runTests,
  loadResults,
  exportResults,
  testTool,
  showDetails
};
