# GitHub Copilot Agent Instructions: BambiSleep Church Project

This repository implements a **C# client-server application** for church management infrastructure. The project follows a clean three-tier architecture with shared DTOs and interfaces.

⚠️ **CURRENT STATE**: This is an **early-stage skeleton project** with scaffolding in place but minimal implementation. Tests exist but service implementations don't match test expectations. Focus on understanding the _intended_ architecture while recognizing the implementation gaps.

## Architecture Overview

**Three-tier C# architecture:**

1. **Client** (`src/client/`): User-facing application that interacts with church management services
2. **Server** (`src/server/`): Backend processing for handling client requests and managing resources
3. **Shared** (`src/shared/`): Common DTOs, interfaces, and contracts used by both tiers

**Key principle**: Maintain **strict separation** between client and server logic. All communication should occur through well-defined DTOs in the `shared` namespace.

**Solution structure**: Multi-project Visual Studio solution (`bambisleep-church.sln`) targeting .NET with separate projects for client and server.

⚠️ **CRITICAL INCONSISTENCIES TO BE AWARE OF**:

- Client tests use **MSTest**, server tests use **xUnit** (inconsistent test frameworks)
- Test namespaces use `bambisleep_church` (underscores), but code uses `BambisleepChurch` (PascalCase)
- Service method signatures don't match what tests expect (services return `void`, tests expect return values)
- `SharedDTO.cs` has **no namespace declaration** (legacy issue)

## Critical File Locations

- **`bambisleep-church.sln`**: Visual Studio solution file coordinating all projects
- **`src/client/Program.cs`**: Client application entry point (namespace: `BambisleepChurch.Client`)
- **`src/server/Program.cs`**: Server application entry point (namespace: `BambisleepChurch.Server`)
- **`src/shared/DTOs/SharedDTO.cs`**: Data transfer objects for client-server communication
- **`src/shared/Interfaces/IShared.cs`**: Common interfaces (includes `Initialize()` and `Validate()` contracts)
- **`tests/ClientTests/ClientServiceTests.cs`**: MSTest unit tests for client services (follows AAA pattern)
- **`tests/ServerTests/`**: Server-side test suite (structure mirrors client tests)

## Project Structure and Conventions

### Namespace Conventions

```csharp
// Client code
namespace BambisleepChurch.Client { }
namespace BambisleepChurch.Client.Services { }
namespace BambisleepChurch.Client.Models { }

// Server code
namespace BambisleepChurch.Server { }
namespace BambisleepChurch.Server.Services { }
namespace BambisleepChurch.Server.Models { }

// Shared code
namespace BambisleepChurch.Shared.Interfaces { }
// Note: SharedDTO.cs currently has NO namespace (legacy - consider migrating to BambisleepChurch.Shared.DTOs)
```

### Model Patterns

**Client models** (e.g., `ClientModel.cs`) contain user/client data:

```csharp
public class ClientModel {
    public int Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
}
```

**Server models** (e.g., `ServerModel.cs`) contain operational metadata:

```csharp
public class ServerModel {
    public int Id { get; set; }
    public string Status { get; set; }
    public TimeSpan Uptime { get; set; }
}
```

**Shared DTOs** combine both perspectives:

```csharp
public class SharedDTO {
    public int Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    public string Status { get; set; }    // Server data
    public string Uptime { get; set; }    // Server data
}
```

### Interface Contract Pattern

The `IShared` interface defines a common contract for shared entities:

```csharp
public interface IShared {
    Guid Id { get; set; }               // GUID-based identity
    string Name { get; set; }
    DateTime CreatedAt { get; set; }

    void Initialize();                   // Setup/bootstrap logic
    void Validate();                     // Data integrity checks
}
```

**Note**: Current models use `int Id`, but `IShared` uses `Guid Id`. Future implementations should reconcile this inconsistency.

## Developer Workflows

### 1. Building the Solution

**Build entire solution** (from repository root):

```powershell
dotnet restore
dotnet build bambisleep-church.sln
```

**Build specific projects**:

```powershell
# Client only
cd src/client
dotnet build

# Server only
cd src/server
dotnet build
```

**Build configurations**:

- `Debug|Any CPU` (default, includes debugging symbols)
- `Release|Any CPU` (optimized, for production deployment)

### 2. Running Applications

**Run client application**:

```powershell
cd src/client
dotnet run
# Output: "Client application started."
```

**Run server application**:

```powershell
cd src/server
dotnet run
# Output: "Starting Bambisleep Church Server..."
```

**Note**: Current implementations are skeletal. Server lacks service initialization; client starts service but doesn't implement full workflow.

### 3. Testing Patterns

⚠️ **CRITICAL INCONSISTENCY**: This project uses **TWO DIFFERENT test frameworks**:

- **Client tests** (`tests/ClientTests/`): Use **MSTest** with `[TestClass]`, `[TestMethod]`, `[TestInitialize]`
- **Server tests** (`tests/ServerTests/`): Use **xUnit** with `[Fact]` and constructor-based setup

This is a **known technical debt** that should be standardized to one framework.

**Run all tests** (from solution root):

```powershell
dotnet test
```

**Run specific test project**:

```powershell
dotnet test tests/ClientTests/ClientServiceTests.cs
dotnet test tests/ServerTests/
```

**MSTest conventions** (used in CLIENT tests):

```csharp
[TestClass]
public class ClientServiceTests {
    private ClientService _clientService;

    [TestInitialize]  // Runs before each test
    public void Setup() {
        _clientService = new ClientService();
    }

    [TestMethod]  // Marks test method
    public void TestFetchClientData_ValidId_ReturnsClientModel() {
        // Arrange
        var clientId = 1;

        // Act
        var result = _clientService.FetchClientData(clientId);

        // Assert
        Assert.IsNotNull(result);
        Assert.AreEqual(clientId, result.Id);
    }
}
```

**Test naming convention**: `{MethodUnderTest}_{Scenario}_{ExpectedOutcome}`

- Example: `TestFetchClientData_InvalidId_ReturnsNull`
- Example: `TestManageClientInteraction_NullClientModel_ReturnsFalse`

**xUnit conventions** (used in SERVER tests):

```csharp
public class ServerServiceTests {
    private readonly ServerService _serverService;

    public ServerServiceTests() {  // Constructor runs before each test
        _serverService = new ServerService();
    }

    [Fact]  // Marks test method
    public void Test_ProcessRequest_ShouldReturnExpectedResult() {
        // Arrange
        var request = "Test Request";
        var expectedResponse = "Expected Response";

        // Act
        var result = _serverService.ProcessRequest(request);

        // Assert
        Assert.Equal(expectedResponse, result);
    }
}
```

**Test naming convention for xUnit**: `Test_{MethodUnderTest}_Should{ExpectedOutcome}`

- Example: `Test_ProcessRequest_ShouldReturnExpectedResult`
- Example: `Test_ManageResources_ShouldIncreaseResourceCount`

### 4. Service Layer Patterns

**Current service implementations are minimal**:

`ClientService.cs` (actual implementation):

```csharp
public class ClientService {
    public void FetchClientData() { /* Logic to fetch client data */ }
    public void ManageClientInteraction() { /* Logic to manage client interactions */ }
}
```

`ServerService.cs` (actual implementation):

```csharp
public class ServerService {
    public void ProcessRequest() { /* Logic to process server requests */ }
    public void ManageResources() { /* Logic to manage server resources */ }
}
```

**BUT** test expectations show intended signatures:

```csharp
// ClientServiceTests.cs expects:
ClientModel FetchClientData(int clientId)  // Returns ClientModel, takes int parameter
bool ManageClientInteraction(ClientModel clientModel)  // Returns bool

// ServerServiceTests.cs expects:
string ProcessRequest(string request)  // Returns string
int GetResourceCount()  // Returns int (called in test)
void ManageResources()  // Returns void (matches implementation)
```

⚠️ **CRITICAL**: Service methods currently return `void` with no parameters, but tests expect specific signatures with parameters and return values.

**When implementing services**:

1. Match method signatures to test expectations exactly
2. Add proper parameter validation
3. Return appropriate types (not `void`)
4. Handle null/invalid inputs gracefully (tests verify this)

## Code Quality and Testing Standards

### Testing Principles

1. **AAA Pattern**: Arrange → Act → Assert (strictly followed in all tests)
2. **Test isolation**: Each test has independent setup via `[TestInitialize]`
3. **Descriptive naming**: Test names describe scenario and expected outcome
4. **Null handling**: Always test null/invalid input cases (see `TestManageClientInteraction_NullClientModel_ReturnsFalse`)

### Common Test Patterns

```csharp
// Pattern 1: Valid input returns expected result
[TestMethod]
public void TestMethod_ValidInput_ReturnsExpected() {
    var validData = /* ... */;
    var result = _service.Method(validData);
    Assert.IsNotNull(result);
    Assert.AreEqual(expectedValue, result.Property);
}

// Pattern 2: Invalid input returns null/false/error
[TestMethod]
public void TestMethod_InvalidInput_ReturnsNull() {
    var invalidData = /* ... */;
    var result = _service.Method(invalidData);
    Assert.IsNull(result);  // or Assert.IsFalse(result)
}
```

## Known Technical Debt and Inconsistencies

### 1. Namespace Inconsistency

**Issue**: `SharedDTO.cs` has NO namespace declaration, while all other files follow `BambisleepChurch.*` pattern.

**Current state**:

```csharp
// SharedDTO.cs (MISSING NAMESPACE)
public class SharedDTO { /* ... */ }

// IShared.cs (HAS NAMESPACE)
namespace BambisleepChurch.Shared.Interfaces { /* ... */ }
```

**Additional inconsistency**: Test files use `bambisleep_church` (underscores) instead of `BambisleepChurch` (PascalCase):

```csharp
// ClientServiceTests.cs
using bambisleep_church.client.Services;  // ❌ Underscores
using bambisleep_church.client.Models;    // ❌ Underscores

// ServerServiceTests.cs
using bambisleep_church.src.server.Services;  // ❌ Underscores + extra "src"
```

**Recommendation**:

1. Add `namespace BambisleepChurch.Shared.DTOs` to `SharedDTO.cs`
2. Standardize test namespaces to match code: `BambisleepChurch.Client.*`, not `bambisleep_church.*`

### 1a. Test Framework Inconsistency

**Issue**: Client tests use **MSTest**, but server tests use **xUnit**.

**Current state**:

```csharp
// ClientServiceTests.cs (MSTest)
using Microsoft.VisualStudio.TestTools.UnitTesting;
[TestClass]
public class ClientServiceTests { ... }

// ServerServiceTests.cs (xUnit)
using Xunit;
public class ServerServiceTests { ... }
```

**Impact**: Different test patterns, setup methods (`[TestInitialize]` vs constructor), and assertion libraries. Makes maintenance harder.

**Recommendation**: Standardize on one framework (MSTest or xUnit) across all test projects.

### 2. ID Type Mismatch

**Issue**: Models use `int Id`, but `IShared` interface requires `Guid Id`.

**Current implementations**:

- `ClientModel.Id`: `int`
- `ServerModel.Id`: `int`
- `SharedDTO.Id`: `int`
- `IShared.Id`: `Guid` ⚠️ INCOMPATIBLE

**Impact**: No model currently implements `IShared`. Interface appears unused.

**Recommendation**: Either:

- Change all models to `Guid Id` (breaking change)
- Create new base class `SharedEntity : IShared` for future use
- Remove `IShared` if truly unused

