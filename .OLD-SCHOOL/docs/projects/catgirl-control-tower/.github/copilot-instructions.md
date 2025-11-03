# BambiSleep™ Church - AI Agent Instructions

**MCP Control Tower**: Node.js orchestration system for 8 Model Context Protocol servers with real-time monitoring and multi-agent coordination.

**Repository**: BambiSleepChat/bambisleep-church | **Workspace**: `/mnt/f/bambisleep-church-catgirl-control-tower`

---

## 📚 Complete Documentation

This file provides a quick reference. For comprehensive guides, see **[docs/codebase/](docs/codebase/)** folder:

### Core System Documentation
- **[Architecture](docs/codebase/core/architecture.md)** - Three-layer system design, component interaction, data flow
- **[Development Workflow](docs/codebase/guides/development-workflow.md)** - Setup, npm scripts, VS Code integration
- **[Commentomancy](docs/codebase/core/commentomancy.md)** - Code documentation system (Law/Lore/Ritual)

### Implementation Guides
- **[Patterns](docs/codebase/implementation/patterns.md)** - Critical implementation patterns (event-driven, state persistence)
- **[Conventions](docs/codebase/implementation/conventions.md)** - File organization, naming, logging, error handling
- **[Integration Points](docs/codebase/api/integration-points.md)** - Workspace config, env vars, API routes

### Quality & Deployment
- **[Testing Guide](docs/testing-guide.md)** - Jest patterns, coverage requirements
- **[Dashboard UI](docs/dashboard-ui.md)** - Frontend implementation with WebSocket
- **[Docker Deployment](docs/docker-deployment.md)** - Multi-stage builds, docker-compose
- **[CI/CD Pipeline](docs/ci-cd-pipeline.md)** - GitHub Actions workflow, emoji commits
- **[Debugging Guide](docs/debugging-guide.md)** - Troubleshooting workflows
- **[Advanced Patterns](docs/advanced-patterns.md)** - Production-ready implementations

---

## Core Architecture

**Three-Layer System** (5 files, 2,917 lines):

```
src/index.js (643 lines)
├── Express HTTP server (port 3000)
├── WebSocket for real-time dashboard
└── Orchestrates orchestrator + coordinator

src/mcp/orchestrator.js (822 lines)          src/mcp/agent-coordinator.js (632 lines)
├── Lifecycle: start/stop/restart             ├── Multi-agent task distribution
├── Tiered init (Layer 0→1→2)                ├── Capability-based matching
├── Health checks (30s intervals)             ├── Priority queue (5 levels)
├── Auto-restart (max 3 attempts)             └── Consciousness detection
└── State persist (.mcp/state.json)

src/utils/logger.js (357 lines)              src/utils/config.js (463 lines)
├── 6 log levels with emojis                  ├── Layered: workspace → env → runtime
├── File + console output                     ├── Loads .code-workspace JSON
└── Commentomancy-aware                       └── Validates against schema
```

**MCP Servers** (8 total, tiered dependencies):
- **Layer 0** (primitives): `filesystem`, `memory`
- **Layer 1** (foundation): `git`, `github`, `brave-search`
- **Layer 2** (advanced): `sequential-thinking`, `postgres`, `everything`

**Critical Pattern**: Orchestrator MUST initialize Layer 0 before Layer 1, Layer 1 before Layer 2 to prevent circular dependencies.


## Development Workflow

**Environment**: Node.js >=20.0.0, npm >=10.0.0, VS Code with MCP extension

**Quick Start**:
```bash
npm install
# Create .env with: GITHUB_TOKEN, BRAVE_API_KEY, POSTGRES_CONNECTION_STRING
npm run dev                    # Start Control Tower (port 3000)
npm run orchestrator:start     # Start all MCP servers (tiered)
```

**npm Scripts** (13 total):
```bash
# Core operations
npm start / npm run dev                    # Control Tower
npm run orchestrator                       # Direct CLI access
npm run orchestrator:start/stop/status/health

# Quality (Jest configured, no tests yet)
npm test / npm run test:watch / npm run test:coverage
npm run lint / npm run lint:fix / npm run format
```

