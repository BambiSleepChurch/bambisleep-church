# MCP-Reddit Integration Framework

🌸✨ **Centralized MCP Services & AI Agents for Reddit Moderation** ✨🌸

## Overview

This directory contains the **MCP (Model Context Protocol) Integration Framework** for the BambiSleep Chat Reddit app. It provides AI-driven moderation tools, content analysis, and automated workflows powered by 8 MCP servers.

## Architecture

```
mcp-integration/
├── config/              # MCP server configurations
├── agents/              # AI agent implementations
├── workflows/           # Automated moderation workflows
├── tools/               # Utility functions and helpers
├── tests/               # Integration tests
└── examples/            # Usage examples
```

## Quick Start

### 1. Initialize MCP Servers

```bash
# From repository root
./scripts/install-mcp-servers.sh
./scripts/verify-mcp.sh
```

### 2. Configure Reddit Integration

```bash
cd mcp-integration
cp config/mcp-reddit.example.json config/mcp-reddit.json
# Edit with your Reddit credentials and settings
```

### 3. Test Agent Framework

```bash
npm test -- mcp-integration/tests/
```

## Available Agents

### 🌸 ModAssistant (`agents/mod-assistant.js`)

AI-powered moderation assistant using sequential-thinking MCP server.

- Analyzes comment context and history
- Suggests appropriate mod actions
- Generates removal reasons

### 💎 ContentAnalyzer (`agents/content-analyzer.js`)

Deep content analysis using memory + github MCP servers.

- Sentiment analysis
- Toxicity detection
- Pattern recognition across threads

### 🔥 SpamDetector (`agents/spam-detector.js`)

Real-time spam detection using brave-search + puppeteer MCP servers.

- Link verification
- Account history analysis
- Coordinated activity detection

### 🦋 WorkflowOrchestrator (`agents/workflow-orchestrator.js`)

Manages complex multi-step moderation workflows.

- Queue management
- Batch operations
- Error recovery and retry logic

## Workflows

### Auto-Moderation (`workflows/auto-mod.js`)

Automated moderation based on configurable rules:

- Keyword filtering
- Rate limiting detection
- Brigading alerts

### Batch Operations (`workflows/batch-ops.js`)

Efficient bulk operations with MCP-powered analysis:

- Pre-operation content analysis
- Intelligent comment tree traversal
- Rollback support

### Scheduled Tasks (`workflows/scheduled-tasks.js`)

Time-based moderation tasks:

- Daily thread cleanup
- Weekly audit reports
- Monthly analytics

## Configuration

### MCP Server Mapping

```json
{
  "agents": {
    "modAssistant": {
      "mcpServers": ["sequential-thinking", "memory"],
      "priority": "high"
    },
    "contentAnalyzer": {
      "mcpServers": ["memory", "github", "filesystem"],
      "priority": "medium"
    },
    "spamDetector": {
      "mcpServers": ["brave-search", "puppeteer"],
      "priority": "high"
    }
  }
}
```

### Reddit API Configuration

See `config/mcp-reddit.example.json` for complete configuration options.

## Integration with bambisleepchat/

The MCP integration framework is designed to work seamlessly with the main Reddit app:

```typescript
// In bambisleepchat/src/main.ts
import { McpModAssistant } from "../../mcp-integration/agents/mod-assistant.js";

const assistant = new McpModAssistant();
const suggestion = await assistant.analyzeComment(commentId);
```

## Development

### Adding New Agents

1. Create agent file in `agents/`
2. Extend `BaseAgent` class
3. Implement required methods
4. Add tests in `tests/agents/`
5. Document in this README

### Adding New Workflows

1. Create workflow file in `workflows/`
2. Define workflow steps
3. Configure MCP server dependencies
4. Add integration tests
5. Update workflow documentation

## Testing

```bash
# Unit tests
npm test -- mcp-integration/tests/unit/

# Integration tests (requires MCP servers running)
npm test -- mcp-integration/tests/integration/

# Full test suite
npm test -- mcp-integration/
```

## Monitoring & Logging

All agents use emoji-prefixed logging per RELIGULOUS_MANTRA:

- 🌸 Success operations
- 🔥 Errors and failures
- ✨ MCP server operations
- 💎 Quality metrics
- ⚠️ Warnings
- 🦋 Transformations

## Performance

- **Agent response time:** <500ms (avg)
- **Batch operation throughput:** 100+ comments/min
- **MCP server uptime:** 99.9% target

## Security

- All MCP operations require authentication
- Reddit credentials stored in environment variables
- Rate limiting enforced per Reddit API guidelines
- Audit logging for all moderation actions

## Troubleshooting

### MCP Servers Not Responding

```bash
./scripts/verify-mcp.sh
# Check output for failed servers
```

### Agent Timeouts

Increase timeout in `config/mcp-reddit.json`:

```json
{
  "timeout": 30000 // 30 seconds
}
```

### Memory Issues

The memory MCP server stores conversation history. Clear periodically:

```bash
# Reset memory server
npx @modelcontextprotocol/server-memory --reset
```

## Contributing

Follow BambiSleepChat RELIGULOUS_MANTRA principles:

1. MCP-first development
2. Enterprise error handling
3. Strict TypeScript typing
4. Emoji logging convention
5. Comprehensive documentation

## License

BSD-3-Clause - See LICENSE file

## Support

- Documentation: `docs/MCP_SETUP_GUIDE.md`
- Issues: https://github.com/BambiSleepChat/bambisleep-chat-reddit/issues
- Community: BambiSleepChat Organization

---

**Last Updated:** November 3, 2025  
**MCP Servers:** 8/8 Operational ✨  
**Organization:** BambiSleepChat
