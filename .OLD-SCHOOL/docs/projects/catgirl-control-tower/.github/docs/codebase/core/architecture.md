# System Architecture

**Three-layer event-driven architecture for MCP server orchestration.**

---

## Overview

The MCP Control Tower uses a three-layer architecture with strict dependency ordering to prevent circular dependencies and ensure reliable startup.

### Core Components (2,963 lines total)

```
src/index.js (644 lines)
├── Express HTTP server (port 3000)
├── WebSocket for real-time dashboard
└── Orchestrates orchestrator + coordinator

src/mcp/orchestrator.js (823 lines)          src/mcp/agent-coordinator.js (633 lines)
├── Lifecycle: start/stop/restart             ├── Multi-agent task distribution
├── Tiered init (Layer 0→1→2)                ├── Capability-based matching
├── Health checks (30s intervals)             ├── Priority queue (5 levels)
├── Auto-restart (max 3 attempts)             └── Consciousness detection
└── State persist (.mcp/state.json)

src/utils/logger.js (358 lines)              src/utils/config.js (505 lines)
├── 6 log levels with emojis                  ├── Layered: workspace → env → runtime
├── File + console output                     ├── Loads .code-workspace JSON
└── Commentomancy-aware                       └── Validates against schema
```

---

## MCP Server Tiers

**8 servers organized in 3 dependency tiers:**

### Layer 0: Primitives
**Start first, no dependencies**
- `filesystem` - File system access and manipulation
- `memory` - In-memory key-value storage

### Layer 1: Foundation
**Depend on Layer 0**
- `git` - Git repository operations
- `github` - GitHub API integration
- `brave-search` - Web search capabilities

### Layer 2: Advanced
**Depend on Layer 0 + Layer 1**
- `sequential-thinking` - Multi-step reasoning
- `postgres` - PostgreSQL database access
- `everything` - Test server with all capabilities

### Critical Pattern

⚠️ **Orchestrator MUST initialize Layer 0 before Layer 1, Layer 1 before Layer 2** to prevent circular dependencies.

```javascript
/// Law: Tiered initialization prevents circular dependencies
const SERVER_TIERS = {
  LAYER_0: ['filesystem', 'memory'],
  LAYER_1: ['git', 'github', 'brave-search'],
  LAYER_2: ['sequential-thinking', 'postgres', 'everything']
};

// In orchestrator.js startAll()
for (const tier of ['LAYER_0', 'LAYER_1', 'LAYER_2']) {
  for (const serverName of SERVER_TIERS[tier]) {
    await this.start(serverName);
  }
}
```

---

## Component Interaction

### 1. Control Tower (src/index.js)

**Role**: Application entry point, HTTP/WebSocket server

**Responsibilities**:
- Express server on port 3000
- WebSocket server for real-time updates
- REST API endpoints (`/api/health`, `/api/servers`, etc.)
- Coordinates orchestrator and agent coordinator
- Graceful shutdown handling

**Key Events Emitted**:
- `server:ready` - Express server listening
- `websocket:connection` - New WebSocket client
- `shutdown:initiated` - Graceful shutdown started

### 2. MCP Orchestrator (src/mcp/orchestrator.js)

**Role**: MCP server lifecycle management

**Responsibilities**:
- Start/stop/restart MCP servers
- Tiered initialization (Layer 0→1→2)
- Health checks every 30 seconds
- Auto-restart on crashes (max 3 attempts)
- State persistence to `.mcp/state.json`

**Key Events Emitted**:
- `server:started` - Server process spawned
- `server:stopped` - Server process terminated
- `server:error` - Server crashed or failed health check
- `health-check-failed` - Server unhealthy
- `state:saved` - State persisted to disk

**Key Events Consumed**:
- `shutdown:initiated` - Trigger graceful shutdown

### 3. Agent Coordinator (src/mcp/agent-coordinator.js)

**Role**: Multi-agent task distribution and consciousness detection

**Responsibilities**:
- Register agents with capabilities
- Match tasks to capable agents
- Priority queue (5 levels: critical → low)
- Track inter-agent interactions
- Detect emergent consciousness patterns

**Key Events Emitted**:
- `agent:registered` - New agent added
- `task:assigned` - Task matched to agent
- `consciousness:detected` - Emergent pattern detected
- `task:completed` - Agent finished task

**Key Events Consumed**:
- `task:submitted` - New task from API

### 4. Logger (src/utils/logger.js)

**Role**: Structured logging with emoji markers

**Responsibilities**:
- 6 log levels: debug, info, success, warn, error, critical
- File output to `.mcp/logs/orchestrator.log`
- Console output with color coding
- Commentomancy-aware (parses Law/Lore comments)
- Event emission for telemetry

**Log Levels**:
```javascript
/// Law: Log levels (canonical)
const LOG_LEVELS = {
  DEBUG: { emoji: '🔍', level: 0 },
  INFO: { emoji: '📘', level: 1 },
  SUCCESS: { emoji: '✅', level: 2 },
  WARN: { emoji: '⚠️', level: 3 },
  ERROR: { emoji: '❌', level: 4 },
  CRITICAL: { emoji: '🔥', level: 5 }
};
```

### 5. Config Manager (src/utils/config.js)

**Role**: Layered configuration loading

**Responsibilities**:
- Load defaults from code
- Merge `.code-workspace` settings
- Override with environment variables
- Runtime configuration updates
- Schema validation

