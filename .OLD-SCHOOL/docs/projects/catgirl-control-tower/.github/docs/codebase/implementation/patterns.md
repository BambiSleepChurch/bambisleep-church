# Critical Implementation Patterns

**Essential patterns extracted from the MCP Control Tower codebase.**

---

## Pattern 1: Event-Driven Architecture

**Context**: Loose coupling between components without tight dependencies.

**Implementation**: Both `MCPOrchestrator` and `AgentCoordinator` extend `EventEmitter`.

```javascript
/// Law: All core components extend EventEmitter for loose coupling
class MCPOrchestrator extends EventEmitter {
  constructor(config) {
    super();
    this.servers = new Map();
  }
  
  async start(serverName) {
    const pid = await this._spawnProcess(serverName);
    
    //-> Strategy: Emit events instead of callbacks for multi-listener support
    this.emit('server:started', {
      serverName,
      pid,
      timestamp: Date.now()
    });
  }
}

// Multiple listeners can react independently
orchestrator.on('server:started', (data) => {
  logger.info(`✅ Server ${data.serverName} started (PID: ${data.pid})`);
});

orchestrator.on('server:started', (data) => {
  // Update dashboard via WebSocket
  wss.broadcast({ type: 'server:status', data });
});

orchestrator.on('server:started', (data) => {
  // Record metrics
  metrics.recordServerStart(data);
});
```

**Benefits**:
- **Loose coupling**: Components don't need to know about each other
- **Extensibility**: Add new listeners without modifying emitter
- **Testability**: Easy to mock and verify events
- **Composability**: Chain events to create workflows

**Pitfalls**:
- Error handling less explicit than callbacks
- Event sequence can be hard to trace in complex systems
- Memory leaks if listeners not removed

---

## Pattern 2: State Persistence

**Context**: Recover from crashes by persisting server state to disk.

**Implementation**: Save state to `.mcp/state.json` on changes.

```javascript
/// Law: State file location (canonical)
const STATE_FILE = '.mcp/state.json';

//<3 Lore: JSON file chosen for simplicity and version control
// Could use SQLite for transactions, but JSON is simpler and sufficient
// for single-node deployment. Future: Redis for distributed systems.

class MCPOrchestrator extends EventEmitter {
  async saveState() {
    const state = {
      timestamp: Date.now(),
      servers: this.getStatus(),
      restartCounts: Object.fromEntries(this.restartCounts)
    };
    
    //! Ritual: Create directory if it doesn't exist
    await fs.mkdir(path.dirname(STATE_FILE), { recursive: true });
    
    await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2));
    this.emit('state:saved', { path: STATE_FILE, size: Buffer.byteLength(JSON.stringify(state)) });
  }
  
  async loadState() {
    //! Ritual: Return empty state if file doesn't exist (first run)
    try {
      const data = await fs.readFile(STATE_FILE, 'utf8');
      const state = JSON.parse(data);
      
      //<3 Lore: Attempt to reconnect to running servers on restart
      // If PID still exists and responding, reuse connection
      // If PID dead or unresponsive, mark as stopped and restart
      for (const [serverName, serverState] of Object.entries(state.servers)) {
        if (serverState.pid && this._isProcessAlive(serverState.pid)) {
          this.servers.set(serverName, { ...serverState });
          this.emit('server:reconnected', { serverName, pid: serverState.pid });
        } else {
          this.emit('server:lost', { serverName });
        }
      }
      
      return state;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return { timestamp: Date.now(), servers: {}, restartCounts: {} };
      }
      throw error;
    }
  }
}
```

**Benefits**:
- Survive crashes and restarts
- Audit trail of system state
- Version controllable (JSON format)
- Human-readable for debugging

**Pitfalls**:
- Not suitable for distributed systems (single file)
- No transactions (partial writes on crash)
- Race conditions if multiple processes

---

## Pattern 3: Graceful Shutdown

