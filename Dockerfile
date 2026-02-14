FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app

RUN addgroup -S node-group && adduser -S node-user -G node-group

RUN mkdir -p .next/cache && chown -R node-user:node-group .next

COPY --from=builder --chown=node-user:node-group /app/public ./public
COPY --from=builder --chown=node-user:node-group /app/.next/standalone ./
COPY --from=builder --chown=node-user:node-group /app/.next/static ./.next/static

USER node-user

EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]