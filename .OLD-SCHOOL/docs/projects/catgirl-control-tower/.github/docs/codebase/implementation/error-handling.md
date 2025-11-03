# Error Handling Guide

**Comprehensive error handling strategies, recovery patterns, and debugging workflows.**

---

## Overview

The MCP Control Tower implements multiple layers of error handling:

1. **Defensive guards** - Prevent invalid operations
2. **Try-catch blocks** - Catch runtime errors
3. **Event emission** - Propagate errors without crashing
4. **Auto-recovery** - Restart failed servers
5. **Graceful degradation** - Continue with reduced functionality

---

## Error Types

### 1. Configuration Errors

**When**: Invalid or missing configuration

**Examples**:

- Missing `.code-workspace` file
- Invalid JSON in workspace file
- Required environment variables not set
- Invalid configuration values

**Handling**:

```javascript
// In config.js
async _loadWorkspaceConfig() {
  try {
    const workspaceFile = path.join(this.workspaceRoot, '.code-workspace');
    const content = await fs.readFile(workspaceFile, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      logger.warn('⚠️ No workspace file found, using defaults');
      return {};
    }
    if (error instanceof SyntaxError) {
      logger.error('❌ Invalid JSON in workspace file:', error);
      throw new Error('Workspace file contains invalid JSON');
    }
    throw error;
  }
}
```

**Recovery**:

- Use default configuration
- Log warning but continue
- Exit if critical config missing

**User Action**:

```bash
# Check workspace file exists
ls -la *.code-workspace

# Validate JSON
cat bambisleep-church-catgirl-control-tower.code-workspace | jq .

# Check environment variables
printenv | grep MCP_
```

---

### 2. Server Spawn Errors

**When**: MCP server fails to start

**Examples**:

- Command not found (`npx` not installed)
- Invalid arguments
- Permission denied
- Port already in use

**Handling**:

```javascript
// In orchestrator.js
async _spawnProcess(serverName) {
  const server = this.servers.get(serverName);
  
  try {
    const process = spawn(server.command, server.args, {
      cwd: this.config.workspaceRoot,
      env: { ...process.env, ...server.env }
    });
    
    process.on('error', (error) => {
      logger.error(`❌ Failed to spawn ${serverName}:`, error);
      this.emit('server:error', { name: serverName, error });
      
      // Transition to ERROR state
      server.state = ServerState.ERROR;
      
      // Don't auto-restart spawn errors (likely config issue)
      this.emit('server:failed', { 
        name: serverName, 
        reason: 'Spawn failed',
        error: error.message 
      });
    });
    
    return process;
    
  } catch (error) {
    logger.error(`❌ Exception spawning ${serverName}:`, error);
    throw new Error(`Failed to spawn ${serverName}: ${error.message}`);
  }
}
```

**Recovery**:

- Do NOT auto-restart (likely configuration issue)
- Emit `server:failed` event
- Mark server as ERROR state
- Log detailed error for debugging

**User Action**:

```bash
# Check npx is installed
which npx

# Test server command manually
npx -y @modelcontextprotocol/server-filesystem /workspace/root

# Check permissions
ls -la /workspace/root

# Check for port conflicts
lsof -i :3000
```

---

### 3. Server Crash Errors

**When**: Running server exits unexpectedly

**Examples**:

- Segmentation fault
- Uncaught exception in server
- Out of memory
- Killed by system (OOM killer)

**Handling**:

