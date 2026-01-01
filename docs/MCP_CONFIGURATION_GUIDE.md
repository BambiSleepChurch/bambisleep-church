# MCP Server Configuration Guide

> BambiSleep™ Church MCP Control Tower - Configuration Reference

## Overview

MCP (Model Context Protocol) servers are configured in `.vscode/settings.json` using the JSONC format (JSON with comments). The control tower loads these configurations at startup and manages server lifecycle automatically.

## Configuration Structure

```json
{
  "mcp.servers": {
    "server-name": {
      "command": "executable",
      "args": ["arg1", "arg2"],
      "env": {
        "ENV_VAR": "value"
      }
    }
  }
}
```

## Supported MCP Servers

### 1. Memory MCP Server

Knowledge graph storage with entities and relations.

```json
{
  "memory": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-memory"]
  }
}
```

**Environment Variables:**
- None required (uses in-memory storage)

**API Endpoints:**
- `GET /api/memory` - Read entire graph
- `POST /api/memory/entities` - Create entities
- `DELETE /api/memory/entities` - Delete entities
- `POST /api/memory/relations` - Create relations
- `GET /api/memory/search?q=` - Search nodes

---

### 2. GitHub MCP Server

GitHub repository operations.

```json
{
  "github": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-github"],
    "env": {
      "GITHUB_PERSONAL_ACCESS_TOKEN": "${env:GITHUB_TOKEN}"
    }
  }
}
```

**Environment Variables:**
- `GITHUB_TOKEN` - Personal access token with repo scope

**API Endpoints:**
- `GET /api/github/user` - Authenticated user
- `GET /api/github/repos` - List repositories
- `GET /api/github/search/repos?q=` - Search repos

---

### 3. HuggingFace MCP Server

ML model inference and hub access.

```json
{
  "huggingface": {
    "command": "npx",
    "args": ["-y", "@anthropics/server-huggingface"],
    "env": {
      "HF_TOKEN": "${env:HUGGINGFACE_TOKEN}"
    }
  }
}
```

**Environment Variables:**
- `HUGGINGFACE_TOKEN` - HuggingFace API token

**API Endpoints:**
- `GET /api/huggingface/models?q=` - Search models
- `GET /api/huggingface/datasets?q=` - Search datasets
- `POST /api/huggingface/inference` - Run inference

---

### 4. Stripe MCP Server

Payment processing and subscription management.

```json
{
  "stripe": {
    "command": "npx",
    "args": ["-y", "@stripe/agent-toolkit"],
    "env": {
      "STRIPE_SECRET_KEY": "${env:STRIPE_API_KEY}"
    }
  }
}
```

**Environment Variables:**
- `STRIPE_API_KEY` - Stripe secret key (sk_live_* or sk_test_*)

**API Endpoints:**
- `GET /api/stripe/customers` - List customers
- `POST /api/stripe/customers` - Create customer
- `GET /api/stripe/products` - List products
- `GET /api/stripe/balance` - Account balance
- `GET /api/stripe/subscriptions` - List subscriptions

---

### 5. MongoDB MCP Server

Document database operations.

```json
{
  "mongodb": {
    "command": "npx",
    "args": ["-y", "@anthropics/server-mongodb"],
    "env": {
      "MONGODB_URI": "${env:MONGODB_URI}"
    }
  }
}
```

**Environment Variables:**
- `MONGODB_URI` - MongoDB connection string (local or Atlas)

**API Endpoints:**
- `POST /api/mongodb/connect` - Connect to database
- `GET /api/mongodb/collections` - List collections
- `GET /api/mongodb/:db/:collection` - Query documents
- `POST /api/mongodb/:db/:collection` - Insert document
- `POST /api/mongodb/:db/:collection/aggregate` - Aggregation pipeline

---

### 6. SQLite MCP Server

Local SQL database.

```json
{
  "sqlite": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-sqlite", "./data/mcp.db"]
  }
}
```

**Environment Variables:**
- None (database path in args)

**API Endpoints:**
- `POST /api/sqlite/query` - Execute SQL
- `GET /api/sqlite/tables` - List tables
- `GET /api/sqlite/stats` - Database stats

---

### 7. Puppeteer MCP Server

Browser automation.

```json
{
  "puppeteer": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
  }
}
```

**Environment Variables:**
- None (uses bundled Chromium)

**API Endpoints:**
- `GET /api/puppeteer/status` - Browser status
- `POST /api/puppeteer/launch` - Launch browser
- `POST /api/puppeteer/navigate` - Navigate to URL
- `POST /api/puppeteer/screenshot` - Take screenshot
- `POST /api/puppeteer/close` - Close browser

---

### 8. Fetch MCP Server

HTTP request utilities.

```json
{
  "fetch": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-fetch"]
  }
}
```

**Environment Variables:**
- None

**API Endpoints:**
- `POST /api/fetch/url` - Fetch URL content
- `POST /api/fetch/post` - POST request
- `GET /api/fetch/ping?url=` - Ping URL

---

### 9. Sequential Thinking MCP Server

Multi-step reasoning chains.

```json
{
  "sequential-thinking": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
  }
}
```

**Environment Variables:**
- None

