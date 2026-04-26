# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy only the manifests needed for dependency resolution first (better layer caching)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/

# Install only the API's dependencies (ignore unrelated workspace packages)
RUN pnpm install --frozen-lockfile --filter accounting-be...

# Copy API source
COPY apps/api/ ./apps/api/
RUN mkdir -p apps/api/uploads

# Compile TypeScript
RUN pnpm --filter accounting-be build

# ── Stage 2: production image ──────────────────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

# Copy installed node_modules from builder (avoids a second pnpm install)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules

# Copy compiled output from builder
COPY --from=builder /app/apps/api/dist ./apps/api/dist

EXPOSE 3000

CMD ["node", "apps/api/dist/server.js"]
