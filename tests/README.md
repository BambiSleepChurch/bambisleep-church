# Tests

Test suite for BambiSleep™ Church MCP Control Tower.

## Structure

```
tests/
├── api/                            # API endpoint tests
│   ├── routes.test.js              # REST API route tests
│   ├── websocket.test.js           # WebSocket module tests
│   └── mcp-api.test.js             # MCP API integration tests
├── servers/                        # Server wrapper tests
│   ├── index.test.js               # ServerRegistry tests
│   ├── memory.test.js              # Memory (Knowledge Graph) tests
│   ├── sequential-thinking.test.js # Sequential Thinking tests
│   └── mongodb.test.js             # MongoDB Atlas tests
├── utils/                          # Utility module tests
│   ├── config.test.js              # Configuration tests
│   ├── logger.test.js              # Logger tests
│   └── rate-limit.test.js          # Rate limiting tests
├── helpers/                        # Test helpers
│   └── long-running.js             # Long-running process helper
└── README.md                       # This file
```

## Running Tests

```bash
# Run all tests
npm test

# Run unit tests only (fast, no server required)
npm run test:unit

# Run integration tests (requires running server)
npm run test:integration

# Run with coverage report
npm run test:coverage

# Run specific test file
node --test tests/utils/config.test.js

# Run with verbose output
node --test --test-reporter=spec tests/
```

## Test Categories

### Unit Tests

- `tests/utils/` - Pure unit tests for utility modules
- `tests/servers/memory.test.js` - Knowledge graph operations
- `tests/servers/sequential-thinking.test.js` - Reasoning chains
- `tests/api/websocket.test.js` - WebSocket message types
- Fast, no external dependencies required

### Integration Tests

- `tests/api/routes.test.js` - Requires running API server (port 8080)
- `tests/api/mcp-api.test.js` - Full MCP API integration
- `tests/servers/mongodb.test.js` - Requires MongoDB Atlas connection

### Skipping Conditions

- API tests skip if server not running (`ECONNREFUSED`)
- MongoDB tests skip if `MONGODB_URI` not configured for Atlas

## Writing Tests

Uses Node.js built-in test runner (no external dependencies):

```javascript
import assert from "node:assert";
import { describe, it, beforeEach } from "node:test";

describe("Module Name", () => {
  it("should do something", () => {
    assert.strictEqual(actual, expected);
  });
});
```

## Coverage

```bash
# Run with coverage (Node.js 20+)
node --test --experimental-test-coverage tests/
```
