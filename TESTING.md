# Testing Guide

## Overview

The BambiSleep™ Church MCP Control Tower includes comprehensive testing for all components, APIs, and agent tools.

## Test Suites

### 1. API Endpoint Tests

**File**: `test-api.ps1`  
**Purpose**: Validate all REST API endpoints are responding correctly  
**Coverage**: 16 core endpoints

**Run**:

```powershell
.\test-api.ps1
```

**Endpoints Tested**:

- Health Check
- Server Management
- Metrics
- Agent Tools
- Memory Graph
- GitHub Integration
- Storage Files
- LM Studio
- Patreon
- BambiSleep Chat
- Clarity Analytics
- Puppeteer

**Expected Results**: All endpoints should return 200 OK when services are running

---

### 2. Agent Tools Tests

**File**: `test-tools.ps1`  
**Purpose**: Test all 154 MCP agent tools across 18 categories  
**Coverage**: Representative tools from each category

**Run**:

```powershell
.\test-tools.ps1
```

**Categories Tested** (18 total):

1. **MEMORY** (9 tools) - Knowledge graph operations
2. **USER-MODEL** (9 tools) - User preferences and behavior
3. **CONVERSATION** (10 tools) - Chat history and context
4. **WORKSPACE** (8 tools) - Project analysis
5. **MEMORY-MANAGER** (10 tools) - Memory lifecycle
6. **STORAGE** (7 tools) - File operations
7. **FETCH** (4 tools) - HTTP requests
8. **GITHUB** (3 tools) - Repository integration
9. **LMSTUDIO** (4 tools) - Language model integration
10. **MONGODB** (9 tools) - Database operations
11. **SQLITE** (6 tools) - Local database
12. **THINKING** (4 tools) - Sequential reasoning
13. **STRIPE** (12 tools) - Payment processing
14. **PATREON** (15 tools) - Creator platform
15. **CLARITY** (7 tools) - Analytics
16. **PUPPETEER** (12 tools) - Browser automation
17. **HUGGINGFACE** (3 tools) - ML models/datasets
18. **RENDER** (22 tools) - UI rendering commands

**Test Approach**: Realistic agent usage patterns with meaningful parameters

**Results**: See `AGENT_TEST_RESULTS.md` for comprehensive analysis

---

### 3. Unit Tests

**Directory**: `tests/`  
**Framework**: Node.js built-in test runner (`node:test`)  
**Coverage**: 300+ tests across all modules

**Run All Tests**:

```bash
npm test
```

**Run Specific Test Suite**:

```bash
npm run test:unit          # Fast, no server required
npm run test:integration   # Requires server on port 8080
npm run test:coverage      # With coverage report
```

**Test Files**:

```
tests/
├── api/
│   ├── routes.test.js           # API route handlers
│   ├── websocket.test.js        # WebSocket communication
│   └── mcp-api.test.js          # MCP client integration
├── servers/
│   ├── index.test.js            # Server registry
│   ├── storage.test.js          # Storage MCP
│   ├── mongodb.test.js          # MongoDB MCP
│   ├── patreon.test.js          # Patreon MCP
│   └── memory/                  # Memory system tests
│       ├── graph.test.js
│       ├── user-model.test.js
│       ├── conversation.test.js
│       ├── workspace.test.js
│       └── manager.test.js
└── utils/
    ├── config.test.js           # Configuration loader
    ├── logger.test.js           # Logging system
    └── rate-limit.test.js       # Rate limiting
```

**Target Coverage**: 84%+

---

## Frontend Testing

### Dashboard UI

**Access**: http://localhost:3000

**Interactive Testing**:

1. Navigate to "🔧 Agent Tools" section
2. Click "▶️ Run Tests" to execute comprehensive suite
3. View real-time results with filtering
4. Export results to JSON

**Features**:

- Summary metrics (Total, Tested, Passed, Failed, Success Rate)
- Category breakdown with progress bars
- Filterable results table
- Individual tool testing
- Result persistence (localStorage)
- JSON export

