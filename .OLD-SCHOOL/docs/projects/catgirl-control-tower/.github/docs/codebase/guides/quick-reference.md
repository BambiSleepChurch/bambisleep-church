# Quick Reference

**One-page cheat sheet for MCP Control Tower - key concepts, commands, and patterns.**

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Create .env file
cat > .env << EOF
GITHUB_TOKEN=ghp_...
BRAVE_API_KEY=...
POSTGRES_CONNECTION_STRING=postgresql://user:pass@host:5432/db
EOF

# Start Control Tower
npm run dev

# Start MCP servers (separate terminal)
npm run orchestrator:start

# Check status
curl http://localhost:3000/health
```

---

## 📁 Project Structure

```
src/
├── index.js (644 lines)           # Control Tower app (Express + WebSocket)
├── mcp/
│   ├── orchestrator.js (823)      # MCP server lifecycle
│   └── agent-coordinator.js (633) # Multi-agent orchestration
└── utils/
    ├── logger.js (358)            # Structured logging
    └── config.js (464)            # Configuration management
```

**Total**: 2,922 lines of production code

---

## 🔑 Key Concepts

### Server States

```
STOPPED → STARTING → RUNNING → STOPPING → STOPPED
             ↓           ↓
           ERROR ← RESTARTING
```

### Server Tiers (Initialization Order)

- **Layer 0**: `filesystem`, `memory` (primitives)
- **Layer 1**: `git`, `github`, `brave-search` (foundation)
- **Layer 2**: `sequential-thinking`, `postgres`, `everything` (advanced)

**Must start Layer 0 before Layer 1, Layer 1 before Layer 2**

### Commentomancy Sigils

- `///` Law - Sacred truth (structural requirements)
- `//<3` Lore - Emotional context (WHY decisions were made)
- `//!` Ritual - Precondition enforced by MCP
- `//!?` Guardrail - Ethics gate requiring approval
- `//->` Strategy - Architectural Decision Record
- `//*` Emergence - Revelation surfaced to Knowledge Graph
- `//~` Self-mod - Recursive awareness
- `//+` Evolution - Performance optimization target

---

## 💻 Common Commands

### NPM Scripts

```bash
npm start                      # Start Control Tower (production)
npm run dev                    # Start Control Tower (dev mode with hot reload)
npm run orchestrator:start     # Start all MCP servers (tiered)
npm run orchestrator:stop      # Stop all MCP servers
npm run orchestrator:status    # Show server status
npm run orchestrator:health    # Run health checks
npm test                       # Run tests once
npm run test:watch             # Run tests in watch mode
npm run lint                   # Check code style
npm run format                 # Format code with Prettier
```

### Direct CLI

```bash
# Start single server
node src/mcp/orchestrator.js start filesystem

# Start with debug output
node src/mcp/orchestrator.js start filesystem --debug

# Stop server
node src/mcp/orchestrator.js stop filesystem

# Show status
node src/mcp/orchestrator.js status

# Health check with JSON
node src/mcp/orchestrator.js health --json
```

### VS Code Tasks

Use `Cmd/Ctrl+Shift+P` → "Run Task":

- 🌸 Start Development Server
- ✨ Start MCP Orchestrator
- 🔍 Check MCP Status
- 💎 Run Tests
- 🎨 Format Code

---

## 🌐 HTTP API

**Base URL**: `http://localhost:3000`

```bash
# Health check
GET /health

# List servers
GET /api/servers

# Start server
POST /api/servers/:name/start

# Stop server
POST /api/servers/:name/stop

# Restart server
POST /api/servers/:name/restart

# Start all
POST /api/servers/start-all

# Stop all
POST /api/servers/stop-all
```

**Example**:

```bash
curl http://localhost:3000/health
curl -X POST http://localhost:3000/api/servers/filesystem/start
```

---

## 🔌 WebSocket API

**Connection**: `ws://localhost:3000`

### Subscribe to updates

```javascript
const ws = new WebSocket('ws://localhost:3000');
ws.send(JSON.stringify({ type: 'subscribe', channel: 'servers' }));
```

### Execute command

```javascript
ws.send(JSON.stringify({ 
  type: 'command', 
  action: 'start', 
  server: 'filesystem' 
}));
```

### Channels

- `servers` - Server status updates
- `logs` - Real-time log stream
- `events` - All orchestrator events

---

## 📝 Logging

### Log Levels

