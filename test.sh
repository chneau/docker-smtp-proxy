#!/bin/sh
set -eu

IMAGE_NAME="${1:-test-smtp-proxy}"
CONTAINER_NAME="smtp-proxy-test-run"
PORT="3000"
TEST_API_KEY="test-secret-key-12345"

trap 'docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true' EXIT

echo "Starting container: $IMAGE_NAME..."
docker run -d --name "$CONTAINER_NAME" \
  -e API_KEY="$TEST_API_KEY" \
  -p "$PORT":3000 "$IMAGE_NAME"

echo "Waiting for container to start..."
sleep 2

echo "1. Checking /healthz endpoint..."
HEALTH=$(curl -s "http://127.0.0.1:$PORT/healthz")
echo "$HEALTH" | grep -q '"message":"ok"'
echo "✅ /healthz returned ok"

echo "2. Checking 401 Unauthorized for missing API key..."
STATUS_NO_AUTH=$(curl -s -o /dev/null -w "%{http_code}" -X POST "http://127.0.0.1:$PORT/" \
  -H "Content-Type: application/json" \
  -d '{"host":"localhost","from":"a@b.com","to":"c@d.com","subject":"hi","html":"hi"}')
if [ "$STATUS_NO_AUTH" -eq 401 ]; then
  echo "✅ Missing API key correctly returned 401 Unauthorized"
else
  echo "❌ Expected 401, got $STATUS_NO_AUTH"
  exit 1
fi

echo "3. Checking 401 Unauthorized for invalid API key..."
STATUS_BAD_AUTH=$(curl -s -o /dev/null -w "%{http_code}" -X POST "http://127.0.0.1:$PORT/" \
  -H "Content-Type: application/json" \
  -H "x-api-key: wrong-key" \
  -d '{"host":"localhost","from":"a@b.com","to":"c@d.com","subject":"hi","html":"hi"}')
if [ "$STATUS_BAD_AUTH" -eq 401 ]; then
  echo "✅ Invalid API key correctly returned 401 Unauthorized"
else
  echo "❌ Expected 401, got $STATUS_BAD_AUTH"
  exit 1
fi

echo "4. Checking OpenAPI documentation..."
DOCS=$(curl -s "http://127.0.0.1:$PORT/doc")
echo "$DOCS" | grep -q "SMTP Proxy API"
echo "✅ OpenAPI documentation available"

echo "🎉 All tests passed!"
