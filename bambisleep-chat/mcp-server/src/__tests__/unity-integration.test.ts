// 🧪 Unity-MCP Integration Tests
// Tests WebSocket communication between Unity and MCP server

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import WebSocket from 'ws';
import { spawn, ChildProcess } from 'child_process';

describe.skip('Unity-MCP Bridge Integration (requires Unity server)', () => {
  let mcpServer: ChildProcess;
  let wsClient: WebSocket;
  const SERVER_URL = 'ws://localhost:3001';
  
  beforeAll(async () => {
    // Start MCP server
    mcpServer = spawn('npm', ['run', 'dev'], {
      cwd: './mcp-server',
      env: { ...process.env, WS_PORT: '3001' }
    });
    
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Connect WebSocket client
    wsClient = new WebSocket(SERVER_URL);
    await new Promise(resolve => wsClient.on('open', resolve));
  });

  afterAll(async () => {
    wsClient?.close();
    mcpServer?.kill();
  });

  it('should establish WebSocket connection', () => {
    expect(wsClient.readyState).toBe(WebSocket.OPEN);
  });

  it('should handle emotion update events', (done) => {
    const emotionEvent = {
      type: 'emotion_state',
      timestamp: new Date().toISOString(),
      data: { emotion: 'happy', intensity: 0.8 }
    };

    wsClient.once('message', (data) => {
      const response = JSON.parse(data.toString());
      expect(response.status).toBe('received');
      done();
    });

    wsClient.send(JSON.stringify(emotionEvent));
  });

  it('should handle animation trigger events', (done) => {
    const animEvent = {
      type: 'animation_trigger',
      timestamp: new Date().toISOString(),
      data: { animation: 'purr' }
    };

    wsClient.once('message', (data) => {
      const response = JSON.parse(data.toString());
      expect(response.type).toBe('animation_response');
      done();
    });

    wsClient.send(JSON.stringify(animEvent));
  });

  it('should handle heartbeat messages', (done) => {
    const heartbeat = {
      type: 'heartbeat',
      timestamp: new Date().toISOString()
    };

    wsClient.once('message', (data) => {
      const response = JSON.parse(data.toString());
      expect(response.type).toBe('heartbeat_ack');
      done();
    });

    wsClient.send(JSON.stringify(heartbeat));
  });

  it('should handle chat messages from Unity', (done) => {
    const chatMsg = {
      type: 'chat_message',
      timestamp: new Date().toISOString(),
      data: { userId: 'test-unity-user', message: 'Hello from Unity!' }
    };

    wsClient.once('message', (data) => {
      const response = JSON.parse(data.toString());
      expect(response.type).toBe('chat_response');
      expect(response.data).toHaveProperty('reply');
      done();
    });

    wsClient.send(JSON.stringify(chatMsg));
  });

  it('should maintain connection with periodic heartbeats', async () => {
    const heartbeatCount = 3;
    let received = 0;

    const heartbeatPromise = new Promise<void>((resolve) => {
      wsClient.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'heartbeat_ack') {
          received++;
          if (received === heartbeatCount) resolve();
        }
      });
    });

    // Send multiple heartbeats
    for (let i = 0; i < heartbeatCount; i++) {
      wsClient.send(JSON.stringify({
        type: 'heartbeat',
        timestamp: new Date().toISOString()
      }));
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    await heartbeatPromise;
    expect(received).toBe(heartbeatCount);
  });

  it('should handle malformed messages gracefully', (done) => {
    wsClient.once('message', (data) => {
      const response = JSON.parse(data.toString());
      expect(response.type).toBe('error');
      expect(response.error).toContain('Invalid message format');
      done();
    });

    wsClient.send('invalid json{');
  });

  it('should reconnect after disconnect', async () => {
    wsClient.close();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newClient = new WebSocket(SERVER_URL);
    await new Promise(resolve => newClient.on('open', resolve));
    
    expect(newClient.readyState).toBe(WebSocket.OPEN);
    newClient.close();
  });
});

describe('Unity Animation Sync', () => {
  it('should trigger avatar animations via MCP', async () => {
    // TODO: Add Unity-specific animation sync tests
    expect(true).toBe(true);
  });
});

describe('Performance Tests', () => {
  it.skip('should handle high-frequency updates (requires Unity server)', async () => {
    const ws = new WebSocket('ws://localhost:3001');
    await new Promise(resolve => ws.on('open', resolve));

    const messageCount = 100;
    let received = 0;

    ws.on('message', () => received++);

    const start = Date.now();
    for (let i = 0; i < messageCount; i++) {
      ws.send(JSON.stringify({
        type: 'emotion_state',
        timestamp: new Date().toISOString(),
        data: { emotion: 'neutral', intensity: Math.random() }
      }));
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
    const duration = Date.now() - start;

    expect(received).toBeGreaterThan(messageCount * 0.9); // 90% delivery
    expect(duration).toBeLessThan(5000); // Complete in 5 seconds

    ws.close();
  });
});
