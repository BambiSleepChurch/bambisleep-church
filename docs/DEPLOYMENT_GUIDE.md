# Deployment Guide

> BambiSleep™ Church MCP Control Tower - Production Deployment Reference

## Overview

This guide covers deploying the MCP Control Tower to production environments including:
- VPS/Cloud servers
- Docker containers
- Reverse proxy configuration
- SSL/TLS setup
- Monitoring and alerting

---

## Prerequisites

- **Node.js 20+** (LTS recommended)
- **Git** for source control
- **Domain name** (e.g., bambisleep.church)
- **SSL certificate** (Let's Encrypt recommended)
- **Reverse proxy** (nginx or Caddy)

---

## Quick Start Deployment

### 1. Clone Repository

```bash
git clone https://github.com/BambiSleepChurch/bambisleep-church.git
cd bambisleep-church
npm install --production
```

### 2. Configure Environment

```bash
cp .env.example .env
nano .env
```

**Production `.env`:**

```bash
# Environment
NODE_ENV=production

# Server Ports
API_PORT=8080
API_HOST=127.0.0.1
DASHBOARD_PORT=3000
DASHBOARD_HOST=127.0.0.1

# Logging
LOG_LEVEL=info
LOG_TO_FILE=true

# Rate Limiting (stricter for production)
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=60

# API Keys (use production keys)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
HUGGINGFACE_TOKEN=hf_xxxxxxxxxxxxx
STRIPE_API_KEY=sk_live_xxxxxxxxxxxxx
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/bambisleep

# Patreon
PATREON_CLIENT_ID=xxxxxxxxxxxxx
PATREON_CLIENT_SECRET=xxxxxxxxxxxxx

# LM Studio (if running locally)
LMSTUDIO_HOST=localhost
LMSTUDIO_PORT=1234
```

### 3. Start with Process Manager

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start src/index.js --name mcp-tower

# Save process list
pm2 save

# Enable startup on boot
pm2 startup
```

---

## Docker Deployment

### Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --production

# Copy source
COPY . .

# Create data directories
RUN mkdir -p data/storage/IMAGES data/storage/VIDEOS logs

# Expose ports
EXPOSE 3000 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s \
  CMD wget -q --spider http://localhost:8080/api/health || exit 1

# Start application
CMD ["node", "src/index.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  mcp-tower:
    build: .
    ports:
      - "3000:3000"
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - API_HOST=0.0.0.0
      - DASHBOARD_HOST=0.0.0.0
    env_file:
      - .env
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    restart: unless-stopped
    networks:
      - mcp-network

  mongodb:
    image: mongo:7
    volumes:
      - mongo-data:/data/db
    networks:
      - mcp-network

networks:
  mcp-network:

volumes:
  mongo-data:
```

### Build and Run

```bash
docker-compose up -d
docker-compose logs -f mcp-tower
```

---

## Reverse Proxy Configuration

### Nginx Configuration

```nginx
# /etc/nginx/sites-available/bambisleep.church

upstream mcp_dashboard {
    server 127.0.0.1:3000;
}

upstream mcp_api {
    server 127.0.0.1:8080;
}

server {
    listen 80;
    server_name bambisleep.church www.bambisleep.church;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name bambisleep.church www.bambisleep.church;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/bambisleep.church/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bambisleep.church/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.clarity.ms https://unpkg.com; style-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data: https:; connect-src 'self' wss: https:;" always;

    # Dashboard (static files)
    location / {
        proxy_pass http://mcp_dashboard;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API endpoints
    location /api/ {
        proxy_pass http://mcp_api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Increase timeouts for long operations
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket endpoint
    location /ws {
        proxy_pass http://mcp_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400;
    }

    # OAuth redirects
    location /redirect/ {
        proxy_pass http://mcp_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static docs
    location /docs {
        proxy_pass http://mcp_api;
        proxy_set_header Host $host;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
}
```

### Caddy Configuration (Alternative)

```caddyfile
bambisleep.church {
    # Dashboard
    handle {
        reverse_proxy localhost:3000
    }

    # API
    handle /api/* {
        reverse_proxy localhost:8080
    }

    # WebSocket
    handle /ws {
        reverse_proxy localhost:8080
    }

    # OAuth redirects
    handle /redirect/* {
        reverse_proxy localhost:8080
    }

    # Security headers
    header {
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
    }

    # Compression
    encode gzip

    # Automatic HTTPS via Let's Encrypt
    tls {
        protocols tls1.2 tls1.3
    }
}
```

---

## SSL/TLS Setup

### Let's Encrypt with Certbot

```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d bambisleep.church -d www.bambisleep.church

# Auto-renewal (usually configured automatically)
sudo certbot renew --dry-run
```

### Certificate Renewal Cron

```bash
# /etc/cron.d/certbot
0 12 * * * root certbot renew --quiet --post-hook "systemctl reload nginx"
```

---

## Monitoring Setup

### Prometheus Integration

The API exposes metrics at `/api/metrics` in Prometheus format.

**prometheus.yml:**

```yaml
scrape_configs:
  - job_name: 'mcp-tower'
    static_configs:
      - targets: ['localhost:8080']
    metrics_path: '/api/metrics'
    scrape_interval: 15s
```

### Available Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `mcp_http_requests_total` | Counter | Total HTTP requests |
| `mcp_http_errors_total` | Counter | HTTP errors by status |
| `mcp_http_request_duration_seconds` | Summary | Request latency |
| `mcp_tool_executions_total` | Counter | Tool executions |
| `mcp_websocket_messages_total` | Counter | WebSocket messages |
| `mcp_active_connections` | Gauge | Active connections |
| `mcp_server_status` | Gauge | Server status (1/0) |
| `mcp_uptime_seconds` | Gauge | Server uptime |
| `mcp_nodejs_heap_used_bytes` | Gauge | Node.js memory |

### Grafana Dashboard

Import the following JSON as a Grafana dashboard:

```json
{
  "title": "MCP Control Tower",
  "panels": [
    {
      "title": "Request Rate",
      "type": "graph",
      "targets": [
        { "expr": "rate(mcp_http_requests_total[5m])" }
      ]
    },
    {
      "title": "Error Rate",
      "type": "graph",
      "targets": [
        { "expr": "rate(mcp_http_errors_total[5m])" }
      ]
    },
    {
      "title": "Active Connections",
      "type": "stat",
      "targets": [
        { "expr": "mcp_active_connections" }
      ]
    },
    {
      "title": "Server Status",
      "type": "table",
      "targets": [
        { "expr": "mcp_server_status" }
      ]
    }
  ]
}
```

---

## Health Checks

### Endpoint

```bash
curl https://bambisleep.church/api/health
```

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "env": "production"
}
```

### Uptime Monitoring

Configure external uptime monitoring (UptimeRobot, Pingdom, etc.):

- **URL**: `https://bambisleep.church/api/health`
- **Method**: GET
- **Expected**: Status 200, body contains "ok"
- **Interval**: 60 seconds

