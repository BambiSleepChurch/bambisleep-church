# API Reference

**Complete HTTP REST API and WebSocket API documentation for MCP Control Tower.**

---

## Overview

The Control Tower exposes two APIs:

1. **HTTP REST API** - Request/response operations for server control
2. **WebSocket API** - Real-time bidirectional communication for monitoring

**Base URL**: `http://localhost:3000` (configurable via `SERVER_PORT` env var)

---

## HTTP REST API

### Authentication

**Current**: No authentication required

**Future** (see [../ci-cd-pipeline.md](../ci-cd-pipeline.md)): JWT-based authentication

### Common Response Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid request parameters |
| 404 | Not Found | Resource not found |
| 500 | Internal Server Error | Server error occurred |

### Error Response Format

All error responses follow this structure:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "timestamp": 1730678400000
}
```

---

## Endpoints

### Health Check

Get system health status.

```http
GET /health
```

**Parameters**: None

**Response 200 OK**:

```json
{
  "status": "ok",
  "uptime": 12345,
  "timestamp": 1730678400000,
  "servers": {
    "filesystem": {
      "state": "running",
      "healthy": true,
      "pid": 12345,
      "startedAt": 1730678390000
    },
    "memory": {
      "state": "running",
      "healthy": true,
      "pid": 12346,
      "startedAt": 1730678391000
    }
  }
}
```

**Status Values**:

- `ok` - All critical servers running
- `degraded` - Some non-critical servers down
- `critical` - Critical servers down

**Example**:

```bash
curl http://localhost:3000/health
```

---

### List Servers

Get detailed status of all MCP servers.

```http
GET /api/servers
```

**Parameters**: None

**Response 200 OK**:

```json
[
  {
    "name": "filesystem",
    "state": "running",
    "pid": 12345,
    "startedAt": 1730678390000,
    "restartCount": 0,
    "healthy": true,
    "metadata": {
      "layer": 0,
      "dependencies": [],
      "critical": true
    }
  },
  {
    "name": "memory",
    "state": "running",
    "pid": 12346,
    "startedAt": 1730678391000,
    "restartCount": 0,
    "healthy": true,
    "metadata": {
      "layer": 0,
      "dependencies": [],
      "critical": true
    }
  }
]
```

**Server States**:

- `stopped` - Server not running
- `starting` - Server spawn initiated
- `running` - Server process active
- `stopping` - Server shutdown initiated
- `error` - Server crashed
- `restarting` - Server restart in progress

**Example**:

```bash
curl http://localhost:3000/api/servers
```

---

### Start Server

Start a specific MCP server.

```http
POST /api/servers/:name/start
```

**Parameters**:

- `name` (path) - Server name (e.g., `filesystem`, `memory`, `git`)

**Request Body**: None

**Response 200 OK**:

```json
{
  "success": true,
  "message": "Server 'filesystem' started",
  "server": {
    "name": "filesystem",
    "state": "starting",
    "pid": 12345
  }
}
```

**Response 400 Bad Request** (server not found):

```json
{
  "error": "Server 'unknown' not found in configuration",
  "code": "SERVER_NOT_FOUND"
}
```

**Response 409 Conflict** (server already running):

```json
{
  "error": "Server 'filesystem' is already running",
  "code": "SERVER_ALREADY_RUNNING",
  "server": {
    "name": "filesystem",
    "state": "running",
    "pid": 12345
  }
}
```

**Example**:

```bash
curl -X POST http://localhost:3000/api/servers/filesystem/start
```

---

### Stop Server

Stop a specific MCP server.

```http
POST /api/servers/:name/stop
```

**Parameters**:

- `name` (path) - Server name

**Request Body**: None

**Response 200 OK**:

```json
{
  "success": true,
  "message": "Server 'filesystem' stopped",
  "server": {
    "name": "filesystem",
    "state": "stopped"
  }
}
```

**Response 400 Bad Request** (server not running):

```json
{
  "error": "Server 'filesystem' is not running",
  "code": "SERVER_NOT_RUNNING"
}
```

**Example**:

```bash
curl -X POST http://localhost:3000/api/servers/filesystem/stop
```

---

### Restart Server

Restart a specific MCP server (stop + start).

```http
POST /api/servers/:name/restart
```

**Parameters**:

- `name` (path) - Server name

**Request Body**: None

**Response 200 OK**:

```json
{
  "success": true,
  "message": "Server 'filesystem' restarted",
  "server": {
    "name": "filesystem",
    "state": "running",
    "pid": 12347
  }
}
```

**Example**:

```bash
curl -X POST http://localhost:3000/api/servers/filesystem/restart
```

---

### Start All Servers

Start all registered MCP servers in tier order.

```http
POST /api/servers/start-all
```

**Parameters**: None

**Request Body**: None

**Response 200 OK**:

```json
{
  "success": true,
  "message": "All servers started",
  "servers": [
    { "name": "filesystem", "state": "running" },
    { "name": "memory", "state": "running" },
    { "name": "git", "state": "running" }
  ]
}
```

**Behavior**:

1. Starts Layer 0 servers (filesystem, memory)
2. Waits for Layer 0 health checks
3. Starts Layer 1 servers (git, github, brave-search)
4. Waits for Layer 1 health checks
5. Starts Layer 2 servers (sequential-thinking, postgres, everything)

**Example**:

```bash
curl -X POST http://localhost:3000/api/servers/start-all
```

---

### Stop All Servers

Stop all running MCP servers in reverse tier order.

```http
POST /api/servers/stop-all
```

**Parameters**: None

**Request Body**: None

**Response 200 OK**:

```json
{
  "success": true,
  "message": "All servers stopped",
  "servers": [
    { "name": "everything", "state": "stopped" },
    { "name": "postgres", "state": "stopped" },
    { "name": "sequential-thinking", "state": "stopped" }
  ]
}
```

**Example**:

```bash
curl -X POST http://localhost:3000/api/servers/stop-all
```

---

### Restart All Servers

Restart all MCP servers.

```http
POST /api/servers/restart-all
```

**Parameters**: None

**Request Body**: None

**Response 200 OK**:

```json
{
  "success": true,
  "message": "All servers restarted"
}
```

**Example**:

```bash
curl -X POST http://localhost:3000/api/servers/restart-all
```

---

## WebSocket API

### Connection

Connect to WebSocket server on same port as HTTP server:

```javascript
const ws = new WebSocket('ws://localhost:3000');