### 3. Service Implementation Gap

**Issue**: Service classes have method stubs, but tests expect specific signatures.

**ClientService.cs** (actual):

```csharp
public void FetchClientData() { }  // Returns void
public void ManageClientInteraction() { }  // Returns void
```

**ClientServiceTests.cs** (expectations):

```csharp
var result = _clientService.FetchClientData(clientId);  // Expects ClientModel return
var success = _clientService.ManageClientInteraction(clientModel);  // Expects bool return
```

**Action required**: Implement services to match test expectations, or update tests to match service design.

### 4. Uptime Type Inconsistency

**Issue**: `ServerModel.Uptime` is `TimeSpan`, but `SharedDTO.Uptime` is `string`.

**Current state**:

```csharp
// ServerModel.cs
public TimeSpan Uptime { get; set; }  // Strongly typed

// SharedDTO.cs
public string Uptime { get; set; }  // String representation
```

**Impact**: Requires conversion when mapping `ServerModel` → `SharedDTO`. No utility methods exist yet.

**Recommendation**: Create mapper extension or keep both types with explicit conversion logic.

## Quick Reference Commands

### Build and Run

```powershell
# Full solution build + test
dotnet restore; dotnet build; dotnet test

# Run client
cd src/client; dotnet run

# Run server
cd src/server; dotnet run

# Clean build
dotnet clean; dotnet build --configuration Release
```

### Development Workflow

```powershell
# Watch mode (auto-rebuild on file changes)
dotnet watch --project src/client run
dotnet watch --project src/server run

# Run specific test class
dotnet test --filter FullyQualifiedName~ClientServiceTests

# Generate code coverage (requires coverlet)
dotnet test /p:CollectCoverage=true /p:CoverletOutputFormat=opencover
```

## AI Agent Guidelines

### When Adding New Features

1. **Check namespace conventions**: All new files MUST have proper `BambisleepChurch.*` namespaces
2. **Update both tiers**: If adding client functionality, consider server counterpart
3. **Define DTOs first**: Communication contracts go in `src/shared/DTOs/`
4. **Write tests before implementation**: Follow TDD (test file templates exist in `tests/`)
5. **Match test expectations**: If tests exist, implement to satisfy them exactly

### When Refactoring

1. **Preserve DTO compatibility**: Client-server boundary is sacred
2. **Update ALL three layers**: Client, Server, and Shared (if applicable)
3. **Run full test suite**: `dotnet test` must pass before committing
4. **Document breaking changes**: Update this file if changing patterns

### When Debugging

1. **Check namespace imports**: Missing `using` statements are common
2. **Verify project references**: Shared project must be referenced by both client and server
3. **Check test setup**: `[TestInitialize]` runs before EACH test method
4. **Examine DTO mappings**: Type mismatches between models and DTOs cause runtime errors

## Current Implementation Status

**Implemented**:

- ✅ Solution structure with 2 projects (client + server)
- ✅ Shared DTOs and interfaces
- ✅ Test scaffolding with MSTest
- ✅ Basic namespace organization
- ✅ Test patterns (AAA, descriptive naming)

**Partially Implemented**:

- ⚠️ Service layer (stubs exist, full logic missing)
- ⚠️ Client-server communication (no actual networking yet)
- ⚠️ DTO usage (defined but not actively used in services)

**Not Yet Implemented**:

- ❌ Network communication layer
- ❌ Data persistence
- ❌ Configuration management
- ❌ Logging infrastructure
- ❌ Error handling patterns
- ❌ Dependency injection container

## Future Development Path

Based on current architecture, logical next steps:

1. **Implement service layer logic** (align with test expectations)
2. **Add communication protocol** (HTTP REST, gRPC, or SignalR)
3. **Implement DTO mapping utilities** (AutoMapper or manual mappers)
4. **Resolve ID type inconsistency** (int vs Guid)
5. **Add dependency injection** (Microsoft.Extensions.DependencyInjection)
6. **Implement data persistence** (Entity Framework Core or Dapper)
7. **Add structured logging** (Serilog or NLog)
8. **Create integration tests** (test client-server communication end-to-end)

---

## Advanced Integration Patterns (Optional Reference)

The following sections contain **advanced integration patterns** for future enhancements (MCP, Stripe, FFmpeg, security). These are **NOT currently implemented** in the codebase but preserved as reference material for potential future development.

