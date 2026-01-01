/**
 * BambiSleep™ Church MCP Control Tower
 * API Routes
 */

import { readdir, readFile } from 'fs/promises';
import { createServer } from 'http';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { agentHandlers } from '../servers/agent.js';
import { bambisleepChatHandlers } from '../servers/bambisleep-chat.js';
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

  // Get all servers and integrated handlers
  if (path === '/api/servers' && method === 'GET') {
    const mcpServers = registry.getAll();
    const stats = registry.getStats();
    
    // Add integrated handlers that don't spawn external processes
    const integratedHandlers = [
      { name: 'storage', status: 'running', type: 'integrated', description: 'Local file storage' },
      { name: 'clarity', status: 'running', type: 'integrated', description: 'Microsoft Clarity analytics' },
      { name: 'lmstudio', status: 'running', type: 'integrated', description: 'LM Studio LLM integration' },
      { name: 'agent', status: 'running', type: 'integrated', description: 'Agent orchestrator' },
      { name: 'bambisleep-chat', status: 'running', type: 'integrated', description: 'BambiSleep chat triggers & TTS' },
    ];
    
    // Combine MCP servers with integrated handlers
    const allServers = [
      ...mcpServers.map(s => ({ ...s, type: 'mcp' })),
      ...integratedHandlers,
    ];
    
    return json(res, {
      servers: allServers,
      stats: {
        ...stats,
        total: stats.total + integratedHandlers.length,
        running: stats.running + integratedHandlers.length,
        integrated: integratedHandlers.length,
      },
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

  // GET /api/lmstudio/status - Get connection status and config
  if (path === '/api/lmstudio/status' && method === 'GET') {
    try {
      const result = lmstudioHandlers.getStatus();
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // GET /api/lmstudio/server - Get full server status
  if (path === '/api/lmstudio/server' && method === 'GET') {
    try {
      const result = await lmstudioHandlers.getServerStatus();
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // GET /api/lmstudio/models - List loaded models
  if (path === '/api/lmstudio/models' && method === 'GET') {
    try {
      const result = await lmstudioHandlers.listModels();
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // GET /api/lmstudio/models/downloaded - List all downloaded models
  if (path === '/api/lmstudio/models/downloaded' && method === 'GET') {
    try {
      const result = await lmstudioHandlers.listDownloadedModels();
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

  // POST /api/lmstudio/model/select - Select a loaded model
  if (path === '/api/lmstudio/model/select' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = await lmstudioHandlers.selectLoadedModel(body.modelName);
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // POST /api/lmstudio/model/load - Load a specific model
  if (path === '/api/lmstudio/model/load' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = await lmstudioHandlers.loadModel(body.modelId, body.options || {});
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // POST /api/lmstudio/model/unload - Unload a model
  if (path === '/api/lmstudio/model/unload' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = await lmstudioHandlers.unloadModel(body.modelId);
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // POST /api/lmstudio/model/autoload - Auto-load best available model
  if (path === '/api/lmstudio/model/autoload' && method === 'POST') {
    try {
      const result = await lmstudioHandlers.autoLoadModel();
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // GET /api/lmstudio/model/:id/info - Get model info
  const lmModelInfoMatch = path.match(/^\/api\/lmstudio\/model\/([^/]+)\/info$/);
  if (lmModelInfoMatch && method === 'GET') {
    try {
      const modelId = decodeURIComponent(lmModelInfoMatch[1]);
      const result = await lmstudioHandlers.getModelInfo(modelId);
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

  // POST /api/lmstudio/chat/v0 - Chat using REST API v0 with enhanced stats
  if (path === '/api/lmstudio/chat/v0' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = await lmstudioHandlers.chatV0(body.messages, body.options);
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

  // POST /api/lmstudio/chat/image - Chat with image input (vision)
  if (path === '/api/lmstudio/chat/image' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = await lmstudioHandlers.chatWithImage(body.text, body.images, body.options);
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // POST /api/lmstudio/chat/structured - Chat with structured JSON output
  if (path === '/api/lmstudio/chat/structured' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = await lmstudioHandlers.chatStructured(body.messages, body.schema, body.options);
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // POST /api/lmstudio/complete - Text completion
  if (path === '/api/lmstudio/complete' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = await lmstudioHandlers.completeV0(body.prompt, body.options);
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

  // POST /api/lmstudio/embeddings - Get multiple embeddings
  if (path === '/api/lmstudio/embeddings' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = await lmstudioHandlers.getEmbeddings(body.texts, body.options);
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // POST /api/lmstudio/similar - Find similar texts
  if (path === '/api/lmstudio/similar' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = await lmstudioHandlers.findSimilar(body.query, body.candidates, body.options);
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // POST /api/lmstudio/describe - Describe a single image
  if (path === '/api/lmstudio/describe' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = await lmstudioHandlers.describeImage(body.image, body.prompt, body.options);
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // POST /api/lmstudio/analyze - Analyze multiple images
  if (path === '/api/lmstudio/analyze' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = await lmstudioHandlers.analyzeImages(body.images, body.question, body.options);
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

  // POST /api/fetch - Make HTTP GET request
  if (path === '/api/fetch' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = await fetchHandlers.get(body.url, body.options);
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // POST /api/fetch/post - Make HTTP POST request
  if (path === '/api/fetch/post' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = await fetchHandlers.post(body.url, body.body, body.options);
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // POST /api/fetch/put - Make HTTP PUT request
  if (path === '/api/fetch/put' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = await fetchHandlers.put(body.url, body.body, body.options);
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // POST /api/fetch/patch - Make HTTP PATCH request
  if (path === '/api/fetch/patch' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = await fetchHandlers.patch(body.url, body.body, body.options);
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // POST /api/fetch/delete - Make HTTP DELETE request
  if (path === '/api/fetch/delete' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = await fetchHandlers.delete(body.url, body.options);
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // POST /api/fetch/head - Make HTTP HEAD request
  if (path === '/api/fetch/head' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = await fetchHandlers.head(body.url, body.options);
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

  // POST /api/fetch/download - Download file as base64
  if (path === '/api/fetch/download' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = await fetchHandlers.downloadBase64(body.url);
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // POST /api/fetch/feed - Fetch RSS/Atom feed
  if (path === '/api/fetch/feed' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = await fetchHandlers.fetchFeed(body.url);
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

  // POST /api/puppeteer/click - Click element
  if (path === '/api/puppeteer/click' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = await puppeteerHandlers.click(body.selector, body.options);
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // POST /api/puppeteer/type - Type text
  if (path === '/api/puppeteer/type' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = await puppeteerHandlers.type(body.selector, body.text, body.options);
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // POST /api/puppeteer/evaluate - Execute JavaScript
  if (path === '/api/puppeteer/evaluate' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = await puppeteerHandlers.evaluate(body.script);
      return json(res, { success: true, result });
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // GET /api/puppeteer/content - Get page content
  if (path === '/api/puppeteer/content' && method === 'GET') {
    try {
      const content = await puppeteerHandlers.getContent();
      return json(res, { success: true, content });
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // POST /api/puppeteer/content - Get page content with selector
  if (path === '/api/puppeteer/content' && method === 'POST') {
    try {
      const body = await parseBody(req);
      let content;
      if (body.selector) {
        content = await puppeteerHandlers.getText(body.selector);
      } else {
        content = await puppeteerHandlers.getContent();
      }
      return json(res, { success: true, content });
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // POST /api/puppeteer/pdf - Generate PDF
  if (path === '/api/puppeteer/pdf' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = await puppeteerHandlers.pdf(body);
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // POST /api/puppeteer/wait - Wait for selector
  if (path === '/api/puppeteer/wait' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = await puppeteerHandlers.waitForSelector(body.selector, body.options);
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // POST /api/puppeteer/viewport - Set viewport size
  if (path === '/api/puppeteer/viewport' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = await puppeteerHandlers.setViewport(body.width, body.height);
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // GET /api/puppeteer/cookies - Get cookies
  if (path === '/api/puppeteer/cookies' && method === 'GET') {
    try {
      const cookies = await puppeteerHandlers.getCookies();
      return json(res, { cookies });
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // POST /api/puppeteer/cookies - Set cookies
  if (path === '/api/puppeteer/cookies' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = await puppeteerHandlers.setCookies(body.cookies);
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // DELETE /api/puppeteer/cookies - Clear cookies
  if (path === '/api/puppeteer/cookies' && method === 'DELETE') {
    try {
      const result = await puppeteerHandlers.clearCookies();
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // GET /api/puppeteer/console - Get console logs
  if (path === '/api/puppeteer/console' && method === 'GET') {
    try {
      const logs = puppeteerHandlers.getConsoleLogs();
      return json(res, { logs });
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // DELETE /api/puppeteer/console - Clear console logs
  if (path === '/api/puppeteer/console' && method === 'DELETE') {
    try {
      const result = puppeteerHandlers.clearConsoleLogs();
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

  // ============ DOCUMENTATION ROUTES ============

  // GET /api/docs - List documentation files
  if (path === '/api/docs' && method === 'GET') {
    try {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      const docsDir = join(__dirname, '..', '..', 'docs');
      
      const files = await readdir(docsDir);
      const docs = files
        .filter(f => f.endsWith('.md'))
        .map(f => ({
          name: f.replace('.md', ''),
          filename: f,
          path: `/api/docs/${encodeURIComponent(f)}`,
        }));
      return json(res, { docs });
    } catch (error) {
      return json(res, { error: error.message, docs: [] }, 500);
    }
  }

  // GET /api/docs/:filename - Get specific documentation file
  const docsMatch = path.match(/^\/api\/docs\/([^/]+\.md)$/);
  if (docsMatch && method === 'GET') {
    try {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      const docsDir = join(__dirname, '..', '..', 'docs');
      
      const filename = decodeURIComponent(docsMatch[1]);
      const filePath = join(docsDir, filename);
      
      // Security: prevent directory traversal
      if (!filePath.startsWith(docsDir)) {
        return json(res, { error: 'Forbidden' }, 403);
      }
      
      const content = await readFile(filePath, 'utf-8');
      return json(res, {
        filename,
        name: filename.replace('.md', ''),
        content,
      });
    } catch (error) {
      return json(res, { error: 'Document not found' }, 404);
    }
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

  // ============ BAMBISLEEP-CHAT MCP ROUTES ============
  
  // --- Trigger Routes ---
  
  // GET /api/bambisleep-chat/triggers - Get all official triggers
  if (path === '/api/bambisleep-chat/triggers' && method === 'GET') {
    return json(res, bambisleepChatHandlers.triggers.getAllTriggers());
  }

  // GET /api/bambisleep-chat/triggers/category/:category - Get triggers by category
  const triggerCategoryMatch = path.match(/^\/api\/bambisleep-chat\/triggers\/category\/([^/]+)$/);
  if (triggerCategoryMatch && method === 'GET') {
    return json(res, bambisleepChatHandlers.triggers.getTriggersByCategory(triggerCategoryMatch[1]));
  }

  // POST /api/bambisleep-chat/triggers/detect - Detect triggers in text
  if (path === '/api/bambisleep-chat/triggers/detect' && method === 'POST') {
    const body = await parseBody(req);
    return json(res, bambisleepChatHandlers.triggers.detectTriggers(body.text));
  }

  // POST /api/bambisleep-chat/triggers/process - Process message with trigger highlighting
  if (path === '/api/bambisleep-chat/triggers/process' && method === 'POST') {
    const body = await parseBody(req);
    return json(res, bambisleepChatHandlers.triggers.processMessage(body.text, body.options));
  }

  // POST /api/bambisleep-chat/triggers/active - Set active triggers for session
  if (path === '/api/bambisleep-chat/triggers/active' && method === 'POST') {
    const body = await parseBody(req);
    return json(res, bambisleepChatHandlers.triggers.setActiveTriggers(body.sessionId, body.triggers));
  }

  // GET /api/bambisleep-chat/triggers/active/:sessionId - Get active triggers
  const activeTriggersMatch = path.match(/^\/api\/bambisleep-chat\/triggers\/active\/([^/]+)$/);
  if (activeTriggersMatch && method === 'GET') {
    return json(res, bambisleepChatHandlers.triggers.getActiveTriggers(activeTriggersMatch[1]));
  }

  // --- TTS Routes ---

  // POST /api/bambisleep-chat/tts/clean - Clean text for TTS
  if (path === '/api/bambisleep-chat/tts/clean' && method === 'POST') {
    const body = await parseBody(req);
    return json(res, bambisleepChatHandlers.tts.cleanTextForTTS(body.text));
  }

  // POST /api/bambisleep-chat/tts/split - Split text into sentences
  if (path === '/api/bambisleep-chat/tts/split' && method === 'POST') {
    const body = await parseBody(req);
    return json(res, bambisleepChatHandlers.tts.splitIntoSentences(body.text));
  }

  // POST /api/bambisleep-chat/tts/process - Process for TTS with sentence pairs
  if (path === '/api/bambisleep-chat/tts/process' && method === 'POST') {
    const body = await parseBody(req);
    return json(res, bambisleepChatHandlers.tts.processForTTS(body.message));
  }

  // --- Chat Routes ---

  // POST /api/bambisleep-chat/chat/message - Add message to history
  if (path === '/api/bambisleep-chat/chat/message' && method === 'POST') {
    const body = await parseBody(req);
    return json(res, bambisleepChatHandlers.chat.addMessage(body.sessionId, body.message));
  }

  // GET /api/bambisleep-chat/chat/history/:sessionId - Get chat history
  const chatHistoryMatch = path.match(/^\/api\/bambisleep-chat\/chat\/history\/([^/]+)$/);
  if (chatHistoryMatch && method === 'GET') {
    const limit = url.searchParams.get('limit');
    const includeAI = url.searchParams.get('includeAI') !== 'false';
    const includeUser = url.searchParams.get('includeUser') !== 'false';
    return json(res, bambisleepChatHandlers.chat.getHistory(chatHistoryMatch[1], {
      limit: limit ? parseInt(limit, 10) : 50,
      includeAI,
      includeUser
    }));
  }

  // DELETE /api/bambisleep-chat/chat/history/:sessionId - Clear chat history
  if (chatHistoryMatch && method === 'DELETE') {
    return json(res, bambisleepChatHandlers.chat.clearHistory(chatHistoryMatch[1]));
  }

  // GET /api/bambisleep-chat/chat/username - Generate random username
  if (path === '/api/bambisleep-chat/chat/username' && method === 'GET') {
    return json(res, { username: bambisleepChatHandlers.chat.generateUsername() });
  }

  // --- Collar Routes ---

  // POST /api/bambisleep-chat/collar/activate - Activate collar
  if (path === '/api/bambisleep-chat/collar/activate' && method === 'POST') {
    const body = await parseBody(req);
    return json(res, bambisleepChatHandlers.collar.activate(body.sessionId));
  }

  // POST /api/bambisleep-chat/collar/deactivate - Deactivate collar
  if (path === '/api/bambisleep-chat/collar/deactivate' && method === 'POST') {
    const body = await parseBody(req);
    return json(res, bambisleepChatHandlers.collar.deactivate(body.sessionId));
  }

  // POST /api/bambisleep-chat/collar/toggle - Toggle collar
  if (path === '/api/bambisleep-chat/collar/toggle' && method === 'POST') {
    const body = await parseBody(req);
    return json(res, bambisleepChatHandlers.collar.toggle(body.sessionId));
  }

  // GET /api/bambisleep-chat/collar/status/:sessionId - Get collar status
  const collarStatusMatch = path.match(/^\/api\/bambisleep-chat\/collar\/status\/([^/]+)$/);
  if (collarStatusMatch && method === 'GET') {
    return json(res, bambisleepChatHandlers.collar.getStatus(collarStatusMatch[1]));
  }

  // --- Text Effects Routes ---

  // POST /api/bambisleep-chat/effects/highlights - Process text highlights
  if (path === '/api/bambisleep-chat/effects/highlights' && method === 'POST') {
    const body = await parseBody(req);
    return json(res, bambisleepChatHandlers.textEffects.processHighlights(body.text, body.options));
  }

  // --- Session Routes ---

  // POST /api/bambisleep-chat/session - Create new session
  if (path === '/api/bambisleep-chat/session' && method === 'POST') {
    return json(res, bambisleepChatHandlers.session.create());
  }

  // DELETE /api/bambisleep-chat/session/:sessionId - Destroy session
  const sessionDestroyMatch = path.match(/^\/api\/bambisleep-chat\/session\/([^/]+)$/);
  if (sessionDestroyMatch && method === 'DELETE') {
    return json(res, bambisleepChatHandlers.session.destroy(sessionDestroyMatch[1]));
  }

  // GET /api/bambisleep-chat/session/:sessionId - Get session info
  if (sessionDestroyMatch && method === 'GET') {
    return json(res, bambisleepChatHandlers.session.getInfo(sessionDestroyMatch[1]));
  }

  // GET /api/bambisleep-chat/sessions - Get all sessions (admin)
  if (path === '/api/bambisleep-chat/sessions' && method === 'GET') {
    return json(res, bambisleepChatHandlers.session.getAllSessions());
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
