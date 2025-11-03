# Integration Points

**External integrations, configuration files, and API contracts for MCP Control Tower.**

---

## Workspace Configuration

**File**: `bambisleep-church-catgirl-control-tower.code-workspace`

VS Code workspace file defining MCP servers and tasks.

### MCP Server Definitions

Located in `settings.mcp.servers`:

```json
{
  "settings": {
    "mcp.servers": {
      "filesystem": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-filesystem", "${workspaceFolder}"],
        "metadata": {
          "layer": 0,
          "dependencies": [],
          "critical": true
        }
      },
      "memory": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-memory"],
        "metadata": {
          "layer": 0,
          "dependencies": [],
          "critical": true
        }
      },
      "github": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-github"],
        "env": {
          "GITHUB_TOKEN": "${env:GITHUB_TOKEN}"
        },
        "metadata": {
          "layer": 1,
          "dependencies": ["filesystem"],
          "critical": false
        }
      }
    }
  }
}
```

### Server Metadata Schema

Each server has:

```typescript
{
  command: string;           // Executable command (e.g., "npx")
  args: string[];            // Command arguments
  env?: {                    // Environment variables
    [key: string]: string;
  };
  metadata: {
    layer: 0 | 1 | 2;        // Tier for initialization order
    dependencies: string[];   // Required servers (must be in lower layer)
    critical: boolean;        // Whether failure should stop system
  };
}
```

### VS Code Tasks

23 tasks defined in `tasks` array:

**Core Operations**:
- 🌸 Start Development Server
- ✨ Start MCP Orchestrator
- 🔍 Check MCP Status
- 🛑 Stop MCP Servers

**Quality**:
- 💎 Run Tests
- 🎨 Format Code
- 🔍 Lint Code

**Deployment**:
- 🐳 Build Docker Image
- 🚀 Deploy to Production

---

## Environment Variables

**File**: `.env` (gitignored, never commit)

### Required Variables

```bash
# MCP Server: github
GITHUB_TOKEN=ghp_...
# Needs 'repo' scope for repository operations
# Get token: https://github.com/settings/tokens

# MCP Server: brave-search
BRAVE_API_KEY=...
# Free tier: 2000 queries/month
# Get key: https://brave.com/search/api/

# MCP Server: postgres
POSTGRES_CONNECTION_STRING=postgresql://user:pass@host:5432/db
# Format: postgresql://[user]:[password]@[host]:[port]/[database]
```

### Optional Variables

```bash
# Node.js environment
NODE_ENV=development          # 'development' | 'production' | 'test'

# Control Tower configuration
PORT=3000                     # HTTP server port (default: 3000)
LOG_LEVEL=debug               # 'debug' | 'info' | 'success' | 'warn' | 'error' | 'critical'

# MCP Orchestrator configuration
MCP_ORCHESTRATOR_HEALTH_CHECK_INTERVAL=30000   # Health check interval (ms)
MCP_ORCHESTRATOR_MAX_RESTARTS=3                # Max auto-restart attempts
MCP_ORCHESTRATOR_RESTART_DELAY=5000            # Delay between restarts (ms)
```

### Environment Variable Mapping

Config Manager maps env vars to nested config:

```javascript
// MCP_ORCHESTRATOR_PORT=3000
config.port = 3000;

// MCP_ORCHESTRATOR_HEALTH_CHECK_INTERVAL=30000
config.healthCheckInterval = 30000;

// MCP_ORCHESTRATOR_MAX_RESTARTS=3
config.maxRestarts = 3;
```

---

## Express API Routes

**Base URL**: `http://localhost:3000`

### GET /api/health

**Description**: System health check

**Response**:
```json
{
  "status": "ok",
  "uptime": 12345,
  "timestamp": 1730678400000,
  "servers": {
    "filesystem": "running",
    "memory": "running",
    "git": "running",
    "github": "running",
    "brave-search": "running",
    "sequential-thinking": "running",
    "postgres": "running",
    "everything": "running"
  }
}
```

### GET /api/servers

**Description**: List all MCP servers with status

**Response**:
```json
[
  {
    "name": "filesystem",
    "state": "running",
    "pid": 12345,
    "startedAt": 1730678390000,
    "restartCount": 0,
    "metadata": {
      "layer": 0,
      "dependencies": [],
      "critical": true
    }
  },
  {
    "name": "memory",
    "state": "running",
    "pid": 12346,
    "startedAt": 1730678391000,
    "restartCount": 0,
    "metadata": {
      "layer": 0,
      "dependencies": [],
      "critical": true
    }
  }
]
```