**Note to AI agents**: The sections below (## Developer Workflows [MCP], ## Security and Compliance Rules, etc.) describe **aspirational architecture**, not current implementation. Consult them only when explicitly implementing those features.

---

## Developer Workflows [MCP Integration - FUTURE]

```powershell
# Install VSCode extensions
code --install-extension GitHub.copilot
code --install-extension GitHub.copilot-chat

# Verify Copilot subscription and sign in
# Command Palette: "GitHub Copilot: Sign In"
# Check model availability: Settings > Copilot > Model Selector
```

**Model Access**: Claude Sonnet 4 requires Copilot Pro/Enterprise subscription. If missing, check:

- Extension version (update to latest)
- Subscription plan (upgrade if on Free tier)
- Geographic/org policy restrictions

### 2. MCP Server Configuration

**Add Stripe MCP server** (`.vscode/mcp.json`):

```json
{
  "mcpServers": {
    "stripe": {
      "command": "npx",
      "args": ["-y", "@stripe/mcp", "--tools=all"],
      "env": {
        "STRIPE_SECRET_KEY": "${input:stripe_key}"
      }
    }
  }
}
```

**Safe secret handling**: Use `${input:varname}` for interactive prompts; NEVER hardcode keys.

**Add server via Command Palette**: `Ctrl+Shift+P` → "MCP: Add Server"

### 3. Build and Test Commands

**Python3-based MCP server**:

```powershell
python3 -m venv .venv
.\.venv\Scripts\Activate
pip install -r requirements.txt
pytest -q tests/
```

**Node.js-based MCP server**:

```powershell
npm ci
npm test
npm run lint
```

**Docker-based deployment**:

```powershell
docker-compose up --build
docker-compose down
```

**Stripe CLI testing** (simulate webhooks):

```powershell
stripe listen --forward-to https://bambisleep.church/webhook
stripe trigger payment_intent.succeeded
```

### 4. MCP Protocol Testing

**MCP Inspector** (validate tool registration and JSON-RPC compliance):

```powershell
npx @modelcontextprotocol/inspector npx -y @stripe/mcp --tools=all
```

**List available tools**:

```powershell
mcp-tools list
```

**Invoke a tool directly** (for CI/unit tests):

```powershell
mcp-tools call stripe create_customer '{"name":"Test User","email":"test@bambisleep.church"}'
```

## Security and Compliance Rules

### DO:

- **Use restricted API keys** with minimal scope per MCP server (e.g., Stripe key with only `customers:read`, `payment_intents:write`)
- **Store secrets in environment variables** or secrets managers (HashiCorp Vault, AWS Secrets Manager)
- **Verify webhook signatures** for all Stripe webhook endpoints
- **Use OAuth 2.1 + Dynamic Client Registration** for production multi-user deployments
- **Implement least-privilege access**: expose only necessary tools per role/environment
- **Rotate API keys regularly** (automate with CI or secrets manager)
- **Audit log all tool invocations** (timestamp, user, tool, parameters, result)
- **Use HTTPS** for all remote MCP servers and webhook endpoints
- **Validate input schemas** strictly for all tool parameters (JSON schema enforcement)

### DON'T:

- **Never commit secrets** to version control (use `.env.example` with placeholder values)
- **Never use test API keys** in the live system (always use `sk_live_` keys with proper security)
- **Never store raw payment card data** (use Stripe's hosted payment elements)
- **Never auto-modify CI workflows** or infrastructure IaC files without maintainer approval
- **Never expose global "root" API keys** to MCP tools
- **Never skip webhook signature verification** (prevents replay attacks)

### PCI DSS and Privacy:

- **Stripe is PCI Level 1 compliant**, but your integration must adhere to PCI DSS standards
- **Use tokenized payment flows** (Stripe Elements, Payment Links)
- **GDPR/PII**: Do not persist unnecessary customer data; use tokenization and masking
- **File SAQ (Self-Assessment Questionnaire)** annually per your integration path

## Stripe MCP Server: Tool Inventory

**Available tools** (when `--tools=all`):

- `create_customer`, `list_customers` — Customer management
- `create_payment_intent`, `create_payment_link` — Payment flows
- `create_refund` — Refund processing
- `create_subscription`, `update_subscription`, `cancel_subscription` — Subscriptions
- `create_invoice`, `finalize_invoice` — Invoicing
- `create_product`, `create_price` — Product catalog
- `list_disputes`, `update_dispute` — Dispute management

**Example usage** (from Copilot Chat):

```
@workspace Create a payment link for Product ID prod_abc123, quantity 2
```

**Tool execution flow**:

1. Copilot Chat sends tool request to MCP client
2. MCP client forwards JSON-RPC request to Stripe MCP server
3. Server calls Stripe API with restricted key
4. Server returns result to client → Copilot → user

## Testing and Quality Gates

**Before committing code**:

1. Run unit tests: `pytest tests/` or `npm test`
2. Validate MCP protocol compliance: `npx @modelcontextprotocol/inspector <server-command>`
3. Test Stripe tools with live keys (verify key prefix: `sk_live_`)
4. Check for secrets leakage: `git diff | grep -E 'sk_live|sk_test|pk_live'`
5. Run linter: `eslint .` or `black .` (do not auto-apply formatting without approval)

**CI/CD gates** (recommended):

- Automated unit tests on PR
- MCP protocol conformance tests
- Secrets scanning (GitHub Advanced Security, Snyk, GitGuardian)
- Dependency vulnerability scans

## Monitoring and Observability

**Key metrics to track**:

- MCP tool invocation rate (requests/sec per tool)
- Tool execution latency (p95, p99)
- Error rate by tool (4xx/5xx responses)
- Webhook delivery success rate
- API key usage/rate limits

**Recommended stack**:

- **Prometheus**: Scrape `/metrics` endpoint from MCP servers
- **Grafana**: Dashboards for protocol health, tool performance, session analytics
- **Stripe Dashboard**: Monitor payments, refunds, disputes in real-time

**Alerting thresholds**:

- Tool error rate > 5%
- Webhook delivery failure > 10%
- API rate limit approaching (>80% of quota)
- Unauthorized access attempts

## Deployment Options

**CI/CD Pipeline** (unified deployment):

- Docker Compose or Kubernetes
- MCP servers as HTTP/SSE endpoints with OAuth 2.1 authentication
- Use managed gateways (MintMCP, Docker MCP Gateway) for centralized auth and audit logs
- Implement zero-downtime rolling deployments

**Enterprise scaling**:

- Deploy multiple MCP server instances behind load balancer
- Use Horizontal Pod Autoscaler (HPA) in Kubernetes
- Centralized secrets management (Vault, AWS Secrets Manager)
- SOC2/PCI compliance via managed solutions (MintMCP)

## Stripe Integration: Code Patterns (Production-Ready)

### Pattern 1: Initialize Stripe SDK (Required First Step)

**Python** (recommended for MCP servers):

```python
import stripe
import os

# CRITICAL: Load from environment variable, NEVER hardcode
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

# Verify API key format before any operations
if not stripe.api_key or not stripe.api_key.startswith("sk_live_"):
    raise ValueError("Invalid or missing STRIPE_SECRET_KEY - must use live key")

# Set API version for consistency (optional but recommended)
stripe.api_version = "2024-11-20"
```

**Node.js**:

```javascript
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY environment variable not set");
}
```

### Pattern 2: Customer Management (with error handling)

**Create customer with metadata**:

```python
import stripe

try:
    customer = stripe.Customer.create(
        name="Alice Johnson",
        email="alice@bambisleep.church",
        metadata={
            "mcp_user_id": "user_12345",
            "source": "copilot_agent",
            "created_via": "mcp_stripe_tool"
        },
        description="Created via MCP Copilot integration"
    )
    print(f"Customer created: {customer.id}")
except stripe.error.InvalidRequestError as e:
    print(f"Invalid request: {e.user_message}")
except stripe.error.AuthenticationError as e:
    print(f"Authentication failed: {e}")
except stripe.error.StripeError as e:
    print(f"Stripe error: {e}")
```

**List customers with filtering**:

```python
customers = stripe.Customer.list(
    limit=10,
    email="alice@bambisleep.church"  # Filter by email
)

for customer in customers.auto_paging_iter():
    print(f"{customer.id}: {customer.name} ({customer.email})")
```

### Pattern 3: Payment Intents (Recommended Payment Flow)

**Create payment intent**:

```python
import stripe

payment_intent = stripe.PaymentIntent.create(
    amount=1999,  # Amount in cents ($19.99)
    currency="usd",
    customer="cus_abc123",  # Link to existing customer
    payment_method_types=["card"],
    metadata={
        "order_id": "order_456",
        "integration": "mcp_copilot"
    },
    description="AI tool subscription - Monthly"
)

# Return client_secret to frontend for Stripe.js
print(f"Client secret: {payment_intent.client_secret}")
```

**Confirm payment intent (server-side)**:

```python
confirmed = stripe.PaymentIntent.confirm(
    payment_intent.id,
    payment_method="pm_card_visa"  # Test payment method
)

if confirmed.status == "succeeded":
    print("Payment successful!")
```

### Pattern 4: Payment Links (Simplest Integration)

**Create payment link for one-time purchase**:

```python
import stripe

# First, ensure you have a Price object
price = stripe.Price.create(
    unit_amount=2999,  # $29.99
    currency="usd",
    product="prod_abc123"  # Must exist in Stripe dashboard
)

payment_link = stripe.PaymentLink.create(
    line_items=[{
        "price": price.id,
        "quantity": 1
    }],
    after_completion={
        "type": "redirect",
        "redirect": {"url": "https://bambisleep.church/success"}
    }
)

print(f"Payment link: {payment_link.url}")
```

### Pattern 5: Subscriptions (Recurring Billing)

**Create subscription**:

```python
import stripe

subscription = stripe.Subscription.create(
    customer="cus_abc123",
    items=[{
        "price": "price_monthly_pro"  # Price ID from dashboard
    }],
    payment_behavior="default_incomplete",
    payment_settings={
        "payment_method_types": ["card"],
        "save_default_payment_method": "on_subscription"
    },
    expand=["latest_invoice.payment_intent"]
)

# Return client_secret for 3D Secure authentication
client_secret = subscription.latest_invoice.payment_intent.client_secret
```

**Update subscription (upgrade/downgrade)**:

```python
updated = stripe.Subscription.modify(
    "sub_abc123",
    items=[{
        "id": "si_item_id",  # Subscription item ID
        "price": "price_enterprise"  # New price tier
    }],
    proration_behavior="create_prorations"  # Bill immediately for difference
)
```

**Cancel subscription**:

```python
# Cancel at period end (recommended)
canceled = stripe.Subscription.modify(
    "sub_abc123",
    cancel_at_period_end=True
)

# Cancel immediately (refund logic needed separately)
canceled = stripe.Subscription.cancel("sub_abc123")
```

### Pattern 6: Usage-Based Billing (Metered)

**Create meter event** (for AI tool usage):

```python
import stripe
from datetime import datetime

# Record usage when MCP tool is invoked
meter_event = stripe.billing.MeterEvent.create(
    event_name="ai_tool_invocation",  # Must match meter in dashboard
    payload={
        "stripe_customer_id": "cus_abc123",
        "value": "1"  # Increment by 1 per invocation
    },
    timestamp=int(datetime.now().timestamp())
)
```

**Report usage** (legacy usage records API):

```python
stripe.SubscriptionItem.create_usage_record(
    "si_item_id",
    quantity=100,  # Number of tokens/requests/etc
    timestamp=int(datetime.now().timestamp()),
    action="increment"  # or "set"
)
```

### Pattern 7: Refunds

**Create refund** (full or partial):

```python
import stripe

# Full refund
refund = stripe.Refund.create(
    payment_intent="pi_abc123",
    reason="requested_by_customer"  # or "duplicate", "fraudulent"
)

# Partial refund
refund = stripe.Refund.create(
    payment_intent="pi_abc123",
    amount=500,  # Refund $5.00 of original amount
    reason="requested_by_customer"
)
```

### Pattern 8: Webhook Signature Verification (CRITICAL SECURITY)

**Complete webhook endpoint implementation**:

```python
from flask import Flask, request, jsonify
import stripe
import os

app = Flask(__name__)

# Load from environment
WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")  # whsec_...

@app.route("/webhook", methods=["POST"])
def stripe_webhook():
    payload = request.data
    sig_header = request.headers.get("Stripe-Signature")

    if not sig_header:
        return jsonify({"error": "No signature header"}), 400

    try:
        # CRITICAL: Verify signature before processing
        event = stripe.Webhook.construct_event(
            payload, sig_header, WEBHOOK_SECRET
        )
    except ValueError as e:
        # Invalid payload
        return jsonify({"error": "Invalid payload"}), 400
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        return jsonify({"error": "Invalid signature"}), 400

    # Handle specific event types
    if event["type"] == "payment_intent.succeeded":
        payment_intent = event["data"]["object"]
        customer_id = payment_intent.get("customer")
        amount = payment_intent.get("amount")
        print(f"Payment {payment_intent['id']} succeeded: ${amount/100}")

        # Your business logic here (e.g., provision access)

    elif event["type"] == "customer.subscription.deleted":
        subscription = event["data"]["object"]
        customer_id = subscription.get("customer")
        print(f"Subscription {subscription['id']} canceled")

        # Revoke access, notify customer

    elif event["type"] == "invoice.payment_failed":
        invoice = event["data"]["object"]
        customer_id = invoice.get("customer")
        print(f"Payment failed for invoice {invoice['id']}")

        # Notify customer, retry logic

    return jsonify({"status": "success"}), 200

if __name__ == "__main__":
    app.run(port=3000)
```

**Get webhook secret** (for testing):

```powershell
# Start Stripe CLI listener (forwards events to production)
stripe listen --forward-to https://bambisleep.church/webhook

# CLI will print webhook secret (whsec_...)
# Copy to .env file: STRIPE_WEBHOOK_SECRET=whsec_...
```

### Pattern 9: Products and Prices

**Create product**:

```python
import stripe

product = stripe.Product.create(
    name="AI Copilot Pro Plan",
    description="Advanced AI coding assistance with Claude Sonnet 4",
    metadata={
        "features": "unlimited_completions,priority_support",
        "tier": "pro"
    }
)
```

**Create price for product**:

```python
# One-time price
price = stripe.Price.create(
    product=product.id,
    unit_amount=9999,  # $99.99
    currency="usd"
)

# Recurring price (subscription)
monthly_price = stripe.Price.create(
    product=product.id,
    unit_amount=2999,  # $29.99/month
    currency="usd",
    recurring={
        "interval": "month",
        "interval_count": 1
    }
)

# Metered price (usage-based)
metered_price = stripe.Price.create(
    product=product.id,
    currency="usd",
    recurring={
        "interval": "month",
        "usage_type": "metered"
    },
    billing_scheme="tiered",
    tiers=[
        {"up_to": 1000, "unit_amount": 1},     # $0.01 per unit up to 1000
        {"up_to": 10000, "unit_amount": 0.5},  # $0.005 per unit up to 10k
        {"up_to": "inf", "unit_amount": 0.25}  # $0.0025 per unit after
    ],
    tiers_mode="graduated"
)
```

### Pattern 10: Error Handling (Production Standard)

```python
import stripe
from stripe.error import (
    CardError,
    RateLimitError,
    InvalidRequestError,
    AuthenticationError,
    APIConnectionError,
    StripeError
)

def safe_stripe_call(operation_name, operation_func, *args, **kwargs):
    """Wrapper for all Stripe API calls with comprehensive error handling"""
    try:
        return operation_func(*args, **kwargs)

    except CardError as e:
        # Customer's card was declined
        print(f"Card declined: {e.user_message}")
        return {"error": "payment_declined", "message": e.user_message}

    except RateLimitError as e:
        # Too many requests (429)
        print(f"Rate limit exceeded: {e}")
        return {"error": "rate_limit", "retry_after": 60}

    except InvalidRequestError as e:
        # Invalid parameters (400)
        print(f"Invalid request in {operation_name}: {e}")
        return {"error": "invalid_request", "details": str(e)}

    except AuthenticationError as e:
        # Authentication failed (401) - check API key
        print(f"Auth failed: {e}")
        raise  # Critical error - should not continue

    except APIConnectionError as e:
        # Network communication failed
        print(f"Network error: {e}")
        return {"error": "network_error", "retry": True}

    except StripeError as e:
        # Generic Stripe error
        print(f"Stripe error in {operation_name}: {e}")
        return {"error": "stripe_error", "details": str(e)}

    except Exception as e:
        # Unexpected error
        print(f"Unexpected error in {operation_name}: {e}")
        raise

# Usage example
result = safe_stripe_call(
    "create_customer",
    stripe.Customer.create,
    name="Test User",
    email="test@bambisleep.church"
)
```

## Authentication and Authorization (Production)

### OAuth 2.1 with Dynamic Client Registration

**Why OAuth 2.1 for MCP servers?**

- Enables per-user, scoped access to Stripe resources
- Supports token revocation and refresh flows
- Required for multi-tenant or enterprise deployments
- Complies with SOC2/ISO 27001 audit requirements

**OAuth flow for Stripe Connect** (if building a platform):

```python
import stripe
from flask import Flask, request, redirect

app = Flask(__name__)

@app.route("/oauth/authorize")
def oauth_authorize():
    # Step 1: Redirect user to Stripe OAuth
    params = {
        "client_id": os.getenv("STRIPE_CONNECT_CLIENT_ID"),
        "scope": "read_write",  # or "read_only"
        "redirect_uri": "https://bambisleep.church/oauth/callback",
        "state": generate_csrf_token()  # Prevent CSRF attacks
    }
    url = f"https://connect.stripe.com/oauth/authorize?{urlencode(params)}"
    return redirect(url)

@app.route("/oauth/callback")
def oauth_callback():
    # Step 2: Exchange authorization code for access token
    code = request.args.get("code")
    state = request.args.get("state")

    # Verify CSRF token
    if not verify_csrf_token(state):
        return "Invalid state parameter", 400

    # Exchange code for token
    response = stripe.OAuth.token(
        grant_type="authorization_code",
        code=code
    )

    # Store for connected account
    connected_account_id = response["stripe_user_id"]
    access_token = response["access_token"]
    refresh_token = response["refresh_token"]

    # Save securely (database, encrypted)
    save_tokens(connected_account_id, access_token, refresh_token)

    return "Authorization successful!"

def make_api_call_for_connected_account(account_id):
    """Use stored access token for connected account"""
    access_token = get_access_token(account_id)

    # Make API call on behalf of connected account
    customer = stripe.Customer.create(
        name="Customer Name",
        stripe_account=account_id  # Use connected account
    )

    return customer
```

**Token refresh flow**:

```python
def refresh_access_token(refresh_token):
    """Refresh expired access token"""
    response = stripe.OAuth.token(
        grant_type="refresh_token",
        refresh_token=refresh_token
    )

    new_access_token = response["access_token"]
    # Update stored token
    return new_access_token
```

### MCP Server Authentication Middleware

**For remote MCP servers (HTTP/SSE transport)**:

```python
from functools import wraps
from flask import request, jsonify
import jwt

def require_auth(f):
    """Middleware to verify JWT tokens for MCP server endpoints"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("Authorization", "").replace("Bearer ", "")

        if not token:
            return jsonify({"error": "No token provided"}), 401

        try:
            # Verify JWT signature
            payload = jwt.decode(
                token,
                os.getenv("JWT_SECRET"),
                algorithms=["HS256"]
            )

            # Check token expiration
            if payload.get("exp") < time.time():
                return jsonify({"error": "Token expired"}), 401

            # Attach user context
            request.user_id = payload.get("user_id")
            request.scopes = payload.get("scopes", [])

        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401

        return f(*args, **kwargs)

    return decorated

@app.route("/mcp/tool/create_customer", methods=["POST"])
@require_auth
def mcp_create_customer():
    """MCP tool endpoint with authentication"""
    # Verify user has required scope
    if "stripe:write" not in request.scopes:
        return jsonify({"error": "Insufficient permissions"}), 403

    # Execute Stripe operation
    data = request.json
    customer = stripe.Customer.create(
        name=data["name"],
        email=data["email"]
    )

    return jsonify({"customer_id": customer.id})
```

### API Key Rotation Strategy

**Automated key rotation** (recommended every 90 days):

```python
import stripe
from datetime import datetime, timedelta

def rotate_stripe_api_key():
    """Create new restricted key and deprecate old one"""
    # Step 1: Create new restricted key via Stripe Dashboard API
    # (requires manual creation or Stripe Partner API access)

    # Step 2: Update environment variable or secrets manager
    update_secret_in_vault("STRIPE_SECRET_KEY", new_key)

    # Step 3: Restart MCP servers with new key
    restart_mcp_servers()

    # Step 4: Delete old key after grace period (24 hours)
    schedule_key_deletion(old_key_id, delay_hours=24)

    # Log rotation event
    log_audit_event("api_key_rotated", {
        "timestamp": datetime.now().isoformat(),
        "old_key_prefix": old_key[:7],
        "new_key_prefix": new_key[:7]
    })
```

## Production Deployment Checklist

### Pre-Deployment (Required)

- [ ] **Switch to live API keys**

  ```powershell
  # Verify key format
  $env:STRIPE_SECRET_KEY -match '^sk_live_'
  ```

- [ ] **Enable webhook signature verification** (all endpoints)

  ```python
  # Verify STRIPE_WEBHOOK_SECRET is set
  assert os.getenv("STRIPE_WEBHOOK_SECRET").startswith("whsec_")
  ```

- [ ] **Configure restricted API keys** (principle of least privilege)

  - MCP server: Only `customers:write`, `payment_intents:write`, `subscriptions:write`
  - Webhook handler: Read-only access to verify events
  - Admin tools: Separate key with `refunds:write`, `disputes:write`

- [ ] **Set up webhook endpoints** in Stripe Dashboard

  - URL: `https://bambisleep.church/webhook` (HTTPS required)
  - Events to listen: `payment_intent.succeeded`, `customer.subscription.deleted`, `invoice.payment_failed`
  - Verify signature in code (see Pattern 8 above)

- [ ] **Implement rate limiting** (protect against DoS)

  ```python
  from flask_limiter import Limiter

  limiter = Limiter(app, key_func=lambda: request.headers.get("X-User-ID"))

  @app.route("/mcp/tool/<tool_name>", methods=["POST"])
  @limiter.limit("100 per minute")  # Adjust based on usage
  def mcp_tool_endpoint(tool_name):
      pass
  ```

- [ ] **Configure CORS** (for remote MCP servers)

  ```python
  from flask_cors import CORS

  CORS(app, origins=[
      "vscode-webview://",  # VSCode extension
      "https://bambisleep.church"  # Live domain
  ])
  ```

- [ ] **Set up monitoring and alerting** (Prometheus + Grafana)

  - Expose `/metrics` endpoint
  - Track: tool invocation rate, error rate, latency (p95/p99)
  - Alert on: error rate > 5%, webhook failures > 10%, rate limit approached

- [ ] **Enable audit logging** (all MCP tool invocations)

  ```python
  def log_mcp_invocation(user_id, tool_name, params, result, duration_ms):
      audit_log.info({
          "timestamp": datetime.now().isoformat(),
          "user_id": user_id,
          "tool": tool_name,
          "params": sanitize_sensitive_data(params),
          "result_status": "success" if result else "error",
          "duration_ms": duration_ms
      })
  ```

- [ ] **Configure secrets management**

  - Use HashiCorp Vault, AWS Secrets Manager, or Azure Key Vault
  - Never store secrets in `.env` files
  - Rotate secrets automatically every 90 days

- [ ] **Test failure scenarios**

  - API key invalid → graceful error, alert triggered
  - Webhook signature mismatch → reject request, log attempt
  - Rate limit exceeded → return 429, include `Retry-After` header
  - Network timeout → retry with exponential backoff

- [ ] **Document disaster recovery plan**
  - Backup webhook event logs (replay on failure)
  - Secondary MCP server (failover on primary failure)
  - Stripe API outage response (queue requests, process when API recovers)

### Post-Deployment (Monitoring)

**Health check endpoint**:

```python
@app.route("/health", methods=["GET"])
def health_check():
    """Verify MCP server and Stripe API connectivity"""
    checks = {
        "mcp_server": "ok",
        "stripe_api": "unknown",
        "database": "unknown"
    }

    try:
        # Test Stripe API connectivity
        stripe.Account.retrieve()
        checks["stripe_api"] = "ok"
    except stripe.error.StripeError:
        checks["stripe_api"] = "error"

    # Test database connectivity
    try:
        db.execute("SELECT 1")
        checks["database"] = "ok"
    except Exception:
        checks["database"] = "error"

    status_code = 200 if all(v == "ok" for v in checks.values()) else 503
    return jsonify(checks), status_code
```

**Continuous monitoring queries** (Prometheus/Grafana):

```promql
# Tool invocation rate
rate(mcp_tool_invocations_total[5m])

# Error rate by tool
rate(mcp_tool_errors_total[5m]) / rate(mcp_tool_invocations_total[5m])

# P95 latency
histogram_quantile(0.95, rate(mcp_tool_duration_seconds_bucket[5m]))

# Webhook delivery success rate
rate(stripe_webhook_success_total[5m]) / rate(stripe_webhook_received_total[5m])
```

## Troubleshooting Common Issues

### Issue 1: Claude Sonnet 4 Not Available in Copilot

**Symptoms**: Model not showing in Copilot Chat model selector

**Solutions**:

1. Update GitHub Copilot extension (VSCode Extensions → Check for Updates)
2. Verify subscription plan (Copilot Pro or Enterprise required)
3. Check organization settings (admin may have disabled model)
4. Try browser-based Copilot first (models roll out to web before VSCode)
5. Clear VSCode cache: `Ctrl+Shift+P` → "Developer: Reload Window"

### Issue 2: MCP Server Not Connecting

**Symptoms**: "MCP server failed to start" or timeout errors

**Solutions**:

1. Verify server command in `.vscode/mcp.json`:
   ```powershell
   # Test command manually
   npx -y @stripe/mcp --tools=all
   ```
2. Check environment variables are set:
   ```powershell
   echo $env:STRIPE_SECRET_KEY
   ```
3. Review MCP server logs (check VSCode Output panel → "MCP")
4. Validate JSON-RPC responses with MCP Inspector:
   ```powershell
   npx @modelcontextprotocol/inspector npx -y @stripe/mcp --tools=all
   ```

### Issue 3: Webhook Signature Verification Failing

**Symptoms**: "Invalid signature" errors in webhook handler

**Solutions**:

1. Verify webhook secret matches Stripe Dashboard:
   ```python
   print(f"Using secret: {os.getenv('STRIPE_WEBHOOK_SECRET')[:10]}...")
   ```
2. Use raw request body (NOT parsed JSON):
   ```python
   payload = request.data  # Flask
   # NOT: request.json (signature will fail)
   ```
3. Check request headers:
   ```python
   sig_header = request.headers.get("Stripe-Signature")
   if not sig_header:
       return "Missing signature", 400
   ```
4. Test with Stripe CLI (forwards with valid signatures):
   ```powershell
   stripe listen --forward-to https://bambisleep.church/webhook
   stripe trigger payment_intent.succeeded
   ```

### Issue 4: Rate Limits Exceeded

**Symptoms**: 429 errors from Stripe API

**Solutions**:

1. Implement exponential backoff:

   ```python
   import time
   from stripe.error import RateLimitError

   def retry_with_backoff(func, max_retries=3):
       for i in range(max_retries):
           try:
               return func()
           except RateLimitError:
               if i == max_retries - 1:
                   raise
               wait_time = 2 ** i  # 1s, 2s, 4s
               time.sleep(wait_time)
   ```

2. Batch operations (create multiple customers in one script)
3. Request rate limit increase from Stripe Support
4. Cache frequently accessed data (products, prices)

### Issue 5: Payment Intent Requires Action (3D Secure)

**Symptoms**: `payment_intent.status == "requires_action"`

**Solutions**:

1. Return `client_secret` to frontend for Stripe.js:
   ```python
   if payment_intent.status == "requires_action":
       return {
           "client_secret": payment_intent.client_secret,
           "action_required": True
       }
   ```
2. Frontend handles confirmation:
   ```javascript
   const { error } = await stripe.confirmCardPayment(clientSecret);
   ```
3. Webhook handles final status:
   ```python
   @app.route("/webhook", methods=["POST"])
   def webhook():
       if event["type"] == "payment_intent.succeeded":
           # Payment confirmed after 3D Secure
           provision_access(payment_intent.customer)
   ```

## Security Incident Response

**If API key is compromised**:

1. **Immediately** roll key in Stripe Dashboard (Settings → API keys → Roll key)
2. Update all MCP servers with new key (restart required)
3. Review Stripe logs for unauthorized activity (Dashboard → Developers → Logs)
4. File incident report (if required by compliance)
5. Audit all transactions in past 24 hours
6. Notify affected customers (if fraudulent activity detected)

**If webhook endpoint is attacked**:

1. Verify signature verification is enabled (reject invalid signatures)
2. Enable rate limiting (e.g., max 1000 requests/minute)
3. Review nginx/load balancer logs for attack patterns
4. Add IP whitelist (Stripe webhook IP ranges available in docs)
5. Temporarily disable webhook endpoint if under sustained attack
6. Re-enable with stricter rate limits after attack subsides

## Quick Reference: MCP + Stripe Commands

### Daily Operations

```powershell
# Start MCP server with Stripe tools
npx -y @stripe/mcp --tools=all

# Test MCP protocol compliance
npx @modelcontextprotocol/inspector npx -y @stripe/mcp --tools=all

# Start webhook listener
stripe listen --forward-to https://bambisleep.church/webhook

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger customer.subscription.deleted
stripe trigger invoice.payment_failed

# Run tests
pytest tests/ -v
npm test

# Check for secrets in staged files
git diff --staged | Select-String -Pattern 'sk_(test|live)_|pk_(test|live)_|whsec_'
```

### Deployment Operations

```powershell
# Deploy with Docker
docker-compose up -d --build

# Check health
curl https://bambisleep.church/health

# View logs
docker-compose logs -f mcp-server

# Restart after key rotation
docker-compose restart mcp-server

# Monitor metrics
curl https://bambisleep.church/metrics
```

### Stripe API Quick Reference

```python
# Customer operations
customer = stripe.Customer.create(name="", email="")
customers = stripe.Customer.list(limit=10, email="user@bambisleep.church")

# Payment operations
pi = stripe.PaymentIntent.create(amount=1999, currency="usd", customer="cus_...")
link = stripe.PaymentLink.create(line_items=[{"price": "price_...", "quantity": 1}])

# Subscription operations
sub = stripe.Subscription.create(customer="cus_...", items=[{"price": "price_..."}])
stripe.Subscription.modify("sub_...", cancel_at_period_end=True)

# Refund
refund = stripe.Refund.create(payment_intent="pi_...", reason="requested_by_customer")

# Usage metering
stripe.billing.MeterEvent.create(
    event_name="ai_tool_invocation",
    payload={"stripe_customer_id": "cus_...", "value": "1"}
)
```

## Frontend Framework Integration

This codebase may integrate with modern frontend frameworks for payment UI, dashboard, or customer-facing interfaces. When building frontend components that interact with the MCP + Stripe backend, follow these official documentation sources.

### Official Developer Documentation (Quick Links)

**React — Official docs**: Comprehensive guides, tutorial, API reference and learning resources for building UI with React.

- Primary source: https://react.dev/
- Learn core concepts: https://react.dev/learn
- API reference: https://react.dev/reference/react

**Vite — Getting started & guide**: Dev server + build tool docs, templates, CLI instructions and configuration guide.

- Primary source: https://vitejs.dev/
- Getting started: https://vitejs.dev/guide/
- Configuration: https://vitejs.dev/config/

**Next.js — Official docs**: Getting started, App Router vs Pages Router, guides and full API reference for building full-stack React apps.

- Primary source: https://nextjs.org/docs
- Getting started: https://nextjs.org/docs/getting-started
- App Router: https://nextjs.org/docs/app

### Recommended Mirrors & Quick References

**React (DevDocs mirror)** — Searchable offline-friendly copy of React docs.

- Mirror: https://devdocs.io/react/

**Vite (DevDocs mirror)** — Searchable Vite documentation mirror.

- Mirror: https://devdocs.io/vite/

**Next.js (DevDocs mirror)** — Searchable Next.js docs mirror.

- Mirror: https://devdocs.io/nextjs/

### Quick Starter Commands

**Create a React + Vite project**:

```powershell
npm create vite@latest my-payment-ui -- --template react-ts
cd my-payment-ui
npm install
npm run dev
```

**Start a Next.js app**:

```powershell
npx create-next-app@latest my-stripe-dashboard
cd my-stripe-dashboard
npm run dev
```

**Learn core React concepts first**: Follow React's practical tutorial and main concepts guide at https://react.dev/learn before building payment interfaces.

### Frontend + Stripe Integration Guidelines

When building frontend payment flows that interact with the MCP backend:

1. **Never expose secret keys** in frontend code (use publishable keys only: `pk_live_...`)
2. **Use Stripe Elements** for card collection (PCI compliant, no raw card data)
3. **Call backend MCP tools** via secure API endpoints (authenticated requests only)
4. **Handle 3D Secure** client-side with `stripe.confirmCardPayment()`
5. **Display loading states** during payment processing
6. **Implement error boundaries** for payment failures
7. **Test with Stripe test cards** before deploying (use test mode in non-production builds)

**Example: React component calling MCP backend**:

```typescript
// PaymentForm.tsx
import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    try {
      // Call backend MCP tool to create payment intent
      const response = await fetch(
        "https://bambisleep.church/api/create-payment-intent",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: 1999, currency: "usd" }),
        }
      );

      const { client_secret } = await response.json();

      // Confirm payment client-side
      const { error: confirmError } = await stripe.confirmCardPayment(
        client_secret,
        {
          payment_method: { card: elements.getElement(CardElement)! },
        }
      );

      if (confirmError) {
        setError(confirmError.message ?? "Payment failed");
      } else {
        // Payment succeeded - webhook will handle backend provisioning
        window.location.href = "/success";
      }
    } catch (err) {
      setError("Network error - please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit" disabled={!stripe || loading}>
        {loading ? "Processing..." : "Pay $19.99"}
      </button>
      {error && <div className="error">{error}</div>}
    </form>
  );
}

export default function PaymentPage() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}
```

### Environment Variables for Frontend

**Vite** (`.env.local`):

```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_API_BASE_URL=https://bambisleep.church/api
```

**Next.js** (`.env.local`):

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_API_BASE_URL=https://bambisleep.church/api
```

**CRITICAL**: Only use `NEXT_PUBLIC_*` or `VITE_*` prefixes for client-side variables. Never expose `STRIPE_SECRET_KEY` in frontend builds.

## FFmpeg Video Processing Integration

**CORE ASPECT**: This codebase integrates FFmpeg for video playback, processing, transcoding, and streaming. Large Language Models can steer avatars while displaying videos on paywalled private pages. MCP agents must utilize FFmpeg's full capabilities for video operations.

### FFmpeg Architecture Overview

**FFmpeg libraries** (accessed via MCP tools or direct integration):

- **libavcodec**: Encoding/decoding audio and video
- **libavformat**: Muxing/demuxing container formats
- **libavutil**: Common utility functions
- **libavfilter**: Audio/video filtering framework
- **libswscale**: Video scaling and pixel format conversion
- **libswresample**: Audio resampling

**Official documentation**:

- Developer docs: https://ffmpeg.org/developer.html
- Doxygen API reference: http://ffmpeg.org/doxygen/trunk/index.html
- Examples: https://github.com/FFmpeg/FFmpeg/tree/master/doc/examples
- Command-line guide: https://ffmpeg.org/ffmpeg.html

### FFmpeg MCP Server Integration

**Add FFmpeg MCP server** (`.vscode/mcp.json`):

```json
{
  "mcpServers": {
    "stripe": {
      "command": "npx",
      "args": ["-y", "@stripe/mcp", "--tools=all"],
      "env": {
        "STRIPE_SECRET_KEY": "${input:stripe_key}"
      }
    },
    "ffmpeg": {
      "command": "node",
      "args": ["./mcp-servers/ffmpeg-server.js"],
      "env": {
        "FFMPEG_PATH": "ffmpeg",
        "FFPROBE_PATH": "ffprobe",
        "STORAGE_PATH": "C:/Users/urukk/Videos"
      }
    }
  }
}
```

**Install FFmpeg** (Windows):

```powershell
# Using Chocolatey
choco install ffmpeg

# Or download from official site
# https://ffmpeg.org/download.html#build-windows

# Verify installation
ffmpeg -version
ffprobe -version
```

### Common FFmpeg Operations via MCP

**Video transcoding** (optimize for web playback):

```powershell
ffmpeg -i input.mp4 -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k -movflags +faststart output.mp4
```

**Extract video metadata**:

```powershell
ffprobe -v quiet -print_format json -show_format -show_streams input.mp4
```

**Generate video thumbnail**:

```powershell
ffmpeg -i input.mp4 -ss 00:00:05 -vframes 1 -q:v 2 thumbnail.jpg
```

**HLS streaming preparation** (for adaptive bitrate):

```powershell
ffmpeg -i input.mp4 -c:v libx264 -crf 23 -c:a aac -b:a 128k -hls_time 10 -hls_playlist_type vod -hls_segment_filename "segment_%03d.ts" playlist.m3u8
```

**Convert to multiple resolutions** (for ABR streaming):

```powershell
# 1080p
ffmpeg -i input.mp4 -c:v libx264 -b:v 5000k -maxrate 5350k -bufsize 7500k -s 1920x1080 -c:a aac -b:a 192k output_1080p.mp4

# 720p
ffmpeg -i input.mp4 -c:v libx264 -b:v 2800k -maxrate 2996k -bufsize 4200k -s 1280x720 -c:a aac -b:a 128k output_720p.mp4

# 480p
ffmpeg -i input.mp4 -c:v libx264 -b:v 1400k -maxrate 1498k -bufsize 2100k -s 854x480 -c:a aac -b:a 96k output_480p.mp4
```

**Audio extraction**:

```powershell
ffmpeg -i video.mp4 -vn -acodec copy audio.aac
```

**Video concatenation**:

```powershell
# Create file list
"file 'video1.mp4'`nfile 'video2.mp4'" | Out-File -Encoding utf8 filelist.txt

# Concatenate
ffmpeg -f concat -safe 0 -i filelist.txt -c copy output.mp4
```

### FFmpeg MCP Server Implementation (Node.js)

**Create `mcp-servers/ffmpeg-server.js`**:

```javascript
const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const {
  StdioServerTransport,
} = require("@modelcontextprotocol/sdk/server/stdio.js");
const { execFile } = require("child_process");
const { promisify } = require("util");
const path = require("path");
const fs = require("fs").promises;

const execFileAsync = promisify(execFile);

const FFMPEG_PATH = process.env.FFMPEG_PATH || "ffmpeg";
const FFPROBE_PATH = process.env.FFPROBE_PATH || "ffprobe";
const STORAGE_PATH = process.env.STORAGE_PATH || "./videos";

class FFmpegMCPServer {
  constructor() {
    this.server = new Server(
      { name: "ffmpeg-mcp-server", version: "1.0.0" },
      { capabilities: { tools: {} } }
    );

    this.setupTools();
    this.setupErrorHandling();
  }

  setupTools() {
    // Tool: Get video metadata
    this.server.setRequestHandler("tools/list", async () => ({
      tools: [
        {
          name: "ffmpeg_probe",
          description: "Extract video/audio metadata using ffprobe",
          inputSchema: {
            type: "object",
            properties: {
              file_path: { type: "string", description: "Path to video file" },
            },
            required: ["file_path"],
          },
        },
        {
          name: "ffmpeg_transcode",
          description: "Transcode video to web-optimized format",
          inputSchema: {
            type: "object",
            properties: {
              input_path: { type: "string", description: "Input video path" },
              output_path: { type: "string", description: "Output video path" },
              preset: {
                type: "string",
                enum: ["ultrafast", "fast", "medium", "slow"],
                description: "Encoding preset (fast recommended)",
              },
              crf: {
                type: "number",
                description: "Quality (18-28, lower=better, 23=default)",
                minimum: 18,
                maximum: 28,
              },
            },
            required: ["input_path", "output_path"],
          },
        },
        {
          name: "ffmpeg_thumbnail",
          description: "Generate video thumbnail at specific timestamp",
          inputSchema: {
            type: "object",
            properties: {
              video_path: { type: "string", description: "Video file path" },
              output_path: { type: "string", description: "Output image path" },
              timestamp: {
                type: "string",
                description: "Timestamp (HH:MM:SS or seconds)",
                default: "00:00:05",
              },
            },
            required: ["video_path", "output_path"],
          },
        },
        {
          name: "ffmpeg_hls_stream",
          description: "Prepare HLS streaming playlist",
          inputSchema: {
            type: "object",
            properties: {
              input_path: { type: "string", description: "Input video path" },
              output_dir: { type: "string", description: "Output directory" },
              segment_duration: {
                type: "number",
                description: "Segment duration in seconds",
                default: 10,
              },
            },
            required: ["input_path", "output_dir"],
          },
        },
      ],
    }));

    // Tool implementations
    this.server.setRequestHandler("tools/call", async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "ffmpeg_probe":
            return await this.probeVideo(args.file_path);

          case "ffmpeg_transcode":
            return await this.transcodeVideo(
              args.input_path,
              args.output_path,
              args.preset || "fast",
              args.crf || 23
            );

          case "ffmpeg_thumbnail":
            return await this.generateThumbnail(
              args.video_path,
              args.output_path,
              args.timestamp || "00:00:05"
            );

          case "ffmpeg_hls_stream":
            return await this.prepareHLS(
              args.input_path,
              args.output_dir,
              args.segment_duration || 10
            );

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async probeVideo(filePath) {
    const { stdout } = await execFileAsync(FFPROBE_PATH, [
      "-v",
      "quiet",
      "-print_format",
      "json",
      "-show_format",
      "-show_streams",
      filePath,
    ]);

    const metadata = JSON.parse(stdout);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(metadata, null, 2),
        },
      ],
    };
  }

  async transcodeVideo(inputPath, outputPath, preset, crf) {
    await execFileAsync(FFMPEG_PATH, [
      "-i",
      inputPath,
      "-c:v",
      "libx264",
      "-preset",
      preset,
      "-crf",
      crf.toString(),
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-movflags",
      "+faststart",
      "-y",
      outputPath,
    ]);

    return {
      content: [
        {
          type: "text",
          text: `Transcoded successfully: ${outputPath}`,
        },
      ],
    };
  }

  async generateThumbnail(videoPath, outputPath, timestamp) {
    await execFileAsync(FFMPEG_PATH, [
      "-i",
      videoPath,
      "-ss",
      timestamp,
      "-vframes",
      "1",
      "-q:v",
      "2",
      "-y",
      outputPath,
    ]);

    return {
      content: [
        {
          type: "text",
          text: `Thumbnail generated: ${outputPath}`,
        },
      ],
    };
  }

  async prepareHLS(inputPath, outputDir, segmentDuration) {
    await fs.mkdir(outputDir, { recursive: true });

    const playlistPath = path.join(outputDir, "playlist.m3u8");
    const segmentPath = path.join(outputDir, "segment_%03d.ts");

    await execFileAsync(FFMPEG_PATH, [
      "-i",
      inputPath,
      "-c:v",
      "libx264",
      "-crf",
      "23",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-hls_time",
      segmentDuration.toString(),
      "-hls_playlist_type",
      "vod",
      "-hls_segment_filename",
      segmentPath,
      "-y",
      playlistPath,
    ]);

    return {
      content: [
        {
          type: "text",
          text: `HLS stream prepared: ${playlistPath}`,
        },
      ],
    };
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error("[FFmpeg MCP Error]", error);
    };

    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("FFmpeg MCP server running on stdio");
  }
}

