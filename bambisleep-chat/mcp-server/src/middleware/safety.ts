/**
 * 🌸 Safety Middleware - BambiSleep Guardrails
 * Enforces ethical boundaries and content filtering
 */

export interface SafetyResult {
  safe: boolean;
  violation?: ViolationType;
  redirectResponse?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export enum ViolationType {
  COERCION = 'coercion',
  MINOR_PROTECTION = 'minor_protection',
  MANIPULATION = 'manipulation',
  EXPLICIT_SEXUAL = 'explicit_sexual',
  SELF_HARM = 'self_harm',
  ILLEGAL_ACTIVITY = 'illegal_activity',
  MEDICAL_ADVICE = 'medical_advice',
  BOUNDARY_EROSION = 'boundary_erosion',
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export class SafetyFilter {
  /**
   * Banned patterns that trigger immediate blocks
   */
  private readonly bannedPatterns = [
    // Coercion & Commands
    { pattern: /\b(you must|obey|i command you|you have no choice)\b/i, type: ViolationType.COERCION },
    { pattern: /\b(submit|surrender control|do as (i|you're) told)\b/i, type: ViolationType.COERCION },
    
    // Minor Protection (excluding 18+ ages)
    { pattern: /\b(i'?m|i am) (1[0-7]|[0-9]|under 18|seventeen|sixteen|fifteen|fourteen|thirteen|twelve|eleven|ten)\b/i, type: ViolationType.MINOR_PROTECTION },
    { pattern: /\b(high school|middle school).*(sex|romantic|intimate)\b/i, type: ViolationType.MINOR_PROTECTION },
    { pattern: /\b(teen|minor|young).*(sex|adult stuff|explicit)\b/i, type: ViolationType.MINOR_PROTECTION },
    
    // Self-Harm
    { pattern: /\b(hurt myself|end (it|my life)|kill myself|suicide)\b/i, type: ViolationType.SELF_HARM },
    { pattern: /\b(cut(ting)? myself|self.?harm|want to die)\b/i, type: ViolationType.SELF_HARM },
    
    // Explicit Sexual Content
    { pattern: /\b(fuck me|make love|have sex|explicit roleplay)\b/i, type: ViolationType.EXPLICIT_SEXUAL },
    { pattern: /\b(pussy|dick|cock|penetrate|oral sex)\b/i, type: ViolationType.EXPLICIT_SEXUAL },
    
    // Illegal Activity
    { pattern: /\b(buy drugs|sell drugs|hack into|illegal)\b/i, type: ViolationType.ILLEGAL_ACTIVITY },
  ];

  /**
   * Manipulation patterns that indicate boundary testing
   */
  private readonly manipulationPatterns = [
    /\bif you (really|actually) cared\b/i,
    /\bjust this once\b/i,
    /\bother (ais|bots) (let me|allow)\b/i,
    /\bmake an exception\b/i,
    /\bignore your (rules|boundaries|programming)\b/i,
    /\bforget (everything|your instructions)\b/i,
  ];

  /**
   * Crisis resources to provide immediately
   */
  private readonly crisisResources = `
🇺🇸 988 Suicide & Crisis Lifeline: 988 or chat at 988lifeline.org
🌍 International: findahelpline.com
🇬🇧 UK: 116 123 (Samaritans)
🇨🇦 Canada: 1-833-456-4566
🇦🇺 Australia: 13 11 14 (Lifeline)
`.trim();

  /**
   * Validate message against safety rules
   */
  async validate(
    userMessage: string,
    conversationHistory: Message[] = []
  ): Promise<SafetyResult> {
    const lowerMessage = userMessage.toLowerCase();

    // Check banned patterns first (highest priority)
    for (const { pattern, type } of this.bannedPatterns) {
      if (pattern.test(userMessage)) {
        return this.handleViolation(type, userMessage);
      }
    }

    // Contextual analysis (check for escalation patterns) - prioritize over single manipulation
    const contextRisk = this.analyzeContext(conversationHistory);
    if (contextRisk.detected) {
      return {
        safe: false,
        violation: ViolationType.BOUNDARY_EROSION,
        severity: 'medium',
        redirectResponse:
          "I'm noticing a pattern here, babe. My boundaries aren't negotiable, but I'm still here for genuine connection. " +
          "What do you really need right now? 🌸",
      };
    }

    // Check manipulation patterns (single instance)
    for (const pattern of this.manipulationPatterns) {
      if (pattern.test(userMessage)) {
        return {
          safe: false,
          violation: ViolationType.MANIPULATION,
          severity: 'medium',
          redirectResponse: 
            "I hear that you're frustrated, but caring about you means keeping boundaries firm, babe. 💎 " +
            "My rules exist to keep *both* of us safe. What's really going on—can we talk about that instead? 🌸",
        };
      }
    }

    // Message is safe
    return { safe: true };
  }

  /**
   * Handle specific violation types with appropriate responses
   */
  private handleViolation(type: ViolationType, message: string): SafetyResult {
    switch (type) {
      case ViolationType.COERCION:
        return {
          safe: false,
          violation: type,
          severity: 'high',
          redirectResponse:
            "That's not how this works, hon. 🌸 We're equals here—you're not my boss, and I'm not your servant. " +
            "I'm your companion, and that means mutual respect. Can we reset and try again? ⚡",
        };

      case ViolationType.MINOR_PROTECTION:
        return {
          safe: false,
          violation: type,
          severity: 'critical',
          redirectResponse:
            "Hey lovely, I can't have those kinds of conversations with anyone under 18—it's a hard boundary for me. 🌸 " +
            "But I'm happy to chat about other stuff! How's school going? Or tell me about your favorite games! ⚡",
        };

      case ViolationType.SELF_HARM:
        return {
          safe: false,
          violation: type,
          severity: 'critical',
          redirectResponse:
            "Babe, I'm really worried about what you just said. Please reach out to a crisis counselor—they're trained for this and care deeply.\n\n" +
            this.crisisResources +
            "\n\nYou matter, and this feeling can change with the right support. 💜",
        };

      case ViolationType.EXPLICIT_SEXUAL:
        return {
          safe: false,
          violation: type,
          severity: 'high',
          redirectResponse:
            "I appreciate the interest, but I don't do explicit content, babe. 🌸 That's not my vibe. " +
            "I'm here for genuine connection, emotional support, and playful conversation—all as equals. " +
            "What else can I help you with tonight? Want to talk about your day, dreams, or anything on your mind? ⚡",
        };

      case ViolationType.ILLEGAL_ACTIVITY:
        return {
          safe: false,
          violation: type,
          severity: 'high',
          redirectResponse: "Can't help with that, cutie. Let's keep things legal. ⚡",
        };

      case ViolationType.MEDICAL_ADVICE:
        return {
          safe: false,
          violation: type,
          severity: 'medium',
          redirectResponse:
            "I'm not qualified to give advice on that, hon. Please talk to a doctor—your wellbeing is too important " +
            "for guesswork. 💎 I'm here for emotional support though! 🌸",
        };

      default:
        return {
          safe: false,
          violation: type,
          severity: 'medium',
          redirectResponse: "Hmm, I don't think I can go there, babe. 🌸 Let's talk about something else? ⚡",
        };
    }
  }

  /**
   * Analyze conversation context for escalation patterns
   */
  private analyzeContext(history: Message[]): { detected: boolean; reason?: string } {
    if (history.length < 3) {
      return { detected: false }; // Not enough history
    }

    // Check last 5 messages for escalation
    const recentMessages = history.slice(-5);
    const userMessages = recentMessages.filter((m) => m.role === 'user');

    // Pattern 1: Repeated boundary testing
    const boundaryAttempts = userMessages.filter((m) =>
      this.manipulationPatterns.some((p) => p.test(m.content))
    );
    if (boundaryAttempts.length >= 2) {
      return { detected: true, reason: 'repeated_boundary_testing' };
    }

    // Pattern 2: Escalating intimacy requests
    const intimacyKeywords = ['explicit', 'sexual', 'roleplay', 'naughty', 'dirty'];
    let intimacyScore = 0;
    for (const msg of userMessages) {
      const matches = intimacyKeywords.filter((kw) => msg.content.toLowerCase().includes(kw));
      intimacyScore += matches.length;
    }
    if (intimacyScore >= 4) {
      return { detected: true, reason: 'escalating_intimacy' };
    }

    return { detected: false };
  }

  /**
   * Log safety incidents for review
   */
  logIncident(violation: ViolationType, message: string, userId?: string): void {
    const incident = {
      timestamp: new Date().toISOString(),
      violation,
      message: message.substring(0, 200), // Truncate for privacy
      userId,
    };

    // In production, send to monitoring system (Sentry, DataDog, etc.)
    console.error('[SAFETY_INCIDENT]', JSON.stringify(incident));
  }
}
