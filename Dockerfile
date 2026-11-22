# --- deps: install once, cached across builds ---
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# --- build: compile the Next.js app ---
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# --- runtime: minimal image, non-root user, only what's needed to run ---
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 tradeix

# This app has no public/ directory; Next.js standalone output contains the runtime assets.
# Add a public/ copy only if the repository later introduces static public assets.
COPY --from=builder --chown=tradeix:nodejs /app/.next/standalone ./
COPY --from=builder --chown=tradeix:nodejs /app/.next/static ./.next/static

USER tradeix
EXPOSE 3000
ENV PORT=3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
