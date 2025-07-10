FROM oven/bun:alpine AS build
WORKDIR /app
COPY package.json bun.lock .
RUN bun install
COPY . .
RUN bun run build

FROM oven/bun:alpine AS final
USER 1000
WORKDIR /app
COPY --from=build /app/dist .
ENTRYPOINT exec bun index.js
