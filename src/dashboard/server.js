/**
 * BambiSleep™ Church MCP Control Tower
 * Dashboard HTTP Server
 */

import { existsSync, readFileSync } from 'fs';
import { createServer } from 'http';
import { dirname, extname, join } from 'path';
import { fileURLToPath } from 'url';
import { createLogger } from '../utils/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const logger = createLogger('dashboard');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

/**
 * Serve static files from dashboard directory
 */
function serveStatic(req, res) {
  let filePath = req.url === '/' ? '/index.html' : req.url;
  const fullPath = join(__dirname, filePath);

  if (!existsSync(fullPath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    return res.end('Not Found');
  }

  const ext = extname(fullPath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  try {
    const content = readFileSync(fullPath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (error) {
    logger.error('Failed to serve file:', error.message);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
}

/**
 * Create and start dashboard server
 * @param {number} port - Port number from DASHBOARD_PORT env var
 * @param {string} host - Host from DASHBOARD_HOST env var
 */
export function createDashboardServer(port, host) {
  if (!port) throw new Error('DASHBOARD_PORT is required - check .env configuration');
  if (!host) throw new Error('DASHBOARD_HOST is required - check .env configuration');
  
  const server = createServer(serveStatic);

  server.listen(port, host, () => {
    logger.info(`Dashboard running at http://${host}:${port}`);
  });

  return server;
}

export default createDashboardServer;
