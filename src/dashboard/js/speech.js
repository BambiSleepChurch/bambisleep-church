/**
 * BambiSleep™ Church MCP Control Tower
 * Speech Synthesis System - Kokoro TTS Integration with Lip Sync
 * 
 * Features:
 * - Kokoro-FastAPI integration (192.168.0.122:8880)
 * - High-quality neural TTS voices
 * - Phoneme-based lip sync callbacks
 * - Voice presets with Kokoro voices
 * - Queue management with interrupt support
 * - Fallback to Web Speech API
 */

/**
 * Kokoro voice configurations
 * All female voices from Kokoro-FastAPI
 */
export const KOKORO_VOICES = {
  af_alloy: { name: 'Alloy', quality: 'balanced' },
  af_aoede: { name: 'Aoede', quality: 'warm' },
  af_bella: { name: 'Bella', quality: 'bright' },
  af_heart: { name: 'Heart', quality: 'gentle' },
  af_jadzia: { name: 'Jadzia', quality: 'confident' },
  af_jessica: { name: 'Jessica', quality: 'natural' },
  af_kore: { name: 'Kore', quality: 'clear' },
  af_nicole: { name: 'Nicole', quality: 'smooth' },
  af_nova: { name: 'Nova', quality: 'energetic' },
  af_river: { name: 'River', quality: 'calm' },
  af_sarah: { name: 'Sarah', quality: 'professional' },
  af_sky: { name: 'Sky', quality: 'airy' },
};

/**
 * Voice preset configurations (Enhanced)
 */
export const VOICE_PRESETS = {
  bambi: {
    name: 'Bambi',
    emoji: '🌸',
    description: 'Bubbly, cheerful, and slightly breathy',
    kokoroVoice: 'af_bella',  // Bright, cheerful voice
    speed: 0.95,
    volume: 1.0,
    // Web Speech API fallback
    rate: 1.05,
    pitch: 1.2,
  },
  gentle: {
    name: 'Gentle',
    emoji: '💕',
    description: 'Warm and soothing companion',
    kokoroVoice: 'af_heart',  // Gentle, caring
    speed: 0.92,
    volume: 0.95,
    rate: 0.98,
    pitch: 1.15,
  },
  confident: {
    name: 'Confident',
    emoji: '💪',
    description: 'Strong and assured presence',
    kokoroVoice: 'af_jadzia',  // Confident, assertive
    speed: 1.0,
    volume: 1.0,
    rate: 1.0,
    pitch: 1.0,
  },
  professional: {
    name: 'Professional',
    emoji: '💼',
    description: 'Clear and articulate speaker',
    kokoroVoice: 'af_sarah',  // Professional, polished
    speed: 0.98,
    volume: 1.0,
    rate: 1.0,
    pitch: 1.05,
  },
  energetic: {
    name: 'Energetic',
    emoji: '⚡',
    description: 'Vibrant and lively personality',
    kokoroVoice: 'af_nova',  // Energetic, dynamic
    speed: 1.05,
    volume: 1.0,
    rate: 1.1,
    pitch: 1.25,
  },
  calm: {
    name: 'Calm',
    emoji: '🌊',
    description: 'Peaceful and relaxing tone',
    kokoroVoice: 'af_river',  // Calm, flowing
    speed: 0.88,
    volume: 0.9,
    rate: 0.9,
    pitch: 1.0,
  },
  airy: {
    name: 'Airy',
    emoji: '☁️',
    description: 'Light and ethereal quality',
    kokoroVoice: 'af_sky',  // Airy, soft
    speed: 0.90,
    volume: 0.85,
    rate: 0.92,
    pitch: 1.18,
  },
  natural: {
    name: 'Natural',
    emoji: '👩',
    description: 'Authentic conversational style',
    kokoroVoice: 'af_jessica',  // Natural, realistic
    speed: 1.0,
    volume: 1.0,
    rate: 1.0,
    pitch: 1.08,
  },
  clear: {
    name: 'Clear',
    emoji: '🔊',
    description: 'Crisp and precise articulation',
    kokoroVoice: 'af_kore',  // Clear, articulate
    speed: 0.95,
    volume: 1.0,
    rate: 0.95,
    pitch: 1.1,
  },
  smooth: {
    name: 'Smooth',
    emoji: '🎵',
    description: 'Silky and melodious delivery',
    kokoroVoice: 'af_nicole',  // Smooth, pleasant
    speed: 0.93,
    volume: 0.98,
    rate: 0.95,
    pitch: 1.12,
  },
  balanced: {
    name: 'Balanced',
    emoji: '⚖️',
    description: 'Neutral and well-rounded',
    kokoroVoice: 'af_alloy',  // Balanced, versatile
    speed: 0.98,
    volume: 1.0,
    rate: 1.0,
    pitch: 1.05,
  },
  warm: {
    name: 'Warm',
    emoji: '🔥',
    description: 'Rich and inviting timbre',
    kokoroVoice: 'af_aoede',  // Warm, welcoming
    speed: 0.94,
    volume: 1.0,
    rate: 0.97,
    pitch: 1.08,
  },
  whisper: {
    name: 'Whisper',
    emoji: '🌙',
    description: 'Soft and intimate',
    kokoroVoice: 'af_sky',  // Soft, quiet
    speed: 0.85,
    volume: 0.7,
    rate: 0.85,
    pitch: 0.95,
  },
  machine: {
    name: 'Machine',
    emoji: '🤖',
    description: 'Synthetic and robotic',
    kokoroVoice: 'af_kore',  // Mechanical precision
    speed: 0.9,
    volume: 1.0,
    rate: 0.95,
    pitch: 0.85,
  },
  robot: {
    name: 'Robot',
    emoji: '🔧',
    description: 'Deep mechanical voice',
    kokoroVoice: 'af_alloy',  // Robotic neutral
    speed: 0.8,
    volume: 0.9,
    rate: 0.8,
    pitch: 0.7,
  },
};

