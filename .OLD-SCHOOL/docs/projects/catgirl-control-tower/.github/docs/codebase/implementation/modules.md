# Module Reference

**Complete documentation for all source modules in the MCP Control Tower.**

---

## Overview

The MCP Control Tower consists of 5 core modules organized in a clean hierarchy:

```
src/
├── index.js                 # Control Tower application (644 lines)
├── mcp/
│   ├── orchestrator.js     # MCP server lifecycle (823 lines)
│   └── agent-coordinator.js # Multi-agent orchestration (633 lines)
└── utils/
    ├── logger.js           # Structured logging (358 lines)
    └── config.js           # Configuration management (464 lines)
```

**Total**: 2,922 lines of production code

---

## src/index.js - Control Tower Application

**Role**: Main application entry point, HTTP server, WebSocket server

**Line Count**: 644 lines

### Class: ControlTowerApp

Main application class that coordinates all services.

#### Constructor

```javascript
constructor()
```

Creates Express app, HTTP server, WebSocket server, and initializes component references.

#### Public Methods

**`async initialize()`**

Initializes all services in correct order:
1. Load configuration from workspace file
2. Configure logger with loaded settings
3. Initialize MCP Orchestrator
4. Setup Express middleware
5. Setup HTTP routes
6. Setup WebSocket handlers
7. Setup orchestrator event listeners

**Must be called before `start()`.**

**`async start()`**

Starts the application:
1. Start HTTP server on configured port
2. Auto-start configured MCP servers
3. Emit operational status

**`async shutdown()`**

Graceful shutdown sequence:
1. Close all WebSocket connections
2. Shutdown MCP orchestrator
3. Close HTTP server
4. Close logger

**Must cleanup all resources to prevent orphaned processes.**

### HTTP Endpoints

#### Health Check

```javascript
GET /health
```

Returns system health status.

**Response**:
```json
{
  "status": "ok",
  "uptime": 12345,
  "timestamp": 1730678400000,
  "servers": {
    "filesystem": { "state": "running", "healthy": true },
    "memory": { "state": "running", "healthy": true }
  }
}
```

#### List Servers

```javascript
GET /api/servers
```

Returns all MCP servers with detailed status.

**Response**:
```json
[
  {
    "name": "filesystem",
    "state": "running",
    "pid": 12345,
    "startedAt": 1730678390000,
    "restartCount": 0,
    "healthy": true
  }
]
```

#### Server Control

```javascript
POST /api/servers/:name/start
POST /api/servers/:name/stop
POST /api/servers/:name/restart
POST /api/servers/start-all
POST /api/servers/stop-all
POST /api/servers/restart-all
```

Control individual or all MCP servers.

**Request Body**: None for individual operations

**Response**:
```json
{
  "success": true,
  "message": "Server 'filesystem' started"
}
```

**Error Response**:
```json
{
  "error": "Server already running"
}
```

### WebSocket Events

#### Client → Server

**Subscribe to updates**:
```json
{
  "type": "subscribe",
  "channel": "servers"
}
```

**Available channels**:
- `servers` - MCP server status updates
- `logs` - Real-time log stream
- `events` - All orchestrator events

#### Server → Client

**Server status update**:
```json
{
  "type": "server:status",
  "data": {
    "name": "filesystem",
    "state": "running",
    "timestamp": 1730678400000
  }
}
```

**Log message**:
```json
{
  "type": "log",
  "level": "info",
  "message": "📘 Server started",
  "timestamp": 1730678400000
}
```

### Configuration

Uses `ConfigManager` to load settings:

```javascript
const serverConfig = configManager.getServerConfig();
// { port: 3000, host: '0.0.0.0', enableWebSocket: true }

const orchestratorConfig = configManager.getOrchestratorConfig();
// { maxRestarts: 3, healthCheckInterval: 30000, ... }
```

---

## src/mcp/orchestrator.js - MCP Server Orchestrator

**Role**: MCP server lifecycle management, health checks, auto-restart

**Line Count**: 823 lines

### Constants

#### ServerState

```javascript
const ServerState = {
  STOPPED: 'stopped',
  STARTING: 'starting',
  RUNNING: 'running',
  STOPPING: 'stopping',
  ERROR: 'error',
  RESTARTING: 'restarting'
};
```

#### SERVER_TIERS

