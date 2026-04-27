# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy manifests for dependency resolution (layer caching)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/

# Install all workspace dependencies
RUN pnpm install --frozen-lockfile --filter accounting-be...

# Copy API source
COPY apps/api/ ./apps/api/

# Compile TypeScript
RUN pnpm --filter accounting-be build

# Create a self-contained deployment folder with production deps only
# pnpm deploy resolves the virtual store into real node_modules (no symlinks)
RUN pnpm --filter accounting-be deploy --prod /app/deploy

# ── Stage 2: production image ──────────────────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

# Production node_modules from pnpm deploy (fully resolved, no symlinks)
COPY --from=builder /app/deploy/node_modules ./node_modules

# Compiled output
COPY --from=builder /app/apps/api/dist ./dist

# Copy existing uploads and ensure the directory is writable
COPY --from=builder /app/apps/api/uploads ./uploads
RUN mkdir -p uploads

EXPOSE 3000

CMD ["node", "dist/src/server.js"]
