/**
 * ⚡ Avatar Tools - Unity Avatar Control
 * MCP tools for controlling Unity avatar state
 */

import { z } from 'zod';
import { sendToUnity } from '../services/unity-bridge.js';

interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  execute: (args: any) => Promise<any>;
}

const SetEmotionSchema = z.object({
  emotion: z.enum(['idle', 'happy', 'concerned', 'playful', 'thinking', 'surprised']),
  intensity: z.number().min(0).max(1).default(0.8),
});

const TriggerAnimationSchema = z.object({
  animation: z.string().describe('Animation name to trigger'),
  duration: z.number().optional().describe('Animation duration in seconds'),
});

/**
 * Set avatar emotional state
 */
async function executeSetEmotion(args: z.infer<typeof SetEmotionSchema>): Promise<string> {
  const { emotion, intensity } = args;

  await sendToUnity({
    type: 'emotion',
    data: { emotion, intensity },
  });

  return `Avatar emotion set to ${emotion} (intensity: ${intensity})`;
}

/**
 * Trigger specific animation
 */
async function executeTriggerAnimation(args: z.infer<typeof TriggerAnimationSchema>): Promise<string> {
  const { animation, duration } = args;

  await sendToUnity({
    type: 'animation',
    data: { animation, duration },
  });

  return `Animation ${animation} triggered`;
}

export const avatarTools: MCPTool[] = [
  {
    name: 'avatar_set_emotion',
    description: 'Set the Unity avatar emotional state and visual appearance',
    inputSchema: {
      type: 'object',
      properties: {
        emotion: {
          type: 'string',
          enum: ['idle', 'happy', 'concerned', 'playful', 'thinking', 'surprised'],
          description: 'Emotion state to display',
        },
        intensity: {
          type: 'number',
          minimum: 0,
          maximum: 1,
          description: 'Intensity of the emotion (0.0 to 1.0)',
        },
      },
      required: ['emotion'],
    },
    execute: executeSetEmotion,
  },
  {
    name: 'avatar_trigger_animation',
    description: 'Trigger a specific animation on the Unity avatar',
    inputSchema: {
      type: 'object',
      properties: {
        animation: {
          type: 'string',
          description: 'Animation name (e.g., "wave", "nod", "headTilt")',
        },
        duration: {
          type: 'number',
          description: 'Optional duration in seconds',
        },
      },
      required: ['animation'],
    },
    execute: executeTriggerAnimation,
  },
];
