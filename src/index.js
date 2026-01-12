/**
 * BambiSleep™ Church MCP Control Tower
 * Main Entry Point
 */

import 'dotenv/config';

import { createApiServer } from './api/routes.js';
import { createDashboardServer } from './dashboard/server.js';
import { registry } from './servers/index.js';
import { getConfig } from './utils/config.js';
import { createLogger } from './utils/logger.js';

const logger = createLogger('main');

/**
 * Load and validate environment variables
 */
function loadEnvironment() {
  const env = {
    // Server Ports
    API_PORT: process.env.API_PORT || '8080',
    DASHBOARD_PORT: process.env.DASHBOARD_PORT || '3000',
    
    // Logging
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    
    // Database
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    
    // Storage
    STORAGE_DIR: process.env.STORAGE_DIR || './data/storage',
    
    // LM Studio
    LMS_HOST: process.env.LMS_HOST || 'localhost',
    LMS_PORT: process.env.LMS_PORT || '1234',
    
    // Kokoro TTS
    KOKORO_URL: process.env.KOKORO_URL || 'http://192.168.0.122:8880',
    
    // API Keys (optional)
    GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
    PATREON_ACCESS_TOKEN: process.env.PATREON_ACCESS_TOKEN || '',
    HUGGINGFACE_TOKEN: process.env.HUGGINGFACE_TOKEN || '',
    CLARITY_PROJECT_ID: process.env.CLARITY_PROJECT_ID || '',
  };

  // Log loaded environment (without secrets)
  logger.info('Environment variables loaded:');
  logger.info(`  API Port: ${env.API_PORT}`);
  logger.info(`  Dashboard Port: ${env.DASHBOARD_PORT}`);
  logger.info(`  Log Level: ${env.LOG_LEVEL}`);
  logger.info(`  MongoDB URI: ${env.MONGODB_URI.replace(/\/\/.*@/, '//***@')}`);
  logger.info(`  LM Studio: ${env.LMS_HOST}:${env.LMS_PORT}`);
  logger.info(`  Kokoro TTS: ${env.KOKORO_URL}`);
  logger.info(`  GitHub Token: ${env.GITHUB_TOKEN ? '✅ Set' : '❌ Not set'}`);
  logger.info(`  Stripe Key: ${env.STRIPE_SECRET_KEY ? '✅ Set' : '❌ Not set'}`);
  logger.info(`  Patreon Token: ${env.PATREON_ACCESS_TOKEN ? '✅ Set' : '❌ Not set'}`);
  logger.info(`  HuggingFace Token: ${env.HUGGINGFACE_TOKEN ? '✅ Set' : '❌ Not set'}`);
  logger.info(`  Clarity Project: ${env.CLARITY_PROJECT_ID ? '✅ Set' : '❌ Not set'}`);

  return env;
}

/**
 * Graceful shutdown handler
 */
function setupShutdown(apiServer, dashboardServer) {
  const shutdown = (signal) => {
    logger.info(`Received ${signal}, shutting down...`);
    
    registry.stopAll();
    
    apiServer.close(() => logger.info('API server closed'));
    dashboardServer.close(() => logger.info('Dashboard server closed'));
    
    setTimeout(() => process.exit(0), 1000);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

/**
 * Main application startup
 */
async function main() {
  console.log(`
🌸✨ BambiSleep™ Church MCP Control Tower ✨🌸
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);

  // Load and validate environment variables
  const env = loadEnvironment();

  // Load configuration
  const config = getConfig();
  logger.info('Configuration loaded');

  // Load MCP servers from config
  logger.info('Loading MCP server configurations...');
  registry.loadFromConfig(config.mcp.servers);
  
  const stats = registry.getStats();
  logger.info(`MCP Servers: ${stats.total} configured`);

  // Log server types
  const servers = registry.getAll();
  const serverTypes = {
    memory: ['memory'],
    database: ['mongodb', 'sqlite'],
    integration: ['github', 'huggingface', 'stripe', 'patreon', 'clarity'],
    tools: ['puppeteer', 'fetch', 'storage', 'sequential-thinking'],
    ai: ['lmstudio', 'bambisleep-chat', 'agent'],
  };

  logger.info('Server breakdown by category:');
  for (const [category, types] of Object.entries(serverTypes)) {
    const count = servers.filter(s => types.some(t => s.name.toLowerCase().includes(t))).length;
    if (count > 0) {
      logger.info(`  ${category}: ${count} server(s)`);
    }
  }

  // Start API server
  logger.info('Starting API server...');
  const apiServer = createApiServer(config.api.port, config.api.host);

  // Start Dashboard server
  logger.info('Starting Dashboard server...');
  const dashboardServer = createDashboardServer(config.dashboard.port, config.dashboard.host);

  // Setup graceful shutdown
  setupShutdown(apiServer, dashboardServer);

  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.info('🌸 MCP Control Tower is ready! 🌸');
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.info(`📊 Dashboard: http://localhost:${config.dashboard.port}`);
  logger.info(`🔌 API:       http://localhost:${config.api.port}/api`);
  logger.info(`📚 API Docs:  http://localhost:${config.api.port}/api/docs`);
  logger.info(`📊 Metrics:   http://localhost:${config.api.port}/api/metrics`);
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Auto-start all MCP servers
  logger.info('Auto-starting all MCP servers...');
  const startResults = await registry.startAll();
  
  // Log results by status
  if (startResults.started.length > 0) {
    logger.info(`✅ Started (${startResults.started.length}): ${startResults.started.join(', ')}`);
  }
  if (startResults.failed.length > 0) {
    logger.warn(`❌ Failed (${startResults.failed.length}): ${startResults.failed.join(', ')}`);
  }

  // Log critical service status
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.info('Critical Services Status:');
  logger.info(`  Memory Graph: ${startResults.started.includes('memory') ? '✅' : '❌'}`);
  logger.info(`  GitHub: ${startResults.started.includes('github') ? '✅' : '⚠️ Optional'}`);
  logger.info(`  LM Studio: ${startResults.started.includes('lmstudio') ? '✅' : '⚠️ Optional'}`);
  logger.info(`  Patreon: ${startResults.started.includes('patreon') ? '✅' : '⚠️ Optional'}`);
  logger.info(`  BambiSleep: ${startResults.started.includes('bambisleep-chat') ? '✅' : '⚠️ Optional'}`);
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  logger.info('🌸 All systems operational! Ready to serve. 🌸');
}

main().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});