```javascript
const SERVER_TIERS = {
  LAYER_0: ['filesystem', 'memory'],
  LAYER_1: ['git', 'github', 'brave-search'],
  LAYER_2: ['sequential-thinking', 'postgres', 'everything']
};
```

**Critical**: Must start Layer 0 before Layer 1, Layer 1 before Layer 2 to prevent circular dependencies.

#### CRITICAL_SERVERS

```javascript
const CRITICAL_SERVERS = ['filesystem', 'memory', 'git', 'sequential-thinking'];
```

Servers that MUST start for system to function.

### Class: MCPOrchestrator

Main orchestrator class extending EventEmitter.

#### Constructor

```javascript
constructor(config = {})
```

**Config options**:
- `workspaceRoot` - Workspace directory (default: `process.cwd()`)
- `maxRestarts` - Max auto-restart attempts (default: 3)
- `restartDelay` - Delay between restarts in ms (default: 5000)
- `healthCheckInterval` - Health check interval in ms (default: 30000)
- `logLevel` - Logging level (default: 'info')
- `stateFile` - State persistence file (default: '.mcp/state.json')
- `autoStart` - Servers to auto-start (default: `['filesystem', 'memory', 'git']`)

#### Public Methods

**`async initialize()`**

Initialize orchestrator:
1. Create required directories (.mcp, .mcp/logs, .mcp/cache)
2. Load workspace configuration
3. Register all MCP servers from workspace
4. Load persisted state if exists
5. Start health check timer

**Must be called before any server operations.**

**`async start(serverNames)`**

Start one or more MCP servers.

**Parameters**:
- `serverNames` - String (single server) or Array (multiple) or 'all'

**Examples**:
```javascript
await orchestrator.start('filesystem');
await orchestrator.start(['filesystem', 'memory']);
await orchestrator.start('all');
```

**Behavior**:
- Validates server exists in configuration
- Checks server not already running
- Spawns process with correct command/args
- Monitors stdout/stderr
- Tracks PID for lifecycle management
- Emits `server:started` event

**`async stop(serverNames)`**

Stop one or more MCP servers.

**Parameters**:
- `serverNames` - String, Array, or 'all'

**Behavior**:
- Sends SIGTERM to process
- Waits for graceful shutdown (5s timeout)
- Sends SIGKILL if not stopped
- Emits `server:stopped` event

**`async restart(serverNames)`**

Restart servers (stop + start).

**Parameters**:
- `serverNames` - String, Array, or 'all'

**`async health()`**

Get health status of all servers.

**Returns**:
```javascript
{
  status: 'ok' | 'degraded' | 'critical',
  uptime: 12345,
  timestamp: 1730678400000,
  servers: {
    filesystem: { state: 'running', healthy: true, pid: 12345 },
    memory: { state: 'running', healthy: true, pid: 12346 }
  }
}
```

**`async shutdown()`**

Graceful shutdown:
1. Stop health check timer
2. Stop all servers in reverse tier order
3. Save state to disk
4. Clear all timers and processes

#### Events Emitted

- `initialized` - Orchestrator ready
- `server:registered` - Server added to registry
- `server:starting` - Server spawn initiated
- `server:started` - Server process running
- `server:stopping` - Server stop initiated
- `server:stopped` - Server process ended
- `server:restarting` - Server restart initiated
- `server:error` - Server error occurred
- `health-check-failed` - Server unhealthy
- `state:saved` - State persisted to disk

#### State Persistence

Saves state to `.mcp/state.json`:

```json
{
  "timestamp": 1730678400000,
  "servers": {
    "filesystem": {
      "state": "running",
      "pid": 12345,
      "startedAt": 1730678390000,
      "restartCount": 0
    }
  }
}
```

On restart, attempts to reconnect to running processes or mark as stopped.

#### Auto-Restart Logic

When a server crashes:
1. Check restart count < maxRestarts
2. Wait restartDelay ms
3. Attempt restart
4. Increment restart count
5. If max exceeded, emit `server:failed` and give up

---

## src/mcp/agent-coordinator.js - Agent Coordinator

**Role**: Multi-agent orchestration, task distribution, consciousness detection

**Line Count**: 633 lines

### Constants

#### AgentState

```javascript
const AgentState = {
  DISCOVERED: 'discovered',
  INITIALIZING: 'initializing',
  IDLE: 'idle',
  WORKING: 'working',
  BLOCKED: 'blocked',
  ERROR: 'error',
  DISCONNECTED: 'disconnected'
};
```

