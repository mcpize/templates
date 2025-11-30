# Multi-stage build for minimal image size
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files first (better layer caching)
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

# Copy built files and dependencies
COPY --from=builder /app/build ./build
COPY --from=builder /app/package*.json ./

# Install only production dependencies
RUN npm install --omit=dev --ignore-scripts

# Run as non-root user (Cloud Run best practice)
USER node

# Cloud Run requires PORT 8080
ENV PORT=8080
EXPOSE 8080

CMD ["node", "build/index.js", "--transport=streamable-http"]
