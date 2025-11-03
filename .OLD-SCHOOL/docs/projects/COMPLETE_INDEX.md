# BambiSleep Ecosystem - Projects Documentation

**Unified documentation hub for all BambiSleep ecosystem projects**

This directory contains comprehensive documentation (58 markdown files) for both production applications and orchestration systems in the BambiSleep ecosystem.

---

## 📦 Projects Overview

### 1. BambiSleep Church (29 documentation files)

**Community hub with video streaming, Stripe subscriptions, and WebSocket communication**

**Navigation**:
- **[Complete Index](bambisleep-church/INDEX.md)** - All 29 files organized by category
- **[Main README](bambisleep-church/README.md)** - Original project overview  
- **[Getting Started](bambisleep-church/docs/GETTING_STARTED.md)** - Quick start (359 lines)
- **[BUILD.md](bambisleep-church/BUILD.md)** - Development roadmap (408 lines)

**Key Documentation Areas**:

| Category | Files | Key Documents |
|----------|-------|---------------|
| **Core Documentation** | 8 | BUILD, DEPLOYMENT, DEVELOPMENT_COMPLETE, TODO, CHANGELOG, SECURITY, TELEMETRY, README |
| **Architecture** | 2 | [architecture.md](bambisleep-church/architecture/architecture.md) (178 lines), philosophy.md |
| **Development** | 4 | [development.md](bambisleep-church/development/development.md) (112 lines), GETTING_STARTED, CHECKLIST, GIT_COMMIT |
| **Integration** | 2 | [mcp-servers.md](bambisleep-church/integration/mcp-servers.md) (97 lines), MCP_CONFIG_NOTES |
| **Operations** | 4 | [monitoring.md](bambisleep-church/operations/monitoring.md) (123 lines), telemetry guides, PHASE3_COMPLETION |
| **Platform** | 4 | WSL_SETUP_GUIDE, WSL_INTEGRATION, WINDOWS_TERMINAL, UPGRADE_SUMMARY |
| **Content** | 2 | public/welcome.md, private/premium-welcome.md |
| **GitHub/AI** | 2 | copilot-instructions.md, .github/README.md |
| **Reference** | 1 | QUICK_REFERENCE.md |

**Tech Stack**: Express.js (ES modules), WebSocket (ws), EJS templates, Stripe API, FFmpeg, JWT auth, Helmet/CORS security, OpenTelemetry monitoring, Prometheus/Grafana, winston logging, PM2 process management, Docker, Node.js 20+

---

### 2. Catgirl Control Tower (29 documentation files)

**MCP orchestration system with 8 Model Context Protocol servers and real-time monitoring**

**Navigation**:
- **[Complete Index](catgirl-control-tower/INDEX.md)** - All 29 files organized by category
- **[Main README](catgirl-control-tower/README.md)** - Project overview
- **[BUILD.md](catgirl-control-tower/BUILD.md)** - Development roadmap (408 lines)
- **[MCP Setup Guide](catgirl-control-tower/MCP_SETUP_GUIDE.md)** - Server configuration

**Key Documentation Areas**:

| Category | Files | Key Documents |
|----------|-------|---------------|
| **Root Documentation** | 7 | AGENT_README, AGENT_STATUS, BUILD, MCP_SETUP_GUIDE, README, TODO, UNITY_SETUP_GUIDE |
| **Core Architecture** | 2 | [architecture.md](catgirl-control-tower/.github/docs/codebase/core/architecture.md), commentomancy.md |
| **API Documentation** | 3 | [api-reference.md](catgirl-control-tower/.github/docs/codebase/api/api-reference.md), integration-points.md, state-machines.md |
| **Development Guides** | 2 | [development-workflow.md](catgirl-control-tower/.github/docs/codebase/guides/development-workflow.md), quick-reference.md |
| **Implementation** | 4 | conventions.md, error-handling.md, modules.md, patterns.md |
| **Operations** | 6 | advanced-patterns.md, ci-cd-pipeline.md, dashboard-ui.md, debugging-guide.md, docker-deployment.md, testing-guide.md |
| **Status Reports** | 4 | COMPLETION_REPORT.md, FINAL_STATUS.md, INDEX.md, README.md |
| **GitHub/AI** | 1 | copilot-instructions.md |

**Tech Stack**: Node.js 20+ (ES modules), Express.js, WebSocket (ws), 8 MCP servers (filesystem, memory, git, github, brave-search, sequential-thinking, postgres, everything), tiered initialization (3 layers), Prometheus metrics, emoji-driven logging (357 lines), file state persistence, PM2, Docker

---

## 🔗 Cross-Project Architecture

### Shared Infrastructure Patterns

| Pattern | BambiSleep Church | Catgirl Control Tower |
|---------|-------------------|----------------------|
| **Runtime** | Node.js 20+ | Node.js 20+ |
| **Web Framework** | Express.js + EJS | Express.js (API-only) |
| **Real-time** | WebSocket (ws) | WebSocket (ws) |
| **Monitoring** | OpenTelemetry + Prometheus + Grafana | Prometheus metrics + emoji logging |
| **Process Mgmt** | PM2 (cluster mode) | PM2 (orchestrator + servers) |
| **Deployment** | Docker + nginx | Docker + multi-container |
| **MCP Servers** | 3/8 active (filesystem, git, github) | 8/8 orchestration (tiered init) |

