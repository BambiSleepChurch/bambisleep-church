# MCP Control Tower - AI Agent Instructions

## Architecture Overview

**Zero-framework Node.js 20+ application** orchestrating 14 MCP servers via REST APIs.

| Port | Service              | Entry Point               |
| ---- | -------------------- | ------------------------- |
| 3000 | Dashboard UI         | `src/dashboard/server.js` |
| 8080 | REST API + WebSocket | `src/api/routes.js`       |

**Data Flow**: `Dashboard → REST API → Server Handlers → MCP Servers`

- `ServerRegistry` (`src/servers/index.js`) manages MCP server lifecycle via `spawn()`
- Configs loaded from `.vscode/settings.json` (JSONC—use `stripJsonc()` from `src/utils/config.js`)
- 14 handlers in `src/servers/`: Memory, GitHub, HuggingFace, Stripe, Patreon, MongoDB, SQLite, Puppeteer, Fetch, Sequential Thinking, Storage, Clarity, LM Studio, BambiSleep Chat

## Commands

```bash
npm run dev              # Hot reload (Node.js 20+ required)
npm test                 # All tests (300+)
npm run test:unit        # Fast, no server
npm run test:integration # Requires running server on 8080
npm run test:coverage    # Target: 84%+
```

## Critical Patterns

### File Header (REQUIRED on every file)

```javascript
/**
 * BambiSleep™ Church MCP Control Tower
 * {Brief description}
 */
```

### Logger (import in every module)

```javascript
import { createLogger } from "../utils/logger.js";
const logger = createLogger("module-name"); // kebab-case namespace
logger.info("Message", { optional: "data" });
```

### Server Handler Pattern (`src/servers/{name}.js`)

Export `{name}Handlers` object with methods that map to REST endpoints:

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

### API Route Pattern (`src/api/routes.js`)

Vanilla regex routing with section comment headers:

```javascript
// ============ MEMORY MCP ROUTES ============
if (path === "/api/memory" && method === "GET") {
  return json(res, memoryHandlers.readGraph());
}
```

### Frontend Components (`src/dashboard/js/components/`)

Pure functions returning HTML template strings (no frameworks):

```javascript
export function renderServerCard(server, index) {
  return `<div class="glass-card server-card" data-server="${server.name}">...</div>`;
}
```

### State Management (`src/dashboard/js/state/store.js`)

Actions/Selectors pattern—never mutate state directly:

```javascript
Actions.setServers(data.servers);
const stats = Selectors.stats(AppState.getState());
```

### CSS Architecture (`src/dashboard/css/`)

- Uses `@layer base` → `@layer components` cascade ordering
- All tokens in `variables.css` (e.g., `--space-4`, `--glow-cyan`)
- Components are self-contained in `components/*.css`

## Adding New MCP Server

1. Create `src/servers/{name}.js` exporting `{name}Handlers`
2. Import handler at top of `src/api/routes.js`
3. Add routes under `// ============ {NAME} MCP ROUTES ============` comment
4. Add server config to `.vscode/settings.json` → `mcp.servers`
5. Create `docs/{NAME}_MCP_REFERENCE.md`

## Testing (Node.js built-in runner)

Integration tests auto-skip when server unavailable:

```javascript
import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";

// Tests skip gracefully on ECONNREFUSED
```

**Locations**: `tests/utils/` (unit), `tests/api/` (integration), `tests/servers/` (handlers)

## Environment Variables

| Variable          | Default                     | Purpose               |
| ----------------- | --------------------------- | --------------------- |
| `API_PORT`        | `8080`                      | REST API              |
| `DASHBOARD_PORT`  | `3000`                      | Dashboard             |
| `LOG_LEVEL`       | `info`                      | debug/info/warn/error |
| `MONGODB_URI`     | `mongodb://localhost:27017` | MongoDB Atlas OK      |
| `STORAGE_DIR`     | `./data/storage`            | File storage root     |
| `LMS_HOST`        | `localhost`                 | LM Studio host        |
| `LMS_PORT`        | `1234`                      | LM Studio port        |
| `LMS_MODEL`       | `qwen3`                     | Default model name    |
| `LMS_TEMPERATURE` | `0.7`                       | Inference temp        |
| `LMS_MAX_TOKENS`  | `2048`                      | Max response tokens   |

## Conventions

- **ES Modules only** (`import`/`export`, `.js` extension)
- **2-space indent**
- **Trademark**: "BambiSleep™" (with ™), "BambiSleepChurch™" (no space)
- **No frameworks**: Vanilla Node.js HTTP server, vanilla JS frontend

## Key Files Reference

| Purpose         | Location                        |
| --------------- | ------------------------------- |
| Entry point     | `src/index.js`                  |
| All API routes  | `src/api/routes.js`             |
| Server registry | `src/servers/index.js`          |
| 98 AI tools     | `src/servers/agent-tools.js`    |
| MCP config      | `.vscode/settings.json` (JSONC) |
| Config loader   | `src/utils/config.js`           |
| Extended docs   | `docs/AGENT.md`                 |