**Context**: Clean up resources before process exit.

**Implementation**: Handle SIGTERM/SIGINT signals.

```javascript
/// Law: Shutdown sequence (canonical order)
// 1. Stop accepting new requests
// 2. Drain in-flight requests
// 3. Stop MCP servers (reverse tier order)
// 4. Save state
// 5. Close connections
// 6. Exit process

class ControlTowerApp {
  constructor() {
    this.shutdownInProgress = false;
    
    //-> Strategy: Handle multiple signals for cross-platform compatibility
    // SIGTERM: Kubernetes sends this before SIGKILL
    // SIGINT: User presses Ctrl+C
    process.on('SIGTERM', () => this.shutdown('SIGTERM'));
    process.on('SIGINT', () => this.shutdown('SIGINT'));
  }
  
  async shutdown(signal) {
    //! Ritual: Prevent multiple shutdown attempts
    if (this.shutdownInProgress) {
      this.logger.warn('⚠️ Shutdown already in progress');
      return;
    }
    this.shutdownInProgress = true;
    
    this.logger.info(`🛑 Received ${signal}, starting graceful shutdown...`);
    this.emit('shutdown:initiated', { signal, timestamp: Date.now() });
    
    try {
      //<3 Lore: 30-second timeout prevents hanging on stuck resources
      const shutdownTimeout = setTimeout(() => {
        this.logger.error('❌ Shutdown timeout, forcing exit');
        process.exit(1);
      }, 30000);
      
      // Stop accepting new requests
      this.server.close();
      
      // Stop MCP servers in reverse tier order
      //<3 Lore: Reverse order prevents dependent servers from losing connections
      await this.orchestrator.stopAll({ reverse: true });
      
      // Save final state
      await this.orchestrator.saveState();
      
      // Close WebSocket connections
      this.wss.clients.forEach(client => client.close(1000, 'Server shutting down'));
      
      clearTimeout(shutdownTimeout);
      this.logger.info('✅ Graceful shutdown complete');
      process.exit(0);
    } catch (error) {
      this.logger.error('❌ Shutdown error:', error);
      process.exit(1);
    }
  }
}
```

**Benefits**:
- No data loss from abrupt termination
- Clean resource cleanup
- Docker/Kubernetes compatible
- Prevents orphaned processes

**Pitfalls**:
- Timeout too short = forced kills
- Timeout too long = slow deployments
- Complex state machines can block shutdown

---

## Pattern 4: Configuration Layering

**Context**: Support multiple configuration sources with clear precedence.

**Implementation**: Merge configurations in priority order.

```javascript
/// Law: Configuration priority order (highest to lowest)
// 1. Runtime config.override({ ... })
// 2. Environment variables (process.env)
// 3. Workspace file (.code-workspace)
// 4. Default configuration (DEFAULT_CONFIG)

class ConfigManager extends EventEmitter {
  constructor(workspaceRoot) {
    super();
    this.workspaceRoot = workspaceRoot;
    this.runtimeOverrides = {};
    this.config = {};
  }
  
  async load() {
    //<3 Lore: Load from bottom to top, so higher priority overwrites lower
    const defaultConfig = this._getDefaults();
    const workspaceConfig = await this._loadWorkspaceFile();
    const envConfig = this._loadEnvironmentVariables();
    
    //-> Strategy: Deep merge chosen over Object.assign for nested objects
    // Object.assign overwrites entire nested objects, we want to merge keys
    this.config = this._deepMerge(
      defaultConfig,
      workspaceConfig,
      envConfig,
      this.runtimeOverrides
    );
    
    //! Ritual: Validate config against schema after merge
    this._validateSchema(this.config);
    
    this.emit('config:loaded', { source: 'multi', config: this.config });
  }
  
  override(overrides) {
    //-> Strategy: Runtime overrides for testing and dynamic config
    this.runtimeOverrides = this._deepMerge(this.runtimeOverrides, overrides);
    this.emit('config:override', { overrides });
  }
  
  _loadEnvironmentVariables() {
    //<3 Lore: Map env vars to nested config structure
    // MCP_ORCHESTRATOR_PORT=3000 → config.port = 3000
    // MCP_ORCHESTRATOR_HEALTH_CHECK_INTERVAL=30000 → config.healthCheckInterval = 30000
    const config = {};
    const prefix = 'MCP_ORCHESTRATOR_';
    
    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith(prefix)) {
        const configKey = this._envKeyToConfigKey(key.substring(prefix.length));
        this._setNestedValue(config, configKey, this._parseEnvValue(value));
      }
    }
    
    return config;
  }
}
```

