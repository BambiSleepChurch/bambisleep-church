/**
 * BambiSleep™ Church MCP Control Tower
 * API Request Builder Panel Component
 */

/**
 * Render the API request builder panel
 */
export function renderApiRequestBuilder() {
  return `
    <div class="api-builder-container">
      <div class="api-builder-header">
        <h3>🔧 API Request Builder</h3>
        <button class="btn btn-small btn-outline" onclick="window.ApiBuilder.loadEndpoints()">
          📋 Load Endpoints
        </button>
      </div>

      <div class="api-builder-content">
        <!-- Endpoint Selection -->
        <div class="api-builder-section">
          <label class="api-label">Endpoint</label>
          <div class="api-endpoint-row">
            <select id="api-method" class="api-select method-select">
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
            <input type="text" id="api-url" class="api-input url-input" 
                   placeholder="/api/health" value="/api/health">
          </div>
        </div>

        <!-- Quick Endpoints -->
        <div class="api-builder-section">
          <label class="api-label">Quick Endpoints</label>
          <div class="quick-endpoints">
            <button class="quick-endpoint-btn" onclick="window.ApiBuilder.setEndpoint('GET', '/api/health')">
              Health
            </button>
            <button class="quick-endpoint-btn" onclick="window.ApiBuilder.setEndpoint('GET', '/api/servers')">
              Servers
            </button>
            <button class="quick-endpoint-btn" onclick="window.ApiBuilder.setEndpoint('GET', '/api/memory')">
              Memory
            </button>
            <button class="quick-endpoint-btn" onclick="window.ApiBuilder.setEndpoint('GET', '/api/agent/tools')">
              Tools
            </button>
            <button class="quick-endpoint-btn" onclick="window.ApiBuilder.setEndpoint('GET', '/api/metrics')">
              Metrics
            </button>
            <button class="quick-endpoint-btn" onclick="window.ApiBuilder.setEndpoint('GET', '/api/docs')">
              Docs
            </button>
          </div>
        </div>

        <!-- Headers -->
        <div class="api-builder-section">
          <label class="api-label">
            Headers
            <button class="btn btn-tiny btn-outline" onclick="window.ApiBuilder.addHeader()">+ Add</button>
          </label>
          <div id="api-headers" class="api-headers-list">
            <div class="api-header-row">
              <input type="text" class="api-input header-key" placeholder="Key" value="Content-Type">
              <input type="text" class="api-input header-value" placeholder="Value" value="application/json">
              <button class="btn btn-tiny btn-danger" onclick="this.parentElement.remove()">×</button>
            </div>
          </div>
        </div>

        <!-- Request Body -->
        <div class="api-builder-section">
          <label class="api-label">Request Body (JSON)</label>
          <textarea id="api-body" class="api-textarea" placeholder='{ "key": "value" }'></textarea>
          <div class="body-actions">
            <button class="btn btn-tiny btn-outline" onclick="window.ApiBuilder.formatJson()">Format</button>
            <button class="btn btn-tiny btn-outline" onclick="window.ApiBuilder.clearBody()">Clear</button>
          </div>
        </div>

        <!-- Send Button -->
        <div class="api-builder-actions">
          <button id="api-send-btn" class="btn btn-primary btn-large" onclick="window.ApiBuilder.sendRequest()">
            🚀 Send Request
          </button>
          <button class="btn btn-outline" onclick="window.ApiBuilder.generateCurl()">
            📋 Copy cURL
          </button>
        </div>

        <!-- Response -->
        <div class="api-builder-section">
          <label class="api-label">
            Response
            <span id="api-status" class="api-status"></span>
            <span id="api-time" class="api-time"></span>
          </label>
          <div class="response-tabs">
            <button class="tab-btn active" data-tab="body" onclick="window.ApiBuilder.showTab('body')">Body</button>
            <button class="tab-btn" data-tab="headers" onclick="window.ApiBuilder.showTab('headers')">Headers</button>
          </div>
          <div id="api-response-body" class="api-response active">
            <pre id="api-response-text">// Response will appear here</pre>
          </div>
          <div id="api-response-headers" class="api-response">
            <pre id="api-response-headers-text">// Headers will appear here</pre>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * API Builder Controller Class
 */
export class ApiBuilderController {
  constructor() {
    this.history = [];
    this.maxHistory = 50;
  }

  /**
   * Set endpoint from quick buttons
   */
  setEndpoint(method, url) {
    document.getElementById('api-method').value = method;
    document.getElementById('api-url').value = url;
    
    // Clear body for GET requests
    if (method === 'GET') {
      document.getElementById('api-body').value = '';
    }
  }

  /**
   * Add a new header row
   */
  addHeader() {
    const container = document.getElementById('api-headers');
    const row = document.createElement('div');
    row.className = 'api-header-row';
    row.innerHTML = `
      <input type="text" class="api-input header-key" placeholder="Key">
      <input type="text" class="api-input header-value" placeholder="Value">
      <button class="btn btn-tiny btn-danger" onclick="this.parentElement.remove()">×</button>
    `;
    container.appendChild(row);
  }

  /**
   * Get all headers from the form
   */
  getHeaders() {
    const headers = {};
    const rows = document.querySelectorAll('#api-headers .api-header-row');
    rows.forEach(row => {
      const key = row.querySelector('.header-key')?.value?.trim();
      const value = row.querySelector('.header-value')?.value?.trim();
      if (key && value) {
        headers[key] = value;
      }
    });
    return headers;
  }

  /**
   * Format JSON in body textarea
   */
  formatJson() {
    const textarea = document.getElementById('api-body');
    try {
      const parsed = JSON.parse(textarea.value);
      textarea.value = JSON.stringify(parsed, null, 2);
    } catch (e) {
      console.error('Invalid JSON:', e);
      this.showError('Invalid JSON format');
    }
  }

  /**
   * Clear request body
   */
  clearBody() {
    document.getElementById('api-body').value = '';
  }

  /**
   * Send the API request
   */
  async sendRequest() {
    const method = document.getElementById('api-method').value;
    const url = document.getElementById('api-url').value;
    const body = document.getElementById('api-body').value;
    const headers = this.getHeaders();

    const sendBtn = document.getElementById('api-send-btn');
    sendBtn.disabled = true;
    sendBtn.textContent = '⏳ Sending...';

    const startTime = performance.now();

    try {
      const options = {
        method,
        headers,
      };

      // Add body for non-GET requests
      if (method !== 'GET' && body) {
        options.body = body;
      }

      const response = await fetch(url, options);
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      // Get response text
      const contentType = response.headers.get('content-type') || '';
      let responseText;
      
      if (contentType.includes('application/json')) {
        const json = await response.json();
        responseText = JSON.stringify(json, null, 2);
      } else {
        responseText = await response.text();
      }

      // Update status
      const statusEl = document.getElementById('api-status');
      statusEl.textContent = `${response.status} ${response.statusText}`;
      statusEl.className = `api-status ${response.ok ? 'success' : 'error'}`;

      // Update time
      document.getElementById('api-time').textContent = `${duration}ms`;

      // Update response body
      document.getElementById('api-response-text').textContent = responseText;

      // Update response headers
      const headersText = [...response.headers.entries()]
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n');
      document.getElementById('api-response-headers-text').textContent = headersText;

      // Add to history
      this.addToHistory({ method, url, body, headers, response: responseText, status: response.status, duration });

    } catch (error) {
      console.error('Request failed:', error);
      
      document.getElementById('api-status').textContent = 'Error';
      document.getElementById('api-status').className = 'api-status error';
      document.getElementById('api-response-text').textContent = `Error: ${error.message}`;
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = '🚀 Send Request';
    }
  }

  /**
   * Show response tab
   */
  showTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    // Update tab content
    document.getElementById('api-response-body').classList.toggle('active', tab === 'body');
    document.getElementById('api-response-headers').classList.toggle('active', tab === 'headers');
  }

  /**
   * Generate cURL command
   */
  generateCurl() {
    const method = document.getElementById('api-method').value;
    const url = document.getElementById('api-url').value;
    const body = document.getElementById('api-body').value;
    const headers = this.getHeaders();

    let curl = `curl -X ${method}`;
    
    // Add headers
    for (const [key, value] of Object.entries(headers)) {
      curl += ` \\\n  -H '${key}: ${value}'`;
    }

    // Add body
    if (method !== 'GET' && body) {
      curl += ` \\\n  -d '${body.replace(/'/g, "\\'")}'`;
    }

    // Add URL (make absolute)
    const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
    curl += ` \\\n  '${fullUrl}'`;

    // Copy to clipboard
    navigator.clipboard.writeText(curl).then(() => {
      this.showSuccess('cURL command copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy:', err);
      // Fallback: show in response area
      document.getElementById('api-response-text').textContent = curl;
    });
  }

  /**
   * Load available endpoints from OpenAPI spec
   */
  async loadEndpoints() {
    try {
      const response = await fetch('/api/openapi');
      const spec = await response.json();
      
      const endpoints = [];
      for (const [path, methods] of Object.entries(spec.paths || {})) {
        for (const method of Object.keys(methods)) {
          if (['get', 'post', 'put', 'delete'].includes(method)) {
            endpoints.push({
              method: method.toUpperCase(),
              path,
              summary: methods[method].summary || path,
            });
          }
        }
      }

      // Show endpoints in a modal or dropdown
      this.showEndpointPicker(endpoints);
    } catch (error) {
      console.error('Failed to load endpoints:', error);
      this.showError('Failed to load API endpoints');
    }
  }

  /**
   * Show endpoint picker
   */
  showEndpointPicker(endpoints) {
    const modal = document.createElement('div');
    modal.className = 'api-endpoint-modal';
    modal.innerHTML = `
      <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
      <div class="modal-content glass-card">
        <div class="modal-header">
          <h3>📋 API Endpoints</h3>
          <button class="btn btn-small btn-outline" onclick="this.closest('.api-endpoint-modal').remove()">×</button>
        </div>
        <div class="modal-body">
          <input type="text" class="api-input" placeholder="Search endpoints..." 
                 oninput="window.ApiBuilder.filterEndpoints(this.value)">
          <div class="endpoint-list" id="endpoint-list">
            ${endpoints.map(ep => `
              <div class="endpoint-item" data-method="${ep.method}" data-path="${ep.path}"
                   onclick="window.ApiBuilder.selectEndpoint('${ep.method}', '${ep.path}'); this.closest('.api-endpoint-modal').remove()">
                <span class="endpoint-method ${ep.method.toLowerCase()}">${ep.method}</span>
                <span class="endpoint-path">${ep.path}</span>
                <span class="endpoint-summary">${ep.summary}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  /**
   * Filter endpoints in picker
   */
  filterEndpoints(query) {
    const items = document.querySelectorAll('.endpoint-item');
    const lowerQuery = query.toLowerCase();
    items.forEach(item => {
      const path = item.dataset.path.toLowerCase();
      const method = item.dataset.method.toLowerCase();
      const visible = path.includes(lowerQuery) || method.includes(lowerQuery);
      item.style.display = visible ? 'flex' : 'none';
    });
  }

  /**
   * Select endpoint from picker
   */
  selectEndpoint(method, path) {
    this.setEndpoint(method, path);
  }

  /**
   * Add request to history
   */
  addToHistory(entry) {
    entry.timestamp = new Date().toISOString();
    this.history.unshift(entry);
    if (this.history.length > this.maxHistory) {
      this.history.pop();
    }
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    if (window.Toast) {
      window.Toast.success(message);
    } else {
      console.log(message);
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    if (window.Toast) {
      window.Toast.error(message);
    } else {
      console.error(message);
    }
  }
}

// Global instance
let builderInstance = null;

/**
 * Get or create the API builder controller
 */
export function getApiBuilder() {
  if (!builderInstance) {
    builderInstance = new ApiBuilderController();
  }
  return builderInstance;
}

// Expose to window for inline handlers
if (typeof window !== 'undefined') {
  window.ApiBuilder = {
    setEndpoint: (m, u) => getApiBuilder().setEndpoint(m, u),
    addHeader: () => getApiBuilder().addHeader(),
    formatJson: () => getApiBuilder().formatJson(),
    clearBody: () => getApiBuilder().clearBody(),
    sendRequest: () => getApiBuilder().sendRequest(),
    showTab: (t) => getApiBuilder().showTab(t),
    generateCurl: () => getApiBuilder().generateCurl(),
    loadEndpoints: () => getApiBuilder().loadEndpoints(),
    filterEndpoints: (q) => getApiBuilder().filterEndpoints(q),
    selectEndpoint: (m, p) => getApiBuilder().selectEndpoint(m, p),
  };
}

export default { renderApiRequestBuilder, ApiBuilderController, getApiBuilder };
