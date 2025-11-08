# MCP Unified - Consolidated Model Context Protocol Services

This directory consolidates all Model Context Protocol (MCP) servers, tools, and integrations into a single unified location.

## 📁 Structure

```
/mnt/e/mcp-unified/
├── README.md                      # This file
├── MCP_SETUP_GUIDE.md            # Comprehensive setup instructions
├── install-mcp-servers.sh        # Automated MCP server installation
├── verify-mcp.sh                 # Validation and health checks
├── bambisleepchat-mcp/           # Reddit Devvit MCP integration
│   ├── agents/                   # AI agents (mod-assistant, spam-detector)
│   ├── workflows/                # Automated workflows (auto-mod)
│   ├── config/                   # MCP configuration files
│   ├── index.js                  # Main MCP server entry
│   └── http-api-server.js       # HTTP API wrapper
└── vscode-mcp-agent/             # VSCode Copilot MCP agent (planned)
```

## 🚀 Quick Start

### 1. Install MCP Servers

```bash
cd /mnt/e/mcp-unified
./install-mcp-servers.sh
```

### 2. Verify Installation

```bash
./verify-mcp.sh
```

### 3. Configure Services

Edit configuration files in each service directory:

- `bambisleepchat-mcp/config/mcp-reddit.example.json` - Reddit integration

## 📦 Available Services

### BambiSleep Chat MCP (`bambisleepchat-mcp/`)

Reddit Devvit application with MCP-powered AI agents for moderation and automation.

**Features:**

- AI-powered moderation assistant
- Spam detection and filtering
- Automated workflow orchestration
- HTTP API for external integrations

**Start the server:**

```bash
cd bambisleepchat-mcp
node index.js
```

**API Server (optional):**

```bash
node http-api-server.js
```

### VSCode MCP Agent (`vscode-mcp-agent/`)

⚠️ **Status:** Template/Planned - requires full implementation

VSCode extension integrating GitHub Copilot with MCP servers for:

- Stripe payment processing
- Memory/knowledge graph management
- Browser automation via Playwright
- Sequential thinking and reasoning

## 🔧 Configuration

### Environment Variables

Create `.env` files in each service directory:

```bash
# bambisleepchat-mcp/.env
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_secret
MCP_SERVER_PORT=3000

# vscode-mcp-agent/.env (when implemented)
STRIPE_API_KEY=sk_test_...
MCP_MEMORY_PATH=/path/to/memory
```

### MCP Server Configuration

MCP servers are configured via JSON files in `.vscode/` or service-specific config directories. See `MCP_SETUP_GUIDE.md` for detailed instructions.

## 📚 Documentation

- **[MCP_SETUP_GUIDE.md](./MCP_SETUP_GUIDE.md)** - Complete setup and configuration guide
- **[bambisleepchat-mcp/README.md](./bambisleepchat-mcp/README.md)** - Reddit MCP service docs

## 🔗 Related Projects

- **bambisleep-chat-reddit** (`/mnt/e/bambisleep-chat-reddit/`) - Main Reddit Devvit application (MCP integration moved here)
- **catgirl-unity-system** (`/mnt/e/catgirl-unity-system/`) - Unity game systems (economy, inventory, crafting)

## 🛠️ Development

### Adding a New MCP Service

1. Create a new directory under `/mnt/e/mcp-unified/`
2. Add a `README.md` with service description
3. Create `config/` directory for configuration files
4. Update this README with service documentation
5. Add installation steps to `install-mcp-servers.sh`
6. Add validation to `verify-mcp.sh`

### Testing

```bash
# Test specific service
cd bambisleepchat-mcp
npm test

# Validate all MCP servers
./verify-mcp.sh
```

## 📝 Notes

- The `vscode-mcp-agent` directory is currently a template/skeleton
- All active MCP integrations are consolidated here
- Original Reddit project source code remains in `/mnt/e/bambisleep-chat-reddit/`
- MCP-specific code has been extracted from the Reddit project for better modularity

## 🤝 Contributing

When adding new MCP servers or tools:

1. Follow the directory structure convention
2. Include comprehensive documentation
3. Add configuration examples
4. Update installation and verification scripts
5. Test thoroughly before committing

## 📄 License

Each service maintains its own license. See individual service directories for details.
