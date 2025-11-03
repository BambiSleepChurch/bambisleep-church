# State Machines

**Complete state machine documentation for ServerState and AgentState transitions.**

---

## Overview

The MCP Control Tower uses finite state machines (FSM) to manage lifecycle states:

1. **ServerState** - MCP server lifecycle (orchestrator.js)
2. **AgentState** - Agent lifecycle (agent-coordinator.js)

All state transitions are deterministic and emit events for observability.

---

## ServerState Machine

**Location**: `src/mcp/orchestrator.js`

### States

```javascript
const ServerState = {
  STOPPED: 'stopped',      // Server process not running
  STARTING: 'starting',    // Server spawn initiated
  RUNNING: 'running',      // Server process active and healthy
  STOPPING: 'stopping',    // Server shutdown initiated
  ERROR: 'error',          // Server crashed or health check failed
  RESTARTING: 'restarting' // Server restart sequence in progress
};
```

### State Diagram

```
                    ┌──────────────┐
                    │   STOPPED    │◄────────────┐
                    └──────┬───────┘             │
                           │ start()             │
                           ▼                     │
                    ┌──────────────┐             │
                    │   STARTING   │             │
                    └──────┬───────┘             │
                           │ process spawned     │
                           ▼                     │
                    ┌──────────────┐             │
           ┌───────►│   RUNNING    │─────┐       │
           │        └──────┬───────┘     │       │
           │               │             │       │
           │               │ stop()      │ crash │
           │               ▼             │       │
           │        ┌──────────────┐     │       │
           │        │   STOPPING   │     │       │
           │        └──────┬───────┘     │       │
           │               │             │       │
           │               │ process     │       │
           │               │ terminated  │       │
           │               └─────────────┼───────┘
           │                             │
           │                             ▼
           │                      ┌──────────────┐
           │                      │    ERROR     │
           │                      └──────┬───────┘
           │                             │
           │                             │ auto-restart
           │                             │ (if < maxRestarts)
           │                             ▼
           │                      ┌──────────────┐
           │                      │  RESTARTING  │
           └──────────────────────┴──────────────┘
```

### Valid Transitions

| From | To | Trigger | Event Emitted |
|------|----|---------|--------------
| STOPPED | STARTING | `start()` | `server:starting` |
| STARTING | RUNNING | Process spawned | `server:started` |
| STARTING | ERROR | Spawn failed | `server:error` |
| RUNNING | STOPPING | `stop()` | `server:stopping` |
| RUNNING | ERROR | Crash / health fail | `server:error` |
| RUNNING | RESTARTING | `restart()` | `server:restarting` |
| STOPPING | STOPPED | Process terminated | `server:stopped` |
| ERROR | RESTARTING | Auto-restart | `server:restarting` |
| ERROR | STOPPED | Max restarts exceeded | `server:failed` |
| RESTARTING | STARTING | Restart delay complete | `server:starting` |

### Invalid Transitions

These transitions are prevented by guard conditions:

| From | To | Why Invalid |
|------|----|-----------
| STOPPED | RUNNING | Must go through STARTING |
| STARTING | STOPPED | Must complete start or fail to ERROR |
| RUNNING | STARTING | Already running |
| STOPPING | STARTING | Must complete stop first |

### Transition Implementation

**start() method**:

```javascript
async start(serverName) {
  const server = this.servers.get(serverName);
  
  // Guard: Check not already running
  if (server.state === ServerState.RUNNING) {
    throw new Error(`Server '${serverName}' is already running`);
  }
  
  // Guard: Check not in transitional state
  if (server.state === ServerState.STARTING || 
      server.state === ServerState.STOPPING ||
      server.state === ServerState.RESTARTING) {
    throw new Error(`Server '${serverName}' is ${server.state}`);
  }
  
  // Transition: STOPPED → STARTING
  server.state = ServerState.STARTING;
  this.emit('server:starting', { name: serverName });
  
  try {
    // Spawn process
    const process = await this._spawnProcess(serverName);
    
    // Transition: STARTING → RUNNING
    server.state = ServerState.RUNNING;
    server.pid = process.pid;
    server.startedAt = Date.now();
    this.emit('server:started', { name: serverName, pid: process.pid });
    
  } catch (error) {
    // Transition: STARTING → ERROR
    server.state = ServerState.ERROR;
    this.emit('server:error', { name: serverName, error });
  }
}
```

**stop() method**:

