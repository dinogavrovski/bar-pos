# Build from the repo root:  docker build -f apps/web/Dockerfile .

# ---------- base ----------
FROM node:24-alpine AS base
# Download pnpm once, in its own cached layer, with retries.
# Corepack reads the exact version from package.json "packageManager".
# Retries because one DNS/network hiccup on the CI runner (EAI_AGAIN) shouldn't fail the build.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
COPY package.json /tmp/pm/package.json
RUN corepack enable \
  && cd /tmp/pm \
  && for i in 1 2 3 4 5; do \
       corepack install && exit 0; \
       echo "corepack install failed (attempt $i), retrying in $((i * 3))s..."; \
       sleep $((i * 3)); \
     done; \
     exit 1
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /repo

# ---------- build ----------
FROM base AS build
# Dependency manifests first, so the install layer is cached until they change.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile --filter "@barpos/web..." --ignore-scripts

COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/web apps/web
RUN pnpm --filter @barpos/web build

# ---------- runtime ----------
FROM node:24-alpine AS runtime
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /app
# standalone = server.js + the minimal node_modules it needs (keeps the monorepo folder layout).
COPY --from=build --chown=node:node /repo/apps/web/.next/standalone ./
# Static assets (JS/CSS chunks) aren't included in standalone; copy them next to the server.
COPY --from=build --chown=node:node /repo/apps/web/.next/static ./apps/web/.next/static
USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/ >/dev/null || exit 1
CMD ["node", "apps/web/server.js"]