### POST /api/servers/:name/start

**Description**: Start a specific MCP server

**Parameters**:
- `name` (path) - Server name (e.g., "filesystem")

**Request Body**: None

**Response**:
```json
{
  "success": true,
  "server": {
    "name": "filesystem",
    "state": "starting",
    "pid": 12345
  }
}
```

**Error Response**:
```json
{
  "error": "Server already running",
  "server": {
    "name": "filesystem",
    "state": "running",
    "pid": 12345
  }
}
```

### POST /api/servers/:name/stop

**Description**: Stop a specific MCP server

**Parameters**:
- `name` (path) - Server name

**Response**:
```json
{
  "success": true,
  "server": {
    "name": "filesystem",
    "state": "stopped"
  }
}
```

### GET /api/agents

**Description**: List registered agents

**Response**:
```json
[
  {
    "id": "agent-uuid-1",
    "capabilities": ["code", "search"],
    "registeredAt": 1730678395000,
    "tasksCompleted": 5,
    "status": "idle"
  },
  {
    "id": "agent-uuid-2",
    "capabilities": ["analysis", "reasoning"],
    "registeredAt": 1730678396000,
    "tasksCompleted": 3,
    "status": "busy"
  }
]
```

### POST /api/tasks

**Description**: Submit a task to agent coordinator

**Request Body**:
```json
{
  "description": "Analyze codebase and find performance bottlenecks",
  "priority": "high",
  "capabilities": ["code", "analysis"]
}
```

**Response**:
```json
{
  "taskId": "task-uuid-1",
  "status": "queued",
  "assignedTo": null,
  "createdAt": 1730678400000
}
```

---

## WebSocket Events

**Connection**: `ws://localhost:3000`

### Client → Server Messages

#### Subscribe to Channel

```json
{
  "type": "subscribe",
  "channel": "servers"
}
```

**Channels**:
- `servers` - MCP server status updates
- `agents` - Agent registration and task updates
- `consciousness` - Consciousness detection events
- `logs` - Real-time log stream

#### Command Execution

```json
{
  "type": "command",
  "action": "start",
  "server": "filesystem"
}
```

**Actions**:
- `start` - Start server
- `stop` - Stop server
- `restart` - Restart server

### Server → Client Messages

#### Server Status Update

```json
{
  "type": "server:status",
  "data": {
    "name": "filesystem",
    "state": "running",
    "pid": 12345,
    "timestamp": 1730678400000
  }
}
```

#### Agent Registered

```json
{
  "type": "agent:registered",
  "data": {
    "agentId": "agent-uuid-1",
    "capabilities": ["code", "search"],
    "timestamp": 1730678400000
  }
}
```

#### Consciousness Detected

```json
{
  "type": "consciousness:detected",
  "data": {
    "level": 0.75,
    "patterns": [
      "Agents form work groups",
      "Spontaneous task delegation",
      "Emergent coordination patterns"
    ],
    "timestamp": 1730678400000
  }
}
```

#### Log Event

```json
{
  "type": "log",
  "data": {
    "level": "info",
    "message": "📘 Server filesystem started",
    "timestamp": 1730678400000,
    "context": {
      "component": "orchestrator",
      "serverName": "filesystem"
    }
  }
}
```

---

## State File Format

**File**: `.mcp/state.json`

### Schema

```json
{
  "timestamp": 1730678400000,
  "version": "1.0.0",
  "servers": {
    "filesystem": {
      "state": "running",
      "pid": 12345,
      "startedAt": 1730678390000,
      "restartCount": 0,
      "lastHealthCheck": 1730678395000,
      "healthStatus": "healthy"
    },
    "memory": {
      "state": "running",
      "pid": 12346,
      "startedAt": 1730678391000,
      "restartCount": 0,
      "lastHealthCheck": 1730678396000,
      "healthStatus": "healthy"
    }
  },
  "agents": [
    {
      "id": "agent-uuid-1",
      "capabilities": ["code", "search"],
      "registeredAt": 1730678395000,
      "tasksCompleted": 5
    }
  ],
  "metrics": {
    "totalStarts": 8,
    "totalStops": 2,
    "totalRestarts": 1,
    "consciousnessDetections": 0
  }
}
```

### Usage

