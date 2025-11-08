# 🌸 MCP Server Configuration & Future Integrations

**Date**: 2025-11-03  
**Status**: Configuration Complete | Testing In Progress

---

## ✅ Completed Tasks

### 1. GitHub Official MCP Server Integration

**Configuration Status**: ✅ Complete

- **Added to workspace**: `bambisleep-church-catgirl-control-tower.code-workspace`
- **Added to orchestrator**: `src/mcp/orchestrator.js` LAYER_1 array
- **Updated TODO.md**: Server count 3/8 → 4/9
- **Documentation**: `.github/copilot-instructions.md` and `.github/MCP_REGISTRY_INTEGRATION.md`

**Server Details**:
```json
{
  "name": "github-official",
  "command": "npx -y github-mcp-server",
  "env": { "GITHUB_TOKEN": "${input:githubToken}" },
  "layer": 1,
  "stars": 23935,
  "language": "Go",
  "source": "github/github-mcp-server"
}
```

### 2. Dependencies Installed

- ✅ `npm install` completed successfully (448 packages)
- ✅ `@modelcontextprotocol/sdk@^1.0.0` installed
- ✅ All project dependencies resolved
- ✅ No vulnerabilities found

### 3. Orchestrator Updated

**File**: `src/mcp/orchestrator.js` (line 34)

**Before**:
```javascript
LAYER_1: ['git', 'github', 'brave-search']
```

**After**:
```javascript
LAYER_1: ['git', 'github', 'github-official', 'brave-search']
```

---

## ⏳ Testing Status

### GitHub Token Configuration

**Current State**: ⚠️ Not Set
- `GITHUB_TOKEN` environment variable not configured
- VS Code workspace will prompt for token via input variables when MCP servers start
- Token required for both `github` and `github-official` servers

**To Configure**:
```bash
# Option 1: Environment variable
export GITHUB_TOKEN='ghp_your_personal_access_token_here'

# Option 2: VS Code will prompt automatically
# When running: npm run orchestrator:start
```

**Token Permissions Required**:
- `repo` (Full control of private repositories)
- `read:org` (Read org and team membership)
- `workflow` (Update GitHub Action workflows)

### MCP Server Availability

**Test Script Created**: `scripts/test-mcp-github-official.sh`

**Status**: Test interrupted (slow npm package downloads)

**Alternative Validation**:
```bash
# Quick syntax check
node -c src/mcp/orchestrator.js  # ✅ Passed

# Check workspace config
grep "github-official" bambisleep-church-catgirl-control-tower.code-workspace  # ✅ Found

# Verify orchestrator includes new server
grep "github-official" src/mcp/orchestrator.js  # ✅ Found in LAYER_1
```

---

## 🚀 Future Integration Recommendations

Based on GitHub MCP Registry (48 official servers) and current workspace needs:

### High Priority (Existing Tech Stack)

#### 1. Stripe Agent Toolkit
**Repository**: `stripe/agent-toolkit`  
**Stars**: 1,020 ⭐  
**License**: MIT  
**Language**: TypeScript  

**Why Integrate**:
- **bambisleep-church already uses Stripe** for payments
- Enables AI agents to interact with Stripe API
- Automate payment flows, subscription management, webhooks
- Complements existing `src/routes/stripe.js` implementation

**Integration**:
```jsonc
"stripe-agent": {
  "command": "npx",
  "args": ["-y", "@stripe/agent-toolkit"],
  "env": {
    "STRIPE_SECRET_KEY": "${input:stripeSecretKey}"
  },
  "metadata": {
    "layer": 2,
    "description": "Stripe API automation",
    "dependencies": ["memory", "sequential-thinking"]
  }
}
```

**Use Cases**:
- Automated subscription lifecycle management
- Payment intent analysis and troubleshooting
- Customer billing automation
- Revenue analytics and reporting

---

#### 2. Pydantic Logfire MCP
**Repository**: `pydantic/logfire-mcp`  
**Stars**: 119 ⭐  
**License**: MIT  
**Language**: Python  

**Why Integrate**:
- **bambisleep-church uses OpenTelemetry** extensively
- Provides access to OpenTelemetry traces and metrics
- Complements existing Prometheus/Grafana observability stack
- Real-time trace analysis for debugging

**Integration**:
```jsonc
"logfire": {
  "command": "npx",
  "args": ["-y", "@pydantic/logfire-mcp"],
  "env": {
    "LOGFIRE_TOKEN": "${input:logfireToken}"
  },
  "metadata": {
    "layer": 2,
    "description": "OpenTelemetry trace access",
    "dependencies": ["memory"]
  }
}
```

**Use Cases**:
- Distributed tracing analysis
- Performance bottleneck identification
- Error correlation across services
- DORA metrics enhancement

---

#### 3. Unity MCP (CoplayDev)
**Repository**: `coplaydev/unity-mcp`  
**Stars**: 3,629 ⭐  
**License**: MIT  
**Language**: C# + Python  

**Why Integrate**:
- **bambisleep-chat-catgirl uses Unity 6.2** for avatars
- Control Unity Editor from MCP clients
- Python bridge + local server architecture
- AI-driven game development workflows

**Integration**:
```jsonc
"unity-editor": {
  "command": "python",
  "args": ["-m", "unity_mcp.server"],
  "env": {
    "UNITY_PROJECT_PATH": "${workspaceFolder}/catgirl-avatar-project"
  },
  "metadata": {
    "layer": 2,
    "description": "Unity Editor control",
    "dependencies": ["filesystem"]
  }
}
```

**Use Cases**:
- Automated scene setup and configuration
- Component attachment and prefab management
- Build pipeline automation
- Asset optimization and validation

---

### Medium Priority (Enhanced Capabilities)

