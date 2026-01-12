/**
 * BambiSleep™ Church MCP Control Tower
 * Avatar Controller Component - Integrates WebGL Avatar + Speech
 */

import WebGLAvatar from '../avatar-webgl.js';
import { createSpeechController, VOICE_PRESETS } from '../speech.js';

/**
 * Render avatar control panel
 * @returns {string} HTML string
 */
export function renderAvatarPanel() {
  return `
    <div class="glass-card avatar-panel">
      <div class="avatar-header">
        <h2 class="avatar-title">
          <span class="avatar-icon">🌸</span>
          Bambi Avatar
        </h2>
        <div class="avatar-controls">
          <select id="avatar-theme" class="avatar-select" title="Theme">
            <option value="neon">🌙 Neon</option>
            <option value="inverted">☀️ Light</option>
          </select>
          <select id="voice-preset" class="avatar-select" title="Voice Preset (15 options)">
            ${Object.entries(VOICE_PRESETS).map(([key, preset]) => `
              <option value="${key}">${preset.emoji} ${preset.name}</option>
            `).join('')}
          </select>
          <button id="kokoro-check" class="btn btn-sm" title="Check Kokoro TTS status">
            🎤 Check
          </button>
          <button id="avatar-toggle" class="btn btn-sm" title="Toggle avatar">
            ▶️
          </button>
        </div>
      </div>
      
      <div class="avatar-container">
        <canvas id="avatar-canvas" class="avatar-canvas" width="400" height="400"></canvas>
        <div class="avatar-status" id="avatar-status">Click ▶️ to start</div>
        <div class="kokoro-status" id="kokoro-status" style="margin-top: 0.5rem; font-size: 0.85rem; opacity: 0.9; padding: 0.5rem; border-radius: 0.5rem; background: rgba(0,0,0,0.2);">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span class="status-indicator" style="width: 8px; height: 8px; border-radius: 50%; background: var(--color-warning); animation: pulse 2s infinite;"></span>
            <span>Checking Kokoro TTS...</span>
          </div>
        </div>
      </div>
      
      <div class="avatar-expressions">
        <h3 class="expressions-title">🎭 Expressions</h3>
        <div class="expression-buttons">
          <button class="btn btn-outline btn-sm" data-expression="happy">😊 Happy</button>
          <button class="btn btn-outline btn-sm" data-expression="sleepy">😴 Sleepy</button>
          <button class="btn btn-outline btn-sm" data-expression="alert">👀 Alert</button>
          <button class="btn btn-outline btn-sm" data-expression="reset">😐 Reset</button>
          <button class="btn btn-outline btn-sm" data-expression="confused">😕 Confused</button>
          <button class="btn btn-outline btn-sm" data-expression="comfort">🤗 Comfort</button>
          <button class="btn btn-outline btn-sm" data-expression="giggle">😄 Giggle</button>
        </div>
      </div>
      
      <div class="avatar-test">
        <h3 class="test-title">🔊 Test Speech</h3>
        <div class="preset-info" id="preset-info" style="margin-bottom: 0.5rem; font-size: 0.85rem; opacity: 0.8; padding: 0.5rem; background: rgba(255,255,255,0.05); border-radius: 0.25rem;">
          <strong>Current:</strong> 🌸 Bambi | Voice: af_bella | Speed: 0.95x
        </div>
        <div class="test-controls">
          <input 
            type="text" 
            id="test-speech-input" 
            class="test-input" 
            placeholder="Enter text to speak... (500 char limit)"
            value="Hello! I'm Bambi, your helpful AI assistant!"
            maxlength="500"
          />
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <button id="test-speech-btn" class="btn btn-primary">🔊 Speak</button>
            <button id="stop-speech-btn" class="btn btn-outline">⏹️ Stop</button>
            <span id="char-count" style="font-size: 0.85rem; opacity: 0.7; margin-left: auto;">44/500</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Avatar Controller
 * Manages avatar and speech integration
 */
export class AvatarController {
  #avatar = null;
  #speech = null;
  #canvas = null;
  #isRunning = false;

  constructor() {
    // Will be initialized in init()
  }

  /**
   * Initialize avatar system
   */
  async init() {
    this.#canvas = document.getElementById('avatar-canvas');
    if (!this.#canvas) {
      console.warn('Avatar canvas not found');
      return;
    }

    try {
      // Initialize WebGL avatar
      this.#avatar = new WebGLAvatar(this.#canvas);

      // Initialize speech with lip sync
      this.#speech = createSpeechController({
        preset: 'bambi',
        onLipSync: (mouthOpen) => {
          if (this.#avatar) {
            this.#avatar.setMouthOpen(mouthOpen);
          }
        },
      });

      this.#setupEventListeners();
      this.#updateStatus('Ready');
      
      // Update Kokoro status after initialization
      setTimeout(() => this.#updateKokoroStatus(), 1000);
      
      console.log('Avatar system initialized');
    } catch (error) {
      console.error('Failed to initialize avatar:', error);
      this.#updateStatus('Error: ' + error.message);
    }
  }

  /**
   * Update Kokoro status display
   * @private
   */
  #updateKokoroStatus() {
    const statusEl = document.getElementById('kokoro-status');
    if (!statusEl || !this.#speech) return;

    const status = this.#speech.getStatus();
    
    console.log('🎤 Speech System Status:', status);
    
    const indicatorColor = status.kokoroAvailable ? 'var(--color-success)' : 'var(--color-warning)';
    const statusText = status.kokoroAvailable ? 'ONLINE' : 'OFFLINE';
    const textColor = status.kokoroAvailable ? 'var(--color-success)' : 'var(--color-warning)';
    
    if (status.kokoroAvailable) {
      statusEl.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span class="status-indicator" style="width: 8px; height: 8px; border-radius: 50%; background: ${indicatorColor};"></span>
          <span style="color: ${textColor};">🌸 Kokoro TTS: <strong>${statusText}</strong></span>
        </div>
        <div style="font-size: 0.75rem; opacity: 0.7; margin-top: 0.25rem; margin-left: 1.25rem;">
          ${status.kokoroUrl} | Voice: ${status.currentPresetDetails.kokoroVoice} | Speed: ${status.currentPresetDetails.speed}x
        </div>
      `;
    } else {
      const webSpeechStatus = status.webSpeechAvailable ? 'Available' : 'Unavailable';
      statusEl.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span class="status-indicator" style="width: 8px; height: 8px; border-radius: 50%; background: ${indicatorColor}; animation: pulse 2s infinite;"></span>
          <span style="color: ${textColor};">⚠️ Kokoro TTS: <strong>${statusText}</strong></span>
        </div>
        <div style="font-size: 0.75rem; opacity: 0.7; margin-top: 0.25rem; margin-left: 1.25rem;">
          Fallback: Web Speech API (${webSpeechStatus}) | Voice: ${status.webSpeechVoice}
        </div>
      `;
    }
  }

  /**
   * Update preset info display
   * @private
   */
  #updatePresetInfo(presetName) {
    const infoEl = document.getElementById('preset-info');
    if (!infoEl) return;

    const preset = VOICE_PRESETS[presetName];
    if (preset) {
      infoEl.innerHTML = `
        <strong>Current:</strong> ${preset.emoji} ${preset.name} | 
        Voice: ${preset.kokoroVoice} | 
        Speed: ${preset.speed}x | 
        ${preset.description}
      `;
    }
  }

  /**
   * Setup event listeners
   * @private
   */
  #setupEventListeners() {
    // Toggle button
    const toggleBtn = document.getElementById('avatar-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggle());
    }

    // Kokoro check button
    const kokoroBtn = document.getElementById('kokoro-check');
    if (kokoroBtn) {
      kokoroBtn.addEventListener('click', async () => {
        kokoroBtn.disabled = true;
        kokoroBtn.textContent = '⏳';
        
        if (this.#speech) {
          await this.#speech.recheckKokoro();
          this.#updateKokoroStatus();
        }
        
        kokoroBtn.disabled = false;
        kokoroBtn.textContent = '🎤';
      });
    }

    // Theme select
    const themeSelect = document.getElementById('avatar-theme');
    if (themeSelect) {
      themeSelect.addEventListener('change', (e) => {
        if (this.#avatar) {
          this.#avatar.setTheme(e.target.value);
        }
      });
    }

    // Voice preset select
    const voiceSelect = document.getElementById('voice-preset');
    if (voiceSelect) {
      voiceSelect.addEventListener('change', (e) => {
        if (this.#speech) {
          this.#speech.setPreset(e.target.value);
          this.#updatePresetInfo(e.target.value);
        }
      });
    }

    // Expression buttons
    const expressionButtons = document.querySelectorAll('[data-expression]');
    expressionButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const expression = e.target.dataset.expression;
        this.setExpression(expression);
      });
    });

    // Test speech button
    const testSpeechBtn = document.getElementById('test-speech-btn');
    const testSpeechInput = document.getElementById('test-speech-input');
    if (testSpeechBtn && testSpeechInput) {
      // Character counter
      const updateCharCount = () => {
        const charCount = document.getElementById('char-count');
        if (charCount) {
          const length = testSpeechInput.value.length;
          charCount.textContent = `${length}/500`;
          charCount.style.color = length > 450 ? 'var(--color-warning)' : 'inherit';
        }
      };
      
      testSpeechInput.addEventListener('input', updateCharCount);
      updateCharCount(); // Initial count
      
      testSpeechBtn.addEventListener('click', async () => {
        const text = testSpeechInput.value.trim();
        if (text) {
          await this.speak(text);
        }
      });

      // Enter key to speak
      testSpeechInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
          const text = testSpeechInput.value.trim();
          if (text) {
            await this.speak(text);
          }
        }
      });
    }

    // Stop speech button
    const stopSpeechBtn = document.getElementById('stop-speech-btn');
    if (stopSpeechBtn) {
      stopSpeechBtn.addEventListener('click', () => {
        this.stopSpeaking();
      });
    }
  }

  /**
   * Toggle avatar rendering
   */
  toggle() {
    if (this.#isRunning) {
      this.stop();
    } else {
      this.start();
    }
  }

  /**
   * Start avatar rendering
   */
  start() {
    if (!this.#avatar) {
      console.warn('Avatar not initialized');
      return;
    }

    this.#avatar.start();
    this.#isRunning = true;
    this.#updateStatus('Running');
    
    const toggleBtn = document.getElementById('avatar-toggle');
    if (toggleBtn) {
      toggleBtn.textContent = '⏸️';
      toggleBtn.title = 'Pause avatar';
    }
  }

  /**
   * Stop avatar rendering
   */
  stop() {
    if (!this.#avatar) return;

    this.#avatar.stop();
    this.#isRunning = false;
    this.#updateStatus('Paused');
    
    const toggleBtn = document.getElementById('avatar-toggle');
    if (toggleBtn) {
      toggleBtn.textContent = '▶️';
      toggleBtn.title = 'Start avatar';
    }
  }

  /**
   * Set avatar expression
   * @param {string} expression - Expression name
   */
  setExpression(expression) {
    if (!this.#avatar) return;

    switch (expression) {
      case 'happy':
        this.#avatar.happy();
        break;
      case 'sleepy':
        this.#avatar.sleepy();
        break;
      case 'alert':
        this.#avatar.alert();
        break;
      case 'reset':
        this.#avatar.reset();
        break;
      case 'confused':
        this.#avatar.confused();
        break;
      case 'comfort':
        this.#avatar.comfort();
        break;
      case 'giggle':
        this.#avatar.giggle();
        break;
    }
  }

  /**
   * Speak text with lip sync
   * @param {string} text - Text to speak
   * @param {Object} options - Speech options
   */
  async speak(text, options = {}) {
    if (!this.#speech) {
      console.warn('Speech not initialized');
      return;
    }

    // Start avatar if not running
    if (!this.#isRunning) {
      this.start();
    }

    // Set happy expression while speaking
    if (this.#avatar) {
      this.#avatar.setExpression(0.5);
    }

    this.#updateStatus('Speaking...');

    try {
      await this.#speech.speak(text, options);
      this.#updateStatus('Ready');
      
      // Reset expression after speaking
      if (this.#avatar) {
        this.#avatar.setExpression(0.0);
      }
    } catch (error) {
      console.error('Speech error:', error);
      this.#updateStatus('Error: ' + error.message);
    }
  }

  /**
   * Stop speaking
   */
  stopSpeaking() {
    if (this.#speech) {
      this.#speech.stop();
      this.#updateStatus('Stopped');
    }
    
    if (this.#avatar) {
      this.#avatar.setMouthOpen(0);
      this.#avatar.setExpression(0);
    }
  }

  /**
   * Update status text
   * @private
   */
  #updateStatus(status) {
    const statusEl = document.getElementById('avatar-status');
    if (statusEl) {
      statusEl.textContent = status;
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.#avatar) {
      this.#avatar.destroy();
      this.#avatar = null;
    }
    
    if (this.#speech) {
      this.#speech.stop();
      this.#speech = null;
    }
    
    this.#isRunning = false;
  }
}

/**
 * Initialize avatar controller
 * @returns {AvatarController}
 */
export async function initAvatarController() {
  const controller = new AvatarController();
  await controller.init();
  return controller;
}

export default AvatarController;
