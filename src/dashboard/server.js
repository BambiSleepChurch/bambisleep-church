/**
 * BambiSleep™ Church MCP Control Tower
 * Dashboard HTTP Server (Port 3000)
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
 */
export function createDashboardServer(port = 3000, host = '0.0.0.0') {
  const server = createServer(serveStatic);

  server.listen(port, host, () => {
    logger.info(`Dashboard running at http://${host}:${port}`);
  });

  return server;
}

export default createDashboardServer;
