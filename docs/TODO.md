# TODO - BambiSleep™ Church MCP Control Tower

## ✅ Phase 1: Bootstrap (Complete)

### Core Implementation

- [x] Create `src/` directory structure
- [x] Implement `src/index.js` main entry point
- [x] Create `src/servers/index.js` server registry
- [x] Implement MCP server wrappers:
  - [x] `src/servers/memory.js` - Knowledge graph
  - [x] `src/servers/github.js` - GitHub API
  - [x] `src/servers/huggingface.js` - HuggingFace inference
  - [x] `src/servers/stripe.js` - Payment operations
  - [x] `src/servers/patreon.js` - Patreon creator platform
  - [x] `src/servers/fetch.js` - HTTP requests
  - [x] `src/servers/sqlite.js` - Local database
  - [x] `src/servers/mongodb.js` - MongoDB database
  - [x] `src/servers/puppeteer.js` - Browser automation
  - [x] `src/servers/sequential-thinking.js` - Reasoning chains
- [x] Create `src/utils/config.js` configuration loader
- [x] Create `src/utils/logger.js` logging utility

### NPM Scripts

- [x] Implement `npm run dev` - development server with hot reload
- [x] Implement `npm run build` - production build
- [x] Implement `npm run test` - test runner with coverage
- [x] Implement `npm run start` - production server

### Dashboard (Port 3000)

- [x] Create `src/dashboard/index.html` - main UI
- [x] Create `src/dashboard/app.js` - frontend logic
- [x] Create `src/dashboard/styles.css` - Cyber goth design system
- [x] Create `src/dashboard/variables.css` - CSS design tokens
- [x] Server status indicators for all MCP servers
- [x] Glass morphism components with `backdrop-filter`
- [x] Responsive layout with mobile breakpoints
- [x] Real-time health monitoring (WebSocket)
- [x] Server log viewer panel

### API (Port 8080)

- [x] Create `src/api/routes.js` - route definitions (40+ endpoints)
- [x] Health check endpoint
- [x] Server management endpoints
- [x] Memory API endpoints
- [x] GitHub API endpoints
- [x] HuggingFace API endpoints
- [x] Stripe API endpoints
- [x] Fetch API endpoints
- [x] SQLite API endpoints
- [x] MongoDB API endpoints
- [x] Puppeteer API endpoints
- [x] Sequential Thinking API endpoints

---

## ✅ Phase 2: MCP Expansion (Complete)

### Reference Documentation (4/5 Complete)

- [x] `docs/STRIPE_MCP_REFERENCE.md` - Stripe API, payments, subscriptions
- [x] `docs/MONGODB_MCP_REFERENCE.md` - MongoDB driver, CRUD, aggregation
- [x] `docs/CLARITY_MCP_REFERENCE.md` - Microsoft Clarity analytics, heatmaps
- [x] `docs/HUGGINGFACE_MCP_REFERENCE.md` - HuggingFace inference & hub APIs
- [ ] `docs/AZURE_QUANTUM_MCP_REFERENCE.md` - Azure Quantum integration

### MCP Server Wrappers (10/10 Complete)

All configured MCP servers now have REST API wrappers:

- [x] Memory (`src/servers/memory.js`) - Knowledge graph operations
- [x] GitHub (`src/servers/github.js`) - Repository & issue management
- [x] HuggingFace (`src/servers/huggingface.js`) - ML model inference
- [x] Stripe (`src/servers/stripe.js`) - Payment & subscription APIs
- [x] Fetch (`src/servers/fetch.js`) - HTTP request utilities
- [x] SQLite (`src/servers/sqlite.js`) - Local database CRUD
- [x] MongoDB (`src/servers/mongodb.js`) - Document database CRUD & aggregation
- [x] Puppeteer (`src/servers/puppeteer.js`) - Browser automation
- [x] Sequential Thinking (`src/servers/sequential-thinking.js`) - Reasoning
- [x] Storage (`src/servers/storage.js`) - File hosting (images/videos)

### Configuration Updates

- [x] Add new servers to `.vscode/settings.json` (9 servers configured)
- [x] Environment variables handling (`src/utils/config.js`, `.env.example`)

---

## ✅ Phase 3: Quality & Testing (Complete)

### Testing Infrastructure

- [x] Set up Node.js built-in test runner (`node --test`)
- [x] Write unit tests for server registry (20+ tests)
- [x] Write unit tests for config module (30+ tests)
- [x] Write unit tests for logger module (10+ tests)
- [x] Write unit tests for rate limiter (15+ tests)
- [x] Write integration tests for API endpoints (3 tests)
- [x] Write MCP API integration tests
- [x] Add CI/CD pipeline with GitHub Actions (`.github/workflows/ci.yml`)
- [x] Reorganize tests into dedicated `tests/` directory
- [x] MongoDB unit tests (30+ error handling tests)
- [x] Test coverage: **84%+ line coverage**
  - `logger.js`: 100%
  - `config.js`: 96%
  - `rate-limit.js`: 96%
  - `servers/index.js`: 88%
  - `mongodb.js`: 73%

### Documentation

- [x] Create README.md with quick start guide
- [x] Create `.github/copilot-instructions.md` for AI agents
- [x] MCP Reference Docs (Stripe, MongoDB, Clarity, HuggingFace)
- [x] API documentation generator (OpenAPI 3.0 + Swagger UI at `/docs`)
- [x] MCP server configuration guide (`docs/MCP_CONFIGURATION_GUIDE.md`)
- [x] Deployment guide (`docs/DEPLOYMENT_GUIDE.md`)

---

## ✅ Phase 4: Production Readiness (Complete)

### Deployment