ws.onopen = () => {
  console.log('Connected to Control Tower');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected from Control Tower');
};
```

### Message Format

All WebSocket messages are JSON objects:

```json
{
  "type": "message-type",
  "data": { /* message-specific data */ },
  "timestamp": 1730678400000
}
```

---

## Client → Server Messages

### Subscribe to Channel

Subscribe to receive updates from a specific channel.

```json
{
  "type": "subscribe",
  "channel": "servers"
}
```

**Available Channels**:

- `servers` - MCP server status updates
- `logs` - Real-time log stream
- `events` - All orchestrator events
- `consciousness` - Consciousness detection events (future)

**Response** (acknowledgment):

```json
{
  "type": "subscribed",
  "channel": "servers",
  "timestamp": 1730678400000
}
```

---

### Unsubscribe from Channel

Unsubscribe from a channel.

```json
{
  "type": "unsubscribe",
  "channel": "servers"
}
```

**Response**:

```json
{
  "type": "unsubscribed",
  "channel": "servers",
  "timestamp": 1730678400000
}
```

---

### Execute Command

Execute a server control command.

```json
{
  "type": "command",
  "action": "start",
  "server": "filesystem"
}
```

**Actions**:

- `start` - Start server
- `stop` - Stop server
- `restart` - Restart server

**Response** (success):

```json
{
  "type": "command-result",
  "success": true,
  "action": "start",
  "server": "filesystem",
  "timestamp": 1730678400000
}
```

**Response** (error):

```json
{
  "type": "command-result",
  "success": false,
  "action": "start",
  "server": "filesystem",
  "error": "Server already running",
  "timestamp": 1730678400000
}
```

---

## Server → Client Messages

### Server Status Update

Sent when server state changes.

**Channel**: `servers`

```json
{
  "type": "server:status",
  "data": {
    "name": "filesystem",
    "state": "running",
    "pid": 12345,
    "timestamp": 1730678400000
  }
}
```

**State Values**:

- `stopped`, `starting`, `running`, `stopping`, `error`, `restarting`

---

### Server Started

Sent when server successfully starts.

**Channel**: `servers`, `events`

```json
{
  "type": "server:started",
  "data": {
    "name": "filesystem",
    "pid": 12345,
    "startedAt": 1730678400000
  }
}
```

---

### Server Stopped

Sent when server stops.

**Channel**: `servers`, `events`

```json
{
  "type": "server:stopped",
  "data": {
    "name": "filesystem",
    "stoppedAt": 1730678400000,
    "exitCode": 0,
    "signal": null
  }
}
```

---

### Server Error

Sent when server encounters error.

**Channel**: `servers`, `events`

```json
{
  "type": "server:error",
  "data": {
    "name": "filesystem",
    "error": "Process crashed",
    "exitCode": 1,
    "signal": "SIGKILL",
    "timestamp": 1730678400000
  }
}
```

---

### Health Check Failed

Sent when server fails health check.

**Channel**: `servers`, `events`

```json
{
  "type": "health-check-failed",
  "data": {
    "name": "filesystem",
    "reason": "Process not responding",
    "timestamp": 1730678400000
  }
}
```

---

### Log Message

Sent for real-time log streaming.

**Channel**: `logs`

```json
{
  "type": "log",
  "level": "info",
  "message": "📘 Server filesystem started",
  "context": "orchestrator",
  "timestamp": 1730678400000
}
```

**Log Levels**:

- `debug`, `info`, `success`, `warn`, `error`, `critical`

---

### State Saved

Sent when orchestrator persists state to disk.

**Channel**: `events`

```json
{
  "type": "state:saved",
  "data": {
    "path": ".mcp/state.json",
    "timestamp": 1730678400000
  }
}
```

---

## Complete Example: WebSocket Client

### JavaScript/Browser

```javascript
class ControlTowerClient {
  constructor(url = 'ws://localhost:3000') {
    this.url = url;
    this.ws = null;
    this.handlers = new Map();
  }
  
