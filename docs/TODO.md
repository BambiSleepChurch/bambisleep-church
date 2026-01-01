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
- [ ] Add E2E tests for dashboard with Puppeteer

### Documentation

- [x] Create README.md with quick start guide
- [x] Create `.github/copilot-instructions.md` for AI agents
- [x] MCP Reference Docs (Stripe, MongoDB, Clarity, HuggingFace)
- [ ] API documentation generator
- [ ] MCP server configuration guide
- [ ] Deployment guide
- [ ] Complete Azure Quantum reference documentation

---

## ✅ Phase 4: Production Readiness (Complete)

### Deployment

- [x] Environment variables template (`.env.example`)
- [x] Health check endpoints (`/api/health` with version & env)
- [x] Graceful shutdown handling (SIGINT/SIGTERM)
- [x] Rate limiting middleware (`src/utils/rate-limit.js`)
- [ ] SSL/TLS configuration

### Monitoring

- [x] Structured logging (with namespaces and colors)
- [x] Rate limit stats endpoint (`/api/stats/rate-limit`)
- [x] WebSocket stats endpoint (`/api/stats/websocket`)
- [ ] Metrics collection (Prometheus format)
- [ ] Alerting setup
- [ ] Error tracking integration

---

## ✅ Phase 5: Enhanced Dashboard (Complete)

### UI Components

- [x] Server detail modal with full config view
- [x] Live log streaming per server
- [ ] Memory graph visualization (D3.js/Cytoscape)
- [ ] API request builder/tester panel
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
- [ ] Drag-and-drop server ordering
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

## � Phase 5.6: Agent Parity with bambisleep-church-agent (Current)

### Overview

Upgrade MCP Control Tower agent to feature parity with the standalone bambisleep-church-agent repository. Key features to port: ModelRouter, AgentToolExecutor, 60+ tools, and extended APIs.

### Model Router (`src/servers/model-router.js`) - NEW

- [ ] **Smart Model Selection** - Auto-select optimal model per task type
  - Task types: reasoning, creative, instruction, chat, toolUse, summarize
  - Model profiles with quality/speed scores
  - Context length awareness (reduce tools for small models)
  - Task detection from user message
- [ ] **Model Profiles** - Benchmark-based model metadata
  - quality, speed (tokens/sec), taskScores per task
  - strengths/weaknesses arrays
  - contextLength, tier (quality/speed/balanced)
- [ ] **Singleton Pattern** - `getModelRouter()` factory function

### Agent Tool Executor (`src/servers/agent-tools.js`) - NEW

- [ ] **AgentToolExecutor Class** - Centralized tool execution
  - MCP client fallback to local handlers
  - Render callback for WebSocket broadcast
  - Local fetch implementation for standalone mode
- [ ] **60+ Tools with JSON Schema** - OpenAI function calling format
  - Core tools for small context models (~1k tokens)
  - Full tool set for larger models
- [ ] **Render Commands** - Emit UI component events
  - `render_card`, `render_table`, `render_form`
  - `render_alert`, `render_progress`, `render_list`, `render_code`

### Extended API Tools (30+ new tools)

- [ ] **Puppeteer Extended**
  - `puppeteer_launch`, `puppeteer_close`, `puppeteer_status`
  - `puppeteer_get_content`, `puppeteer_pdf`
- [ ] **MongoDB Extended**
  - `mongodb_aggregate`, `mongodb_count`, `mongodb_create_index`
  - `mongodb_delete_many`, `mongodb_stats`
- [ ] **SQLite Extended**
  - `sqlite_create_table`, `sqlite_update`, `sqlite_delete`
  - `sqlite_list_tables`, `sqlite_stats`
- [ ] **Thinking Extended**
  - `thinking_generate_hypothesis`, `thinking_conclude`
  - `thinking_export_markdown`, `thinking_list_sessions`
- [ ] **Stripe Extended**
  - `stripe_create_invoice`, `stripe_finalize_invoice`
  - `stripe_list_subscriptions`, `stripe_create_product`
  - `stripe_list_disputes`
- [ ] **Clarity Extended**
  - `clarity_track_pageview`, `clarity_get_events`
  - `clarity_top_events`, `clarity_reset`
- [ ] **Fetch Extended**
  - `fetch_post`, `fetch_ping`, `fetch_download_base64`
- [ ] **GitHub Extended**
  - `github_create_issue`, `github_list_issues`
  - `github_list_branches`
- [ ] **LM Studio Direct**
  - `lmstudio_list_models`, `lmstudio_get_loaded_model`
  - `lmstudio_generate_embeddings`

### BambiSleep Chat Integration

- [x] **Trigger System** - Official BambiSleep triggers by category
- [x] **Spiral Effects** - WebGL2 GPU-accelerated hypnotic spirals
- [x] **Collar System** - Session-based collar activation
- [x] **TTS Processing** - Text-to-speech preparation
- [x] **Chat History** - Per-session message tracking

---

## 🚀 Phase 6: Agentic Frontend Rendering (Next)

### Overview

Enable BambiAgent™ to dynamically generate and render frontend components, allowing users to interact with AI-generated interfaces in real-time. Based on bambisleep-church-agent Phase 6 implementation.

### Core Infrastructure

- [ ] **Component Registry** - Dynamic component registration system

  - `src/dashboard/js/components/DynamicRenderer.js` - Runtime component factory
  - Component schema validation (props, events, children)
  - Sandboxed execution for agent-generated code

- [ ] **Agent UI Tools** - Render tools in `src/servers/agent.js`

  - `render_card` - Render information cards (repo, user, payment)
  - `render_table` - Data tables with sorting/filtering
  - `render_form` - Generate interactive forms from schema
  - `render_alert` - Display notification alerts
  - `render_progress` - Show progress indicators
  - `render_list` - Bullet/numbered lists
  - `render_code` - Syntax-highlighted code blocks

