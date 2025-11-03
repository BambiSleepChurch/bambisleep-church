# Advanced Implementation Patterns

Production-ready patterns extracted from the codebase.

## Pattern 1: Async Event Coordination

**Problem**: Orchestrator needs to wait for multiple servers to start before proceeding.

**Solution** (from `orchestrator.js`):

```javascript
async startAll() {
  for (const tier of ['LAYER_0', 'LAYER_1', 'LAYER_2']) {
    // Start tier in parallel
    const promises = SERVER_TIERS[tier].map(name => this.start(name));
    await Promise.all(promises);
    
    // Wait for all servers in tier to be healthy before next tier
    await this.waitForHealthy(SERVER_TIERS[tier]);
  }
}
```

## Pattern 2: Resilient Process Management

**Problem**: MCP servers crash and need automatic recovery.

**Solution** (from `orchestrator.js`):

```javascript
_handleProcessExit(name, code, signal) {
  const restartCount = this.restartCounts.get(name) || 0;
  
  if (restartCount < this.config.maxRestarts) {
    this.log('warn', `⚠️ Server ${name} crashed, restarting (${restartCount + 1}/${this.config.maxRestarts})`);
    this.restartCounts.set(name, restartCount + 1);
    
    setTimeout(() => {
      this.start(name);
    }, this.config.restartDelay);
  } else {
    this.log('error', `❌ Server ${name} exceeded max restarts, giving up`);
    this.emit('server-failed', { name, code, signal });
  }
}
```

## Pattern 3: Configuration Hot Reload

**Problem**: Need to update configuration without restarting system.

**Solution** (add to `config.js`):

```javascript
async reload() {
  this.log('info', '🔄 Reloading configuration...');
  const oldConfig = { ...this.config };
  
  try {
    await this.load();
    this.emit('config-reloaded', { old: oldConfig, new: this.config });
    return true;
  } catch (error) {
    this.log('error', '❌ Config reload failed, reverting:', error);
    this.config = oldConfig;
    return false;
  }
}

// Watch for config file changes
watchConfig() {
  const configPath = path.join(this.workspaceRoot, '.code-workspace');
  fs.watch(configPath, { persistent: false }, (eventType) => {
    if (eventType === 'change') {
      this.reload();
    }
  });
}
```

## Pattern 4: Distributed Lock for Agent Tasks

**Problem**: Multiple agents shouldn't execute the same task simultaneously.

**Solution** (add to `agent-coordinator.js`):

```javascript
async acquireTaskLock(taskId, agentId) {
  const lockKey = `task:${taskId}`;
  
  if (this.taskLocks.has(lockKey)) {
    return false; // Already locked
  }
  
  this.taskLocks.set(lockKey, {
    agentId,
    acquiredAt: Date.now(),
    expiresAt: Date.now() + this.config.taskTimeout
  });
  
  // Auto-release after timeout
  setTimeout(() => {
    this.releaseTaskLock(taskId, agentId);
  }, this.config.taskTimeout);
  
  return true;
}

releaseTaskLock(taskId, agentId) {
  const lockKey = `task:${taskId}`;
  const lock = this.taskLocks.get(lockKey);
  
  if (lock && lock.agentId === agentId) {
    this.taskLocks.delete(lockKey);
    this.emit('task-lock-released', { taskId, agentId });
  }
}
```

## Pattern 5: Telemetry Batching

**Problem**: Emitting too many events overwhelms listeners.

**Solution** (add to `logger.js`):

```javascript
constructor(options = {}) {
  // ... existing code ...
  
  this.eventBatch = [];
  this.batchInterval = options.batchInterval || 5000; // 5s
  this.batchSize = options.batchSize || 100;
  
  // Start batching timer
  this.batchTimer = setInterval(() => this._flushBatch(), this.batchInterval);
}

_log(level, args) {
  const logEntry = {
    level,
    message: args.join(' '),
    timestamp: new Date().toISOString(),
    context: this.config.context
  };
  
  // Add to batch
  this.eventBatch.push(logEntry);
  
  // Flush if batch full
  if (this.eventBatch.length >= this.batchSize) {
    this._flushBatch();
  }
  
  // Still log immediately to console/file
  this._writeLog(logEntry);
}

_flushBatch() {
  if (this.eventBatch.length === 0) return;
  
  const batch = [...this.eventBatch];
  this.eventBatch = [];
  
  // Send to telemetry service
  this.emit('telemetry-batch', batch);
}
```
