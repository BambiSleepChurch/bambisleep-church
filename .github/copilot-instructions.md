# MCP Control Tower - AI Agent Instructions

## Architecture Overview

**Zero-framework Node.js application** orchestrating MCP servers via REST APIs.

| Port | Service              | Entry Point               |
| ---- | -------------------- | ------------------------- |
| 3000 | Dashboard UI         | `src/dashboard/server.js` |
| 8080 | REST API + WebSocket | `src/api/routes.js`       |

**Data Flow**: `Dashboard → REST API → Server Handlers → MCP Servers`

- `ServerRegistry` (`src/servers/index.js`) manages server lifecycle via `spawn()`
- Configs loaded from `.vscode/settings.json` (JSONC—uses `stripJsonc()` in `src/utils/config.js`)
- 13 server handlers: Memory, GitHub, HuggingFace, Stripe, MongoDB, SQLite, Puppeteer, Fetch, Sequential Thinking, Storage, Clarity, LM Studio, Agent

## Commands

```bash
npm run dev              # Hot reload (Node.js 20+ required)
npm run start            # Production
npm test                 # All 228 tests
npm run test:unit        # Fast (no server)
npm run test:integration # Requires running server
npm run test:coverage    # 84%+ coverage
```

## Critical Patterns

### File Header (required)

```javascript
/**
 * BambiSleep™ Church MCP Control Tower
 * {Brief description}
 */
```

### Logger (every module)

```javascript
import { createLogger } from "../utils/logger.js";
const logger = createLogger("module-name"); // kebab-case

// Usage: message + optional data object
logger.info("Server started", { port: 8080 });
logger.error("Failed to connect", { error: err.message });
```

Logs to console + `logs/mcp-tower-YYYY-MM-DD.log` (JSON structured). Set `LOG_TO_FILE=false` to disable.

### Server Handler (`src/servers/*.js`)

Export `{name}Handlers` object—each method maps to a REST endpoint:

```javascript
export const memoryHandlers = {
  readGraph() {
    /* ... */
  },
  createEntities(entities) {
    /* ... */
  },
};
```

### API Route (`src/api/routes.js`)

Vanilla regex routing with section comments:

```javascript
// ============ MEMORY MCP ROUTES ============
if (path === "/api/memory" && method === "GET") {
  return json(res, memoryHandlers.readGraph());
}
```

### Frontend Component (`src/dashboard/js/components/`)

Pure functions returning HTML strings (no JSX):

```javascript
export function renderServerCard(server, index) {
  return `<div class="glass-card server-card" data-server="${server.name}">...</div>`;
}
```

### State (`src/dashboard/js/state/store.js`)

Actions/Selectors pattern—never mutate directly:

```javascript
Actions.setServers(data.servers);
const stats = Selectors.stats(AppState.getState());
```

## Adding New MCP Server

1. Create `src/servers/{name}.js` with `{name}Handlers` export
2. Add routes under `// ============ {NAME} MCP ROUTES ============`
3. Import at top of `routes.js`
4. Configure in `.vscode/settings.json` → `mcp.servers`
5. Document in `docs/{NAME}_MCP_REFERENCE.md`

## Testing (Node.js built-in runner)

Integration tests auto-skip when server unavailable:

```javascript
if (!serverAvailable) {
  t.skip("API server not running");
  return;
}
```

**Locations**: `tests/utils/` (unit), `tests/api/` (integration), `tests/servers/` (handlers)

## Environment Variables

| Variable            | Default                     | Purpose               |
| ------------------- | --------------------------- | --------------------- |
| `API_PORT`          | `8080`                      | REST API              |
| `DASHBOARD_PORT`    | `3000`                      | Dashboard             |
| `LOG_LEVEL`         | `info`                      | error/warn/info/debug |
| `MONGODB_URI`       | `mongodb://localhost:27017` | MongoDB (Atlas OK)    |
| `STORAGE_DIR`       | `./data/storage`            | File storage root     |
| `GITHUB_TOKEN`      | —                           | GitHub API            |
| `STRIPE_API_KEY`    | —                           | Stripe                |
| `HUGGINGFACE_TOKEN` | —                           | HuggingFace           |

## Conventions

- **ES Modules only** (`import`/`export`)
- **2-space indent**
- **Trademark**: "BambiSleep™" in user-facing text; "BambiSleepChurch™" (no space)
- **No frameworks**: Vanilla Node.js HTTP, vanilla JS frontend
- **CSS layers**: `@layer base → components → utilities` in `src/dashboard/css/`

## Key Files

| Purpose         | Location                        |
| --------------- | ------------------------------- |
| Entry point     | `src/index.js`                  |
| API routes      | `src/api/routes.js`             |
| Server registry | `src/servers/index.js`          |
| MCP config      | `.vscode/settings.json` (JSONC) |
| Config loader   | `src/utils/config.js`           |
| Agent docs      | `docs/AGENT.md`                 |
| Roadmap         | `docs/TODO.md`                  |
