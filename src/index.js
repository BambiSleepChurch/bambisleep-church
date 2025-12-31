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

  // Load configuration
  const config = getConfig();
  logger.info('Configuration loaded');

  // Load MCP servers from config
  registry.loadFromConfig(config.mcp.servers);
  
  const stats = registry.getStats();
  logger.info(`MCP Servers: ${stats.total} configured`);

  // Start API server
  const apiServer = createApiServer(config.api.port, config.api.host);

  // Start Dashboard server
  const dashboardServer = createDashboardServer(config.dashboard.port, config.dashboard.host);

  // Setup graceful shutdown
  setupShutdown(apiServer, dashboardServer);

  logger.info('MCP Control Tower is ready! 🌸');
  logger.info(`Dashboard: http://localhost:${config.dashboard.port}`);
  logger.info(`API:       http://localhost:${config.api.port}/api`);
}

main().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});
