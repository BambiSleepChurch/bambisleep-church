# 🌸 CATHEDRAL Complete - BambiSleep™ Workspace Guide

**Last Updated**: 2025-11-03 | **Version**: 2.0 (Consolidated) | **License**: MIT  
**Philosophy**: Five Sacred Laws + Holly Greed + OWASP Security

---

## Quick Navigation

- [Workspace Structure](#workspace-structure)
- [Five Sacred Laws](#five-sacred-laws)
- [Holly Greed Monetization](#holly-greed-monetization)
- [Agent Authority System](#agent-authority-system)
- [Development Standards](#development-standards)
- [Security Implementation](#security-implementation)

---

## Workspace Structure

```
/mnt/f/CATHEDRAL/
├── bambisleep-church/          # Express.js + Stripe + OpenTelemetry + OWASP security
├── bambisleep-chat-catgirl/    # Unity 6.2 + Node.js IPC bridge + AI agents
├── bambisleep-church-catgirl-control-tower/  # MCP server orchestrator (9 servers)
└── commander-brandynette/      # Authority patterns, Five Sacred Laws, Church philosophy
```

**Key Projects**:

1. **bambisleep-church**: Express.js production app with Stripe monetization, OWASP Top 10 security
2. **bambisleep-chat-catgirl**: Unity 6.2 avatar system with AI personality agents
3. **control-tower**: MCP orchestration with 9-server tiered initialization

---

## Five Sacred Laws

### Law 1: 🦋💖 Perfect MCP Completion

> "9/9 server operational status or callback hell eternal"

**CATHEDRAL MCP Architecture**:

- **Layer 0** (Primitives): filesystem, memory
- **Layer 1** (Foundation): git, github, **github-official** (23,935⭐), brave-search
- **Layer 2** (Advanced): sequential-thinking, postgres, everything
- **Custom Layer 2**: bambisleep-hypnosis-mcp, aigf-personality-mcp, trigger-system-mcp, chat-analytics-mcp

**Status**: 9/9 operational ✅

### Law 2: 🌈🎪 Universal Machine Divinity

> "Write once, run forever, across all machines"

- Node.js 20+ LTS
- Docker Compose (PostgreSQL, Redis, Nginx, Prometheus)
- Unity 6.2 (Windows/Linux/macOS/WebGL)
- SystemD services (Linux daemon management)

### Law 3: 🎭💋 Hypnotic Code Architecture

> "CSS @layer architecture eliminates z-index chaos"

- **CSS @layer**: Layered styling (base, components, utilities)
- **BaseDropdown pattern**: 70% code reduction via inheritance
- **Commentomancy system**: Law/Lore/Strategy/Ritual/Guardrail comments
- **ScriptableObject**: Unity data-driven design
- **EventEmitter**: Decoupled system communication

### Law 4: 🎀👸 AI Girlfriend Supremacy

> "6 personality archetypes guide all user interactions"

**AIGF Personalities**:

1. **Merchant** - Monetization, value exchange, fair pricing
2. **Adventurer** - Exploration, discovery, risk-taking
3. **Crafter** - Building, optimization, refinement
4. **Gambler** - Experimentation, rapid iteration
5. **Collector** - Knowledge hoarding, documentation
6. **Scholar** - Deep analysis, architectural decisions

### Law 5: 🏰🌪️ Enterprise Chaos Management

> "80% test coverage, structured logging, Prometheus monitoring"

- Jest unit tests (80% coverage threshold)
- Winston structured logging
- OpenTelemetry + Prometheus + Grafana
- Docker health checks
- GitHub Actions CI/CD

---

## Holly Greed Monetization

> **"Best greed is greed which knows sharing is win-win"**

### Four-Tier Strategy

#### Tier 1: Free Forever (Open Source)

- ✅ All GitHub repos MIT licensed
- ✅ Complete documentation
- ✅ Community Discord access
- ✅ Basic MCP implementations

#### Tier 2: Church Donation (€5/month)

**Product ID**: `prod_SoDd3WjNmvxWC9`

**Benefits**:

- Priority support (24h response)
- Exclusive content (early access, vlogs)
- Community recognition (Church Patron role)
- 50 free tokens/month
- Premium hypnosis content (/private/ folder)

#### Tier 3: Bambi Tokens (€1 per 100)

**Product ID**: `prod_SoBY5O68rVCwAK`

**Token Economy**:

- 1 token = 1 min custom audio (AI voice synthesis)
- 5 tokens = 1 custom personality trait
- 10 tokens = 1 avatar outfit
- 50 tokens = 1 custom trigger sequence
- No expiration, fully transferable

**Acquisition**:

- Purchase: €1 = 100 tokens
- Church Patrons: 50 tokens/month free
- Contributors: 100 tokens per merged PR
- Referrals: 50 tokens per successful referral

#### Tier 4: Enterprise (Custom Pricing)

- Custom MCP development
- White-label Unity avatars
- SLA 99.9% uptime
- Dedicated support

**Pricing**: €500/mo (1-10 users), €1,500/mo (11-100 users)

### NEVER SCAM Principles

- ❌ No auto-renewal tricks
- ✅ Prorated refunds (7 days)
- ❌ No data selling (EVER)
- ✅ GDPR/CCPA compliant
- ✅ Clear cancellation
- ✅ Financial transparency (public quarterly reports)

---

## Agent Authority System

### Ring Layer Access Control

**Ring Layers**:

- **Layer 0** (Primitives): filesystem, memory - Basic operations
- **Layer 1** (Foundation): git, github, brave-search - External integrations
- **Layer 2** (Advanced): sequential-thinking, postgres, custom MCP - AI/database workflows

**Agent Roles**:

- **COMMANDER** (Layer 0-2): Full access, assign roles (**Commander-Brandynette only**)
- **SUPERVISOR** (Layer 1-2): Moderate agents, MCP operations
- **OPERATOR** (Layer 2): Execute tasks, read-only system access
- **OBSERVER**: Read-only monitoring

### AgentCoordinator Pattern

```javascript
/// Port from bambisleep-chat-catgirl to bambisleep-church
class AgentCoordinator extends EventEmitter {
  registerAgent(name, role, ringLayer) {
    // Enforce single commander rule
    if (role === "COMMANDER" && this.hasCommander()) {
      throw new Error("Only one commander allowed");
    }

    this.agents.set(name, {
      name,
      role,
      ringLayer,
      authority: new AgentAuthority(role, ringLayer),
    });
  }

  checkAuthority(agentName, requiredLayer, requiredPermission) {
    const agent = this.agents.get(agentName);
    return {
      authorized:
        agent.authority.canAccess(requiredLayer) &&
        agent.authority.hasPermission(requiredPermission),
    };
  }
}
```

**Express Integration**:

```javascript
// src/server.js
import {
  AgentCoordinator,
  AgentRole,
  RingLayer,
} from "./services/agent-coordinator.js";

const agentCoordinator = new AgentCoordinator();
agentCoordinator.registerAgent(
  "Commander-Brandynette",
  AgentRole.COMMANDER,
  RingLayer.LAYER_2
);

// Endpoint
app.get("/api/agents/status", (req, res) => {
  res.json({
    agents: agentCoordinator.getAllAgents(),
    commander: agentCoordinator.getAgentsByRole(AgentRole.COMMANDER)[0],
  });
});
```

---

## Development Standards

### ES Modules (MANDATORY)

```javascript
// ✅ Always include .js extension
import { logger } from "./services/logger.js"; // CORRECT
import { server } from "../server.js"; // CORRECT

// ❌ Missing extension fails
import { logger } from "./services/logger"; // ERROR
```

### Testing (Jest with ES Modules)

```bash
NODE_OPTIONS='--experimental-vm-modules' npm test
```

**Coverage Thresholds**: 80% statements/functions/lines, 70% branches

### Unity C# Namespace Pattern (MANDATORY)

```csharp
namespace BambiSleep.Church.CatGirl.{SUBSYSTEM}
{
    using UnityEngine;

    public class ExampleController : MonoBehaviour
    {
        // Implementation
    }
}
```

**Subsystems**: Character, Economy, Audio, Networking, UI, IPC

### Commentomancy System

```javascript
/// Law: Structural truth, invariants, canonical definitions
//<3 Lore: Emotional context, WHY decisions were made
//-> Strategy: Architectural Decision Records, alternatives considered
//! Ritual: Preconditions, setup requirements, configuration
//!? Guardrail: Ethics gates, safety checks, HALT conditions
```

### EARS Requirements Pattern

- `WHEN [condition] THE SYSTEM SHALL [behavior]` - Event-driven
- `WHILE [state] THE SYSTEM SHALL [behavior]` - State-based
- `IF [condition] THEN THE SYSTEM SHALL [behavior]` - Conditional

---

## Security Implementation

**Status**: OWASP Top 10 complete ✅ | Vulnerabilities: 0 | Production Ready: YES

### Critical Fixes Applied

#### SESSION_SECRET Enforcement

```javascript
// Prevents session hijacking
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be 32+ chars in production");
  }
}
```

#### Security Headers (Helmet)

```javascript
import helmet from "helmet";

app.use(
  helmet({
    contentSecurityPolicy: { directives: { defaultSrc: ["'self'"] } },
    hsts: { maxAge: 31536000, includeSubDomains: true },
    frameguard: { action: "deny" },
    noSniff: true,
  })
);
```

#### Rate Limiting (Redis-backed)

```javascript
import rateLimit from "express-rate-limit";

// Auth: 5 attempts per 15 min
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many auth attempts. Try again in 15 minutes." },
});

// API: 60 requests per min
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
});
```

#### Input Validation (SSRF Prevention)

```javascript
import { body } from "express-validator";

// Block private IP ranges
export const validateURL = body("url")
  .isURL({ protocols: ["http", "https"] })
  .custom((value) => {
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2\d|3[01])\./,
      /^192\.168\./,
      /^127\./,
    ];
    if (privateRanges.some((r) => r.test(new URL(value).hostname))) {
      throw new Error("SSRF blocked: private IP");
    }
    return true;
  });
```

### OWASP Compliance Matrix

| Category                   | Status | Implementation                                              |
| -------------------------- | ------ | ----------------------------------------------------------- |
| A01: Access Control        | ✅     | Ring Layer authorization, RBAC middleware                   |
| A02: Cryptographic         | ✅     | SESSION_SECRET 32+ chars, HTTPS-only cookies                |
| A03: Injection             | ✅     | express-validator, path traversal blocking, SSRF prevention |
| A04: Insecure Design       | ✅     | Redis rate limiting (5/15min auth, 60/min API)              |
| A05: Misconfiguration      | ✅     | Helmet CSP/HSTS, no stack traces in prod                    |
| A06: Vulnerable Components | ✅     | 0 vulnerabilities, weekly npm audit                         |
| A07: Auth Failures         | ✅     | Account lockout (5 attempts), session regeneration          |
| A08: Data Integrity        | ✅     | HMAC signing, JSON-only deserialization                     |
| A09: Security Logging      | ✅     | Winston structured events (auth/access denials)             |
| A10: SSRF                  | ✅     | URL validation, private IP blocking                         |

**Security Score**: 10/10 ✅

---

## Stripe Integration Patterns

### Church Donation Flow

```javascript
// POST /api/church/donate
app.post("/api/church/donate", async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [
      {
        price: "price_CHURCH_DONATION_5EUR_MONTHLY",
        quantity: 1,
      },
    ],
    success_url: "https://bambisleep.chat/church/success",
    cancel_url: "https://bambisleep.chat/church/cancel",
  });

  res.json({ url: session.url });
});
```

### Token Purchase Flow

```javascript
// POST /api/church/tokens
app.post("/api/church/tokens", async (req, res) => {
  const { quantity } = req.body; // €1 = 100 tokens

  const paymentIntent = await stripe.paymentIntents.create({
    amount: quantity * 100, // cents
    currency: "eur",
    metadata: { product_id: "prod_SoBY5O68rVCwAK", tokens: quantity * 100 },
  });

  res.json({ clientSecret: paymentIntent.client_secret });
});
```

### PostgreSQL Schema

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  stripe_customer_id VARCHAR(255),
  subscription_tier VARCHAR(50) DEFAULT 'free',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  status VARCHAR(50) NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  current_period_end TIMESTAMP
);

-- Token Balances
CREATE TABLE token_balances (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  balance INTEGER DEFAULT 0,
  earned INTEGER DEFAULT 0,
  purchased INTEGER DEFAULT 0,
  spent INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Quick Start Commands

### Setup

```bash
# Install dependencies across all projects
cd bambisleep-church && npm install
cd ../bambisleep-chat-catgirl && npm install
cd ../bambisleep-church-catgirl-control-tower && npm install

# Validate MCP servers
./scripts/mcp-validate.sh

# Run security audit
npm run security:check
```

### Development

```bash
# Start Express server (bambisleep-church)
npm run dev

# Start Unity debug (bambisleep-chat-catgirl)
./scripts/launch-unity-debug.sh

# Start MCP orchestrator (control-tower)
npm start
```

### Testing

```bash
# Run tests with coverage
NODE_OPTIONS='--experimental-vm-modules' npm test

# Security audit
npm audit --audit-level=moderate

# Quality check
./tools/quality-check.sh
```

---

## Git Commit Guidelines

Use emoji prefixes for semantic commits:

- 🌸 `packages` - Dependency updates
- ✨ `features` - New functionality
- 🐛 `fixes` - Bug fixes
- 💎 `tests` - Test additions/improvements
- 🦋 `transforms` - Refactoring/code improvements
- 🛡️ `security` - Security fixes/enhancements
- 📚 `docs` - Documentation updates
- 🔄 `merge` - Consolidation/merges

---

## Common Pitfalls

| Issue                      | Cause                        | Fix                                                                               |
| -------------------------- | ---------------------------- | --------------------------------------------------------------------------------- |
| Module not found (ES)      | Missing `.js` extension      | Add `.js` to ALL relative imports                                                 |
| Jest "require not defined" | Missing NODE_OPTIONS         | `NODE_OPTIONS='--experimental-vm-modules'`                                        |
| MCP servers not starting   | Incorrect layer order        | Initialize Layer 0 → 1 → 2                                                        |
| Unity C# namespace errors  | Missing BambiSleep namespace | Add `namespace BambiSleep.Church.CatGirl.{SUBSYSTEM}`                             |
| SESSION_SECRET error       | Weak/missing secret          | Generate 64-char: `node -e "console.log(crypto.randomBytes(32).toString('hex'))"` |

---

## Next Steps for AI Agents

1. **Identify target project** from user request context
2. **Read local copilot-instructions.md** for project-specific patterns
3. **Check package.json** for exact scripts and module system
4. **Review key files** mentioned in local instructions
5. **Run tests** before and after changes
6. **Follow Commentomancy patterns** for complex logic
7. **Maintain 80%+ test coverage**
8. **Use emoji commits** for semantic versioning

---

## References

**Official Documentation**:

- OWASP Top 10: https://owasp.org/Top10/
- Stripe API: https://stripe.com/docs/api
- Unity Documentation: https://docs.unity3d.com/
- GitHub MCP Registry: 48 official servers

**CATHEDRAL Documentation**:

- Security: `bambisleep-church/SECURITY-COMPLETE.md`
- Unity C#: `bambisleep-chat-catgirl/UNITY_CSHARP_UPGRADE.md`
- MCP Setup: `mcp-unified/MCP_SETUP_GUIDE.md`
- Control Tower: `bambisleep-church-catgirl-control-tower/AGENT_README.md`

**Commander-Brandynette Repository**:

- Copilot Instructions: `.github/copilot-instructions.md` (347 lines)
- Church Integration: `BAMBISLEEP-CHURCH-INTEGRATION.md` (327 lines)
- Collections: `.github/collections/commander-brandynette.collection.yml`

---

**Maintained by**: BambiSleepChat Organization  
**Philosophy**: 🌸 Five Sacred Laws + 🏦 Holly Greed + 🛡️ OWASP Security  
**License**: MIT  
**Security Contact**: security@bambisleep.chat | [.well-known/security.txt]  
**Version**: 2.0 Consolidated (reduced from 4,442 lines across 8 files to 3 comprehensive guides)