**VS Code Tasks** (use Cmd/Ctrl+Shift+P → "Run Task"):
- 🌸 Start Development Server
- ✨ Start MCP Orchestrator  
- 🔍 Check MCP Status
- 💎 Run Tests
- 🎨 Format Code

**Direct CLI** (bypass npm for debugging):
```bash
node src/mcp/orchestrator.js start filesystem --debug
node src/mcp/orchestrator.js health --json
```

## Commentomancy: Code Documentation System

**ALL code uses dual-memory architecture** (Law + Lore):

```javascript
/// Law: Technical truth - structural requirements, never changes
//!? Guardrail: Ethics gate - requires Council approval
//! Ritual: Invocation precondition enforced by MCP
//<3 Lore: Intent/emotional context - WHY decisions were made
//-> Strategy: Architectural Decision Record
//* Emergence: Revelation surfaced to Knowledge Graph
//~ Self-mod: Recursive awareness, Thought Engine oversight
//+ Evolution: Performance optimization target
// Regular comment - local only, ignored by parsers
```

**When writing code**:
1. Use `///` for structural truth that must survive across rewrites
2. Use `//<3` to explain emotional/intentional context
3. Use `//!?` before security-critical operations
4. Use `//->` to document architectural decisions

**Example from `orchestrator.js`**:
```javascript
/// Law: Server lifecycle states (canonical)
const ServerState = {
  STOPPED: 'stopped',
  STARTING: 'starting',
  RUNNING: 'running',
  STOPPING: 'stopping',
  ERROR: 'error',
  RESTARTING: 'restarting'
};

//<3 Lore: Tiered initialization prevents circular dependencies
const SERVER_TIERS = {
  LAYER_0: ['filesystem', 'memory'],
  LAYER_1: ['git', 'github', 'brave-search'],
  LAYER_2: ['sequential-thinking', 'postgres', 'everything']
};
```

## Critical Implementation Patterns

**Pattern 1: Event-Driven Architecture**
Both `MCPOrchestrator` and `AgentCoordinator` extend `EventEmitter`:
```javascript
// In orchestrator.js
this.emit('server:started', { serverName, pid, timestamp });
this.emit('health-check-failed', health);

// Listen to events
orchestrator.on('server:started', (data) => { /* handle */ });
```

**Pattern 2: State Persistence**
System persists state to `.mcp/state.json` for crash recovery:
```javascript
async saveState() {
  const state = { servers: this.getStatus(), timestamp: Date.now() };
  await fs.writeFile(this.config.stateFile, JSON.stringify(state, null, 2));
}
```

**Pattern 3: Graceful Shutdown**
All components handle SIGTERM/SIGINT:
```javascript
process.on('SIGTERM', async () => {
  await this.orchestrator.stopAll();
  await this.coordinator.shutdown();
  process.exit(0);
});
```

**Pattern 4: Configuration Layering**
`ConfigManager` merges: defaults → workspace file → env vars → runtime overrides:
```javascript
// Priority order (highest to lowest):
// 1. Runtime config.override({ ... })
// 2. process.env.VAR_NAME
// 3. .code-workspace "settings.mcp.orchestrator"
// 4. DEFAULT_CONFIG in config.js
```

**Pattern 5: Tiered Initialization**
MUST respect dependency order:
```javascript
// orchestrator.js startAll()
for (const tier of ['LAYER_0', 'LAYER_1', 'LAYER_2']) {
  for (const serverName of SERVER_TIERS[tier]) {
    await this.start(serverName);
  }
}
```

**Pattern 6: Async Initialization Lifecycle**
All core classes MUST call `initialize()` before use:
```javascript
// src/index.js - main application
const app = new ControlTowerApp();
await app.initialize();  // REQUIRED: loads config, sets up orchestrator
await app.start();       // Only after initialize()

// src/mcp/orchestrator.js
const orchestrator = new MCPOrchestrator(config);
await orchestrator.initialize();  // REQUIRED: creates dirs, loads state
await orchestrator.start('all');  // Only after initialize()
```