const server = new FFmpegMCPServer();
server.run().catch(console.error);
```

**Install dependencies** (`mcp-servers/package.json`):

```json
{
  "name": "ffmpeg-mcp-server",
  "version": "1.0.0",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0"
  }
}
```

```powershell
cd mcp-servers
npm install
```

### React Video Player Component (Stripe Paywalled)

**Install video player dependencies**:

```powershell
npm install video.js @videojs/http-streaming hls.js
```

**Create `VideoPlayer.tsx`**:

```typescript
// VideoPlayer.tsx - Paywalled video player with avatar overlay
import { useEffect, useRef, useState } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import type Player from "video.js/dist/types/player";

interface VideoPlayerProps {
  videoUrl: string;
  posterUrl?: string;
  hasAccess: boolean; // Stripe subscription check
  onAccessDenied?: () => void;
  avatarOverlay?: boolean;
  avatarPosition?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
}

export default function VideoPlayer({
  videoUrl,
  posterUrl,
  hasAccess,
  onAccessDenied,
  avatarOverlay = false,
  avatarPosition = "bottom-right",
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check Stripe subscription access
    if (!hasAccess) {
      setError("Subscription required to view this content");
      onAccessDenied?.();
      return;
    }

    if (!videoRef.current) return;

    // Initialize Video.js player
    const player = videojs(videoRef.current, {
      controls: true,
      autoplay: false,
      preload: "metadata",
      fluid: true,
      responsive: true,
      html5: {
        vhs: {
          overrideNative: true,
        },
        nativeVideoTracks: false,
        nativeAudioTracks: false,
        nativeTextTracks: false,
      },
      poster: posterUrl,
    });

    playerRef.current = player;

    // Handle loading states
    player.on("loadstart", () => setIsLoading(true));
    player.on("canplay", () => setIsLoading(false));
    player.on("error", (e) => {
      setIsLoading(false);
      setError("Video playback error");
      console.error("Video.js error:", player.error());
    });

    // Cleanup
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [videoUrl, hasAccess, posterUrl, onAccessDenied]);

  if (!hasAccess) {
    return (
      <div className="video-paywall">
        <div className="paywall-content">
          <h3>Premium Content</h3>
          <p>Subscribe to access exclusive videos</p>
          <button onClick={() => (window.location.href = "/subscribe")}>
            Subscribe Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="video-container" style={{ position: "relative" }}>
      <div data-vjs-player>
        <video ref={videoRef} className="video-js vjs-big-play-centered">
          <source src={videoUrl} type="application/x-mpegURL" />
          <source src={videoUrl} type="video/mp4" />
          <p className="vjs-no-js">
            To view this video please enable JavaScript, and consider upgrading
            to a web browser that supports HTML5 video
          </p>
        </video>
      </div>

      {avatarOverlay && (
        <div
          className={`avatar-overlay avatar-${avatarPosition}`}
          style={{
            position: "absolute",
            width: "200px",
            height: "200px",
            pointerEvents: "none",
            zIndex: 10,
          }}
        >
          {/* LLM-driven avatar will be rendered here */}
          <canvas id="avatar-canvas" width="200" height="200" />
        </div>
      )}

      {isLoading && (
        <div className="video-loader">
          <div className="spinner" />
        </div>
      )}

      {error && (
        <div className="video-error">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
```

**Backend API endpoint** (verify Stripe subscription):

```typescript
// pages/api/video/access.ts (Next.js)
import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import jwt from "jsonwebtoken";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Verify JWT token
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      stripeCustomerId: string;
    };

    // Check active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: decoded.stripeCustomerId,
      status: "active",
      limit: 1,
    });

    const hasAccess = subscriptions.data.length > 0;

    if (!hasAccess) {
      return res.status(403).json({
        error: "No active subscription",
        hasAccess: false,
      });
    }

    // Generate signed video URL (for protected content)
    const videoUrl = generateSignedVideoUrl(req.query.videoId as string);

    return res.status(200).json({
      hasAccess: true,
      videoUrl,
      subscription: {
        id: subscriptions.data[0].id,
        status: subscriptions.data[0].status,
        currentPeriodEnd: subscriptions.data[0].current_period_end,
      },
    });
  } catch (error) {
    console.error("Video access error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

function generateSignedVideoUrl(videoId: string): string {
  // Generate time-limited signed URL for video access
  const expires = Math.floor(Date.now() / 1000) + 3600; // 1 hour
  const signature = jwt.sign(
    { videoId, expires },
    process.env.VIDEO_SIGNING_KEY!
  );

  return `https://bambisleep.church/api/video/stream/${videoId}?token=${signature}`;
}
```

### FFmpeg Usage Patterns (Production)

**Pattern 1: Web-optimized video preparation**:

```javascript
// Transcode uploaded video for web playback
async function prepareVideoForWeb(inputPath, userId) {
  const outputPath = `${STORAGE_PATH}/${userId}/${Date.now()}_web.mp4`;

  await execFileAsync(FFMPEG_PATH, [
    "-i",
    inputPath,
    "-c:v",
    "libx264",
    "-preset",
    "fast",
    "-crf",
    "23",
    "-maxrate",
    "3M",
    "-bufsize",
    "6M",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-movflags",
    "+faststart",
    "-y",
    outputPath,
  ]);

  return outputPath;
}
```

**Pattern 2: Adaptive bitrate streaming (HLS)**:

```javascript
// Generate multi-resolution HLS stream
async function generateABRStream(inputPath, outputDir) {
  const resolutions = [
    { name: "1080p", width: 1920, height: 1080, bitrate: "5000k" },
    { name: "720p", width: 1280, height: 720, bitrate: "2800k" },
    { name: "480p", width: 854, height: 480, bitrate: "1400k" },
  ];

  const masterPlaylist = `${outputDir}/master.m3u8`;
  let masterContent = "#EXTM3U\n#EXT-X-VERSION:3\n";

  for (const res of resolutions) {
    const variantDir = `${outputDir}/${res.name}`;
    await fs.mkdir(variantDir, { recursive: true });

    await execFileAsync(FFMPEG_PATH, [
      "-i",
      inputPath,
      "-c:v",
      "libx264",
      "-b:v",
      res.bitrate,
      "-s",
      `${res.width}x${res.height}`,
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-hls_time",
      "10",
      "-hls_playlist_type",
      "vod",
      "-hls_segment_filename",
      `${variantDir}/segment_%03d.ts`,
      `${variantDir}/playlist.m3u8`,
    ]);

    masterContent += `#EXT-X-STREAM-INF:BANDWIDTH=${
      parseInt(res.bitrate) * 1000
    },RESOLUTION=${res.width}x${res.height}\n`;
    masterContent += `${res.name}/playlist.m3u8\n`;
  }

  await fs.writeFile(masterPlaylist, masterContent);
  return masterPlaylist;
}
```

**Pattern 3: Real-time avatar overlay (FFmpeg filter)**:

```powershell
# Overlay avatar video on main video (for pre-rendering)
ffmpeg -i main_video.mp4 -i avatar_video.mp4 -filter_complex "[1:v]scale=200:200[avatar];[0:v][avatar]overlay=W-w-10:H-h-10" -c:a copy output.mp4
```

**Pattern 4: Video watermarking** (for paid content protection):

```javascript
async function addWatermark(videoPath, watermarkPath, outputPath) {
  await execFileAsync(FFMPEG_PATH, [
    "-i",
    videoPath,
    "-i",
    watermarkPath,
    "-filter_complex",
    "[1:v]scale=120:40[wm];[0:v][wm]overlay=W-w-10:10",
    "-c:a",
    "copy",
    "-y",
    outputPath,
  ]);
}
```

### Security Considerations for Video Content

1. **Signed URLs**: Generate time-limited signed URLs for video access (prevent hotlinking)
2. **DRM**: Consider Widevine/FairPlay for high-value content
3. **Token validation**: Verify Stripe subscription status before serving video
4. **Rate limiting**: Prevent abuse of video transcoding endpoints
5. **Storage quotas**: Enforce per-user storage limits based on subscription tier
6. **Watermarking**: Add user-specific watermarks to discourage piracy

### Environment Variables (FFmpeg + Video)

```bash
# .env
FFMPEG_PATH=ffmpeg
FFPROBE_PATH=ffprobe
VIDEO_STORAGE_PATH=C:/Users/urukk/Videos
VIDEO_SIGNING_KEY=your-video-signing-secret
MAX_VIDEO_SIZE_MB=500
ALLOWED_VIDEO_FORMATS=mp4,mov,avi,mkv,webm
```

### FFmpeg Coding Standards (from Official Developer Docs)

**Code style** (if contributing to FFmpeg or building custom filters):

- Indent: 4 spaces, no tabs
- K&R style
- Limit lines to 80 characters
- Use JavaDoc/Doxygen comments for all functions
- Follow naming conventions: lowercase with underscores for functions, CamelCase for types

**Memory management**:

- Use `av_malloc()` family for all allocations
- Check all allocations, return `AVERROR(ENOMEM)` on failure
- Avoid memory leaks in error paths

**Thread safety**:

- Libraries may be called from multiple threads
- Use proper locking mechanisms
- Avoid global mutable state

**Robustness**:

- Treat all input as untrusted
- Return `AVERROR_INVALIDDATA` on invalid input
- Never crash on malformed data

## Aristocratic Home-Grown LLM Lab Security

**CRITICAL CONTEXT**: This codebase represents a private, home-grown LLM laboratory requiring enterprise-grade security with aristocratic refinement. The following practices ensure robust protection while maintaining elegance, discretion, and dignified composure.

### Guiding Principles

**Security, Discretion, Elegance, Quiet Confidence**

The renaissance of home-grown Large Language Model labs demands protection against targeted intrusions, data leaks, and system disruption—all while preserving a stately, imperial aura. This section delineates best practices for safeguarding a locally hosted LLM lab from digital adversaries while maintaining aesthetic harmony with refined surroundings.

### Physical Security: Beauty and Discretion

**Secure Hardware and Environment:**

- **High-Security Artisanal Server Cabinets**: Lockable, tamper-resistant cabinets with luxurious finishes (brushed metals, hand-polished woods, or custom-crafted safes with gilded detailing). Consider Wertheim or Gunnebo for certified intruder resistance with fine artistry.
- **Discrete Placement**: Situate lab in lockable, climate-controlled, windowless room. Sound-damping paneling covered with tapestries or velvet drapes conceals hardware hum.
- **Access Monitoring**: Biometric or PIN-based electronic locks with gold/chrome hardware, hidden behind mirrored walls or within wooden closets.
- **Tamper Sensors**: Concealed vibration, impact, or glass-break sensors (Didactum, NTI ENVIROMUX) with SMS alerts and automated camera activation.
- **CCTV**: Low-profile surveillance styled as miniature "picture-frame" or bookshelf cameras.

**Implementation (Windows environment)**:

```powershell
# Install security monitoring tools
choco install wireshark
choco install nmap

# Enable Windows Defender with enhanced protection
Set-MpPreference -DisableRealtimeMonitoring $false
Set-MpPreference -SubmitSamplesConsent 2
Update-MpSignature

# Configure firewall rules for lab isolation
New-NetFirewallRule -DisplayName "Block Lab External Access" -Direction Inbound -LocalPort 8080,5000,7860 -Protocol TCP -Action Block -RemoteAddress Internet
```

### Network Segmentation: The Segregated Estate

**VLAN Architecture:**

| Zone (VLAN)              | Devices                     | Allowed Interactions               | Security Notes                    |
| ------------------------ | --------------------------- | ---------------------------------- | --------------------------------- |
| Management/Admin (10)    | Admin laptops, workstations | Access to all, blocked from IoT    | MFA for VPN, strict firewall      |
| Core LLM Lab (20)        | LLM servers, GPU nodes      | Admin access only                  | No internet, encrypted interfaces |
| IoT/Home Automation (30) | Cameras, smart locks        | Limited outbound, blocked from lab | Periodically audited              |
| Guest Network (40)       | Visitors' devices           | Internet only                      | Completely isolated               |

**OPNsense/pfSense Configuration:**

```bash
# VLAN 20 (LLM Lab) - strict isolation
add firewall rule VLAN20 block in quick from any to any
add firewall rule VLAN20 pass in from VLAN10 to VLAN20 port 22,3389,5000
add firewall rule VLAN20 pass out from VLAN20 to VLAN10 established

# Zero Trust: authenticate every request
enable captive_portal authentication
set minimum_password_strength 4
enable two_factor_authentication
```

### Data Encryption: Secrets Worthy of a Duchess

**At Rest (Full Disk Encryption):**

```powershell
# Enable BitLocker with TPM (Windows)
Enable-BitLocker -MountPoint "C:" -EncryptionMethod XtsAes256 -UsedSpaceOnly -TpmProtector
Add-BitLockerKeyProtector -MountPoint "C:" -RecoveryPasswordProtector

# Store recovery key in secure location
(Get-BitLockerVolume -MountPoint "C:").KeyProtector | Where-Object {$_.KeyProtectorType -eq "RecoveryPassword"} | Select-Object -ExpandProperty RecoveryPassword | Out-File -FilePath "C:\SecureVault\BitLocker_Recovery_$(Get-Date -Format 'yyyyMMdd').txt"
```

**Linux Alternative (LUKS):**

```bash
# Full disk encryption with LUKS
cryptsetup luksFormat /dev/sda2 --type luks2 --cipher aes-xts-plain64 --key-size 512
cryptsetup luksOpen /dev/sda2 encrypted_root

# TPM-based auto-unlock
systemd-cryptenroll --tpm2-device=auto /dev/sda2
```

**In Transit (TLS Everywhere):**

```powershell
# Generate self-signed CA for internal services
$cert = New-SelfSignedCertificate -DnsName "bambisleep.church", "*.bambisleep.church" -CertStoreLocation "cert:\LocalMachine\My" -KeyAlgorithm RSA -KeyLength 4096 -NotAfter (Get-Date).AddYears(10)

# Export for distribution to trusted devices
Export-Certificate -Cert $cert -FilePath "C:\SecureVault\BambiSleepCA.cer"
```

### Noble Access Control and Authentication

**Multi-Factor Authentication Setup:**

```powershell
# Install and configure YubiKey for Windows Hello
# Requires: YubiKey 5 Series with FIDO2 support

# Enable Windows Hello for Business
New-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\PassportForWork" -Name "Enabled" -Value 1 -PropertyType DWORD

# Configure SSH with hardware key authentication
ssh-keygen -t ed25519-sk -C "aristocrat@bambisleep.church"
# Insert YubiKey when prompted
```

**Role-Based Access Control (RBAC):**

```powershell
# Create security groups for lab access
New-LocalGroup -Name "LLM_Administrators" -Description "Full access to LLM lab infrastructure"
New-LocalGroup -Name "LLM_Researchers" -Description "Read-only access to models and datasets"
New-LocalGroup -Name "LLM_Guests" -Description "Limited query access via API only"

# Assign users to groups
Add-LocalGroupMember -Group "LLM_Administrators" -Member "BAMBISLEEP\Melanie"
Add-LocalGroupMember -Group "LLM_Researchers" -Member "BAMBISLEEP\ResearchTeam"
```

### Operating System Hardening: A Fortress, Not a Folly

**Windows Hardening Checklist:**

```powershell
# Disable unnecessary services
$services = @('RemoteRegistry', 'SessionEnv', 'TermService', 'UmRdpService', 'RemoteAccess')
foreach ($svc in $services) {
    Set-Service -Name $svc -StartupType Disabled -ErrorAction SilentlyContinue
}

# Enable Windows Firewall with strict rules
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True -DefaultInboundAction Block -DefaultOutboundAction Allow

# Enable audit logging
auditpol /set /category:"Logon/Logoff" /success:enable /failure:enable
auditpol /set /category:"Object Access" /success:enable /failure:enable
auditpol /set /category:"Policy Change" /success:enable /failure:enable

# Disable SMBv1 (vulnerable protocol)
Disable-WindowsOptionalFeature -Online -FeatureName SMB1Protocol -NoRestart
Set-SmbServerConfiguration -EnableSMB1Protocol $false -Force
```

**Linux Hardening (Ubuntu/Debian):**

```bash
# Minimal installation with automatic updates
apt install unattended-upgrades
dpkg-reconfigure --priority=low unattended-upgrades

# Enable AppArmor for mandatory access control
systemctl enable apparmor
systemctl start apparmor

# Harden SSH configuration
cat >> /etc/ssh/sshd_config << EOF
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
X11Forwarding no
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
EOF
systemctl restart sshd

# Install and configure fail2ban
apt install fail2ban
systemctl enable fail2ban
```

### Secure Execution Environments: Containerization

**Docker with Security Hardening:**

```powershell
# Install Docker Desktop with WSL2 backend
choco install docker-desktop

# Create isolated network for LLM containers
docker network create --driver bridge --subnet 172.20.0.0/16 --opt encrypted llm_isolated_net

# Run LLM with security constraints
docker run -d `
  --name llm-server `
  --network llm_isolated_net `
  --memory="16g" `
  --cpus="8" `
  --security-opt no-new-privileges `
  --cap-drop ALL `
  --cap-add NET_BIND_SERVICE `
  --read-only `
  --tmpfs /tmp `
  -v C:\LLMModels:/models:ro `
  -p 127.0.0.1:5000:5000 `
  ollama/ollama
```

**Kubernetes with Pod Security Standards (Linux):**

```yaml
# llm-pod-security.yaml
apiVersion: v1
kind: Pod
metadata:
  name: llm-inference
  namespace: aristocratic-lab
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    fsGroup: 1000
    seccompProfile:
      type: RuntimeDefault
  containers:
    - name: llm-container
      image: ghcr.io/bambisleep/llm-server:latest
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop: ["ALL"]
      resources:
        limits:
          memory: "32Gi"
          nvidia.com/gpu: "1"
      volumeMounts:
        - name: models
          mountPath: /models
          readOnly: true
  volumes:
    - name: models
      persistentVolumeClaim:
        claimName: llm-models-pvc
```

### Tamper Detection and Emergency Protocols

**Hardware Monitoring Setup:**

```powershell
# Install hardware monitoring tools
choco install hwinfo
choco install speccy

# Configure email alerts for hardware events
$smtpSettings = @{
    SmtpServer = "smtp.bambisleep.church"
    Port = 587
    UseSsl = $true
    Credential = Get-Credential
}

# Monitor temperature and vibration
$script = {
    $temp = (Get-WmiObject -Namespace "root\wmi" -Class MSAcpi_ThermalZoneTemperature).CurrentTemperature
    $tempCelsius = ($temp / 10) - 273.15

    if ($tempCelsius -gt 80) {
        Send-MailMessage @smtpSettings -From "lab-monitor@bambisleep.church" -To "alert@bambisleep.church" -Subject "URGENT: Lab Temperature Alert" -Body "Temperature exceeded safe threshold: $tempCelsius°C"
    }
}

# Schedule monitoring every 5 minutes
$trigger = New-JobTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 5) -RepetitionDuration ([TimeSpan]::MaxValue)
Register-ScheduledJob -Name "LabTempMonitor" -ScriptBlock $script -Trigger $trigger
```

**Emergency Kill Switch:**

```powershell
# Create emergency shutdown script
$killSwitch = @'
# EMERGENCY KILL SWITCH - Immediate lab shutdown
Write-Host "INITIATING EMERGENCY SHUTDOWN" -ForegroundColor Red

# Stop all Docker containers
docker stop $(docker ps -aq)

# Disable network adapters
Get-NetAdapter | Where-Object {$_.Name -like "*Lab*"} | Disable-NetAdapter -Confirm:$false

# Lock BitLocker volumes
Get-BitLockerVolume | Lock-BitLocker

# Send alert
Send-MailMessage -SmtpServer "smtp.bambisleep.church" -Port 587 -UseSsl -Credential (Get-Credential) -From "killswitch@bambisleep.church" -To "alert@bambisleep.church" -Subject "EMERGENCY: Lab Kill Switch Activated" -Body "Lab shutdown at $(Get-Date)"

# System shutdown
Stop-Computer -Force
'@

$killSwitch | Out-File -FilePath "C:\SecureVault\EmergencyKillSwitch.ps1"

# Create desktop shortcut for emergency access
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\EMERGENCY_KILL_SWITCH.lnk")
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-ExecutionPolicy Bypass -File C:\SecureVault\EmergencyKillSwitch.ps1"
$Shortcut.IconLocation = "shell32.dll,238"
$Shortcut.Save()
```

### Monitoring, Logging, and Alerting: The Watchful Eyes

**Windows Event Log Monitoring:**

```powershell
# Configure advanced audit policies
auditpol /set /subcategory:"Logon" /success:enable /failure:enable
auditpol /set /subcategory:"Logoff" /success:enable
auditpol /set /subcategory:"Account Lockout" /failure:enable
auditpol /set /subcategory:"File Share" /success:enable /failure:enable
auditpol /set /subcategory:"Filtering Platform Connection" /success:enable /failure:enable

# Export audit configuration for backup
auditpol /backup /file:C:\SecureVault\AuditPolicy_$(Get-Date -Format 'yyyyMMdd').csv

# Create log monitoring script
$logMonitor = @'
$events = Get-WinEvent -FilterHashtable @{
    LogName = 'Security'
    Id = 4625,4740,4771,4776  # Failed logon attempts
    StartTime = (Get-Date).AddHours(-1)
}

if ($events.Count -gt 10) {
    Send-MailMessage -SmtpServer "smtp.bambisleep.church" -Port 587 -UseSsl -Credential (Get-Credential) -From "siem@bambisleep.church" -To "security@bambisleep.church" -Subject "ALERT: Multiple Failed Login Attempts" -Body "Detected $($events.Count) failed login attempts in the past hour"
}
'@

Register-ScheduledJob -Name "SecurityEventMonitor" -ScriptBlock ([scriptblock]::Create($logMonitor)) -Trigger (New-JobTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Hours 1) -RepetitionDuration ([TimeSpan]::MaxValue))
```

**Centralized Logging with ELK Stack:**

```powershell
# Install Filebeat for Windows log shipping
choco install filebeat

# Configure Filebeat to ship to Elasticsearch
$filebeatConfig = @"
filebeat.inputs:
- type: winlogbeat
  enabled: true
  event_logs:
    - name: Security
    - name: System
    - name: Application

output.elasticsearch:
  hosts: ["https://elasticsearch.bambisleep.church:9200"]
  username: "filebeat_internal"
  password: "$(Read-Host -AsSecureString 'Enter Elasticsearch password' | ConvertFrom-SecureString)"
  ssl.certificate_authorities: ["C:\SecureVault\BambiSleepCA.cer"]

setup.kibana:
  host: "https://kibana.bambisleep.church:5601"
"@

$filebeatConfig | Out-File -FilePath "C:\ProgramData\filebeat\filebeat.yml" -Encoding UTF8
Restart-Service filebeat
```

### Backup and Disaster Recovery: An Aristocrat's Insurance

**3-2-1 Backup Strategy Implementation:**

```powershell
# PRIMARY: On-site RAID with BitLocker
# Assume C:\LLMData is primary storage with RAID 10

# SECONDARY: On-site NAS backup with encryption
$nasPath = "\\NAS.bambisleep.church\LLMBackup"
$encryptionKey = ConvertTo-SecureString -String (Read-Host -AsSecureString "Enter backup encryption key")

# Install backup tool (restic)
choco install restic

# Initialize restic repository
$env:RESTIC_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($encryptionKey))
restic init --repo $nasPath