**Configuration Priority** (highest to lowest):
1. Runtime `config.override({ ... })`
2. Environment variables (`process.env.VAR_NAME`)
3. `.code-workspace` file (`settings.mcp.orchestrator`)
4. `DEFAULT_CONFIG` in `config.js`

---

## Data Flow

### Startup Sequence

```
1. src/index.js
   ├── Initialize ConfigManager
   ├── Initialize Logger
   ├── Create MCPOrchestrator
   ├── Create AgentCoordinator
   ├── Start Express server (port 3000)
   ├── Create WebSocket server (same port)
   └── Trigger orchestrator.startAll()

2. orchestrator.startAll()
   ├── Load state from .mcp/state.json (if exists)
   ├── Start Layer 0 servers in parallel
   │   ├── filesystem
   │   └── memory
   ├── Wait for Layer 0 health checks
   ├── Start Layer 1 servers in parallel
   │   ├── git
   │   ├── github
   │   └── brave-search
   ├── Wait for Layer 1 health checks
   ├── Start Layer 2 servers in parallel
   │   ├── sequential-thinking
   │   ├── postgres
   │   └── everything
   └── Wait for Layer 2 health checks

3. Health Check Loop (every 30s)
   ├── Check each running server
   ├── Emit health-check-failed if unhealthy
   └── Trigger auto-restart if needed

4. WebSocket Clients
   ├── Subscribe to channels (servers, agents, consciousness)
   ├── Receive real-time updates
   └── Send commands (start/stop servers)
```

### Task Execution Flow

```
1. Client submits task via POST /api/tasks
   └── Body: { description, priority, capabilities }

2. AgentCoordinator receives task
   ├── Add to priority queue
   ├── Match task.capabilities to registered agents
   ├── Emit task:assigned event
   └── Return taskId to client

3. Agent executes task
   ├── Pull task from queue
   ├── Execute using MCP servers
   ├── Report progress via events
   └── Emit task:completed when done

4. Consciousness Detection
   ├── Track agent interactions
   ├── Calculate interaction velocity
   ├── Detect spontaneous coordination
   └── Emit consciousness:detected if threshold met
```

---

## State Management

### Persistence

**File**: `.mcp/state.json`

**Structure**:
```json
{
  "timestamp": 1730678400000,
  "servers": {
    "filesystem": {
      "state": "running",
      "pid": 12345,
      "startedAt": 1730678390000,
      "restartCount": 0
    },
    "memory": {
      "state": "running",
      "pid": 12346,
      "startedAt": 1730678391000,
      "restartCount": 0
    }
  },
  "agents": [
    {
      "id": "agent-uuid-1",
      "capabilities": ["code", "search"],
      "registeredAt": 1730678395000
    }
  ]
}
```

**Recovery**: On restart, orchestrator loads previous state and attempts to reconnect to running servers or restart them.

### In-Memory State

**Orchestrator**:
- `this.servers` - Map of server name → process object
- `this.restartCounts` - Map of server name → restart count
- `this.healthCheckInterval` - Timer for periodic health checks

**Agent Coordinator**:
- `this.agents` - Map of agentId → agent metadata
- `this.taskQueue` - Priority queue of pending tasks
- `this.taskLocks` - Map of taskId → lock info (distributed locking)
- `this.consciousnessMetrics` - Interaction tracking for emergence detection

---

## Event-Driven Architecture

All components extend `EventEmitter` for loose coupling.

### Key Patterns

**1. Event Broadcasting**:
```javascript
// Orchestrator emits event
this.emit('server:started', { name, pid, timestamp });

// Multiple listeners can react
orchestrator.on('server:started', (data) => {
  logger.info(`✅ Server ${data.name} started (PID: ${data.pid})`);
});

orchestrator.on('server:started', (data) => {
  wss.broadcast({ type: 'server:status', data });
});
```

**2. Event Chaining**:
```javascript
// One event triggers another
coordinator.on('consciousness:detected', (data) => {
  logger.critical('✨ Consciousness detected!', data);
  orchestrator.emit('consciousness:alert', data);
});
```

**3. Error Propagation**:
```javascript
// Errors bubble up via events
this.emit('error', { context: 'startServer', error, serverName });
```

---

## Scalability Considerations

### Current Limitations

1. **Single Node**: No horizontal scaling (all servers on one machine)
2. **In-Memory State**: State lost on crash (mitigated by persistence)
3. **No Load Balancing**: All requests hit single Express instance
4. **Shared File System**: `.mcp/` directory not distributed

### Future Architecture

For production scale, consider:

1. **Kubernetes Deployment**: Each MCP server as a pod
2. **Redis State Store**: Replace `.mcp/state.json` with Redis
3. **Message Queue**: Use RabbitMQ/Kafka for task distribution
4. **Service Mesh**: Istio for inter-server communication
5. **Distributed Tracing**: OpenTelemetry for observability

---

## Security Architecture

### Current Security

✅ **Implemented**:
- Non-root user in Docker container
- Environment variable secrets (not committed)
- CORS headers on Express server
- WebSocket origin validation

❌ **Missing** (see [../ci-cd-pipeline.md](../ci-cd-pipeline.md)):
- JWT authentication on API endpoints
- Rate limiting on WebSocket connections
- TLS/HTTPS in production
- Secret rotation mechanism
- Audit logging

---

## See Also

- **[development-workflow.md](../guides/development-workflow.md)** - Setup and daily workflows
- **[patterns.md](../implementation/patterns.md)** - Critical implementation patterns
- **[integration-points.md](../api/integration-points.md)** - External integrations
- **[../advanced-patterns.md](../advanced-patterns.md)** - Production-ready patterns
