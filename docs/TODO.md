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

## 🔮 Phase 7: WebGL Avatar & Voice (Future)

### Overview

Port the WebGL avatar and voice synthesis systems from bambisleep-church-agent for a fully immersive experience.

### WebGL Avatar (`src/dashboard/js/avatar-webgl.js`)

- [ ] **GPU-Accelerated Face Rendering**
  - Fragment shader with SDF face geometry
  - Elven female avatar with pointed ears
  - Dynamic expressions (-1 sad to +1 happy)
- [ ] **Lip Sync Animation**
  - `setMouthOpen(0-1)` for speech sync
  - Phoneme-based mouth movement
  - `startSpeaking()` / `stopSpeaking()` modes
- [ ] **Eye Tracking**
  - Follow mouse cursor
  - Natural blink cycles (4s interval)
- [ ] **Bambi Expressions**
  - `happy()` - "Good girl" trigger response
  - `sleepy()` - "Bambi sleep" trigger
  - `alert()` - "Bambi wake" trigger
  - `reset()` - "Bambi reset" trigger
  - `confused()` - "Blonde moment" trigger
  - `comfort()` - "Safe and secure" trigger
  - `giggle()` - Playful bubbly response
- [ ] **Theme Support**
  - Neon mode (dark + glowing)
  - Inverted mode (light)

### Voice Synthesis (`src/dashboard/js/speech.js`)

- [ ] **Web Speech API Integration**
  - Female voice preference (Zira, Samantha)
  - Phoneme-based lip sync callback
- [ ] **Voice Presets**
  - 🌸 Bambi (bubbly, rate: 1.05, pitch: 1.2)
  - 🤖 Machine (synthetic, rate: 0.95, pitch: 0.85)
  - ⚡ Robot (deep, rate: 0.8, pitch: 0.7)
  - 👩 Human (natural, rate: 1.0, pitch: 1.1)
  - 🌙 Whisper (soft, rate: 0.85, pitch: 0.95)
- [ ] **Speech Controller**
  - `speak(text, options)` with interrupt support
  - Lip sync interval callbacks
  - Queue management

---

## 🚀 Phase 7B: Memory & Persistence (Current)

### Overview

Comprehensive memory system enabling long-term learning, user preference retention, conversation summarization, and cross-session context. See `docs/MEMORY_PERSISTENCE_GAMEPLAN.md` for full architecture.

### Phase A: Schema & Types (Foundation)

- [ ] **`src/servers/memory-schema.js`** (~300 lines)
  - [ ] `ENTITY_TYPES` constant - 12 entity type definitions
  - [ ] `RELATION_TYPES` constant - 15 relation type definitions
  - [ ] `OBSERVATION_SOURCES` constant - 7 source types
  - [ ] `formatObservation(key, value, source, confidence)` utility
  - [ ] `parseObservation(observationString)` parser
  - [ ] `validateEntity(entity, type)` validation
  - [ ] `calculateConfidence(source, age, occurrences)` scoring
  - [ ] `applyDecay(confidence, daysSince, halfLife)` decay algorithm

### Phase B: User Model System

- [ ] **`src/servers/user-model.js`** (~500 lines)
  - [ ] `UserPreferences` class
    - [ ] `get(category, key)` - Get preference value
    - [ ] `set(category, key, value, source)` - Set explicit preference
    - [ ] `learn(category, key, value, confidence)` - Learn from behavior
    - [ ] `getAll(category?)` - Get all preferences
    - [ ] `export()` - Export preferences to JSON
  - [ ] `UserPatterns` class
    - [ ] `track(patternName, data)` - Record pattern occurrence
    - [ ] `detect(behaviorData)` - Auto-detect patterns
    - [ ] `get(patternName)` - Get pattern data
    - [ ] `getConfident(minConfidence)` - Get high-confidence patterns
    - [ ] `decay()` - Apply time-based decay
  - [ ] `UserProfile` class
    - [ ] `get(field)` - Get profile field
    - [ ] `set(field, value)` - Set profile field
    - [ ] `getExpertise(domain)` - Get skill level
    - [ ] `updateExpertise(domain, level)` - Update skill
    - [ ] `getCommunicationStyle()` - Get style preference
  - [ ] `userModelHandlers` - API export
- [ ] **`tests/servers/user-model.test.js`** (~200 lines)

### Phase C: Conversation Memory

- [ ] **`src/servers/conversation-memory.js`** (~600 lines)
  - [ ] `ConversationStore` class
    - [ ] `startSession()` - Begin new conversation
    - [ ] `endSession(summary?)` - End with optional summary
    - [ ] `addMessage(role, content, metadata)` - Add message
    - [ ] `getSession(sessionId)` - Get session by ID
    - [ ] `getSessions(filter)` - Query sessions
    - [ ] `getRecentContext(limit)` - Get recent messages
  - [ ] `Summarizer` class (LM Studio integration)
    - [ ] `summarizeSession(sessionId)` - Summarize one session
    - [ ] `summarizePeriod(start, end)` - Summarize date range
    - [ ] `extractKeyPoints(messages)` - Extract key points
    - [ ] `extractDecisions(messages)` - Extract decisions
    - [ ] `compressToTokenLimit(text, maxTokens)` - Compress
  - [ ] `ContextManager` class
    - [ ] `getCurrentContext()` - Get active context
    - [ ] `updateContext(key, value)` - Update context
    - [ ] `getActiveTopics()` - Get current topics
    - [ ] `getPendingTasks()` - Get open tasks
    - [ ] `buildPromptContext(maxTokens)` - Build for LLM
  - [ ] `conversationHandlers` - API export
