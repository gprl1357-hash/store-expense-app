#!/usr/bin/env bash
# .env.local 의 Slack·백업 서버 변수를 Vercel Production에 등록
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env.local ]]; then
  echo ".env.local 이 없습니다."
  exit 1
fi

KEYS=(
  SLACK_ENABLED
  SLACK_BOT_TOKEN
  SLACK_NOTIFY_CHANNEL_ID
  SLACK_BACKUP_CHANNEL_ID
  CRON_SECRET
  SUPABASE_SERVICE_ROLE_KEY
)

echo "→ Vercel Production 환경변수 등록 (Slack·백업)"
for key in "${KEYS[@]}"; do
  line=$(grep -E "^${key}=" .env.local 2>/dev/null | head -1 || true)
  if [[ -z "$line" ]]; then
    echo "  SKIP $key ( .env.local 에 없음 )"
    continue
  fi
  value="${line#*=}"
  value="${value%$'\r'}"
  value="${value#\"}"
  value="${value%\"}"
  value="${value#\'}"
  value="${value%\'}"
  printf '%s' "$value" | npx vercel env add "$key" production --force
  echo "  OK $key"
done

echo ""
echo "✓ 완료. Vercel Dashboard에서 확인하거나 재배포 후 Production에서 동작합니다."
