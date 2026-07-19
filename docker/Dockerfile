# syntax=docker/dockerfile:1

# ──────────────────────────────────────────────────────────
# Stage 1 — deps: install all node_modules from the lockfile
# ──────────────────────────────────────────────────────────
FROM node:22-alpine AS deps

WORKDIR /app

RUN corepack enable \
    && corepack prepare pnpm@10.26.2 --activate

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

# ──────────────────────────────────────────────────────────
# Stage 2 — build: compile the Astro SSR bundle
# ──────────────────────────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

RUN corepack enable \
    && corepack prepare pnpm@10.26.2 --activate

# Build-time env vars (Astro/Vite bakes PUBLIC_* into the JS bundle)
ARG PUBLIC_API_BASE
ARG API_BASE
ARG PUBLIC_SITE_URL
ENV PUBLIC_API_BASE=${PUBLIC_API_BASE}
ENV API_BASE=${API_BASE}
ENV PUBLIC_SITE_URL=${PUBLIC_SITE_URL}

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm run build

# ──────────────────────────────────────────────────────────
# Stage 3 — runtime: lean production image
# ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime

WORKDIR /app

# node:22-alpine already ships with a `node` user (UID/GID 1000) — reuse it.

# Only copy the built output and node_modules needed at runtime.
# Astro standalone bundles its own deps into dist/server — but we still
# copy node_modules so any native addons are available if needed.
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=deps  --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json ./

USER node

# HOST/PORT consumed by @astrojs/node standalone entry point
ENV HOST=0.0.0.0
ENV PORT=4321

EXPOSE 4321

ENTRYPOINT ["node", "dist/server/entry.mjs"]
