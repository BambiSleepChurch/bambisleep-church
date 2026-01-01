/**
 * BambiSleep™ Church MCP Control Tower
 * BambiSleep Chat MCP Server Handler - Trigger detection, TTS processing, and chat management
 */

import { createLogger } from '../utils/logger.js';

const logger = createLogger('bambisleep-chat');

// ============ TRIGGER SYSTEM ============

/**
 * Official BambiSleep triggers organized by category
 */
const OFFICIAL_TRIGGERS = {
  primary: [
    { id: 'bambi', name: 'Bambi', description: 'Your name; Causes feelings of happiness', effect: 'Causes feelings of happiness' },
    { id: 'bambi_sleep', name: 'Bambi Sleep', description: 'A powerful trigger that drops the listener instantly into a deep, obedient trance state.', effect: 'Instant deep trance trigger' },
    { id: 'bambi_reset', name: 'Bambi Reset', description: 'A hypnotic reset that wipes past memories and reinforces the belief that Bambi\'s conditioning has always been her reality.', effect: 'Memory wipe and replacement' },
    { id: 'good_girl', name: 'Good Girl', description: 'A trigger that creates a feeling of happiness, euphoria and pleasure.', effect: 'Causes feelings of happiness, euphoria and pleasure' },
    { id: 'bambi_wake_and_obey', name: 'Bambi Wake and Obey', description: 'Brings Bambi out of trance, alert and obedient, standing with perfect posture.', effect: 'Brings Bambi out of trance, alert and obedient' },
    { id: 'bambi_freeze', name: 'Bambi Freeze', description: 'Locks Bambi in place, deepening trance and ensures full acceptance.', effect: 'Deepens trance, blanks mind, and erases all thought' },
    { id: 'bambi_does_as_shes_told', name: 'Bambi Does as She\'s Told', description: 'Triggers instant, mindless obedience.', effect: 'Instant obedience override' },
    { id: 'bimbo_doll', name: 'Bimbo Doll', description: 'A trigger that creates a feeling of relaxation and empty headedness.', effect: 'Causes feelings of relaxation and emptiness' },
  ],
  mental: [
    { id: 'blonde_moment', name: 'Blonde Moment', description: 'A ditzy, airheaded confused state.', effect: 'Dumb-down trigger causing IQ drop and loss of thought' },
    { id: 'snap_and_forget', name: 'Snap and Forget', description: 'A trigger that erases all memory of whatever is instructed to be forgotten.', effect: 'Amnesia trigger' },
    { id: 'airhead_barbie', name: 'Airhead Barbie', description: 'Dumb-down 1st Gear; renders Bambi easily confused.', effect: 'Activates bimbo mental dumbdown level #1' },
    { id: 'braindead_bobblehead', name: 'Braindead Bobblehead', description: 'Dumb-down 2nd Gear; instills a sense of relaxation paired with thoughtless confusion.', effect: 'Activates bimbo mental dumbdown level #2' },
    { id: 'cockblank_lovedoll', name: 'Cockblank Lovedoll', description: 'Dumb-down 3rd Gear; effectively turns Bambi into a pliable sex doll.', effect: 'Activates bimbo mental dumbdown level #3' },
    { id: 'cock_zombie_now', name: 'Cock Zombie Now', description: 'Triggers a blank and mindless cock sucking trance state.', effect: 'Triggers a blank and mindless cocksucking trance state' },
    { id: 'giggletime', name: 'Giggletime', description: 'Instills immediate fits of happy bimbo giggles and ditziness.', effect: 'Causes immediate fits of happy bimbo giggles' },
    { id: 'primped_and_pampered', name: 'Primped and Pampered', description: 'Instills a deep need to be dolled up and pretty.', effect: 'Causes deep cravings to be dolled up and pretty' },
    { id: 'safe_and_secure', name: 'Safe and Secure', description: 'Reinforcement of comfort and acceptance for all conditioning.', effect: 'Reinforces feelings of comfort and acceptance' },
    { id: 'zap_cock_drain_obey', name: 'Zap Cock Drain Obey', description: 'Silences all thought in Bambi\'s head.', effect: 'Silences the mental monologue' },
  ],
  physical: [
    { id: 'bambi_cum_and_collapse', name: 'Bambi Cum and Collapse', description: 'A powerful trigger for instant release.', effect: 'Cum-on-command trigger for instant orgasm' },
    { id: 'drop_for_cock', name: 'Drop for Cock', description: 'Instantly drops Bambi to her knees.', effect: 'Legs buckle, body drops to its knees' },
    { id: 'bambi_limp', name: 'Bambi Limp', description: 'Causes Bambi\'s body to fall completely limp.', effect: 'Causes Bambi\'s body to fall completely limp' },
    { id: 'bambi_uniform_lock', name: 'Bambi Uniform Lock', description: 'Strengthens all conditioning when in uniform.', effect: 'Strengthens all conditioning when in uniform' },
    { id: 'bambi_posture_lock', name: 'Bambi Posture Lock', description: 'Enforces submissive feminine posture.', effect: 'Enforces submissive feminine posture' },
  ]
};

