# ============================================================
#  GrapeMaster — Multi-Stage Docker Build
#
#  Stages:
#    1. deps    — install production dependencies
#    2. builder — install ALL deps, generate Prisma client, build Next.js
#    3. runner  — minimal runtime image (no dev deps, no source)
#
#  Build:  docker build -t grapemaster .
#  Run:    docker run -p 3000:3000 --env-file .env.local grapemaster
# ============================================================

# ── Stage 1: Install production dependencies ─────────────────
FROM node:20-alpine AS deps

# Install libc compatibility for Prisma's query engine binary
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# ── Stage 2: Build ────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy ALL node_modules (including devDeps needed for build)
COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Generate Prisma Client (must happen before next build)
RUN npx prisma generate

# Build Next.js (outputs to .next/)
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── Stage 3: Minimal runtime image ───────────────────────────
FROM node:20-alpine AS runner

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Copy only what is needed to run
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static   ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public          ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma          ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules    ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json    ./package.json

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check (requires /api/health endpoint)
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