**See**: `FRONTEND_FIXES.md` for complete UI documentation

---

## Test Results & Reports

### Current Status

- ✅ **API Endpoints**: 16/16 passing (100%)
- ✅ **Agent Tools**: ~85% passing (operational services)
- ✅ **Unit Tests**: 300+ tests, 84%+ coverage

### Detailed Reports

**Agent Tools Analysis**: `AGENT_TEST_RESULTS.md`

- Complete tool-by-tool breakdown
- Category pass rates
- Realistic usage workflows
- Production readiness assessment
- Recommendations for improvements

**Frontend Implementation**: `FRONTEND_FIXES.md`

- Complete UI feature documentation
- Component architecture
- User workflows
- Performance optimizations

---

## Running Tests in Different Environments

### Development

```bash
# Start server
npm run dev

# In another terminal
.\test-api.ps1        # Quick API check
.\test-tools.ps1      # Agent tools validation
npm test              # Unit tests
```

### Continuous Integration

```bash
# GitHub Actions / CI Pipeline
npm test              # All unit tests
npm run test:coverage # Generate coverage report
```

### Production Validation

```bash
# After deployment
.\test-api.ps1        # Verify all endpoints
# Check dashboard at https://yourdomain.com
```

---

## Troubleshooting

### Common Issues

**"Connection refused" errors**

- Server not running on port 8080
- Solution: `npm start` or `npm run dev`

**Tool tests failing with "No handler"**

- Handler not registered in agent-tools.js
- Check `src/servers/agent-tools.js` for tool definition

**"Not connected" for MongoDB/Stripe/etc**

- External service not configured
- Expected in dev environment without credentials
- See `.env.example` for required configuration

**WebSocket tests failing**

- WebSocket server not initialized
- Render tools require active WebSocket connection
- Check browser console for WS connection status

### Debug Mode

```bash
# Enable verbose logging
LOG_LEVEL=debug npm start

# Check logs
ls logs/
```

---

## Best Practices

### Before Committing

1. ✅ Run `npm test` - ensure all unit tests pass
2. ✅ Run `.\test-api.ps1` - verify API endpoints
3. ✅ Check dashboard UI - no console errors
4. ✅ Review `AGENT_TEST_RESULTS.md` - understand tool status

### Adding New Tools

1. Define tool in `src/servers/agent-tools.js`
2. Implement handler in appropriate module
3. Add test case to `test-tools.ps1`
4. Update `AGENT_TEST_RESULTS.md` with findings
5. Test via dashboard UI

### Performance Testing

- Monitor response times during tool execution
- Check memory usage with Chrome DevTools
- Verify rate limiting is working (max 60/min)
- Test concurrent requests

---

## Coverage Goals

| Component       | Target | Current |
| --------------- | ------ | ------- |
| API Routes      | 90%+   | 85%+    |
| Server Handlers | 85%+   | 84%+    |
| Memory System   | 90%+   | 88%+    |
| Agent Tools     | 100%   | 85%+    |
| Utils           | 95%+   | 92%+    |

**Overall Target**: 84%+ code coverage across all modules

---

## Quick Reference

```bash
# Essential Commands
npm test                    # All tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests
npm run test:coverage      # With coverage report

.\test-api.ps1             # API endpoint check
.\test-tools.ps1           # Agent tools test

# Development
npm run dev                # Hot reload
npm start                  # Production mode

# Logs
Get-Content logs\*.log     # View logs (PowerShell)
tail -f logs/*.log         # View logs (Unix)
```

---

## Additional Resources

- **Architecture**: `docs/AGENT.md` - Agent system design
- **Memory System**: `docs/MEMORY_MCP_REFERENCE.md`
- **API Reference**: `docs/MCP_CONFIGURATION_GUIDE.md`
- **Deployment**: `docs/DEPLOYMENT_GUIDE.md`

---

_Last Updated: January 12, 2026_  
_Test Coverage: 84%+ | 154 Agent Tools | 18 Categories_