# Create backup script
$backupScript = @"
`$env:RESTIC_PASSWORD = '$env:RESTIC_PASSWORD'
restic backup C:\LLMData --repo $nasPath --exclude '*.tmp' --exclude '*.cache'
restic forget --repo $nasPath --keep-daily 7 --keep-weekly 4 --keep-monthly 12 --prune
"@

$backupScript | Out-File -FilePath "C:\SecureVault\DailyBackup.ps1"

# Schedule daily backup at 2 AM
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -File C:\SecureVault\DailyBackup.ps1"
Register-ScheduledTask -TaskName "LLM Lab Daily Backup" -Trigger $trigger -Action $action -RunLevel Highest

# TERTIARY: Cloud backup with Backblaze B2
$env:B2_ACCOUNT_ID = "your_account_id"
$env:B2_APPLICATION_KEY = "your_app_key"

restic init --repo b2:bambisleep-llm-backup:/
# Daily cloud sync (runs after NAS backup)
$cloudBackupScript = @"
`$env:RESTIC_PASSWORD = '$env:RESTIC_PASSWORD'
`$env:B2_ACCOUNT_ID = '$env:B2_ACCOUNT_ID'
`$env:B2_APPLICATION_KEY = '$env:B2_APPLICATION_KEY'
restic backup C:\LLMData --repo b2:bambisleep-llm-backup:/ --exclude '*.tmp'
"@
```

### Supply Chain Security: Purity of Provenance

**Hardware Verification Checklist:**

```powershell
# Check TPM status
Get-Tpm

