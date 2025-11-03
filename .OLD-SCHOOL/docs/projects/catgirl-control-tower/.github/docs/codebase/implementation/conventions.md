# Project Conventions

**Coding standards, naming conventions, and best practices for MCP Control Tower.**

---

## File Organization

### Directory Structure

```
src/
├── index.js                 # Application entry point (never import this)
├── mcp/                     # MCP server management logic
│   ├── orchestrator.js     # Server lifecycle management
│   └── agent-coordinator.js # Multi-agent task distribution
└── utils/                   # Pure utilities (no side effects on import)
    ├── logger.js           # Structured logging
    └── config.js           # Configuration management

.mcp/                        # Runtime state (gitignored)
├── logs/                    # Log files
│   └── orchestrator.log
├── state.json               # Persisted server state
└── cache/                   # Temporary cache files

public/                      # Static files (served by Express)
├── index.html               # Dashboard UI
├── css/                     # Stylesheets
├── js/                      # Client-side JavaScript
└── docs/                    # API documentation

.github/                     # GitHub-specific files
├── copilot-instructions.md  # AI agent quick reference
├── workflows/               # GitHub Actions CI/CD
└── docs/                    # Comprehensive documentation
    ├── codebase/            # Codebase documentation
    ├── testing-guide.md     # Test patterns
    ├── dashboard-ui.md      # Frontend guide
    ├── docker-deployment.md # Container deployment
    ├── ci-cd-pipeline.md    # CI/CD workflow
    ├── debugging-guide.md   # Troubleshooting
    └── advanced-patterns.md # Production patterns
```

### File Naming

- **Source files**: `kebab-case.js` (e.g., `agent-coordinator.js`)
- **Test files**: `kebab-case.test.js` (e.g., `orchestrator.test.js`)
- **Documentation**: `kebab-case.md` (e.g., `development-workflow.md`)
- **Configuration**: `kebab-case.json` or `.lowercase` (e.g., `.eslintrc.json`, `.env`)

---

## Naming Conventions

### Classes

**PascalCase** for class names:

```javascript
class MCPOrchestrator extends EventEmitter { }
class AgentCoordinator extends EventEmitter { }
class ConfigManager extends EventEmitter { }
class Logger extends EventEmitter { }
```

### Constants

**UPPER_SNAKE_CASE** for constants:

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

/// Law: Server tiers define initialization order
const SERVER_TIERS = {
  LAYER_0: ['filesystem', 'memory'],
  LAYER_1: ['git', 'github', 'brave-search'],
  LAYER_2: ['sequential-thinking', 'postgres', 'everything']
};

/// Law: Log levels
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  SUCCESS: 2,
  WARN: 3,
  ERROR: 4,
  CRITICAL: 5
};
```

### Private Methods

**Prefix with underscore** for private methods:

```javascript
class MCPOrchestrator extends EventEmitter {
  // Public API
  async start(serverName) {
    return this._startServer(serverName);
  }
  
  // Private implementation
  async _startServer(serverName) {
    const config = this._getServerConfig(serverName);
    const process = this._spawnProcess(config);
    return process.pid;
  }
  
  _getServerConfig(serverName) {
    // ...
  }
  
  _spawnProcess(config) {
    // ...
  }
}
```

### Config Keys

**camelCase** for configuration keys:

```javascript
const DEFAULT_CONFIG = {
  workspaceRoot: process.cwd(),
  healthCheckInterval: 30000,
  maxRestarts: 3,
  restartDelay: 5000,
  stateFile: '.mcp/state.json',
  logLevel: 'info',
  autoStart: []
};
```

### Variables

**camelCase** for variables and function names:

```javascript
const serverName = 'filesystem';
const healthCheckInterval = 30000;
const restartCount = 0;

function calculateUptime(startTime) {
  return Date.now() - startTime;
}

async function checkServerHealth(serverName) {
  // ...
}
```

---

## Logging Standards

### Use Logger, Not console.log

❌ **Never use `console.log` in production code:**
```javascript
console.log('Server started');  // ❌ Bad
```

✅ **Always use Logger:**
```javascript
logger.info('Server started');  // ✅ Good
```

### Log Levels

Use appropriate log levels:

```javascript
logger.debug('🔍 Detailed debugging info');     // Development only
logger.info('📘 General information');          // Normal operation
logger.success('✅ Operation succeeded');       // Success confirmation
logger.warn('⚠️ Warning, non-fatal issue');    // Potential problems
logger.error('❌ Error occurred');              // Recoverable errors
logger.critical('🔥 Critical failure');         // Unrecoverable errors
```

### Log Context

Always include relevant context:

❌ **Bad** (no context):
```javascript
logger.error('Failed to start');
```

✅ **Good** (with context):
```javascript
logger.error(`❌ Failed to start server ${serverName}:`, error);
```

### Emoji Markers

Logger automatically adds emojis based on level:

```javascript
// These are equivalent:
logger.info('Server started');
// Output: 📘 Server started