```javascript
logger.debug('🔍 Verbose debugging');     // Priority 0
logger.info('📘 General info');           // Priority 1
logger.success('✅ Operation succeeded'); // Priority 1
logger.warn('⚠️ Warning');                // Priority 2
logger.error('❌ Error');                 // Priority 3
logger.critical('🔥 Critical');           // Priority 4
```

### Set Log Level

```bash
# In .env
LOG_LEVEL=debug

# Or environment variable
LOG_LEVEL=debug npm run dev
```

### View Logs

```bash
# Tail orchestrator logs
tail -f .mcp/logs/orchestrator.log

# Search logs
grep "ERROR" .mcp/logs/orchestrator.log

# Last 100 lines
tail -n 100 .mcp/logs/orchestrator.log
```

---

## ⚙️ Configuration

### Priority Order (highest to lowest)

1. Runtime overrides (`config.override()`)
2. Environment variables (`process.env`)
3. Workspace file (`.code-workspace`)
4. Default config (`DEFAULT_CONFIG`)

### Environment Variables

```bash
# Server
PORT=3000
HOST=0.0.0.0

# Orchestrator
MCP_ORCHESTRATOR_MAX_RESTARTS=3
MCP_ORCHESTRATOR_HEALTH_CHECK_INTERVAL=30000
MCP_ORCHESTRATOR_RESTART_DELAY=5000

# Logging
LOG_LEVEL=info

# MCP Servers
GITHUB_TOKEN=ghp_...
BRAVE_API_KEY=...
POSTGRES_CONNECTION_STRING=postgresql://...
```

### Workspace File

```json
{
  "settings": {
    "mcp.orchestrator": {
      "autoStart": ["filesystem", "memory", "git"],
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

---

## 🐛 Debugging

### Enable Debug Logging

```bash
LOG_LEVEL=debug npm run dev
```

### Node.js Inspector

```bash
node --inspect src/index.js
# Open chrome://inspect in Chrome
```

### Check Server Processes

```bash
# List all MCP server processes
ps aux | grep mcp

# Kill zombie process
kill -9 <PID>
```

### Common Issues

#### Port already in use

```bash
lsof -i :3000
kill -9 <PID>
# Or use different port
PORT=3001 npm start
```

#### Server won't start

```bash
# Test manually
npx -y @modelcontextprotocol/server-filesystem /workspace

# Check logs
tail -f .mcp/logs/orchestrator.log
```

#### WebSocket not connecting

```bash
# Test connection
websocat ws://localhost:3000

# Check in browser console
const ws = new WebSocket('ws://localhost:3000');
ws.onopen = () => console.log('Connected');
```

---

## 🏗️ Code Patterns

### EventEmitter Pattern

```javascript
// Emit event
this.emit('server:started', { name, pid, timestamp });

// Listen to event
orchestrator.on('server:started', (data) => {
  logger.info(`✅ Server ${data.name} started`);
});
```

### State Transition

```javascript
// Guard condition
if (server.state !== ServerState.STOPPED) {
  throw new Error(`Server is ${server.state}`);
}

// Transition
server.state = ServerState.STARTING;
this.emit('server:starting', { name });

// Operation
await this._spawnProcess(name);

// Transition
server.state = ServerState.RUNNING;
this.emit('server:started', { name, pid });
```

### Error Handling

```javascript
try {
  await riskyOperation();
} catch (error) {
  logger.error('❌ Operation failed:', error);
  this.emit('error', { context: 'operation', error });
  throw error; // Re-throw if caller should handle
}
```

### Auto-Restart

```javascript
const restartCount = this.restartCounts.get(name) || 0;

if (restartCount < this.config.maxRestarts) {
  this.restartCounts.set(name, restartCount + 1);
  setTimeout(() => this.start(name), this.config.restartDelay);
} else {
  this.emit('server:failed', { name, reason: 'Max restarts exceeded' });
}
```

---

## 📊 Emoji Commit Prefixes

Use for machine-readable commits:

- `🌸` Package management, dependency updates
- `👑` Architecture, major refactors
- `💎` Test coverage improvements
- `🦋` Transformations, migrations
- `✨` MCP server operations
- `🛡️` Security enhancements
- `🎭` CI/CD pipeline changes

**Example**:

```bash
git commit -m "🌸 Add uuid package for agent coordination"
git commit -m "✨ Add auto-restart for crashed servers"
```

---

## 🔒 Security

### Never Commit

- ❌ API keys, tokens
- ❌ Passwords, connection strings
- ❌ `.env` files
- ❌ Private keys

### Always Use

- ✅ Environment variables
- ✅ Guardrail comments (`//!?`)
- ✅ Input validation
- ✅ Error sanitization (don't expose internal details)

---

## 📈 Performance Tips

### Memory Monitoring

```javascript
setInterval(() => {
  const usage = process.memoryUsage();
  logger.debug('Memory:', {
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)} MB`
  });
}, 60000);
```

### Profiling

```bash
# CPU profiling
npm install -g clinic
clinic doctor -- node src/index.js

