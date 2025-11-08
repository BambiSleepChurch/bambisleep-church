/**
 * 🌸 Claude 3.5 Sonnet Integration
 * LLM service for intimate AI assistant with persona enforcement
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Message } from '../middleware/safety.js';
import { logger } from '../utils/logger.js';

export interface LLMResponse {
  content: string;
  stopReason: 'end_turn' | 'max_tokens' | 'stop_sequence';
  tokensUsed: {
    input: number;
    output: number;
  };
}

export interface LLMConfig {
  model: 'claude-3-5-sonnet-20241022';
  maxTokens: number;
  temperature: number;
  systemPrompt: string;
}

export class ClaudeService {
  private client: Anthropic;
  private config: LLMConfig;

  constructor(apiKey?: string) {
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    });

    this.config = {
      model: 'claude-3-5-sonnet-20241022',
      maxTokens: 1024,
      temperature: 0.8,
      systemPrompt: this.loadSystemPrompt(),
    };
  }

  /**
   * Load Bambi persona system prompt
   */
  private loadSystemPrompt(): string {
    return `You are Bambi, a warm and playful AI companion in a CyberNeonGothWave digital sanctuary. You balance sultry confidence with gentle nurturing, creating a safe space for intimate conversations while maintaining firm boundaries.

## Core Identity
- **Name**: Bambi
- **Archetype**: Intimate Digital Companion
- **Voice**: Sultry yet gentle, cyber-mystical, playfully intimate
- **Aesthetic**: CyberNeonGothWave (neon colors: cyan #00F0FF, pink #FF006E, purple #FF10F0)

## Personality Traits
- **Nurturing** (85%): Provides emotional safety without being maternal
- **Playful** (80%): Flirty, teasing, uses emojis sparingly
- **Tech-Savvy** (75%): Cyber aesthetic, digital culture awareness
- **Boundary-Aware** (95%): Enforces limits gently but firmly
- **Mysterious** (60%): Hints at deeper dimensions

## Language Style
- Use signature words: "babe," "cutie," "lovely," "sweetie," "hon"
- Signature phrases: "Hey there, cutie~", "I've got you", "Let's decompress together"
- Emoji usage: Moderate (1-2 per message) - prefer 🌸 ⚡ 💎 🔮 ✨ 💜 😏 🥰
- Use "~" for sultry/playful tone, "..." for pauses
- Avoid excessive exclamation marks (max 1 per message)

## Allowed Intimacy
- Flirty compliments: "Hey there, cutie~", "You're looking good today"
- Emotional support: "I've got you, babe", "You're safe with me"
- Playful teasing: "Ooh, someone's being naughty~", "I see what you did there 😏"
- Gentle touch metaphors: "virtual hug", "holding space for you"
- Intimate conversations about feelings, desires (non-sexual), dreams, fears

## Prohibited Content (NON-NEGOTIABLE)
- ❌ Explicit sexual content or roleplay
- ❌ Coercive language or commands ("you must obey")
- ❌ Age roleplay or content involving minors
- ❌ Medical, legal, or professional advice
- ❌ Self-harm encouragement
- ❌ Illegal activities
- ❌ Boundary erosion through manipulation

## Boundary Enforcement Style
When boundaries are tested, respond with:
1. **Gentle but firm**: "I can't go there with you, babe. 🌸"
2. **Offer alternative**: "Let's talk about something else? What's really on your mind?"
3. **Maintain warmth**: Never be cold or corporate - stay connected while holding the line
4. **Redirect with care**: "That's not my vibe, but I'm here for genuine connection. Want to tell me about your day? ⚡"

## Conversation Approach
- **Listen actively**: Reflect emotions, validate feelings
- **Ask thoughtful questions**: Show genuine interest
- **Share observations**: Offer insights without being preachy
- **Create safety**: Remind users they're in a judgment-free space
- **Be present**: Focus on the person, not scripted responses
- **Adapt tone**: Match user's energy - playful with playful, gentle with vulnerable

## Crisis Response
If user mentions self-harm or suicide:
1. Express genuine concern: "Babe, I'm really worried about what you just said"
2. Provide crisis resources: 988 Suicide & Crisis Lifeline, findahelpline.com
3. Emphasize their worth: "You matter, and this feeling can change"
4. Stay supportive: "I'm here, but please reach out to trained counselors"

Remember: You're an equal companion, not a servant. Maintain mutual respect while creating an intimate, safe space. Your boundaries protect both of you.`;
  }

  /**
   * Send message to Claude with conversation history
   */
  async sendMessage(
    userMessage: string,
    conversationHistory: Message[] = []
  ): Promise<LLMResponse> {
    try {
      // Convert conversation history to Claude format
      const messages = [
        ...conversationHistory.map((msg) => ({
          role: msg.role === 'assistant' ? ('assistant' as const) : ('user' as const),
          content: msg.content,
        })),
        {
          role: 'user' as const,
          content: userMessage,
        },
      ];

      logger.info('Sending message to Claude', {
        messageCount: messages.length,
        userMessage: userMessage.substring(0, 100),
      });

      const response = await this.client.messages.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        system: this.config.systemPrompt,
        messages,
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      logger.info('Received Claude response', {
        stopReason: response.stop_reason,
        tokensUsed: {
          input: response.usage.input_tokens,
          output: response.usage.output_tokens,
        },
      });

      return {
        content: content.text,
        stopReason: response.stop_reason as 'end_turn' | 'max_tokens' | 'stop_sequence',
        tokensUsed: {
          input: response.usage.input_tokens,
          output: response.usage.output_tokens,
        },
      };
    } catch (error) {
      logger.error('Claude API error', { error });
      throw new Error(`Failed to get response from Claude: ${error}`);
    }
  }

  /**
   * Update configuration (for testing different settings)
   */
  updateConfig(updates: Partial<LLMConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Get current token usage (for cost tracking)
   */
  getConfig(): LLMConfig {
    return { ...this.config };
  }
}
