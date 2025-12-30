# MCP Control Tower - AI Agent Instructions

## Architecture Overview

**Purpose**: Orchestrate MCP (Model Context Protocol) servers via REST APIs.

**Dual-Server Design**:

- **Port 3000**: Static dashboard UI (`src/dashboard/server.js`)
- **Port 8080**: REST API + WebSocket (`src/api/routes.js`, `src/api/websocket.js`)

**Data Flow**: `Dashboard → REST API → MCP Server Wrappers → External Services`

## Commands

```bash
npm run dev      # Hot reload with --watch (development)
npm run start    # Production server
npm run test     # Node.js built-in test runner
```

## Code Patterns (Required)

### File Header (every file)

```javascript
/**
 * BambiSleep™ Church MCP Control Tower
 * {Brief description}
 */
```

### Logger Pattern (every module)

```javascript
import { createLogger } from "../utils/logger.js";
const logger = createLogger("module-name"); // Use kebab-case module name
```

### Server Wrapper Pattern (`src/servers/*.js`)

Export `{name}Handlers` object with methods matching REST endpoints:

```javascript
export const memoryHandlers = {
  readGraph() { ... },
  createEntities(entities) { ... },
};
```

### API Route Pattern (`src/api/routes.js`)

Routes use regex matching (no framework):

```javascript
const startMatch = path.match(/^\/api\/servers\/([^/]+)\/start$/);
if (startMatch && method === 'POST') { ... }
```

## Adding New MCP Server Wrappers

1. Create `src/servers/{name}.js` with `{name}Handlers` export
2. Add routes to `src/api/routes.js` under `// ============ {NAME} MCP ROUTES ============`
3. Import handlers at top of routes.js
4. Add server config to `.vscode/settings.json` → `mcp.servers`
5. Add docs to `docs/{NAME}_MCP_REFERENCE.md`

## Frontend Architecture (`src/dashboard/js/`)

Uses **vanilla ES Modules** with React-like patterns (no build step):

| Directory         | Purpose               | Pattern                                        |
| ----------------- | --------------------- | ---------------------------------------------- |
| `state/store.js`  | Global state          | `AppState`, `Actions`, `Selectors`             |
| `components/*.js` | Pure render functions | Return HTML strings                            |
| `effects/*.js`    | Side effects          | `useKeyboard`, `usePolling`, `useSubscription` |
| `services/*.js`   | API/WebSocket         | Async fetch wrappers                           |

### CSS Architecture (`src/dashboard/css/`)

- Uses CSS `@layer` ordering: `base` → `components` → utilities
- Design tokens in `variables.css` (colors, spacing, typography)
- Components use BEM-inspired naming: `.component`, `.component-element`, `.component--modifier`

## Testing

Uses **Node.js built-in test runner** (no external dependencies):

```javascript
import assert from "node:assert";
import { describe, it, beforeEach } from "node:test";
```

Tests auto-skip when server not running (check `ECONNREFUSED` in catch block).

## Environment Variables

Key variables (see `src/utils/config.js` for all):

| Variable            | Default                                | Purpose                                                |
| ------------------- | -------------------------------------- | ------------------------------------------------------ |
| `LOG_LEVEL`         | `info`                                 | Logging verbosity: `error`, `warn`, `info`, `debug`    |
| `API_PORT`          | `8080`                                 | REST API server port                                   |
| `DASHBOARD_PORT`    | `3000`                                 | Dashboard UI port                                      |
| `GITHUB_TOKEN`      | —                                      | GitHub API authentication                              |
| `STRIPE_API_KEY`    | —                                      | Stripe payment processing                              |
| `HUGGINGFACE_TOKEN` | —                                      | HuggingFace inference API                              |
| `MONGODB_URI`       | `mongodb://localhost:27017/bambisleep` | MongoDB connection                                     |
| `POSTGRES_*`        | localhost defaults                     | PostgreSQL connection (HOST, PORT, USER, PASSWORD, DB) |

## WebSocket Events (`src/api/websocket.js`)

Real-time updates use typed messages via `MessageTypes`:

```javascript
// Server lifecycle events
"server:status"; // Server status changed
"server:started"; // Server process started
"server:stopped"; // Server process stopped
"server:error"; // Server error occurred
"server:log"; // Log output from server

// System events
"health:update"; // Health check broadcast
"stats:update"; // Server stats changed

// Client commands
"subscribe"; // Subscribe to server events
"unsubscribe"; // Unsubscribe from events
"ping" / "pong"; // Keepalive
```

Use `broadcast()` to emit to all clients, `sendTo()` for targeted messages.

## Conventions

- **ES Modules only** (`import`/`export`, never CommonJS)
- **2-space indent**, format-on-save
- **Trademark**: Use "BambiSleep™" with ™ in user-facing text
- **Config source**: MCP servers from `.vscode/settings.json` (JSONC with comments)

## Key Files

| Purpose          | Location                                           |
| ---------------- | -------------------------------------------------- |
| Entry point      | `src/index.js` (graceful shutdown: SIGINT/SIGTERM) |
| API routes (40+) | `src/api/routes.js`                                |
| Server registry  | `src/servers/index.js`                             |
| MCP config       | `.vscode/settings.json` → `mcp.servers`            |
| Integration docs | `docs/*_MCP_REFERENCE.md`                          |
| Project roadmap  | `docs/TODO.md`                                     |
