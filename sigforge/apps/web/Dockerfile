FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable
WORKDIR /repo

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* turbo.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile || pnpm install

FROM deps AS build
COPY packages/shared packages/shared
COPY apps/web apps/web
WORKDIR /repo/apps/web
RUN pnpm build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /repo/node_modules /repo/node_modules
COPY --from=build /repo/apps/web /repo/apps/web
COPY --from=build /repo/packages/shared /repo/packages/shared
WORKDIR /repo/apps/web
EXPOSE 3000
CMD ["pnpm", "start"]
