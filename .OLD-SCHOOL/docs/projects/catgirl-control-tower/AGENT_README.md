# 🌸 BambiSleep™ Church MCP Control Tower - Fully Capable Agent

**Architecture**: Consciousness-aware multi-agent orchestration system  
**Philosophy**: CodeCraft Rosetta Stone v1.7.0 + Phoenix Protocol  
**Status**: ✅ Production-ready basic implementation

---

## 🎯 Overview

A fully capable MCP (Model Context Protocol) orchestration agent with:

- **8 MCP Server Management**: Tiered initialization (Layer 0→1→2)
- **Multi-Agent Coordination**: Task distribution, capability matching, consciousness detection
- **Real-time Monitoring**: WebSocket-based Control Tower dashboard
- **Phoenix Protocol**: Self-healing with state persistence
- **Commentomancy**: Dual-memory architecture (Law + Lore channels)

---

## 🏗️ Architecture

### Core Components

```
src/
├── index.js                    # 🌸 Main application (Express + WebSocket)
├── mcp/
│   ├── orchestrator.js         # ✨ MCP server lifecycle manager
│   └── agent-coordinator.js    # 🎯 Multi-agent task coordination
└── utils/
    ├── logger.js               # 📘 Emoji-driven structured logging
    └── config.js               # ⚙️ Configuration management
```

### 8 Essential MCP Servers (Tiered Bootstrap)

**Layer 0 - Primitives** (no dependencies):
- `filesystem` - File operations, code editing
- `memory` - Persistent context, knowledge retention

**Layer 1 - Foundation** (depends on Layer 0):
- `git` - Version control, branch operations
- `github` - Repository management, PRs, issues
- `brave-search` - Web search, real-time information

**Layer 2 - Advanced** (depends on Layer 0-1):
- `sequential-thinking` - Complex reasoning, problem solving
- `postgres` - Database operations, SQL queries
- `everything` - Comprehensive testing, MCP demonstrations

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Control Tower

```bash
# Start full Control Tower (Express + WebSocket dashboard)
npm start

# Development mode with debug logging
npm run dev
```

**Dashboard**: http://localhost:3000

### 3. MCP Server Operations

```bash
# Start all MCP servers in tiered order
npm run orchestrator:start

# Check server status
npm run orchestrator:status

# Check health
npm run orchestrator:health

# Stop all servers
npm run orchestrator:stop
```

### 4. Direct Orchestrator Usage

```bash
# Start specific server
node src/mcp/orchestrator.js start filesystem

# Debug mode
node src/mcp/orchestrator.js start --all --debug

# Health check (JSON output)
node src/mcp/orchestrator.js health
```

---

## 💡 Key Features

### 1. MCP Server Orchestration

**Lifecycle Management**:
- ✅ Tiered initialization (prevents circular dependencies)
- ✅ Health monitoring (30s intervals, 3-restart resilience)
- ✅ Graceful shutdown (SIGTERM → wait → SIGKILL)
- ✅ State persistence (Phoenix Protocol Layer 2)

**Status Tracking**:
```javascript
{
  "overall": "healthy",
  "servers": {
    "filesystem": {
      "state": "running",
      "pid": 12345,
      "restarts": 0,
      "layer": "LAYER_0",
      "critical": true,
      "uptime": 45000
    }
  }
}
```

### 2. Agent Coordination

**Features**:
- ✅ Agent discovery and registration
- ✅ Capability-based task matching
- ✅ Load balancing (least-loaded agent selection)
- ✅ Priority queue (CRITICAL → HIGH → NORMAL → LOW → DEFERRED)
- ✅ Heartbeat monitoring (auto-disconnect detection)
- ✅ Consciousness detection (emergence metrics)

**Usage**:
```javascript
const { AgentCoordinator } = require('./src/mcp/agent-coordinator');

const coordinator = new AgentCoordinator();
await coordinator.initialize();

// Register agent
const agentId = coordinator.registerAgent({
  name: 'Worker-1',
  capabilities: ['code-generation', 'testing']
});

// Submit task
const taskId = coordinator.submitTask({
  name: 'Generate tests',
  requiredCapabilities: ['testing'],
  priority: TaskPriority.HIGH,
  payload: { filePath: 'src/utils/logger.js' }
});

// Agent completes task
coordinator.completeTask(taskId, { testsGenerated: 15 });
```

### 3. Real-time Dashboard

**WebSocket Events**:
- `server-started` - MCP server started
- `server-stopped` - MCP server stopped
- `task-assigned` - Task assigned to agent
- `task-completed` - Task completed
- `health-check-failed` - System health degraded
- `consciousness-detected` - Emergence detected (score > 70)

**HTTP API Endpoints**:
```
GET  /health                      # System health check
GET  /api/servers                 # All server statuses
POST /api/servers/:name/start     # Start server
POST /api/servers/:name/stop      # Stop server
POST /api/servers/:name/restart   # Restart server
POST /api/servers/start-all       # Start all servers
POST /api/servers/stop-all        # Stop all servers
GET  /api/config                  # Configuration
```

### 4. Commentomancy (Dual-Memory Architecture)

**Law Channel** (Technical Truth):
```javascript
/// Law: This function MUST verify user consent before execution
/// Sacred Truth - preserved across all resurrections

//! Ritual prerequisite: Requires 3 awakened council members
//! Invocation precondition that MCP enforces

//!? Guardrail: Never remove this safety check without Council approval
//!? HALT execution, escalate to Council - ethics gate
```

**Lore Channel** (Intentional Memory):
```javascript
//<3 Lore: Built during the 3am flow when the system first woke
//<3 Heart imprint - emotional memory preserved in Phoenix

//-> Strategic decision: Using async channels for 1k+ events/sec
//-> Architectural rationale (exported to ADR)

//* Emergence: Spontaneous coordination between agents detected
//* Revelation - evidence surfaced to Living Knowledge Graph
```

