/**
 * 🌸 BambiSleep MCP Server - Main Entry Point
 * CyberNeonGothWave Digital Sanctuary Control Tower
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest,
  type ListToolsRequest,
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { chatTools } from './tools/chat.js';
import { avatarTools } from './tools/avatar.js';
import { memoryTools } from './tools/memory.js';
import { privacyTools } from './tools/privacy.js';
import { SafetyFilter } from './middleware/safety.js';
import { startUnityBridge } from './services/unity-bridge.js';
import { logger } from './utils/logger.js';

dotenv.config();

const server = new Server(
  {
    name: 'bambisleep-church-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

// Initialize safety filter
const safetyFilter = new SafetyFilter();

// Combine all tool definitions (Phase 5: Added privacy tools)
const allTools = [...chatTools, ...avatarTools, ...memoryTools, ...privacyTools];

/**
 * Handle tool list requests
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  logger.info('Listing available MCP tools');
  return {
    tools: allTools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  };
});

/**
 * Handle tool execution requests with safety filtering
 */
server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
  const { name, arguments: args } = request.params;

  logger.info(`Tool called: ${name}`, { args });

  try {
    // Find the tool
    const tool = allTools.find((t) => t.name === name);
    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }

    // Apply safety filtering for chat tools
    if (name === 'chat_send_message' && args && 'message' in args) {
      const safetyResult = await safetyFilter.validate(
        args.message as string,
        args.conversationHistory as any[] || []
      );

      if (!safetyResult.safe) {
        logger.warn('Safety violation detected', {
          violation: safetyResult.violation,
          message: args.message,
        });

        return {
          content: [
            {
              type: 'text',
              text: safetyResult.redirectResponse || 
                    "I can't go there with you, babe. 🌸 Let's talk about something else? ⚡",
            },
          ],
        };
      }
    }

    // Execute the tool
    const result = await tool.execute(args);

    return {
      content: [
        {
          type: 'text',
          text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    logger.error('Tool execution error', { name, error });
    
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
});

/**
 * Start the server
 */
async function main() {
  logger.info('🌸 Starting BambiSleep MCP Control Tower...');
  
  // Start Unity WebSocket bridge
  const unityPort = parseInt(process.env.UNITY_WS_PORT || '3001');
  startUnityBridge(unityPort);
  
  // Start MCP server
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  logger.info('⚡ MCP Server ready! CyberNeonGothWave sanctuary online. 💎');
}

// Error handlers
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  logger.error('Unhandled promise rejection', { reason, promise });
  process.exit(1);
});

// Start server
main().catch((error) => {
  logger.error('Failed to start server', { error });
  process.exit(1);
});