- [x] Environment variables template (`.env.example`)
- [x] Health check endpoints (`/api/health` with version & env)
- [x] Graceful shutdown handling (SIGINT/SIGTERM)
- [x] Rate limiting middleware (`src/utils/rate-limit.js`)
- [x] SSL/TLS configuration (documented in `docs/DEPLOYMENT_GUIDE.md`)

### Monitoring

- [x] Structured logging (with namespaces and colors)
- [x] Rate limit stats endpoint (`/api/stats/rate-limit`)
- [x] WebSocket stats endpoint (`/api/stats/websocket`)
- [x] Metrics collection (Prometheus format at `/api/metrics`)
- [x] Alerting setup (documented in deployment guide)
- [x] Error tracking integration (documented in deployment guide)

---

## ✅ Phase 5: Enhanced Dashboard (Complete)

### UI Components

- [x] Server detail modal with full config view
- [x] Live log streaming per server
- [x] Memory graph visualization (D3.js force-directed graph)
- [x] API request builder/tester panel
- [x] Dark/light theme toggle

### Real-time Features

- [x] WebSocket connection for live updates (`src/api/websocket.js`)
- [x] WebSocket status indicator (Live/Offline)
- [x] Server health pulse indicators
- [x] Toast notifications for status changes
- [x] Activity feed timeline

### UX Improvements

- [x] Keyboard shortcuts (Ctrl+R, Ctrl+K, Escape, 1-9, ?)
- [x] Search/filter servers
- [x] Status filter buttons (All/Running/Stopped/Errors)
- [x] Drag-and-drop server ordering (with localStorage persistence)
- [x] Export/import server configurations

---

## ✅ Phase 5.5: Agent Integration (Complete)

### Agent Personality System

- [x] Agent personality configuration (`AGENT_PERSONALITY` object)
  - Name: Bambi
  - Traits: helpful, hypnotic, calming, ethereal, mystical
  - Style: gentle, mystical, and reassuring
- [x] Personality-aware fallback responses
- [x] Agent self-registration in knowledge graph on initialization
- [x] Private class fields (`#`) for proper encapsulation

### LM Studio Enhancements (`src/servers/lmstudio.js`)

- [x] `chatWithImage()` - Vision input for image analysis (LLaVA, etc.)
- [x] `chatStructured()` - JSON schema-based structured output
- [x] `executeToolLoop()` - Autonomous tool calling until completion
- [x] `autoLoadModel()` - Auto-load best model from candidates
- [x] `loadModel()` - JIT model loading via minimal request
- [x] Default model candidates: qwen3, qwen2.5, llama, mistral, gemma, phi

### Event System (`src/servers/agent.js`)

- [x] `emitEvent()` - Emit events to subscribers
- [x] `onEvent()` - Subscribe to agent events
- [x] Events: `initialized`, `message`, `toolCall`, `toolExecuted`, `chatStarted`, `chatCompleted`, `conversationCreated`, `conversationDeleted`, `conversationsCleared`

### New API Routes (`src/api/routes.js`)

- [x] `GET /api/agent/personality` - Get agent personality info
- [x] `POST /api/agent/initialize` - Initialize agent and connect to LM Studio

### Configuration Expansion (`src/utils/config.js`)

- [x] `lmstudio` section: baseUrl, host, port, model, temperature, maxTokens, timeout
- [x] `agent` section: maxIterations, maxConversations, conversationTtl, personalityName, enableToolCalling, enableKnowledgeGraph
- [x] `mcp` section: apiUrl, wsUrl, maxReconnectAttempts, reconnectInterval

### Documentation Updates

- [x] Updated `docs/AGENT.md` with agent features and LM Studio integration
- [x] Updated `docs/CHANGELOG.md` with new features

---

## ✅ Phase 5.6: Agent Parity with bambisleep-church-agent (Complete)

### Overview

Upgrade MCP Control Tower agent to feature parity with the standalone bambisleep-church-agent repository. Key features to port: ModelRouter, AgentToolExecutor, 60+ tools, and extended APIs.

### Model Router (`src/servers/model-router.js`) ✅

- [x] **Smart Model Selection** - Auto-select optimal model per task type
  - Task types: reasoning, creative, instruction, chat, toolUse, summarize
  - Model profiles with quality/speed scores
  - Context length awareness (reduce tools for small models)
  - Task detection from user message
- [x] **Model Profiles** - Benchmark-based model metadata
  - quality, speed (tokens/sec), taskScores per task
  - strengths/weaknesses arrays
  - contextLength, tier (quality/speed/balanced)
- [x] **Singleton Pattern** - `getModelRouter()` factory function

### Agent Tool Executor (`src/servers/agent-tools.js`) ✅

- [x] **AgentToolExecutor Class** - Centralized tool execution
  - MCP client fallback to local handlers
  - Render callback for WebSocket broadcast
  - Local fetch implementation for standalone mode
- [x] **98 Tools with JSON Schema** - OpenAI function calling format
  - Core tools for small context models (~1k tokens)
  - Full tool set for larger models
- [ ] **Render Commands** - Emit UI component events (Phase 6)
  - `render_card`, `render_table`, `render_form`
  - `render_alert`, `render_progress`, `render_list`, `render_code`

### Extended API Tools (30+ new tools) ✅

- [x] **Puppeteer Extended**
  - `puppeteer_launch`, `puppeteer_close`, `puppeteer_status`
  - `puppeteer_get_content`, `puppeteer_pdf`
- [x] **MongoDB Extended**
  - `mongodb_aggregate`, `mongodb_count`, `mongodb_create_index`
  - `mongodb_delete_many`, `mongodb_stats`
- [x] **SQLite Extended**
  - `sqlite_create_table`, `sqlite_update`, `sqlite_delete`
  - `sqlite_list_tables`, `sqlite_stats`