```javascript
// In orchestrator.js
_handleProcessExit(serverName, code, signal) {
  const server = this.servers.get(serverName);
  
  // Clean exit during stop() - expected
  if (code === 0 && server.state === ServerState.STOPPING) {
    server.state = ServerState.STOPPED;
    this.emit('server:stopped', { name: serverName });
    return;
  }
  
  // Unexpected exit - crash
  logger.error(`❌ Server ${serverName} crashed:`, { code, signal });
  
  // Transition to ERROR
  server.state = ServerState.ERROR;
  this.emit('server:error', { name: serverName, code, signal });
  
  // Attempt auto-restart
  const restartCount = this.restartCounts.get(serverName) || 0;
  
  if (restartCount < this.config.maxRestarts) {
    logger.warn(`⚠️ Auto-restarting ${serverName} (attempt ${restartCount + 1}/${this.config.maxRestarts})`);
    
    server.state = ServerState.RESTARTING;
    this.restartCounts.set(serverName, restartCount + 1);
    this.emit('server:restarting', { name: serverName, attempt: restartCount + 1 });
    
    setTimeout(() => {
      this.start(serverName).catch(error => {
        logger.error(`❌ Restart failed for ${serverName}:`, error);
      });
    }, this.config.restartDelay);
    
  } else {
    logger.critical(`🔥 Server ${serverName} exceeded max restarts, giving up`);
    server.state = ServerState.STOPPED;
    this.emit('server:failed', { 
      name: serverName, 
      reason: 'Max restarts exceeded',
      restartCount 
    });
  }
}
```

**Recovery**:

- Auto-restart up to `maxRestarts` times (default: 3)
- Wait `restartDelay` ms between attempts (default: 5000)
- Give up after max attempts
- Emit `server:failed` if unrecoverable

**User Action**:

```bash
# Check logs for crash reason
tail -f .mcp/logs/orchestrator.log

# Check system resources
free -h
top

# Test server manually
npx -y @modelcontextprotocol/server-filesystem /workspace/root

# Increase restart limit (if transient issue)
echo 'MCP_ORCHESTRATOR_MAX_RESTARTS=5' >> .env
```

---

### 4. Health Check Errors

**When**: Server process running but not responding

**Examples**:

- Server hung/deadlocked
- Network connectivity lost
- Server overwhelmed with requests

**Handling**:

```javascript
// In orchestrator.js
async _healthCheck() {
  for (const [name, server] of this.servers) {
    if (server.state !== ServerState.RUNNING) {
      continue; // Only check running servers
    }
    
    try {
      const healthy = await this._isHealthy(name);
      
      if (!healthy) {
        logger.warn(`⚠️ Health check failed for ${name}`);
        
        // Transition to ERROR
        server.state = ServerState.ERROR;
        this.emit('health-check-failed', { 
          name, 
          reason: 'Not responding',
          timestamp: Date.now()
        });
        
        // Trigger crash recovery (auto-restart)
        this._handleProcessExit(name, 1, null);
      }
      
    } catch (error) {
      logger.error(`❌ Health check error for ${name}:`, error);
      // Continue checking other servers
    }
  }
}
```

**Recovery**:

- Treat as crash (trigger auto-restart)
- Continue checking other servers
- Don't crash orchestrator on health check failure

**User Action**:

```bash
# Check server status
curl http://localhost:3000/api/servers

# Check individual server health
# (depends on server implementation)

# Manually restart unhealthy server
curl -X POST http://localhost:3000/api/servers/filesystem/restart
```

---

### 5. WebSocket Errors

**When**: WebSocket connection issues

**Examples**:

- Client disconnects abruptly
- Network timeout
- Invalid message format
- Closed connection

**Handling**:

```javascript
// In index.js
_setupWebSocket() {
  this.wss.on('connection', (ws) => {
    logger.info('✅ WebSocket client connected');
    this.wsClients.add(ws);
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        this._handleWebSocketMessage(ws, data);
      } catch (error) {
        logger.error('❌ Invalid WebSocket message:', error);
        ws.send(JSON.stringify({ 
          type: 'error', 
          error: 'Invalid message format' 
        }));
      }
    });
    
    ws.on('error', (error) => {
      logger.error('❌ WebSocket error:', error);
      // Don't crash server on client error
    });
    
    ws.on('close', () => {
      logger.info('🔌 WebSocket client disconnected');
      this.wsClients.delete(ws);
    });
  });
}

_broadcastToClients(message) {
  const payload = JSON.stringify(message);
  
  for (const client of this.wsClients) {
    try {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    } catch (error) {
      logger.error('❌ Failed to send to client:', error);
      // Remove dead client
      this.wsClients.delete(client);
    }
  }
}
```

