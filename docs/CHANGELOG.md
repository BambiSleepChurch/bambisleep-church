# Changelog

All notable changes to the BambiSleep™ Church MCP Control Tower project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Phase 6: Agentic Frontend Rendering** - Dynamic UI component system ✅ COMPLETE

  - `DynamicRenderer.js` - Runtime component factory for agent-generated UI

    - Component registry with 8 render types: card, table, form, alert, progress, list, code, wizard
    - Active component state tracking with update/remove capabilities
    - Action handler registry for component interactions
    - WebSocket render command processing (`processRenderCommand`)
    - Utilities: HTML escaping, cell formatting, event attachment
    - Wizard navigation with step validation and progress tracking

  - `AgentWorkspace.js` - Container for agent-rendered dynamic content

    - Layout modes: stack, grid, columns, free positioning
    - WebSocket integration for real-time render commands
    - Render history tracking (last 50 operations)
    - Workspace controls: layout selector, clear button, history panel
    - Rate limiting with configurable burst/sustained limits
    - Render queue for throttled operations
    - `initWorkspace()`, `renderToWorkspace()`, `setLayoutMode()` APIs

  - `ComponentTemplates.js` - Pre-built UI pattern library

    - `crudTemplate()` - Full CRUD interface with table and forms
    - `dashboardTemplate()` - Stats cards with charts layout
    - `authFormTemplate()` - Login/register form with validation
    - `settingsTemplate()` - Multi-section settings panel
    - `setupWizardTemplate()` - Multi-step wizard generator
    - `onboardingWizardTemplate()` - Welcome flow wizard
    - `dataViewerTemplate()` - Table with filters and export
    - `fileManagerTemplate()` - File browser interface
    - `notificationCenterTemplate()` - Notification management
    - `activityTimelineTemplate()` - Activity feed timeline

  - `workspace.css` - Comprehensive styles for dynamic components (1000+ lines)

    - Workspace container with layout mode classes
    - Card component with variants (success, warning, error, info)
    - Data table with sortable columns and pagination
    - Form component with validation states
    - Alert banners with dismiss functionality
    - Progress indicators (bar, circular, steps variants)
    - List component with selectable items
    - Code block with line numbers and copy button
    - Interactive wizard with step navigation
    - Responsive breakpoints for mobile

  - 13 new render tools in `agent-tools.js` (102 total):

    - `render_card` - Glass card with header, content, actions
    - `render_table` - Data table with sorting and pagination
    - `render_form` - Dynamic form with validation
    - `render_alert` - Alert banner (info/success/warning/error)
    - `render_progress` - Progress indicator (bar/circular/steps)
    - `render_list` - Interactive list with badges
    - `render_code` - Code block with syntax highlighting
    - `render_clear` - Clear components by ID or type
    - `render_wizard` - Multi-step wizard interface
    - `render_template` - Generate UI from template name
    - `render_crud` - Full CRUD interface from config
    - `render_dashboard` - Dashboard with stats and charts
    - `render_onboarding` - Onboarding wizard flow

  - WebSocket render message types for real-time UI updates

    - `RENDER`, `RENDER_CARD`, `RENDER_TABLE`, `RENDER_FORM`
    - `RENDER_ALERT`, `RENDER_PROGRESS`, `RENDER_LIST`, `RENDER_CODE`
    - `RENDER_WIZARD`, `RENDER_CLEAR`, `RENDER_SPIRAL`, `RENDER_NOTIFICATION`, `RENDER_MODAL`

  - Security & Performance features
    - Rate limiting: 10 renders/second burst, 60/minute sustained
    - Render queue for throttled operations
    - Action sandboxing via handler registry
    - Component isolation with unique IDs

- **API Documentation** - OpenAPI 3.0 specification with Swagger UI

  - Full OpenAPI 3.0.3 spec with 80+ endpoints across 18 tags
  - Interactive Swagger UI at `/docs` and `/api/docs/ui`
  - JSON spec at `/api/openapi`, YAML at `/api/openapi.yaml`
  - Component schemas for Server, KnowledgeGraph, Entity, Relation, Tool

- **Prometheus Metrics** - Production monitoring endpoint

  - `/api/metrics` - Prometheus exposition format
  - `/api/metrics/json` - JSON format for custom dashboards
  - 15+ metrics: http_requests_total, tool_executions_total, websocket_messages, etc.
  - Automatic recording via `recordHttpRequest()`, `recordToolExecution()`