**API Endpoints:**
- `POST /api/thinking/think` - Record thought
- `GET /api/thinking/sessions` - List sessions
- `GET /api/thinking/session/:id` - Get session
- `POST /api/thinking/conclude` - Conclude session
- `GET /api/thinking/stats` - Session stats

---

## Integrated Handlers (No External Process)

These handlers don't require external MCP server processes:

### Storage Handler
Local file storage for images and videos.

```bash
STORAGE_DIR=./data/storage  # Default
```

**API Endpoints:**
- `GET /api/storage/files` - List files
- `POST /api/storage/upload` - Upload file
- `GET /api/storage/files/:type/:filename` - Download file
- `GET /api/storage/stats` - Storage stats

### Clarity Handler
Microsoft Clarity analytics integration.

```bash
CLARITY_PROJECT_ID=utux7nv0pm  # Default
```

**API Endpoints:**
- `POST /api/clarity/init` - Initialize
- `POST /api/clarity/track/pageview` - Track page
- `POST /api/clarity/track/event` - Track event
- `GET /api/clarity/events` - Event history
- `GET /api/clarity/stats` - Analytics stats

### LM Studio Handler
Local LLM integration via LM Studio.

```bash
LMSTUDIO_HOST=localhost
LMSTUDIO_PORT=1234
LMSTUDIO_BASE_URL=http://localhost:1234
```

**API Endpoints:**
- `GET /api/lmstudio/health` - Connection test
- `GET /api/lmstudio/models` - List models
- `POST /api/lmstudio/chat` - Chat completion
- `POST /api/lmstudio/embed` - Generate embeddings
- `POST /api/lmstudio/chat/image` - Vision chat

### Agent Handler
Orchestrates all MCP servers with 98 tools.

**API Endpoints:**
- `POST /api/agent/chat` - Send message
- `GET /api/agent/tools` - List tools
- `POST /api/agent/tools/execute` - Execute tool
- `GET /api/agent/personality` - Get personality

### Patreon Handler
Patreon creator platform integration.

```bash
PATREON_CLIENT_ID=your_client_id
PATREON_CLIENT_SECRET=your_client_secret
PATREON_ACCESS_TOKEN=your_access_token
```

**API Endpoints:**
- `GET /api/patreon/identity` - Creator identity
- `GET /api/patreon/campaigns` - List campaigns
- `GET /api/patreon/members` - List members
- `GET /redirect/patreon` - OAuth callback

---

## Environment Variables Reference

Create a `.env` file in the project root:

```bash
# Server Configuration
NODE_ENV=development
API_PORT=8080
API_HOST=0.0.0.0
DASHBOARD_PORT=3000
DASHBOARD_HOST=0.0.0.0

# Logging
LOG_LEVEL=info
LOG_TO_FILE=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# MCP Server Tokens
GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
HUGGINGFACE_TOKEN=hf_xxxxxxxxxxxxx
STRIPE_API_KEY=sk_test_xxxxxxxxxxxxx

# Database
MONGODB_URI=mongodb://localhost:27017/bambisleep

# Storage
STORAGE_DIR=./data/storage

# LM Studio
LMSTUDIO_HOST=localhost
LMSTUDIO_PORT=1234

# Patreon
PATREON_CLIENT_ID=xxxxxxxxxxxxx
PATREON_CLIENT_SECRET=xxxxxxxxxxxxx
PATREON_ACCESS_TOKEN=xxxxxxxxxxxxx

# Clarity
CLARITY_PROJECT_ID=utux7nv0pm
```

---

## Adding a New MCP Server

1. **Create handler file**: `src/servers/{name}.js`

```javascript
/**
 * BambiSleep™ Church MCP Control Tower
 * {Name} MCP Server Handler
 */

import { createLogger } from '../utils/logger.js';

const logger = createLogger('{name}');

export const {name}Handlers = {
  async someMethod(args) {
    logger.info('Method called', { args });
    // Implementation
    return { success: true };
  },
};
```

2. **Add routes**: Edit `src/api/routes.js`

```javascript
// ============ {NAME} MCP ROUTES ============

if (path === '/api/{name}/method' && method === 'GET') {
  const result = await {name}Handlers.someMethod();
  return json(res, result);
}
```

3. **Configure MCP server**: Edit `.vscode/settings.json`

```json
{
  "mcp.servers": {
    "{name}": {
      "command": "npx",
      "args": ["-y", "@scope/server-{name}"],
      "env": {}
    }
  }
}
```

4. **Add to registry**: Edit `src/servers/index.js` if needed

5. **Create reference docs**: `docs/{NAME}_MCP_REFERENCE.md`

---

## Troubleshooting

### Server Won't Start

1. Check if the npm package exists:
   ```bash
   npx -y @modelcontextprotocol/server-{name} --help
   ```

2. Verify environment variables are set:
   ```bash
   echo $GITHUB_TOKEN
   ```

3. Check logs:
   ```bash
   tail -f logs/mcp-tower-*.log
   ```

### Connection Refused

- Ensure the port isn't in use
- Check firewall settings
- Verify the server is actually running

### Authentication Errors

- Verify tokens are valid and not expired
- Check token scopes/permissions
- Test with curl directly

---

## Resources

- [MCP Specification](https://modelcontextprotocol.io/)
- [MCP Server List](https://github.com/modelcontextprotocol/servers)
- [BambiSleep Church API Docs](/docs)
