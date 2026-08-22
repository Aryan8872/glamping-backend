# Multi-stage Dockerfile for high-performance NestJS production builds
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json prisma.config.ts ./
COPY prisma ./prisma/

RUN npm ci

# Copy source code and build using precompiled SWC/Nest
COPY . .

RUN npx prisma generate
RUN npx nest build

# Production runtime stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

EXPOSE 8080

CMD ["node", "dist/main.js"]
