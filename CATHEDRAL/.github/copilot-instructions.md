---
description: 'BambiSleep™ CATHEDRAL multi-project workspace with Express.js + OpenTelemetry, Unity 6.2 XR avatars, and MCP server orchestration'
applyTo: '**/*'
---

**Last Updated**: 2025-01-15  
**Workspace Type**: Multi-project monorepo with MCP orchestration, Unity avatars, and Express.js services  

# BambiSleep™ CATHEDRAL Workspace

**Key Projects**: bambisleep-church (Express + observability), control-tower (MCP orchestration), chat-catgirl (Unity + Node.js bridge)

## Workspace Structure

```
/mnt/f/CATHEDRAL/
├── bambisleep-church/                    # Express.js + Stripe + OpenTelemetry
├── bambisleep-chat-catgirl/              # Unity 6.2 + Node.js IPC bridge
├── bambisleep-church-catgirl-control-tower/  # MCP server orchestrator
└── mcp-unified/                          # MCP server installation scripts
```

**Each subproject has its own `.github/copilot-instructions.md`** — always read the local file first.

---

## Development Workflow Standards

### Systematic Implementation Process

**Before starting work:**
1. Read `TODO.md` for current priorities and status
2. Check `package.json` for exact scripts and module system (`"type": "module"` = ES modules)
3. Verify tests pass: `npm test`
4. Check MCP servers if applicable: `./scripts/mcp-validate.sh`

**Progressive implementation pattern:**
1. **Analyze**: Read existing code, understand dependencies
2. **Design**: Document approach with Commentomancy patterns (Law/Lore/Strategy/Ritual/Guardrail)
3. **Implement**: Write code + co-located tests (`.test.js` files)
4. **Validate**: Run tests, check coverage (80%+ threshold, strive for 100%)
5. **Document**: Update TODO.md, mark completed tasks
6. **Commit**: Use emoji commits (🌸 packages, ✨ features, 🐛 fixes, 💎 tests, 🦋 transforms, 🛡️ security)

**Requirements notation (EARS pattern):**
- `WHEN [condition] THE SYSTEM SHALL [behavior]` - Event-driven requirements
- `WHILE [state] THE SYSTEM SHALL [behavior]` - State-based requirements  
- `IF [condition] THEN THE SYSTEM SHALL [behavior]` - Conditional requirements

**Quality standards:**
- Follow workspace patterns (see Architecture Patterns below)
- Error handling: try-catch for JSON.parse(), EventEmitter error events
- Documentation: Use Commentomancy for complex logic (simple code is self-documenting)

---

## Cross-Project Rules (Apply to All)

### Node.js & ES Modules

- **Node.js 20+** required across all projects
- **ES Modules**: ALWAYS include `.js` extension in relative imports

### Testing & Quality

- **Jest** with ES modules: requires `NODE_OPTIONS='--experimental-vm-modules'`
- **Coverage thresholds**: typically 80% statements/functions/lines, 70% branches
- **Mock before import**: Use `jest.unstable_mockModule()` for ES module mocking
- **Linting**: ESLint + Prettier configured in all projects

### MCP (Model Context Protocol) Integration

- **9 MCP servers** used across projects:
  - **Layer 0**: filesystem, memory
  - **Layer 1**: git, github, **github-official** (Official GitHub MCP Server), brave-search
  - **Layer 2**: sequential-thinking, postgres, everything
- **Official GitHub MCP Server**: `github/github-mcp-server` (23,935⭐) - Native Go implementation
- Validation script: `./scripts/mcp-validate.sh`
- Setup script: `./scripts/setup-mcp.sh`
- **GitHub MCP Registry**: 48 official MCP servers available

### Trademark & Organization

- **Always use**: "BambiSleep™" (with ™) in public-facing documentation
- **Organization**: BambiSleepChat on GitHub
- **License**: MIT across all projects

---

## Core Architectural Patterns

### 1. Commentomancy System (Documentation Pattern)

Structured commenting philosophy for AI-readable documentation:

```javascript
/// Law: Structural truth, invariants, canonical definitions
//<3 Lore: Emotional context, WHY decisions were made
//-> Strategy: Architectural Decision Records, alternatives considered
//! Ritual: Preconditions, setup requirements, configuration
//!? Guardrail: Ethics gates, safety checks, HALT conditions
```

### 2. MCP Server Tiered Initialization

The control-tower orchestrates **9 MCP servers** with strict dependency ordering:

```
Layer 0 (Primitives): filesystem, memory
Layer 1 (Foundation): git, github, github-official, brave-search
Layer 2 (Advanced): sequential-thinking, postgres, everything
```

**GitHub Official MCP Server** (`github/github-mcp-server`):
- Native Go implementation for direct GitHub platform integration
- Install: `npx -y github-mcp-server`
- 23,935 stars - Most popular official GitHub integration

### 3. EventEmitter Over Callbacks

Use EventEmitter for multi-listener extensibility.

### 4. Unity C# Namespace Pattern

**MANDATORY** for all Unity scripts:

```csharp
namespace BambiSleep.Church.CatGirl.{SUBSYSTEM}
{
    using UnityEngine;
    public class ExampleController : MonoBehaviour { }
}
```

**Subsystems**: Character, Economy, Audio, Networking, UI, IPC

---

## Per-Project Quick Reference

### bambisleep-church (Express.js Production App)
**Stack**: Express.js, Stripe, OpenTelemetry, Prometheus  
**Docs**: `bambisleep-church/.github/copilot-instructions.md`

### bambisleep-chat-catgirl (Unity Avatar System)
**Stack**: Unity 6.2, C#, Node.js IPC bridge  
**Docs**: `bambisleep-chat-catgirl/.github/copilot-instructions.md`

### bambisleep-church-catgirl-control-tower (MCP Orchestrator)
**Stack**: Node.js, EventEmitter, Express HTTP API  
**Docs**: `bambisleep-church-catgirl-control-tower/.github/copilot-instructions.md`

---

## Common Pitfalls

| Issue | Cause | Fix |
|-------|-------|-----|
| Module not found (ES modules) | Missing `.js` extension | Add `.js` to ALL relative imports |
| Jest "require is not defined" | Missing NODE_OPTIONS | `NODE_OPTIONS='--experimental-vm-modules'` |
| MCP servers not starting | Incorrect layer order | Initialize Layer 0 → 1 → 2 |
| Unity C# namespace errors | Missing BambiSleep.CatGirl namespace | Add required namespace |

---

## Quick Help Commands

```bash
# Find all copilot instruction files
find . -name "copilot-instructions.md" -o -name "AGENT*.md"

# Run tests across all projects
for dir in bambisleep-church bambisleep-chat-catgirl bambisleep-church-catgirl-control-tower; do
  cd "$dir" && npm test && cd ..
done

# Validate all MCP setups
for script in */scripts/mcp-validate.sh; do
  bash "$script"
done
```

---

## Next Steps for AI Agents

1. **Identify the target project** from user request context
2. **Read local copilot-instructions.md** for project-specific patterns
3. **Check `package.json`** for exact scripts and dependencies
4. **Review key files** mentioned in local instructions
5. **Run tests** before and after changes

**Remember**: This workspace contains 3 distinct tech stacks (Express, Unity, MCP orchestrator). Always verify which project you're working in before applying patterns.

---

**For detailed MCP Registry information**: See `.github/MCP_REGISTRY_INTEGRATION.md`