# Verify Secure Boot
Confirm-SecureBootUEFI

# Check firmware signatures
Get-SecureBootPolicy

# Document hardware provenance
$hardwareManifest = @{
    CPU = (Get-WmiObject -Class Win32_Processor).Name
    GPU = (Get-WmiObject -Class Win32_VideoController).Name
    Motherboard = (Get-WmiObject -Class Win32_BaseBoard).Product
    PurchaseDate = "2025-11-01"
    Vendor = "Aristocratic Hardware Emporium"
    SerialNumbers = @{
        CPU = "AB123456"
        GPU = "CD789012"
        Motherboard = "EF345678"
    }
    IntegrityChecks = @{
        TPMVerified = (Get-Tpm).TpmPresent
        SecureBootEnabled = (Confirm-SecureBootUEFI)
        FirmwareSigned = $true
    }
}

$hardwareManifest | ConvertTo-Json | Out-File -FilePath "C:\SecureVault\Hardware_Manifest_$(Get-Date -Format 'yyyyMMdd').json"
```

### Aesthetic Integration: Security Meets Refinement

**Custom PowerShell Theme (Aristocratic Console):**

```powershell
# Install Oh My Posh for elegant console
choco install oh-my-posh

# Custom aristocratic theme
$theme = @"
{
  "`$schema": "https://raw.githubusercontent.com/JanDeDobbeleer/oh-my-posh/main/themes/schema.json",
  "final_space": true,
  "console_title_template": "{{ .Folder }} - BambiSleep Aristocratic Lab",
  "blocks": [
    {
      "type": "prompt",
      "alignment": "left",
      "segments": [
        {
          "type": "text",
          "style": "plain",
          "foreground": "gold",
          "template": "👑 "
        },
        {
          "type": "path",
          "style": "powerline",
          "powerline_symbol": "",
          "foreground": "#ffffff",
          "background": "#8B4513",
          "template": " {{ .Path }} "
        },
        {
          "type": "git",
          "style": "powerline",
          "powerline_symbol": "",
          "foreground": "#ffffff",
          "background": "#2E8B57",
          "template": "  {{ .HEAD }} "
        }
      ]
    }
  ]
}
"@

