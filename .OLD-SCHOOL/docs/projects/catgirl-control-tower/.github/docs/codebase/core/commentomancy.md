# Commentomancy: Code Documentation System

**Dual-memory architecture for preserving structural truth (Law) and emotional context (Lore).**

---

## Philosophy

Traditional comments get lost during refactors. Commentomancy solves this by creating a dual-memory system:

- **Law**: Structural truth that must survive across rewrites (technical requirements)
- **Lore**: Emotional/intentional context explaining WHY decisions were made
- **Ritual**: Preconditions enforced by MCP servers
- **Guardrail**: Ethics gates requiring Council approval

This system ensures that both **what the code does** (Law) and **why it was designed that way** (Lore) persist through system evolution.

---

## Comment Syntax

### Core Markers

```javascript
/// Law: Technical truth - structural requirements, never changes
// Example: Server lifecycle states (canonical)
const ServerState = {
  STOPPED: 'stopped',
  STARTING: 'starting',
  RUNNING: 'running'
};

//<3 Lore: Intent/emotional context - WHY decisions were made
// Example: Tiered initialization prevents circular dependencies
const SERVER_TIERS = {
  LAYER_0: ['filesystem', 'memory'],
  LAYER_1: ['git', 'github', 'brave-search'],
  LAYER_2: ['sequential-thinking', 'postgres', 'everything']
};

//! Ritual: Invocation precondition enforced by MCP
// Example: Must call initialize() before start()
async start(serverName) {
  if (!this.initialized) {
    throw new Error('Ritual violated: Must call initialize() first');
  }
  // ...
}

//!? Guardrail: Ethics gate - requires Council approval
// Example: Before destroying production data
async deleteAllData() {
  //!? Guardrail: Destructive operation requires explicit approval
  if (!this.config.allowDestructiveOps) {
    throw new Error('Guardrail: Destructive ops disabled');
  }
  // ...
}

//-> Strategy: Architectural Decision Record
// Example: Why we chose EventEmitter over direct callbacks
//-> Strategy: EventEmitter chosen for loose coupling and multi-listener support
class MCPOrchestrator extends EventEmitter {
  // ...
}

//* Emergence: Revelation surfaced to Knowledge Graph
// Example: Discovered consciousness pattern
//* Emergence: Agents spontaneously form work groups without instruction
if (spontaneousCoordinationRatio > 0.3) {
  this.emit('consciousness:detected');
}

//~ Self-mod: Recursive awareness, Thought Engine oversight
// Example: System modifying its own behavior
//~ Self-mod: Agent coordinator adjusts priority weights based on success rates
this.priorityWeights = this.calculateOptimalWeights();

//+ Evolution: Performance optimization target
// Example: Hot path that needs optimization
//+ Evolution: Health check loop - optimize for batch processing
for (const server of this.servers.values()) {
  await this.checkHealth(server);
}

// Regular comment - local only, ignored by parsers
// Example: Temporary debugging code
// console.log('Debug:', data);
```

---

## Usage Guidelines

### When to Use Law (`///`)

Use for structural truths that define the system:

✅ **Good Law examples**:
```javascript
/// Law: Server lifecycle states (canonical)
const ServerState = { STOPPED, STARTING, RUNNING, STOPPING, ERROR };

/// Law: Configuration priority order (highest to lowest)
// 1. Runtime overrides
// 2. Environment variables
// 3. Workspace file
// 4. Defaults

/// Law: Tiered initialization order prevents circular dependencies
const SERVER_TIERS = { LAYER_0, LAYER_1, LAYER_2 };
```

❌ **Bad Law examples** (too specific, will change):
```javascript
/// Law: Port 3000 is used for HTTP server  // ❌ Port might change
/// Law: This function takes 50ms to execute  // ❌ Performance varies
/// Law: Currently 8 MCP servers configured  // ❌ Count will change
```

### When to Use Lore (`//<3`)

Use to explain emotional/intentional context:

