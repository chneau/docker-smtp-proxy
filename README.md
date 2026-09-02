# docker-smtp-proxy

[![Publish Docker image](https://github.com/chneau/docker-smtp-proxy/actions/workflows/publish.yml/badge.svg)](https://github.com/chneau/docker-smtp-proxy/actions/workflows/publish.yml)
[![Docker Image](https://img.shields.io/badge/docker_image-ghcr.io%2Fchneau%2Fsmtp--proxy-blue?logo=docker)](https://ghcr.io/chneau/smtp-proxy)

High-performance HTTP to SMTP proxy API built with [Bun](https://bun.sh),
[Hono](https://hono.dev), and [Nodemailer](https://nodemailer.com).

Allows microservices, serverless functions, and static frontends to send emails
via HTTP requests through standard SMTP gateways or authenticated mail
providers.

---

## ✨ Features

- ⚡ **Blazing Fast**: Powered by Bun runtime and Hono framework.
- 🔒 **Timing-Safe Auth**: Protected with `x-api-key` header using constant-time
  string comparisons.
- 📑 **Interactive OpenAPI Docs**: Built-in Swagger UI (`/swagger`) and Scalar
  (`/scalar`) with live request testing.
- 📦 **Multi-Architecture**: Multi-platform Docker images for `linux/amd64` and
  `linux/arm64`.
- 🩺 **Healthcheck**: Dedicated `/healthz` endpoint and container `HEALTHCHECK`.
- ✉️ **Flexible Delivery**: Supports raw SMTP gateways (port 25) as well as
  authenticated SMTP servers (port 465/587 with SSL/TLS and auth credentials).
- 📎 **Attachments**: Supports base64 attachments out-of-the-box.

---

## 🚀 Quickstart

Run the container with your API key:

```bash
docker run --rm -p 3000:3000 -e API_KEY="my-secret-key" ghcr.io/chneau/smtp-proxy
```

### Check Health

```bash
curl http://localhost:3000/healthz
# {"message":"ok"}
```

### View Interactive API Documentation

- **Scalar UI**: [http://localhost:3000/scalar](http://localhost:3000/scalar)
- **Swagger UI**: [http://localhost:3000/swagger](http://localhost:3000/swagger)
- **Raw OpenAPI Specification**:
  [http://localhost:3000/doc](http://localhost:3000/doc)

---

## 📬 Sending an Email

Send a `POST` request to `/` with the `x-api-key` header:

### Simple Text & HTML Email

```bash
curl -X POST http://localhost:3000/ \
  -H "Content-Type: application/json" \
  -H "x-api-key: my-secret-key" \
  -d '{
    "host": "smtp.example.com",
    "port": 587,
    "secure": false,
    "auth": {
      "user": "postmaster@example.com",
      "pass": "secret_smtp_password"
    },
    "from": "notifications@example.com",
    "to": "user@example.com",
    "subject": "Hello from docker-smtp-proxy",
    "text": "Plain text message content",
    "html": "<h1>Hello!</h1><p>This email was sent via HTTP SMTP Proxy.</p>"
  }'
```

### Sending with Attachments

```bash
curl -X POST http://localhost:3000/ \
  -H "Content-Type: application/json" \
  -H "x-api-key: my-secret-key" \
  -d '{
    "host": "localhost",
    "port": 25,
    "from": "system@example.com",
    "to": "dev@example.com",
    "subject": "System Report",
    "html": "<p>See attached report.</p>",
    "attachments": [
      {
        "filename": "report.txt",
        "content": "SGVsbG8gV29ybGQh",
        "encoding": "base64"
      }
    ]
  }'
```

---

## ⚙️ Configuration & Environment Variables

| Variable  | Required | Description                                            |
| :-------- | :------- | :----------------------------------------------------- |
| `API_KEY` | **Yes**  | Secret key required in the `x-api-key` request header. |
| `PORT`    | No       | HTTP listen port (default: `3000`).                    |

---

## 🐳 Docker Compose Example

```yaml
services:
  smtp-proxy:
    image: ghcr.io/chneau/smtp-proxy:latest
    ports:
      - "3000:3000"
    environment:
      - API_KEY=replace_with_your_strong_api_key
    restart: unless-stopped
```

---

## 🧪 Testing Locally

Run automated typechecks and the test suite:

```bash
# Typecheck
bun run lint

# Build and run container test suite
docker build -t test-smtp-proxy .
./test.sh test-smtp-proxy
```

---

## 📄 License

MIT © [chneau](https://github.com/chneau)