### Architectural Differences

**BambiSleep Church** (User-Facing Application):
- Express + EJS templating for server-side rendering
- Stripe payment integration (checkout sessions, webhooks)
- JWT authentication + session management
- FFmpeg video transcoding and streaming
- Public/private content with paywall middleware
- OpenTelemetry comprehensive instrumentation

**Catgirl Control Tower** (Backend Orchestration):
- Express REST API (no templating)
- MCP server lifecycle management (start/stop/health)
- Agent coordination with priority queue
- Tiered initialization (Layer 0 → Layer 1 → Layer 2)
- State persistence to `.mcp/state.json`
- Auto-restart logic (max 3 attempts)

### Integration Points

1. **MCP Protocol**: Tower can orchestrate Church's MCP servers
2. **Monitoring**: Shared Prometheus + Grafana dashboards
3. **Logging**: Compatible winston + emoji patterns
4. **Configuration**: Similar `.env` structure
5. **Deployment**: Both use PM2 + Docker patterns

---

## 📊 Documentation Statistics

| Metric | BambiSleep Church | Catgirl Control Tower | Total |
|--------|-------------------|----------------------|-------|
| **Markdown Files** | 29 | 29 | **58** |
| **Categories** | 10 | 8 | **18+** |
| **Total Lines** | ~1,500+ | ~1,500+ | **~3,000+** |
| **Key Guides** | GETTING_STARTED (359), BUILD (408), architecture (178), monitoring (123) | BUILD (408), MCP_SETUP_GUIDE, api-reference, docker-deployment | **12+ major docs** |

---

## 🚀 Getting Started by Role

### For Developers (New to Ecosystem)

1. **Start here**: [BambiSleep Church Getting Started](bambisleep-church/docs/GETTING_STARTED.md) (359 lines)
2. **Understand architecture**: [Church Architecture](bambisleep-church/architecture/architecture.md) (178 lines)
3. **Set up development**: [Church Development](bambisleep-church/development/development.md) (112 lines)
4. **Configure MCP**: [Tower MCP Setup](catgirl-control-tower/MCP_SETUP_GUIDE.md)
5. **Read both BUILD.md**: [Church](bambisleep-church/BUILD.md) + [Tower](catgirl-control-tower/BUILD.md) (408 lines each)

### For DevOps Engineers

1. **Deployment**: [Church DEPLOYMENT.md](bambisleep-church/DEPLOYMENT.md)
2. **Docker**: [Tower Docker Guide](catgirl-control-tower/.github/docs/docker-deployment.md)
3. **Monitoring**: [Church Monitoring](bambisleep-church/operations/monitoring.md) (123 lines)
4. **CI/CD**: [Tower CI/CD Pipeline](catgirl-control-tower/.github/docs/ci-cd-pipeline.md)
5. **Security**: [Church SECURITY.md](bambisleep-church/SECURITY.md)

### For AI Agents (GitHub Copilot, Claude, etc.)

1. **Church guidance**: [Church Copilot Instructions](bambisleep-church/.github/copilot-instructions.md)
2. **Tower guidance**: [Tower Copilot Instructions](catgirl-control-tower/.github/copilot-instructions.md)
3. **Quick reference**: [Church Quick Ref](bambisleep-church/reference/QUICK_REFERENCE.md)
4. **API reference**: [Tower API Ref](catgirl-control-tower/.github/docs/codebase/api/api-reference.md)
5. **Complete indexes**: [Church INDEX](bambisleep-church/INDEX.md) + [Tower INDEX](catgirl-control-tower/INDEX.md)

### For QA/Testing

1. **Testing guide**: [Tower Testing Guide](catgirl-control-tower/.github/docs/testing-guide.md)
2. **Checklist**: [Church CHECKLIST.md](bambisleep-church/docs/CHECKLIST.md)
3. **Phase completion**: [Church PHASE3_COMPLETION.md](bambisleep-church/docs/PHASE3_COMPLETION.md)
4. **Debugging**: [Tower Debugging Guide](catgirl-control-tower/.github/docs/debugging-guide.md)

---

## 📖 Documentation Philosophy

All documentation in this ecosystem follows these principles:

✅ **Comprehensive**: Complete coverage of architecture, development, operations, integration  
✅ **Organized**: Clear categorization by function, role, and technical area  
✅ **Cross-referenced**: Links between related documents and projects  
✅ **Maintained**: Regularly updated with code changes and new features  
✅ **AI-friendly**: Structured for GitHub Copilot, Claude, and other AI agents  
✅ **Multi-format**: README navigation + INDEX files + inline documentation  
✅ **Version tracked**: Git history preserves documentation evolution  
✅ **Search-optimized**: Keywords, headers, and structure support full-text search  