- [ ] **Agent Workspace Panel** - Dedicated rendering area
  - `src/dashboard/js/components/AgentWorkspace.js` - Container for dynamic content
  - Split-pane layout: Chat | Workspace
  - Component history/undo stack
  - Export generated components to static HTML

### Interactive Components

- [ ] **Form Builder** - Agent can create forms dynamically

  - Text inputs, selects, checkboxes, date pickers
  - Validation rules from natural language
  - Submit handlers that call agent tools

- [ ] **Data Visualization**

  - Tables with agent-populated data
  - Charts from MongoDB queries
  - Real-time updating dashboards

- [ ] **Card Layouts** - Agent generates information cards

  - GitHub repo cards from `github_get_repo`
  - User profile cards from `github_get_user`
  - Stripe customer/payment cards

- [ ] **Interactive Wizards** - Multi-step flows
  - Agent guides user through complex operations
  - Conditional branching based on user input
  - Progress tracking and state persistence

### Agent Capabilities

- [ ] **Context-Aware Rendering** - Agent remembers rendered state

  - Track active components in conversation context
  - Reference previous renderings in follow-up messages
  - Update existing components vs creating new ones

- [ ] **User Interaction Handling**

  - Button clicks trigger agent tool calls
  - Form submissions send data to agent
  - Agent responds with updated UI

- [ ] **Template Library** - Pre-built component patterns
  - CRUD interfaces for any collection
  - Search/filter panels
  - Dashboard layouts
  - Data entry forms

### Security & Sandboxing

- [ ] **Safe Rendering** - Prevent XSS and injection

  - HTML sanitization for agent output
  - CSP-compliant dynamic rendering
  - No eval() or Function() constructors

- [ ] **Rate Limiting** - Prevent UI spam
  - Max components per conversation
  - Render throttling
  - Memory usage limits

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

### Memory & Persistence

- [ ] Long-term memory with Knowledge Graph
- [ ] User preference learning
- [ ] Conversation summarization
- [ ] Cross-session context retention

### Multi-Modal Support

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

| Category            | Status         | Progress                          |
| ------------------- | -------------- | --------------------------------- |
| MCP Server Wrappers | ✅ Complete    | 13/13 (incl. BambiSleep Chat)     |
| REST API Endpoints  | ✅ Complete    | 60+ endpoints                     |
| Dashboard UI        | ✅ Complete    | Cyber goth design                 |
| Agent Orchestrator  | ✅ Complete    | 30+ tools                         |
| Agent Personality   | ✅ Complete    | Bambi + event system              |
| LM Studio Client    | ✅ Complete    | Vision, structured, tools         |
| Agent Chat UI       | ✅ Complete    | Full conversation UI              |
| WebSocket           | ✅ Complete    | Real-time updates                 |
| Unit Tests          | ✅ Complete    | 228+ tests, 84%+ cov              |
| BambiSleep Chat     | ✅ Complete    | Triggers, spirals, TTS            |
| Agent Parity        | 🔄 In Progress | Phase 5.6 (ModelRouter, 60 tools) |
| Agentic Rendering   | 🔜 Next        | Phase 6                           |
| WebGL Avatar        | 🔮 Future      | Phase 7                           |

---

## 🎯 Phase 5.6 Milestones (Current)

| Milestone            | Target | Status      |
| -------------------- | ------ | ----------- |
| BambiSleep Chat      | Jan 1  | ✅ Complete |
| WebGL Spiral Effects | Jan 1  | ✅ Complete |
| Model Router         | Week 1 | 🔜 Planned  |
| AgentToolExecutor    | Week 1 | 🔜 Planned  |
| Extended Puppeteer   | Week 2 | 🔜 Planned  |
| Extended MongoDB     | Week 2 | 🔜 Planned  |
| Extended SQLite      | Week 2 | 🔜 Planned  |
| Extended Thinking    | Week 2 | 🔜 Planned  |
| Extended Stripe      | Week 3 | 🔜 Planned  |
| Extended Clarity     | Week 3 | 🔜 Planned  |
| Render Tools         | Week 3 | 🔜 Planned  |
| 60+ Tools Complete   | Week 4 | 🔜 Planned  |

---

## 🎯 Phase 6 Milestones

| Milestone               | Target | Status     |
| ----------------------- | ------ | ---------- |
| Component Registry      | Week 1 | 🔜 Planned |
| Agent UI Tools (4 core) | Week 2 | 🔜 Planned |
| Agent Workspace Panel   | Week 2 | 🔜 Planned |
| Form Builder            | Week 3 | 🔜 Planned |
| Data Visualization      | Week 3 | 🔜 Planned |
| Security Sandboxing     | Week 4 | 🔜 Planned |
| Integration Testing     | Week 4 | 🔜 Planned |

---

## 🛠️ Technical Notes

### Agent UI Tool Schema

```javascript
// Example: ui_render_component tool
{
  name: 'ui_render_component',
  description: 'Render a UI component in the agent workspace',
  parameters: {
    type: 'string - component type (card, table, form, chart)',
    props: 'object - component properties',
    target: 'string - container selector (optional)',
    id: 'string - unique component ID for updates'
  },
  handler: (args) => workspaceHandlers.render(args)
}
```

### Component Schema Example

```javascript
// Agent generates this JSON, renderer creates DOM
{
  type: 'card',
  id: 'repo-card-1',
  props: {
    title: 'bambisleep-church',
    subtitle: 'BambiSleepChurch/bambisleep-church',
    badges: ['Node.js', 'MCP', 'AI'],
    actions: [
      { label: 'View Issues', tool: 'github_list_issues', args: { owner: '...', repo: '...' } }
    ]
  }
}
```
