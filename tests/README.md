# Tests

Test suite for BambiSleep™ Church MCP Control Tower.

## Structure

```
tests/
├── api/                  # API endpoint tests
│   ├── routes.test.js    # REST API route tests
│   └── mcp-api.test.js   # MCP API integration tests
├── servers/              # Server wrapper tests
│   ├── index.test.js     # ServerRegistry tests
│   └── mongodb.test.js   # MongoDB Atlas tests
├── utils/                # Utility module tests
│   ├── config.test.js    # Configuration tests
│   ├── logger.test.js    # Logger tests
│   └── rate-limit.test.js # Rate limiting tests
└── README.md             # This file
```

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
node --test tests/utils/config.test.js

# Run with verbose output
node --test --test-reporter=spec tests/

# Run tests matching pattern
node --test tests/**/*.test.js
```

## Test Categories

### Unit Tests

- `tests/utils/` - Pure unit tests for utility modules
- Fast, no external dependencies required

### Integration Tests

- `tests/api/` - Requires running API server (port 8080)
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