**Recovery**:

- Isolate client errors (don't crash server)
- Remove disconnected clients from set
- Auto-reconnect on client side

**User Action**:

```bash
# Test WebSocket connection
websocat ws://localhost:3000

# Check network connectivity
ping localhost

# Check firewall rules
sudo iptables -L
```

---

### 6. HTTP Request Errors

**When**: API request fails

**Examples**:

- Invalid request body
- Missing parameters
- Server not found
- Operation not allowed

**Handling**:

```javascript
// In index.js
this.app.post('/api/servers/:name/start', async (req, res) => {
  try {
    const { name } = req.params;
    
    // Validation
    if (!this.orchestrator.servers.has(name)) {
      return res.status(404).json({
        error: `Server '${name}' not found`,
        code: 'SERVER_NOT_FOUND'
      });
    }
    
    const server = this.orchestrator.servers.get(name);
    
    // Guard against invalid state
    if (server.state === ServerState.RUNNING) {
      return res.status(409).json({
        error: `Server '${name}' is already running`,
        code: 'SERVER_ALREADY_RUNNING',
        server: {
          name,
          state: server.state,
          pid: server.pid
        }
      });
    }
    
    // Execute operation
    await this.orchestrator.start(name);
    
    res.json({
      success: true,
      message: `Server '${name}' started`,
      server: {
        name,
        state: server.state,
        pid: server.pid
      }
    });
    
  } catch (error) {
    logger.error(`❌ Failed to start server '${req.params.name}':`, error);
    
    res.status(500).json({
      error: error.message,
      code: 'INTERNAL_ERROR'
    });
  }
});
```

**Recovery**:

- Return appropriate HTTP status code
- Include error code for programmatic handling
- Log error for debugging
- Don't expose internal details to client

**Error Codes**:

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `SERVER_NOT_FOUND` | 404 | Server not in configuration |
| `SERVER_ALREADY_RUNNING` | 409 | Server already in target state |
| `SERVER_NOT_RUNNING` | 400 | Server not in expected state |
| `INVALID_REQUEST` | 400 | Invalid parameters |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Error Propagation Patterns

### Pattern 1: Try-Catch with Event Emission

**Use when**: Error should be logged but not crash calling code

```javascript
async someOperation() {
  try {
    await riskyOperation();
  } catch (error) {
    logger.error('❌ Operation failed:', error);
    this.emit('error', { context: 'someOperation', error });
    // Don't throw - let caller continue
  }
}
```

### Pattern 2: Try-Catch with Re-throw

**Use when**: Error should propagate to caller

```javascript
async criticalOperation() {
  try {
    await riskyOperation();
  } catch (error) {
    logger.error('❌ Critical operation failed:', error);
    this.emit('error', { context: 'criticalOperation', error });
    throw new Error(`Critical failure: ${error.message}`);
  }
}
```

### Pattern 3: Guard Clauses

**Use when**: Invalid state should be prevented

```javascript
async start(serverName) {
  // Guard: Server must exist
  if (!this.servers.has(serverName)) {
    throw new Error(`Server '${serverName}' not found`);
  }
  
  const server = this.servers.get(serverName);
  
  // Guard: Server must be stopped
  if (server.state !== ServerState.STOPPED) {
    throw new Error(`Server '${serverName}' is ${server.state}`);
  }
  
  // Safe to proceed
  await this._startServer(serverName);
}
```

### Pattern 4: Error Event Listeners

**Use when**: Centralizing error handling

```javascript
// In index.js
_setupOrchestratorEvents() {
  this.orchestrator.on('error', (data) => {
    logger.error('❌ Orchestrator error:', data);
    
    // Broadcast to WebSocket clients
    this._broadcastToClients({
      type: 'error',
      context: data.context,
      error: data.error.message
    });
    
    // Send to telemetry
    this._sendToTelemetry('error', data);
  });
}
```

---

## Logging Best Practices

### Log Levels

Use appropriate log levels:

```javascript
// DEBUG: Verbose debugging info (disabled in production)
logger.debug('🔍 Checking server health:', { name, pid });

// INFO: General information (normal operation)
logger.info('📘 Server started:', { name, pid });

// SUCCESS: Operation succeeded (celebrate!)
logger.success('✅ All servers healthy');

// WARN: Potential issue (non-fatal)
logger.warn('⚠️ Server restart attempt 2/3:', { name });

// ERROR: Recoverable error
logger.error('❌ Server crashed, restarting:', { name, code });

// CRITICAL: Unrecoverable error
logger.critical('🔥 Max restarts exceeded:', { name, restartCount });
```

### Structured Logging

Include context for debugging:

```javascript
// Bad: No context
logger.error('Failed to start');

// Good: Rich context
logger.error('❌ Failed to start server:', {
  serverName,
  command,
  args,
  error: error.message,
  stack: error.stack
});
```

### Commentomancy in Logs

Use Commentomancy sigils for semantic logging:

```javascript
/// Law: Critical servers MUST start
if (CRITICAL_SERVERS.includes(serverName)) {
  logger.law(`⚖️ Critical server ${serverName} starting`);
}

//<3 Lore: Celebrate successful coordination
logger.lore(`💝 All agents coordinated successfully`);

//!? Guardrail: Security-critical operation
logger.guardrail(`🛡️ Destructive operation requires approval`);
```

---

## Debugging Workflows

### Workflow 1: Server Won't Start

**Symptoms**: Server stays in STARTING state or transitions to ERROR

**Steps**:

1. Check orchestrator logs:

   ```bash
   tail -f .mcp/logs/orchestrator.log | grep "filesystem"
   ```

2. Check server configuration:

   ```bash
   cat bambisleep-church-catgirl-control-tower.code-workspace | jq '.settings.mcp.servers.filesystem'
   ```

3. Test command manually:

   ```bash
   npx -y @modelcontextprotocol/server-filesystem /mnt/f/bambisleep-church-catgirl-control-tower
   ```

4. Check environment variables:

   ```bash
   printenv | grep GITHUB_TOKEN
   ```

5. Check permissions:

   ```bash
   ls -la /mnt/f/bambisleep-church-catgirl-control-tower
   ```

### Workflow 2: Server Keeps Crashing

**Symptoms**: Server restarts repeatedly, eventually gives up

**Steps**:

1. Check crash logs:

   ```bash
   grep "crashed" .mcp/logs/orchestrator.log | tail -20
   ```

2. Check exit code/signal:

   ```bash
   grep "exitCode\|signal" .mcp/logs/orchestrator.log | tail -10
   ```

3. Check system resources:

   ```bash
   free -h
   df -h
   ```

4. Test server in isolation:

   ```bash
   npx -y @modelcontextprotocol/server-filesystem /workspace
   # Watch for errors
   ```

5. Increase restart limit temporarily:

   ```bash
   export MCP_ORCHESTRATOR_MAX_RESTARTS=10
   npm run orchestrator:start
   ```

### Workflow 3: WebSocket Not Receiving Updates

**Symptoms**: Dashboard shows stale data

**Steps**:

1. Check WebSocket connection:

   ```javascript
   // In browser console
   const ws = new WebSocket('ws://localhost:3000');
   ws.onopen = () => console.log('Connected');
   ws.onmessage = (e) => console.log('Message:', e.data);
   ws.onerror = (e) => console.error('Error:', e);
   ```

2. Check subscription:

   ```javascript
   ws.send(JSON.stringify({ type: 'subscribe', channel: 'servers' }));
   ```

3. Check server logs for broadcasts:

   ```bash
   grep "broadcast\|WebSocket" .mcp/logs/orchestrator.log
   ```

4. Check firewall/CORS:

   ```bash
   curl -H "Origin: http://localhost:3000" http://localhost:3000/health
   ```

### Workflow 4: High Memory Usage

**Symptoms**: Process memory grows over time

**Steps**:

1. Take heap snapshot:

   ```bash
   node --inspect src/index.js
   # Open chrome://inspect
   # Take heap snapshot
   ```

2. Enable memory logging:

   ```javascript
   // Add to index.js
   setInterval(() => {
     const usage = process.memoryUsage();
     logger.debug('Memory:', {
       heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)} MB`,
       heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)} MB`,
       rss: `${Math.round(usage.rss / 1024 / 1024)} MB`
     });
   }, 60000);
   ```