#### 4. MongoDB MCP Server
**Repository**: `mongodb-js/mongodb-mcp-server`  
**Stars**: 754 ⭐  
**License**: Apache 2.0  

**Why Consider**:
- Alternative to Postgres for flexible schema
- MongoDB Atlas cloud integration
- Real-time aggregation pipelines
- Scalable for large datasets

**Status**: Evaluate if migrating from Postgres

---

#### 5. Sentry MCP
**Repository**: `getsentry/sentry-mcp`  
**Stars**: 401 ⭐  
**License**: Other  

**Why Consider**:
- Error tracking and performance monitoring
- Complements existing telemetry stack
- AI-driven error analysis
- Release health monitoring

**Status**: Evaluate for production error tracking

---

#### 6. Microsoft Playwright MCP
**Repository**: `microsoft/playwright-mcp`  
**Stars**: 22,407 ⭐  
**License**: Apache 2.0  

**Why Consider**:
- Browser automation for E2E testing
- Accessibility tree analysis
- Web scraping for data extraction
- Automated UI testing for Express app

**Status**: Useful for bambisleep-church QA automation

---

### Low Priority (Enterprise Integration)

#### 7. Atlassian MCP Server
**Repository**: `atlassian/atlassian-mcp-server`  
**Stars**: 60 ⭐  

**Use Case**: Jira/Confluence integration for project management

---

#### 8. Notion MCP Server
**Repository**: `makenotion/notion-mcp-server`  
**Stars**: 3,547 ⭐  

**Use Case**: Documentation management if using Notion

---

## 📊 Integration Priority Matrix

| Server | Priority | Reason | Estimated Effort |
|--------|----------|--------|------------------|
| stripe/agent-toolkit | 🔴 High | Already using Stripe | 2-4 hours |
| pydantic/logfire-mcp | 🔴 High | Enhances existing OpenTelemetry | 2-3 hours |
| coplaydev/unity-mcp | 🔴 High | Unity Editor automation | 4-6 hours |
| mongodb-mcp-server | 🟡 Medium | Alternative to Postgres | 6-8 hours (migration) |
| getsentry/sentry-mcp | 🟡 Medium | Production error tracking | 3-4 hours |
| playwright-mcp | 🟡 Medium | E2E testing automation | 4-5 hours |
| atlassian-mcp-server | 🟢 Low | Optional project mgmt | 2-3 hours |
| notion-mcp-server | 🟢 Low | Optional documentation | 2-3 hours |

---

## 🛠️ Implementation Checklist

### For Each New MCP Server:

1. **Determine Layer**:
   - Layer 0: Primitives (filesystem, memory)
   - Layer 1: Foundation (depends on L0)
   - Layer 2: Advanced (depends on L0-L1)

2. **Update Workspace Config** (`*.code-workspace`):
   ```jsonc
   "mcp.servers": {
     "server-name": {
       "command": "npx",
       "args": ["-y", "package-name"],
       "env": { /* environment variables */ },
       "metadata": { /* layer, dependencies, description */ }
     }
   }
   ```

3. **Update Orchestrator** (`src/mcp/orchestrator.js`):
   ```javascript
   const SERVER_TIERS = {
     LAYER_X: ['existing-servers', 'new-server']
   };
   ```

4. **Update Documentation**:
   - `.github/copilot-instructions.md` - Add server to list
   - `TODO.md` - Update server count (X/9 → X+1/10)
   - `.github/MCP_REGISTRY_INTEGRATION.md` - Add details

5. **Test Integration**:
   ```bash
   npm run orchestrator:start
   npm run orchestrator:status
   tail -f .mcp/logs/server-name.log
   ```

6. **Update Tests**:
   - Add server to `scripts/mcp-validate.sh`
   - Create integration tests if needed
   - Update Jest coverage

---

## 📝 Next Immediate Steps

1. **Set GitHub Token**:
   ```bash
   export GITHUB_TOKEN='ghp_your_token_here'
   ```

2. **Test Orchestrator Startup**:
   ```bash
   cd bambisleep-church-catgirl-control-tower
   npm run orchestrator:start
   ```

3. **Verify All 9 Servers**:
   ```bash
   npm run orchestrator:status
   # Expected: 9/9 servers operational
   # Layer 0: filesystem, memory
   # Layer 1: git, github, github-official, brave-search
   # Layer 2: sequential-thinking, postgres, everything
   ```

4. **Monitor Logs**:
   ```bash
   tail -f .mcp/logs/*.log
   ```

5. **Test GitHub Official Server**:
   ```bash
   # Via VS Code MCP extension or direct API call
   # Verify Go binary downloads and starts correctly
   ```

---

## 🔍 Validation Checklist

- [x] GitHub official MCP server added to workspace config
- [x] Orchestrator updated with new server
- [x] Documentation updated
- [x] Dependencies installed
- [x] Test script created
- [ ] GitHub token configured
- [ ] Orchestrator successfully starts all 9 servers
- [ ] Health checks pass for all servers
- [ ] Logs show no errors
- [ ] VS Code MCP extension recognizes all servers

---

## 🌟 Success Criteria

**GitHub Official MCP Server Integration Complete When**:

1. ✅ Configuration files updated
2. ✅ Orchestrator code updated
3. ⏳ GITHUB_TOKEN environment variable set
4. ⏳ `npm run orchestrator:start` succeeds
5. ⏳ Server health check shows "operational"
6. ⏳ Can execute GitHub operations via MCP
7. ⏳ Logs show successful GitHub API connection

**Future Integrations Planned When**:

1. ✅ Recommendations documented
2. ✅ Priority matrix created
3. ⏳ Stakeholder approval obtained
4. ⏳ Implementation timeline scheduled

---

**Last Updated**: 2025-11-03  
**Next Review**: After successful orchestrator startup test