$theme | Out-File -FilePath "$env:USERPROFILE\.aristocratic-theme.omp.json" -Encoding UTF8
oh-my-posh init pwsh --config "$env:USERPROFILE\.aristocratic-theme.omp.json" | Invoke-Expression
```

### Quick Reference: FFmpeg Commands

**Daily video operations**:

```powershell
# Probe video metadata
ffprobe -v quiet -print_format json -show_format -show_streams video.mp4

# Web-optimized transcode
ffmpeg -i input.mp4 -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k -movflags +faststart output.mp4

# Generate thumbnail
ffmpeg -i video.mp4 -ss 00:00:05 -vframes 1 -q:v 2 thumb.jpg

# HLS streaming
ffmpeg -i input.mp4 -c:v libx264 -crf 23 -hls_time 10 -hls_playlist_type vod playlist.m3u8

# Extract audio
ffmpeg -i video.mp4 -vn -acodec copy audio.aac

# Multi-resolution transcode (1080p/720p/480p)
ffmpeg -i input.mp4 -c:v libx264 -b:v 5000k -s 1920x1080 -c:a aac output_1080p.mp4
ffmpeg -i input.mp4 -c:v libx264 -b:v 2800k -s 1280x720 -c:a aac output_720p.mp4
ffmpeg -i input.mp4 -c:v libx264 -b:v 1400k -s 854x480 -c:a aac output_480p.mp4

