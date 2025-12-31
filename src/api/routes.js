/**
 * BambiSleep™ Church MCP Control Tower
 * API Routes
 */

import { createServer } from 'http';
import { agentHandlers } from '../servers/agent.js';
import { clarityHandlers } from '../servers/clarity.js';
import { fetchHandlers } from '../servers/fetch.js';
import { githubHandlers } from '../servers/github.js';
import { huggingfaceHandlers } from '../servers/huggingface.js';
import { registry } from '../servers/index.js';
import { lmstudioHandlers } from '../servers/lmstudio.js';
import { memoryHandlers } from '../servers/memory.js';
import { mongoHandlers } from '../servers/mongodb.js';
import { puppeteerHandlers } from '../servers/puppeteer.js';
import { thinkingHandlers } from '../servers/sequential-thinking.js';
import { sqliteHandlers } from '../servers/sqlite.js';
import { storageHandlers } from '../servers/storage.js';
import { stripeHandlers } from '../servers/stripe.js';
import { getConfig } from '../utils/config.js';
import { createLogger } from '../utils/logger.js';
import { createRateLimiter, getRateLimitStats } from '../utils/rate-limit.js';
import { createWebSocketServer, getWebSocketStats } from './websocket.js';

const logger = createLogger('api');
const config = getConfig();

// WebSocket server instance (initialized in createApiServer)
let wss = null;

// Initialize rate limiter
const rateLimit = createRateLimiter({
  windowMs: config.rateLimit.windowMs,
  maxRequests: config.rateLimit.maxRequests,
  skipPaths: ['/api/health'],
});

/**
 * Parse JSON body from request
 */
async function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

/**
 * Send JSON response
 */
