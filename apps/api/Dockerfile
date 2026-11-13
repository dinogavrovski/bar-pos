# Build from the repo root:  docker build -f apps/api/Dockerfile .
# (The root is the build context because the API needs the workspace files and packages/shared.)

# ---------- base: Node + pnpm, shared by the stages below ----------
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
WORKDIR /repo

# ---------- build: install everything, compile, then cut a production-only copy ----------
FROM base AS build
# 1) Copy only the files that decide dependencies. Docker caches each step,
#    so as long as these don't change, the slow install below is reused.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
# --filter @barpos/api... = the API plus the workspace packages it depends on (shared), nothing else.
# --ignore-scripts skips the root "prepare: husky" (git hooks are useless in an image).
RUN pnpm install --frozen-lockfile --filter "@barpos/api..." --ignore-scripts

# 2) Now copy the source (changes often, so it comes after the install).
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter @barpos/api build

# 3) Copy the API with ONLY production dependencies into /out (no tsup, drizzle-kit, types...).
RUN pnpm --filter @barpos/api deploy --prod --ignore-scripts /out

# ---------- runtime: the image that actually ships ----------
FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
# Only the output of the build stage comes along: no source, no dev deps, no pnpm.
COPY --from=build --chown=node:node /out ./
# Don't run as root: if someone breaks in through the app, they aren't root in the container.
USER node
EXPOSE 3001
# Liveness, not readiness: Docker reacts to this by restarting, which only helps if the API itself is stuck.
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3001/api/health/live || exit 1
# Exec form (JSON array) so node is PID 1's direct child and receives SIGTERM.
CMD ["node", "--enable-source-maps", "dist/index.js"]