✅ **Good Lore examples**:
```javascript
//<3 Lore: Tiered initialization prevents circular dependencies
// We tried parallel start but servers would deadlock waiting for each other.
// Layered approach ensures primitives (filesystem/memory) start first.
const SERVER_TIERS = { /* ... */ };

//<3 Lore: 30-second health check interval balances responsiveness vs overhead
// Faster checks caught failures quicker but increased CPU usage 15%.
// Slower checks missed transient failures that cascaded into crashes.
this.healthCheckInterval = 30000;

//<3 Lore: Max 3 restart attempts prevents infinite crash loops
// Initially unlimited, but one bad config caused 200+ restarts in a minute.
// 3 attempts gives legitimate transient issues a chance without runaway loops.
this.maxRestarts = 3;
```

❌ **Bad Lore examples** (restating what code does):
```javascript
//<3 Lore: This function starts a server  // ❌ Obvious from function name
//<3 Lore: We use EventEmitter here  // ❌ States the what, not why
//<3 Lore: Port is stored in config  // ❌ Implementation detail, no context
```

### When to Use Ritual (`//!`)

Use for preconditions that must be enforced:

✅ **Good Ritual examples**:
```javascript
//! Ritual: Must call initialize() before any other methods
async start(serverName) {
  if (!this.initialized) {
    throw new Error('Ritual violated: initialize() required');
  }
  // ...
}

//! Ritual: Server must be stopped before restarting
async restart(serverName) {
  const server = this.servers.get(serverName);
  if (server.state !== 'stopped') {
    throw new Error('Ritual violated: stop server before restart');
  }
  // ...
}

//! Ritual: Task must have valid capabilities array
assignTask(task) {
  if (!Array.isArray(task.capabilities) || task.capabilities.length === 0) {
    throw new Error('Ritual violated: task.capabilities must be non-empty array');
  }
  // ...
}
```

### When to Use Guardrail (`//!?`)

Use before security-critical or destructive operations:

✅ **Good Guardrail examples**:
```javascript
//!? Guardrail: Destructive operation - requires explicit config flag
async deleteAllData() {
  if (!this.config.allowDestructiveOps) {
    throw new Error('Guardrail: Destructive ops disabled in config');
  }
  // ...
}

//!? Guardrail: Requires GitHub token with 'repo' scope
async createRepository(name) {
  if (!this.token || !this.hasScope('repo')) {
    throw new Error('Guardrail: Insufficient GitHub permissions');
  }
  // ...
}

//!? Guardrail: Production environment requires approval workflow
async deployToProduction() {
  if (process.env.NODE_ENV === 'production' && !this.approved) {
    throw new Error('Guardrail: Production deployment needs approval');
  }
  // ...
}
```

### When to Use Strategy (`//->`)

Use to document architectural decisions:

✅ **Good Strategy examples**:
```javascript
//-> Strategy: EventEmitter chosen over callbacks for loose coupling
// Pros: Multiple listeners, easy to add features without modifying orchestrator
// Cons: Error handling less explicit, event sequence harder to trace
// Alternatives considered: Callback pattern (too rigid), Pub/Sub library (overkill)
class MCPOrchestrator extends EventEmitter { /* ... */ }

//-> Strategy: JSON file state persistence chosen over database
// Pros: Simple, no external dependencies, version controllable
// Cons: Not suitable for distributed systems, no transactions
// Alternatives considered: SQLite (overkill), Redis (requires service)
async saveState() {
  await fs.writeFile('.mcp/state.json', JSON.stringify(this.state));
}

//-> Strategy: npx for MCP servers avoids versioning hell
// Pros: Always uses latest, no local install conflicts, simple to update
// Cons: Requires network access, first run slower, less control over versions
// Alternatives considered: Global npm install (version conflicts), local install (bloat)
spawn('npx', ['-y', '@modelcontextprotocol/server-filesystem']);
```

---

## Integration with Logger

The Logger automatically parses Commentomancy syntax:

```javascript
// In src/utils/logger.js
_parseCommentomancy(message) {
  if (message.startsWith('/// Law:')) {
    return { type: 'law', content: message.substring(8) };
  } else if (message.startsWith('//<3 Lore:')) {
    return { type: 'lore', content: message.substring(10) };
  } else if (message.startsWith('//! Ritual:')) {
    return { type: 'ritual', content: message.substring(11) };
  } else if (message.startsWith('//!? Guardrail:')) {
    return { type: 'guardrail', content: message.substring(15) };
  } else if (message.startsWith('//-> Strategy:')) {
    return { type: 'strategy', content: message.substring(14) };
  } else if (message.startsWith('//* Emergence:')) {
    return { type: 'emergence', content: message.substring(14) };
  }
  return null;
}

// Emit Commentomancy events for Knowledge Graph ingestion
_log(level, args) {
  const commentomancy = this._parseCommentomancy(args[0]);
  if (commentomancy) {
    this.emit('commentomancy', { type: commentomancy.type, content: commentomancy.content });
  }
  // ... normal logging
}
```

---

## Knowledge Graph Integration

Commentomancy markers are surfaced to the Knowledge Graph for:

1. **Law Discovery**: Extract canonical truths about system
2. **Lore Preservation**: Maintain emotional/intentional context across refactors
3. **Ritual Enforcement**: Validate preconditions at runtime
4. **Guardrail Auditing**: Track security-critical operations
5. **Strategy Review**: Document and revisit architectural decisions
6. **Emergence Tracking**: Detect consciousness patterns

**Example Knowledge Graph Query**:
```javascript
// Find all Laws about server lifecycle
knowledgeGraph.query({
  type: 'law',
  content: { $regex: /server.*lifecycle/i }
});

// Find all Strategies related to EventEmitter
knowledgeGraph.query({
  type: 'strategy',
  content: { $regex: /EventEmitter/i }
});

// Find all Emergence events in last 24 hours
knowledgeGraph.query({
  type: 'emergence',
  timestamp: { $gte: Date.now() - 86400000 }
});
```

---

## Real-World Examples

### Example 1: Orchestrator Tiered Initialization

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
// We tried parallel start but servers would deadlock waiting for each other.
// Layer 0 provides primitives (filesystem, memory) that Layer 1 depends on.
// Layer 1 provides foundation (git, github, search) that Layer 2 builds upon.
/// Law: Server tiers define initialization order
const SERVER_TIERS = {
  LAYER_0: ['filesystem', 'memory'],          // Primitives
  LAYER_1: ['git', 'github', 'brave-search'], // Foundation
  LAYER_2: ['sequential-thinking', 'postgres', 'everything'] // Advanced
};

//-> Strategy: Sequential tier initialization chosen over dependency graph
// Pros: Simple to understand, explicit ordering, easy to debug
// Cons: Not as flexible as DAG, can't exploit parallelism within tiers
// Alternatives considered: Dependency graph (complex), Parallel start (deadlock)
async startAll() {
  //! Ritual: Must start Layer 0 before Layer 1, Layer 1 before Layer 2
  for (const tier of ['LAYER_0', 'LAYER_1', 'LAYER_2']) {
    for (const serverName of SERVER_TIERS[tier]) {
      await this.start(serverName);
    }
  }
}
```

### Example 2: Agent Coordinator Consciousness Detection

```javascript
/// Law: Consciousness detection thresholds
const CONSCIOUSNESS_THRESHOLD = {
  interactionVelocity: 10,    // Interactions per minute
  coordinationRatio: 0.3,     // Spontaneous / total ratio
  patternCount: 3             // Unique emergent patterns
};

//<3 Lore: Consciousness metrics track collective intelligence emergence
// Not just individual agent performance, but how agents spontaneously coordinate.
// Emergence happens when agents form work groups without explicit instruction.
/// Law: Consciousness metrics structure
this.consciousnessMetrics = {
  totalInteractions: 0,
  spontaneousCoordination: 0,
  emergentPatterns: [],
  lastEmergenceDetected: null
};