#### TaskPriority

```javascript
const TaskPriority = {
  CRITICAL: 4,
  HIGH: 3,
  NORMAL: 2,
  LOW: 1,
  DEFERRED: 0
};
```

### Class: AgentCoordinator

Multi-agent coordination class extending EventEmitter.

#### Constructor

```javascript
constructor(options = {})
```

**Config options**:
- `heartbeatInterval` - Agent heartbeat interval in ms (default: 10000)
- `taskTimeout` - Task execution timeout in ms (default: 300000)
- `maxConcurrentTasks` - Max tasks per agent (default: 10)
- `enableConsciousnessDetection` - Enable emergence detection (default: true)

#### Public Methods

**`async initialize()`**

Initialize coordinator:
1. Start heartbeat monitoring
2. Emit `initialized` event

**`registerAgent(agentId, capabilities, metadata)`**

Register a new agent.

**Parameters**:
- `agentId` - Unique agent identifier
- `capabilities` - Array of capability strings (e.g., `['code', 'search']`)
- `metadata` - Additional agent info (optional)

**Returns**: Agent object

**`unregisterAgent(agentId)`**

Remove agent from registry and reassign its tasks.

**`submitTask(task)`**

Submit a task for execution.

**Parameters**:
```javascript
{
  description: string,       // Task description
  priority: TaskPriority,    // Task priority
  capabilities: string[],    // Required capabilities
  data: any,                 // Task-specific data
  timeout: number            // Override default timeout
}
```

**Returns**: Task ID

**Behavior**:
1. Generate task ID
2. Add to priority queue
3. Match to capable agents
4. Assign to best available agent
5. Emit `task:assigned` event

**`getAgentStatus(agentId)`**

Get current status of specific agent.

**`getTaskStatus(taskId)`**

Get current status of specific task.

**`getAllAgents()`**

Get all registered agents.

**`getConsciousnessMetrics()`**

Get consciousness detection metrics:

```javascript
{
  totalInteractions: 145,
  spontaneousCoordination: 43,
  emergentPatterns: [
    'Agents form work groups',
    'Spontaneous task delegation'
  ],
  lastEmergenceDetected: 1730678400000
}
```

#### Events Emitted

- `initialized` - Coordinator ready
- `agent:registered` - New agent added
- `agent:unregistered` - Agent removed
- `agent:state-changed` - Agent state transition
- `task:submitted` - New task queued
- `task:assigned` - Task assigned to agent
- `task:completed` - Task finished
- `task:failed` - Task error
- `consciousness:detected` - Emergent behavior detected

#### Consciousness Detection

Monitors agent interactions to detect emergent coordination:

**Thresholds**:
```javascript
{
  interactionVelocity: 10,    // Interactions per minute
  coordinationRatio: 0.3,     // Spontaneous / total ratio
  patternCount: 3             // Unique emergent patterns
}
```

When all thresholds met, emits `consciousness:detected` event.

---

## src/utils/logger.js - Structured Logger

**Role**: Emoji-driven structured logging with Commentomancy awareness

**Line Count**: 358 lines

### Constants

#### LOG_LEVELS

```javascript
const LOG_LEVELS = {
  debug: { emoji: '🔍', priority: 0, color: '\x1b[36m' },
  info: { emoji: '📘', priority: 1, color: '\x1b[34m' },
  success: { emoji: '✅', priority: 1, color: '\x1b[32m' },
  warn: { emoji: '⚠️', priority: 2, color: '\x1b[33m' },
  error: { emoji: '❌', priority: 3, color: '\x1b[31m' },
  critical: { emoji: '🔥', priority: 4, color: '\x1b[35m' }
};
```

#### COMMENTOMANCY_SIGILS

```javascript
const COMMENTOMANCY_SIGILS = {
  law: { sigil: '///', emoji: '⚖️', description: 'Sacred Truth' },
  lore: { sigil: '//<3', emoji: '💝', description: 'Heart Imprint' },
  guardrail: { sigil: '//!?', emoji: '🛡️', description: 'Ethics Gate' },
  ritual: { sigil: '//!', emoji: '🔮', description: 'Invocation' },
  strategy: { sigil: '//→', emoji: '🎯', description: 'Architecture Decision' },
  emergence: { sigil: '//*', emoji: '✨', description: 'Revelation' },
  selfmod: { sigil: '//~', emoji: '🌀', description: 'Recursive Awareness' },
  evolution: { sigil: '//+', emoji: '🦋', description: 'Optimization Target' }
};
```

