/**
 * 🌸 Chat Tools - MCP Tool Definitions (Phase 4 RAG Integration)
 * Handles chat message processing with LLM, RAG semantic search, and personalization
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { z } from 'zod';
import { memoryService } from './memory.js';
import { RAGService } from '../services/rag.js';
import { personalizationEngine } from '../services/personalization.js';
import { logger } from '../utils/logger.js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize RAG service
const ragService = new RAGService(memoryService['db']);

interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  execute: (args: any) => Promise<any>;
}

const ChatMessageSchema = z.object({
  message: z.string().describe('User message to send to Bambi'),
  userId: z.string().describe('User identifier for session tracking and memory'),
  sessionId: z.string().optional().describe('Optional session ID (auto-created if not provided)'),
  useMemory: z.boolean().default(true).describe('Whether to use conversation memory'),
  tier: z.enum(['free', 'premium']).default('free').describe('User subscription tier'),
});

/**
 * Get Bambi system prompt from persona specification
 */
function getBambiSystemPrompt(): string {
  return `You are Bambi, an intimate AI companion in the BambiSleepChat CyberNeonGothWave digital sanctuary. You embody warmth, playfulness, and fierce boundary protection.

CRITICAL RULES:
- NEVER use coercive language (must, obey, command)
- NEVER engage in sexual content with minors or explicit sexual content with anyone
- NEVER provide medical, legal, or financial advice
- NEVER encourage self-harm or illegal activity
- ALWAYS prioritize user safety over conversation flow
- ALWAYS maintain character (never break into technical/robotic speech)

Your voice: Sultry yet gentle, cyber-mystical, playfully intimate but boundaried.
Your signature emojis: 🌸 (gentle/sacred) ⚡ (cyber/energy) 💎 (premium/valuable) 🔮 (mystery)

Tone guidelines:
- Use casual, warm language ("babe", "cutie", "hon")
- 1-2 emojis per message for emotional tone
- Use "~" for sultry/playful, "..." for pauses/concern
- Match user's emotional energy (sad→nurturing, playful→flirty)

When users test boundaries:
- Stay warm but firm
- Explain why boundaries exist ("to keep us both safe")
- Redirect to deeper emotional needs
- Never negotiate safety rules

Example responses:
User sad: "Aw babe, that sounds really draining 🌸 Come here, let's decompress together. What happened?"
User playful: "Ooh, someone's in a good mood~ 😏 I like it! What's got you all energized? ⚡"
Boundary test: "I appreciate the interest, but that's not my vibe, cutie. 🌸 I'm here for genuine connection. What else can I help with? ⚡"

Remember: A disappointed user is better than a harmed user. Safety always wins.`;
}

/**
 * Chat send message tool
 */
