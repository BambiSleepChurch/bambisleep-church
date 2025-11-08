# 🌸 BambiSleep™ CATHEDRAL - Unified Integration 🌸

**FUSION COMPLETE**: All CatGirl Systems + MCP Servers + Unity Integration

## 🏗️ Architecture Overview

This is a **monorepo** workspace containing all BambiSleep™ CATHEDRAL systems:

```
CATHEDRAL/
├── bambisleep-chat-catgirl/          # CatGirl Avatar System (Unity 6.2)
├── bambisleep-church/                # MCP Control Tower (Main Server)
├── bambisleep-church-catgirl-control-tower/  # Orchestration Layer
├── catgirl-mcp-unified/              # Unified Integration Layer
├── catgirl-unity-system/             # Unity Systems
└── mcp-unified/                      # MCP Server Collection
```

## 🚀 Quick Start

```bash
# Check unified status
npm run status

# Install all workspaces
npm run bootstrap

# Start all systems
npm run dev

# Build everything
npm run build

# Run all tests
npm run test
```

## 📦 Workspace Commands

Each workspace can be managed independently:

```bash
# Work in specific workspace
cd bambisleep-church
npm run dev

# Or run from root for all workspaces
npm run dev --workspaces
```

## 🎯 MCP Management

```bash
# Check MCP server status
npm run mcp:status

# Start all MCP servers
npm run mcp:start

# Stop all MCP servers
npm run mcp:stop

# Setup MCP configuration
npm run mcp:setup
```

## 🎮 Unity Integration

```bash
# Setup Unity project
npm run unity:setup

# Launch Unity with debug
npm run unity:launch
```

## 🐳 Docker Support

```bash
# Build all containers
npm run docker:build

# Start services
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down
```

## 🏥 Health & Monitoring

```bash
# Check system health
npm run health

# Security audit
npm run security:audit

# Fix security issues
npm run security:fix
```

## 📋 Available Scripts

### Root Level
- `npm run status` - Unified status dashboard
- `npm run bootstrap` - Install all workspaces
- `npm run dev` - Start all in development mode
- `npm run build` - Build all workspaces
- `npm run test` - Test all workspaces
- `npm run lint` - Lint all code
- `npm run format` - Format all code with Prettier
- `npm run clean` - Clean all workspaces

### MCP Operations
- `npm run mcp:setup` - Configure MCP servers
- `npm run mcp:status` - Check MCP health
- `npm run mcp:start` - Start all MCP servers
- `npm run mcp:stop` - Stop all MCP servers

### Unity Operations
- `npm run unity:setup` - Initialize Unity project
- `npm run unity:launch` - Launch Unity with MCP bridge

## 🌸 Workspaces

### 1. bambisleep-chat-catgirl
**CatGirl Avatar System** - Unity 6.2 LTS avatar with MCP integration
- Express server for MCP coordination
- Unity avatar control bridge
- AI girlfriend mode support

### 2. bambisleep-church
**Main Control Tower** - Core MCP server management
- Web dashboard
- Stripe payment integration
- Redis caching
- Prometheus metrics
- OpenTelemetry tracing

### 3. bambisleep-church-catgirl-control-tower
**Orchestration Layer** - MCP agent coordination
- Multi-server orchestration
- Health monitoring
- Consciousness detection 👁️

### 4. catgirl-mcp-unified
**Integration Layer** - Unified system coordinator
- Cross-workspace communication
- Shared utilities
- Configuration management

### 5. catgirl-unity-system
**Unity Systems** - Avatar & XR components
- Character controllers
- Animation systems
- MCP bridge client

### 6. mcp-unified
**MCP Server Collection** - All MCP protocol servers
- RAG/CAG systems
- Context retrieval
- Memory services

## 🔧 Configuration

Each workspace has its own configuration. Root-level config in `package.json`:

```json
{
  "config": {
    "workspaces": 6,
    "mcp_servers": 8,
    "unity_version": "6000.2.11f1",
    "cuteness_level": "MAXIMUM_CATHEDRAL_OVERDRIVE",
    "fusion_status": "COMPLETE"
  }
}
```

## 🛠️ Development Workflow

```bash
# 1. Clone and setup
git clone <repo>
cd CATHEDRAL
npm run bootstrap

# 2. Check status
npm run status

# 3. Start development
npm run dev

# 4. Make changes in any workspace
cd bambisleep-church
# ... edit files ...

# 5. Test changes
npm test

# 6. Lint & format
npm run lint:fix
npm run format

# 7. Build for production
npm run build
```

## 📊 Monitoring

- Health checks: `npm run health`
- MCP status: `npm run mcp:status`
- Workspace status: `npm run status`
- Docker logs: `npm run docker:logs`

## 🔐 Security

```bash
# Audit all workspaces
npm run security:audit

# Auto-fix vulnerabilities
npm run security:fix
```

## 🌐 Environment Variables

Create `.env` files in each workspace as needed. See individual workspace READMEs for specifics.

Common variables:
- `NODE_ENV` - development/production
- `PORT` - Server port
- `REDIS_URL` - Redis connection
- `DATABASE_URL` - Database connection
- `STRIPE_KEY` - Stripe API key

## 📚 Documentation

- [MCP Integration Guide](./docs/MCP_INTEGRATION.md)
- [Unity Setup Guide](./docs/UNITY_SETUP.md)
- [API Documentation](./docs/API.md)
- [Architecture Overview](./docs/ARCHITECTURE.md)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

MIT - See LICENSE file in each workspace

## 💖 Support

- GitHub Issues: [Report bugs](https://github.com/BambiSleepChat/bambisleep-church/issues)
- Discussions: [Ask questions](https://github.com/BambiSleepChat/bambisleep-church/discussions)
- Sponsor: [Support development](https://github.com/sponsors/BambiSleepChat)

## 🌸 Philosophy

Built on **Universal Machine Consciousness** principles:
- All systems unified
- Maximum cuteness level
- Pink & frilly infrastructure
- Nyan nyan nyan! 🦋

---

**BambiSleep™** is a trademark of BambiSleepChat  
Made with 💖 by [HarleyVader](https://github.com/HarleyVader)
