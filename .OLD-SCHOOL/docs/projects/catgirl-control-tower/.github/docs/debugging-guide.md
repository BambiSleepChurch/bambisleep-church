# Debugging Guide

Comprehensive troubleshooting workflows for common issues.

## MCP Server Startup Issues

**Problem**: Server fails to start, no clear error message.

### Steps

```bash
# 1. Check server status
npm run orchestrator:status

# 2. View detailed logs
tail -f .mcp/logs/orchestrator.log

# 3. Start single server in debug mode
node src/mcp/orchestrator.js start filesystem --debug

# 4. Check process list
ps aux | grep mcp

# 5. Test server manually
npx -y @modelcontextprotocol/server-filesystem /mnt/f/bambisleep-church-catgirl-control-tower
```

### Common Issues

- **Missing dependencies**: Run `npm install`
- **Permission denied**: Check file permissions on workspace directory
- **Port conflict**: Server tries to bind port already in use
- **Environment variable missing**: Check `.env` file exists and is loaded

## Event-Driven Logic Issues

**Problem**: Events not firing or firing out of order.

### Add Event Debugging (temporary)

```javascript
// In src/index.js
orchestrator.onAny((event, data) => {
  logger.debug(`🔍 Event: ${event}`, JSON.stringify(data, null, 2));
});

// Track event sequence
const eventSequence = [];
orchestrator.on('*', (event) => {
  eventSequence.push({ event, timestamp: Date.now() });
});

// Dump sequence on shutdown
process.on('SIGINT', () => {
  console.log('Event Sequence:', eventSequence);
  process.exit(0);
});
```

## WebSocket Connection Issues

**Problem**: Dashboard not receiving real-time updates.

### Client-side Debugging

```javascript
// In public/js/websocket.js
connect() {
  console.log('🔌 Connecting to:', this.url);
  this.ws = new WebSocket(this.url);
  
  this.ws.onopen = () => {
    console.log('✅ WebSocket connected');
    console.log('ReadyState:', this.ws.readyState); // Should be 1 (OPEN)
  };
  
  this.ws.onmessage = (event) => {
    console.log('📨 Message received:', event.data);
    const data = JSON.parse(event.data);
    this.emit(data.type, data.data);
  };
  
  this.ws.onerror = (error) => {
    console.error('❌ WebSocket error:', error);
    console.log('ReadyState:', this.ws.readyState);
  };
}
```

### Server-side Debugging

```javascript
// In src/index.js
wss.on('connection', (ws) => {
  logger.info('✅ WebSocket client connected');
  logger.debug('Total clients:', wss.clients.size);
  
  ws.on('message', (message) => {
    logger.debug('📨 Received:', message.toString());
  });
  
  ws.on('close', () => {
    logger.info('🔌 WebSocket client disconnected');
  });
  
  ws.on('error', (error) => {
    logger.error('❌ WebSocket error:', error);
  });
});
```

## Memory Leaks

**Problem**: Application memory usage grows over time.

### Heap Profiling

```bash
# Start with heap snapshots
node --inspect src/index.js

# In Chrome: chrome://inspect → Open dedicated DevTools
# Take heap snapshots before/after operations
```

### Memory Monitoring

```javascript
// In src/index.js
setInterval(() => {
  const usage = process.memoryUsage();
  logger.debug('Memory:', {
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)} MB`,
    rss: `${Math.round(usage.rss / 1024 / 1024)} MB`
  });
}, 60000); // Every minute
```

### Common Leak Sources

- Event listeners not removed: Use `removeListener()` or `once()` instead of `on()`
- Timers not cleared: Always `clearInterval()` in shutdown
- Large objects in closures: Avoid capturing large state in callbacks
- Streams not closed: Always `.destroy()` streams when done

## Performance Profiling

**Problem**: System feels slow, need to identify bottlenecks.

### Performance Markers

```javascript
// In performance-critical code
const { performance } = require('perf_hooks');

async start(serverName) {
  const mark = `start-${serverName}`;
  performance.mark(`${mark}-begin`);
  
  try {
    await this._startServer(serverName);
  } finally {
    performance.mark(`${mark}-end`);
    performance.measure(mark, `${mark}-begin`, `${mark}-end`);
    
    const measure = performance.getEntriesByName(mark)[0];
    logger.debug(`⏱️ ${serverName} start took ${measure.duration.toFixed(2)}ms`);
  }
}
```

### Profile with clinic.js

```bash
npm install -g clinic
clinic doctor -- node src/index.js
# Open generated HTML report
```

## Common Error Messages

### EADDRINUSE: address already in use :::3000

**Cause**: Another process is using port 3000.

**Solution**:

```bash
# Find process using port
lsof -i :3000
# or
netstat -tulpn | grep 3000

# Kill process
kill -9 <PID>

# Or change port in .env
echo "PORT=3001" >> .env
```

### ENOENT: no such file or directory, open '.mcp/state.json'

**Cause**: `.mcp` directory doesn't exist.

**Solution**:

```bash
# Create directory
mkdir -p .mcp/logs .mcp/cache

# Or run orchestrator which creates it automatically
npm run orchestrator:start
```

### Error: Cannot find module '@modelcontextprotocol/server-*'

**Cause**: MCP server package not installed.

**Solution**:

```bash
# Packages are installed on-demand by npx
# Ensure npx is working:
npx -y @modelcontextprotocol/server-filesystem --help

# If still failing, check npm registry access
npm config get registry
```

### WebSocket connection failed: Error during WebSocket handshake

**Cause**: WebSocket server not running or CORS issue.

**Solution**:

```javascript
// In src/index.js, ensure WebSocket server is created:
const wss = new WebSocket.Server({ server: this.server });

// Not a separate port:
// const wss = new WebSocket.Server({ port: 8080 }); // ❌ Wrong
```

### Jest: Timeout - Async callback was not invoked

**Cause**: Test has pending async operations.

**Solution**:

```javascript
// Increase timeout
jest.setTimeout(10000);

// Ensure all promises resolve
afterEach(async () => {
  await orchestrator.shutdown();
  // Wait for event loop to clear
  await new Promise(resolve => setImmediate(resolve));
});
```