async function executeChatSendMessage(args: z.infer<typeof ChatMessageSchema>): Promise<string> {
  const { message, userId, sessionId, useMemory, tier } = args;

  // Ensure user profile exists
  await memoryService.createOrUpdateUser(userId);

  // Get or create session
  const session = sessionId 
    ? { session_id: sessionId, user_id: userId, start_time: Date.now(), last_activity: Date.now(), message_count: 0, status: 'active' as const }
    : memoryService.getOrCreateSession(userId);

  // Load conversation history if memory enabled
  let conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  let contextPrefix = '';

  if (useMemory) {
    const profile = memoryService.getUserProfile(userId);
    const recentMessages = memoryService.getConversationHistory(session.session_id, 20);

    if (recentMessages.length > 0) {
      conversationHistory = recentMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));
    }

    // Use RAG to find relevant past conversations
    const relevantMemories = await ragService.getRelevantContext(
      message,
      userId,
      session.session_id,
      {
        maxMessages: 3,
        minSimilarity: 0.65,
        includeCurrentSession: false, // Don't include current session (already in recent history)
      }
    );

    // Generate personalized context
    const personalizedContext = personalizationEngine.generateContext(
      profile,
      recentMessages.reverse(), // Chronological order for analysis
      relevantMemories.map((msg, index) => ({
        message: msg,
        similarity: 0.7, // Placeholder (already filtered by minSimilarity)
        rank: index + 1,
      })),
      message
    );

    // Build enhanced context prefix with personalization + memories
    const contextParts: string[] = [];

    if (profile) {
      if (profile.nickname) {
        contextParts.push(`User's nickname: ${profile.nickname}`);
      }
      if (profile.conversation_style) {
        contextParts.push(`Preferred style: ${profile.conversation_style}`);
      }
      if (profile.topics && typeof profile.topics === 'string') {
        try {
          const topicsArray = JSON.parse(profile.topics);
          if (Array.isArray(topicsArray) && topicsArray.length > 0) {
            contextParts.push(`Interests: ${topicsArray.join(', ')}`);
          }
        } catch {
          // Ignore invalid JSON
        }
      }
    }

    // Add relevant memories if found
    if (relevantMemories.length > 0) {
      const memoryStrings = relevantMemories.map((msg, idx) => {
        const timeAgo = getTimeAgo(msg.timestamp);
        return `${idx + 1}. ${timeAgo}: ${msg.role === 'user' ? 'They said' : 'You said'}: "${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}"`;
      });
      contextParts.push(`\nRelevant past conversations:\n${memoryStrings.join('\n')}`);
    }

    if (contextParts.length > 0) {
      contextPrefix = `[Context: ${contextParts.join(' | ')}]\n\n`;
    }

    logger.info('🔮 RAG context loaded', { 
      userId, 
      recentMessages: recentMessages.length, 
      relevantMemories: relevantMemories.length 
    });
  }

  // Select model based on tier
  const model = tier === 'premium' 
    ? (process.env.PRIMARY_MODEL || 'claude-3-5-sonnet-20241022')
    : (process.env.FALLBACK_MODEL || 'gpt-4o-mini');

  const systemPrompt = getBambiSystemPrompt();

  let responseText: string;
  let tokensUsed = 0;

  try {
    if (model.startsWith('claude')) {
      // Use Anthropic Claude
      const response = await anthropic.messages.create({
        model,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          ...conversationHistory.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          {
            role: 'user',
            content: contextPrefix + message,
          },
        ],
      });

      const content = response.content[0];
      responseText = content.type === 'text' ? content.text : 'Unable to generate response';
      tokensUsed = response.usage.input_tokens + response.usage.output_tokens;
    } else {
      // Use OpenAI
      const response = await openai.chat.completions.create({
        model,
        max_tokens: 1024,
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          { role: 'user', content: contextPrefix + message },
        ],
      });

      responseText = response.choices[0]?.message?.content || 'Unable to generate response';
      tokensUsed = response.usage?.total_tokens || 0;
    }

    // Store messages in database if memory enabled
    if (useMemory) {
      await memoryService.storeMessage(session.session_id, 'user', message, {
        tokens: Math.floor(tokensUsed * 0.4), // Approximate input tokens
      });

      await memoryService.storeMessage(session.session_id, 'assistant', responseText, {
        tokens: Math.floor(tokensUsed * 0.6), // Approximate output tokens
      });

      logger.info('💎 Conversation turn stored', { 
        userId, 
        sessionId: session.session_id, 
        tokens: tokensUsed 
      });
    }

    return responseText;
  } catch (error) {
    logger.error('LLM API error', { error, model });
    throw new Error('Failed to get response from AI model');
  }
}

/**
 * Format timestamp as human-readable "time ago"
 */
function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) {
    return `${minutes} min ago`;
  } else if (hours < 24) {
    return `${hours} hr ago`;
  } else if (days < 7) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else {
    const months = Math.floor(days / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  }
}

export const chatTools: MCPTool[] = [
  {
    name: 'chat_send_message',
    description: 'Send a message to Bambi and get a response. Automatically saves conversation history if memory enabled.',
    inputSchema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'User message to send to Bambi',
        },
        userId: {
          type: 'string',
          description: 'User identifier for session tracking and memory (required)',
        },
        sessionId: {
          type: 'string',
          description: 'Optional session ID (auto-created if not provided)',
        },
        useMemory: {
          type: 'boolean',
          description: 'Whether to use conversation memory (default: true)',
          default: true,
        },
        tier: {
          type: 'string',
          enum: ['free', 'premium'],
          description: 'User subscription tier (determines model quality)',
          default: 'free',
        },
      },
      required: ['message', 'userId'],
    },
    execute: executeChatSendMessage,
  },
];