- [ ] **`tests/servers/conversation-memory.test.js`** (~250 lines)

### Phase D: Workspace Memory

- [ ] **`src/servers/workspace-memory.js`** (~400 lines)
  - [ ] `ProjectTracker` class
    - [ ] `analyzeProject(path)` - Analyze project structure
    - [ ] `getProject(name)` - Get project by name
    - [ ] `updateProject(name, data)` - Update project info
    - [ ] `getStructure(name)` - Get project structure
    - [ ] `getConventions(name)` - Get project conventions
  - [ ] `FileKnowledge` class
    - [ ] `learnFile(path, analysis)` - Store file knowledge
    - [ ] `getFile(path)` - Get file knowledge
    - [ ] `getFilesByPurpose(purpose)` - Search by purpose
    - [ ] `getDependencies(path)` - Get file dependencies
    - [ ] `getRecentlyModified(limit)` - Get recent files
  - [ ] `PatternLearner` class
    - [ ] `learnPattern(name, examples)` - Learn code pattern
    - [ ] `getPattern(name)` - Get pattern
    - [ ] `matchPattern(code)` - Match against patterns
    - [ ] `getProjectPatterns(projectName)` - Get project patterns
  - [ ] `workspaceHandlers` - API export
- [ ] **`tests/servers/workspace-memory.test.js`** (~150 lines)

### Phase E: Memory Manager

- [ ] **`src/servers/memory-manager.js`** (~500 lines)
  - [ ] `MemoryLifecycle` class
    - [ ] `applyDecay()` - Apply confidence decay
    - [ ] `cleanup(threshold)` - Remove low-confidence items
    - [ ] `archive(olderThan)` - Archive old memories
    - [ ] `restore(entityNames)` - Restore from archive
    - [ ] `getStats()` - Get memory statistics
  - [ ] `MemorySearch` class
    - [ ] `search(query, options)` - Full-text search
    - [ ] `searchByType(entityType, query)` - Type-filtered search
    - [ ] `searchByTimeRange(start, end)` - Time-based search
    - [ ] `searchByConfidence(min, max)` - Confidence range
    - [ ] `getRelated(entityName, depth)` - Graph traversal
  - [ ] `MemorySync` class
    - [ ] `saveToMongoDB()` - Persist to MongoDB
    - [ ] `loadFromMongoDB()` - Load from MongoDB
    - [ ] `saveToFile(path)` - Backup to file
    - [ ] `loadFromFile(path)` - Restore from file
    - [ ] `getLastSyncTime()` - Get sync status
  - [ ] `memoryManagerHandlers` - API export
- [ ] **`tests/servers/memory-manager.test.js`** (~200 lines)

### Phase F: API & Tools

- [ ] **REST API Routes** (20+ endpoints in `routes.js`)
  - [ ] User Model Routes
    - [ ] `GET /api/user/profile`
    - [ ] `PUT /api/user/profile`
    - [ ] `GET /api/user/preferences`
    - [ ] `PUT /api/user/preferences/:category`
    - [ ] `GET /api/user/patterns`
    - [ ] `GET /api/user/patterns/:name`
  - [ ] Conversation Routes
    - [ ] `GET /api/conversation/current`
    - [ ] `GET /api/conversation/sessions`
    - [ ] `GET /api/conversation/sessions/:id`
    - [ ] `POST /api/conversation/sessions/:id/summarize`
    - [ ] `GET /api/conversation/summaries`
    - [ ] `GET /api/conversation/context`
  - [ ] Workspace Routes
    - [ ] `GET /api/workspace/projects`
    - [ ] `GET /api/workspace/projects/:name`
    - [ ] `GET /api/workspace/files/:path`
  - [ ] Memory Manager Routes
    - [ ] `GET /api/memory/search`
    - [ ] `GET /api/memory/stats`
    - [ ] `POST /api/memory/sync`
    - [ ] `POST /api/memory/cleanup`
    - [ ] `POST /api/memory/decay`