- [x] **Thinking Extended**
  - `thinking_generate_hypothesis`, `thinking_conclude`
  - `thinking_export_markdown`, `thinking_list_sessions`
- [x] **Stripe Extended**
  - `stripe_create_invoice`, `stripe_finalize_invoice`
  - `stripe_list_subscriptions`, `stripe_create_product`
  - `stripe_list_disputes`
- [x] **Clarity Extended**
  - `clarity_track_pageview`, `clarity_get_events`
  - `clarity_top_events`, `clarity_reset`
- [x] **Fetch Extended**
  - `fetch_post`, `fetch_ping`, `fetch_download_base64`
- [x] **GitHub Extended**
  - `github_create_issue`, `github_list_issues`
  - `github_list_branches`
- [x] **LM Studio Direct**
  - `lmstudio_list_models`, `lmstudio_get_loaded_model`
  - `lmstudio_generate_embeddings`

### BambiSleep Chat Integration ✅

- [x] **Trigger System** - Official BambiSleep triggers by category
- [x] **Spiral Effects** - WebGL2 GPU-accelerated hypnotic spirals
- [x] **Collar System** - Session-based collar activation
- [x] **TTS Processing** - Text-to-speech preparation
- [x] **Chat History** - Per-session message tracking

---

## ✅ Phase 6: Agentic Frontend Rendering (Complete)

### Overview

Enable BambiAgent™ to dynamically generate and render frontend components, allowing users to interact with AI-generated interfaces in real-time. Based on bambisleep-church-agent Phase 6 implementation.

### Core Infrastructure ✅

- [x] **Component Registry** - Dynamic component registration system

  - `src/dashboard/js/components/DynamicRenderer.js` - Runtime component factory
  - 7 component renderers: card, table, form, alert, progress, list, code
  - Active component state tracking (Map)
  - Action handler registry for component interactions
  - `processRenderCommand()` for WebSocket integration
  - HTML escaping, cell formatting, event attachment utilities

- [x] **Agent UI Tools** - Render tools in `src/servers/agent-tools.js`

  - `render_card` - Glass cards with variants, collapsible, actions
  - `render_table` - Data tables with sorting, pagination, row actions
  - `render_form` - Dynamic forms with validation, field types
  - `render_alert` - Alert banners (info/success/warning/error)
  - `render_progress` - Progress indicators (bar/circular/steps)
  - `render_list` - Interactive lists with badges, selection
  - `render_code` - Code blocks with line numbers, copy button
  - `render_clear` - Clear components by ID or type

- [x] **Agent Workspace Panel** - Dedicated rendering area

  - `src/dashboard/js/components/AgentWorkspace.js` - Container for dynamic content
  - Layout modes: stack, grid, columns, free positioning
  - Render history tracking (last 50 operations)
  - WebSocket integration for real-time render commands
  - `initWorkspace()`, `renderToWorkspace()`, `setLayoutMode()` APIs

- [x] **Workspace Styles** - `src/dashboard/css/components/workspace.css`
  - 800+ lines of component styles
  - Glass-card variants, data tables, forms
  - Alert banners, progress indicators, lists, code blocks
  - Responsive breakpoints for mobile

### Interactive Components ✅

- [x] **Form Builder** - Agent can create forms dynamically

  - Text inputs, textareas, selects, checkboxes, radio buttons
  - Date pickers, file inputs, hidden fields
  - Validation rules (pattern, min/max, minLength/maxLength)
  - Submit handlers with action triggers
  - Cancel button support

- [x] **Data Visualization**

  - Tables with agent-populated data (sortable columns)
  - Pagination controls with page navigation
  - Cell formatting (text, number, date, badge, link, code)
  - Row actions with button handlers

- [x] **Card Layouts** - Agent generates information cards

  - Glass-card with icon, title, content, actions
  - Variants: default, success, warning, error, info
  - Collapsible cards with toggle animation

- [x] **Interactive Wizards** - Multi-step flows
  - Agent guides user through complex operations
  - Step progress indicator with completed/active/pending states
  - Conditional branching based on user input
  - Progress tracking with steps variant
  - `render_wizard` tool with steps array
  - Embedded components (card, table, form) within steps
  - Back/Next/Complete navigation with custom labels
  - Cancel action support

### Agent Capabilities ✅

- [x] **Context-Aware Rendering** - Agent remembers rendered state

  - Track active components via `activeComponents` Map
  - `updateComponent()` for modifying existing components
  - `removeComponent()` and `clearComponents()` for cleanup
  - Component IDs for referencing in follow-up messages

- [x] **User Interaction Handling**

  - Button clicks trigger registered action handlers
  - Form submissions send data via `triggerAction()`
  - Custom event dispatch for unregistered actions
  - Collapsible card toggle, list selection, table sorting

- [x] **Template Library** - Pre-built component patterns
  - [x] CRUD interfaces template
  - [x] Search/filter panels template
  - [x] Dashboard layouts template
  - [x] Auth forms (login/signup) template
  - [x] Settings forms template
  - [x] Setup/onboarding wizards template
  - [x] Confirmation dialogs template
  - [x] Notification templates
  - [x] Template registry with generateFromTemplate()
  - [x] render_template tool
  - [x] render_crud tool
  - [x] render_dashboard tool
  - [x] render_onboarding tool

### Dashboard Integration ✅

- [x] **HTML Structure** - Agent workspace panel in index.html

  - `#agent-layout` with split chat/workspace view
  - `#agent-workspace-panel` container with controls
  - Workspace controls (layout toggle, history, clear)
  - Empty state with action prompts

- [x] **CSS Styling** - Workspace layout styles

  - `.agent-layout` flex container
  - `.agent-workspace-panel` with responsive sizing
  - Layout mode toggles (stack/grid/columns)
  - Responsive breakpoints for mobile