3. Check for memory leaks:

   - Event listeners not removed
   - Timers not cleared
   - Large objects in closures
   - Streams not closed

4. Use clinic.js for profiling:

   ```bash
   npm install -g clinic
   clinic doctor -- node src/index.js
   ```

---

## Error Recovery Checklist

### Before Deployment

- [ ] All critical paths have try-catch
- [ ] All errors emit events
- [ ] All timers have clearTimeout/clearInterval
- [ ] All event listeners can be removed
- [ ] All file handles are closed
- [ ] All child processes are tracked
- [ ] Health checks cover all critical servers
- [ ] Auto-restart configured for transient failures
- [ ] Graceful shutdown handles SIGTERM/SIGINT
- [ ] State persistence saves on changes

### After Error Occurs

- [ ] Check orchestrator logs (`.mcp/logs/orchestrator.log`)
- [ ] Check server status (`/api/servers`)
- [ ] Check system resources (`free -h`, `df -h`)
- [ ] Test command manually (`npx ...`)
- [ ] Check configuration (`.code-workspace`, `.env`)
- [ ] Check permissions (`ls -la`)
- [ ] Check network connectivity (`ping`, `curl`)
- [ ] Review recent changes (`git log`, `git diff`)
- [ ] Check for known issues (GitHub issues)
- [ ] Increase logging verbosity (`LOG_LEVEL=debug`)

