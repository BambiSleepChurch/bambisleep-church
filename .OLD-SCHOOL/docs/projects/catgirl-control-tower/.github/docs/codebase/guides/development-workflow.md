# Development Workflow

**Daily workflows, setup, and tooling for MCP Control Tower development.**

---

## Environment Requirements

- **Node.js**: >=20.0.0
- **npm**: >=10.0.0
- **VS Code**: Latest with MCP extension
- **Git**: >=2.40.0
- **OS**: Linux, macOS, or WSL2 on Windows

---

## Initial Setup

### 1. Clone Repository

```bash
git clone https://github.com/BambiSleepChat/bambisleep-church.git
cd bambisleep-church-catgirl-control-tower
```

### 2. Install Dependencies

```bash
npm install
```

This installs:
- `express` (4.18.2) - HTTP server
- `ws` (8.14.2) - WebSocket server
- `uuid` (9.0.1) - Agent ID generation
- Jest, ESLint, Prettier - Development tools

### 3. Configure Environment

Create `.env` file in workspace root:

```bash
# Required for MCP servers
GITHUB_TOKEN=ghp_...                    # GitHub API access (github server)
BRAVE_API_KEY=...                       # Brave Search API (brave-search server)
POSTGRES_CONNECTION_STRING=postgresql://user:pass@host:5432/db  # PostgreSQL (postgres server)

# Optional
NODE_ENV=development                    # Environment mode
PORT=3000                              # Control Tower port (default: 3000)
LOG_LEVEL=debug                        # Logging verbosity
```

**Get API Keys**:
- GitHub: https://github.com/settings/tokens (needs `repo` scope)
- Brave Search: https://brave.com/search/api/ (free tier: 2000 queries/month)

### 4. Verify Setup

```bash
./verify-setup.sh
```

Should output:
```
✅ Node.js version OK (v20.x.x)
✅ npm version OK (10.x.x)
✅ .env file exists
✅ Dependencies installed
✅ VS Code workspace detected
```

---

## npm Scripts

### Core Operations

```bash
npm start                              # Start Control Tower (production mode)
npm run dev                            # Start Control Tower (development mode)
npm run orchestrator                   # Direct CLI access to orchestrator
npm run orchestrator:start             # Start all MCP servers (tiered)
npm run orchestrator:stop              # Stop all MCP servers
npm run orchestrator:status            # Show server status
npm run orchestrator:health            # Run health checks
```

### Quality Assurance

```bash
npm test                               # Run tests once
npm run test:watch                     # Run tests in watch mode
npm run test:coverage                  # Generate coverage report
npm run lint                           # Check code style
npm run lint:fix                       # Fix code style issues
npm run format                         # Format code with Prettier
```

---

## VS Code Integration

### Tasks

Use `Cmd/Ctrl+Shift+P` → "Run Task" to access:

- 🌸 **Start Development Server** - Launches Control Tower in dev mode
- ✨ **Start MCP Orchestrator** - Starts all MCP servers
- 🔍 **Check MCP Status** - Shows running servers
- 💎 **Run Tests** - Executes Jest test suite
- 🎨 **Format Code** - Runs Prettier on all files

### Debug Configurations

Use `F5` or Debug panel:

**Configurations** (create `.vscode/launch.json`):
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "🌸 Debug Control Tower",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/index.js",
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "✨ Debug Orchestrator",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/mcp/orchestrator.js",
      "args": ["start", "--all", "--debug"],
      "console": "integratedTerminal"
    },
    {
      "name": "💎 Debug Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand", "--no-cache"],
      "console": "integratedTerminal"
    }
  ]
}
```

### Recommended Extensions

**Required**:
- **GitHub Copilot** - AI code completion
- **MCP Extension** - Model Context Protocol support
- **ESLint** - Linting with project config

**Recommended**:
- **Error Lens** - Inline error highlighting
- **Better Comments** - Commentomancy syntax highlighting
- **REST Client** - Test API endpoints from `.http` files
- **Docker** - Container management
- **GitLens** - Enhanced Git integration

### Code Snippets

Create `.vscode/snippets.code-snippets`:

```json
{
  "Commentomancy Law": {
    "prefix": "law",
    "body": ["/// Law: $1"],
    "description": "Sacred truth comment"
  },
  "Commentomancy Lore": {
    "prefix": "lore",
    "body": ["//<3 Lore: $1"],
    "description": "Emotional context comment"
  },
  "Event Emitter Pattern": {
    "prefix": "emit",
    "body": [
      "this.emit('${1:event-name}', {",
      "  $2",
      "});"
    ],
    "description": "Emit event with data"
  },
  "Async Error Handler": {
    "prefix": "async-try",
    "body": [
      "try {",
      "  $1",
      "} catch (error) {",
      "  this.log('error', '❌ ${2:Context}:', error);",
      "  this.emit('error', { context: '${2:Context}', error });",
      "}"
    ],
    "description": "Async try-catch with logging"
  }
}
```

---

## Direct CLI Usage

Bypass npm for debugging:

### Orchestrator Commands

```bash
# Start single server
node src/mcp/orchestrator.js start filesystem

# Start with debug output
node src/mcp/orchestrator.js start filesystem --debug

# Start all servers
node src/mcp/orchestrator.js start --all

# Stop server
node src/mcp/orchestrator.js stop filesystem