- [x] **JavaScript Integration** - app.js workspace functions

  - `window.Dashboard.toggleWorkspace()` - show/hide panel
  - `window.Dashboard.toggleWorkspaceHistory()` - history panel
  - `window.Dashboard.clearWorkspace()` - clear content
  - `window.Dashboard.setWorkspaceLayout()` - layout modes
  - `initWorkspace()` called on DOMContentLoaded

- [x] **WebSocket Integration** - Real-time render messages

  - Frontend `websocket.js` handles render message types
  - `processRenderCommand()` routes to DynamicRenderer
  - Support for all component types (card, table, form, etc.)
  - `render:clear` message handling

- [x] **API Routes** - Render endpoints in routes.js

  - `POST /api/agent/render` - Generic render command
  - `POST /api/agent/render/card` - Render card
  - `POST /api/agent/render/table` - Render table
  - `POST /api/agent/render/form` - Render form
  - `POST /api/agent/render/alert` - Render alert
  - `POST /api/agent/render/progress` - Render progress
  - `POST /api/agent/render/list` - Render list
  - `POST /api/agent/render/code` - Render code
  - `POST /api/agent/render/clear` - Clear workspace

- [x] **OpenAPI Documentation** - Render routes documented
  - Schema definitions for all render payloads
  - Request/response examples
  - Parameter descriptions

### Security & Sandboxing ✅

- [x] **Safe Rendering** - Prevent XSS and injection

  - `escapeHtml()` for all user-provided content
  - No eval() or Function() constructors
  - Template literals with escaped interpolation

- [x] **Rate Limiting** - Prevent UI spam
  - Max 50 components at once (maxComponents)
  - Max 60 renders per minute (maxRendersPerMinute)
  - Burst limit of 5 renders per second (maxRendersPerSecond)
  - 200ms throttle delay between renders
  - Render queue for throttled requests
  - `getRateLimitStats()` for monitoring
  - `setRateLimitConfig()` for customization
  - Automatic rejection when over limits

---

## ✅ Phase 7: WebGL Avatar & Voice (Complete)

### Overview

Port the WebGL avatar and voice synthesis systems from bambisleep-church-agent for a fully immersive experience.

### WebGL Avatar (`src/dashboard/js/avatar-webgl.js`) ✅

- [x] **GPU-Accelerated Face Rendering**
  - Fragment shader with SDF face geometry
  - Elven female avatar with pointed ears
  - Dynamic expressions (-1 sad to +1 happy)
- [x] **Lip Sync Animation**
  - `setMouthOpen(0-1)` for speech sync
  - Phoneme-based mouth movement
  - `startSpeaking()` / `stopSpeaking()` modes
- [x] **Eye Tracking**
  - Follow mouse cursor
  - Natural blink cycles (4s interval)
- [x] **Bambi Expressions**
  - `happy()` - "Good girl" trigger response
  - `sleepy()` - "Bambi sleep" trigger
  - `alert()` - "Bambi wake" trigger
  - `reset()` - "Bambi reset" trigger
  - `confused()` - "Blonde moment" trigger
  - `comfort()` - "Safe and secure" trigger
  - `giggle()` - Playful bubbly response
- [x] **Theme Support**
  - Neon mode (dark + glowing)
  - Inverted mode (light)

### Voice Synthesis (`src/dashboard/js/speech.js`) ✅

- [x] **Web Speech API Integration**
  - Female voice preference (Zira, Samantha)
  - Phoneme-based lip sync callback
- [x] **Voice Presets**
  - 🌸 Bambi (bubbly, rate: 1.05, pitch: 1.2)
  - 🤖 Machine (synthetic, rate: 0.95, pitch: 0.85)
  - ⚡ Robot (deep, rate: 0.8, pitch: 0.7)
  - 👩 Human (natural, rate: 1.0, pitch: 1.1)
  - 🌙 Whisper (soft, rate: 0.85, pitch: 0.95)
- [x] **Speech Controller**
  - `speak(text, options)` with interrupt support
  - Lip sync interval callbacks
  - Queue management

### Avatar Controller (`src/dashboard/js/components/AvatarController.js`) ✅

- [x] **Integration Component**
  - Unified control panel UI
  - Expression buttons
  - Voice preset selector
  - Theme toggle
  - Test speech interface
- [x] **Agent Integration**
  - 6 new agent tools: `avatar_set_expression`, `avatar_speak`, `avatar_stop_speaking`, `avatar_set_theme`, `avatar_start`, `avatar_stop`
  - WebSocket integration for real-time control
  - Dashboard section with avatar canvas

### Styling (`src/dashboard/css/components/avatar.css`) ✅

- [x] Glass morphism avatar panel
- [x] Responsive canvas layout
- [x] Expression button grid
- [x] Speech test interface
- [x] Theme-aware styling
- [x] Mobile responsive breakpoints

---

## ✅ Phase 7B: Memory & Persistence (Complete)

### Overview

Comprehensive memory system enabling long-term learning, user preference retention, conversation summarization, and cross-session context. See `docs/MEMORY_PERSISTENCE_GAMEPLAN.md` for full architecture.

### Phase A: Schema & Types (Foundation) ✅

- [x] **`src/servers/memory-schema.js`** (~490 lines)
  - [x] `ENTITY_TYPES` constant - 12 entity type definitions
  - [x] `RELATION_TYPES` constant - 15 relation type definitions
  - [x] `OBSERVATION_SOURCES` constant - 7 source types
  - [x] `formatObservation(key, value, source, confidence)` utility
  - [x] `parseObservation(observationString)` parser
  - [x] `validateEntity(entity, type)` validation
  - [x] `calculateConfidence(source, age, occurrences)` scoring
  - [x] `applyDecay(confidence, daysSince, halfLife)` decay algorithm