- **MCP Configuration Guide** - Comprehensive server setup documentation

  - `docs/MCP_CONFIGURATION_GUIDE.md` - 400+ line reference
  - Covers all 9 external MCP servers + 5 integrated handlers
  - Environment variables, troubleshooting, and best practices

- **Deployment Guide** - Production deployment reference

  - `docs/DEPLOYMENT_GUIDE.md` - 500+ line guide
  - PM2, Docker, docker-compose configurations
  - Nginx and Caddy reverse proxy with SSL/TLS (Let's Encrypt)
  - Prometheus + Grafana monitoring stack
  - Health checks, alerting, backups, security checklist

- **Memory Graph Visualization** - D3.js force-directed knowledge graph

  - Interactive node exploration with drag/zoom
  - Entity type coloring (person, concept, event)
  - Search/filter functionality
  - Physics toggle and SVG export
  - New dashboard section in Tools

- **API Request Builder** - Interactive API testing panel

  - Endpoint selector with method badges
  - Custom headers and JSON body editor
  - Response viewer with timing stats
  - cURL export for command-line testing
  - Request history (last 10)

- **Drag-and-Drop Server Ordering** - Custom server card arrangement

  - Drag handle on server cards
  - Visual drop indicators (top/bottom insertion)
  - localStorage persistence of custom order
  - Reset to default button
  - Toast notifications on reorder

- **Privacy Policy & Terms of Service** - Legal compliance pages

  - Comprehensive Privacy Policy with 12 sections (GDPR-style)
  - Complete Terms of Service with 18 sections
  - Adult content warning notice
  - Footer links in dashboard
  - Branded styling matching design system

- **Patreon OAuth Redirect** - OAuth2 callback handling

  - `GET /redirect/patreon` endpoint for OAuth callback
  - Automatic token exchange from authorization code
  - Branded success/error HTML response pages
  - Event logging with state tracking
  - Configured redirect URI: `https://bambisleep.church/redirect/patreon`

- **Patreon MCP Server** - Full Patreon API v2 integration for creator platform operations

  - PatreonClient class with OAuth2 token handling and JSON:API request format
  - Identity, Campaigns, Members, Posts, and Webhooks API methods
  - HMAC-MD5 webhook signature verification
  - OAuth2 authorization URL generation and token exchange
  - Patron status utilities (isActivePatron, getPatronTierAmount, getPatronStatus)
  - Automatic pagination support for member lists (getAllMembers)
  - 16 new Patreon agent tools for AI orchestration
  - Comprehensive test suite with 21 test cases

- **Patreon API Routes** - 16 new REST endpoints

  - `GET /api/patreon/status` - Connection status
  - `GET /api/patreon/identity` - Current user identity
  - `GET /api/patreon/campaigns` - List all campaigns
  - `GET /api/patreon/campaigns/:id` - Get specific campaign
  - `GET /api/patreon/campaigns/:id/members` - Get campaign members (paginated)
  - `GET /api/patreon/campaigns/:id/members/all` - Get all members (auto-paginated)
  - `GET /api/patreon/members/:id` - Get specific member
  - `GET /api/patreon/campaigns/:id/posts` - Get campaign posts
  - `GET /api/patreon/posts/:id` - Get specific post
  - `GET /api/patreon/webhooks` - List webhooks
  - `POST /api/patreon/webhooks` - Create webhook
  - `PATCH /api/patreon/webhooks/:id` - Update webhook
  - `DELETE /api/patreon/webhooks/:id` - Delete webhook
  - `POST /api/patreon/webhooks/verify` - Verify webhook signature
  - `POST /api/patreon/oauth/refresh` - Refresh OAuth token
  - `POST /api/patreon/oauth/exchange` - Exchange code for token
  - `GET /api/patreon/oauth/url` - Get OAuth authorization URL

- **Configuration** - Patreon environment variables

  - `PATREON_CLIENT_ID` - OAuth2 client ID
  - `PATREON_CLIENT_SECRET` - OAuth2 client secret
  - `PATREON_ACCESS_TOKEN` - API access token
  - `PATREON_WEBHOOK_SECRET` - Webhook signature verification secret

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
