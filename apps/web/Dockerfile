# ── Stage 1: build ───────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy manifests needed for workspace resolution first (better layer caching)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/ui/package.json ./packages/ui/

# Install all dependencies needed by the web app and its workspace deps
RUN pnpm install --filter web...

# Copy workspace packages and web source
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

# Build arguments for injecting env vars at build time (client-side)
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Build the TanStack Start / Nitro app — outputs to apps/web/.output/
RUN pnpm --filter web build

# ── Stage 2: production Node.js server ────────────────────────────────────────
# TanStack Start uses Nitro which produces a self-contained Node.js server,
# not static files — nginx cannot serve it.
FROM node:22-alpine AS production

WORKDIR /app

# Copy Nitro's output (server + public assets)
COPY --from=builder /app/apps/web/.output ./.output

ENV PORT=4000
EXPOSE 4000

# Nitro's entry point; PORT env var controls the listening port
CMD ["node", ".output/server/index.mjs"]
