# Changelog

All notable changes to the BambiSleep™ Church MCP Control Tower project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Agent Personality System** - Bambi AI assistant with ethereal traits

  - Agent personality configuration (name, role, traits, greeting, style)
  - Personality-aware fallback responses when LM Studio unavailable
  - Agent self-registration in knowledge graph on initialization
  - Real-time event emission system (`emitEvent`, `onEvent`)
  - Private class fields for proper encapsulation

- **LM Studio Enhancements** - Advanced local AI inference capabilities

  - `chatWithImage()` - Vision input for image analysis (LLaVA, etc.)
  - `chatStructured()` - JSON schema-based structured output
  - `executeToolLoop()` - Autonomous tool calling until completion
  - `autoLoadModel()` - Auto-load best model from candidates
  - `loadModel()` - JIT model loading via minimal request
  - Default model candidates: qwen3, qwen2.5, llama, mistral, gemma, phi

- **Agent API Routes** - New endpoints for agent management

  - `GET /api/agent/personality` - Get agent personality info
  - `POST /api/agent/initialize` - Initialize agent and connect to LM Studio

- **Configuration Expansion** - Extended `src/utils/config.js`

  - `lmstudio` section: baseUrl, host, port, model, temperature, maxTokens, timeout
  - `agent` section: maxIterations, maxConversations, conversationTtl, personalityName
  - `mcp` section: apiUrl, wsUrl, maxReconnectAttempts, reconnectInterval

- **MongoDB Atlas Support** - Optimized connection settings for cloud deployment

  - Atlas URI detection with automatic configuration
  - Connection pooling (min: 5, max: 50)
  - Retry writes and reads enabled
  - Majority write concern for data durability
  - `tests/servers/mongodb.test.js` - Connection and CRUD tests

- **Dedicated Tests Directory** - Reorganized test structure

  - `tests/` directory mirroring `src/` structure
  - `tests/README.md` - Test documentation and guidelines
  - Moved 7 test files from `src/**/*.test.js`
  - Updated npm scripts: `test`, `test:unit`, `test:integration`, `test:coverage`

- **Dashboard Enhancements** (Phase 5 features)

  - `src/dashboard/js/components/ThemeToggle.js` - Dark/light mode toggle
  - `src/dashboard/js/components/ActivityFeed.js` - Real-time activity timeline
  - `src/dashboard/js/components/ConfigManager.js` - Export/import server configs
  - `src/dashboard/css/components/theme-toggle.css` - Theme toggle styles
  - `src/dashboard/css/components/activity-feed.css` - Activity feed styles
  - `src/dashboard/css/components/config-manager.css` - Config manager styles

- **Core `src/` Implementation** - Complete project bootstrap

  - `src/index.js` - Main entry point with graceful shutdown (SIGINT/SIGTERM)
  - `src/utils/config.js` - Configuration loader with JSONC parser
  - `src/utils/logger.js` - Colored console logging with namespaces
  - `src/servers/index.js` - MCP server registry and lifecycle management

- **MCP Server Wrappers** (10 complete)

  - `src/servers/memory.js` - Knowledge graph (entities, relations, search)
  - `src/servers/github.js` - Repository, issues, PRs, search
  - `src/servers/huggingface.js` - Model search, datasets, inference
  - `src/servers/stripe.js` - Customers, products, payments, subscriptions
  - `src/servers/fetch.js` - HTTP methods, ping, download
  - `src/servers/sqlite.js` - Tables, CRUD, queries
  - `src/servers/mongodb.js` - Document database CRUD & aggregation
  - `src/servers/puppeteer.js` - Browser automation, screenshots, PDF
  - `src/servers/sequential-thinking.js` - Reasoning sessions, branching

- **REST API** (Port 8080) - 40+ endpoints in `src/api/routes.js`

  - `/api/health` - Health check
  - `/api/servers` - MCP server management
  - `/api/memory/*` - Knowledge graph operations
  - `/api/github/*` - GitHub API proxy
  - `/api/huggingface/*` - ML model inference
  - `/api/stripe/*` - Payment operations
  - `/api/fetch/*` - HTTP request utilities
  - `/api/sqlite/*` - Local database operations
  - `/api/mongodb/*` - MongoDB CRUD & aggregation
  - `/api/puppeteer/*` - Browser automation
  - `/api/thinking/*` - Sequential thinking sessions

