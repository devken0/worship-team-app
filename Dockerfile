# syntax=docker/dockerfile:1
#
# Multi-stage build for the Next.js 16 (standalone output) app.
#   deps    -> install node_modules from the lockfile
#   builder -> run `next build`; bakes NEXT_PUBLIC_* into the client bundle
#   runner  -> minimal image: just server.js + traced deps, runs as non-root
#
# NEXT_PUBLIC_* values are inlined at BUILD time, so they arrive as build args.
# The two server-only secrets (SUPABASE_SERVICE_ROLE_KEY, CLEANUP_SECRET) are
# read at RUNTIME and must NOT be baked in — pass them with `docker run -e`
# or via docker-compose's env_file. See docker-compose.yml.

# ---- deps: install dependencies ----------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder: compile the app ------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Public env vars must exist at build time to be inlined into the browser bundle
# (src/lib/supabase/client.ts). An image is therefore pinned to one Supabase
# project; rebuild per environment.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ---- runner: minimal production image ----------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Don't run the server as root.
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Standalone trace: server.js + the minimal node_modules it actually needs.
# `public/` and `.next/static/` are not copied by standalone and must be added.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
