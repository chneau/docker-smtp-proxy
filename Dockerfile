FROM oven/bun:alpine
WORKDIR /app
COPY package.json .
COPY bun.lockb .
RUN bun install
COPY . .
ENTRYPOINT exec bun index.ts
