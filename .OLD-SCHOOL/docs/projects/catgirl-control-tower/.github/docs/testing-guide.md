# Testing Guide

**Current State**: Jest configured in `package.json`, no test files yet. Target: 100% coverage.

**Test Structure** (create in `src/` alongside source files):
```
src/
├── index.test.js
├── mcp/
│   ├── orchestrator.test.js
│   ├── agent-coordinator.test.js
├── utils/
│   ├── logger.test.js
│   ├── config.test.js
```

## Testing Patterns

### 1. Unit Tests for Classes

```javascript
// orchestrator.test.js example
describe('MCPOrchestrator', () => {
  let orchestrator;
  
  beforeEach(async () => {
    orchestrator = new MCPOrchestrator({
      workspaceRoot: '/tmp/test',
      autoStart: []  // Disable auto-start in tests
    });
    await orchestrator.initialize();
  });
  
  afterEach(async () => {
    await orchestrator.shutdown();
  });
  
  describe('start()', () => {
    it('should start a server and emit server-started event', async () => {
      const eventPromise = new Promise(resolve => {
        orchestrator.once('server-started', resolve);
      });
      
      await orchestrator.start('filesystem');
      const event = await eventPromise;
      
      expect(event.name).toBe('filesystem');
      expect(event.pid).toBeGreaterThan(0);
    });
    
    it('should respect tiered initialization order', async () => {
      // Test that Layer 0 starts before Layer 1
    });
  });
});
```

### 2. Integration Tests

```javascript
// integration/control-tower.test.js
describe('Control Tower Integration', () => {
  it('should start Express server and initialize orchestrator', async () => {
    const app = new ControlTowerApp();
    await app.initialize();
    await app.start();
    
    // Test HTTP endpoint
    const response = await fetch('http://localhost:3000/api/health');
    expect(response.ok).toBe(true);
    
    await app.shutdown();
  });
});
```

### 3. Event-Driven Tests

```javascript
it('should emit health-check-failed for unhealthy servers', async () => {
  const failureEvents = [];
  orchestrator.on('health-check-failed', (data) => failureEvents.push(data));
  
  // Trigger health check for stopped server
  await orchestrator.checkHealth('stopped-server');
  
  expect(failureEvents.length).toBeGreaterThan(0);
});
```

### 4. Mock External Dependencies

```javascript
// Mock child_process.spawn for server process tests
jest.mock('child_process', () => ({
  spawn: jest.fn(() => ({
    pid: 12345,
    stdout: { on: jest.fn() },
    stderr: { on: jest.fn() },
    on: jest.fn()
  }))
}));
```

## Coverage Requirements

- Statements: 100%
- Branches: 90%+ (conditional logic)
- Functions: 100%
- Lines: 100%

## Run Tests

```bash
npm test                    # Single run with coverage
npm run test:watch          # Watch mode for TDD
npm run test:coverage       # Generate detailed HTML report
```