- [ ] **Agent Tools** (20+ tools in `agent-tools.js`)
  - [ ] User Model Tools
    - [ ] `get_user_preference` / `set_user_preference`
    - [ ] `learn_user_preference` / `track_user_pattern`
    - [ ] `get_user_patterns` / `get_user_profile`
    - [ ] `update_user_expertise`
  - [ ] Conversation Tools
    - [ ] `get_conversation_context` / `update_conversation_context`
    - [ ] `get_conversation_history` / `search_conversations`
    - [ ] `get_pending_tasks` / `mark_task_complete`
  - [ ] Workspace Tools
    - [ ] `get_project_context` / `learn_file_purpose`
    - [ ] `get_file_knowledge` / `find_files_by_purpose`
    - [ ] `learn_code_pattern`
  - [ ] Memory Manager Tools
    - [ ] `search_memory` / `get_related_memories`
    - [ ] `get_memory_stats` / `sync_memory`
- [ ] **OpenAPI Spec Updates** (`openapi.js`)

### Phase G: Dashboard Integration

- [ ] **`src/dashboard/js/components/MemoryDashboard.js`** (~300 lines)
  - [ ] `renderMemoryDashboard()` - Main container
  - [ ] `renderUserPreferences()` - Preferences editor
  - [ ] `renderPatternsList()` - Detected patterns
  - [ ] `renderConversationHistory()` - History timeline
  - [ ] `renderMemoryStats()` - Statistics panel
  - [ ] `renderMemorySearch()` - Search interface
- [ ] **`src/dashboard/css/components/memory.css`** (~200 lines)
  - [ ] `.memory-dashboard` styles
  - [ ] `.preference-editor` styles
  - [ ] `.pattern-card` styles
  - [ ] `.conversation-timeline` styles
  - [ ] `.memory-search` styles
- [ ] **Documentation** - `docs/MEMORY_MCP_REFERENCE.md`

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

| Category            | Status         | Progress                            |
| ------------------- | -------------- | ----------------------------------- |
| MCP Server Wrappers | ✅ Complete    | 14/14 (incl. BambiSleep Chat)       |
| REST API Endpoints  | ✅ Complete    | 80+ endpoints                       |
| Dashboard UI        | ✅ Complete    | Cyber goth design                   |
| Agent Orchestrator  | ✅ Complete    | 102 tools + ModelRouter             |
| Agent Personality   | ✅ Complete    | Bambi + event system                |
| LM Studio Client    | ✅ Complete    | Vision, structured, tools           |
| Agent Chat UI       | ✅ Complete    | Full conversation UI                |
| WebSocket           | ✅ Complete    | Real-time updates                   |
| Unit Tests          | ✅ Complete    | 94+ unit tests, 84%+ cov            |
| BambiSleep Chat     | ✅ Complete    | Triggers, spirals, TTS              |
| Agent Parity        | ✅ Complete    | Phase 5.6 (102 tools, ModelRouter)  |
| Agentic Rendering   | ✅ Complete    | Phase 6 (13 tools, 8 components)    |
| Memory & Persistence| 🚀 Current     | Phase 7B (7 sub-phases)             |
| WebGL Avatar        | 🔮 Future      | Phase 7                             |

---

## 🎯 Phase 7B Milestones (Current)

| Milestone             | Target   | Status      |
| --------------------- | -------- | ----------- |
| memory-schema.js      | Phase A  | 🔜 Planned  |
| user-model.js         | Phase B  | 🔜 Planned  |
| conversation-memory.js| Phase C  | 🔜 Planned  |
| workspace-memory.js   | Phase D  | 🔜 Planned  |
| memory-manager.js     | Phase E  | 🔜 Planned  |
| API Routes (20+)      | Phase F  | 🔜 Planned  |
| Agent Tools (20+)     | Phase F  | 🔜 Planned  |
| MemoryDashboard.js    | Phase G  | 🔜 Planned  |
| memory.css            | Phase G  | 🔜 Planned  |
| Unit Tests (170+)     | Phase G  | 🔜 Planned  |

---

## 🛠️ Technical Notes

### Memory Entity Type Schema

```javascript
// Entity type prefixes for compartmentalization
const ENTITY_TYPES = {
  // User data
  USER_PROFILE: 'user:profile',
  USER_PREFERENCE: 'user:preference',
  USER_PATTERN: 'user:pattern',
  USER_EXPERTISE: 'user:expertise',
  
  // Conversation data
  CONVERSATION_SESSION: 'conversation:session',
  CONVERSATION_SUMMARY: 'conversation:summary',
  CONVERSATION_CONTEXT: 'conversation:context',
  
  // Workspace data
  WORKSPACE_PROJECT: 'workspace:project',
  WORKSPACE_FILE: 'workspace:file',
  WORKSPACE_PATTERN: 'workspace:pattern',
  
  // Memory metadata
  MEMORY_INDEX: 'memory:index',
  MEMORY_STATS: 'memory:stats'
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
  "[timestamp] confidence: 1.0"
];
```

### Confidence Scoring

| Source Type | Base Confidence | Decay Half-Life |
|-------------|-----------------|-----------------|
| explicit_setting | 1.0 | Never |
| user_correction | 0.95 | 180 days |
| direct_statement | 0.9 | 90 days |
| repeated_behavior | 0.7-0.9 | 30 days |
| single_observation | 0.5 | 14 days |
| inference | 0.3-0.7 | 7 days |
| default | 0.1 | Never |