### Phase B: User Model System ✅

- [x] **`src/servers/user-model.js`** (~664 lines)
  - [x] `UserPreferences` class
    - [x] `get(category, key)` - Get preference value
    - [x] `set(category, key, value, source)` - Set explicit preference
    - [x] `learn(category, key, value, confidence)` - Learn from behavior
    - [x] `getAll(category?)` - Get all preferences
    - [x] `export()` - Export preferences to JSON
  - [x] `UserPatterns` class
    - [x] `track(patternName, data)` - Record pattern occurrence
    - [x] `detect(behaviorData)` - Auto-detect patterns
    - [x] `get(patternName)` - Get pattern data
    - [x] `getConfident(minConfidence)` - Get high-confidence patterns
    - [x] `decay()` - Apply time-based decay
  - [x] `UserProfile` class
    - [x] `get(field)` - Get profile field
    - [x] `set(field, value)` - Set profile field
    - [x] `getExpertise(domain)` - Get skill level
    - [x] `updateExpertise(domain, level)` - Update skill
    - [x] `getCommunicationStyle()` - Get style preference
  - [x] `userModelHandlers` - API export
- [x] **`tests/servers/user-model.test.js`** (~280 lines)

### Phase C: Conversation Memory ✅

- [x] **`src/servers/conversation-memory.js`** (~813 lines)
  - [x] `ConversationStore` class
    - [x] `startSession()` - Begin new conversation
    - [x] `endSession(summary?)` - End with optional summary
    - [x] `addMessage(role, content, metadata)` - Add message
    - [x] `getSession(sessionId)` - Get session by ID
    - [x] `getSessions(filter)` - Query sessions
    - [x] `getRecentContext(limit)` - Get recent messages
  - [x] `Summarizer` class (LM Studio integration)
    - [x] `summarizeSession(sessionId)` - Summarize one session
    - [x] `summarizePeriod(start, end)` - Summarize date range
    - [x] `extractKeyPoints(messages)` - Extract key points
    - [x] `extractDecisions(messages)` - Extract decisions
    - [x] `compressToTokenLimit(text, maxTokens)` - Compress
  - [x] `ContextManager` class
    - [x] `getCurrentContext()` - Get active context
    - [x] `updateContext(key, value)` - Update context
    - [x] `getActiveTopics()` - Get current topics
    - [x] `getPendingTasks()` - Get open tasks
    - [x] `buildPromptContext(maxTokens)` - Build for LLM
  - [x] `conversationHandlers` - API export
- [x] **`tests/servers/conversation-memory.test.js`** (~310 lines)

### Phase D: Workspace Memory ✅

- [x] **`src/servers/workspace-memory.js`** (~654 lines)
  - [x] `ProjectTracker` class
    - [x] `analyzeProject(path)` - Analyze project structure
    - [x] `getProject(name)` - Get project by name
    - [x] `updateProject(name, data)` - Update project info
    - [x] `getStructure(name)` - Get project structure
    - [x] `getConventions(name)` - Get project conventions
  - [x] `FileKnowledge` class
    - [x] `learnFile(path, analysis)` - Store file knowledge
    - [x] `getFile(path)` - Get file knowledge
    - [x] `getFilesByPurpose(purpose)` - Search by purpose
    - [x] `getDependencies(path)` - Get file dependencies
    - [x] `getRecentlyModified(limit)` - Get recent files
  - [x] `PatternLearner` class
    - [x] `learnPattern(name, examples)` - Learn code pattern
    - [x] `getPattern(name)` - Get pattern
    - [x] `matchPattern(code)` - Match against patterns
    - [x] `getProjectPatterns(projectName)` - Get project patterns
  - [x] `workspaceHandlers` - API export
- [x] **`tests/servers/workspace-memory.test.js`** (~280 lines)

### Phase E: Memory Manager ✅

- [x] **`src/servers/memory-manager.js`** (~790 lines)
  - [x] `MemoryLifecycle` class
    - [x] `applyDecay()` - Apply confidence decay
    - [x] `cleanup(threshold)` - Remove low-confidence items
    - [x] `archive(olderThan)` - Archive old memories
    - [x] `restore(entityNames)` - Restore from archive
    - [x] `getStats()` - Get memory statistics
  - [x] `MemorySearch` class
    - [x] `search(query, options)` - Full-text search
    - [x] `searchByType(entityType, query)` - Type-filtered search
    - [x] `searchByTimeRange(start, end)` - Time-based search
    - [x] `searchByConfidence(min, max)` - Confidence range
    - [x] `getRelated(entityName, depth)` - Graph traversal
  - [x] `MemorySync` class
    - [x] `saveToMongoDB()` - Persist to MongoDB
    - [x] `loadFromMongoDB()` - Load from MongoDB
    - [x] `saveToFile(path)` - Backup to file
    - [x] `loadFromFile(path)` - Restore from file
    - [x] `getLastSyncTime()` - Get sync status
  - [x] `memoryManagerHandlers` - API export
- [x] **`tests/servers/memory-manager.test.js`** (~320 lines)

### Phase F: API & Tools ✅

