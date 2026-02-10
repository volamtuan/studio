# 1. Install dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

# 2. Build the app
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# 3. Run the app
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# The standalone output is smaller and faster
# and copies only the necessary files.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Create directories for logs and config if they don't exist
# And ensure the node user has permissions
RUN mkdir -p logs src/config public/uploads && \
    chown -R node:node logs src/config public/uploads

USER node

EXPOSE 3000
ENV PORT=3000

# Start the server
CMD ["node", "server.js"]
