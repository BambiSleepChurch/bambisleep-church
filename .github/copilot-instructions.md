# MCP Control Tower - AI Agent Instructions

## Project Status: Bootstrap Phase

The `src/` directory does not exist yet. Infrastructure is container-ready; core application code needs implementation.

## Architecture

**Purpose**: Orchestrate MCP (Model Context Protocol) servers for BambiSleepChurch.

**Ports**: 3000 (Dashboard UI), 8080 (REST API), 27017 (MongoDB), 5432 (PostgreSQL)

### MCP Servers (9 configured in [.vscode/settings.json](../.vscode/settings.json))

| Server              | Status | Purpose                       |
| ------------------- | ------ | ----------------------------- |
| filesystem          | ✅     | Local file operations         |
| git                 | ✅     | Repository operations         |
| github              | ✅     | GitHub API                    |
| puppeteer           | ✅     | Browser automation            |
| postgres            | ✅     | PostgreSQL (`localhost:5432`) |
| fetch               | ✅     | HTTP requests                 |
| sqlite              | ✅     | Local DB (`./data/local.db`)  |
| memory              | ✅     | Knowledge graph               |
| sequential-thinking | ✅     | Reasoning chains              |

### Planned Integrations (see `docs/*_MCP_REFERENCE.md`)

- **MongoDB** → [MONGODB_MCP_REFERENCE.md](../docs/MONGODB_MCP_REFERENCE.md)
- **Stripe** → [STRIPE_MCP_REFERENCE.md](../docs/STRIPE_MCP_REFERENCE.md)
- **HuggingFace** → [HUGGINGFACE_MCP_REFERENCE.md](../docs/HUGGINGFACE_MCP_REFERENCE.md)
- **Microsoft Clarity** → [CLARITY_MCP_REFERENCE.md](../docs/CLARITY_MCP_REFERENCE.md)

## Immediate Priorities

1. **Create `src/` structure** — See [docs/TODO.md](../docs/TODO.md) Phase 1 checklist
2. **Implement npm scripts** — `dev`, `build`, `test`, `start` are stubs
3. **Test coverage**: 100% target per project philosophy

## Key Files

| File                              | Purpose                            |
| --------------------------------- | ---------------------------------- |
| `.vscode/settings.json`           | MCP server registry, editor config |
| `.devcontainer/devcontainer.json` | Container ports, extensions        |
| `package.json`                    | Entry: `src/index.js` (to create)  |

## Code Conventions

- **Runtime**: Node.js 20+ LTS
- **Modules**: ES modules (`import`/`export`)
- **Formatting**: Prettier, 2-space indent, format-on-save
- **Trademark**: Use "BambiSleep™" with ™ in user-facing text

## Recommended `src/` Structure

```
src/
├── index.js           # Entry point, server orchestration
├── servers/           # MCP server wrappers
├── dashboard/         # Port 8787 UI (HTML, JS, Tailwind CSS)
├── api/               # Port 8080 REST endpoints
└── utils/             # config.js, logger.js
```

## Adding MCP Servers

1. Add to `.vscode/settings.json` under `mcp.servers`
2. Add port to `.devcontainer/devcontainer.json` if needed
3. Create reference doc in `docs/` for non-trivial integrations
