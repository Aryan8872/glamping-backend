# Multi-stage Dockerfile for high-performance NestJS production builds
FROM node:22-alpine AS builder

WORKDIR /app

# Install all dependencies (including dev tools & transitive build packages)
COPY package*.json prisma.config.ts ./
COPY prisma ./prisma/

RUN npm ci

# Copy source code and compile
COPY . .

RUN npx prisma generate
RUN npx nest build

# Production runtime stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Copy all verified dependencies and compiled outputs directly from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 8080

CMD ["node", "dist/main.js"]