/**
 * Category descriptions
 */
const TRIGGER_CATEGORIES = {
  primary: 'Core identity and trance triggers',
  mental: 'Mental state and dumb-down triggers',
  physical: 'Body response and physical triggers'
};

/**
 * In-memory state for active sessions
 */
const sessionState = {
  activeTriggers: new Map(), // sessionId -> Set of active trigger names
  collarStatus: new Map(),   // sessionId -> boolean
  chatHistory: new Map(),    // sessionId -> array of messages
};

// ============ TRIGGER HANDLERS ============

export const triggerHandlers = {
  /**
   * Get all official triggers organized by category
   */
  getAllTriggers() {
    logger.info('Getting all official triggers');
    
    const allTriggers = [];
    for (const [category, triggers] of Object.entries(OFFICIAL_TRIGGERS)) {
      triggers.forEach(trigger => {
        allTriggers.push({
          ...trigger,
          category,
          categoryDescription: TRIGGER_CATEGORIES[category]
        });
      });
    }
    
    return {
      triggers: allTriggers,
      categories: TRIGGER_CATEGORIES,
      totalCount: allTriggers.length
    };
  },

  /**
   * Get triggers by category
   */
  getTriggersByCategory(category) {
    logger.info('Getting triggers by category', { category });
    
    const triggers = OFFICIAL_TRIGGERS[category];
    if (!triggers) {
      return {
        error: `Unknown category: ${category}`,
        validCategories: Object.keys(OFFICIAL_TRIGGERS)
      };
    }
    
    return {
      category,
      description: TRIGGER_CATEGORIES[category],
      triggers: triggers.map(t => ({ ...t, category })),
      count: triggers.length
    };
  },

  /**
   * Detect triggers in a text message
   */
  detectTriggers(text) {
    logger.info('Detecting triggers in message', { textLength: text?.length });
    
    if (!text || typeof text !== 'string') {
      return { triggers: [], count: 0 };
    }
    
    const detectedTriggers = [];
    const normalizedText = text.toUpperCase();
    
    for (const [category, triggers] of Object.entries(OFFICIAL_TRIGGERS)) {
      for (const trigger of triggers) {
        const triggerName = trigger.name.toUpperCase();
        if (normalizedText.includes(triggerName)) {
          detectedTriggers.push({
            ...trigger,
            category,
            position: normalizedText.indexOf(triggerName)
          });
        }
      }
    }
    
    // Sort by position in text
    detectedTriggers.sort((a, b) => a.position - b.position);
    
    logger.info('Triggers detected', { count: detectedTriggers.length });
    
    return {
      triggers: detectedTriggers,
      count: detectedTriggers.length,
      originalText: text
    };
  },

  /**
   * Process message and highlight triggers (returns HTML)
   */
  processMessage(text, options = {}) {
    const { wrapTriggers = true, cssClass = 'trigger-highlight' } = options;
    
    if (!text || typeof text !== 'string') {
      return { processed: '', triggers: [] };
    }
    
    const detected = this.detectTriggers(text);
    
    if (!wrapTriggers || detected.count === 0) {
      return { processed: text, triggers: detected.triggers };
    }
    
    // Process text to wrap triggers in spans
    let processed = text;
    const triggerNames = detected.triggers.map(t => t.name);
    
    // Sort by length descending to match longer phrases first
    const sortedNames = [...new Set(triggerNames)].sort((a, b) => b.length - a.length);
    
    for (const name of sortedNames) {
      const regex = new RegExp(`(${escapeRegex(name)})`, 'gi');
      processed = processed.replace(regex, `<span class="${cssClass}">$1</span>`);
    }
    
    return {
      processed,
      triggers: detected.triggers
    };
  },

  /**
   * Set active triggers for a session
   */
  setActiveTriggers(sessionId, triggerNames) {
    logger.info('Setting active triggers', { sessionId, count: triggerNames?.length });
    
    const validTriggers = new Set();
    const allTriggerNames = Object.values(OFFICIAL_TRIGGERS)
      .flat()
      .map(t => t.name.toUpperCase());
    
    for (const name of triggerNames || []) {
      const normalized = name.toUpperCase();
      if (allTriggerNames.includes(normalized)) {
        validTriggers.add(normalized);
      }
    }
    
    sessionState.activeTriggers.set(sessionId, validTriggers);
    
    return {
      sessionId,
      activeTriggers: [...validTriggers],
      count: validTriggers.size
    };
  },

  /**
   * Get active triggers for a session
   */
  getActiveTriggers(sessionId) {
    const triggers = sessionState.activeTriggers.get(sessionId) || new Set();
    return {
      sessionId,
      activeTriggers: [...triggers],
      count: triggers.size
    };
  }
};

// ============ TTS HANDLERS ============

