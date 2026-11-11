# Stage 1: Dependencies and Prisma client generation
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy Prisma schema, scripts, and source code
COPY prisma ./prisma/
COPY scripts ./scripts/
COPY src ./src/

# Generate Prisma Client
RUN node scripts/prepare-prisma.js && npx prisma generate

# Stage 2: Production runner container
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5001

# Create non-root system user
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs

# Copy runtime assets from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/src ./src

# Grant execution rights and assign ownership
RUN chmod +x ./scripts/docker-entrypoint.sh && chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:5001/health || exit 1

ENTRYPOINT ["./scripts/docker-entrypoint.sh"]
