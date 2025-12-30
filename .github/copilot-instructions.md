# MCP Control Tower - AI Agent Instructions

## Architecture Overview

**Purpose**: Orchestrate MCP (Model Context Protocol) servers via REST APIs—a zero-framework Node.js application.

**Dual-Server Design**:
- **Port 3000**: Static dashboard UI (`src/dashboard/server.js`)
- **Port 8080**: REST API + WebSocket (`src/api/routes.js`, `src/api/websocket.js`)

**Data Flow**: `Dashboard → REST API → Server Handlers → MCP Servers / External Services`

The `ServerRegistry` class (`src/servers/index.js`) manages server lifecycle via `spawn()`. Configs are loaded from `.vscode/settings.json` (JSONC with comments allowed).

## Commands

```bash
npm run dev              # Hot reload with --watch
npm run start            # Production server
npm run test             # All tests
npm run test:unit        # Fast tests (no server)
npm run test:integration # Requires running server
npm run test:coverage    # Coverage report
```

## Required Code Patterns

### File Header (every file)
```javascript
/**
 * BambiSleep™ Church MCP Control Tower
 * {Brief description}
 */
```

### Logger Pattern (every module)
```javascript
import { createLogger } from '../utils/logger.js';
const logger = createLogger('module-name'); // kebab-case namespace
```

### Server Handler Pattern (`src/servers/*.js`)
Export `{name}Handlers` object—each method maps to a REST endpoint:
```javascript
export const memoryHandlers = {
  readGraph() { /* ... */ },
  createEntities(entities) { /* ... */ },
  searchNodes(query) { /* ... */ },
};
```

### API Route Pattern (`src/api/routes.js`)
Vanilla regex routing (no Express/Koa). Use section comments:
```javascript
// ============ MEMORY MCP ROUTES ============
if (path === '/api/memory' && method === 'GET') {
  return json(res, memoryHandlers.readGraph());
}
```

### Frontend Component Pattern (`src/dashboard/js/components/`)
Pure functions returning HTML strings:
```javascript
export function renderServerCard(server, index) {
  return `<div class="glass-card server-card" data-server="${server.name}">...</div>`;
}
```

## Adding New MCP Server Wrapper

1. Create `src/servers/{name}.js` with `{name}Handlers` export
2. Add routes in `src/api/routes.js` under `// ============ {NAME} MCP ROUTES ============`
3. Import handlers at top of routes.js
4. Add config to `.vscode/settings.json` → `mcp.servers`
5. Add docs to `docs/{NAME}_MCP_REFERENCE.md`

## Frontend Architecture (`src/dashboard/js/`)

| Directory      | Purpose        | Pattern                            |
|----------------|----------------|------------------------------------|
| `state/`       | Global state   | `AppState`, `Actions`, `Selectors` |
| `components/`  | Render funcs   | Return HTML strings                |
| `effects/`     | Side effects   | `useKeyboard`, `usePolling`        |
| `services/`    | API calls      | Async fetch wrappers               |

**CSS** (`src/dashboard/css/`): `@layer base → components → utilities`. Tokens in `variables.css`.

## Testing

Node.js built-in test runner (no Jest). Integration tests auto-skip when server unavailable:
```javascript
import assert from 'node:assert';
import { describe, it } from 'node:test';

// Auto-skip pattern for integration tests
try {
  const response = await fetch(`${API_BASE}/health`);
} catch (error) {
  if (error.cause?.code === 'ECONNREFUSED') {
    console.log('  ⏭ Skipped: API server not running');
    return;
  }
  throw error;
}
```

## Key Environment Variables

| Variable           | Default | Purpose                    |
|--------------------|---------|----------------------------|
| `LOG_LEVEL`        | `info`  | `error`/`warn`/`info`/`debug` |
| `API_PORT`         | `8080`  | REST API port              |
| `DASHBOARD_PORT`   | `3000`  | Dashboard UI port          |
| `GITHUB_TOKEN`     | —       | GitHub API auth            |
| `STRIPE_API_KEY`   | —       | Stripe payments            |
| `HUGGINGFACE_TOKEN`| —       | HuggingFace inference      |

