#!/usr/bin/env bash
# Pull the latest code, rebuild the image, recreate the container, prune leftovers.
# Usage: ./deploy.sh [env-file]   (defaults to .env.production)
set -euo pipefail
cd "$(dirname "$0")"

ENV_FILE="${1:-.env.production}"
if [ ! -f "$ENV_FILE" ]; then
  echo "✗ Env file '$ENV_FILE' not found — copy .env.production.example and fill it in." >&2
  exit 1
fi

echo "→ Pulling latest code…"
git pull --ff-only

echo "→ Rebuilding and restarting…"
docker compose --env-file "$ENV_FILE" up --build -d

echo "→ Pruning dangling images…"
docker image prune -f

echo "✓ Deployed."
docker compose --env-file "$ENV_FILE" ps