function json(res, data, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

/**
 * Route handler
 */
async function handleRequest(req, res) {
  // Apply rate limiting
  if (!rateLimit(req, res)) {
    return; // Rate limited, response already sent
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  const method = req.method;

  logger.debug(`${method} ${path}`);

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  // Health check
  if (path === '/api/health' && method === 'GET') {
    return json(res, { 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      env: config.env.nodeEnv,
    });
  }

  // Rate limit stats
  if (path === '/api/stats/rate-limit' && method === 'GET') {
    return json(res, getRateLimitStats());
  }

  // WebSocket stats
  if (path === '/api/stats/websocket' && method === 'GET') {
    return json(res, getWebSocketStats());
  }

  // Get all servers
  if (path === '/api/servers' && method === 'GET') {
    return json(res, {
      servers: registry.getAll(),
      stats: registry.getStats(),
    });
  }

  // Start a server
  const startMatch = path.match(/^\/api\/servers\/([^/]+)\/start$/);
  if (startMatch && method === 'POST') {
    const name = startMatch[1];
    const success = await registry.start(name);
    return json(res, { success, server: registry.get(name) }, success ? 200 : 400);
  }

  // Stop a server
  const stopMatch = path.match(/^\/api\/servers\/([^/]+)\/stop$/);
  if (stopMatch && method === 'POST') {
    const name = stopMatch[1];
    const success = registry.stop(name);
    return json(res, { success, server: registry.get(name) }, success ? 200 : 400);
  }

  // Get single server
  const serverMatch = path.match(/^\/api\/servers\/([^/]+)$/);
  if (serverMatch && method === 'GET') {
    const name = serverMatch[1];
    const server = registry.get(name);
    if (server) {
      return json(res, server);
    }
    return json(res, { error: 'Server not found' }, 404);
  }

  // ============ MEMORY MCP ROUTES ============
  
  // GET /api/memory - Read entire graph
  if (path === '/api/memory' && method === 'GET') {
    return json(res, memoryHandlers.readGraph());
  }

  // POST /api/memory/entities - Create entities
  if (path === '/api/memory/entities' && method === 'POST') {
    const body = await parseBody(req);
    const result = memoryHandlers.createEntities(body.entities || []);
    return json(res, { created: result });
  }

  // DELETE /api/memory/entities - Delete entities
  if (path === '/api/memory/entities' && method === 'DELETE') {
    const body = await parseBody(req);
    const result = memoryHandlers.deleteEntities(body.names || []);
    return json(res, { deleted: result });
  }

  // POST /api/memory/relations - Create relations
  if (path === '/api/memory/relations' && method === 'POST') {
    const body = await parseBody(req);
    const result = memoryHandlers.createRelations(body.relations || []);
    return json(res, { created: result });
  }

  // DELETE /api/memory/relations - Delete relations
  if (path === '/api/memory/relations' && method === 'DELETE') {
    const body = await parseBody(req);
    const result = memoryHandlers.deleteRelations(body.relations || []);
    return json(res, { deleted: result });
  }

  // GET /api/memory/search?q= - Search nodes
  if (path === '/api/memory/search' && method === 'GET') {
    const query = url.searchParams.get('q') || '';
    const result = memoryHandlers.searchNodes(query);
    return json(res, { results: result });
  }

  // ============ GITHUB MCP ROUTES ============

  // GET /api/github/user - Get authenticated user
  if (path === '/api/github/user' && method === 'GET') {
    try {
      const user = await githubHandlers.getUser();
      return json(res, user);
    } catch (error) {
      return json(res, { error: error.message }, 401);
    }
  }

  // GET /api/github/repos - List repos
  if (path === '/api/github/repos' && method === 'GET') {
    try {
      const repos = await githubHandlers.listRepos({
        perPage: parseInt(url.searchParams.get('per_page')) || 30,
        page: parseInt(url.searchParams.get('page')) || 1,
      });
      return json(res, repos);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // GET /api/github/search/repos?q= - Search repositories
  if (path === '/api/github/search/repos' && method === 'GET') {
    try {
      const query = url.searchParams.get('q') || '';
      const result = await githubHandlers.searchRepos(query);
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // ============ HUGGINGFACE MCP ROUTES ============

  // GET /api/huggingface/models?q= - Search models
  if (path === '/api/huggingface/models' && method === 'GET') {
    try {
      const query = url.searchParams.get('q') || '';
      const models = await huggingfaceHandlers.searchModels(query, {
        limit: parseInt(url.searchParams.get('limit')) || 20,
      });
      return json(res, models);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // GET /api/huggingface/datasets?q= - Search datasets
  if (path === '/api/huggingface/datasets' && method === 'GET') {
    try {
      const query = url.searchParams.get('q') || '';
      const datasets = await huggingfaceHandlers.searchDatasets(query, {
        limit: parseInt(url.searchParams.get('limit')) || 20,
      });
      return json(res, datasets);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // POST /api/huggingface/inference - Run inference
  if (path === '/api/huggingface/inference' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = await huggingfaceHandlers.inference(
        body.model,
        body.inputs,
        body.options || {}
      );
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // ============ LM STUDIO MCP ROUTES ============

  // GET /api/lmstudio/health - Test connection to LM Studio
  if (path === '/api/lmstudio/health' && method === 'GET') {
    try {
      const result = await lmstudioHandlers.testConnection();
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // GET /api/lmstudio/models - List available models
  if (path === '/api/lmstudio/models' && method === 'GET') {
    try {
      const result = await lmstudioHandlers.listModels();
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // GET /api/lmstudio/model/loaded - Get currently loaded model
  if (path === '/api/lmstudio/model/loaded' && method === 'GET') {
    try {
      const result = await lmstudioHandlers.selectLoadedModel();
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // POST /api/lmstudio/chat - Chat completion
  if (path === '/api/lmstudio/chat' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = await lmstudioHandlers.chat(body.messages, body.options);
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // POST /api/lmstudio/chat/tools - Chat with tool calling
  if (path === '/api/lmstudio/chat/tools' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = await lmstudioHandlers.chatWithTools(body.messages, body.tools, body.options);
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // POST /api/lmstudio/complete - Text completion
  if (path === '/api/lmstudio/complete' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = await lmstudioHandlers.complete(body.prompt, body.options);
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // POST /api/lmstudio/embed - Generate embeddings
  if (path === '/api/lmstudio/embed' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = await lmstudioHandlers.embed(body.input, body.options);
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // ============ STRIPE MCP ROUTES ============

  // GET /api/stripe/customers - List customers
  if (path === '/api/stripe/customers' && method === 'GET') {
    try {
      const result = await stripeHandlers.listCustomers({
        limit: parseInt(url.searchParams.get('limit')) || 10,
        email: url.searchParams.get('email'),
      });
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // POST /api/stripe/customers - Create customer
  if (path === '/api/stripe/customers' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = await stripeHandlers.createCustomer(body.email, body.name, body.metadata);
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // GET /api/stripe/products - List products
  if (path === '/api/stripe/products' && method === 'GET') {
    try {
      const result = await stripeHandlers.listProducts({
        limit: parseInt(url.searchParams.get('limit')) || 10,
      });
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // POST /api/stripe/products - Create product
  if (path === '/api/stripe/products' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = await stripeHandlers.createProduct(body.name, body.description, body.metadata);
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // GET /api/stripe/subscriptions - List subscriptions
  if (path === '/api/stripe/subscriptions' && method === 'GET') {
    try {
      const result = await stripeHandlers.listSubscriptions({
        limit: parseInt(url.searchParams.get('limit')) || 10,
        customer: url.searchParams.get('customer'),
      });
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // GET /api/stripe/balance - Get balance
  if (path === '/api/stripe/balance' && method === 'GET') {
    try {
      const result = await stripeHandlers.getBalance();
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // ============ FETCH MCP ROUTES ============

  // POST /api/fetch - Make HTTP request
  if (path === '/api/fetch' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = await fetchHandlers.get(body.url, body.options);
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // GET /api/fetch/ping?url= - Ping URL
  if (path === '/api/fetch/ping' && method === 'GET') {
    try {
      const targetUrl = url.searchParams.get('url');
      if (!targetUrl) {
        return json(res, { error: 'Missing url parameter' }, 400);
      }
      const result = await fetchHandlers.ping(targetUrl);
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // ============ SQLITE MCP ROUTES ============

  // GET /api/sqlite/tables - List tables
  if (path === '/api/sqlite/tables' && method === 'GET') {
    return json(res, { tables: sqliteHandlers.listTables() });
  }

  // POST /api/sqlite/tables - Create table
  if (path === '/api/sqlite/tables' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = sqliteHandlers.createTable(body.name, body.columns);
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 400);
    }
  }

  // GET /api/sqlite/stats - Get stats
  if (path === '/api/sqlite/stats' && method === 'GET') {
    return json(res, sqliteHandlers.getStats());
  }

  // POST /api/sqlite/query - Execute query
  if (path === '/api/sqlite/query' && method === 'POST') {
    try {
      const body = await parseBody(req);
      if (body.sql) {
        const result = sqliteHandlers.execute(body.sql);
        return json(res, { result });
      }
      if (body.table) {
        const result = sqliteHandlers.select(body.table, body.options || {});
        return json(res, { rows: result });
      }
      return json(res, { error: 'Missing sql or table parameter' }, 400);
    } catch (error) {
      return json(res, { error: error.message }, 400);
    }
  }

  // POST /api/sqlite/insert - Insert row
  if (path === '/api/sqlite/insert' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = sqliteHandlers.insert(body.table, body.data);
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 400);
    }
  }

  // ============ MONGODB MCP ROUTES ============

  // POST /api/mongodb/connect - Connect to MongoDB
  if (path === '/api/mongodb/connect' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = await mongoHandlers.connect(body.database);
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // POST /api/mongodb/disconnect - Disconnect
  if (path === '/api/mongodb/disconnect' && method === 'POST') {
    try {
      const result = await mongoHandlers.disconnect();
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // GET /api/mongodb/info - Get connection info
  if (path === '/api/mongodb/info' && method === 'GET') {
    return json(res, mongoHandlers.getConnectionInfo());
  }

  // GET /api/mongodb/databases - List databases
  if (path === '/api/mongodb/databases' && method === 'GET') {
    try {
      const databases = await mongoHandlers.listDatabases();
      return json(res, { databases });
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // GET /api/mongodb/collections - List collections
  if (path === '/api/mongodb/collections' && method === 'GET') {
    try {
      const collections = await mongoHandlers.listCollections();
      return json(res, { collections });
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // POST /api/mongodb/find - Find documents
  if (path === '/api/mongodb/find' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const docs = await mongoHandlers.find(
        body.collection,
        body.filter || {},
        body.options || {}
      );
      return json(res, { documents: docs, count: docs.length });
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // POST /api/mongodb/findOne - Find one document
  if (path === '/api/mongodb/findOne' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const doc = await mongoHandlers.findOne(
        body.collection,
        body.filter || {},
        body.options || {}
      );
      return json(res, { document: doc });
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // POST /api/mongodb/insertOne - Insert one document
  if (path === '/api/mongodb/insertOne' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = await mongoHandlers.insertOne(body.collection, body.document);
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // POST /api/mongodb/insertMany - Insert many documents
  if (path === '/api/mongodb/insertMany' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = await mongoHandlers.insertMany(body.collection, body.documents);
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // POST /api/mongodb/updateOne - Update one document
  if (path === '/api/mongodb/updateOne' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = await mongoHandlers.updateOne(
        body.collection,
        body.filter,
        body.update,
        body.options
      );
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // POST /api/mongodb/updateMany - Update many documents
  if (path === '/api/mongodb/updateMany' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = await mongoHandlers.updateMany(
        body.collection,
        body.filter,
        body.update,
        body.options
      );
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // POST /api/mongodb/deleteOne - Delete one document
  if (path === '/api/mongodb/deleteOne' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = await mongoHandlers.deleteOne(body.collection, body.filter);
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // POST /api/mongodb/deleteMany - Delete many documents
  if (path === '/api/mongodb/deleteMany' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = await mongoHandlers.deleteMany(body.collection, body.filter);
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // POST /api/mongodb/aggregate - Run aggregation pipeline
  if (path === '/api/mongodb/aggregate' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = await mongoHandlers.aggregate(
        body.collection,
        body.pipeline,
        body.options
      );
      return json(res, { results: result });
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // POST /api/mongodb/count - Count documents
  if (path === '/api/mongodb/count' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const count = await mongoHandlers.countDocuments(body.collection, body.filter || {});
      return json(res, { count });
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // GET /api/mongodb/stats - Get database stats
  if (path === '/api/mongodb/stats' && method === 'GET') {
    try {
      const stats = await mongoHandlers.databaseStats();
      return json(res, stats);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // ============ PUPPETEER MCP ROUTES ============

  // GET /api/puppeteer/status - Get browser status
  if (path === '/api/puppeteer/status' && method === 'GET') {
    return json(res, puppeteerHandlers.getStatus());
  }

  // POST /api/puppeteer/launch - Launch browser
  if (path === '/api/puppeteer/launch' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = await puppeteerHandlers.launch(body);
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // POST /api/puppeteer/navigate - Navigate to URL
  if (path === '/api/puppeteer/navigate' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = await puppeteerHandlers.navigate(body.url, body.options);
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // POST /api/puppeteer/screenshot - Take screenshot
  if (path === '/api/puppeteer/screenshot' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = await puppeteerHandlers.screenshot(body);
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // POST /api/puppeteer/close - Close browser
  if (path === '/api/puppeteer/close' && method === 'POST') {
    try {
      const result = await puppeteerHandlers.close();
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // ============ STORAGE MCP ROUTES ============

  // GET /api/storage/status - Get storage status
  if (path === '/api/storage/status' && method === 'GET') {
    return json(res, storageHandlers.getStatus());
  }

  // POST /api/storage/connect - Initialize storage
  if (path === '/api/storage/connect' && method === 'POST') {
    try {
      const result = await storageHandlers.connect();
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // GET /api/storage/files - List all files
  if (path === '/api/storage/files' && method === 'GET') {
    try {
      const folder = url.searchParams.get('folder') || 'all';
      const result = await storageHandlers.listFiles(folder);
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // GET /api/storage/images - List images
  if (path === '/api/storage/images' && method === 'GET') {
    try {
      const result = await storageHandlers.listImages();
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // GET /api/storage/videos - List videos
  if (path === '/api/storage/videos' && method === 'GET') {
    try {
      const result = await storageHandlers.listVideos();
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // GET /api/storage/stats - Get storage statistics
  if (path === '/api/storage/stats' && method === 'GET') {
    try {
      const result = await storageHandlers.getStats();
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // POST /api/storage/upload - Upload file
  if (path === '/api/storage/upload' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const { filename, content, type, encoding } = body;
      let result;
      if (type === 'image') {
        result = await storageHandlers.uploadImage(filename, content);
      } else if (type === 'video') {
        result = await storageHandlers.uploadVideo(filename, content);
      } else {
        result = await storageHandlers.uploadFile(filename, content, encoding || 'base64');
      }
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // GET /api/storage/file/:folder/:filename - Download file
  const storageFileMatch = path.match(/^\/api\/storage\/file\/([^/]+)\/([^/]+)$/);
  if (storageFileMatch && method === 'GET') {
    try {
      const folder = storageFileMatch[1];
      const filename = decodeURIComponent(storageFileMatch[2]);
      const encoding = url.searchParams.get('encoding') || 'base64';
      const content = await storageHandlers.downloadFile(filename, folder, encoding);
      return json(res, { filename, folder, content, encoding });
    } catch (error) {
      return json(res, { error: error.message }, 404);
    }
  }

  // GET /api/storage/info/:folder/:filename - Get file info
  const storageInfoMatch = path.match(/^\/api\/storage\/info\/([^/]+)\/([^/]+)$/);
  if (storageInfoMatch && method === 'GET') {
    try {
      const folder = storageInfoMatch[1];
      const filename = decodeURIComponent(storageInfoMatch[2]);
      const info = await storageHandlers.getFileInfo(filename, folder);
      return json(res, info);
    } catch (error) {
      return json(res, { error: error.message }, 404);
    }
  }

  // DELETE /api/storage/file/:folder/:filename - Delete file
  const storageDeleteMatch = path.match(/^\/api\/storage\/file\/([^/]+)\/([^/]+)$/);
  if (storageDeleteMatch && method === 'DELETE') {
    try {
      const folder = storageDeleteMatch[1];
      const filename = decodeURIComponent(storageDeleteMatch[2]);
      const result = await storageHandlers.deleteFile(filename, folder);
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // ============ SEQUENTIAL THINKING MCP ROUTES ============

  // GET /api/thinking/sessions - List thinking sessions
  if (path === '/api/thinking/sessions' && method === 'GET') {
    return json(res, { sessions: thinkingHandlers.listSessions() });
  }

  // POST /api/thinking/sessions - Start new session
  if (path === '/api/thinking/sessions' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = thinkingHandlers.startSession(body.title, body.description);
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 400);
    }
  }

  // GET /api/thinking/sessions/:id - Get session
  const thinkingSessionMatch = path.match(/^\/api\/thinking\/sessions\/([^/]+)$/);
  if (thinkingSessionMatch && method === 'GET') {
    try {
      const session = thinkingHandlers.getSession(thinkingSessionMatch[1]);
      return json(res, session);
    } catch (error) {
      return json(res, { error: error.message }, 404);
    }
  }

  // POST /api/thinking/sessions/:id/thought - Add thought
  const thoughtMatch = path.match(/^\/api\/thinking\/sessions\/([^/]+)\/thought$/);
  if (thoughtMatch && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = thinkingHandlers.addThought(thoughtMatch[1], body);
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 400);
    }
  }

  // POST /api/thinking/sessions/:id/conclude - Conclude session
  const concludeMatch = path.match(/^\/api\/thinking\/sessions\/([^/]+)\/conclude$/);
  if (concludeMatch && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = thinkingHandlers.conclude(concludeMatch[1], body.answer);
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 400);
    }
  }

  // GET /api/thinking/stats - Get thinking stats
  if (path === '/api/thinking/stats' && method === 'GET') {
    return json(res, thinkingHandlers.getStats());
  }

  // ============ CLARITY ANALYTICS MCP ROUTES ============

  // POST /api/clarity/init - Initialize Clarity
  if (path === '/api/clarity/init' && method === 'POST') {
    return json(res, clarityHandlers.init());
  }

  // GET /api/clarity/info - Get Clarity info
  if (path === '/api/clarity/info' && method === 'GET') {
    return json(res, clarityHandlers.getInfo());
  }

  // GET /api/clarity/dashboard - Get dashboard data
  if (path === '/api/clarity/dashboard' && method === 'GET') {
    return json(res, clarityHandlers.getDashboardData());
  }

  // POST /api/clarity/identify - Identify user
  if (path === '/api/clarity/identify' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = clarityHandlers.identify(
        body.customId,
        body.customSessionId,
        body.customPageId,
        body.friendlyName
      );
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 400);
    }
  }

  // POST /api/clarity/tag - Set custom tag
  if (path === '/api/clarity/tag' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = clarityHandlers.setTag(body.key, body.value);
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 400);
    }
  }

  // POST /api/clarity/event - Track custom event
  if (path === '/api/clarity/event' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = clarityHandlers.event(body.eventName, body.data || {});
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 400);
    }
  }

  // POST /api/clarity/pageview - Track page view
  if (path === '/api/clarity/pageview' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = clarityHandlers.pageView(body.path, body.data || {});
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 400);
    }
  }

  // POST /api/clarity/upgrade - Upgrade session
  if (path === '/api/clarity/upgrade' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = clarityHandlers.upgrade(body.reason);
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 400);
    }
  }

  // POST /api/clarity/consent - Set consent
  if (path === '/api/clarity/consent' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = clarityHandlers.consent(body.options);
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 400);
    }
  }

  // GET /api/clarity/sessions - List sessions
  if (path === '/api/clarity/sessions' && method === 'GET') {
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const offset = parseInt(url.searchParams.get('offset')) || 0;
    return json(res, clarityHandlers.listSessions({ limit, offset }));
  }

  // GET /api/clarity/sessions/:id - Get session by ID
  const claritySessionMatch = path.match(/^\/api\/clarity\/sessions\/([^/]+)$/);
  if (claritySessionMatch && method === 'GET') {
    try {
      const result = clarityHandlers.getSession(claritySessionMatch[1]);
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 404);
    }
  }

  // GET /api/clarity/events - Get event history
  if (path === '/api/clarity/events' && method === 'GET') {
    const limit = parseInt(url.searchParams.get('limit')) || 50;
    const eventType = url.searchParams.get('type');
    return json(res, clarityHandlers.getEventHistory({ limit, eventType }));
  }

  // GET /api/clarity/top-events - Get top events
  if (path === '/api/clarity/top-events' && method === 'GET') {
    const limit = parseInt(url.searchParams.get('limit')) || 10;
    return json(res, clarityHandlers.getTopEvents(limit));
  }

  // GET /api/clarity/top-pages - Get top pages
  if (path === '/api/clarity/top-pages' && method === 'GET') {
    const limit = parseInt(url.searchParams.get('limit')) || 10;
    return json(res, clarityHandlers.getTopPages(limit));
  }

  // POST /api/clarity/reset - Reset analytics data
  if (path === '/api/clarity/reset' && method === 'POST') {
    return json(res, clarityHandlers.reset());
  }

  // ============ AGENT ORCHESTRATOR ROUTES ============

  // POST /api/agent/chat - Send message to agent
  if (path === '/api/agent/chat' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = await agentHandlers.chat(
        body.message,
        body.conversationId,
        body.options || {}
      );
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 400);
    }
  }

  // GET /api/agent/tools - List available tools
  if (path === '/api/agent/tools' && method === 'GET') {
    return json(res, { tools: agentHandlers.getTools() });
  }

  // POST /api/agent/tools/execute - Execute a tool directly
  if (path === '/api/agent/tools/execute' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = await agentHandlers.executeTool(body.tool, body.args || {});
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 400);
    }
  }

  // GET /api/agent/stats - Get agent statistics
  if (path === '/api/agent/stats' && method === 'GET') {
    return json(res, agentHandlers.getStats());
  }

  // GET /api/agent/config - Get agent configuration
  if (path === '/api/agent/config' && method === 'GET') {
    return json(res, agentHandlers.getConfig());
  }

  // POST /api/agent/config - Update agent configuration
  if (path === '/api/agent/config' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = agentHandlers.setConfig(body);
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 400);
    }
  }

  // GET /api/agent/personality - Get agent personality info
  if (path === '/api/agent/personality' && method === 'GET') {
    return json(res, agentHandlers.getPersonality());
  }

  // POST /api/agent/initialize - Initialize agent and connect to LM Studio
  if (path === '/api/agent/initialize' && method === 'POST') {
    try {
      const connected = await agentHandlers.initialize();
      return json(res, { success: connected, connected });
    } catch (error) {
      return json(res, { error: error.message, connected: false }, 500);
    }
  }

  // POST /api/agent/conversations - Create new conversation
  if (path === '/api/agent/conversations' && method === 'POST') {
    return json(res, agentHandlers.createConversation());
  }

  // GET /api/agent/conversations - List conversations
  if (path === '/api/agent/conversations' && method === 'GET') {
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    return json(res, agentHandlers.listConversations(limit));
  }

  // DELETE /api/agent/conversations - Clear all conversations
  if (path === '/api/agent/conversations' && method === 'DELETE') {
    return json(res, agentHandlers.clearConversations());
  }

  // GET /api/agent/conversations/:id - Get conversation by ID
  const agentConvMatch = path.match(/^\/api\/agent\/conversations\/([^/]+)$/);
  if (agentConvMatch && method === 'GET') {
    try {
      const result = agentHandlers.getConversation(agentConvMatch[1]);
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 404);
    }
  }

  // DELETE /api/agent/conversations/:id - Delete conversation
  if (agentConvMatch && method === 'DELETE') {
    return json(res, agentHandlers.deleteConversation(agentConvMatch[1]));
  }

  // 404 for unknown routes
  return json(res, { error: 'Not found' }, 404);
}

/**
 * Create and start API server with WebSocket support
 * @param {number} port - Port number from API_PORT env var
 * @param {string} host - Host from API_HOST env var
 */
export function createApiServer(port, host) {
  if (!port) throw new Error('API_PORT is required - check .env configuration');
  if (!host) throw new Error('API_HOST is required - check .env configuration');
  
  const server = createServer(handleRequest);

  // Initialize WebSocket server
  wss = createWebSocketServer(server);

  server.listen(port, host, () => {
    logger.info(`API server running at http://${host}:${port}`);
    logger.info(`WebSocket server available at ws://${host}:${port}/ws`);
  });

  return server;
}

export default createApiServer;
