# 🌸 BambiSleep MCP Server Dockerfile
# Multi-stage build for optimized production image

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /build

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm ci --only=development

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

# Install security updates
RUN apk update && \
    apk upgrade && \
    apk add --no-cache \
    curl \
    ca-certificates && \
    rm -rf /var/cache/apk/*

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built application from builder
COPY --from=builder /build/dist ./dist

# Copy necessary runtime files
COPY .env.example ./.env.example

# Create data directory
RUN mkdir -p /data && \
    chown -R nodejs:nodejs /app /data

# Switch to non-root user
USER nodejs

# Expose ports
EXPOSE 3000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start server
CMD ["node", "dist/server.js"]
