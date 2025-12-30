# MCP Control Tower - AI Agent Instructions

## Project Status: Bootstrap Phase 🚧

This is an **early-stage** MCP Control Tower project. The `src/` directory does not exist yet—core application code needs to be created. Current infrastructure is container-ready but awaiting implementation.

## Architecture Overview

**Purpose**: Orchestrate multiple MCP (Model Context Protocol) servers for the BambiSleepChurch organization.

### Current MCP Servers (configured in [.vscode/settings.json](../.vscode/settings.json))

```jsonc
"mcp.servers": {
    "filesystem": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-filesystem", "."] },
    "git":        { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-git", "--repository", "."] },
    "github":     { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-github"] }
}
```

### Planned Servers (per [docs/RELIGULOUS_MANTRA.md](../docs/RELIGULOUS_MANTRA.md))

Target: 8/8 operational MCP servers:

| Server          | Package/Integration                           | Purpose                     | Reference Doc                                                        |
| --------------- | --------------------------------------------- | --------------------------- | -------------------------------------------------------------------- |
| ✅ filesystem   | `@modelcontextprotocol/server-filesystem`     | Local file operations       | Built-in                                                             |
| ✅ git          | `@modelcontextprotocol/server-git`            | Repository operations       | Built-in                                                             |
| ✅ github       | `@modelcontextprotocol/server-github`         | GitHub API integration      | Built-in                                                             |
| 📄 mongodb      | `@modelcontextprotocol/server-mongodb`        | Database persistence        | [MONGODB_MCP_REFERENCE.md](../docs/MONGODB_MCP_REFERENCE.md)         |
| 📄 stripe       | `@modelcontextprotocol/server-stripe`         | Payment processing          | [STRIPE_MCP_REFERENCE.md](../docs/STRIPE_MCP_REFERENCE.md)           |
| 📄 huggingface  | `@huggingface/inference` + `@huggingface/hub` | ML model integration        | [HUGGINGFACE_MCP_REFERENCE.md](../docs/HUGGINGFACE_MCP_REFERENCE.md) |
| ⬚ azure-quantum | TBD                                           | Quantum computing services  | Pending                                                              |
| 📄 clarity      | `@microsoft/clarity`                          | Microsoft Clarity analytics | [CLARITY_MCP_REFERENCE.md](../docs/CLARITY_MCP_REFERENCE.md)         |

## MCP Reference Documentation

Implementation guides for each MCP server integration:

| Document                                                             | Purpose                                       | Status      |
| -------------------------------------------------------------------- | --------------------------------------------- | ----------- |
| [STRIPE_MCP_REFERENCE.md](../docs/STRIPE_MCP_REFERENCE.md)           | Stripe API, payments, subscriptions, invoices | ✅ Complete |
| [MONGODB_MCP_REFERENCE.md](../docs/MONGODB_MCP_REFERENCE.md)         | MongoDB Node.js driver, CRUD, aggregation     | ✅ Complete |
| [CLARITY_MCP_REFERENCE.md](../docs/CLARITY_MCP_REFERENCE.md)         | Microsoft Clarity analytics, heatmaps, events | ✅ Complete |
| [HUGGINGFACE_MCP_REFERENCE.md](../docs/HUGGINGFACE_MCP_REFERENCE.md) | HuggingFace inference, hub, MCP client        | ✅ Complete |
| Azure Quantum Reference                                              | Quantum computing integration                 | ⬚ Pending   |

**Usage**: When implementing an MCP server, consult the corresponding reference doc for API patterns, authentication, and recommended MCP tool mappings.

## Useful MCP Servers (Official @modelcontextprotocol)

Recommended servers for future integration:

| Server                  | Package                                            | Purpose                                       | Priority |
| ----------------------- | -------------------------------------------------- | --------------------------------------------- | -------- |
| **Puppeteer**           | `@modelcontextprotocol/server-puppeteer`           | Browser automation, screenshots, web scraping | High     |
| **PostgreSQL**          | `@modelcontextprotocol/server-postgres`            | SQL database queries and management           | High     |
| **SQLite**              | `@modelcontextprotocol/server-sqlite`              | Lightweight local database operations         | Medium   |
| **Docker**              | `@modelcontextprotocol/server-docker`              | Container management and orchestration        | Medium   |
| **Slack**               | `@modelcontextprotocol/server-slack`               | Team messaging and channel management         | Low      |
| **Google Drive**        | `@modelcontextprotocol/server-gdrive`              | File storage and document access              | Low      |
| **Brave Search**        | `@modelcontextprotocol/server-brave-search`        | Web search integration                        | Medium   |
| **Fetch**               | `@modelcontextprotocol/server-fetch`               | HTTP requests and API calls                   | High     |
| **Memory**              | `@modelcontextprotocol/server-memory`              | Knowledge graph persistence                   | Medium   |
| **Sequential Thinking** | `@modelcontextprotocol/server-sequential-thinking` | Complex reasoning chains                      | Low      |

### Quick Add Example

```jsonc
// Add to .vscode/settings.json -> mcp.servers
"puppeteer": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
},
"postgres": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://localhost/mydb"]
},
"fetch": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-fetch"]
}
```

## Key Configuration Files

| File                                                                  | Purpose                                                     |
| --------------------------------------------------------------------- | ----------------------------------------------------------- |
| [.vscode/settings.json](../.vscode/settings.json)                     | MCP server registry, editor settings, Copilot config        |
| [.devcontainer/devcontainer.json](../.devcontainer/devcontainer.json) | Container: Node.js 20, ports 3000/8080, extensions          |
| [.devcontainer/Dockerfile](../.devcontainer/Dockerfile)               | Base image with org labels and MCP SDK pre-installed        |
| [package.json](../package.json)                                       | `@bambisleepchurch/bambisleep-church`, main: `src/index.js` |

## Development Environment

- **Runtime**: Node.js 20+ LTS (container or local via Volta)
- **Ports**: 3000 (Dashboard), 8080 (API)
- **Formatting**: Prettier, 2-space indent, format-on-save enabled
- **Styling**: Tailwind CSS configured

```bash
npm install                    # Install dependencies (runs automatically in devcontainer)
npm run dev                    # Placeholder - needs implementation
```

## Adding New MCP Servers

1. Add to `.vscode/settings.json` under `mcp.servers`:
   ```jsonc
   "newserver": {
       "command": "npx",
       "args": ["-y", "@modelcontextprotocol/server-{name}", "."]
   }
   ```
2. Add port to `.devcontainer/devcontainer.json` `forwardPorts` if needed
3. Add SDK dependency to `package.json` if runtime integration required

## Code Conventions

- **Entry point**: `src/index.js` (to be created)
- **Imports**: Use ES modules, auto-organize on save
- **Trademark**: Always use "BambiSleep™" with ™ symbol in user-facing text
- **Container labels**: Follow OCI standard labels (see [Dockerfile](../.devcontainer/Dockerfile))

## Recommended `src/` Structure

```
src/
├── index.js              # Main entry point, server orchestration
├── servers/              # MCP server wrappers and configuration
│   ├── filesystem.js
│   ├── git.js
│   ├── github.js
│   └── index.js          # Server registry and lifecycle management
├── dashboard/            # Port 3000 - Control Tower UI
│   ├── index.html
│   ├── app.js
│   └── styles.css        # Tailwind CSS
├── api/                  # Port 8080 - REST API endpoints
│   ├── routes.js
│   └── handlers/
└── utils/                # Shared utilities
    ├── config.js         # Environment and MCP config loader
    └── logger.js
```

## AI Agent Priorities

1. **Create `src/` structure first**—this project needs its core implementation
2. **Scripts are stubs**—`npm run dev/build/test/start` need real implementations
3. **Test coverage target**: 100% (per project philosophy)
4. **Keep MCP configs in sync**—server changes must update `.vscode/settings.json`
5. **Port conflicts**—always check existing reservations before adding services
6. **Consult reference docs**—use `docs/*_MCP_REFERENCE.md` when implementing MCP servers
7. **Document new integrations**—create reference docs for any new MCP server implementations