- [x] **REST API Routes** (30+ endpoints in `routes.js`)
  - [x] User Model Routes
    - [x] `GET /api/user/profile`
    - [x] `PUT /api/user/profile`
    - [x] `GET /api/user/preferences`
    - [x] `PUT /api/user/preferences/:category`
    - [x] `GET /api/user/patterns`
    - [x] `GET /api/user/patterns/:name`
    - [x] `POST /api/user/patterns`
    - [x] `POST /api/user/expertise`
  - [x] Conversation Routes
    - [x] `GET /api/conversation/current`
    - [x] `GET /api/conversation/sessions`
    - [x] `POST /api/conversation/sessions`
    - [x] `GET /api/conversation/sessions/:id`
    - [x] `POST /api/conversation/sessions/:id/end`
    - [x] `POST /api/conversation/sessions/:id/summarize`
    - [x] `GET /api/conversation/summaries`
    - [x] `GET /api/conversation/context`
    - [x] `PUT /api/conversation/context`
    - [x] `GET /api/conversation/topics`
    - [x] `GET /api/conversation/tasks`
  - [x] Workspace Routes
    - [x] `GET /api/workspace/projects`
    - [x] `POST /api/workspace/projects`
    - [x] `GET /api/workspace/projects/:name`
    - [x] `GET /api/workspace/projects/:name/conventions`
    - [x] `GET /api/workspace/files`
    - [x] `POST /api/workspace/files`
    - [x] `GET /api/workspace/patterns`
    - [x] `POST /api/workspace/patterns`
  - [x] Memory Manager Routes
    - [x] `GET /api/memory/stats`
    - [x] `POST /api/memory/search/advanced`
    - [x] `GET /api/memory/related/:name`
    - [x] `POST /api/memory/decay`
    - [x] `POST /api/memory/cleanup`
    - [x] `POST /api/memory/archive`
    - [x] `POST /api/memory/restore`
    - [x] `POST /api/memory/sync`
    - [x] `POST /api/memory/sync/load`
    - [x] `POST /api/memory/export`
    - [x] `POST /api/memory/import`
- [x] **Agent Tools** (30+ tools in `agent-tools.js`)
  - [x] User Model Tools
    - [x] `user_get_preference` / `user_set_preference`
    - [x] `user_learn_preference` / `user_track_pattern`
    - [x] `user_get_patterns` / `user_get_profile`
    - [x] `user_update_profile` / `user_get_expertise`
    - [x] `user_update_expertise`
  - [x] Conversation Tools
    - [x] `conversation_start_session` / `conversation_end_session`
    - [x] `conversation_add_message` / `conversation_get_context`
    - [x] `conversation_update_context` / `conversation_get_history`
    - [x] `conversation_summarize` / `conversation_get_topics`
    - [x] `conversation_get_tasks` / `conversation_search`
  - [x] Workspace Tools
    - [x] `workspace_analyze_project` / `workspace_get_project`
    - [x] `workspace_get_conventions` / `workspace_learn_file`
    - [x] `workspace_get_file` / `workspace_find_files`
    - [x] `workspace_learn_pattern` / `workspace_get_patterns`
  - [x] Memory Manager Tools
    - [x] `memory_get_stats` / `memory_search_advanced`
    - [x] `memory_get_related` / `memory_apply_decay`
    - [x] `memory_cleanup` / `memory_archive`
    - [x] `memory_sync_mongo` / `memory_load_mongo`
    - [x] `memory_export_file` / `memory_import_file`
- [x] **OpenAPI Spec Updates** (`openapi.js`) - 40+ new route definitions

### Phase G: Dashboard Integration ✅

- [x] **`src/dashboard/js/components/MemoryDashboard.js`** (~700 lines)
  - [x] `renderMemoryDashboard()` - Main container with tabs
  - [x] `renderUserPreferences()` - Preferences editor
  - [x] `renderPatternsList()` - Detected patterns grid
  - [x] `renderConversationHistory()` - History timeline
  - [x] `renderMemoryStats()` - Statistics panel
  - [x] `renderMemorySearch()` - Search interface with filters
  - [x] `initMemoryDashboard()` - Controller with API integration
- [x] **`src/dashboard/css/components/memory.css`** (~500 lines)
  - [x] `.memory-dashboard` styles
  - [x] `.preference-editor` styles
  - [x] `.pattern-card` styles
  - [x] `.conversation-timeline` styles
  - [x] `.memory-search` styles
- [x] **Documentation** - `docs/MEMORY_MCP_REFERENCE.md` (~700 lines)

---

## ✅ Phase 7: WebGL Avatar & Voice (Complete)

### Overview

Implement GPU-accelerated WebGL avatar with voice synthesis and lip sync for the dashboard. Bambi Avatar with 7 expressions, eye tracking, and Kokoro neural TTS integration.

### WebGL Avatar System ✅

- [x] **`src/dashboard/js/avatar-webgl.js`** (~700 lines)
  - [x] WebGL 2.0 canvas context initialization
  - [x] SDF (Signed Distance Field) fragment shaders for face rendering
  - [x] Eye tracking with mouse position following
  - [x] Automatic blink cycle (4 second intervals)
  - [x] Smooth mouth animations with phoneme-based lip sync
  - [x] 7 Expression methods:
    - [x] `happy()` - Bambi smile
    - [x] `sleepy()` - Drowsy half-closed eyes
    - [x] `alert()` - Wide-eyed attention
    - [x] `reset()` - Neutral expression
    - [x] `confused()` - Tilted eyebrows
    - [x] `comfort()` - Gentle reassuring look
    - [x] `giggle()` - Joyful animated eyes
  - [x] Theme support (neon/inverted)
  - [x] `setMouthOpen(amount)` - Dynamic mouth control (0.0 - 1.0)
  - [x] `setTheme(themeName)` - Switch color palettes
  - [x] `start()` / `stop()` - Render loop control

### Speech Synthesis System ✅

