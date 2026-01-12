# MCP Control Tower - AI Agent Instructions

## Overview

**Zero-framework Node.js 20+ application** orchestrating 14 MCP servers via REST APIs with WebGL avatar, neural TTS, and 98 AI agent tools.

**Key Principle**: All server code is pure vanilla Node.js (no Express, no Fastify). Frontend is vanilla JS with no build step. Configuration lives in `.vscode/settings.json` (JSONC format).

## Architecture

```
Dashboard (3000) ──→ REST API (8080) ──→ Server Handlers ──→ MCP Servers
       ↓                    ↓
   WebSocket (Phase 6)   Agent Tools (98)
   Render Commands       OpenAI Format
```

**Dual-Server Design**:

- **Port 3000**: Dashboard UI (`src/dashboard/server.js`) - Static HTML/CSS/JS with WebGL avatar
- **Port 8080**: REST API + WebSocket (`src/api/routes.js`) - All business logic, 2900+ LOC

**Data Flow**: Dashboard fetches from REST API, receives real-time updates via WebSocket. Agent tools execute via `AgentToolExecutor` which routes to handlers or broadcasts render commands.

### Critical Components

| Component           | Location                      | Purpose                                                                    |
| ------------------- | ----------------------------- | -------------------------------------------------------------------------- |
| `ServerRegistry`    | `src/servers/index.js`        | Manages MCP server lifecycle via `spawn()`                                 |
| `AgentToolExecutor` | `src/servers/agent-tools.js`  | Routes 98 AI tools to handlers                                             |
| `ModelRouter`       | `src/servers/model-router.js` | Smart LLM selection per task type                                          |
| Config Loader       | `src/utils/config.js`         | Parses `.vscode/settings.json` (JSONC) using `stripJsonc()`                |
| Memory System       | `src/servers/memory/`         | 5-module architecture: graph, user-model, conversation, workspace, manager |

## Commands & Workflows

```bash
npm run dev              # Hot reload with --watch (Node 20+)
npm test                 # All tests (300+) using node:test
npm run test:unit        # Unit tests only (fast, no server)
npm run test:integration # Requires server running on 8080
npm run test:coverage    # Target: 84%+ (node --experimental-test-coverage)
```

**Debugging**: Integration tests auto-skip if server isn't running (ECONNREFUSED detection). Always check `logs/` directory for structured JSON logs.

## Required Code Patterns

### File Header (MANDATORY on every file)

```javascript
/**
 * BambiSleep™ Church MCP Control Tower
 * {Brief description}
 */
```

### Logger (import in EVERY module)

```javascript
import { createLogger } from "../utils/logger.js";
const logger = createLogger("module-name"); // kebab-case
```

### Server Handler Pattern (`src/servers/{name}.js`)

Export `{name}Handlers` object with methods that map 1:1 to REST endpoints:

```javascript
export const memoryHandlers = {
  readGraph() {
    return memoryGraph.getAllEntities();
  },
  createEntities(entities) {
    /* ... */
  },
};
```

Handlers are imported at top of `src/api/routes.js` and wired to routes.

### API Routes Pattern (`src/api/routes.js`)

**Vanilla if/else only** - no routing library. Section headers required:

```javascript
// ============ MEMORY MCP ROUTES ============
if (path === "/api/memory" && method === "GET") {
  return json(res, memoryHandlers.readGraph());
}
```

Helper functions: `parseBody(req)` for JSON, `json(res, data, status)` for responses with CORS.

### Frontend Components (`src/dashboard/js/components/`)

Pure functions returning HTML template strings (no JSX, no frameworks):

```javascript
export function renderServerCard(server, index) {
  return `<div class="glass-card server-card" data-server="${server.name}">
    <h3>${server.name}</h3>
    <span class="status ${server.status}">${server.status}</span>
  </div>`;
}
```

### State Management (`src/dashboard/js/state/store.js`)

Global `AppState` with `Actions` and `Selectors`. **Never mutate directly**:

```javascript
// ✅ Correct
Actions.setServers(data.servers);
const stats = Selectors.stats(AppState.getState());

// ❌ Wrong
AppState.servers = data.servers;
```

## Memory System Architecture

5-layer memory system in `src/servers/memory/`:

1. **graph.js**: Knowledge graph (entities + relations + observations)
2. **user-model.js**: User preferences, expertise, behavior patterns
3. **conversation.js**: Chat history, context, summarization
4. **workspace.js**: Project knowledge, file analysis, code patterns
5. **manager.js**: Lifecycle (decay, cleanup, archive), search, MongoDB sync

**Key Insight**: All modules export both singleton instances AND handlers. Use singletons for internal operations, handlers for API routes.

## Agent Tool System

98 tools in OpenAI function calling format (`src/servers/agent-tools.js`):

```javascript
{
  name: 'memory_create_entities',  // snake_case: {category}_{action}
  description: 'Create multiple entities in knowledge graph',
  category: TOOL_CATEGORIES.MEMORY,
  parameters: {
    type: 'object',
    properties: {
      entities: { type: 'array', items: { /* ... */ } }
    },
    required: ['entities']
  },
  handler: 'createEntities'  // Maps to memoryHandlers.createEntities()
}
```

