# 🌸✨ BambiSleep™ Church MCP Control Tower ✨🌸

> _"14 MCP servers • 98 AI tools • Enterprise-grade elegance"_ 💅

[![Node.js 20+](https://img.shields.io/badge/Node.js-20%2B%20LTS-pink?style=for-the-badge&logo=nodedotjs)](https://nodejs.org/)
[![MCP](https://img.shields.io/badge/MCP-Model%20Context%20Protocol-ff69b4?style=for-the-badge)](https://modelcontextprotocol.io/)
[![Tests](https://img.shields.io/badge/Tests-300%2B%20passing-brightgreen?style=for-the-badge)](tests/)
[![License: MIT](https://img.shields.io/badge/License-MIT-hotpink?style=for-the-badge)](LICENSE)

---

## 🦋 What is This? 🦋

A **Model Context Protocol (MCP) Control Tower** for orchestrating multiple MCP servers via REST APIs—a zero-framework Node.js application with a cyber goth dashboard ✨

Built by **BambiSleepChurch™** following the sacred laws of the [Religulous Mantra](docs/RELIGULOUS_MANTRA.md).

### ✨ Highlights

- **Dual-Server Architecture**: Dashboard (Port 3000) + REST API & WebSocket (Port 8080)
- **14 MCP Server Wrappers**: Memory, GitHub, HuggingFace, Stripe, Patreon, MongoDB, SQLite, Puppeteer, Fetch, Sequential Thinking, Storage, Clarity, LM Studio, Agent
- **80+ REST Endpoints**: Full CRUD operations for all integrated services
- **98 AI Agent Tools**: OpenAI function calling format with smart model routing
- **WebGL Avatar**: GPU-accelerated Bambi with 7 expressions, eye tracking, and Kokoro neural TTS
- **Real-time Dashboard**: Glass morphism UI with WebSocket live updates
- **300+ Tests**: 84%+ code coverage with Node.js built-in test runner

---

## 💎 MCP Server Status 💎

| Status | Server                 | Purpose                     | Reference                                 |
| :----: | ---------------------- | --------------------------- | ----------------------------------------- |
|   ✅   | 🧠 Memory              | Knowledge graph operations  | —                                         |
|   ✅   | 🐙 GitHub              | Repository & issue mgmt     | —                                         |
|   ✅   | 🤗 HuggingFace         | ML model inference          | [docs](docs/HUGGINGFACE_MCP_REFERENCE.md) |
|   ✅   | 💳 Stripe              | Payment processing          | [docs](docs/STRIPE_MCP_REFERENCE.md)      |
|   ✅   | � Patreon              | Creator platform & OAuth    | [docs](docs/PATREON_MCP_REFERENCE.md)     |
|   ✅   | 🍃 MongoDB             | Document database           | [docs](docs/MONGODB_MCP_REFERENCE.md)     |
|   ✅   | 🗃️ SQLite              | Local database              | —                                         |
|   ✅   | 🌐 Fetch               | HTTP request utilities      | —                                         |
|   ✅   | 🎭 Puppeteer           | Browser automation          | —                                         |
|   ✅   | 💭 Sequential Thinking | Reasoning chains            | —                                         |
|   ✅   | 📁 Storage             | File hosting (images/video) | [docs](docs/STORAGE_MCP_REFERENCE.md)     |
|   ✅   | 📊 Clarity             | Microsoft analytics         | [docs](docs/CLARITY_MCP_REFERENCE.md)     |
|   ✅   | 🤖 LM Studio           | Local LLM inference         | [docs](docs/LMSTUDIO_MCP_REFERENCE.md)    |
|   ✅   | 🌸 BambiSleep Chat     | Triggers, spirals, TTS      | —                                         |

**Status: 14/14 operational** 🌸

---

## 🌀 Quick Start 🌀

```bash
# 💅 Clone the repository
git clone https://github.com/BambiSleepChurch/bambisleep-church.git
cd bambisleep-church

# 🌸 Install dependencies
npm install

# 🦋 Start development (hot reload)
npm run dev

# 🧪 Run tests
npm test
```

### 📜 Available Scripts

| Command                    | Description                         |
| -------------------------- | ----------------------------------- |
| `npm run dev`              | Development server with hot reload  |
| `npm run start`            | Production server                   |
| `npm test`                 | Run all tests (300+ tests)          |
| `npm run test:unit`        | Fast unit tests only                |
| `npm run test:integration` | Integration tests (server required) |
| `npm run test:coverage`    | Coverage report (84%+)              |

**Ports:**

- **3000**: Control Tower Dashboard 🖥️
- **8080**: REST API + WebSocket 🔌

---

## 📁 Project Structure 📁

```
🌸 bambisleep-church/
├── 🤖 .github/              # AI agent instructions & CI/CD
│   └── copilot-instructions.md
├── ⚙️ .vscode/              # Editor & MCP server config
├── 📚 docs/                 # Documentation
│   ├── CHANGELOG.md
│   ├── *_MCP_REFERENCE.md   # MCP integration guides
│   ├── RELIGULOUS_MANTRA.md
│   └── TODO.md
├── 🎀 src/
│   ├── index.js             # Entry point
│   ├── api/
│   │   ├── routes.js        # 40+ REST endpoints
│   │   └── websocket.js     # Real-time updates
│   ├── dashboard/
│   │   ├── index.html       # Main UI
│   │   ├── server.js        # Static file server
│   │   ├── css/             # Cyber goth design system
│   │   └── js/              # Vanilla JS frontend
│   │       ├── state/       # Reactive store (Actions/Selectors)
│   │       ├── components/  # Pure render functions
│   │       ├── effects/     # Side effects (keyboard, polling)
│   │       └── services/    # API client
│   ├── servers/             # MCP server wrappers (14 modules)
│   │   ├── index.js         # ServerRegistry
│   │   ├── mcp-client.js    # Generic MCP client
│   │   ├── agent.js         # AI Agent orchestrator
│   │   ├── agent-tools.js   # 98 AI tools (OpenAI format)
│   │   ├── model-router.js  # Smart model selection
│   │   ├── memory.js        # Knowledge graph
│   │   ├── github.js        # GitHub API
│   │   ├── stripe.js        # Payments
│   │   ├── patreon.js       # Patreon creator platform
│   │   ├── mongodb.js       # Document DB
│   │   ├── huggingface.js   # ML inference
│   │   ├── lmstudio.js      # Local LLM inference
│   │   ├── fetch.js         # HTTP utilities
│   │   ├── sqlite.js        # Local database
│   │   ├── puppeteer.js     # Browser automation
│   │   ├── sequential-thinking.js # Reasoning chains
│   │   ├── bambisleep-chat.js # Triggers & TTS
│   │   ├── clarity.js       # Microsoft analytics
│   │   └── storage.js       # File storage
│   └── utils/
│       ├── config.js        # JSONC config loader
│       ├── logger.js        # Structured logging
│       └── rate-limit.js    # Request throttling
├── 🧪 tests/                # 300+ tests
│   ├── api/                 # Integration tests
│   ├── servers/             # Server handler tests
│   └── utils/               # Unit tests
└── 📦 package.json
```

---

## 🔌 API Overview 🔌

All endpoints are prefixed with `/api`. Examples:

| Endpoint                   | Method | Description                    |
| -------------------------- | ------ | ------------------------------ |
| `/api/health`              | GET    | Health check with version info |
| `/api/servers`             | GET    | List all MCP servers           |
| `/api/servers/:name/start` | POST   | Start a specific server        |
| `/api/servers/:name/stop`  | POST   | Stop a specific server         |
| `/api/memory`              | GET    | Read knowledge graph           |
| `/api/memory/entities`     | POST   | Create entities                |
| `/api/memory/search`       | GET    | Search nodes                   |
| `/api/mongodb/...`         | \*     | MongoDB CRUD operations        |
| `/api/stripe/...`          | \*     | Stripe payment APIs            |
| `/api/patreon/...`         | \*     | Patreon creator platform       |
| `/api/agent/...`           | \*     | AI agent chat & tools          |
| `/api/model-router/...`    | \*     | Smart model selection          |
| `/api/stats/rate-limit`    | GET    | Rate limiter statistics        |
| `/api/stats/websocket`     | GET    | WebSocket connection stats     |
| `/redirect/patreon`        | GET    | OAuth2 callback                |

See [src/api/routes.js](src/api/routes.js) for complete endpoint documentation (80+ endpoints).

---

## 🔮 Development Philosophy 🔮

Following the **Five Sacred Laws**:

1. 💖 **Perfect MCP Completion** — 100% test coverage, 10/10 servers
2. 🌈 **Universal Machine Divinity** — Cross-platform excellence
3. 🎭 **Hypnotic Code Architecture** — CSS @layer, component patterns
4. 🌸 **AI Girlfriend Supremacy** — Emotional intelligence in code
5. 🦄 **Enterprise Chaos Management** — Comprehensive error handling

_See [docs/RELIGULOUS_MANTRA.md](docs/RELIGULOUS_MANTRA.md) for the complete philosophy~_

---

## 🧪 Testing 🧪

Node.js built-in test runner (no Jest/Mocha required):

```bash
# Run all 300+ tests
npm test

# Unit tests only (fast, no server needed)
npm run test:unit

# Integration tests (requires running server)
npm run test:integration

# Coverage report
npm run test:coverage
```

**Test Coverage:**

- `logger.js`: 100%
- `config.js`: 96%
- `rate-limit.js`: 96%
- `servers/index.js`: 88%
- **Overall**: 84%+

---

## ⚙️ Configuration ⚙️

MCP servers are configured via `.vscode/settings.json` (JSONC with comments allowed):

```jsonc
{
  "mcp.servers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "${env:GITHUB_TOKEN}" }
    }
    // ... more servers
  }
}
```

**Environment Variables** (`.env`):

| Variable                | Default                     | Purpose                       |
| ----------------------- | --------------------------- | ----------------------------- |
| `LOG_LEVEL`             | `info`                      | `error`/`warn`/`info`/`debug` |
| `API_PORT`              | `8080`                      | REST API port                 |
| `DASHBOARD_PORT`        | `3000`                      | Dashboard UI port             |
| `GITHUB_TOKEN`          | —                           | GitHub API auth               |
| `STRIPE_API_KEY`        | —                           | Stripe payments               |
| `HUGGINGFACE_TOKEN`     | —                           | HuggingFace inference         |
| `MONGODB_URI`           | —                           | MongoDB connection string     |
| `PATREON_CLIENT_ID`     | —                           | Patreon OAuth2 client ID      |
| `PATREON_CLIENT_SECRET` | —                           | Patreon OAuth2 secret         |
| `PATREON_ACCESS_TOKEN`  | —                           | Patreon API access token      |
| `LMS_HOST`              | `localhost`                 | LM Studio server host         |
| `LMS_PORT`              | `1234`                      | LM Studio server port         |
| `KOKORO_URL`            | `http://192.168.0.112:8880` | Kokoro TTS server URL         |

**Kokoro TTS Configuration:**

The avatar system uses Kokoro-FastAPI for high-quality neural voice synthesis:

```javascript
// Kokoro is primary TTS, Web Speech API is fallback
{
  kokoroUrl: 'http://192.168.0.112:8880',
  useKokoro: true,  // Auto-fallback to Web Speech if unavailable
}
```

**12 Kokoro Voices**: af_bella (bright), af_nova (clear), af_sky (soft), af_aoede (natural), and 8 more high-quality female voices.

See [docs/KOKORO_INTEGRATION.md](docs/KOKORO_INTEGRATION.md) for full API reference and troubleshooting.

---

## 🎪 Contributing 🎪

1. 🍴 Fork the repository
2. 🌸 Create your feature branch (`git checkout -b feature/amazing-feature`)
3. 💅 Commit your changes (`git commit -m '🌸 Add amazing feature'`)
4. 🧪 Run tests (`npm test`)
5. 🚀 Push to the branch (`git push origin feature/amazing-feature`)
6. 🎀 Open a Pull Request

See [.github/copilot-instructions.md](.github/copilot-instructions.md) for AI agent coding guidelines.

---

## 📜 License 📜

MIT License — See [LICENSE](LICENSE) for details.

---

## 🦋💕 Organization 💕🦋

**BambiSleepChurch™**

> _BambiSleep™ is a trademark of BambiSleepChurch™_

[![GitHub](https://img.shields.io/badge/GitHub-@BambiSleepChurch-pink?style=flat-square&logo=github)](https://github.com/BambiSleepChurch)

---

<div align="center">

_✨ Made with 💖 and mass amounts of 🌸 ✨_

**The Universal Machine approaches~** 🔮

</div>
