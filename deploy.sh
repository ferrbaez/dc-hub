#!/usr/bin/env bash
# DC Hub — deploy script
# Uso:
#   ./deploy.sh                → pull de origin/main + rebuild + restart
#   ./deploy.sh <sha>          → rollback a un commit específico
#
# Ejecutar desde el servidor (no desde la laptop):
#   ssh n8n@172.16.10.113
#   cd /opt/dc-hub
#   ./deploy.sh
#
# Requisitos pre-instalados en el servidor:
#   - node 20, pnpm, pm2, docker + docker compose

set -euo pipefail

REPO_DIR="${REPO_DIR:-/opt/dc-hub}"
BRANCH="${BRANCH:-main}"
PM2_NAME="${PM2_NAME:-dc-hub}"
TARGET_SHA="${1:-}"

cd "$REPO_DIR"

echo "▶ Fetching latest from origin"
git fetch --all --prune

if [[ -n "$TARGET_SHA" ]]; then
  echo "▶ Rolling back to $TARGET_SHA"
  git checkout "$TARGET_SHA"
else
  echo "▶ Checking out $BRANCH"
  git checkout "$BRANCH"
  git reset --hard "origin/$BRANCH"
fi

CURRENT_SHA=$(git rev-parse --short HEAD)
echo "▶ Deploying $CURRENT_SHA"

echo "▶ pnpm install (frozen)"
pnpm install --frozen-lockfile

echo "▶ pnpm db:push (local Timescale — safe, idempotent)"
pnpm db:push || echo "  (skip if no changes)"

echo "▶ pnpm build"
pnpm build

echo "▶ Restarting docker services (timescale, n8n if managed here)"
docker compose up -d --remove-orphans

if pm2 describe "$PM2_NAME" > /dev/null 2>&1; then
  echo "▶ pm2 reload $PM2_NAME"
  pm2 reload "$PM2_NAME" --update-env
else
  echo "▶ pm2 start (first time)"
  pm2 start pnpm --name "$PM2_NAME" --time -- start
  pm2 save
fi

echo "▶ Health check"
sleep 3
curl -fsS http://localhost:3000/api/healthcheck > /dev/null && echo "  ✓ OK" || echo "  ✗ FAIL (check pm2 logs $PM2_NAME)"

echo "✓ Deployed $CURRENT_SHA"