---

## Alerting

### Example Alert Rules (Prometheus)

```yaml
groups:
  - name: mcp-tower
    rules:
      - alert: HighErrorRate
        expr: rate(mcp_http_errors_total[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: High error rate detected

      - alert: ServiceDown
        expr: up{job="mcp-tower"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: MCP Control Tower is down

      - alert: HighMemoryUsage
        expr: mcp_nodejs_heap_used_bytes > 500000000
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: High memory usage (>500MB)
```

---

## Backup Strategy

### Database Backup (MongoDB)

```bash
#!/bin/bash
# /opt/scripts/backup-mongodb.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/opt/backups/mongodb

mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/$DATE"

# Keep only last 7 days
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} \;
```

### File Storage Backup

```bash
#!/bin/bash
# /opt/scripts/backup-storage.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/opt/backups/storage

tar -czf "$BACKUP_DIR/storage_$DATE.tar.gz" /app/data/storage

# Keep only last 30 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

### Cron Schedule

```bash
# /etc/cron.d/mcp-backups
0 2 * * * root /opt/scripts/backup-mongodb.sh
0 3 * * * root /opt/scripts/backup-storage.sh
```

---

## Security Checklist

- [ ] SSL/TLS enabled with valid certificate
- [ ] Environment variables secured (not in git)
- [ ] Rate limiting configured
- [ ] Security headers configured
- [ ] Firewall rules (only 80/443 exposed)
- [ ] Regular security updates
- [ ] Log rotation configured
- [ ] Backup strategy implemented
- [ ] Monitoring and alerting active
- [ ] API keys rotated regularly

---

## Troubleshooting

### View Logs

```bash
# PM2 logs
pm2 logs mcp-tower

# Docker logs
docker-compose logs -f mcp-tower

# Application logs
tail -f logs/mcp-tower-*.log
```

### Common Issues

**Port already in use:**
```bash
lsof -i :8080
kill -9 <PID>
```

**Memory issues:**
```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" node src/index.js
```

**SSL certificate issues:**
```bash
sudo certbot certificates
sudo certbot renew --force-renewal
```

---

## Resources

- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)
