# Docker Deployment Guide

**Container Strategy**: Multi-stage build for minimal production image.

## Dockerfile

Create in root directory:

```dockerfile
# syntax=docker/dockerfile:1
# /// Law: Multi-stage Docker build for MCP Control Tower

# ═══════════════════════════════════════════════════════════════
# Stage 1: Development dependencies
# ═══════════════════════════════════════════════════════════════
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for testing)
RUN npm ci

# Copy source code
COPY . .

# Run tests (fail build if tests fail)
RUN npm test

# ═══════════════════════════════════════════════════════════════
# Stage 2: Production runtime
# ═══════════════════════════════════════════════════════════════
FROM node:20-alpine AS production

# /// Law: Security - run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application code
COPY --from=builder /app/src ./src
COPY --from=builder /app/public ./public
COPY --from=builder /app/bambisleep-church-catgirl-control-tower.code-workspace ./

# Create .mcp directory for state/logs
RUN mkdir -p .mcp/logs .mcp/cache && \
    chown -R nodejs:nodejs .mcp

# Switch to non-root user
USER nodejs

# Expose Control Tower port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start application
CMD ["node", "src/index.js"]
```

## .dockerignore

```
node_modules
npm-debug.log
coverage
.mcp/cache
.mcp/logs
.env
.git
.github
*.md
!README.md
.vscode
docker/
*.test.js
.DS_Store
```

## docker-compose.yml

For local development with dependencies:

```yaml
# /// Law: Docker Compose for local MCP Control Tower development
version: '3.8'

services:
  control-tower:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    container_name: mcp-control-tower
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      GITHUB_TOKEN: ${GITHUB_TOKEN}
      BRAVE_API_KEY: ${BRAVE_API_KEY}
      POSTGRES_CONNECTION_STRING: postgresql://postgres:password@postgres:5432/mcp_db
    volumes:
      - mcp-state:/app/.mcp
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - mcp-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:16-alpine
    container_name: mcp-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: mcp_db
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - mcp-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  mcp-state:
  postgres-data:

networks:
  mcp-network:
    driver: bridge
```

## Build and Run Commands

```bash
# Local build
docker build -t bambisleep/mcp-control-tower:latest .

# Run standalone
docker run -d \
  -p 3000:3000 \
  -e GITHUB_TOKEN=$GITHUB_TOKEN \
  -e BRAVE_API_KEY=$BRAVE_API_KEY \
  -e NODE_ENV=production \
  --name mcp-control-tower \
  bambisleep/mcp-control-tower:latest

# Run with Docker Compose
docker-compose up -d

# View logs
docker logs -f mcp-control-tower

# Check health
docker inspect --format='{{json .State.Health}}' mcp-control-tower | jq
```

## Container Security

```bash
# Scan for vulnerabilities
docker scan bambisleep/mcp-control-tower:latest

# Run Trivy security scan
trivy image bambisleep/mcp-control-tower:latest

# Check for secrets in image
docker history bambisleep/mcp-control-tower:latest --no-trunc
```