- [x] **`src/dashboard/js/speech.js`** (~635 lines)
  - [x] **Kokoro TTS Integration** (Primary)
    - [x] HTTP client for Kokoro-FastAPI server (192.168.0.122:8880)
    - [x] OpenAI-compatible API format (`/v1/audio/speech`)
    - [x] 12 female voices (af_bella, af_nova, af_sky, etc.)
    - [x] Audio blob response handling with object URL cleanup
    - [x] Health check with 5s timeout and automatic fallback
    - [x] Duration-based lip sync timing (accurate phoneme delays)
    - [x] HTTP keep-alive for connection reuse
    - [x] 30s request timeout with AbortController
  - [x] **Web Speech API Fallback**
    - [x] Browser built-in TTS when Kokoro unavailable
    - [x] Voice selection (Zira, Samantha, etc.)
    - [x] Boundary event-based lip sync (less accurate)
  - [x] **5 Voice Presets** with Kokoro mapping
    - [x] `bambi` (af_bella, 0.95 speed) - Bright cheerful
    - [x] `machine` (af_alloy, 0.85 speed) - Balanced neutral
    - [x] `robot` (af_nova, 0.80 speed) - Clear precise
    - [x] `human` (af_aoede, 0.90 speed) - Natural conversational
    - [x] `whisper` (af_sky, 0.70 speed) - Soft gentle
  - [x] **Lip Sync Engine**
    - [x] Phoneme analysis (vowel/consonant detection)
    - [x] Mouth open mapping (a=0.8, e=0.4, i=0.2, o=0.6, u=0.5)
    - [x] Duration-aware timing for Kokoro audio
    - [x] Callback system to avatar `setMouthOpen()`
  - [x] **Queue Management**
    - [x] Sequential processing of speech requests
    - [x] Stop/pause/resume controls
    - [x] Automatic audio cleanup (revoke object URLs)
  - [x] **Status API**
    - [x] `isKokoroAvailable()` - Check Kokoro health
    - [x] `recheckKokoro()` - Manual health recheck
    - [x] `getStatus()` - Comprehensive status info
    - [x] `getVoices()` - List Kokoro + Web Speech voices

### Avatar Controller Integration ✅

- [x] **`src/dashboard/js/components/AvatarController.js`** (~420 lines)
  - [x] `renderAvatarPanel()` - HTML generator with controls
  - [x] UI Controls:
    - [x] Avatar toggle (▶️/⏸️)
    - [x] Theme selector (neon/inverted)
    - [x] Voice preset selector (5 presets)
    - [x] Kokoro health check button (🎤)
    - [x] Expression buttons (7 expressions)
    - [x] Test speech input with Enter key support
    - [x] Stop speech button
  - [x] `AvatarController` class
    - [x] `init()` - Initialize avatar and speech systems
    - [x] `speak(text, options)` - Speak with lip sync
    - [x] `setExpression(name)` - Change expression
    - [x] `start()` / `stop()` - Control rendering
    - [x] `#updateKokoroStatus()` - Display Kokoro status
  - [x] Kokoro status indicator
    - [x] "🌸 Kokoro TTS: Online (http://192.168.0.122:8880)"
    - [x] "⚠️ Kokoro TTS: Offline - Using Web Speech fallback"
  - [x] Event listeners for all UI controls
  - [x] Integration with WebGLAvatar and SpeechController

### Dashboard Integration ✅

- [x] **HTML** (`src/dashboard/index.html`)
  - [x] Avatar navigation item in sidebar
  - [x] Avatar section container (`section-avatar`)
  - [x] Canvas element placeholder
- [x] **CSS** (`src/dashboard/css/components/avatar.css`) (~250 lines)
  - [x] `.avatar-panel` glass card styling
  - [x] `.avatar-canvas` 400x400 responsive canvas
  - [x] `.avatar-controls` header with selects and buttons
  - [x] `.expression-buttons` grid layout (4 columns)
  - [x] `.test-controls` flex layout for input/buttons
  - [x] `.kokoro-status` status text styling
  - [x] Responsive breakpoints for mobile (<768px)
- [x] **JavaScript** (`src/dashboard/js/app.js`)
  - [x] Import AvatarController
  - [x] Initialize on DOMContentLoaded
  - [x] Lazy loading when avatar section activated
- [x] **Components Export** (`src/dashboard/js/components/index.js`)
  - [x] Export `AvatarController` from index

### Agent Tool Integration ✅

- [x] **6 Avatar Agent Tools** (`src/servers/agent-tools.js`)
  - [x] `avatar_set_expression(expression)` - Set expression
  - [x] `avatar_speak(text, preset, interrupt)` - Speak text
  - [x] `avatar_stop_speaking()` - Stop speech
  - [x] `avatar_set_theme(theme)` - Change theme
  - [x] `avatar_start()` - Start rendering
  - [x] `avatar_stop()` - Stop rendering
- [x] **WebSocket Render Commands**
  - [x] Broadcast to dashboard clients via WebSocket
  - [x] `AgentToolExecutor#executeRenderCommand()` handler
  - [x] Command type: `{ type: 'render', command, payload }`

### Documentation ✅

- [x] **`docs/AVATAR_SYSTEM.md`** (~520 lines)
  - [x] Architecture overview with diagrams
  - [x] WebGL avatar API reference
  - [x] Speech synthesis API reference
  - [x] Avatar controller API reference
  - [x] Agent tools reference
  - [x] WebSocket integration patterns
  - [x] Usage examples (basic, avatar control, agent integration)
  - [x] Troubleshooting guide (WebGL errors, speech errors, lip sync issues)
  - [x] Performance optimization tips
  - [x] Browser compatibility matrix
