# MCP Control Tower - AI Agent Instructions

## Architecture

**Zero-framework Node.js 20+** orchestrating 14 MCP servers via REST APIs.

| Port | Service              | Entry Point               |
| ---- | -------------------- | ------------------------- |
| 3000 | Dashboard UI         | `src/dashboard/server.js` |
| 8080 | REST API + WebSocket | `src/api/routes.js`       |

**Data Flow**: `Dashboard → REST API → Server Handlers → MCP Servers`

- `ServerRegistry` manages MCP lifecycle via `spawn()` — see [src/servers/index.js](../src/servers/index.js)
- Configs in `.vscode/settings.json` (JSONC) — use `stripJsonc()` from [src/utils/config.js](../src/utils/config.js)
- 14 handlers: Memory, GitHub, HuggingFace, Stripe, Patreon, MongoDB, SQLite, Puppeteer, Fetch, Sequential Thinking, Storage, Clarity, LM Studio, BambiSleep Chat

## Commands

```bash
npm run dev              # Hot reload (Node.js 20+ required)
npm test                 # All tests (300+)
npm run test:unit        # Fast unit tests (no server needed)
npm run test:integration # Requires server on port 8080
npm run test:coverage    # Target: 84%+
```

## Required Patterns

### File Header (REQUIRED)

```javascript
/**
 * BambiSleep™ Church MCP Control Tower
 * {Brief description}
 */
```

### Logger (import in every module)

```javascript
import { createLogger } from "../utils/logger.js";
const logger = createLogger("module-name"); // kebab-case
```

### Server Handler (`src/servers/{name}.js`)

Export `{name}Handlers` object mapping to REST endpoints:

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

### API Routes (`src/api/routes.js`)

Vanilla if/else with section headers. Use `parseBody(req)` and `json(res, data, status)`:

```javascript
// ============ MEMORY MCP ROUTES ============
if (path === "/api/memory" && method === "GET") {
  return json(res, memoryHandlers.readGraph());
}
```

### Frontend Components (`src/dashboard/js/components/`)

Pure functions returning HTML template strings:

```javascript
export function renderServerCard(server, index) {
  return `<div class="glass-card server-card" data-server="${server.name}">...</div>`;
}
```

### State (`src/dashboard/js/state/store.js`)

`AppState`, `Actions`, `Selectors` — never mutate directly:

```javascript
Actions.setServers(data.servers);
const stats = Selectors.stats(AppState.getState());
```

## Adding New MCP Server

1. Create `src/servers/{name}.js` exporting `{name}Handlers`
2. Import at top of `src/api/routes.js`
3. Add routes under `// ============ {NAME} MCP ROUTES ============`
4. Add config to `.vscode/settings.json` → `mcp.servers`
5. Create `docs/{NAME}_MCP_REFERENCE.md`

## Adding Agent Tools

Tools in [src/servers/agent-tools.js](../src/servers/agent-tools.js) use OpenAI function calling schema:

```javascript
{
  name: 'category_action',        // snake_case: {category}_{action}
  description: 'Human-readable description',
  category: TOOL_CATEGORIES.MEMORY,
  parameters: { type: 'object', properties: {...}, required: [] },
  handler: 'methodName',          // Maps to *Handlers method
}
```

## Testing

Node.js built-in `node:test` + `node:assert`. Integration tests auto-skip on ECONNREFUSED:

```javascript
import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
```

| Location         | Type              |
| ---------------- | ----------------- |
| `tests/utils/`   | Unit tests        |
| `tests/api/`     | Integration tests |
| `tests/servers/` | Handler tests     |

## Environment Variables

| Variable         | Default                     | Purpose               |
| ---------------- | --------------------------- | --------------------- |
| `API_PORT`       | `8080`                      | REST API              |
| `DASHBOARD_PORT` | `3000`                      | Dashboard             |
| `LOG_LEVEL`      | `info`                      | debug/info/warn/error |
| `MONGODB_URI`    | `mongodb://localhost:27017` | MongoDB connection    |
| `STORAGE_DIR`    | `./data/storage`            | File storage root     |
| `LMS_HOST`       | `localhost`                 | LM Studio host        |
| `LMS_PORT`       | `1234`                      | LM Studio port        |

## Conventions

- **ES Modules only** — `.js` extension required in all imports
- **2-space indent**, semicolons throughout
- **Trademark**: "BambiSleep™" (with ™), "BambiSleepChurch™" (no space)
- **No frameworks**: Vanilla Node.js HTTP, vanilla JS frontend
- **Minimal deps**: `ws`, `mongodb`, `dotenv`, `@modelcontextprotocol/sdk`
- **CSS**: `@layer` cascade, tokens in `variables.css`, components in `components/*.css`

## Key Files

| Purpose         | Location                        |
| --------------- | ------------------------------- |
| Entry point     | `src/index.js`                  |
| All API routes  | `src/api/routes.js` (2400+ LOC) |
| Server registry | `src/servers/index.js`          |
| 98 AI tools     | `src/servers/agent-tools.js`    |
| MCP config      | `.vscode/settings.json` (JSONC) |
| Config loader   | `src/utils/config.js`           |
| Extended docs   | `docs/AGENT.md`                 |
