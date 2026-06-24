#!/usr/bin/env bash
# Starts the dev server (if not already running), captures a full-page
# screenshot, then stops the server again.
#
# Usage:  ./screenshot.sh [output.png]
# Default output file: schedoughler-screenshot.png

set -euo pipefail

PORT=5199
OUT="${1:-schedoughler-screenshot.png}"

# Ensure the Chromium browser binary is present (no-op if already installed).
npx --yes playwright install chromium 2>/dev/null

# Start the dev server only when the port is not yet serving.
SERVER_PID=""
if ! curl -sf "http://localhost:$PORT" >/dev/null 2>&1; then
  npm run dev -- --port "$PORT" &>/dev/null &
  SERVER_PID=$!
  trap 'kill "$SERVER_PID" 2>/dev/null; wait "$SERVER_PID" 2>/dev/null || true' EXIT

  printf "Waiting for dev server on port %s" "$PORT"
  timeout 30 bash -c "until curl -sf http://localhost:$PORT >/dev/null 2>&1; do sleep 0.5; printf '.'; done"
  echo " ready."
fi

npx playwright screenshot \
  --full-page \
  --viewport-size "390, 844" \
  --wait-for-selector "text=Sauerteigbrot" \
  "http://localhost:$PORT" \
  "$OUT"

echo "Screenshot saved: $OUT"
