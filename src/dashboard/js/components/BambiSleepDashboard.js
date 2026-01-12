/**
 * BambiSleep™ Church MCP Control Tower
 * BambiSleep Chat Dashboard Component
 */


/**
 * Render BambiSleep triggers
 * @param {Object} triggers - Triggers data
 * @returns {string} HTML
 */
export function renderBambiSleepTriggers(triggers) {
  if (!triggers || !triggers.triggers || triggers.triggers.length === 0) {
    return `<div class="empty-state">
      <span class="empty-icon">⚡</span>
      <h3>No Triggers</h3>
      <p>No chat triggers configured.</p>
    </div>`;
  }

  return `
    <div class="triggers-grid">
      ${triggers.triggers.map(trigger => `
        <div class="trigger-card glass-card" data-trigger-id="${trigger.id}">
          <div class="trigger-header">
            <span class="trigger-icon">${trigger.icon || '⚡'}</span>
            <h3 class="trigger-name">${trigger.name || 'Unknown Trigger'}</h3>
            <span class="trigger-category badge">${trigger.category || 'general'}</span>
          </div>
          <p class="trigger-description">${trigger.description || 'No description'}</p>
          <div class="trigger-actions">
            <button class="btn btn-small btn-outline" onclick="window.Dashboard.viewTrigger('${trigger.id}')">
              Info
            </button>
            <button class="btn btn-small btn-primary" onclick="window.Dashboard.activateTrigger('${trigger.id}')">
              Activate
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Render BambiSleep spirals
 * @param {Object} spirals - Spirals data
 * @returns {string} HTML
 */
export function renderBambiSleepSpirals(spirals) {
  if (!spirals || !spirals.spirals || spirals.spirals.length === 0) {
    return `<div class="empty-state">
      <span class="empty-icon">🌀</span>
      <h3>No Spirals</h3>
      <p>No spiral types available.</p>
    </div>`;
  }

  return `
    <div class="spirals-grid">
      ${spirals.spirals.map(spiral => `
        <div class="spiral-card glass-card" data-spiral-type="${spiral.type}">
          <div class="spiral-header">
            <span class="spiral-icon">🌀</span>
            <h3 class="spiral-name">${spiral.name || spiral.type}</h3>
          </div>
          <p class="spiral-description">${spiral.description || 'Hypnotic spiral pattern'}</p>
          <div class="spiral-properties">
            ${spiral.duration ? `<span class="property">Duration: ${spiral.duration}s</span>` : ''}
            ${spiral.intensity ? `<span class="property">Intensity: ${spiral.intensity}</span>` : ''}
            ${spiral.color ? `<span class="property" style="background: ${spiral.color}">Color: ${spiral.color}</span>` : ''}
          </div>
          <div class="spiral-actions">
            <button class="btn btn-small btn-primary" onclick="window.Dashboard.startSpiral('${spiral.type}')">
              Start Spiral
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Render BambiSleep voices
 * @param {Object} voices - Voices data
 * @returns {string} HTML
 */
export function renderBambiSleepVoices(voices) {
  if (!voices || (!voices.kokoro && !voices.webSpeech)) {
    return `<div class="empty-state">
      <span class="empty-icon">🎤</span>
      <h3>No Voices</h3>
      <p>No TTS voices available.</p>
    </div>`;
  }

  return `
    <div class="voices-panel glass-card">
      ${voices.kokoro && voices.kokoro.length > 0 ? `
      <div class="voices-section">
        <h3>Kokoro Neural TTS (Primary)</h3>
        <div class="voices-grid">
          ${voices.kokoro.map(voice => `
            <div class="voice-card" data-voice-id="${voice.id}">
              <div class="voice-name">${voice.name}</div>
              <div class="voice-quality badge">${voice.quality}</div>
              <button class="btn btn-small btn-outline" onclick="window.Dashboard.testVoice('${voice.id}')">
                Test
              </button>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}
      ${voices.webSpeech && voices.webSpeech.length > 0 ? `
      <div class="voices-section">
        <h3>Web Speech API (Fallback)</h3>
        <div class="voices-list">
          ${voices.webSpeech.slice(0, 10).map(voice => `
            <div class="voice-item">
              <span class="voice-name">${voice.name}</span>
              <span class="voice-lang badge">${voice.lang}</span>
            </div>
          `).join('')}
          ${voices.webSpeech.length > 10 ? `<div class="voice-item">...and ${voices.webSpeech.length - 10} more</div>` : ''}
        </div>
      </div>
      ` : ''}
    </div>
  `;
}

/**
 * Render BambiSleep status
 * @param {Object} status - Status data
 * @returns {string} HTML
 */
export function renderBambiSleepStatus(status) {
  if (!status) {
    return `<div class="empty-state">
      <span class="empty-icon">❌</span>
      <h3>Status Unavailable</h3>
      <p>Unable to fetch BambiSleep status.</p>
    </div>`;
  }

  return `
    <div class="bambisleep-status glass-card">
      <div class="status-header">
        <h3>BambiSleep Chat Status</h3>
        <span class="status-badge ${status.active ? 'success' : 'secondary'}">
          ${status.active ? 'Active' : 'Inactive'}
        </span>
      </div>
      <div class="status-details">
        ${status.kokoroAvailable !== undefined ? `
        <div class="detail-item">
          <span class="detail-label">Kokoro TTS</span>
          <span class="detail-value ${status.kokoroAvailable ? 'success' : 'error'}">
            ${status.kokoroAvailable ? '✅ Available' : '❌ Unavailable'}
          </span>
        </div>
        ` : ''}
        ${status.currentVoice ? `
        <div class="detail-item">
          <span class="detail-label">Current Voice</span>
          <span class="detail-value">${status.currentVoice}</span>
        </div>
        ` : ''}
        ${status.avatarExpression ? `
        <div class="detail-item">
          <span class="detail-label">Avatar Expression</span>
          <span class="detail-value">${status.avatarExpression}</span>
        </div>
        ` : ''}
        ${status.activeTriggers !== undefined ? `
        <div class="detail-item">
          <span class="detail-label">Active Triggers</span>
          <span class="detail-value">${status.activeTriggers}</span>
        </div>
        ` : ''}
      </div>
    </div>
  `;
}

/**
 * Initialize BambiSleep dashboard
 */
export function initBambiSleepDashboard() {
  console.log('✅ BambiSleep dashboard initialized');
}
