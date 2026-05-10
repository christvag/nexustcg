# Use the official Node.js 20 image as base (required for better-sqlite3)
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
# Install build dependencies for native modules (sqlite3)
RUN apk add --no-cache libc6-compat python3 py3-setuptools make g++
WORKDIR /app

# Install dependencies based on the preferred package manager.
# --ignore-scripts skips postinstall here because schema files haven't been copied yet;
# we run db:seed explicitly in the builder stage after `COPY . .`.
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

# Rebuild the source code only when needed
FROM base AS builder
# Install build dependencies for native modules
RUN apk add --no-cache python3 py3-setuptools make g++
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Rebuild native modules for Alpine Linux
RUN npm rebuild bcrypt --build-from-source
RUN npm rebuild better-sqlite3 --build-from-source
RUN npm rebuild sqlite3 --build-from-source || true

# Seed the SQLite databases now that schema files are in place. Idempotent.
RUN node scripts/db-seed.js || true

# Environment variables for build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Remove debug routes that use Prisma
RUN rm -rf app/api/debug || true

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Install curl for health checks
RUN apk add --no-cache curl

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Create database directory and set permissions
RUN mkdir -p /app/database
RUN chown -R nextjs:nodejs /app/database

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy database files (will be overridden by volume mount in production)
COPY --from=builder --chown=nextjs:nodejs /app/database ./database

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Start the application
CMD ["node", "server.js"]