# Concatenate videos
"file 'video1.mp4'`nfile 'video2.mp4'" | Out-File -Encoding utf8 list.txt
ffmpeg -f concat -safe 0 -i list.txt -c copy merged.mp4

# Add watermark overlay
ffmpeg -i video.mp4 -i watermark.png -filter_complex "overlay=W-w-10:10" output.mp4
```

**Integration with MCP agents**:

```
@workspace Transcode uploaded video to web-optimized format
@workspace Generate HLS stream with 3 quality levels (1080p/720p/480p)
@workspace Extract thumbnail from video at 5 second mark
@workspace Check video metadata and duration
```

## When You Need Help

**Architecture questions**: The codebase follows a three-tier architecture (Client/Server/Shared). Review the namespace conventions and DTO patterns in sections above.

**Test-driven development**: Tests exist for services but implementations are minimal. When implementing, match the expected signatures from test files.

**Type mismatches**: Watch for `int Id` vs `Guid Id` inconsistency between models and `IShared` interface. Also note `TimeSpan` vs `string` for uptime fields.

**Namespace issues**: `SharedDTO.cs` currently lacks a namespace declaration. When adding new shared types, use `namespace BambisleepChurch.Shared.DTOs`.

**Project references**: If building fails, verify that both client and server projects properly reference the shared project in the solution file.

## Key Principles (C# Project Specific)

1. **Separation of Concerns**: Client, server, and shared code must remain independent. Communication happens through DTOs only.

2. **Test-Driven Design**: Test expectations are authoritative. Implement services to match test signatures exactly.

3. **Namespace Consistency**: All new files MUST follow `BambisleepChurch.*` pattern. No global namespace types.

4. **DTO-First Design**: Define data contracts in `shared/DTOs/` before implementing client or server logic.

5. **MSTest Standards**: Use AAA pattern, `[TestInitialize]` for setup, descriptive test names with underscores.

6. **Type Safety**: Reconcile ID type inconsistencies before production. Choose either `int` or `Guid` consistently.

7. **Documentation**: Update this file when adding new patterns, resolving technical debt, or implementing missing features.

---

**Document version**: 1.0 (C# Client-Server Architecture)  
**Last updated**: November 2025  
**Framework**: .NET (version specified in project files)  
**Testing Framework**: MSTest  
**IDE Support**: Visual Studio, Visual Studio Code with C# DevKit

**Development Status**: Foundation established, service implementations pending