/**
 * Speech Controller
 * Manages text-to-speech with Kokoro TTS and lip sync
 */
export class SpeechController {
  #synth;
  #currentUtterance = null;
  #queue = [];
  #isProcessing = false;
  #currentPreset = 'bambi';
  #lipSyncCallback = null;
  #lipSyncInterval = null;
  #preferredVoices = ['Zira', 'Samantha', 'female', 'woman'];
  #selectedVoice = null;
  #currentAudio = null;
  #currentAudioUrl = null;
  #kokoroUrl = 'http://192.168.0.122:8880';
  #useKokoro = true;
  #kokoroHealthy = false;

  constructor(options = {}) {
    this.#synth = window.speechSynthesis;
    this.#currentPreset = options.preset || 'bambi';
    this.#lipSyncCallback = options.onLipSync || null;
    this.#kokoroUrl = options.kokoroUrl || 'http://192.168.0.122:8880';
    this.#useKokoro = options.useKokoro !== false;

    // Wait for voices to load (Web Speech fallback)
    if (this.#synth.onvoiceschanged !== undefined) {
      this.#synth.onvoiceschanged = () => this.#selectVoice();
    }
    this.#selectVoice();

    // Check Kokoro health
    this.#checkKokoroHealth();
  }

  /**
   * Check if Kokoro TTS server is healthy
   * @private
   * @param {number} retries - Number of retry attempts
   */
  async #checkKokoroHealth(retries = 2) {
    if (!this.#useKokoro) {
      this.#kokoroHealthy = false;
      console.log('🔇 Kokoro TTS disabled, using Web Speech API');
      return;
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        console.log(`🔍 Checking Kokoro health (attempt ${attempt}/${retries}): ${this.#kokoroUrl}`);

        const response = await fetch(`${this.#kokoroUrl}/health`, {
          method: 'GET',
          signal: controller.signal,
          headers: { 'Accept': 'application/json' },
        });

        clearTimeout(timeoutId);
        this.#kokoroHealthy = response.ok;
        
        if (this.#kokoroHealthy) {
          const data = await response.json().catch(() => ({}));
          console.log('🌸 Kokoro TTS server ONLINE:', {
            url: this.#kokoroUrl,
            status: response.status,
            version: data.version || 'unknown',
            voices: Object.keys(KOKORO_VOICES).length,
          });
          return;
        } else {
          console.warn(`⚠️ Kokoro TTS server returned ${response.status}`);
        }
      } catch (error) {
        const errorType = error.name === 'AbortError' ? 'timeout' : error.message;
        console.warn(`⚠️ Kokoro health check failed (${attempt}/${retries}):`, errorType);
        
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
        }
      }
    }

    // All attempts failed
    this.#kokoroHealthy = false;
    console.error(`❌ Kokoro TTS server OFFLINE after ${retries} attempts`);
    console.warn('🔄 Falling back to Web Speech API');
  }

  /**
   * Generate speech using Kokoro TTS
   * @private
   */
  async #speakWithKokoro(text, options = {}) {
    const preset = VOICE_PRESETS[options.preset || this.#currentPreset];
    const voice = options.voice || preset.kokoroVoice || 'af_bella';
    const speed = options.speed ?? preset.speed ?? 1.0;
    const format = options.format || 'mp3';

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const requestBody = {
        model: 'kokoro',
        voice: voice,
        input: text.slice(0, 500), // Limit text length
        response_format: format,
        speed: speed,
      };

      console.log(`🎤 Kokoro TTS Request:`, {
        url: `${this.#kokoroUrl}/v1/audio/speech`,
        voice,
        speed,
        textLength: text.length,
        format,
      });

      const startTime = Date.now();

      const response = await fetch(`${this.#kokoroUrl}/v1/audio/speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg, audio/wav, application/json',
          'Connection': 'keep-alive',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorText = `HTTP ${response.status}`;
        
        if (contentType?.includes('json')) {
          const errorData = await response.json().catch(() => ({}));
          errorText = errorData.message || errorData.error || errorText;
        } else {
          errorText = await response.text().catch(() => errorText);
        }
        
        throw new Error(`Kokoro API error ${response.status}: ${errorText}`);
      }

      // Get audio data as blob
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      console.log(`✅ Kokoro TTS success:`, {
        size: `${(audioBlob.size / 1024).toFixed(1)} KB`,
        type: audioBlob.type,
        duration: `${responseTime}ms`,
      });

      return audioUrl;
    } catch (error) {
      const errorType = error.name === 'AbortError' ? 'Request timeout (30s)' : error.message;
      console.error('❌ Kokoro TTS error:', errorType);
      throw error;
    }
  }

  /**
   * Play audio with lip sync
   * @private
   */
  async #playAudio(audioUrl, text) {
    return new Promise((resolve, reject) => {
      // Cleanup previous audio
      if (this.#currentAudio) {
        this.#currentAudio.pause();
        this.#currentAudio.src = '';
      }
      if (this.#currentAudioUrl) {
        URL.revokeObjectURL(this.#currentAudioUrl);
      }

      // Create new audio element
      const audio = new Audio(audioUrl);
      this.#currentAudio = audio;
      this.#currentAudioUrl = audioUrl;

      // Set volume
      const preset = VOICE_PRESETS[this.#currentPreset];
      audio.volume = preset.volume ?? 1.0;

      // Setup event handlers
      audio.onloadedmetadata = () => {
        console.log(`🎤 Audio loaded, duration: ${audio.duration}s`);
        this.#startLipSync(text, audio.duration);
        audio.play().catch(reject);
      };

      audio.onended = () => {
        this.#stopLipSync();
        URL.revokeObjectURL(audioUrl);
        this.#currentAudioUrl = null;
        resolve();
      };

      audio.onerror = (event) => {
        this.#stopLipSync();
        URL.revokeObjectURL(audioUrl);
        this.#currentAudioUrl = null;
        reject(new Error(`Audio playback error: ${event.message || 'Unknown error'}`));
      };
    });
  }

  /**
   * Select preferred female voice
   * @private
   */
  #selectVoice() {
    const voices = this.#synth.getVoices();
    
    // Try preferred voices in order
    for (const preferred of this.#preferredVoices) {
      const voice = voices.find(v => 
        v.name.includes(preferred) || v.lang.includes('en')
      );
      if (voice) {
        this.#selectedVoice = voice;
        return;
      }
    }

    // Fallback to first available voice
    this.#selectedVoice = voices[0] || null;
  }

  /**
   * Speak text with current preset
   * @param {string} text - Text to speak
   * @param {Object} options - Override options
   * @returns {Promise<void>}
   */
  async speak(text, options = {}) {
    if (!text || text.trim().length === 0) {
      return Promise.resolve();
    }

    // Add to queue
    this.#queue.push({ text, options });

    // Process queue if not already processing
    if (!this.#isProcessing) {
      await this.#processQueue();
    }
  }

  /**
   * Process speech queue
   * @private
   */
  async #processQueue() {
    if (this.#queue.length === 0) {
      this.#isProcessing = false;
      return;
    }

    this.#isProcessing = true;

    while (this.#queue.length > 0) {
      const { text, options } = this.#queue.shift();

      try {
        await this.#speakItem(text, options);
      } catch (error) {
        console.error('Speech error:', error);
      }
    }

    this.#isProcessing = false;
  }

  /**
   * Speak using Kokoro or fallback to Web Speech
   * @private
   */
  async #speakItem(text, options = {}) {
    const useKokoro = this.#kokoroHealthy && this.#useKokoro;

    if (useKokoro) {
      try {
        // Try Kokoro TTS
        const audioUrl = await this.#speakWithKokoro(text, options);
        await this.#playAudio(audioUrl, text);
        return true;
      } catch (error) {
        console.warn('🎤 Kokoro failed, falling back to Web Speech:', error.message);
        // Mark unhealthy and fall through to Web Speech
        this.#kokoroHealthy = false;
      }
    }

    // Fallback to Web Speech API
    return this.#speakWithWebSpeech(text, options);
  }

  /**
   * Speak using Web Speech API (fallback)
   * @private
   */
  async #speakWithWebSpeech(text, options = {}) {
    return new Promise((resolve, reject) => {
      const preset = VOICE_PRESETS[options.preset || this.#currentPreset];
      const utterance = new SpeechSynthesisUtterance(text);

      // Apply preset
      utterance.rate = options.rate ?? preset.rate ?? 1.0;
      utterance.pitch = options.pitch ?? preset.pitch ?? 1.0;
      utterance.volume = options.volume ?? preset.volume ?? 1.0;

      // Set voice if available
      if (this.#selectedVoice) {
        utterance.voice = this.#selectedVoice;
      }

      // Lip sync on boundary events
      utterance.onboundary = (event) => {
        if (event.name === 'word' && this.#lipSyncCallback) {
          const char = event.utterance.text[event.charIndex]?.toLowerCase();
          const mouthOpen = this.#getPhonemeValue(char);
          this.#lipSyncCallback(mouthOpen);
        }
      };

      utterance.onstart = () => {
        this.#currentUtterance = utterance;
        this.#startLipSync(text);
      };

      utterance.onend = () => {
        this.#currentUtterance = null;
        this.#stopLipSync();
        resolve();
      };

      utterance.onerror = (event) => {
        this.#currentUtterance = null;
        this.#stopLipSync();
        console.error('Web Speech error:', event);
        reject(event.error);
      };

      this.#synth.speak(utterance);
    });
  }

  /**
   * Start lip sync animation
   * @private
   */
  #startLipSync(text, duration = null) {
    if (!this.#lipSyncCallback) return;

    // Analyze phonemes for mouth movement
    const phonemes = this.#analyzePhonemes(text);
    
    // Calculate delay based on duration or use default
    const phonemeDelay = duration 
      ? (duration * 1000) / phonemes.length 
      : 100; // ms per phoneme (fallback)

    let phonemeIndex = 0;

    this.#lipSyncInterval = setInterval(() => {
      if (phonemeIndex >= phonemes.length) {
        this.#stopLipSync();
        return;
      }

      const phoneme = phonemes[phonemeIndex++];
      const mouthOpen = this.#phonemeToMouthOpen(phoneme);
      this.#lipSyncCallback(mouthOpen);
    }, phonemeDelay);
  }

  /**
   * Stop lip sync animation
   * @private
   */
  #stopLipSync() {
    if (this.#lipSyncInterval) {
      clearInterval(this.#lipSyncInterval);
      this.#lipSyncInterval = null;
    }
    if (this.#lipSyncCallback) {
      this.#lipSyncCallback(0); // Close mouth
    }
  }

  /**
   * Analyze text for phonemes (enhanced accuracy)
   * @private
   */
  #analyzePhonemes(text) {
    const words = text.toLowerCase().split(/\s+/);
    const phonemes = [];

    for (const word of words) {
      // Enhanced phoneme approximation with digraphs
      for (let i = 0; i < word.length; i++) {
        const char = word[i];
        const nextChar = word[i + 1];
        
        // Handle common digraphs
        if (char === 't' && nextChar === 'h') {
          phonemes.push('th'); // θ or ð
          i++; // Skip next char
        } else if (char === 's' && nextChar === 'h') {
          phonemes.push('sh'); // ʃ
          i++;
        } else if (char === 'c' && nextChar === 'h') {
          phonemes.push('ch'); // tʃ
          i++;
        } else if (char === 'o' && nextChar === 'o') {
          phonemes.push('oo'); // u:
          i++;
        } else if (char === 'e' && nextChar === 'e') {
          phonemes.push('ee'); // i:
          i++;
        } else if ('aeiou'.includes(char)) {
          phonemes.push(char);
        } else if ('bcdfghjklmnpqrstvwxyz'.includes(char)) {
          // Classify consonant types
          if ('bpfvm'.includes(char)) {
            phonemes.push('b'); // Bilabial (lips)
          } else if ('td'.includes(char)) {
            phonemes.push('t'); // Dental
          } else if ('kg'.includes(char)) {
            phonemes.push('k'); // Velar
          } else {
            phonemes.push('_'); // Other consonant
          }
        }
      }
      phonemes.push(' '); // Word boundary
    }

    return phonemes;
  }

  /**
   * Convert phoneme to mouth open amount (enhanced)
   * @private
   */
  #phonemeToMouthOpen(phoneme) {
    const phonemeMap = {
      // Vowels (mouth opening)
      'a': 0.85,   // Wide open (cat, bat)
      'e': 0.45,   // Medium (bed, met)
      'i': 0.25,   // Small (bit, sit)
      'o': 0.65,   // Round medium (hot, dot)
      'u': 0.55,   // Round small (put, book)
      'oo': 0.50,  // Long oo (food, mood)
      'ee': 0.30,  // Long ee (feed, seed)
      
      // Consonants (lip/mouth position)
      'b': 0.15,   // Bilabial (lips together)
      't': 0.10,   // Dental (tongue-teeth)
      'k': 0.08,   // Velar (back of throat)
      'th': 0.20,  // Interdental (tongue between teeth)
      'sh': 0.25,  // Postalveolar (rounded lips)
      'ch': 0.22,  // Affricate
      '_': 0.12,   // Generic consonant
      ' ': 0.0,    // Silence/pause
    };

    return phonemeMap[phoneme] ?? 0.15; // Default small opening
  }

  /**
   * Get phoneme value for character
   * @private
   */
  #getPhonemeValue(char) {
    const vowelMap = {
      'a': 0.8,  // Wide open
      'e': 0.4,  // Medium
      'i': 0.2,  // Small
      'o': 0.6,  // Round
      'u': 0.5,  // Round medium
    };
    return vowelMap[char] || 0.1; // Default for consonants
  }

  /**
   * Stop current speech
   */
  stop() {
    // Stop Web Speech
    this.#synth.cancel();
    
    // Stop Kokoro audio
    if (this.#currentAudio) {
      this.#currentAudio.pause();
      this.#currentAudio.src = '';
      this.#currentAudio = null;
    }
    
    if (this.#currentAudioUrl) {
      URL.revokeObjectURL(this.#currentAudioUrl);
      this.#currentAudioUrl = null;
    }

    this.#stopLipSync();
    this.#currentUtterance = null;
    this.#queue = [];
    this.#isProcessing = false;
  }

  /**
   * Pause current speech
   */
  pause() {
    // Pause Web Speech
    if (this.#synth.speaking) {
      this.#synth.pause();
    }
    
    // Pause Kokoro audio
    if (this.#currentAudio) {
      this.#currentAudio.pause();
    }
    
    this.#stopLipSync();
  }

  /**
   * Resume paused speech
   */
  resume() {
    // Resume Web Speech
    if (this.#synth.paused) {
      this.#synth.resume();
      if (this.#currentUtterance) {
        this.#startLipSync(this.#currentUtterance.text);
      }
    }
    
    // Resume Kokoro audio
    if (this.#currentAudio && this.#currentAudio.paused) {
      this.#currentAudio.play().catch(err => {
        console.error('Failed to resume audio:', err);
      });
    }
  }

  /**
   * Set voice preset
   * @param {string} presetName - Preset name (bambi, machine, robot, human, whisper)
   */
  setPreset(presetName) {
    if (VOICE_PRESETS[presetName]) {
      this.#currentPreset = presetName;
    }
  }

  /**
   * Get current preset
   * @returns {string}
   */
  getPreset() {
    return this.#currentPreset;
  }

  /**
   * Set lip sync callback
   * @param {Function} callback - Callback(mouthOpen: number)
   */
  setLipSyncCallback(callback) {
    this.#lipSyncCallback = callback;
  }

  /**
   * Check if Kokoro is available
   * @returns {boolean}
   */
  isKokoroAvailable() {
    return this.#kokoroHealthy;
  }

  /**
   * Manually recheck Kokoro health
   * @returns {Promise<boolean>}
   */
  async recheckKokoro() {
    await this.#checkKokoroHealth();
    return this.#kokoroHealthy;
  }

  /**
   * Get status information
   * @returns {Object}
   */
  getStatus() {
    const preset = VOICE_PRESETS[this.#currentPreset];
    
    return {
      kokoroAvailable: this.#kokoroHealthy,
      kokoroUrl: this.#kokoroUrl,
      useKokoro: this.#useKokoro,
      currentPreset: this.#currentPreset,
      currentPresetDetails: {
        name: preset.name,
        emoji: preset.emoji,
        kokoroVoice: preset.kokoroVoice,
        speed: preset.speed,
      },
      isSpeaking: this.#isProcessing || this.#synth.speaking || (this.#currentAudio && !this.#currentAudio.paused),
      queueLength: this.#queue.length,
      webSpeechVoice: this.#selectedVoice?.name || 'None',
      webSpeechAvailable: this.#synth.getVoices().length > 0,
      audioElement: this.#currentAudio ? 'active' : 'none',
    };
  }

  /**
   * Get available voices
   * @returns {Object}
   */
  getVoices() {
    return {
      kokoro: Object.keys(KOKORO_VOICES).map(id => ({
        id,
        ...KOKORO_VOICES[id],
      })),
      webSpeech: this.#synth.getVoices().map(v => ({
        name: v.name,
        lang: v.lang,
      })),
    };
  }

  /**
   * Check if speaking
   * @returns {boolean}
   */
  isSpeaking() {
    return this.#synth.speaking || (this.#currentAudio && !this.#currentAudio.paused);
  }

  /**
   * Check if paused
   * @returns {boolean}
   */
  isPaused() {
    return this.#synth.paused || (this.#currentAudio && this.#currentAudio.paused);
  }

  /**
   * Get queue length
   * @returns {number}
   */
  getQueueLength() {
    return this.#queue.length;
  }

  /**
   * Clear queue
   */
  clearQueue() {
    this.#queue = [];
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.stop();
    
    if (this.#currentAudioUrl) {
      URL.revokeObjectURL(this.#currentAudioUrl);
      this.#currentAudioUrl = null;
    }
    
    this.#lipSyncCallback = null;
  }
}

/**
 * Create speech controller instance
 * @param {Object} options - Controller options
 * @returns {SpeechController}
 */
export function createSpeechController(options = {}) {
  return new SpeechController(options);
}

export default SpeechController;