  connect() {
    this.ws = new WebSocket(this.url);
    
    this.ws.onopen = () => {
      console.log('✅ Connected to Control Tower');
      // Subscribe to channels
      this.subscribe('servers');
      this.subscribe('logs');
    };
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.emit(message.type, message.data);
    };
    
    this.ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };
    
    this.ws.onclose = () => {
      console.log('🔌 Disconnected, reconnecting...');
      setTimeout(() => this.connect(), 5000);
    };
  }
  
  subscribe(channel) {
    this.send({ type: 'subscribe', channel });
  }
  
  startServer(name) {
    this.send({ type: 'command', action: 'start', server: name });
  }
  
  stopServer(name) {
    this.send({ type: 'command', action: 'stop', server: name });
  }
  
  on(type, handler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    this.handlers.get(type).push(handler);
  }
  
  emit(type, data) {
    const handlers = this.handlers.get(type) || [];
    handlers.forEach(handler => handler(data));
  }
  
  send(message) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
}

// Usage
const client = new ControlTowerClient();
client.connect();

client.on('server:started', (data) => {
  console.log(`✅ Server ${data.name} started (PID: ${data.pid})`);
});

client.on('server:stopped', (data) => {
  console.log(`🛑 Server ${data.name} stopped`);
});

client.on('log', (data) => {
  console.log(`[${data.level}] ${data.message}`);
});

// Start a server
client.startServer('filesystem');
```

### Python

```python
import asyncio
import websockets
import json

class ControlTowerClient:
    def __init__(self, url='ws://localhost:3000'):
        self.url = url
        self.handlers = {}
    
    async def connect(self):
        async with websockets.connect(self.url) as ws:
            print('✅ Connected to Control Tower')
            
            # Subscribe to channels
            await self.subscribe(ws, 'servers')
            await self.subscribe(ws, 'logs')
            
            # Listen for messages
            async for message in ws:
                data = json.loads(message)
                await self.emit(data['type'], data.get('data'))
    
    async def subscribe(self, ws, channel):
        await ws.send(json.dumps({
            'type': 'subscribe',
            'channel': channel
        }))
    
    async def start_server(self, ws, name):
        await ws.send(json.dumps({
            'type': 'command',
            'action': 'start',
            'server': name
        }))
    
    def on(self, event_type, handler):
        if event_type not in self.handlers:
            self.handlers[event_type] = []
        self.handlers[event_type].append(handler)
    
    async def emit(self, event_type, data):
        if event_type in self.handlers:
            for handler in self.handlers[event_type]:
                await handler(data)

# Usage
client = ControlTowerClient()

@client.on('server:started')
async def on_server_started(data):
    print(f"✅ Server {data['name']} started (PID: {data['pid']})")

@client.on('log')
async def on_log(data):
    print(f"[{data['level']}] {data['message']}")

asyncio.run(client.connect())
```

---

## Rate Limits

**Current**: No rate limits

**Future**: 100 requests/minute per IP for HTTP, 1000 messages/minute for WebSocket

---

## CORS Configuration

**Default**: Allows all origins (`*`)

**Production**: Configure via environment variable:

```bash
CORS_ORIGINS=https://dashboard.bambisleep.dev,https://admin.bambisleep.dev
```

Or in workspace file:

```json
{
  "settings": {
    "security": {
      "corsOrigins": [
        "https://dashboard.bambisleep.dev",
        "https://admin.bambisleep.dev"
      ]
    }
  }
}
```

---

## See Also

- **[modules.md](../implementation/modules.md)** - Module implementation details
- **[integration-points.md](integration-points.md)** - Configuration and environment
- **[dashboard-ui.md](../dashboard-ui.md)** - Frontend WebSocket client
- **[error-handling.md](../implementation/error-handling.md)** - Error response patterns