# Stop all servers
node src/mcp/orchestrator.js stop --all

# Show status
node src/mcp/orchestrator.js status

# Run health check
node src/mcp/orchestrator.js health

# Health check with JSON output
node src/mcp/orchestrator.js health --json
```

### Control Tower Server

```bash
# Start with default port (3000)
node src/index.js

# Start with custom port
PORT=8080 node src/index.js

# Start with debug logging
LOG_LEVEL=debug node src/index.js

# Start with Node.js inspector
node --inspect src/index.js
# Then open chrome://inspect in Chrome
```

---

## Daily Development Workflow

### 1. Start Services

```bash
# Terminal 1: Start Control Tower
npm run dev

# Terminal 2: Start MCP servers
npm run orchestrator:start

# Terminal 3: Watch tests (optional)
npm run test:watch
```

### 2. Verify Running

Open browser to http://localhost:3000/api/health

Should return:
```json
{
  "status": "ok",
  "uptime": 12345,
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

### 3. Make Changes

1. Edit source files in `src/`
2. Control Tower auto-restarts (nodemon in dev mode)
3. Run `npm run lint` to check style
4. Run `npm test` to verify tests pass

### 4. Commit Changes

Use emoji commit prefixes (see [conventions.md](conventions.md#emoji-commit-prefixes)):

```bash
# Package management
git commit -m "🌸 Add dotenv package for env var loading"

# Architecture changes
git commit -m "👑 Refactor orchestrator to use async/await"

# Test improvements
git commit -m "💎 Add integration tests for Control Tower"

# MCP operations
git commit -m "✨ Add auto-restart for crashed servers"

# Security fixes
git commit -m "🛡️ Add JWT authentication middleware"

# CI/CD updates
git commit -m "🎭 Add GitHub Actions workflow for deployment"
```

### 5. Stop Services

```bash
# Stop Control Tower
Ctrl+C in Terminal 1

# Stop MCP servers
npm run orchestrator:stop
# or Ctrl+C in Terminal 2
```

---

## Hot Reload Development

### Control Tower

Uses `nodemon` in dev mode:

```bash
npm run dev
# Watches src/**/*.js and auto-restarts on changes
```

Configuration in `package.json`:
```json
{
  "scripts": {
    "dev": "NODE_ENV=development nodemon src/index.js"
  },
  "nodemonConfig": {
    "watch": ["src"],
    "ext": "js,json",
    "ignore": [".mcp/*"],
    "delay": 1000
  }
}
```

### MCP Servers

⚠️ **No hot reload** - must manually restart after changes:

```bash
npm run orchestrator:restart <server-name>
# or
node src/mcp/orchestrator.js restart filesystem
```

### Dashboard UI

Static files served from `public/` - no build step needed:

1. Edit files in `public/`
2. Refresh browser (Ctrl+R)
3. No restart required

---

## Testing Workflow

### Test-Driven Development (TDD)

```bash
# Terminal 1: Watch mode
npm run test:watch

# Terminal 2: Development
# Edit test first
vim src/mcp/orchestrator.test.js

# Run test (fails - red)
# Implement feature
vim src/mcp/orchestrator.js

# Run test (passes - green)
# Refactor code
# Run test (still passes - green)
```

### Coverage Reports

```bash
npm run test:coverage

# Opens HTML report
open coverage/lcov-report/index.html
```

Target coverage:
- Statements: 100%
- Branches: 90%+
- Functions: 100%
- Lines: 100%

See [../testing-guide.md](../testing-guide.md) for patterns.

---

## Debugging Tips

### Enable Debug Logging

```bash
LOG_LEVEL=debug npm run dev
```

### Inspect Node.js Process

```bash
node --inspect src/index.js

# Open Chrome to chrome://inspect
# Click "Open dedicated DevTools for Node"
```

### View Logs

```bash
# Watch orchestrator logs
tail -f .mcp/logs/orchestrator.log

# Search logs
grep "ERROR" .mcp/logs/orchestrator.log

# View last 100 lines
tail -n 100 .mcp/logs/orchestrator.log
```

### Check Server Processes

```bash
# List all MCP server processes
ps aux | grep mcp

# Check specific server
ps aux | grep filesystem

# Kill zombie process
kill -9 <PID>
```

---

## Performance Profiling

### Heap Snapshots

```bash
node --inspect --inspect-brk src/index.js

# In Chrome DevTools:
# 1. Memory tab
# 2. Take Heap Snapshot
# 3. Perform actions
# 4. Take another snapshot
# 5. Compare to find leaks
```

### CPU Profiling

```bash
# Using clinic.js
npm install -g clinic
clinic doctor -- node src/index.js

# Opens HTML report with flamegraphs
```

### Memory Monitoring

Add to `src/index.js`:
```javascript
setInterval(() => {
  const usage = process.memoryUsage();
  logger.debug('Memory:', {
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)} MB`,
    rss: `${Math.round(usage.rss / 1024 / 1024)} MB`
  });
}, 60000); // Every minute
```

---

## See Also

- **[architecture.md](../core/architecture.md)** - System design and components
- **[patterns.md](../implementation/patterns.md)** - Implementation patterns
- **[conventions.md](../implementation/conventions.md)** - Coding standards
- **[../testing-guide.md](../testing-guide.md)** - Test patterns
- **[../debugging-guide.md](../debugging-guide.md)** - Troubleshooting
