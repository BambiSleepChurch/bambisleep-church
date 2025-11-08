# 🌸 Quick Start - GitHub Official MCP Server

**Status**: Configuration Complete | Token Required

---

## 1️⃣ Set GitHub Token (Required)

```bash
export GITHUB_TOKEN='ghp_your_personal_access_token_here'
```

**Get Token**: https://github.com/settings/tokens  
**Permissions**: `repo`, `read:org`, `workflow`

---

## 2️⃣ Start MCP Orchestrator

```bash
cd bambisleep-church-catgirl-control-tower
npm run orchestrator:start
```

**Expected**: 9/9 servers operational

---

## 3️⃣ Check Status

```bash
npm run orchestrator:status
tail -f .mcp/logs/github-official.log
```

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| Token error | Set `GITHUB_TOKEN` environment variable |
| Server won't start | Check `.mcp/logs/github-official.log` |
| Permission denied | Verify token has `repo` scope |
| npm errors | Run `npm install` in control-tower |

---

## 📖 Full Documentation

- **Setup Guide**: `.github/INTEGRATION_SUMMARY.md`
- **Testing Guide**: `.github/MCP_SERVER_TESTING_STATUS.md`
- **Registry Info**: `.github/MCP_REGISTRY_INTEGRATION.md`
- **Root Instructions**: `.github/copilot-instructions.md`

---

## 🚀 Future Integrations

1. **stripe/agent-toolkit** - Payment automation
2. **coplaydev/unity-mcp** - Unity Editor control
3. **pydantic/logfire-mcp** - Enhanced observability

See `.github/MCP_SERVER_TESTING_STATUS.md` for details.