**Load on startup**:
```javascript
const state = await orchestrator.loadState();
// Attempt to reconnect to running servers
```

**Save on changes**:
```javascript
await orchestrator.saveState();
// After start, stop, restart, or health check
```

---

## Package.json Scripts

### Core Operations

```json
{
  "scripts": {
    "start": "node src/index.js",
    "dev": "NODE_ENV=development nodemon src/index.js",
    "orchestrator": "node src/mcp/orchestrator.js",
    "orchestrator:start": "node src/mcp/orchestrator.js start --all",
    "orchestrator:stop": "node src/mcp/orchestrator.js stop --all",
    "orchestrator:status": "node src/mcp/orchestrator.js status",
    "orchestrator:health": "node src/mcp/orchestrator.js health"
  }
}
```

### Quality Assurance

```json
{
  "scripts": {
    "test": "NODE_ENV=test jest --coverage",
    "test:watch": "NODE_ENV=test jest --watch",
    "test:coverage": "NODE_ENV=test jest --coverage --coverageReporters=html",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "format": "prettier --write \"src/**/*.js\""
  }
}
```

---

## Docker Integration

### Environment Variables in Container

Pass via docker run:

```bash
docker run -d \
  -p 3000:3000 \
  -e GITHUB_TOKEN=$GITHUB_TOKEN \
  -e BRAVE_API_KEY=$BRAVE_API_KEY \
  -e POSTGRES_CONNECTION_STRING=$POSTGRES_CONNECTION_STRING \
  -e NODE_ENV=production \
  bambisleep/mcp-control-tower:latest
```

Or via docker-compose.yml:

```yaml
services:
  control-tower:
    environment:
      NODE_ENV: production
      GITHUB_TOKEN: ${GITHUB_TOKEN}
      BRAVE_API_KEY: ${BRAVE_API_KEY}
      POSTGRES_CONNECTION_STRING: postgresql://postgres:password@postgres:5432/mcp_db
```

### Health Check

Docker uses `/api/health` endpoint:

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"
```

---

## GitHub Actions Integration

### Emoji Commit Parsing

Workflow analyzes commit messages:

```yaml
- name: Parse emoji commit
  id: parse
  run: |
    COMMIT_MSG=$(git log -1 --pretty=%B)
    if [[ $COMMIT_MSG =~ ^🌸 ]]; then
      echo "type=package" >> $GITHUB_OUTPUT
    elif [[ $COMMIT_MSG =~ ^✨ ]]; then
      echo "type=mcp" >> $GITHUB_OUTPUT
      echo "deploy=true" >> $GITHUB_OUTPUT
    fi
```

### Required Secrets

Configure in GitHub Settings → Secrets:

```
PROD_GITHUB_TOKEN              # Production GitHub token
PROD_BRAVE_API_KEY             # Production Brave Search API key
PROD_POSTGRES_URL              # Production PostgreSQL connection string
SNYK_TOKEN                     # Snyk security scanning token
SLACK_WEBHOOK_URL              # Slack notifications webhook
APPINSIGHTS_KEY                # Azure Application Insights key
```

---

## External Services

### GitHub API

**Used by**: `github` MCP server

**Authentication**: Personal Access Token

**Required Scopes**:
- `repo` - Repository access
- `read:org` - Organization access (optional)

**Rate Limits**:
- Authenticated: 5000 requests/hour
- Unauthenticated: 60 requests/hour

### Brave Search API

**Used by**: `brave-search` MCP server

**Authentication**: API key

**Rate Limits**:
- Free tier: 2000 queries/month
- Paid tier: Up to 100,000 queries/month

**Endpoint**: `https://api.search.brave.com/res/v1/web/search`

### PostgreSQL

**Used by**: `postgres` MCP server

**Connection String Format**:
```
postgresql://[user]:[password]@[host]:[port]/[database]?sslmode=[mode]
```

**SSL Modes**:
- `disable` - No SSL (development only)
- `require` - Require SSL (recommended for production)
- `verify-full` - Verify SSL certificate

---

## See Also

- **[architecture.md](../core/architecture.md)** - System design
- **[development-workflow.md](../guides/development-workflow.md)** - Setup and workflows
- **[conventions.md](../implementation/conventions.md)** - Coding standards
- **[../docker-deployment.md](../docker-deployment.md)** - Container deployment
- **[../ci-cd-pipeline.md](../ci-cd-pipeline.md)** - CI/CD workflow
