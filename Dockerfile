# Multi-stage build for THEA Backend
# Optimized for production deployment

# Base stage with common dependencies
FROM node:18-alpine AS base

# Install system dependencies for native modules
RUN apk add --no-cache \
  python3 \
  make \
  g++ \
  libc6-compat \
  curl \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Dependencies stage
FROM base AS deps

# Install production dependencies
RUN npm ci --only=production && npm cache clean --force

# Development stage
FROM base AS development

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p logs uploads/temp && \
  chown -R node:node logs uploads

# Expose port
EXPOSE 3000

# Switch to non-root user
USER node

# Start development server with hot reload
CMD ["npm", "run", "dev"]

# Builder stage for production
FROM base AS builder

# Install all dependencies for building
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client and run any build steps
ENV PRISMA_CLIENT_ENGINE_TYPE=binary
ENV PRISMA_CLI_BINARY_TARGETS=linux-musl-openssl-3.0.x
RUN npx prisma generate

# Production stage
FROM node:18-alpine AS production

# Install runtime dependencies only
RUN apk add --no-cache \
  curl \
  tini \
  openssl \
  openssl-dev \
  && rm -rf /var/cache/apk/*

# Create app directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
  adduser -S nodejs -u 1001 -G nodejs

# Copy production dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy built application
COPY --chown=nodejs:nodejs . .

# Copy Prisma client from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Create necessary directories and set permissions
RUN mkdir -p logs uploads/temp && \
  chown -R nodejs:nodejs logs uploads && \
  chmod -R 755 logs uploads

# Remove unnecessary files for production
RUN rm -rf \
  tests/ \
  coverage/ \
  .env.example \
  docker-compose.yml \
  Dockerfile* \
  .dockerignore \
  docker-manage.* \
  mysql/ \
  redis/ \
  rabbitmq/ \
  README.md \
  .git* \
    && npm prune --production

# Switch to non-root user for security
USER nodejs

# Expose application port
EXPOSE 3000

# Use tini as PID 1 for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start production server
CMD ["node", "src/server.js"]
