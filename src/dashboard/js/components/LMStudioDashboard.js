/**
 * BambiSleep™ Church MCP Control Tower
 * LM Studio Dashboard Component
 */


/**
 * Render LM Studio status
 * @param {Object} status - Status data
 * @returns {string} HTML
 */
export function renderLMStudioStatus(status) {
  if (!status || !status.connected) {
    return `<div class="empty-state">
      <span class="empty-icon">⚠️</span>
      <h3>LM Studio Disconnected</h3>
      <p>Unable to connect to LM Studio server at ${status?.host || 'localhost'}:${status?.port || 1234}</p>
    </div>`;
  }

  return `
    <div class="lmstudio-status glass-card">
      <div class="status-header">
        <span class="status-icon">✅</span>
        <h3>LM Studio Connected</h3>
      </div>
      <div class="status-details">
        <div class="detail-item">
          <span class="detail-label">Host</span>
          <span class="detail-value">${status.host}:${status.port}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Models Loaded</span>
          <span class="detail-value">${status.models?.length || 0}</span>
        </div>
        ${status.version ? `
        <div class="detail-item">
          <span class="detail-label">Version</span>
          <span class="detail-value">${status.version}</span>
        </div>
        ` : ''}
      </div>
    </div>
  `;
}

/**
 * Render LM Studio models list
 * @param {Object} models - Models data
 * @returns {string} HTML
 */
export function renderLMStudioModels(models) {
  if (!models || !models.data || models.data.length === 0) {
    return `<div class="empty-state">
      <span class="empty-icon">🤖</span>
      <h3>No Models Loaded</h3>
      <p>Load a model in LM Studio to use it here.</p>
    </div>`;
  }

  return `
    <div class="models-grid">
      ${models.data.map(model => {
        const id = model.id || 'unknown';
        const isActive = model.active || false;
        return `
          <div class="model-card glass-card ${isActive ? 'active' : ''}">
            <div class="model-header">
              <span class="model-icon">🤖</span>
              <h3 class="model-name">${id}</h3>
              ${isActive ? '<span class="badge success">Active</span>' : ''}
            </div>
            <div class="model-details">
              ${model.context_length ? `
              <div class="detail-item">
                <span class="detail-label">Context</span>
                <span class="detail-value">${model.context_length.toLocaleString()} tokens</span>
              </div>
              ` : ''}
              ${model.quantization ? `
              <div class="detail-item">
                <span class="detail-label">Quantization</span>
                <span class="detail-value">${model.quantization}</span>
              </div>
              ` : ''}
              ${model.size ? `
              <div class="detail-item">
                <span class="detail-label">Size</span>
                <span class="detail-value">${(model.size / (1024 * 1024 * 1024)).toFixed(2)} GB</span>
              </div>
              ` : ''}
            </div>
            <div class="model-actions">
              ${!isActive ? `
              <button class="btn btn-small btn-outline" onclick="window.Dashboard.loadLMStudioModel('${id}')">
                Load
              </button>
              ` : `
              <button class="btn btn-small btn-outline" onclick="window.Dashboard.unloadLMStudioModel('${id}')">
                Unload
              </button>
              `}
              <button class="btn btn-small btn-primary" onclick="window.Dashboard.chatWithModel('${id}')">
                Chat
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * Render model router suggestions
 * @param {Object} suggestions - Suggestions data
 * @returns {string} HTML
 */
export function renderModelSuggestions(suggestions) {
  if (!suggestions || !suggestions.suggestions || suggestions.suggestions.length === 0) {
    return `<div class="empty-state">
      <span class="empty-icon">💡</span>
      <h3>No Suggestions</h3>
      <p>Unable to suggest models for this task type.</p>
    </div>`;
  }

  return `
    <div class="suggestions-panel glass-card">
      <h3>Model Suggestions for "${suggestions.taskType}"</h3>
      <div class="suggestions-list">
        ${suggestions.suggestions.map((model, index) => `
          <div class="suggestion-item ${index === 0 ? 'primary' : ''}">
            <div class="suggestion-rank">#${index + 1}</div>
            <div class="suggestion-details">
              <h4 class="suggestion-model">${model.id}</h4>
              <p class="suggestion-reason">${model.reason || 'Recommended for this task'}</p>
              <div class="suggestion-scores">
                ${model.score ? `<span class="score-badge">Score: ${model.score}/100</span>` : ''}
                ${model.speed ? `<span class="score-badge">Speed: ${model.speed} tok/s</span>` : ''}
              </div>
            </div>
            <button class="btn btn-small ${index === 0 ? 'btn-primary' : 'btn-outline'}" onclick="window.Dashboard.chatWithModel('${model.id}')">
              Use This
            </button>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Render chat completion result
 * @param {Object} completion - Completion data
 * @returns {string} HTML
 */
export function renderChatCompletion(completion) {
  if (!completion || !completion.choices || completion.choices.length === 0) {
    return `<div class="empty-state">
      <span class="empty-icon">❌</span>
      <h3>No Response</h3>
      <p>Failed to generate completion.</p>
    </div>`;
  }

  const message = completion.choices[0].message;
  const usage = completion.usage || {};

  return `
    <div class="completion-result glass-card">
      <div class="completion-header">
        <h3>AI Response</h3>
        <span class="completion-model">${completion.model || 'unknown'}</span>
      </div>
      <div class="completion-message">
        <p>${message.content}</p>
      </div>
      ${usage.total_tokens ? `
      <div class="completion-usage">
        <span>Tokens: ${usage.prompt_tokens || 0} prompt + ${usage.completion_tokens || 0} completion = ${usage.total_tokens}</span>
      </div>
      ` : ''}
    </div>
  `;
}

/**
 * Initialize LM Studio dashboard
 */
export function initLMStudioDashboard() {
  console.log('✅ LM Studio dashboard initialized');
}