logger.error('Server crashed');
// Output: ❌ Server crashed
```

---

## Error Handling

### Always Emit Events for Errors

Use event emission for error propagation:

```javascript
try {
  await this._startServer(serverName);
} catch (error) {
  this.log('error', `❌ Failed to start ${serverName}:`, error);
  this.emit('error', {
    context: 'startServer',
    serverName,
    error
  });
  throw error; // Re-throw if caller should handle
}
```

### Use Try/Catch with Context

Always provide context in catch blocks:

```javascript
async start(serverName) {
  try {
    const config = this._getServerConfig(serverName);
    const process = await this._spawnProcess(config);
    return process.pid;
  } catch (error) {
    this.log('error', `❌ Failed to start ${serverName}:`, error);
    throw new Error(`Failed to start server ${serverName}: ${error.message}`);
  }
}
```

### Never Throw from EventEmitter Callbacks

❌ **Bad** (throws from listener):
```javascript
orchestrator.on('server:started', (data) => {
  throw new Error('Boom!'); // Crashes entire app
});
```

✅ **Good** (emit error event):
```javascript
orchestrator.on('server:started', (data) => {
  try {
    // ... processing
  } catch (error) {
    orchestrator.emit('error', { context: 'server:started', error });
  }
});
```

---

## Code Style

### ESLint Configuration

Project uses ESLint with standard rules:

```javascript
{
  "extends": "eslint:recommended",
  "env": {
    "node": true,
    "es2022": true
  },
  "rules": {
    "indent": ["error", 2],
    "quotes": ["error", "single"],
    "semi": ["error", "always"],
    "no-console": "warn",
    "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
  }
}
```

### Formatting with Prettier

Automatically format code:

```bash
npm run format
```

Configuration in `package.json`:
```json
{
  "prettier": {
    "singleQuote": true,
    "trailingComma": "none",
    "printWidth": 100,
    "tabWidth": 2
  }
}
```

### Import Order

Organize imports in logical groups:

```javascript
// 1. Node.js built-ins
const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');

// 2. External dependencies
const express = require('express');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

// 3. Internal modules
const MCPOrchestrator = require('./mcp/orchestrator');
const AgentCoordinator = require('./mcp/agent-coordinator');
const Logger = require('./utils/logger');
const ConfigManager = require('./utils/config');
```

---

## Testing Standards

### Test File Location

Place test files alongside source files:

```
src/
├── index.js
├── index.test.js              ← Test for index.js
├── mcp/
│   ├── orchestrator.js
│   ├── orchestrator.test.js   ← Test for orchestrator.js
│   ├── agent-coordinator.js
│   └── agent-coordinator.test.js
└── utils/
    ├── logger.js
    ├── logger.test.js
    ├── config.js
    └── config.test.js
```

### Test Naming

Use descriptive test names:

```javascript
describe('MCPOrchestrator', () => {
  describe('start()', () => {
    it('should start a server and emit server-started event', async () => {
      // ...
    });
    
    it('should throw error if server already running', async () => {
      // ...
    });
    
    it('should respect tiered initialization order', async () => {
      // ...
    });
  });
});
```

See [../testing-guide.md](../testing-guide.md) for detailed patterns.

---

## Emoji Commit Prefixes

Use machine-readable emoji prefixes for commits:

```bash
# Package management, dependency updates
git commit -m "🌸 Add uuid package for agent coordination"

# Architecture, major refactors
git commit -m "👑 Refactor orchestrator to use async/await"

# Test coverage improvements
git commit -m "💎 Add integration tests for Control Tower"

# Transformations, migrations
git commit -m "🦋 Migrate logger to TypeScript"

# MCP server operations
git commit -m "✨ Add auto-restart for crashed servers"

# Security enhancements
git commit -m "🛡️ Add JWT authentication middleware"

# CI/CD pipeline changes
git commit -m "🎭 Add GitHub Actions workflow for deployment"
```

**Full List**:
- `🌸` Package management, dependency updates
- `👑` Architecture, major refactors
- `💎` Test coverage improvements, quality metrics
- `🦋` Transformations, migrations
- `✨` MCP server operations, orchestration changes
- `🛡️` Security enhancements, vulnerability fixes
- `🎭` CI/CD pipeline, deployment automation

**Why Emoji Prefixes?**
- Machine-parseable by CI/CD (see [../ci-cd-pipeline.md](../ci-cd-pipeline.md))
- Visual scanning in git log
- Consistency with logger emoji markers
- BambiSleep™ Church aesthetic

---

## Documentation Standards

### Use Commentomancy

See [commentomancy.md](../core/commentomancy.md) for full details.

**Quick reference**:
```javascript
/// Law: Technical truth that never changes
//<3 Lore: Emotional context explaining WHY
//! Ritual: Precondition enforced by MCP
//!? Guardrail: Ethics gate requiring approval
//-> Strategy: Architectural Decision Record
//* Emergence: Revelation surfaced to Knowledge Graph
//~ Self-mod: Recursive awareness
//+ Evolution: Performance optimization target
// Regular comment - local only
```

### Markdown Documentation

- Use `kebab-case.md` for filenames
- Include table of contents for files >300 lines
- Cross-reference related docs with relative links
- Use code blocks with language specifiers
- Include examples, not just theory

---

## Security Practices

### Never Commit Secrets

❌ **Never commit**:
- API keys, tokens
- Passwords, connection strings
- `.env` files
- Private keys

✅ **Use environment variables**:
```javascript
// In code
const githubToken = process.env.GITHUB_TOKEN;

// In .env (gitignored)
GITHUB_TOKEN=ghp_...
```

### Guardrail Markers

Use `//!?` before security-critical operations:

```javascript
//!? Guardrail: Destructive operation requires config flag
async deleteAllData() {
  if (!this.config.allowDestructiveOps) {
    throw new Error('Guardrail: Destructive ops disabled');
  }
  // ...
}
```

---

## See Also

- **[architecture.md](../core/architecture.md)** - System design
- **[commentomancy.md](../core/commentomancy.md)** - Documentation system
- **[patterns.md](patterns.md)** - Implementation patterns
- **[development-workflow.md](../guides/development-workflow.md)** - Daily workflows
- **[../testing-guide.md](../testing-guide.md)** - Test patterns