---

## 🗂️ Complete Directory Structure

```
projects/
├── README.md                           # This file - ecosystem overview
├── bambisleep-church/                  # 29 docs - Express.js web application
│   ├── INDEX.md                        # Complete navigation index
│   ├── README.md                       # Project overview
│   ├── BUILD.md                        # Development roadmap (408 lines)
│   ├── DEPLOYMENT.md                   # Production deployment
│   ├── DEVELOPMENT_COMPLETE.md         # Completion report
│   ├── TODO.md                         # Implementation checklist
│   ├── CHANGELOG.md                    # Version history
│   ├── SECURITY.md                     # Security policies
│   ├── TELEMETRY.md                    # OpenTelemetry docs
│   ├── .github/                        # GitHub & AI integration
│   │   ├── copilot-instructions.md
│   │   └── README.md
│   ├── .vscode/                        # VS Code config
│   │   └── MCP_CONFIG_NOTES.md
│   ├── architecture/                   # System design
│   │   └── architecture.md (178 lines)
│   ├── development/                    # Dev guides
│   │   └── development.md (112 lines)
│   ├── integration/                    # MCP integration
│   │   └── mcp-servers.md (97 lines)
│   ├── operations/                     # Monitoring & ops
│   │   └── monitoring.md (123 lines)
│   ├── philosophy/                     # Project philosophy
│   │   └── philosophy.md
│   ├── reference/                      # Quick reference
│   │   └── QUICK_REFERENCE.md
│   ├── content/                        # Content templates
│   │   ├── public/welcome.md
│   │   └── private/premium-welcome.md
│   └── docs/                           # Additional guides
│       ├── GETTING_STARTED.md (359 lines)
│       ├── CHECKLIST.md
│       ├── GIT_COMMIT_RECOMMENDATIONS.md
│       ├── PHASE3_COMPLETION.md
│       ├── TELEMETRY_QUICK_REFERENCE.md
│       ├── TELEMETRY_UPGRADE_SUMMARY.md
│       ├── UPGRADE_SUMMARY.md
│       ├── WINDOWS_TERMINAL_PROFILE.md
│       ├── WSL_INTEGRATION_ENHANCEMENTS.md
│       └── WSL_SETUP_GUIDE.md
└── catgirl-control-tower/              # 29 docs - MCP orchestration
    ├── INDEX.md                        # Complete navigation index
    ├── README.md                       # Project overview
    ├── BUILD.md                        # Development roadmap (408 lines)
    ├── MCP_SETUP_GUIDE.md             # MCP configuration
    ├── AGENT_README.md                # Agent coordination docs
    ├── AGENT_STATUS.md                # Agent status tracking
    ├── TODO.md                        # Implementation checklist
    ├── UNITY_SETUP_GUIDE.md           # Unity integration
    ├── .github/                       # GitHub & AI integration
    │   ├── copilot-instructions.md
    │   └── docs/                      # Deep documentation
    │       ├── advanced-patterns.md
    │       ├── ci-cd-pipeline.md
    │       ├── dashboard-ui.md
    │       ├── debugging-guide.md
    │       ├── docker-deployment.md
    │       ├── testing-guide.md
    │       └── codebase/
    │           ├── COMPLETION_REPORT.md
    │           ├── FINAL_STATUS.md
    │           ├── INDEX.md
    │           ├── README.md
    │           ├── api/
    │           │   ├── api-reference.md
    │           │   ├── integration-points.md
    │           │   └── state-machines.md
    │           ├── core/
    │           │   ├── architecture.md
    │           │   └── commentomancy.md
    │           ├── guides/
    │           │   ├── development-workflow.md
    │           │   └── quick-reference.md
    │           └── implementation/
    │               ├── conventions.md
    │               ├── error-handling.md
    │               ├── modules.md
    │               └── patterns.md
```

---

## 🔍 Quick Search Guide

**Looking for specific topics? Use these searches:**

| Topic | Search Terms | Key Files |
|-------|--------------|-----------|
| **Setup** | getting started, installation, setup | GETTING_STARTED.md, development.md, MCP_SETUP_GUIDE.md |
| **Architecture** | architecture, design, system, layers | architecture.md (both projects) |
| **API** | api, endpoints, routes, integration | api-reference.md, integration-points.md |
| **Testing** | test, testing, jest, coverage | testing-guide.md, CHECKLIST.md |
| **Deployment** | deploy, docker, production, pm2 | DEPLOYMENT.md, docker-deployment.md |
| **Monitoring** | monitoring, telemetry, prometheus, grafana | monitoring.md, TELEMETRY.md |
| **Security** | security, auth, jwt, stripe | SECURITY.md, authentication sections |
| **MCP** | mcp, servers, orchestration, protocol | mcp-servers.md, MCP_SETUP_GUIDE.md, orchestrator docs |

---

**Last Updated**: November 3, 2025  
**Documentation Version**: 2.0 (Complete migration to HarleyVader unified documentation hub)  
**Total Documentation**: 58 markdown files, ~3,000+ lines, 18+ categories
