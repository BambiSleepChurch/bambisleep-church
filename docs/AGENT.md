# 🌸 BambiSleep™ Church Agent Documentation

> **Agentic AI Integration Guide for MCP Control Tower**

This document provides comprehensive documentation for integrating with the BambiSleep Church agent ecosystem, including MCP server configurations, API specifications, and external agent integration patterns.

---

## 📚 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [MCP Server Configurations](#mcp-server-configurations)
3. [Agent API Reference](#agent-api-reference)
4. [External Agent Integration](#external-agent-integration)
5. [Related Repositories](#related-repositories)
6. [Tool Reference](#tool-reference)
7. [Configuration Guide](#configuration-guide)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BambiSleep Church Agent Ecosystem                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────────────┐     ┌───────────────────────┐                    │
│  │  bambisleep-church-   │     │  bambisleep-church-   │                    │
│  │        agent          │     │    storage-agent      │                    │
│  │  (WebGL Avatar +      │     │  (File Hosting +      │                    │
│  │   Voice Synthesis)    │     │   Queue Management)   │                    │
│  │     Port 3333         │     │     Port 3000         │                    │
│  └───────────┬───────────┘     └───────────┬───────────┘                    │
│              │                             │                                 │
│              │      MCP Protocol          │                                 │
│              │      REST + WebSocket       │                                 │
│              ▼                             ▼                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                 BambiSleep Church MCP Control Tower                  │   │
│  │                      (Port 8080 - REST API)                          │   │
│  │                      (Port 3000 - Dashboard)                         │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌─────────────┐  │   │
│  │  │ Memory  │ │ GitHub  │ │HuggingFace│ │ Stripe  │ │   MongoDB   │  │   │
│  │  └─────────┘ └─────────┘ └──────────┘ └─────────┘ └─────────────┘  │   │
│  │  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌─────────────┐  │   │
│  │  │ Storage │ │  Fetch  │ │ Puppeteer│ │ SQLite  │ │  Thinking   │  │   │
│  │  └─────────┘ └─────────┘ └──────────┘ └─────────┘ └─────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Port Allocations

| Service                         | Port   | Purpose                          |
| ------------------------------- | ------ | -------------------------------- |
| MCP Control Tower Dashboard     | 3000   | Admin dashboard UI               |
| MCP Control Tower API           | 8080   | REST API + WebSocket             |
| bambisleep-church-agent         | 3333   | External agent with WebGL avatar |
| bambisleep-church-storage-agent | 3000\* | Storage agent frontend           |

\*Storage agent uses dynamic port when Control Tower is running

---

## 🔧 MCP Server Configurations

### VS Code Settings Configuration

Add to `.vscode/settings.json`:

```jsonc
{
  "mcp.servers": {
    // File System Access
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "."]
    },

    // Git Operations
    "git": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-git", "--repository", "."]
    },

    // GitHub Integration
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${env:GITHUB_TOKEN}"
      }
    },

    // Browser Automation
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
    },

    // HTTP Fetch
    "fetch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"]
    },

    // SQLite Database
    "sqlite": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-sqlite",
        "--db-path",
        "./data/local.db"
      ]
    },

    // Knowledge Graph Memory
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },

    // Sequential Thinking / Reasoning
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    }
  }
}
```

### Environment Variables

```bash
# .env configuration for MCP servers

# ============================================================================
# Server Configuration
# ============================================================================
NODE_ENV=development
LOG_LEVEL=info

# Dashboard (Port 3000)
DASHBOARD_PORT=3000
DASHBOARD_HOST=0.0.0.0

# API (Port 8080)
API_PORT=8080
API_HOST=0.0.0.0

# ============================================================================
# Database Configuration
# ============================================================================

# MongoDB - Supports local MongoDB or MongoDB Atlas
MONGODB_URI=mongodb://localhost:27017/bambisleep
MONGODB_DATABASE=bambisleepchurch

# SQLite (relative to project root)
SQLITE_PATH=./data/local.db

# ============================================================================
# External Service API Keys
# ============================================================================

# GitHub (for GitHub MCP server)
# Create at: https://github.com/settings/tokens
GITHUB_TOKEN=ghp_xxxxxxxxxxxx

# Stripe (for payment processing)
# Get from: https://dashboard.stripe.com/apikeys
STRIPE_API_KEY=sk_xxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx

# HuggingFace (for ML inference)
# Create at: https://huggingface.co/settings/tokens
HUGGINGFACE_TOKEN=hf_xxxxxxxxxxxx

# Microsoft Clarity (for analytics)
# Get from: https://clarity.microsoft.com
CLARITY_PROJECT_ID=utux7nv0pm

# ============================================================================
# Agent Configuration (for bambisleep-church-agent)
# ============================================================================

# MCP Control Tower Integration
MCP_API_URL=http://localhost:8080/api
MCP_WS_URL=ws://localhost:8080

# LM Studio (Local AI Backend)
LMS_HOST=192.168.0.73
LMS_PORT=7777
LMS_MODEL=qwen3
LMS_TEMPERATURE=0.7
LMS_MAX_TOKENS=2048

# ============================================================================
# Storage Configuration
# ============================================================================

# Storage MCP Server
STORAGE_DIR=./data/storage
STORAGE_MAX_SIZE=100mb

# ============================================================================
# Remote Logging (Optional)
# ============================================================================
REMOTE_LOG_URL=
REMOTE_LOG_KEY=
```

---

## 🤖 Agent API Reference

### Base URL

```
http://localhost:8080/api
```

### Endpoints

#### Chat

| Endpoint                   | Method | Description                |
| -------------------------- | ------ | -------------------------- |
| `/api/agent/chat`          | POST   | Send message to agent      |
| `/api/agent/tools`         | GET    | List available tools       |
| `/api/agent/tools/execute` | POST   | Execute a tool directly    |
| `/api/agent/stats`         | GET    | Get agent statistics       |
| `/api/agent/config`        | GET    | Get agent configuration    |
| `/api/agent/config`        | POST   | Update agent configuration |

#### Conversations

| Endpoint                       | Method | Description                  |
| ------------------------------ | ------ | ---------------------------- |
| `/api/agent/conversations`     | POST   | Create new conversation      |
| `/api/agent/conversations`     | GET    | List all conversations       |
| `/api/agent/conversations`     | DELETE | Clear all conversations      |
| `/api/agent/conversations/:id` | GET    | Get conversation by ID       |
| `/api/agent/conversations/:id` | DELETE | Delete specific conversation |

### Request/Response Examples

#### Chat with Agent

```javascript
// POST /api/agent/chat
const response = await fetch('http://localhost:8080/api/agent/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Search for the latest ML models for text generation',
    conversationId: 'conv_1234567890_abc123', // optional
    options: {
      maxIterations: 5  // max tool call iterations
    }
  })
});

// Response
{
  "conversationId": "conv_1234567890_abc123",
  "response": "I found several text generation models...",
  "toolCalls": [
    {
      "id": "tool_1234567890",
      "tool": "huggingface_search_models",
      "args": { "query": "text generation", "limit": 5 },
      "result": { "success": true, "result": [...] }
    }
  ],
  "iteration": 2
}
```

#### Execute Tool Directly

```javascript
// POST /api/agent/tools/execute
const response = await fetch('http://localhost:8080/api/agent/tools/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tool: 'memory_search',
    args: { query: 'BambiSleep' }
  })
});

// Response
{
  "success": true,
  "tool": "memory_search",
  "result": {
    "entities": [...],
    "relations": [...]
  }
}
```

### WebSocket API

Connect to `ws://localhost:8080/ws` for real-time updates.

```javascript
const ws = new WebSocket("ws://localhost:8080/ws");

ws.onopen = () => {
  // Subscribe to agent events
  ws.send(
    JSON.stringify({
      type: "SUBSCRIBE",
      channels: ["agent"],
    })
  );
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  // Handle message types: 'connected', 'heartbeat', 'server:status', etc.
};
```

---

## 🔗 External Agent Integration

### bambisleep-church-agent Integration

The [bambisleep-church-agent](https://github.com/BambiSleepChurch/bambisleep-church-agent) repository provides a standalone agent with:

- **WebGL Female Avatar**: GPU-accelerated face with lip sync, eye tracking, expressions
- **Voice Synthesis**: Text-to-speech with female voice preference
- **MCP Client**: Connects to this Control Tower for tool access
- **LM Studio Backend**: Primary AI using local models (Qwen, etc.)

#### Configuration for Agent Connection

```bash
# In bambisleep-church-agent/.env
MCP_API_URL=http://localhost:8080/api
MCP_WS_URL=ws://localhost:8080
```

#### MCP Client Usage Pattern

```javascript
// From bambisleep-church-agent/src/services/mcp-client.js
import { McpClient } from "./mcp-client.js";

const mcpClient = new McpClient({
  apiUrl: "http://localhost:8080/api",
  wsUrl: "ws://localhost:8080",
  maxReconnectAttempts: 10,
  reconnectInterval: 5000,
});

// Connect WebSocket for real-time updates
await mcpClient.connectWebSocket();

// Use MCP tools
const memory = await mcpClient.readMemory();
const models = await mcpClient.searchModels("tiny agent", { limit: 5 });
await mcpClient.createEntities([
  {
    name: "BambiAgent",
    entityType: "Agent",
    observations: ["Agentic AI for BambiSleep Church"],
  },
]);
```

### bambisleep-church-storage-agent Integration

The [bambisleep-church-storage-agent](https://github.com/BambiSleepChurch/bambisleep-church-storage-agent) provides:

- **MCP File Client**: Connects to storage MCP server via stdio
- **File Browser UI**: Web interface for images/videos
- **Queue System**: Download queue with ticketing
- **RTMP/RTSP Streaming**: Live stream capture support

#### Architecture

```
Browser → Express/WebSocket Server → MCP Client → Storage MCP Server → Filesystem
```

#### Storage Agent API

```javascript
// WebSocket actions
ws.send(JSON.stringify({ action: "list_files", payload: { folder: "all" } }));
ws.send(
  JSON.stringify({
    action: "upload",
    payload: { filename: "image.png", content: "<base64>", type: "image" },
  })
);
ws.send(
  JSON.stringify({
    action: "delete",
    payload: { filename: "file.png", folder: "IMAGES" },
  })
);
ws.send(
  JSON.stringify({
    action: "start_stream",
    payload: { source: "rtmp://server/app/stream", type: "rtmp" },
  })
);
```

---

## 🛠️ Tool Reference

### Memory MCP Tools

| Tool                      | Description                 | Parameters         |
| ------------------------- | --------------------------- | ------------------ |
| `memory_read_graph`       | Read entire knowledge graph | —                  |
| `memory_search`           | Search nodes                | `query: string`    |
| `memory_create_entities`  | Create entities             | `entities: array`  |
| `memory_create_relations` | Create relations            | `relations: array` |

### GitHub MCP Tools

| Tool                 | Description            | Parameters       |
| -------------------- | ---------------------- | ---------------- |
| `github_get_user`    | Get authenticated user | —                |
| `github_list_repos`  | List repositories      | `per_page, page` |
| `github_get_repo`    | Get repo details       | `owner, repo`    |
| `github_search_code` | Search code            | `query`          |

### MongoDB Tools

| Tool                       | Description         | Parameters                 |
| -------------------------- | ------------------- | -------------------------- |
| `mongodb_connect`          | Connect to database | `database`                 |
| `mongodb_list_collections` | List collections    | —                          |
| `mongodb_find`             | Find documents      | `collection, query, limit` |
| `mongodb_insert`           | Insert document     | `collection, document`     |

### Stripe Tools

| Tool                     | Description     | Parameters     |
| ------------------------ | --------------- | -------------- |
| `stripe_list_customers`  | List customers  | `limit, email` |
| `stripe_get_balance`     | Get balance     | —              |
| `stripe_create_customer` | Create customer | `email, name`  |

### HuggingFace Tools

| Tool                          | Description      | Parameters           |
| ----------------------------- | ---------------- | -------------------- |
| `huggingface_search_models`   | Search ML models | `query, limit, task` |
| `huggingface_search_datasets` | Search datasets  | `query, limit`       |
| `huggingface_inference`       | Run inference    | `model, inputs`      |

### Storage Tools

| Tool                 | Description  | Parameters                  |
| -------------------- | ------------ | --------------------------- |
| `storage_list_files` | List files   | `folder`                    |
| `storage_upload`     | Upload file  | `filename, content, folder` |
| `storage_get_url`    | Get file URL | `filename`                  |

### Clarity Analytics Tools

| Tool                    | Description   | Parameters        |
| ----------------------- | ------------- | ----------------- |
| `clarity_track_event`   | Track event   | `eventName, data` |
| `clarity_get_dashboard` | Get dashboard | —                 |

### Sequential Thinking Tools

| Tool                | Description          | Parameters                          |
| ------------------- | -------------------- | ----------------------------------- |
| `thinking_start`    | Start thinking chain | `thought, totalThoughts`            |
| `thinking_continue` | Continue chain       | `sessionId, thought, thoughtNumber` |

### Fetch Tools

| Tool                | Description       | Parameters |
| ------------------- | ----------------- | ---------- |
| `fetch_url`         | Fetch URL content | `url`      |
| `fetch_to_markdown` | Fetch as markdown | `url`      |

---

## ⚙️ Configuration Guide

### Running the Full Stack

```bash
# Terminal 1: Start MCP Control Tower
cd bambisleep-church
npm install
npm run dev

# Terminal 2: Start External Agent (optional)
cd bambisleep-church-agent
npm install
npm run dev

# Terminal 3: Start Storage Agent (optional)
cd bambisleep-church-storage-agent
npm install
npm run dev
```

### Agent Model Configuration

The agent orchestrator uses **LM Studio** for local AI inference with OpenAI-compatible API:

#### LM Studio Setup

1. Download and install [LM Studio](https://lmstudio.ai)
2. Load a model with tool-calling support (recommended: Qwen2.5-7B-Instruct)
3. Start the local server (default: `http://localhost:1234`)
4. Configure environment variables:

```bash
LMS_HOST=localhost
LMS_PORT=1234
LMS_MODEL=qwen2.5-7b-instruct
LMS_TEMPERATURE=0.7
LMS_MAX_TOKENS=2048
LMS_TIMEOUT=60000
```

#### Model Configuration

The agent can be configured via environment variables or API:

```javascript
// POST /api/agent/config
{
  "provider": "lmstudio",
  "model": "qwen2.5-7b-instruct",  // Local model loaded in LM Studio
  "fallbackModel": "qwen2.5-coder-7b-instruct",
  "maxTokens": 2048,
  "temperature": 0.7
}
```

### Recommended Models for LM Studio

| Model                       | Size | Use Case                      | Tool Calling |
| --------------------------- | ---- | ----------------------------- | ------------ |
| `qwen2.5-7b-instruct`       | 7B   | General chat, tool calling    | ✅ Native    |
| `qwen2.5-coder-7b-instruct` | 7B   | Code generation with tools    | ✅ Native    |
| `llama-3.1-8b-instruct`     | 8B   | Enhanced reasoning            | ✅ Native    |
| `mistral-7b-instruct-v0.3`  | 7B   | Fast inference                | ✅ Native    |
| `phi-3-mini-4k-instruct`    | 3.8B | Compact with good performance | ⚠️ Limited   |

> **Note**: Qwen2.5, Llama-3.1, and Mistral models have native tool-calling support in LM Studio.

### LM Studio API Endpoints

The Control Tower exposes LM Studio capabilities via REST API:

```bash
# Test connection
GET /api/lmstudio/health

# List available models
GET /api/lmstudio/models

# Get loaded model
GET /api/lmstudio/model/loaded

# Chat completion
POST /api/lmstudio/chat
{
  "messages": [{"role": "user", "content": "Hello!"}],
  "options": {"temperature": 0.7}
}

# Chat with tool calling
POST /api/lmstudio/chat/tools
{
  "messages": [...],
  "tools": [{...}],
  "options": {...}
}

# Text completion
POST /api/lmstudio/complete
{
  "prompt": "Once upon a time",
  "options": {"max_tokens": 100}
}

# Generate embeddings
POST /api/lmstudio/embed
{
  "input": "Text to embed",
  "options": {"model": "nomic-embed-text"}
}
```

### Legacy HuggingFace Support

For cloud-based inference, HuggingFace is still supported:

```bash
HUGGINGFACE_TOKEN=hf_...
```

Recommended tiny models for HuggingFace:

- `Qwen/Qwen2.5-0.5B-Instruct` (0.5B)
- `Qwen/Qwen2.5-Coder-0.5B-Instruct` (0.5B)
- `HuggingFaceTB/SmolLM-135M-Instruct` (135M)

---

## 📦 Related Repositories

| Repository                                                                                             | Description            | Status    |
| ------------------------------------------------------------------------------------------------------ | ---------------------- | --------- |
| [bambisleep-church](https://github.com/BambiSleepChurch/bambisleep-church)                             | MCP Control Tower      | 🟢 Active |
| [bambisleep-church-agent](https://github.com/BambiSleepChurch/bambisleep-church-agent)                 | WebGL Avatar Agent     | 🟢 Active |
| [bambisleep-church-storage-agent](https://github.com/BambiSleepChurch/bambisleep-church-storage-agent) | Storage Agent          | 🟢 Active |
| [bambisleep-church-storage](https://github.com/BambiSleepChurch/bambisleep-church-storage)             | Storage MCP Server     | 🟢 Active |
| [llm-toolshed-mcp-server](https://github.com/BambiSleepChurch/llm-toolshed-mcp-server)                 | RAG/CAG Knowledge Base | 🟡 Beta   |
| [bambisleep-data](https://github.com/BambiSleepChurch/bambisleep-data)                                 | Knowledge Base Data    | 📚 Data   |

---

## 🔮 System Prompt Template

The agent uses this system prompt for tool-calling behavior:

```
You are BambiAgent™, the intelligent orchestrator for the BambiSleep™ Church MCP Control Tower.

You have access to the following tools to interact with various services:
[Tool categories listed with descriptions]

To use a tool, respond with JSON in this format:
{"tool": "tool_name", "args": {"param1": "value1"}}

You can chain multiple tools. After receiving tool results, analyze them and either:
1. Call another tool if needed
2. Provide a final response to the user

Be helpful, precise, and efficient. Track important information in the knowledge graph.
```

---

## 🌸 License

MIT License - See [LICENSE](../LICENSE) for details.

---

✨ _Built with hypnotic precision for the digital sanctuary_ ✨

**BambiSleepChurch™** | [GitHub](https://github.com/BambiSleepChurch) | [bambisleep.info](https://bambisleep.info/)