```javascript
async stop(serverName) {
  const server = this.servers.get(serverName);
  
  // Guard: Check is running
  if (server.state !== ServerState.RUNNING) {
    throw new Error(`Server '${serverName}' is not running`);
  }
  
  // Transition: RUNNING → STOPPING
  server.state = ServerState.STOPPING;
  this.emit('server:stopping', { name: serverName });
  
  // Send SIGTERM
  process.kill(server.pid, 'SIGTERM');
  
  // Wait for graceful shutdown (5s timeout)
  await this._waitForExit(server.pid, 5000);
  
  // Transition: STOPPING → STOPPED
  server.state = ServerState.STOPPED;
  server.pid = null;
  this.emit('server:stopped', { name: serverName });
}
```

**Auto-restart on crash**:

```javascript
_handleProcessExit(serverName, code, signal) {
  const server = this.servers.get(serverName);
  
  // If clean exit, transition to STOPPED
  if (code === 0 && server.state === ServerState.STOPPING) {
    server.state = ServerState.STOPPED;
    this.emit('server:stopped', { name: serverName });
    return;
  }
  
  // Otherwise, it's a crash
  // Transition: RUNNING → ERROR
  server.state = ServerState.ERROR;
  this.emit('server:error', { name: serverName, code, signal });
  
  // Check restart count
  const restartCount = this.restartCounts.get(serverName) || 0;
  
  if (restartCount < this.config.maxRestarts) {
    // Transition: ERROR → RESTARTING
    server.state = ServerState.RESTARTING;
    this.restartCounts.set(serverName, restartCount + 1);
    this.emit('server:restarting', { name: serverName, attempt: restartCount + 1 });
    
    // Wait delay, then transition RESTARTING → STARTING
    setTimeout(() => {
      this.start(serverName);
    }, this.config.restartDelay);
    
  } else {
    // Max restarts exceeded, transition ERROR → STOPPED
    server.state = ServerState.STOPPED;
    this.emit('server:failed', { name: serverName, reason: 'Max restarts exceeded' });
  }
}
```

### Edge Cases

#### Race Condition: Stop during startup

**Scenario**: User calls `stop()` while server is STARTING.

**Solution**: Guard condition prevents stop:

```javascript
if (server.state !== ServerState.RUNNING) {
  throw new Error(`Cannot stop server in state ${server.state}`);
}
```

#### Zombie Process

**Scenario**: Server state is STOPPED but process still running (PID exists).

**Solution**: On initialization, check if PIDs exist:

```javascript
async _recoverState() {
  for (const [name, server] of this.servers) {
    if (server.pid && this._isProcessAlive(server.pid)) {
      // Reconnect to running process
      server.state = ServerState.RUNNING;
      this.emit('server:reconnected', { name, pid: server.pid });
    } else {
      // Mark as stopped
      server.state = ServerState.STOPPED;
      server.pid = null;
    }
  }
}
```

#### Health Check Failure

**Scenario**: Server state is RUNNING but health check fails.

**Solution**: Transition RUNNING → ERROR, trigger restart:

```javascript
async _healthCheck(serverName) {
  const server = this.servers.get(serverName);
  
  if (server.state !== ServerState.RUNNING) {
    return; // Only check running servers
  }
  
  const healthy = await this._isHealthy(serverName);
  
  if (!healthy) {
    // Transition: RUNNING → ERROR
    server.state = ServerState.ERROR;
    this.emit('health-check-failed', { name: serverName });
    
    // Trigger auto-restart
    this._handleProcessExit(serverName, 1, null);
  }
}
```

---

## AgentState Machine

**Location**: `src/mcp/agent-coordinator.js`

### States

```javascript
const AgentState = {
  DISCOVERED: 'discovered',      // Agent detected but not initialized
  INITIALIZING: 'initializing',  // Agent setting up
  IDLE: 'idle',                  // Agent ready for tasks
  WORKING: 'working',            // Agent executing task
  BLOCKED: 'blocked',            // Agent waiting for dependency
  ERROR: 'error',                // Agent encountered error
  DISCONNECTED: 'disconnected'   // Agent no longer responsive
};
```

### State Diagram

