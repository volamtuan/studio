# Dockerfile

# 1. Install dependencies
# Using node:20-slim which is based on Debian for better compatibility
FROM node:20-slim AS deps
WORKDIR /app

# Copy package.json and lock file
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
# Use npm ci for reproducible builds
RUN npm ci


# 2. Build the app
FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build-time arguments to skip telemetry
ENV NEXT_TELEMETRY_DISABLED 1

# This is the Next.js build command for standalone output
# See https://nextjs.org/docs/app/building-your-application/deploying/docker
RUN npm run build


# 3. Run the app
# Using a slim image for the final container
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
# Disable telemetry during runtime
ENV NEXT_TELEMETRY_DISABLED 1

# Create a non-root user 'appuser' for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the standalone output
COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs ./.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs ./.next/static ./.next/static

# The node image comes with a 'node' user, but the Next.js standalone output
# is optimized for a 'nextjs' user. We will run as this user.
USER nextjs

EXPOSE 3000

ENV PORT=3000

# server.js is created by the standalone build
CMD ["node", "server.js"]