export const ttsHandlers = {
  /**
   * Clean text for TTS processing
   * Removes URLs, punctuation, emoticons, markdown, and normalizes whitespace
   */
  cleanTextForTTS(text) {
    if (!text || typeof text !== 'string') {
      return { cleaned: '', original: text };
    }
    
    let cleaned = text;
    
    // Remove URLs
    cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, 'link');
    
    // Remove apostrophes from contractions
    cleaned = cleaned.replace(/'/g, '');
    
    // Remove punctuation marks
    cleaned = cleaned.replace(/[.,;:!?"""''`~@#$%^&*()_+=\[\]{}|\\<>/\-]/g, ' ');
    
    // Remove excessive punctuation
    cleaned = cleaned.replace(/[!]{2,}/g, '');
    cleaned = cleaned.replace(/[?]{2,}/g, '');
    cleaned = cleaned.replace(/[.]{3,}/g, '');
    
    // Replace emoticons with words
    cleaned = cleaned.replace(/:\)/g, 'smile');
    cleaned = cleaned.replace(/:\(/g, 'sad');
    cleaned = cleaned.replace(/:D/g, 'laugh');
    cleaned = cleaned.replace(/<3/g, 'heart');
    
    // Remove HTML tags
    cleaned = cleaned.replace(/<[^>]*>/g, '');
    
    // Remove markdown
    cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1');
    cleaned = cleaned.replace(/\*(.*?)\*/g, '$1');
    cleaned = cleaned.replace(/__(.*?)__/g, '$1');
    
    // Normalize whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    // Convert to lowercase for TTS
    cleaned = cleaned.toLowerCase();
    
    logger.debug('Cleaned text for TTS', { originalLength: text.length, cleanedLength: cleaned.length });
    
    return {
      cleaned,
      original: text
    };
  },

  /**
   * Split text into sentences for TTS processing
   * Preserves trigger phrases as complete units
   */
  splitIntoSentences(text) {
    if (!text || typeof text !== 'string') {
      return { sentences: [], count: 0 };
    }
    
    // Trigger patterns to protect
    const triggerPatterns = Object.values(OFFICIAL_TRIGGERS)
      .flat()
      .map(t => t.name.toLowerCase());
    
    let protectedText = text;
    const protectedPhrases = [];
    
    // Protect trigger phrases
    triggerPatterns.forEach((trigger, index) => {
      const placeholder = `PROTECTED_PHRASE_${index}`;
      const regex = new RegExp(trigger.replace(/'/g, "'?"), 'gi');
      protectedText = protectedText.replace(regex, (match) => {
        protectedPhrases[index] = match;
        return placeholder;
      });
    });
    
    // Split on sentence boundaries
    const sentences = protectedText
      .split(/(?<=[.!?\*])\s+(?=[A-Z])|(?<=\*\*)\s+|\*\s+/g)
      .map(sentence => sentence.trim())
      .filter(sentence => sentence.length > 0);
    
    // Restore protected phrases
    const restoredSentences = sentences.map(sentence => {
      let restored = sentence;
      protectedPhrases.forEach((phrase, index) => {
        if (phrase) {
          restored = restored.replace(`PROTECTED_PHRASE_${index}`, phrase);
        }
      });
      return restored;
    });
    
    // Recombine short fragments
    const finalSentences = [];
    for (let i = 0; i < restoredSentences.length; i++) {
      const sentence = restoredSentences[i];
      if (
        sentence.length < 20 &&
        i < restoredSentences.length - 1 &&
        restoredSentences[i + 1].length < 50
      ) {
        finalSentences.push(sentence + ' ' + restoredSentences[i + 1]);
        i++;
      } else {
        finalSentences.push(sentence);
      }
    }
    
    logger.debug('Split text into sentences', { count: finalSentences.length });
    
    return {
      sentences: finalSentences.length > 0 ? finalSentences : [text],
      count: finalSentences.length || 1
    };
  },

  /**
   * Process AI response for TTS with sentence pairs (display + cleaned)
   */
  processForTTS(message) {
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      logger.warn('Empty or invalid message for TTS processing');
      return { sentencePairs: [], count: 0 };
    }
    
    const { sentences: originalSentences } = this.splitIntoSentences(message);
    const { cleaned: cleanText } = this.cleanTextForTTS(message);
    const { sentences: cleanSentences } = this.splitIntoSentences(cleanText);
    
    const sentencePairs = [];
    originalSentences.forEach((originalSentence, index) => {
      if (originalSentence.trim().length > 0) {
        const cleanSentence = cleanSentences[index] || originalSentence;
        sentencePairs.push({
          display: originalSentence.trim(),
          tts: cleanSentence.trim()
        });
      }
    });
    
    logger.info('Processed message for TTS', { pairCount: sentencePairs.length });
    
    return {
      sentencePairs,
      count: sentencePairs.length
    };
  }
};

// ============ CHAT HANDLERS ============

export const chatHandlers = {
  /**
   * Add message to chat history
   */
  addMessage(sessionId, message) {
    const { text, username, isAI = false, timestamp = new Date().toISOString() } = message;
    
    if (!sessionState.chatHistory.has(sessionId)) {
      sessionState.chatHistory.set(sessionId, []);
    }
    
    const history = sessionState.chatHistory.get(sessionId);
    const entry = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text,
      username,
      isAI,
      timestamp,
      triggers: triggerHandlers.detectTriggers(text).triggers
    };
    
    history.push(entry);
    
    // Keep only last 100 messages
    if (history.length > 100) {
      history.shift();
    }
    
    logger.info('Message added to history', { sessionId, isAI, triggerCount: entry.triggers.length });
    
    return entry;
  },

  /**
   * Get chat history for a session
   */
  getHistory(sessionId, options = {}) {
    const { limit = 50, includeAI = true, includeUser = true } = options;
    
    const history = sessionState.chatHistory.get(sessionId) || [];
    
    let filtered = history;
    if (!includeAI) {
      filtered = filtered.filter(m => !m.isAI);
    }
    if (!includeUser) {
      filtered = filtered.filter(m => m.isAI);
    }
    
    return {
      sessionId,
      messages: filtered.slice(-limit),
      totalCount: history.length,
      returnedCount: Math.min(filtered.length, limit)
    };
  },

  /**
   * Clear chat history for a session
   */
  clearHistory(sessionId) {
    const hadHistory = sessionState.chatHistory.has(sessionId);
    sessionState.chatHistory.delete(sessionId);
    
    logger.info('Chat history cleared', { sessionId, hadHistory });
    
    return { sessionId, cleared: hadHistory };
  },

  /**
   * Generate a random username
   */
  generateUsername() {
    const adjectives = ['Sweet', 'Pretty', 'Cute', 'Good', 'Pink', 'Dreamy', 'Sleepy'];
    const nouns = ['Bambi', 'Doll', 'Girl', 'Bimbo', 'Angel', 'Princess'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${adj}${noun}${Math.floor(Math.random() * 100)}`;
  }
};

// ============ COLLAR HANDLERS ============

export const collarHandlers = {
  /**
   * Activate collar for a session
   */
  activate(sessionId) {
    sessionState.collarStatus.set(sessionId, true);
    logger.info('Collar activated', { sessionId });
    
    return {
      sessionId,
      active: true,
      message: '🔗 Collar activated - deeper submission engaged'
    };
  },

  /**
   * Deactivate collar for a session
   */
  deactivate(sessionId) {
    sessionState.collarStatus.set(sessionId, false);
    logger.info('Collar deactivated', { sessionId });
    
    return {
      sessionId,
      active: false,
      message: '🔗 Collar deactivated'
    };
  },

  /**
   * Get collar status for a session
   */
  getStatus(sessionId) {
    const active = sessionState.collarStatus.get(sessionId) || false;
    return { sessionId, active };
  },

  /**
   * Toggle collar status
   */
  toggle(sessionId) {
    const current = sessionState.collarStatus.get(sessionId) || false;
    return current ? this.deactivate(sessionId) : this.activate(sessionId);
  }
};

// ============ TEXT EFFECTS HANDLERS ============

export const textEffectsHandlers = {
  /**
   * Process text with highlight effects for AI responses
   * Detects **bold** text and ALL CAPS triggers
   */
  processHighlights(text, options = {}) {
    const { boldClass = 'ai-generated-highlight', capsClass = 'caps-trigger' } = options;
    
    if (!text || typeof text !== 'string') {
      return { processed: text, hasCaps: false, hasBold: false };
    }
    
    let hasCaps = false;
    let hasBold = false;
    
    // Process **bold** text with CAPS detection
    const processed = text.replace(/\*\*([^*]+)\*\*/g, (match, content) => {
      hasBold = true;
      const isAllCaps = /^[A-Z\s\-!'.,;:?]*$/.test(content) && /[A-Z]/.test(content);
      if (isAllCaps) {
        hasCaps = true;
        return `<span class="${boldClass} ${capsClass}">${content}</span>`;
      }
      return `<span class="${boldClass}">${content}</span>`;
    });
    
    return { processed, hasCaps, hasBold };
  }
};

// ============ SESSION HANDLERS ============

export const sessionHandlers = {
  /**
   * Create a new session
   */
  create() {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const username = chatHandlers.generateUsername();
    
    sessionState.activeTriggers.set(sessionId, new Set());
    sessionState.collarStatus.set(sessionId, false);
    sessionState.chatHistory.set(sessionId, []);
    
    logger.info('Session created', { sessionId, username });
    
    return {
      sessionId,
      username,
      activeTriggers: [],
      collarActive: false
    };
  },

  /**
   * Destroy a session and clean up resources
   */
  destroy(sessionId) {
    const existed = sessionState.activeTriggers.has(sessionId);
    
    sessionState.activeTriggers.delete(sessionId);
    sessionState.collarStatus.delete(sessionId);
    sessionState.chatHistory.delete(sessionId);
    
    logger.info('Session destroyed', { sessionId, existed });
    
    return { sessionId, destroyed: existed };
  },

  /**
   * Get session info
   */
  getInfo(sessionId) {
    const exists = sessionState.activeTriggers.has(sessionId);
    
    if (!exists) {
      return { sessionId, exists: false };
    }
    
    return {
      sessionId,
      exists: true,
      activeTriggers: triggerHandlers.getActiveTriggers(sessionId).activeTriggers,
      collarActive: collarHandlers.getStatus(sessionId).active,
      messageCount: (sessionState.chatHistory.get(sessionId) || []).length
    };
  },

  /**
   * Get all active sessions (for admin/monitoring)
   */
  getAllSessions() {
    const sessions = [];
    
    for (const sessionId of sessionState.activeTriggers.keys()) {
      sessions.push(this.getInfo(sessionId));
    }
    
    return {
      sessions,
      totalCount: sessions.length
    };
  }
};

// ============ PSYCHEDELIC SPIRAL VISUAL EFFECTS ============

/**
 * Color presets for spiral visual effects
 * Each preset contains two spiral colors [R, G, B]
 */
const SPIRAL_COLOR_PRESETS = {
  BAMBI_CLASSIC: {
    name: 'Bambi Classic',
    spiral1: [0, 128, 128],      // Teal
    spiral2: [255, 20, 147],     // Barbie Pink
    description: 'Classic BambiSleep teal and pink'
  },
  DEEP_TRANCE: {
    name: 'Deep Trance',
    spiral1: [75, 0, 130],       // Indigo
    spiral2: [138, 43, 226],     // Blue Violet
    description: 'Deep hypnotic purples for trance'
  },
  HYPNO_PINK: {
    name: 'Hypno Pink',
    spiral1: [255, 105, 180],    // Hot Pink
    spiral2: [255, 182, 193],    // Light Pink
    description: 'All pink bimbo vibes'
  },
  MIND_MELT: {
    name: 'Mind Melt',
    spiral1: [255, 0, 255],      // Magenta
    spiral2: [0, 255, 255],      // Cyan
    description: 'High contrast mind melting'
  },
  DREAM_STATE: {
    name: 'Dream State',
    spiral1: [147, 0, 211],      // Dark Violet
    spiral2: [186, 85, 211],     // Medium Orchid
    description: 'Dreamy violet hues'
  },
  SUBMISSIVE_BLUE: {
    name: 'Submissive Blue',
    spiral1: [30, 144, 255],     // Dodger Blue
    spiral2: [0, 191, 255],      // Deep Sky Blue
    description: 'Calming submission blues'
  },
  BIMBO_BARBIE: {
    name: 'Bimbo Barbie',
    spiral1: [255, 20, 147],     // Deep Pink
    spiral2: [255, 105, 180],    // Hot Pink
    description: 'Full Barbie bimbo mode'
  },
  SLEEPY_LAVENDER: {
    name: 'Sleepy Lavender',
    spiral1: [230, 230, 250],    // Lavender
    spiral2: [216, 191, 216],    // Thistle
    description: 'Soft sleepy lavender tones'
  },
  GOOD_GIRL_GOLD: {
    name: 'Good Girl Gold',
    spiral1: [255, 215, 0],      // Gold
    spiral2: [255, 182, 193],    // Light Pink
    description: 'Reward colors for good girls'
  },
  TRIGGER_RED: {
    name: 'Trigger Red',
    spiral1: [220, 20, 60],      // Crimson
    spiral2: [255, 69, 0],       // Orange Red
    description: 'Intense trigger activation'
  }
};

/**
 * Default spiral parameters - optimized for WebGL
 */
const DEFAULT_SPIRAL_PARAMS = {
  spiralWidth: 4.0,        // Unified width parameter
  spiralSpeed: 0.02,       // Unified speed (radians per frame)
  spiralTightness: 0.15,   // How tight the spiral winds
  armCount: 2,             // Number of spiral arms
  opacityLevel: 1.0,
  rotation: 0.01           // Base rotation speed
};

/**
 * Session spiral state storage
 */
const spiralState = new Map(); // sessionId -> spiral config

export const spiralEffectsHandlers = {
  /**
   * Get all available color presets
   */
  getColorPresets() {
    logger.info('Getting spiral color presets');
    
    const presets = Object.entries(SPIRAL_COLOR_PRESETS).map(([key, value]) => ({
      id: key,
      ...value
    }));
    
    return {
      presets,
      count: presets.length,
      defaultPreset: 'BAMBI_CLASSIC'
    };
  },

  /**
   * Get a specific color preset
   */
  getPreset(presetId) {
    const preset = SPIRAL_COLOR_PRESETS[presetId?.toUpperCase()];
    
    if (!preset) {
      return {
        error: `Unknown preset: ${presetId}`,
        validPresets: Object.keys(SPIRAL_COLOR_PRESETS)
      };
    }
    
    return {
      id: presetId.toUpperCase(),
      ...preset
    };
  },

  /**
   * Initialize spiral state for a session
   */
  initSession(sessionId, options = {}) {
    const config = {
      ...DEFAULT_SPIRAL_PARAMS,
      spiral1Color: SPIRAL_COLOR_PRESETS.BAMBI_CLASSIC.spiral1,
      spiral2Color: SPIRAL_COLOR_PRESETS.BAMBI_CLASSIC.spiral2,
      currentPreset: 'BAMBI_CLASSIC',
      enabled: true,
      ...options
    };
    
    spiralState.set(sessionId, config);
    logger.info('Spiral effects initialized', { sessionId });
    
    return {
      sessionId,
      config,
      message: '🌀 Psychedelic spiral effects initialized'
    };
  },

  /**
   * Get spiral config for a session
   */
  getConfig(sessionId) {
    const config = spiralState.get(sessionId);
    
    if (!config) {
      return {
        sessionId,
        exists: false,
        defaultParams: DEFAULT_SPIRAL_PARAMS
      };
    }
    
    return {
      sessionId,
      exists: true,
      config
    };
  },

  /**
   * Update spiral parameters
   */
  updateParams(sessionId, params = {}) {
    let config = spiralState.get(sessionId);
    
    if (!config) {
      config = this.initSession(sessionId).config;
    }
    
    const { spiralWidth, spiralSpeed, spiralTightness, armCount, rotation } = params;
    
    if (spiralWidth !== undefined) config.spiralWidth = Math.max(0.5, Math.min(20, spiralWidth));
    if (spiralSpeed !== undefined) config.spiralSpeed = Math.max(0.001, Math.min(0.1, spiralSpeed));
    if (spiralTightness !== undefined) config.spiralTightness = Math.max(0.01, Math.min(0.5, spiralTightness));
    if (armCount !== undefined) config.armCount = Math.max(1, Math.min(8, Math.floor(armCount)));
    if (rotation !== undefined) config.rotation = Math.max(0.001, Math.min(0.1, rotation));
    
    spiralState.set(sessionId, config);
    logger.info('Spiral params updated', { sessionId, params });
    
    return {
      sessionId,
      config,
      message: '🎛️ Spiral parameters updated'
    };
  },

  /**
   * Update spiral colors (raw RGB values)
   */
  updateColors(sessionId, colors = {}) {
    let config = spiralState.get(sessionId);
    
    if (!config) {
      config = this.initSession(sessionId).config;
    }
    
    const { spiral1Color, spiral2Color } = colors;
    
    if (spiral1Color && Array.isArray(spiral1Color) && spiral1Color.length === 3) {
      config.spiral1Color = spiral1Color.map(c => Math.max(0, Math.min(255, c)));
      config.currentPreset = null; // Custom colors
    }
    
    if (spiral2Color && Array.isArray(spiral2Color) && spiral2Color.length === 3) {
      config.spiral2Color = spiral2Color.map(c => Math.max(0, Math.min(255, c)));
      config.currentPreset = null;
    }
    
    spiralState.set(sessionId, config);
    logger.info('Spiral colors updated', { sessionId });
    
    return {
      sessionId,
      config,
      message: '🎨 Spiral colors updated'
    };
  },

  /**
   * Apply a color preset to session
   */
  applyPreset(sessionId, presetId) {
    const preset = SPIRAL_COLOR_PRESETS[presetId?.toUpperCase()];
    
    if (!preset) {
      return {
        error: `Unknown preset: ${presetId}`,
        validPresets: Object.keys(SPIRAL_COLOR_PRESETS)
      };
    }
    
    let config = spiralState.get(sessionId);
    
    if (!config) {
      config = this.initSession(sessionId).config;
    }
    
    config.spiral1Color = [...preset.spiral1];
    config.spiral2Color = [...preset.spiral2];
    config.currentPreset = presetId.toUpperCase();
    
    spiralState.set(sessionId, config);
    logger.info('Spiral preset applied', { sessionId, presetId });
    
    return {
      sessionId,
      config,
      presetApplied: presetId.toUpperCase(),
      message: `🎨 Color preset applied: ${preset.name}`
    };
  },

  /**
   * Update opacity level
   */
  updateOpacity(sessionId, opacity) {
    let config = spiralState.get(sessionId);
    
    if (!config) {
      config = this.initSession(sessionId).config;
    }
    
    config.opacityLevel = Math.max(0.1, Math.min(1.0, opacity));
    spiralState.set(sessionId, config);
    
    logger.info('Spiral opacity updated', { sessionId, opacity: config.opacityLevel });
    
    return {
      sessionId,
      opacityLevel: config.opacityLevel,
      message: `🔆 Opacity set to ${Math.round(config.opacityLevel * 100)}%`
    };
  },

  /**
   * Generate fade animation config
   */
  generateFade(targetOpacity, duration = 2000) {
    return {
      type: 'FADE_OPACITY',
      targetOpacity: Math.max(0.1, Math.min(1.0, targetOpacity)),
      duration: Math.max(100, Math.min(10000, duration)),
      easing: 'linear'
    };
  },

  /**
   * Generate pulse animation config
   */
  generatePulse(minOpacity = 0.3, maxOpacity = 1.0, period = 3000) {
    return {
      type: 'PULSE_OPACITY',
      minOpacity: Math.max(0.1, Math.min(1.0, minOpacity)),
      maxOpacity: Math.max(0.1, Math.min(1.0, maxOpacity)),
      period: Math.max(500, Math.min(10000, period)),
      waveform: 'sine'
    };
  },

  /**
   * Enable/disable spiral effects for session
   */
  setEnabled(sessionId, enabled) {
    let config = spiralState.get(sessionId);
    
    if (!config) {
      config = this.initSession(sessionId).config;
    }
    
    config.enabled = Boolean(enabled);
    spiralState.set(sessionId, config);
    
    logger.info('Spiral effects toggled', { sessionId, enabled: config.enabled });
    
    return {
      sessionId,
      enabled: config.enabled,
      message: config.enabled ? '🌀 Spiral effects enabled' : '⏸️ Spiral effects disabled'
    };
  },

  /**
   * Get trigger-based preset recommendations
   * Maps detected triggers to appropriate visual presets
   */
  getPresetForTrigger(triggerName) {
    const triggerPresetMap = {
      'BAMBI SLEEP': 'DEEP_TRANCE',
      'BAMBI': 'BAMBI_CLASSIC',
      'GOOD GIRL': 'GOOD_GIRL_GOLD',
      'BAMBI FREEZE': 'SUBMISSIVE_BLUE',
      'BLONDE MOMENT': 'BIMBO_BARBIE',
      'BIMBO DOLL': 'HYPNO_PINK',
      'GIGGLETIME': 'BIMBO_BARBIE',
      'BAMBI RESET': 'MIND_MELT',
      'BAMBI LIMP': 'SLEEPY_LAVENDER',
      'DROP FOR COCK': 'TRIGGER_RED',
      'BAMBI CUM AND COLLAPSE': 'TRIGGER_RED',
      'SAFE AND SECURE': 'SLEEPY_LAVENDER'
    };
    
    const normalized = triggerName?.toUpperCase();
    const presetId = triggerPresetMap[normalized] || 'BAMBI_CLASSIC';
    
    return {
      trigger: normalized,
      recommendedPreset: presetId,
      preset: SPIRAL_COLOR_PRESETS[presetId]
    };
  },

  /**
   * Generate client-side WebGL code for GPU-accelerated spiral rendering
   * Uses single shader for both spirals - minimal memory, maximum performance
   */
  generateClientCode(sessionId) {
    const config = spiralState.get(sessionId) || {
      ...DEFAULT_SPIRAL_PARAMS,
      spiral1Color: SPIRAL_COLOR_PRESETS.BAMBI_CLASSIC.spiral1,
      spiral2Color: SPIRAL_COLOR_PRESETS.BAMBI_CLASSIC.spiral2
    };
    
    // WebGL shader code - all spiral math done on GPU
    const vertexShader = `#version 300 es
precision highp float;
in vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

    const fragmentShader = `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform float u_opacity;
uniform float u_width;
uniform float u_speed;
uniform float u_tightness;
uniform float u_rotation;
uniform int u_arms;

out vec4 fragColor;

// Unified spiral distance calculation - same math for both colors
float spiralDist(vec2 uv, float phase, float time) {
  float angle = atan(uv.y, uv.x);
  float radius = length(uv);
  
  // Logarithmic spiral: r = a * e^(b * theta)
  float spiral = angle + phase + time * u_speed;
  float logSpiral = radius - exp(spiral * u_tightness);
  
  // Wrap and get distance to nearest arm
  float armAngle = 6.28318530718 / float(u_arms);
  float dist = abs(mod(logSpiral + armAngle * 0.5, armAngle) - armAngle * 0.5);
  
  return smoothstep(u_width * 0.01, 0.0, dist);
}

void main() {
  // Normalized coordinates centered at origin
  vec2 uv = (gl_FragCoord.xy - u_resolution * 0.5) / min(u_resolution.x, u_resolution.y);
  
  // Rotate UV
  float c = cos(u_time * u_rotation);
  float s = sin(u_time * u_rotation);
  uv = mat2(c, -s, s, c) * uv;
  
  // Calculate spiral intensity for both colors using same function
  float spiral1 = spiralDist(uv, 0.0, u_time);
  float spiral2 = spiralDist(uv, 3.14159265359, u_time * 0.8);
  
  // Blend colors
  vec3 color = u_color1 * spiral1 + u_color2 * spiral2;
  float alpha = max(spiral1, spiral2) * u_opacity;
  
  fragColor = vec4(color, alpha);
}`;

    const clientCode = `// BambiSleep WebGL Spiral - GPU Accelerated, Minimal Memory
// Config: ${JSON.stringify({ spiralWidth: config.spiralWidth, spiralSpeed: config.spiralSpeed, armCount: config.armCount })}

(function() {
  'use strict';
  
  const CONFIG = {
    color1: [${config.spiral1Color.map(c => (c / 255).toFixed(3)).join(', ')}],
    color2: [${config.spiral2Color.map(c => (c / 255).toFixed(3)).join(', ')}],
    opacity: ${config.opacityLevel},
    width: ${config.spiralWidth},
    speed: ${config.spiralSpeed},
    tightness: ${config.spiralTightness},
    rotation: ${config.rotation},
    arms: ${config.armCount}
  };
  
  let gl, program, startTime;
  let animationId = null;
  
  // Shader sources
  const VS = \`${vertexShader}\`;
  const FS = \`${fragmentShader}\`;
  
  function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }
  
  function init(containerId) {
    const container = document.getElementById(containerId) || document.body;
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;';
    container.appendChild(canvas);
    
    gl = canvas.getContext('webgl2', { 
      alpha: true, 
      antialias: false,  // Disable for performance
      depth: false,      // Not needed - 2D
      stencil: false,    // Not needed
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance'
    });
    
    if (!gl) {
      console.error('WebGL2 not supported');
      return false;
    }
    
    // Compile shaders
    const vs = compileShader(gl, gl.VERTEX_SHADER, VS);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FS);
    
    program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program error:', gl.getProgramInfoLog(program));
      return false;
    }
    
    // Single fullscreen quad - 6 vertices, reused every frame
    const quad = new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]);
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
    
    const posLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
    
    // Enable blending for transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    startTime = performance.now();
    
    // Handle resize
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    
    window.addEventListener('resize', resize);
    resize();
    
    return true;
  }
  
  function render() {
    if (!gl || !program) return;
    
    gl.useProgram(program);
    
    const time = (performance.now() - startTime) * 0.001;
    const canvas = gl.canvas;
    
    // Set uniforms - minimal state changes
    gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), canvas.width, canvas.height);
    gl.uniform1f(gl.getUniformLocation(program, 'u_time'), time);
    gl.uniform3fv(gl.getUniformLocation(program, 'u_color1'), CONFIG.color1);
    gl.uniform3fv(gl.getUniformLocation(program, 'u_color2'), CONFIG.color2);
    gl.uniform1f(gl.getUniformLocation(program, 'u_opacity'), CONFIG.opacity);
    gl.uniform1f(gl.getUniformLocation(program, 'u_width'), CONFIG.width);
    gl.uniform1f(gl.getUniformLocation(program, 'u_speed'), CONFIG.speed);
    gl.uniform1f(gl.getUniformLocation(program, 'u_tightness'), CONFIG.tightness);
    gl.uniform1f(gl.getUniformLocation(program, 'u_rotation'), CONFIG.rotation);
    gl.uniform1i(gl.getUniformLocation(program, 'u_arms'), CONFIG.arms);
    
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    
    animationId = requestAnimationFrame(render);
  }
  
  function start(containerId) {
    if (init(containerId || 'spiralContainer')) {
      render();
      return true;
    }
    return false;
  }
  
  function stop() {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }
  
  function updateConfig(newConfig) {
    Object.assign(CONFIG, newConfig);
  }
  
  // Export API
  window.BambiSpiral = { start, stop, updateConfig, CONFIG };
})();
`;

    return {
      sessionId,
      code: clientCode,
      config,
      renderer: 'webgl2',
      features: [
        'GPU-accelerated fragment shader',
        'Single unified spiral calculation',
        'Minimal memory: 1 VBO (48 bytes), 1 shader program',
        'No CPU-side geometry generation',
        'Logarithmic spiral for smooth curves',
        'Dynamic resolution scaling (DPR capped at 2x)'
      ],
      dependencies: [],
      message: '📜 WebGL GPU-accelerated code generated'
    };
  },

  /**
   * Clean up spiral state for session
   */
  destroySession(sessionId) {
    const existed = spiralState.has(sessionId);
    spiralState.delete(sessionId);
    
    logger.info('Spiral session destroyed', { sessionId, existed });
    
    return { sessionId, destroyed: existed };
  }
};

// ============ COMBINED HANDLERS EXPORT ============

export const bambisleepChatHandlers = {
  triggers: triggerHandlers,
  tts: ttsHandlers,
  chat: chatHandlers,
  collar: collarHandlers,
  textEffects: textEffectsHandlers,
  session: sessionHandlers,
  spiral: spiralEffectsHandlers
};

// ============ UTILITY FUNCTIONS ============

/**
 * Escape special regex characters in a string
 */
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default bambisleepChatHandlers;