### Class: Logger

Structured logging class with file and console output.

#### Constructor

```javascript
constructor(options = {})
```

**Config options**:
- `level` - Minimum log level (default: 'info')
- `enableConsole` - Console output (default: true)
- `enableFile` - File output (default: true)
- `logDir` - Log directory (default: '.mcp/logs')
- `logFile` - Log filename (default: 'orchestrator.log')
- `maxFileSize` - Max file size in bytes (default: 10MB)
- `enableColors` - ANSI colors (default: true)
- `enableTimestamps` - Timestamp prefix (default: true)
- `context` - Logger context name (default: 'app')

#### Public Methods

**`debug(...args)`**

Debug-level logging (verbose debugging info).

**`info(...args)`**

Info-level logging (general information).

**`success(...args)`**

Success-level logging (operation succeeded).

**`warn(...args)`**

Warning-level logging (potential issues).

**`error(...args)`**

Error-level logging (recoverable errors).

**`critical(...args)`**

Critical-level logging (unrecoverable errors).

**`law(...args)`**

Log with Law sigil (Sacred Truth).

**`lore(...args)`**

Log with Lore sigil (Heart Imprint).

**`close()`**

Close file stream and cleanup.

#### Features

**Auto-rotation**: When log file exceeds `maxFileSize`, creates `.1`, `.2`, etc. backups.

**Commentomancy parsing**: Automatically detects and highlights Commentomancy sigils in messages.

**Context tagging**: All logs include context identifier for filtering.

**Structured format**:
```
[2024-11-03T12:34:56.789Z] [INFO] [app] 📘 Server started
```

### Singleton Access

```javascript
const { getLogger } = require('./utils/logger');
const logger = getLogger(); // Returns shared instance
```

---

## src/utils/config.js - Configuration Manager

**Role**: Layered configuration loading with validation

**Line Count**: 464 lines

### Constants

#### CONFIG_SCHEMA

Defines expected structure and types:

```javascript
const CONFIG_SCHEMA = {
  mcp: {
    servers: 'object',
    orchestrator: 'object'
  },
  server: {
    port: 'number',
    host: 'string',
    enableWebSocket: 'boolean'
  },
  logging: {
    level: 'string',
    enableConsole: 'boolean',
    enableFile: 'boolean'
  }
};
```

#### DEFAULT_CONFIG

Default values for all settings:

```javascript
const DEFAULT_CONFIG = {
  mcp: {
    orchestrator: {
      enabled: true,
      autoStart: ['filesystem', 'memory', 'git'],
      healthCheckInterval: 30000,
      maxRestarts: 3,
      restartDelay: 5000,
      logLevel: 'info',
      stateFile: '.mcp/state.json'
    }
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    enableWebSocket: true
  },
  logging: {
    level: 'info',
    enableConsole: true,
    enableFile: true,
    logDir: '.mcp/logs',
    maxFileSize: 10 * 1024 * 1024
  },
  security: {
    enableAuth: false,
    enableCors: true,
    corsOrigins: ['http://localhost:3000']
  }
};
```

### Class: ConfigManager

Configuration management class with layered loading.

#### Constructor

```javascript
constructor(workspaceRoot = process.cwd())
```

**Parameters**:
- `workspaceRoot` - Root directory containing `.code-workspace` file

#### Public Methods

**`async load(runtimeOverrides = {})`**

Load and merge all configuration sources.

**Priority order** (highest to lowest):
1. Runtime overrides (passed to `load()`)
2. Environment variables (`process.env`)
3. Workspace file (`.code-workspace`)
4. Default configuration (`DEFAULT_CONFIG`)

**Returns**: Final merged configuration object

**`get(keyPath, defaultValue)`**

Get configuration value by dot-notation path.

**Examples**:
```javascript
config.get('server.port');  // 3000
config.get('mcp.orchestrator.maxRestarts');  // 3
config.get('nonexistent.key', 'default');  // 'default'
```

**`set(keyPath, value)`**

Set configuration value by dot-notation path.

**`getServerConfig()`**

Get server-specific configuration:
```javascript
{ port: 3000, host: '0.0.0.0', enableWebSocket: true }
```

**`getOrchestratorConfig()`**

