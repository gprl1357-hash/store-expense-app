#!/usr/bin/env bash
# Supabase Database Webhook 설정 안내 + 연결 테스트
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f .env.local ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
fi

WEBHOOK_URL="${WEBHOOK_URL:-https://store-expense-app.vercel.app/api/slack/webhook}"

echo "=============================================="
echo " Supabase → Slack Webhook 설정 (1회)"
echo "=============================================="
echo ""
echo "Supabase Dashboard → Database → Webhooks → Create hook"
echo ""
echo "  Name:     expense-slack-notify"
echo "  Table:    expenses"
echo "  Events:   INSERT"
echo "  Method:   POST"
echo "  URL:      ${WEBHOOK_URL}"
echo ""
echo "  HTTP Headers (Add):"
echo "    Authorization: Bearer \${CRON_SECRET}"
echo ""
if [[ -n "${CRON_SECRET:-}" ]]; then
  echo "  (현재 CRON_SECRET 값으로 헤더 입력)"
  echo "    Authorization: Bearer ${CRON_SECRET}"
else
  echo "  ⚠ CRON_SECRET 이 .env.local 에 없습니다."
fi
echo ""
echo "→ Webhook 테스트 (샘플 INSERT payload)"
if [[ -n "${CRON_SECRET:-}" ]]; then
  curl -sS -X POST "${WEBHOOK_URL}" \
    -H "Authorization: Bearer ${CRON_SECRET}" \
    -H "Content-Type: application/json" \
    --data "{\"type\":\"INSERT\",\"table\":\"expenses\",\"schema\":\"public\",\"record\":{\"id\":\"00000000-0000-0000-0000-000000000099\",\"date\":\"2026-07-16\",\"category\":\"기타\",\"amount\":1,\"memo\":\"[Webhook 테스트]\",\"created_by\":\"홍혜기\",\"created_at\":\"2026-07-16T07:00:00.000Z\",\"deleted_at\":null,\"photo_url\":null}}" \
    | (command -v jq >/dev/null && jq . || cat)
  echo ""
  echo "Slack 채널에 [Webhook 테스트] 메시지가 왔는지 확인하세요."
else
  echo "CRON_SECRET 설정 후 다시 실행하세요."
fi
