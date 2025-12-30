# MCP Control Tower - AI Agent Instructions

## Architecture

**Purpose**: Orchestrate MCP (Model Context Protocol) servers via REST APIs.

**Dual-Server Design**:

- **Port 3000**: Static dashboard UI (`src/dashboard/server.js`)
- **Port 8080**: REST API with 40+ endpoints (`src/api/routes.js`)

**Data Flow**: Dashboard → REST API → MCP Server Wrappers → External Services

### Source Structure

```
src/
├── index.js              # Entry point, graceful shutdown (SIGINT/SIGTERM)
├── api/
│   ├── routes.js         # All REST endpoints (40+)
│   └── websocket.js      # WebSocket server for real-time updates
├── dashboard/            # Frontend application
│   ├── index.html        # Main HTML (app shell)
│   ├── styles.css        # Cyber goth design system
│   ├── variables.css     # CSS design tokens
│   ├── server.js         # Static file server
│   └── js/               # Modular JavaScript
│       ├── app.js        # Main entry point
│       ├── config.js     # Frontend configuration
│       ├── state/        # State management
│       │   └── store.js  # Reactive store with subscribers
│       ├── components/   # UI components
│       │   ├── Toast.js, Modal.js, ServerCard.js, etc.
│       │   └── index.js  # Component exports
│       ├── effects/      # Side effects (hooks)
│       │   ├── useKeyboard.js, usePolling.js, useSubscription.js
│       │   └── index.js  # Effect exports
│       └── services/     # API & WebSocket
│           ├── api.js    # REST API client
│           └── websocket.js # WebSocket client
├── servers/              # MCP wrappers (memory, github, stripe, etc.)
│   └── index.js          # ServerRegistry class
└── utils/
    ├── config.js         # Loads MCP config from .vscode/settings.json
    ├── logger.js         # Namespaced logger with colors
    └── rate-limit.js     # API rate limiting
```

## Frontend Architecture

The dashboard uses a **modular ES Modules architecture** with React-like patterns:

### State Management (`js/state/store.js`)

```javascript
import { AppState, Actions, Selectors } from './state/store.js';

// Read state
const servers = Selectors.servers(AppState.getState());

// Update state (triggers subscribers)
Actions.setServers(newServers);
Actions.setFilter('running');

// Subscribe to changes
AppState.subscribe((state, prevState) => { ... });
```

### Components (`js/components/*.js`)

Pure functions that return HTML strings:

```javascript
import { renderServerCard } from "./components/ServerCard.js";
container.innerHTML = renderServerCard(server, index);
```

### Effects (`js/effects/*.js`)

Side effect handlers (like React hooks):

```javascript
import { useKeyboard } from "./effects/useKeyboard.js";
useKeyboard({ onRefresh: () => fetchServers() });
```

### Services (`js/services/*.js`)

API and WebSocket communication:

```javascript
import { fetchServers, startServer } from "./services/api.js";
import { initWebSocket } from "./services/websocket.js";
```

## Code Patterns

### Logger Pattern (every module)

```javascript
import { createLogger } from "../utils/logger.js";
const logger = createLogger("module-name"); // Use module name as namespace
```

### Server Wrapper Pattern (`src/servers/*.js`)

Each wrapper exports a `handlers` object with methods matching REST endpoints:

```javascript
export const memoryHandlers = {
  readGraph() { ... },
  createEntities(entities) { ... },
};
```

### API Route Pattern (`src/api/routes.js`)

Routes use regex matching, not a framework:

```javascript
const startMatch = path.match(/^\/api\/servers\/([^/]+)\/start$/);
if (startMatch && method === 'POST') { ... }
```

### Config Loading

MCP servers are read from `.vscode/settings.json` → `mcp.servers` (JSONC parsed).

## Commands

```bash
npm run dev      # Hot reload with --watch
npm run start    # Production server
npm run test     # node --test src/**/*.test.js
```

## REST API Endpoints (Port 8080)

| Category        | Endpoints                     | Example                                                 |
| --------------- | ----------------------------- | ------------------------------------------------------- |
| **Core**        | `/api/health`, `/api/servers` | `GET /api/servers/:name/start`                          |
| **Memory**      | `/api/memory/*`               | `GET /api/memory/search?q=term`                         |
| **GitHub**      | `/api/github/*`               | `GET /api/github/repos?per_page=10`                     |
| **HuggingFace** | `/api/huggingface/*`          | `GET /api/huggingface/models?q=llama`                   |
| **Stripe**      | `/api/stripe/*`               | `GET /api/stripe/customers?limit=10`                    |
| **SQLite**      | `/api/sqlite/*`               | `POST /api/sqlite/query` `{sql:"..."}`                  |
| **PostgreSQL**  | `/api/postgres/*`             | `POST /api/postgres/query` `{sql:"...",params:[]}`      |
| **MongoDB**     | `/api/mongodb/*`              | `POST /api/mongodb/find` `{collection:"...",filter:{}}` |
| **Puppeteer**   | `/api/puppeteer/*`            | `POST /api/puppeteer/screenshot`                        |
| **Thinking**    | `/api/thinking/*`             | `POST /api/thinking/sessions/:id/thought`               |

All endpoints return JSON. Use `GET /api/health` to verify server status.

## Testing Pattern

Uses Node.js built-in test runner (no external dependencies):

```javascript
import assert from "node:assert";
import { describe, it, beforeEach } from "node:test";
```

Tests auto-skip when server not running (check `ECONNREFUSED`).

## Adding New MCP Server Wrappers

1. Create `src/servers/{name}.js` with `{name}Handlers` export
2. Add routes to `src/api/routes.js` under `// ============ {NAME} MCP ROUTES ============`
3. Import handlers in routes.js
4. Add server config to `.vscode/settings.json` under `mcp.servers`
5. Reference docs go in `docs/{NAME}_MCP_REFERENCE.md`

## Conventions

- **ES Modules only** (`import`/`export`)
- **2-space indent**, format-on-save
- **Trademark**: Use "BambiSleep™" with ™ symbol in user-facing text
- **File headers**: Include `BambiSleep™ Church MCP Control Tower` doc comment

## Key References

| Resource            | Location                                |
| ------------------- | --------------------------------------- |
| MCP Server Registry | `.vscode/settings.json` → `mcp.servers` |
| Integration Docs    | `docs/*_MCP_REFERENCE.md`               |
| Project Roadmap     | `docs/TODO.md`                          |
| Philosophy          | `docs/RELIGULOUS_MANTRA.md`             |