---

## Common Error Messages

### "Server already running"

**Cause**: Attempted to start a server that's in RUNNING state

**Solution**: Stop server first, or use restart

```bash
curl -X POST http://localhost:3000/api/servers/filesystem/stop
curl -X POST http://localhost:3000/api/servers/filesystem/start
# Or use restart
curl -X POST http://localhost:3000/api/servers/filesystem/restart
```

### "Server not found"

**Cause**: Server name not in workspace configuration

**Solution**: Check workspace file for typos

```bash
cat bambisleep-church-catgirl-control-tower.code-workspace | jq '.settings.mcp.servers | keys'
```

### "Max restarts exceeded"

**Cause**: Server crashed 3+ times, auto-restart gave up

**Solution**: Fix underlying issue, then manually start

```bash
# Check logs for crash reason
grep "filesystem.*crashed" .mcp/logs/orchestrator.log

# Fix issue (e.g., install missing dependency)
npm install missing-package

# Reset restart count by stopping orchestrator
npm run orchestrator:stop
npm run orchestrator:start
```

### "EADDRINUSE: address already in use"

**Cause**: Port 3000 already taken

**Solution**: Kill process or use different port

```bash
# Find process
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
export PORT=3001
npm start
```

### "ENOENT: no such file or directory"

**Cause**: File or directory doesn't exist

**Solution**: Create required directories

```bash
mkdir -p .mcp/logs .mcp/cache
```

---

## See Also

- **[debugging-guide.md](../debugging-guide.md)** - Comprehensive troubleshooting
- **[state-machines.md](../api/state-machines.md)** - State transition recovery
- **[modules.md](modules.md)** - Module-specific error handling
- **[conventions.md](conventions.md)** - Logging standards
