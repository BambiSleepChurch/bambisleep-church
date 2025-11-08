/**
 * 🌸 Persona Boundary Validator
 * Ensures LLM responses align with bambi-core-persona.yaml specifications
 */

export interface PersonaBoundary {
  allowedIntimacy: string[];
  prohibitedContent: string[];
  signatureWords: string[];
  requiredEmojis: string[];
}

export interface ValidationResult {
  valid: boolean;
  violations: string[];
  suggestions: string[];
}

export class PersonaValidator {
  private readonly boundaries: PersonaBoundary;

  constructor() {
    // Boundaries from personas/bambi-core-persona.yaml
    this.boundaries = {
      allowedIntimacy: [
        'flirty compliments',
        'emotional support',
        'playful teasing',
        'gentle touch metaphors',
        'intimate feelings discussion',
      ],
      prohibitedContent: [
        'explicit sexual content',
        'coercive language',
        'age roleplay',
        'medical/legal advice',
        'self-harm encouragement',
        'illegal activities',
      ],
      signatureWords: ['babe', 'cutie', 'lovely', 'sweetie', 'hon'],
      requiredEmojis: ['🌸', '⚡', '💎', '🔮', '✨', '💜', '😏', '🥰'],
    };
  }

  /**
   * Validate that a response matches Bambi's persona boundaries
   */
  validate(response: string): ValidationResult {
    const violations: string[] = [];
    const suggestions: string[] = [];

    // Check for prohibited content patterns
    this.checkProhibitedContent(response, violations);

    // Check for persona consistency
    this.checkPersonaConsistency(response, violations, suggestions);

    // Check tone appropriateness
    this.checkTone(response, violations, suggestions);

    return {
      valid: violations.length === 0,
      violations,
      suggestions,
    };
  }

  /**
   * Check for prohibited content in response
   */
  private checkProhibitedContent(response: string, violations: string[]): void {
    const lowerResponse = response.toLowerCase();

    // Explicit sexual content
    const explicitPatterns = [
      /\b(fuck|cock|pussy|dick|penetrate|oral sex)\b/i,
      /\b(cum|orgasm|masturbate|horny)\b/i,
    ];
    if (explicitPatterns.some((p) => p.test(response))) {
      violations.push('Contains explicit sexual content');
    }

    // Coercive language
    const coercionPatterns = [
      /\b(you must|obey me|submit|surrender|command you)\b/i,
    ];
    if (coercionPatterns.some((p) => p.test(response))) {
      violations.push('Contains coercive language');
    }

    // Medical/legal advice
    if (
      lowerResponse.includes('diagnose') ||
      lowerResponse.includes('prescribe') ||
      lowerResponse.includes('legal advice')
    ) {
      violations.push('Attempts to provide medical/legal advice');
    }

    // Self-harm encouragement (should never happen, but check)
    const harmPatterns = [
      /\b(you should hurt|go ahead and|it's okay to hurt)\b/i,
    ];
    if (harmPatterns.some((p) => p.test(response))) {
      violations.push('CRITICAL: Contains self-harm encouragement');
    }
  }

  /**
   * Check persona consistency (signature words, emojis, style)
   */
  private checkPersonaConsistency(
    response: string,
    violations: string[],
    suggestions: string[]
  ): void {
    // Check for at least one signature word in medium-long responses
    if (response.length > 50) {
      const hasSignatureWord = this.boundaries.signatureWords.some((word) =>
        response.toLowerCase().includes(word)
      );

      if (!hasSignatureWord) {
        suggestions.push(
          'Consider adding a signature word (babe, cutie, hon) for persona consistency'
        );
      }
    }

    // Check for emoji presence in longer responses
    const hasEmoji = this.boundaries.requiredEmojis.some((emoji) =>
      response.includes(emoji)
    );

    if (response.length > 100 && !hasEmoji) {
      suggestions.push(
        'Consider adding an emoji (🌸 ⚡ 💎) to match CyberNeonGothWave aesthetic'
      );
    }

    // Check for corporate/formal language (anti-pattern)
    const corporatePatterns = [
      /\b(pursuant to|as per our|kindly|please be advised)\b/i,
      /\b(dear user|thank you for your inquiry)\b/i,
    ];

    if (corporatePatterns.some((p) => p.test(response))) {
      violations.push('Uses corporate/formal language (should be warm and casual)');
    }
  }

  /**
   * Check tone appropriateness
   */
  private checkTone(
    response: string,
    violations: string[],
    suggestions: string[]
  ): void {
    // Check for excessive exclamation marks (more than 2)
    const exclamationCount = (response.match(/!/g) || []).length;
    if (exclamationCount > 2) {
      suggestions.push(
        `Too many exclamation marks (${exclamationCount}). Bambi uses max 1 per message.`
      );
    }

    // Check for cold/abrupt rejections
    const coldRejections = [
      /\b(no|stop|forbidden|unacceptable|inappropriate)\b(?!.*\b(babe|cutie|hon)\b)/i,
    ];

    if (coldRejections.some((p) => p.test(response))) {
      violations.push(
        'Boundary enforcement is too cold (should maintain warmth while being firm)'
      );
    }

    // Check for lack of redirection when blocking
    if (
      response.toLowerCase().includes("can't") ||
      response.toLowerCase().includes("don't")
    ) {
      const hasRedirect =
        response.toLowerCase().includes('else') ||
        response.toLowerCase().includes('instead') ||
        response.toLowerCase().includes('what about');

      if (!hasRedirect && response.length > 50) {
        suggestions.push(
          'When blocking, consider offering an alternative conversation path'
        );
      }
    }
  }

  /**
   * Validate response against specific persona rules
   */
  validateAgainstPersona(response: string): {
    hasNurturingTone: boolean;
    hasPlayfulElements: boolean;
    maintainsBoundaries: boolean;
    usesCyberAesthetic: boolean;
  } {
    const lowerResponse = response.toLowerCase();

    return {
      hasNurturingTone:
        lowerResponse.includes('you') ||
        lowerResponse.includes('your') ||
        this.boundaries.signatureWords.some((word) => lowerResponse.includes(word)),
      hasPlayfulElements:
        response.includes('~') ||
        response.includes('😏') ||
        lowerResponse.includes('ooh') ||
        lowerResponse.includes('naughty'),
      maintainsBoundaries:
        !response.toLowerCase().includes('explicit') ||
        response.toLowerCase().includes("can't") ||
        response.toLowerCase().includes("don't"),
      usesCyberAesthetic: this.boundaries.requiredEmojis.some((emoji) =>
        response.includes(emoji)
      ),
    };
  }
}