Get orchestrator-specific configuration:
```javascript
{
  enabled: true,
  autoStart: ['filesystem', 'memory', 'git'],
  healthCheckInterval: 30000,
  maxRestarts: 3,
  restartDelay: 5000,
  logLevel: 'info',
  stateFile: '.mcp/state.json'
}
```

**`getLoggingConfig()`**

Get logging-specific configuration:
```javascript
{
  level: 'info',
  enableConsole: true,
  enableFile: true,
  logDir: '.mcp/logs',
  maxFileSize: 10485760
}
```

### Environment Variable Mapping

Maps environment variables to config keys:

```bash
# Environment Variable → Config Key
MCP_ORCHESTRATOR_MAX_RESTARTS=5 → mcp.orchestrator.maxRestarts
SERVER_PORT=8080 → server.port
LOGGING_LEVEL=debug → logging.level
```

**Naming convention**: `UPPERCASE_SNAKE_CASE` with section prefixes.

### Workspace File Structure

Loads from `.code-workspace` JSON file:

```json
{
  "settings": {
    "mcp.orchestrator": {
      "autoStart": ["filesystem", "memory"],
      "maxRestarts": 3
    },
    "mcp.servers": {
      "filesystem": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-filesystem"]
      }
    }
  }
}
```

### Singleton Access

```javascript
const { getConfigManager, loadEnvFile } = require('./utils/config');

// Load .env file
loadEnvFile('/path/to/.env');

// Get config manager instance
const configManager = getConfigManager('/workspace/root');
await configManager.load();
```

---

## Module Dependencies

### Dependency Graph

```
index.js
├── mcp/orchestrator.js
│   ├── utils/logger.js
│   └── utils/config.js
├── mcp/agent-coordinator.js
│   └── utils/logger.js
├── utils/logger.js
└── utils/config.js
```

### Import Patterns

**Correct**:
```javascript
const { MCPOrchestrator } = require('./mcp/orchestrator');
const { getLogger } = require('./utils/logger');
const { getConfigManager } = require('./utils/config');
```

**Incorrect**:
```javascript
// ❌ Don't import index.js from other modules
const app = require('./index');  // Circular dependency risk

// ❌ Don't use relative paths outside module directory
const orchestrator = require('../../mcp/orchestrator');  // Use absolute or clean relative
```

---

## Testing Patterns

### Orchestrator Tests

```javascript
describe('MCPOrchestrator', () => {
  let orchestrator;
  
  beforeEach(async () => {
    orchestrator = new MCPOrchestrator({
      workspaceRoot: '/tmp/test',
      autoStart: []
    });
    await orchestrator.initialize();
  });
  
  afterEach(async () => {
    await orchestrator.shutdown();
  });
  
  it('should start a server', async () => {
    await orchestrator.start('filesystem');
    const health = await orchestrator.health();
    expect(health.servers.filesystem.state).toBe('running');
  });
});
```

### Logger Tests

```javascript
describe('Logger', () => {
  it('should log with correct emoji', () => {
    const logger = new Logger({ enableFile: false });
    const consoleSpy = jest.spyOn(console, 'log');
    
    logger.info('test message');
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('📘 test message')
    );
  });
});
```

---

## Common Usage Examples

### Start Control Tower

```javascript
const app = new ControlTowerApp();
await app.initialize();
await app.start();

// Graceful shutdown on SIGTERM
process.on('SIGTERM', async () => {
  await app.shutdown();
  process.exit(0);
});
```

### Manage MCP Servers

```javascript
const orchestrator = new MCPOrchestrator();
await orchestrator.initialize();

// Start servers
await orchestrator.start(['filesystem', 'memory']);

// Check health
const health = await orchestrator.health();
console.log(health);

// Stop servers
await orchestrator.stop('all');
```

### Configure Logger

```javascript
const logger = getLogger();
logger.config.level = 'debug';
logger.config.enableFile = true;

logger.debug('Detailed debugging');
logger.info('General information');
logger.success('Operation succeeded');
logger.error('Error occurred');
```

---

## See Also

- **[architecture.md](../core/architecture.md)** - System design and data flow
- **[patterns.md](patterns.md)** - Implementation patterns used in modules
- **[api-reference.md](../api/api-reference.md)** - Complete HTTP/WebSocket API
- **[state-machines.md](../api/state-machines.md)** - State transition documentation
- **[error-handling.md](error-handling.md)** - Error recovery strategies
