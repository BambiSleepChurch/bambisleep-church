# Projects Documentation

This directory contains comprehensive documentation for projects in the BambiSleep ecosystem.

---

## 📦 Available Projects

### [BambiSleep Church](bambisleep-church/)

**Express.js web application** with Stripe subscriptions, WebSocket communication, and video streaming.

- **Tech Stack**: Node.js 20+, Express 4.19, EJS templates, Stripe, WebSocket
- **Features**: Authentication, payment integration, content delivery, real-time chat, MCP orchestration
- **Documentation**: ~1,100 lines across architecture, development, integration, operations, philosophy, and reference guides

**Quick Links**:
- [README](bambisleep-church/README.md) - Navigation hub
- [Architecture](bambisleep-church/architecture/architecture.md) - 8-layer system design
- [Development](bambisleep-church/development/development.md) - Dev workflows
- [Integration](bambisleep-church/integration/mcp-servers.md) - 8 MCP servers
- [Operations](bambisleep-church/operations/monitoring.md) - Prometheus/Grafana
- [Philosophy](bambisleep-church/philosophy/philosophy.md) - Community analysis
- [Quick Reference](bambisleep-church/reference/QUICK_REFERENCE.md) - Commands & setup

---

### [Catgirl Control Tower](catgirl-control-tower/)

**MCP orchestration system** for coordinating 8 Model Context Protocol servers with real-time monitoring and multi-agent coordination.

- **Tech Stack**: Node.js 20+, Express, WebSocket (ws), 8 MCP servers
- **Features**: Tiered initialization, health monitoring, task distribution, agent coordination, emoji-driven logging
- **Documentation**: 29 files including guides, API reference, architecture, and deployment instructions

**Quick Links**:
- [INDEX](catgirl-control-tower/INDEX.md) - Complete documentation index
- [README](catgirl-control-tower/README.md) - Project overview
- [BUILD](catgirl-control-tower/BUILD.md) - Development roadmap (408 lines)
- [MCP Setup Guide](catgirl-control-tower/MCP_SETUP_GUIDE.md) - MCP configuration
- [Architecture](catgirl-control-tower/.github/docs/codebase/core/architecture.md) - System design
- [API Reference](catgirl-control-tower/.github/docs/codebase/api/api-reference.md) - Complete API docs

---

## 🗂️ Documentation Structure

```
projects/
├── bambisleep-church/           # Express.js web app
│   ├── README.md
│   ├── architecture/
│   ├── development/
│   ├── integration/
│   ├── operations/
│   ├── philosophy/
│   └── reference/
└── catgirl-control-tower/       # MCP orchestration system
    ├── INDEX.md
    ├── README.md
    ├── BUILD.md
    ├── MCP_SETUP_GUIDE.md
    ├── UNITY_SETUP_GUIDE.md
    ├── AGENT_README.md
    ├── AGENT_STATUS.md
    ├── TODO.md
    └── .github/
        ├── copilot-instructions.md
        └── docs/
            ├── advanced-patterns.md
            ├── ci-cd-pipeline.md
            ├── dashboard-ui.md
            ├── debugging-guide.md
            ├── docker-deployment.md
            ├── testing-guide.md
            └── codebase/
                ├── api/
                ├── core/
                ├── guides/
                └── implementation/
```

---

## 🔍 Finding Information

- **BambiSleep Church**: Focus on web application development, Stripe integration, WebSocket patterns
- **Catgirl Control Tower**: Focus on MCP server orchestration, agent coordination, multi-server management

Both projects share common themes:
- Node.js 20+ ES modules
- Express.js REST APIs
- WebSocket real-time communication
- Comprehensive monitoring and observability
- AI agent integration patterns

---

**Last Updated**: 2025-11-03  
**Total Documentation**: ~1,100 lines (BambiSleep Church) + 29 files (Catgirl Control Tower)
