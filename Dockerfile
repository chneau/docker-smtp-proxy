FROM oven/bun:alpine
USER 1000
WORKDIR /app
COPY package.json .
COPY bun.lockb .
RUN bun install
COPY . .
ENTRYPOINT exec bun index.ts
