# MCP Server Configuration Notes

**Last Updated:** 2025-11-03

## Configuration Locations

### 1. Global User MCP Config
**File:** `C:\Users\urukk\AppData\Roaming\Code\User\mcp.json`  
**Scope:** User-level (applies to all VS Code projects)  
**Active Servers:** 16 servers configured

### 2. Workspace MCP Config
**File:** `.vscode/settings.json` (this workspace)  
**Scope:** Project-level (bambisleep-church only)  
**Active Servers:** 8 servers configured

## Redundancy Analysis

### Duplicate Servers (configured in both locations)
The following servers are configured BOTH globally and locally:

1. **filesystem** 
   - Global: `/mnt/f/bambisleep-chat-catgirl`
   - Local: `/mnt/f/bambisleep-church` ✅ **Different paths - NOT redundant**

2. **git**
   - Global: `/mnt/f/bambisleep-chat-catgirl`
   - Local: `/mnt/f/bambisleep-church` ✅ **Different repos - NOT redundant**

3. **stripe**
   - Global: `npx @modelcontextprotocol/server-stripe` (with `STRIPE_API_KEY` env)
   - Local: `npx @modelcontextprotocol/server-stripe` (with `STRIPE_SECRET_KEY` env)
   - ⚠️ **SAME SERVER** - Consider removing from workspace config

4. **github** (as `github-mcp-server` globally)
   - Global: HTTP type (`https://api.githubcopilot.com/mcp/`)
   - Local: stdio type (`npx @modelcontextprotocol/server-github`)
   - ✅ **Different implementations - NOT redundant**

5. **huggingface** (as `hf-mcp-server` globally)
   - Global: HTTP type (`https://huggingface.co/mcp?login`)
   - Local: stdio type (`npx @modelcontextprotocol/server-huggingface`)
   - ✅ **Different implementations - NOT redundant**

### Unique Global Servers (not in workspace)
- `microsoft/markitdown` (uvx)
- `microsoft/playwright-mcp` (npx @playwright/mcp)
- `mongodb-js/mongodb-mcp-server` (with connection string input)
- `microsoft/clarity-mcp-server` (with API token input)
- `memory` (@modelcontextprotocol/server-memory)
- `docker` (mcp-server-docker)
- `sequential-thinking` (@modelcontextprotocol/server-sequential-thinking)
- `everything` (@modelcontextprotocol/server-everything)
- `brave-search` (uvx mcp-server-brave-search)
- `postgres` (uvx mcp-server-postgres)
- `fetch` (@modelcontextprotocol/server-fetch)

### Unique Workspace Servers (not global)
- `mongodb` (old-style with --connection-string arg)
- `azure-quantum` (@modelcontextprotocol/server-azure-quantum)
- `clarity` (old-style @microsoft/clarity-mcp-server)

## Recommendations

### ✅ Keep Workspace Config For:
1. **filesystem** - Project-specific path
2. **git** - Project-specific repo
3. **mongodb** - Project needs specific local instance
4. **azure-quantum** - Only used in this project
5. **github/huggingface** - stdio versions for better integration

### ⚠️ Consider Removing From Workspace:
1. **stripe** - Global config should suffice (uses same npm package)
2. **clarity** - Global version is newer and uses input variables

### 📝 Action Items:
- [ ] Test if removing workspace `stripe` config breaks functionality
- [ ] Migrate `clarity` to use global config pattern (input variables)
- [ ] Update `mongodb` config to match global pattern (input variable for connection string)

## MCP Server Types

### stdio (Standard I/O)
- Direct process communication
- Better for local development
- Examples: filesystem, git, memory

### http (HTTP API)
- Remote server communication
- Better for cloud services
- Examples: stripe, github (HTTP), huggingface (HTTP)

## Environment Variables Required

**Workspace-Level (.env file):**
```bash
GITHUB_TOKEN=ghp_***
STRIPE_SECRET_KEY=sk_test_***
HUGGINGFACE_HUB_TOKEN=hf_***
AZURE_QUANTUM_WORKSPACE_ID=***
AZURE_QUANTUM_SUBSCRIPTION_ID=***
AZURE_QUANTUM_RESOURCE_GROUP=***
AZURE_QUANTUM_LOCATION=***
CLARITY_PROJECT_ID=***
```

**Global-Level (System/User Environment):**
```bash
STRIPE_API_KEY=*** (for global stripe server)
MDB_MCP_CONNECTION_STRING=*** (for global mongodb server)
```