**Benefits**:
- Flexible configuration for different environments
- No hardcoded secrets in source
- Runtime overrides for testing
- Clear precedence rules

**Pitfalls**:
- Debugging which config source is active
- Environment variable naming conventions
- Deep merge complexity

---

## Pattern 5: Tiered Initialization

**Context**: Start MCP servers in dependency order to prevent deadlocks.

**Implementation**: Sequential tier startup with health checks.

```javascript
/// Law: Server tiers define initialization order
const SERVER_TIERS = {
  LAYER_0: ['filesystem', 'memory'],          // Primitives
  LAYER_1: ['git', 'github', 'brave-search'], // Foundation
  LAYER_2: ['sequential-thinking', 'postgres', 'everything'] // Advanced
};

//<3 Lore: Tiered initialization prevents circular dependencies
// Initial attempt: Parallel start all servers → deadlock
// Layer 1 servers would wait for Layer 0, but Layer 0 wasn't fully initialized
// Solution: Start Layer 0, wait for health, then Layer 1, then Layer 2

class MCPOrchestrator extends EventEmitter {
  async startAll() {
    this.logger.info('🚀 Starting all MCP servers (tiered)...');
    
    //! Ritual: Must start Layer 0 before Layer 1, Layer 1 before Layer 2
    for (const tierName of ['LAYER_0', 'LAYER_1', 'LAYER_2']) {
      const servers = SERVER_TIERS[tierName];
      this.logger.info(`📦 Starting ${tierName}: ${servers.join(', ')}`);
      
      //-> Strategy: Start servers in tier in parallel for speed
      // Within a tier, servers don't depend on each other
      const startPromises = servers.map(serverName => this.start(serverName));
      await Promise.all(startPromises);
      
      //! Ritual: Wait for all servers in tier to be healthy before next tier
      await this.waitForHealthy(servers);
      
      this.logger.success(`✅ ${tierName} ready`);
    }
    
    this.logger.success('✅ All MCP servers started');
    this.emit('orchestrator:ready', { serverCount: this.servers.size });
  }
  
  async waitForHealthy(serverNames, timeout = 30000) {
    //<3 Lore: 30-second timeout balances startup speed vs transient issues
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const unhealthy = [];
      
      for (const serverName of serverNames) {
        const health = await this.checkHealth(serverName);
        if (!health.healthy) {
          unhealthy.push(serverName);
        }
      }
      
      if (unhealthy.length === 0) {
        return true; // All healthy
      }
      
      //+ Evolution: Exponential backoff for health checks reduces CPU usage
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error(`Timeout waiting for servers to be healthy: ${serverNames.join(', ')}`);
  }
}
```

**Benefits**:
- Prevents circular dependencies
- Explicit dependency management
- Parallel within tiers for speed
- Clear error messages on failure

**Pitfalls**:
- Less flexible than dependency graph
- Can't optimize parallelism across tiers
- Adding new server requires tier classification

---

## See Also

- **[architecture.md](../core/architecture.md)** - System design and components
- **[commentomancy.md](../core/commentomancy.md)** - Documentation system
- **[conventions.md](conventions.md)** - Coding standards
- **[../advanced-patterns.md](../advanced-patterns.md)** - Production-ready patterns