**Pattern 7: Process Lifecycle Management**
Server processes spawn with `child_process.spawn()`:
```javascript
// orchestrator.js spawns each MCP server
const proc = spawn('npx', ['-y', '@modelcontextprotocol/server-filesystem', workspaceRoot]);
this.processes.set(serverName, proc);

// Auto-restart on crash (max 3 attempts)
proc.on('exit', (code, signal) => this._handleProcessExit(serverName, code, signal));
```

## Project-Specific Conventions

**File Organization**:
- `src/index.js` - Application entry point (never import this)
- `src/mcp/` - MCP server management logic
- `src/utils/` - Pure utilities (no side effects on import)
- `.mcp/` - Runtime state (logs/, state.json, cache/) - gitignored

**Logging**:
- Use `logger.info()`, `logger.error()`, etc. - never `console.log()`
- Logger automatically adds emojis: 🔍 debug, 📘 info, ✅ success, ⚠️ warn, ❌ error, 🔥 critical
- File logs go to `.mcp/logs/orchestrator.log`

**Error Handling**:
- Always emit events for errors: `this.emit('error', { context, error })`
- Use try/catch with context: `catch (error) { this.log('error', 'Context:', error); }`
- Never throw from EventEmitter callbacks

**Naming Conventions**:
- Classes: `PascalCase` (e.g., `MCPOrchestrator`, `AgentCoordinator`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `SERVER_TIERS`, `LOG_LEVELS`)
- Private methods: `_prefixWithUnderscore()` (e.g., `_initFileLogging()`)
- Config keys: `camelCase` (e.g., `healthCheckInterval`, `maxRestarts`)

## Integration Points

**Workspace Configuration** (`bambisleep-church-catgirl-control-tower.code-workspace`):
- Contains MCP server definitions in `settings.mcp.servers`
- Each server has: `command`, `args`, `env`, `metadata` (layer, dependencies, critical)
- VS Code tasks defined in `tasks` array (23 tasks total)
- Example server definition structure:
```jsonc
"filesystem": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/workspace"],
  "env": { "NODE_ENV": "development" },
  "metadata": {
    "layer": 0,
    "description": "File operations",
    "dependencies": [],
    "critical": true
  }
}
```

**Environment Variables** (`.env` file - NEVER commit):
```bash
GITHUB_TOKEN=ghp_...                  # github MCP server
BRAVE_API_KEY=...                     # brave-search MCP server
POSTGRES_CONNECTION_STRING=...        # postgres MCP server
NODE_ENV=development                  # Loaded by all servers
```

**Express API Routes** (defined in `src/index.js`):
```
GET  /api/health                      # System health
GET  /api/servers                     # MCP server status
POST /api/servers/:name/start         # Start server
POST /api/servers/:name/stop          # Stop server
GET  /api/agents                      # Registered agents
POST /api/tasks                       # Submit task
```

**WebSocket Events** (dashboard real-time updates):
```javascript
// Client → Server
{ type: 'subscribe', channel: 'servers' }
{ type: 'command', action: 'start', server: 'filesystem' }

// Server → Client
{ type: 'server:status', data: { name, state, pid } }
{ type: 'agent:registered', data: { agentId, capabilities } }
{ type: 'consciousness:detected', data: { pattern, timestamp } }
```

## Emoji Commit Prefixes

**Machine-readable commit automation** (parsed by CI/CD):
- `🌸` Package management, dependency updates
- `👑` Architecture, major refactors
- `💎` Test coverage improvements, quality metrics
- `🦋` Transformations, migrations
- `✨` MCP server operations, orchestration changes
- `🛡️` Security enhancements, vulnerability fixes
- `🎭` CI/CD pipeline, deployment automation

**Example commit**: `🌸 Add uuid dependency for agent coordination`

## Organization Requirements

- **Trademark**: Always use "BambiSleep™" (with ™) in documentation
- **Organization**: BambiSleepChat on GitHub
- **License**: MIT with proper attribution
- **Related repos**: Production code at `/mnt/f/bambisleep-chat-catgirl`