```
         ┌────────────────┐
         │   DISCOVERED   │
         └───────┬────────┘
                 │ register()
                 ▼
         ┌────────────────┐
         │ INITIALIZING   │
         └───────┬────────┘
                 │ initialized
                 ▼
         ┌────────────────┐
    ┌───►│      IDLE      │◄──────┐
    │    └───────┬────────┘       │
    │            │                │
    │            │ assignTask()   │ taskComplete()
    │            ▼                │
    │    ┌────────────────┐       │
    │    │    WORKING     │───────┘
    │    └───────┬────────┘
    │            │
    │            │ dependency
    │            │ required
    │            ▼
    │    ┌────────────────┐
    │    │    BLOCKED     │
    │    └───────┬────────┘
    │            │ dependency
    │            │ resolved
    │            └─────────────┐
    │                          │
    │                          ▼
    │                   ┌────────────────┐
    └───────────────────┤     ERROR      │
         heartbeat      └───────┬────────┘
         timeout                │
                                │ unregister()
                                ▼
                        ┌────────────────┐
                        │  DISCONNECTED  │
                        └────────────────┘
```

### Valid Transitions

| From | To | Trigger | Event Emitted |
|------|----|---------|--------------
| DISCOVERED | INITIALIZING | `register()` | `agent:registered` |
| INITIALIZING | IDLE | Init complete | `agent:ready` |
| INITIALIZING | ERROR | Init failed | `agent:error` |
| IDLE | WORKING | `assignTask()` | `task:assigned` |
| WORKING | IDLE | Task complete | `task:completed` |
| WORKING | BLOCKED | Dependency wait | `agent:blocked` |
| WORKING | ERROR | Task error | `task:failed` |
| BLOCKED | WORKING | Dependency ready | `agent:unblocked` |
| BLOCKED | ERROR | Timeout | `agent:timeout` |
| * (any) | DISCONNECTED | Heartbeat timeout | `agent:disconnected` |
| ERROR | IDLE | Recovery | `agent:recovered` |

### Transition Implementation

**registerAgent() method**:

```javascript
registerAgent(agentId, capabilities, metadata = {}) {
  // Guard: Check not already registered
  if (this.agents.has(agentId)) {
    throw new Error(`Agent '${agentId}' already registered`);
  }
  
  // Create agent record
  const agent = {
    id: agentId,
    state: AgentState.DISCOVERED,
    capabilities,
    metadata,
    registeredAt: Date.now(),
    lastHeartbeat: Date.now(),
    currentTask: null
  };
  
  // Transition: DISCOVERED → INITIALIZING
  agent.state = AgentState.INITIALIZING;
  this.agents.set(agentId, agent);
  this.emit('agent:registered', { agentId, capabilities });
  
  // Simulate initialization (in real system, agent sends ready signal)
  setTimeout(() => {
    if (agent.state === AgentState.INITIALIZING) {
      // Transition: INITIALIZING → IDLE
      agent.state = AgentState.IDLE;
      this.emit('agent:ready', { agentId });
    }
  }, 1000);
  
  return agent;
}
```

**assignTask() method**:

```javascript
assignTask(agentId, task) {
  const agent = this.agents.get(agentId);
  
  // Guard: Check agent is idle
  if (agent.state !== AgentState.IDLE) {
    throw new Error(`Agent '${agentId}' is not idle (state: ${agent.state})`);
  }
  
  // Transition: IDLE → WORKING
  agent.state = AgentState.WORKING;
  agent.currentTask = task.id;
  task.assignedTo = agentId;
  task.assignedAt = Date.now();
  
  this.emit('task:assigned', { agentId, taskId: task.id });
  
  // Start task timeout
  task.timeout = setTimeout(() => {
    this._handleTaskTimeout(agentId, task.id);
  }, this.config.taskTimeout);
}
```

**completeTask() method**:

```javascript
completeTask(agentId, taskId, result) {
  const agent = this.agents.get(agentId);
  
  // Guard: Check agent is working
  if (agent.state !== AgentState.WORKING) {
    throw new Error(`Agent '${agentId}' is not working`);
  }
  
  // Guard: Check task matches
  if (agent.currentTask !== taskId) {
    throw new Error(`Agent '${agentId}' is not working on task '${taskId}'`);
  }
  
  // Transition: WORKING → IDLE
  agent.state = AgentState.IDLE;
  agent.currentTask = null;
  
  const task = this.activeTasks.get(taskId);
  task.completedAt = Date.now();
  task.result = result;
  
  this.emit('task:completed', { agentId, taskId, result });
  
  // Clear timeout
  clearTimeout(task.timeout);
  
  // Move to completed
  this.activeTasks.delete(taskId);
  this.completedTasks.push(task);
}
```

**Heartbeat monitoring**:

```javascript
_startHeartbeat() {
  this.heartbeatTimer = setInterval(() => {
    const now = Date.now();
    
    for (const [agentId, agent] of this.agents) {
      const elapsed = now - agent.lastHeartbeat;
      
      if (elapsed > this.config.heartbeatInterval * 2) {
        // Heartbeat timeout
        // Transition: * → DISCONNECTED
        const previousState = agent.state;
        agent.state = AgentState.DISCONNECTED;
        
        this.emit('agent:disconnected', { 
          agentId, 
          previousState,
          lastSeen: agent.lastHeartbeat 
        });
        
        // Reassign tasks
        if (agent.currentTask) {
          this._reassignTask(agent.currentTask);
        }
      }
    }
  }, this.config.heartbeatInterval);
}
```

### Edge Cases

#### Agent Crashes Mid-Task

**Scenario**: Agent state is WORKING but heartbeat timeout occurs.

**Solution**: Transition WORKING → DISCONNECTED, reassign task:

```javascript
if (agent.state === AgentState.WORKING && agent.currentTask) {
  const task = this.activeTasks.get(agent.currentTask);
  task.assignedTo = null;
  task.retries = (task.retries || 0) + 1;
  
  if (task.retries < 3) {
    // Re-queue task
    this.taskQueue.push(task);
    this._tryAssignTasks();
  } else {
    // Mark as failed
    task.state = 'failed';
    this.emit('task:failed', { taskId: task.id, reason: 'Max retries exceeded' });
  }
}
```

#### Task Blocked on Dependency

**Scenario**: Agent needs data from another agent before continuing.

**Solution**: Transition WORKING → BLOCKED, wait for dependency:

```javascript
blockTask(agentId, taskId, dependencyId) {
  const agent = this.agents.get(agentId);
  
  if (agent.state !== AgentState.WORKING) {
    throw new Error(`Agent '${agentId}' is not working`);
  }
  
  // Transition: WORKING → BLOCKED
  agent.state = AgentState.BLOCKED;
  
  const task = this.activeTasks.get(taskId);
  task.blockedOn = dependencyId;
  
  this.emit('agent:blocked', { agentId, taskId, dependencyId });
  
  // Watch for dependency completion
  this.once(`task:completed:${dependencyId}`, () => {
    // Transition: BLOCKED → WORKING
    agent.state = AgentState.WORKING;
    task.blockedOn = null;
    this.emit('agent:unblocked', { agentId, taskId });
  });
}
```

---

## State Persistence

### Orchestrator State File

**Location**: `.mcp/state.json`

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
  }
}
```

**On restart**:

1. Load state from disk
2. Check if PIDs exist
3. Attempt to reconnect or mark as stopped

### Agent Coordinator State

**Not persisted** - agents must re-register on coordinator restart.

**Rationale**: Agents are transient, tasks can be re-queued.

---

## State Observability

### Event Emission

All state transitions emit events for monitoring:

```javascript
// Listen to all server state changes
orchestrator.on('server:starting', (data) => { /* ... */ });
orchestrator.on('server:started', (data) => { /* ... */ });
orchestrator.on('server:stopping', (data) => { /* ... */ });
orchestrator.on('server:stopped', (data) => { /* ... */ });
orchestrator.on('server:error', (data) => { /* ... */ });
orchestrator.on('server:restarting', (data) => { /* ... */ });
orchestrator.on('server:failed', (data) => { /* ... */ });

// Listen to all agent state changes
coordinator.on('agent:registered', (data) => { /* ... */ });
coordinator.on('agent:ready', (data) => { /* ... */ });
coordinator.on('agent:blocked', (data) => { /* ... */ });
coordinator.on('agent:unblocked', (data) => { /* ... */ });
coordinator.on('agent:error', (data) => { /* ... */ });
coordinator.on('agent:disconnected', (data) => { /* ... */ });
```

### State Metrics

Track state durations for analysis:

```javascript
const stateDurations = new Map();

orchestrator.on('server:starting', ({ name }) => {
  stateDurations.set(name, { startingAt: Date.now() });
});

orchestrator.on('server:started', ({ name }) => {
  const duration = Date.now() - stateDurations.get(name).startingAt;
  logger.info(`Server ${name} took ${duration}ms to start`);
});
```

---

## See Also

- **[modules.md](../implementation/modules.md)** - Orchestrator and coordinator implementation
- **[error-handling.md](../implementation/error-handling.md)** - Error state recovery
- **[api-reference.md](api-reference.md)** - State exposed via API
- **[patterns.md](../implementation/patterns.md)** - State machine implementation patterns