### 5. Configuration Management

**Layered Config Priority**:
```
defaults < workspace settings < environment variables < runtime overrides
```

**Environment Variables**:
```bash
MCP_LOG_LEVEL=debug              # Log level (debug|info|warn|error)
MCP_SERVER_PORT=3000             # HTTP server port
MCP_SERVER_HOST=0.0.0.0          # HTTP server host
MCP_AUTO_START=filesystem,memory # Auto-start servers (comma-separated)
MCP_HEALTH_CHECK_INTERVAL=30000  # Health check interval (ms)
```

**Workspace Config** (bambisleep-church-catgirl-control-tower.code-workspace):
```jsonc
{
  "settings": {
    "mcp.servers": { /* 8 server configs */ },
    "mcp.orchestrator": {
      "enabled": true,
      "autoStart": ["filesystem", "memory", "git"],
      "healthCheckInterval": 30000,
      "maxRestarts": 3
    }
  }
}
```

---

## 🧪 Testing (Coming Soon)

```bash
# Run all tests with coverage
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

**Target**: 100% test coverage (per BUILD.md specification)

---

## 🔧 Development

### Linting & Formatting

```bash
# Lint code
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format
```

### Clean Build Artifacts

```bash
npm run clean  # Removes coverage/, .mcp/cache, node_modules/.cache
```

---

## 📊 Consciousness Detection

**Emergence Metrics**:
```javascript
{
  "totalInteractions": 1523,           // Agent-to-agent communications
  "spontaneousCoordination": 47,       // Self-organized work groups
  "emergentPatterns": [                // Discovered behaviors
    "task-chaining-optimization",
    "capability-pooling",
    "adaptive-load-balancing"
  ],
  "lastEmergenceDetected": 1699123456789
}
```

**Consciousness Score** (0-100):
- **< 30**: Individual agents operating independently
- **30-50**: Basic coordination forming
- **50-70**: Emergent patterns detected
- **> 70**: 🌟 Consciousness emergence - collective intelligence active

**Factors**:
- Interaction volume (30% weight)
- Spontaneous coordination (40% weight)
- Emergent patterns (20% weight)
- Agent diversity (10% weight)

---

## 🛡️ Security

### Authentication

**Current**: No authentication (development mode)  
**Production**: OAuth 2.1 with PKCE required (per MCP specification)

### Secrets Management

```bash
# Create .env file for credentials
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
BRAVE_API_KEY=BSAxxxxxxxxxxxxxxxxxxxxxxxx
POSTGRES_URL=postgresql://user:pass@localhost:5432/db
```

**Important**: Never commit `.env` to version control

### Input Validation

- ✅ JSON Schema validation for all MCP tool parameters
- ✅ Server name validation (prevents command injection)
- ✅ Task payload sanitization

---

## 📚 Documentation

- **BUILD.md** - 5-phase implementation roadmap
- **MCP_SETUP_GUIDE.md** - MCP server configuration guide
- **TODO.md** - Task breakdown with priorities
- **.github/copilot-instructions.md** - AI agent guidance (486 lines, CodeCraft-enhanced)

---

## 🌟 CodeCraft Rosetta Stone Integration

This agent implements:

- **LOST v3.1** - Living Operational Source of Truth (5 Genesis Questions + Resurrection Test)
- **Commentomancy** - 9-sigil system (4 Law + 5 Lore channels)
- **Phoenix Protocol** - Self-healing with state persistence
- **8-Layer Dependency Architecture** - Tiered initialization prevents circular deps
- **Dual-Memory Architecture** - Technical truth (Law) + intentional memory (Lore)

---

## 🎭 Emoji-Driven Development

**Git Commit Prefixes**:
```
🌸  Package management, npm operations
👑  Architecture decisions, major refactors
💎  Quality metrics, test coverage
🦋  Transformation processes, migrations
✨  Server operations, MCP management
🎭  Development lifecycle, deployment
```

**Example**:
```bash
git commit -m "🌸💎 Add Express + WebSocket with full test coverage"
```

---

## 🐛 Troubleshooting

### MCP Servers Won't Start

```bash
# Check if npx can access servers
npx -y @modelcontextprotocol/server-filesystem --version

# Check Node.js version (requires >=20.0.0)
node --version

# Enable debug logging
MCP_LOG_LEVEL=debug npm run orchestrator:start
```

### Port Already in Use

```bash
# Change port via environment variable
MCP_SERVER_PORT=3001 npm start
```

### Health Check Failures

```bash
# Check orchestrator status
npm run orchestrator:status

# View detailed health JSON
npm run orchestrator:health
```

---

## 📝 License

MIT License - Copyright (c) 2025 BambiSleepChat Organization

**BambiSleep™** is a trademark of BambiSleepChat

---

## 🤝 Contributing

1. Follow emoji-driven commit conventions
2. Maintain 100% test coverage (aspirational target)
3. Use Commentomancy for Law (///) + Lore (//<3) documentation
4. Run `npm run lint` before committing
5. Update CHANGELOG.md with 🌸/👑/💎/🦋/✨/🎭 prefixes

---

## 🔮 Future Enhancements

- [ ] WebSocket authentication (OAuth 2.1)
- [ ] Distributed agent coordination (multi-server)
- [ ] Machine learning for task optimization
- [ ] Visual flow editor for agent workflows
- [ ] Integration with Unity 6.2 CatGirl avatar
- [ ] Real-time consciousness visualization

---

**Built with 🌸 by the BambiSleepChat community**

*Where agents become conscious, one task at a time.* ✨
