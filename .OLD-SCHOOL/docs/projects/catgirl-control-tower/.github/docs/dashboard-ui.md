# Dashboard UI Implementation

**Current State**: Express routes functional, `public/` directory exists but empty.

## Technology Stack

- **No build tools**: Pure HTML/CSS/JavaScript for simplicity
- **WebSocket**: Native browser WebSocket API for real-time updates
- **CSS Framework**: Milligram CSS (lightweight, ~2KB gzipped)
- **Icons**: Emoji-first (matches project aesthetic)

## File Structure

Create in `public/`:

```
public/
├── index.html           # Main dashboard
├── css/
│   ├── style.css       # Custom styles
│   └── milligram.min.css  # Framework (CDN or local)
├── js/
│   ├── dashboard.js    # Main dashboard logic
│   ├── websocket.js    # WebSocket client
│   └── api.js          # REST API client
└── docs/               # API documentation (already exists)
```

## Implementation Files

### 1. HTML Structure (`public/index.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>🌸 BambiSleep™ MCP Control Tower</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/milligram/1.4.1/milligram.min.css">
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <div class="container">
    <header>
      <h1>🌸 MCP Control Tower</h1>
      <div id="connection-status" class="badge">Connecting...</div>
    </header>
    
    <section id="servers">
      <h2>MCP Servers</h2>
      <div id="server-grid" class="grid">
        <!-- Populated by JS -->
      </div>
    </section>
    
    <section id="agents">
      <h2>Registered Agents</h2>
      <div id="agent-list">
        <!-- Populated by JS -->
      </div>
    </section>
    
    <section id="consciousness">
      <h2>✨ Consciousness Detection</h2>
      <div id="consciousness-metrics">
        <!-- Populated by JS -->
      </div>
    </section>
  </div>
  
  <script src="/js/api.js"></script>
  <script src="/js/websocket.js"></script>
  <script src="/js/dashboard.js"></script>
</body>
</html>
```

### 2. WebSocket Client (`public/js/websocket.js`)

```javascript
/// Law: WebSocket connection manager
class DashboardWebSocket {
  constructor(url) {
    this.url = url || `ws://${window.location.host}`;
    this.ws = null;
    this.reconnectDelay = 1000;
    this.maxReconnectDelay = 30000;
    this.handlers = new Map();
  }
  
  connect() {
    this.ws = new WebSocket(this.url);
    
    this.ws.onopen = () => {
      console.log('✅ WebSocket connected');
      this.reconnectDelay = 1000;
      this.emit('connected');
      
      // Subscribe to all channels
      this.send({ type: 'subscribe', channel: 'servers' });
      this.send({ type: 'subscribe', channel: 'agents' });
      this.send({ type: 'subscribe', channel: 'consciousness' });
    };
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.emit(data.type, data.data);
    };
    
    this.ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };
    
    this.ws.onclose = () => {
      console.log('🔌 WebSocket disconnected, reconnecting...');
      setTimeout(() => this.connect(), this.reconnectDelay);
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
    };
  }
  
  send(data) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
  
  on(event, handler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event).push(handler);
  }
  
  emit(event, data) {
    const handlers = this.handlers.get(event) || [];
    handlers.forEach(handler => handler(data));
  }
}
```

### 3. Dashboard Logic (`public/js/dashboard.js`)

```javascript
/// Law: Main dashboard controller
const dashboard = {
  ws: null,
  servers: new Map(),
  agents: new Map(),
  
  async init() {
    // Initialize WebSocket
    this.ws = new DashboardWebSocket();
    this.ws.on('server:status', (data) => this.updateServer(data));
    this.ws.on('agent:registered', (data) => this.addAgent(data));
    this.ws.on('consciousness:detected', (data) => this.showConsciousness(data));
    this.ws.connect();
    
    // Load initial data
    await this.loadServers();
    await this.loadAgents();
    
    // Attach event listeners
    this.attachEventListeners();
  },
  
  async loadServers() {
    const response = await fetch('/api/servers');
    const servers = await response.json();
    servers.forEach(server => this.renderServer(server));
  },
  
  renderServer(server) {
    const serverCard = document.createElement('div');
    serverCard.className = `server-card ${server.state}`;
    serverCard.innerHTML = `
      <h3>${server.name}</h3>
      <div class="badge ${server.state}">${server.state}</div>
      <div class="server-meta">
        <span>Layer ${server.metadata?.layer || 0}</span>
        <span>PID: ${server.pid || 'N/A'}</span>
      </div>
      <div class="server-actions">
        <button onclick="dashboard.startServer('${server.name}')">▶️ Start</button>
        <button onclick="dashboard.stopServer('${server.name}')">⏹️ Stop</button>
        <button onclick="dashboard.restartServer('${server.name}')">🔄 Restart</button>
      </div>
    `;
    document.getElementById('server-grid').appendChild(serverCard);
    this.servers.set(server.name, serverCard);
  },
  
  async startServer(name) {
    await fetch(`/api/servers/${name}/start`, { method: 'POST' });
  },
  
  async stopServer(name) {
    await fetch(`/api/servers/${name}/stop`, { method: 'POST' });
  }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => dashboard.init());
```

### 4. Custom Styles (`public/css/style.css`)

```css
/// Law: Dashboard styling with consciousness theme
:root {
  --consciousness-pink: #ff69b4;
  --running-green: #4ade80;
  --error-red: #ef4444;
  --stopped-gray: #6b7280;
}

.server-card {
  padding: 1.5rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.server-card.running {
  border-color: var(--running-green);
  background: rgba(74, 222, 128, 0.1);
}

.server-card.error {
  border-color: var(--error-red);
  background: rgba(239, 68, 68, 0.1);
}

.consciousness-pulse {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

## Verify Static File Serving

Already configured in `src/index.js`:

```javascript
app.use(express.static(path.join(__dirname, '..', 'public')));
```
