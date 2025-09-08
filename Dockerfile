# Multi-stage build for THEA Backend
FROM node:18-alpine AS base

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++ \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Development stage
FROM base AS development

# Install dev dependencies
RUN npm ci

# Copy source code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]

# Production stage
FROM base AS production

# Create non-root user
RUN addgroup -g 1001 -S nodejs \
    && adduser -S nodejs -u 1001

# Copy source code (excluding dev files)
COPY --chown=nodejs:nodejs . .

# Create necessary directories and set permissions
RUN mkdir -p logs uploads/temp \
    && chown -R nodejs:nodejs logs uploads \
    && chmod -R 755 logs uploads

# Remove unnecessary files for production
RUN rm -rf tests/ coverage/ .env.example docker-compose.yml Dockerfile \
    && npm prune --production

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start production server
CMD ["npm", "start"]
