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

# Build the Vite app
RUN pnpm --filter web build

# ── Stage 2: serve with nginx ─────────────────────────────────────────────────
FROM nginx:stable-alpine AS runner

# Remove default nginx static content
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# nginx config: serve SPA — all unknown routes fall back to index.html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
