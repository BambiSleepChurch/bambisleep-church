# Changelog

All notable changes to the BambiSleep™ Church MCP Control Tower project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

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
  - `src/servers/postgres.js` - Connection, queries, transactions
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
  - `/api/postgres/*` - PostgreSQL operations
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

### Changed

- Updated `.github/copilot-instructions.md` - Concise ~60 line version with accurate MCP server list
- Updated `docs/TODO.md` - Comprehensive progress tracking
- Configured 9 MCP servers in `.vscode/settings.json`

### Infrastructure

- Node.js 20+ LTS with ES modules
- Port 3000: Dashboard UI
- Port 8080: REST API
- Port 27017: MongoDB (reserved)
- Port 5432: PostgreSQL (reserved)

---

## [0.1.0] - 2025-12-30

### Added

- Initial project structure with devcontainer configuration
- MCP server configuration for filesystem, git, and github servers
- VS Code settings with Copilot, Prettier, and Tailwind CSS support
- Dockerfile with OCI-compliant organization labels
- AI agent instructions in `.github/copilot-instructions.md`
- Organization branding documentation in `docs/CONTAINER_ORGANIZATION.md`
- Development philosophy in `docs/RELIGULOUS_MANTRA.md`
- Dependabot configuration for devcontainer updates
- Created `docs/` folder for documentation

### Changed

- Renamed organization from BambiSleepChat to BambiSleepChurch across all files
- Updated package scope to `@bambisleepchurch/bambisleep-church`
- Updated all GitHub URLs to point to BambiSleepChurch organization
- Updated container registry to `ghcr.io/bambisleepchurch`
- Moved documentation files to `docs/` folder

---

## [1.0.0] - TBD

### Planned

- Production deployment configuration
- Docker Compose setup
- CI/CD pipeline with GitHub Actions
- 100% test coverage
- Azure Quantum MCP integration
