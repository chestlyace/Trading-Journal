FROM node:20-alpine AS base

RUN npm install -g pnpm@9

WORKDIR /app

FROM base AS deps

COPY package.json pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/

RUN pnpm install --frozen-lockfile

FROM deps AS build

COPY apps ./apps
COPY packages ./packages

RUN pnpm --filter @tradge/types build
RUN pnpm --filter @tradge/utils build
RUN pnpm --filter @tradge/api build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/node_modules ./node_modules

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["node", "dist/index.js"]

