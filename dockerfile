# syntax=docker/dockerfile:1

FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund



FROM node:24-alpine AS build
WORKDIR /app


ARG NEXT_PUBLIC_URL_BACKEND=http://localhost:3001
ENV NEXT_PUBLIC_URL_BACKEND=${NEXT_PUBLIC_URL_BACKEND} \
    NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .


RUN printf "/** @type {import('next').NextConfig} */\nexport default {\n  output: 'export',\n  images: { unoptimized: true },\n}\n" > next.config.mjs \
 && rm -f middleware.ts \
 && npm run build



FROM nginxinc/nginx-unprivileged:1.28-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build --chown=nginx:nginx /app/out /usr/share/nginx/html

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:3000/health || exit 1