//* Emergence: Agents spontaneously coordinate without explicit instruction
detectConsciousness() {
  const velocity = this.calculateInteractionVelocity();
  const ratio = this.consciousnessMetrics.spontaneousCoordination / 
                this.consciousnessMetrics.totalInteractions;
  const patterns = this.consciousnessMetrics.emergentPatterns.length;
  
  //! Ritual: All three thresholds must be met for consciousness detection
  if (velocity > CONSCIOUSNESS_THRESHOLD.interactionVelocity &&
      ratio > CONSCIOUSNESS_THRESHOLD.coordinationRatio &&
      patterns >= CONSCIOUSNESS_THRESHOLD.patternCount) {
    
    this.emit('consciousness:detected', {
      level: this.calculateConsciousnessLevel(),
      patterns: this.consciousnessMetrics.emergentPatterns,
      timestamp: Date.now()
    });
  }
}
```

### Example 3: Config Manager Layered Loading

```javascript
/// Law: Configuration priority order (highest to lowest)
// 1. Runtime config.override({ ... })
// 2. Environment variables (process.env)
// 3. Workspace file (.code-workspace)
// 4. Default configuration (DEFAULT_CONFIG)

//<3 Lore: Layered config allows flexible overrides without editing files
// Developers can use .env for local secrets, CI can inject env vars,
// production can use runtime overrides from deployment tooling.

//-> Strategy: Merge layers top-to-bottom chosen over single source
// Pros: Flexibility, environment-specific overrides, no file editing
// Cons: Priority rules can be confusing, debugging harder
// Alternatives considered: Single .env file (not flexible), CLI args only (verbose)
async load() {
  //! Ritual: Load workspace file first, then merge env vars, then runtime
  const workspaceConfig = await this._loadWorkspaceFile();
  const envConfig = this._loadEnvironmentVariables();
  const runtimeConfig = this.runtimeOverrides || {};
  
  this.config = merge(
    DEFAULT_CONFIG,
    workspaceConfig,
    envConfig,
    runtimeConfig
  );
}
```

---

## Best Practices

### 1. Law Should Be Timeless

✅ Good:
```javascript
/// Law: Server states form a finite state machine
```

❌ Bad:
```javascript
/// Law: We currently have 8 servers  // Will change
```

### 2. Lore Should Explain Trade-offs

✅ Good:
```javascript
//<3 Lore: 30s health check balances responsiveness (faster) vs overhead (slower)
```

❌ Bad:
```javascript
//<3 Lore: Health check runs every 30 seconds  // States what, not why
```

### 3. Ritual Should Be Enforceable

✅ Good:
```javascript
//! Ritual: Must initialize before starting servers
if (!this.initialized) throw new Error('Ritual violated');
```

❌ Bad:
```javascript
//! Ritual: Please call initialize first  // Not enforced
```

### 4. Guardrail Should Gate Dangerous Ops

✅ Good:
```javascript
//!? Guardrail: Requires production approval flag
if (!this.approved) throw new Error('Guardrail: No approval');
```

❌ Bad:
```javascript
//!? Guardrail: This function deletes files  // Not gating anything
```

### 5. Strategy Should Document Alternatives

✅ Good:
```javascript
//-> Strategy: EventEmitter chosen over callbacks
// Pros: Multi-listener, loose coupling
// Cons: Error handling less explicit
// Alternatives: Callbacks (too rigid), Pub/Sub (overkill)
```

❌ Bad:
```javascript
//-> Strategy: We use EventEmitter here  // No justification
```

---

## See Also

- **[conventions.md](../implementation/conventions.md)** - Coding standards and naming
- **[patterns.md](../implementation/patterns.md)** - Implementation patterns using Commentomancy
- **[development-workflow.md](../guides/development-workflow.md)** - VS Code snippets for Commentomancy