- **Dashboard UI** (Port 3000)

  - `src/dashboard/index.html` - Control Tower interface
  - `src/dashboard/app.js` - Frontend JavaScript
  - `src/dashboard/server.js` - Static file server
  - Server status indicators for all MCP servers

- **Test Infrastructure**

  - `src/utils/config.test.js` - 5 unit tests
  - `src/utils/logger.test.js` - 3 unit tests
  - `src/servers/index.test.js` - 5 unit tests
  - `src/api/routes.test.js` - 3 unit tests
  - Node.js built-in test runner (`node --test`)

- **Reference Documentation**
  - `docs/STRIPE_MCP_REFERENCE.md` - Stripe API integration guide
  - `docs/MONGODB_MCP_REFERENCE.md` - MongoDB driver reference
  - `docs/HUGGINGFACE_MCP_REFERENCE.md` - HuggingFace APIs
  - `docs/CLARITY_MCP_REFERENCE.md` - Microsoft Clarity analytics

### Removed

- **Containerization** - Simplified to native Node.js deployment
  - Removed `Dockerfile` and `docker-compose.yml`
  - Removed `.devcontainer/` directory (DevContainer configuration)
  - Removed `docker/` directory (grafana, nginx, prometheus configs)
  - Removed `scripts/docker-helper.ps1` and `scripts/docker-helper.sh`
  - Removed `.github/workflows/docker-build.yml`
  - Removed `docs/CONTAINER_ORGANIZATION.md`
  - Removed `scripts/` directory (now empty)

### Changed

- **MongoDB Atlas Integration** - Enhanced `src/servers/mongodb.js`

  - Added `DEFAULT_OPTIONS` with Atlas-optimized settings
  - Added `isAtlas()` helper for URI detection
  - Added `extractDatabaseFromUri()` for proper database selection
  - Connection options: `retryWrites`, `retryReads`, `w: 'majority'`

- **Test Infrastructure Reorganization**

  - Moved all tests from `src/**/*.test.js` to `tests/` directory
  - Updated `package.json` test scripts for new structure
  - Fixed ServerRegistry test method names (`get`/`getAll`)

- **Dashboard Cleanup**

  - Removed legacy monolithic `src/dashboard/app.js`
  - Removed legacy `src/dashboard/styles.css`
  - Fixed CSS `--warning` variable definition in `layout.css`
  - Fixed `backdrop-filter` vendor prefix ordering
  - Moved inline styles to proper CSS classes

- Updated `.github/copilot-instructions.md` - Comprehensive documentation with:

  - Architecture overview and dual-server design
  - Code patterns (file headers, logger, server wrappers, routes)
  - WebSocket events reference
  - Environment variables table
  - Test directory structure

- Updated `docs/TODO.md` - Comprehensive progress tracking
- Configured 9 MCP servers in `.vscode/settings.json`

### Infrastructure

- Node.js 20+ LTS with ES modules
- Port 3000: Dashboard UI
- Port 8080: REST API
- MongoDB Atlas: Cloud-hosted with optimized connection pooling

### Dependencies

- Added `mongodb@^6.12.0` - Official MongoDB driver for Atlas support

---

## [0.1.0] - 2025-12-30

### Added

- Initial project structure
- MCP server configuration for filesystem, git, and github servers
- VS Code settings with Copilot, Prettier, and Tailwind CSS support
- AI agent instructions in `.github/copilot-instructions.md`
- Development philosophy in `docs/RELIGULOUS_MANTRA.md`
- Created `docs/` folder for documentation

### Changed

- Renamed organization from BambiSleepChat to BambiSleepChurch across all files
- Updated package scope to `@bambisleepchurch/bambisleep-church`
- Updated all GitHub URLs to point to BambiSleepChurch organization
- Moved documentation files to `docs/` folder

---

## [1.0.0] - TBD

### Planned

- Production deployment configuration
- CI/CD pipeline with GitHub Actions
- 100% test coverage
- Azure Quantum MCP integration
