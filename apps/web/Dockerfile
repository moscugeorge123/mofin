# ── Stage 1: build ───────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy manifests needed for workspace resolution first (better layer caching)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/ui/package.json ./packages/ui/

# Install all dependencies needed by the web app and its workspace deps
RUN pnpm install --frozen-lockfile --filter web...

# Copy workspace packages and web source
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

# Build arguments for injecting env vars at build time
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Build — TanStack Start + Nitro outputs to apps/web/.output/
RUN pnpm --filter web build

# ── Stage 2: production image ─────────────────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

# Copy the Nitro server output from builder
COPY --from=builder /app/apps/web/.output ./.output

EXPOSE 3000

# Nitro server entry point
CMD ["node", ".output/server/index.mjs"]
