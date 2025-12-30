# BambiSleep™ Church MCP Control Tower
# Production Dockerfile

FROM node:20-alpine AS base

# Install dependencies for native modules
RUN apk add --no-cache \
  curl \
  chromium \
  nss \
  freetype \
  harfbuzz \
  ca-certificates \
  ttf-freefont

# Set Puppeteer to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
  PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# ============================================================================
# Dependencies Stage
# ============================================================================
FROM base AS deps

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# ============================================================================
# Production Stage
# ============================================================================
FROM base AS runner

ENV NODE_ENV=production \
  LOG_LEVEL=info

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
  adduser --system --uid 1001 bambi

# Copy application
COPY --from=deps /app/node_modules ./node_modules
COPY --chown=bambi:nodejs . .

# Create data directory
RUN mkdir -p /app/data && chown -R bambi:nodejs /app/data

USER bambi

# Expose ports
EXPOSE 3000 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/api/health || exit 1

# Start application
CMD ["node", "src/index.js"]
