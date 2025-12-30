/**
 * BambiSleep™ Church MCP Control Tower
 * API Routes (Port 8080)
 */

import { createServer } from 'http';
import { fetchHandlers } from '../servers/fetch.js';
import { githubHandlers } from '../servers/github.js';
import { huggingfaceHandlers } from '../servers/huggingface.js';
import { registry } from '../servers/index.js';
import { memoryHandlers } from '../servers/memory.js';
import { postgresHandlers } from '../servers/postgres.js';
import { puppeteerHandlers } from '../servers/puppeteer.js';
import { thinkingHandlers } from '../servers/sequential-thinking.js';
import { sqliteHandlers } from '../servers/sqlite.js';
import { stripeHandlers } from '../servers/stripe.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('api');

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
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

/**
 * Route handler
 */
async function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  const method = req.method;

  logger.debug(`${method} ${path}`);

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  // Health check
  if (path === '/api/health' && method === 'GET') {
    return json(res, { status: 'ok', timestamp: new Date().toISOString() });
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

  // ============ POSTGRES MCP ROUTES ============

  // POST /api/postgres/connect - Connect to database
  if (path === '/api/postgres/connect' && method === 'POST') {
    try {
      const result = await postgresHandlers.connect();
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // GET /api/postgres/tables - List tables
  if (path === '/api/postgres/tables' && method === 'GET') {
    try {
      const schema = url.searchParams.get('schema') || 'public';
      const tables = await postgresHandlers.listTables(schema);
      return json(res, { tables });
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // GET /api/postgres/stats - Get stats
  if (path === '/api/postgres/stats' && method === 'GET') {
    try {
      const stats = await postgresHandlers.getStats();
      return json(res, stats);
    } catch (error) {
      return json(res, { error: error.message }, 500);
    }
  }

  // POST /api/postgres/query - Execute query
  if (path === '/api/postgres/query' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const result = await postgresHandlers.query(body.sql, body.params || []);
      return json(res, result);
    } catch (error) {
      return json(res, { error: error.message }, 500);
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

  // 404 for unknown routes
  return json(res, { error: 'Not found' }, 404);
}

/**
 * Create and start API server
 */
export function createApiServer(port = 8080, host = '0.0.0.0') {
  const server = createServer(handleRequest);

  server.listen(port, host, () => {
    logger.info(`API server running at http://${host}:${port}`);
  });

  return server;
}

export default createApiServer;
