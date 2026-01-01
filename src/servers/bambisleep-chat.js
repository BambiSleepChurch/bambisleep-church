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

// ============ COMBINED HANDLERS EXPORT ============

export const bambisleepChatHandlers = {
  triggers: triggerHandlers,
  tts: ttsHandlers,
  chat: chatHandlers,
  collar: collarHandlers,
  textEffects: textEffectsHandlers,
  session: sessionHandlers
};

// ============ UTILITY FUNCTIONS ============

/**
 * Escape special regex characters in a string
 */
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default bambisleepChatHandlers;