## WebSocket Events (`src/api/websocket.js`)

- **Server**: `server:status`, `server:started`, `server:stopped`, `server:error`, `server:log`
- **System**: `health:update`, `stats:update`
- **Client**: `subscribe`, `unsubscribe`, `ping`, `pong`

## Rate Limiting (`src/utils/rate-limit.js`)

In-memory sliding window rate limiter. Applied to all API routes except health check:
```javascript
const rateLimit = createRateLimiter({
  windowMs: 60000,      // 1 minute window
  maxRequests: 100,     // max per window
  skipPaths: ['/api/health'],
});
```
Returns `429 Too Many Requests` with `X-RateLimit-*` headers when exceeded.

## MCP Client Pattern (`src/servers/mcp-client.js`)

Generic client for invoking MCP server tools via JSON-RPC over stdio:
```javascript
const client = new McpToolClient(serverConfig);
await client.connect();
const result = await client.callTool('tool_name', { arg: 'value' });
await client.disconnect();
```

## Available Server Handlers

| Handler              | File                          | Key Methods                                    |
|----------------------|-------------------------------|------------------------------------------------|
| `memoryHandlers`     | `servers/memory.js`           | `readGraph`, `createEntities`, `searchNodes`   |
| `githubHandlers`     | `servers/github.js`           | `getRepo`, `listIssues`, `createPR`            |
| `stripeHandlers`     | `servers/stripe.js`           | `listCustomers`, `createPayment`               |
| `huggingfaceHandlers`| `servers/huggingface.js`      | `inference`, `listModels`                      |
| `fetchHandlers`      | `servers/fetch.js`            | `get`, `post`, `convertToMarkdown`             |
| `sqliteHandlers`     | `servers/sqlite.js`           | `query`, `execute`, `getTables`                |
| `postgresHandlers`   | `servers/postgres.js`         | `query`, `execute`, `getTables`                |
| `mongoHandlers`      | `servers/mongodb.js`          | `find`, `insertOne`, `aggregate`               |
| `puppeteerHandlers`  | `servers/puppeteer.js`        | `screenshot`, `navigate`, `evaluate`           |
| `thinkingHandlers`   | `servers/sequential-thinking.js` | `think`, `getChain`, `reset`                |

## Docker & DevContainer

**Development** (DevContainer in VS Code):
```bash
# Open folder in VS Code → "Reopen in Container"
# Ports 3000 (Dashboard) and 8080 (API) auto-forwarded
```

**Production** (Docker Compose):
```bash
docker compose up -d              # Start all services (app + MongoDB + Postgres)
docker compose logs -f app        # Follow app logs
docker compose down               # Stop and remove containers
```

**Services in `docker-compose.yml`**:
- `app` — MCP Control Tower (ports 3000, 8080)
- `mongodb` — MongoDB 7 (port 27017)
- `postgres` — PostgreSQL 16 (port 5432)

**Environment**: Set secrets in `.env` or pass via `-e` flags (`GITHUB_TOKEN`, `STRIPE_API_KEY`, etc.)

## Conventions

- **ES Modules only** (`import`/`export`, never `require`)
- **2-space indent**, format-on-save
- **Trademark**: "BambiSleep™" with ™ in user-facing text
- **No frameworks**: Vanilla Node.js HTTP, vanilla JS frontend

## Key Files

| Purpose             | Location                              |
|---------------------|---------------------------------------|
| Entry point         | `src/index.js`                        |
| API routes          | `src/api/routes.js`                   |
| Server registry     | `src/servers/index.js`                |
| MCP config          | `.vscode/settings.json` → `mcp.servers` |
| Config loader       | `src/utils/config.js`                 |
| Integration docs    | `docs/*_MCP_REFERENCE.md`             |
| Project roadmap     | `docs/TODO.md`                        |