- [x] **`docs/KOKORO_INTEGRATION.md`** (~650 lines)
  - [x] Kokoro-FastAPI architecture overview
  - [x] Configuration (server location, settings, presets)
  - [x] 12 available Kokoro voices with descriptions
  - [x] SpeechController API reference (all 15 methods)
  - [x] Kokoro API protocol (health check, speech generation)
  - [x] Integration examples (basic usage, avatar integration, custom config)
  - [x] Lip sync system (phoneme analysis, mapping, duration timing)
  - [x] Fallback behavior (5 fallback scenarios with indicators)
  - [x] Troubleshooting (Kokoro unavailable, lip sync quality, performance, playback)
  - [x] Performance optimization (connection reuse, queueing, cleanup)
  - [x] Security considerations (network access, CORS, audio data)
  - [x] Future enhancements (WebSocket streaming, voice cloning, SSML, caching)

### Testing & Validation ✅

- [x] Avatar renders successfully on dashboard
- [x] All 7 expressions functional
- [x] Eye tracking follows mouse cursor
- [x] Blink cycle runs at 4s intervals
- [x] Kokoro TTS health check on initialization
- [x] Speech plays with accurate lip sync (Kokoro)
- [x] Fallback to Web Speech when Kokoro offline
- [x] UI shows correct Kokoro status
- [x] All 5 voice presets work
- [x] Expression buttons trigger avatar changes
- [x] Test speech input functional
- [x] Stop button interrupts speech
- [x] Theme selector changes colors
- [x] Kokoro check button rechecks health
- [x] Agent tools integrate via WebSocket

### TODO.md Updates ✅

- [x] Mark Phase 7 as complete
- [x] Update progress table
- [x] Add Kokoro integration details

---

## 🔮 Phase 8: Multi-Modal Support (Future)

### Media Generation & Handling

- [ ] Image generation tool (HuggingFace Stable Diffusion)
- [ ] Audio playback for responses
- [ ] File upload/download handling
- [ ] Drag-and-drop interface elements

### Collaboration Features

- [ ] Shared agent workspaces
- [ ] Export/import agent sessions
- [ ] Component sharing library
- [ ] Team dashboards

---

## 📝 Progress Summary

| Category             | Status      | Progress                           |
| -------------------- | ----------- | ---------------------------------- |
| MCP Server Wrappers  | ✅ Complete | 14/14 (incl. BambiSleep Chat)      |
| REST API Endpoints   | ✅ Complete | 120+ endpoints                     |
| Dashboard UI         | ✅ Complete | Cyber goth design                  |
| Agent Orchestrator   | ✅ Complete | 138 tools + ModelRouter            |
| Agent Personality    | ✅ Complete | Bambi + event system               |
| LM Studio Client     | ✅ Complete | Vision, structured, tools          |
| Agent Chat UI        | ✅ Complete | Full conversation UI               |
| WebSocket            | ✅ Complete | Real-time updates                  |
| Unit Tests           | ✅ Complete | 94+ unit tests, 84%+ cov           |
| BambiSleep Chat      | ✅ Complete | Triggers, spirals, TTS             |
| Agent Parity         | ✅ Complete | Phase 5.6 (102 tools, ModelRouter) |
| Agentic Rendering    | ✅ Complete | Phase 6 (13 tools, 8 components)   |
| Memory & Persistence | ✅ Complete | Phase 7B (5 modules, 40 routes)    |
| WebGL Avatar & Voice | ✅ Complete | Phase 7 (WebGL, Speech, 6 tools)   |

---

## 🎯 Phase 7B Milestones (Complete ✅)

| Milestone              | Target  | Status      |
| ---------------------- | ------- | ----------- |
| memory-schema.js       | Phase A | ✅ Complete |
| user-model.js          | Phase B | ✅ Complete |
| conversation-memory.js | Phase C | ✅ Complete |
| workspace-memory.js    | Phase D | ✅ Complete |
| memory-manager.js      | Phase E | ✅ Complete |
| API Routes (40+)       | Phase F | ✅ Complete |
| Agent Tools (30+)      | Phase F | ✅ Complete |
| MemoryDashboard.js     | Phase G | ✅ Complete |
| memory.css             | Phase G | ✅ Complete |
| Unit Tests             | Phase G | 🔜 Planned  |

---

## 🛠️ Technical Notes

### Memory Entity Type Schema

```javascript
// Entity type prefixes for compartmentalization
const ENTITY_TYPES = {
  // User data
  USER_PROFILE: "user:profile",
  USER_PREFERENCE: "user:preference",
  USER_PATTERN: "user:pattern",
  USER_EXPERTISE: "user:expertise",

  // Conversation data
  CONVERSATION_SESSION: "conversation:session",
  CONVERSATION_SUMMARY: "conversation:summary",
  CONVERSATION_CONTEXT: "conversation:context",

  // Workspace data
  WORKSPACE_PROJECT: "workspace:project",
  WORKSPACE_FILE: "workspace:file",
  WORKSPACE_PATTERN: "workspace:pattern",

  // Memory metadata
  MEMORY_INDEX: "memory:index",
  MEMORY_STATS: "memory:stats",
};
```

### Observation Format Standard

```javascript
// All observations are timestamped with metadata
const observation = "[2024-01-02T10:30:00Z] prefers dark mode";

// Structured observations use key: value format
const structured = [
  "[timestamp] key: theme",
  "[timestamp] value: dark",
  "[timestamp] source: explicit_setting",
  "[timestamp] confidence: 1.0",
];
```

### Confidence Scoring

| Source Type        | Base Confidence | Decay Half-Life |
| ------------------ | --------------- | --------------- |
| explicit_setting   | 1.0             | Never           |
| user_correction    | 0.95            | 180 days        |
| direct_statement   | 0.9             | 90 days         |
| repeated_behavior  | 0.7-0.9         | 30 days         |
| single_observation | 0.5             | 14 days         |
| inference          | 0.3-0.7         | 7 days          |
| default            | 0.1             | Never           |