# Heap snapshots
node --inspect src/index.js
# Open chrome://inspect → Memory → Take Heap Snapshot
```

---

## 🧪 Testing

### Run Tests

```bash
npm test                    # Single run
npm run test:watch          # Watch mode (TDD)
npm run test:coverage       # Coverage report
```

### Test Pattern

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

---

## 🐳 Docker

### Build Image

```bash
docker build -t bambisleep/mcp-control-tower:latest .
```

### Run Container

```bash
docker run -d \
  -p 3000:3000 \
  -e GITHUB_TOKEN=$GITHUB_TOKEN \
  -e BRAVE_API_KEY=$BRAVE_API_KEY \
  -e NODE_ENV=production \
  --name mcp-control-tower \
  bambisleep/mcp-control-tower:latest
```

### Docker Compose

```bash
docker-compose up -d
docker-compose logs -f
docker-compose down
```

---

## 📚 Documentation Links

- **[architecture.md](../core/architecture.md)** - System design
- **[modules.md](../implementation/modules.md)** - Module reference
- **[api-reference.md](../api/api-reference.md)** - HTTP/WebSocket API
- **[state-machines.md](../api/state-machines.md)** - State transitions
- **[error-handling.md](../implementation/error-handling.md)** - Error recovery
- **[patterns.md](../implementation/patterns.md)** - Implementation patterns
- **[commentomancy.md](../core/commentomancy.md)** - Documentation system
- **[conventions.md](../implementation/conventions.md)** - Coding standards
- **[development-workflow.md](development-workflow.md)** - Setup guide
- **[integration-points.md](../api/integration-points.md)** - Configuration

---

## 🆘 Emergency Commands

### Kill All Servers

```bash
npm run orchestrator:stop
# Or force kill
pkill -f "@modelcontextprotocol"
```

### Reset State

```bash
rm -rf .mcp/state.json .mcp/logs/*
```

### Clean Restart

```bash
npm run orchestrator:stop
rm -rf .mcp/state.json
npm run orchestrator:start
```

### Check Health

```bash
curl http://localhost:3000/health | jq
```

---

## 💡 Tips

1. **Always check logs first**: `.mcp/logs/orchestrator.log`
2. **Use debug mode for troubleshooting**: `LOG_LEVEL=debug`
3. **Test servers manually before blaming orchestrator**: `npx -y ...`
4. **Respect tier initialization order**: Layer 0 → 1 → 2
5. **Don't forget to save state**: Orchestrator auto-saves on changes
6. **Monitor memory usage**: Use `process.memoryUsage()` in production
7. **Use Commentomancy**: Document WHY, not just WHAT
8. **Emit events for observability**: All state changes should emit
9. **Guard against invalid states**: Use guard clauses liberally
10. **Test with auto-restart disabled**: Set `maxRestarts: 0` for debugging

---

## 🎓 Learning Path

### Day 1: Understand the System

1. Read [architecture.md](../core/architecture.md)
2. Read [modules.md](../implementation/modules.md)
3. Run `npm run dev` and explore

### Day 2: Learn the API

1. Read [api-reference.md](../api/api-reference.md)
2. Test endpoints with curl
3. Build a simple WebSocket client

### Day 3: Dive into Code

1. Read [patterns.md](../implementation/patterns.md)
2. Read [commentomancy.md](../core/commentomancy.md)
3. Browse source files with new understanding

### Day 4: Debugging & Operations

1. Read [error-handling.md](../implementation/error-handling.md)
2. Read [state-machines.md](../api/state-machines.md)
3. Practice troubleshooting workflows

### Day 5: Contributing

1. Read [conventions.md](../implementation/conventions.md)
2. Read [development-workflow.md](development-workflow.md)
3. Write your first test and feature

---

**Need more detail?** See the [README.md](README.md) for complete documentation index.
