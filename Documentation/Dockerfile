FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run test && npm run build

FROM node:22-alpine AS runtime
ENV HOST=0.0.0.0 PORT=4321 NODE_ENV=production
WORKDIR /app
RUN addgroup -S docs && adduser -S -G docs docs
COPY --from=build --chown=docs:docs /app/dist ./dist
USER docs
EXPOSE 4321
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 CMD wget -qO- http://127.0.0.1:4321/health >/dev/null || exit 1
CMD ["node", "./dist/server/entry.mjs"]
