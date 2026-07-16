#!/usr/bin/env bash
# 개발 서버(localhost:3000)에서 일일 백업 API 수동 테스트
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f .env.local ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
fi

BASE_URL="${BACKUP_TEST_URL:-http://localhost:3000}"
AUTH_HEADER=""
if [[ -n "${CRON_SECRET:-}" ]]; then
  AUTH_HEADER="Authorization: Bearer ${CRON_SECRET}"
fi

echo "→ GET ${BASE_URL}/api/backup/daily"
if [[ -n "$AUTH_HEADER" ]]; then
  curl -sS -X GET "${BASE_URL}/api/backup/daily" \
    -H "$AUTH_HEADER" | (command -v jq >/dev/null && jq . || cat)
else
  echo "(CRON_SECRET 없음 — dev 모드에서만 허용)"
  curl -sS -X GET "${BASE_URL}/api/backup/daily" | (command -v jq >/dev/null && jq . || cat)
fi