**Categories**: memory, storage, fetch, search, puppeteer, mongodb, sqlite, thinking, stripe, patreon, clarity, github, lmstudio, huggingface, render, user-model, conversation, workspace, memory-manager

**Render Tools** (Phase 6): Commands like `render_card`, `render_table`, `render_wizard` broadcast WebSocket messages to dashboard for dynamic UI.

## Model Routing

`ModelRouter` in `src/servers/model-router.js` auto-selects optimal LLM per task:

- **TASK_TYPES**: reasoning, creative, instruction, chat, toolUse, summarize, vision
- **MODEL_PROFILES**: Benchmark scores + strengths/weaknesses
- **TASK_BEST_MODELS**: Curated mappings (e.g., `toolUse` → `l3-sthenomaidblackroot-8b-v1-i1@q4_k_s`)

Router checks availability and falls back intelligently.

## Avatar & Speech System

**WebGL Avatar** (`src/dashboard/js/avatar-webgl.js`):

- SDF (Signed Distance Field) shader-based rendering
- 7 expressions: happy, sleepy, alert, reset, confused, comfort, giggle
- Eye tracking follows mouse cursor
- Two themes: neon (dark + glow), inverted (light)

**Speech Controller** (`src/dashboard/js/speech.js`):

- **Primary**: Kokoro neural TTS (192.168.0.122:8880) - 12 voices, phoneme-accurate
- **Fallback**: Web Speech API
- 5 presets: bambi (af_bella), machine, robot, human, whisper
- Auto lip sync via phoneme analysis (vowels → mouth open amount)

**Integration**: Avatar tools in agent-tools.js (`avatar_speak`, `avatar_set_expression`, etc.) route to WebSocket render commands.

## Adding New Components

### New MCP Server

1. Create `src/servers/{name}.js` exporting `{name}Handlers`
2. Import at top of `src/api/routes.js`: `import { xHandlers } from '../servers/x.js';`
3. Add section: `// ============ {NAME} MCP ROUTES ============`
4. Wire routes using `json(res, xHandlers.method())`
5. Add to `.vscode/settings.json` → `mcp.servers`
6. Document in `docs/{NAME}_MCP_REFERENCE.md`

### New Agent Tool

Add to `AGENT_TOOLS` array in `src/servers/agent-tools.js`:

```javascript
{
  name: 'category_action',
  description: 'What it does',
  category: TOOL_CATEGORIES.X,
  parameters: { /* JSON Schema */ },
  handler: 'methodName'
}
```

Handler must exist in corresponding `{category}Handlers` object.

### New Render Component

1. Add tool to `AGENT_TOOLS` with `category: TOOL_CATEGORIES.RENDER`
2. Add message type to `MessageTypes` in `src/api/websocket.js`
3. Implement frontend handler in `src/dashboard/js/components/AgentWorkspace.js`
4. Add CSS to `src/dashboard/css/components/`

## Testing Patterns

Node.js built-in test runner (`node:test` + `node:assert`):

```javascript
import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";

describe("Feature X", () => {
  it("should do Y", () => {
    assert.strictEqual(actual, expected);
  });
});
```

Integration tests handle offline gracefully:

```javascript
try {
  const res = await fetch("http://localhost:8080/api/endpoint");
  // ... assertions
} catch (err) {
  if (err.code === "ECONNREFUSED") {
    console.warn("Server not running, skipping test");
    return;
  }
  throw err;
}
```

## Conventions

- **ES Modules only**: `.js` extension required in ALL imports
- **Indent**: 2 spaces, semicolons everywhere
- **Trademark**: "BambiSleep™" (with ™), "BambiSleepChurch™" (no space)
- **No frameworks**: Vanilla Node HTTP, vanilla JS frontend
- **Minimal deps**: Only `ws`, `mongodb`, `dotenv`, `@modelcontextprotocol/sdk`
- **CSS**: `@layer` cascade, tokens in `variables.css`, components in `components/*.css`
- **Async/await**: Preferred over callbacks
- **Logging**: Use logger in every file, kebab-case names match filename

## Configuration

All config in `.vscode/settings.json` (JSONC format):

- MCP server definitions
- Command/args for each server
- Environment variables

Load via `getConfig()` from `src/utils/config.js` which handles JSONC parsing.

**Environment Variables** (with defaults):

```bash
API_PORT=8080
DASHBOARD_PORT=3000
LOG_LEVEL=info
MONGODB_URI=mongodb://localhost:27017
STORAGE_DIR=./data/storage
LMS_HOST=localhost
LMS_PORT=1234
```

## Key Files Reference

| Purpose          | Location                           | LOC   |
| ---------------- | ---------------------------------- | ----- |
| Entry point      | `src/index.js`                     | 80    |
| All API routes   | `src/api/routes.js`                | 2940  |
| Server registry  | `src/servers/index.js`             | 240   |
| 98 AI tools      | `src/servers/agent-tools.js`       | 2000+ |
| Model router     | `src/servers/model-router.js`      | 590   |
| WebSocket server | `src/api/websocket.js`             | 239   |
| WebGL avatar     | `src/dashboard/js/avatar-webgl.js` | 600+  |
| Speech synthesis | `src/dashboard/js/speech.js`       | 673   |
| Extended docs    | `docs/AGENT.md`                    | 893   |
