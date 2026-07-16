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
SECRET="${CRON_SECRET:-}"

echo "=============================================="
echo " Supabase → Slack Webhook 설정 (1회)"
echo "=============================================="
echo ""
echo "Supabase Dashboard → Database → Webhooks"
echo "  (기존 hook 이 있으면 삭제 후 새로 만들거나 헤더 수정)"
echo ""
echo "  Name:     expense-slack-notify"
echo "  Table:    public.expenses"
echo "  Events:   INSERT ✓"
echo "  Method:   POST"
echo "  URL:      ${WEBHOOK_URL}"
echo "  Timeout:  5000 ms 이상 (가능하면)"
echo ""
echo "  ┌─ HTTP Headers (권장 — Bearer 없이 간단) ─┐"
echo "  │  Name:  x-cron-secret                    │"
if [[ -n "$SECRET" ]]; then
  echo "  │  Value: ${SECRET}                        │"
else
  echo "  │  Value: (.env.local 의 CRON_SECRET 값)   │"
fi
echo "  └──────────────────────────────────────────┘"
echo ""
echo "  (대안) Name: Authorization"
echo "         Value: Bearer ${SECRET:-<CRON_SECRET>}"
echo ""
echo "→ 연결 테스트"
if [[ -n "$SECRET" ]]; then
  echo "  [1] x-cron-secret"
  curl -sS -X GET "${WEBHOOK_URL}" -H "x-cron-secret: ${SECRET}" \
    | (command -v jq >/dev/null && jq . || cat)
  echo ""
  echo "  [2] Slack 전송 테스트"
  curl -sS -X POST "${WEBHOOK_URL}" \
    -H "x-cron-secret: ${SECRET}" \
    -H "Content-Type: application/json" \
    --data "{\"type\":\"INSERT\",\"table\":\"expenses\",\"schema\":\"public\",\"record\":{\"id\":\"00000000-0000-0000-0000-000000000099\",\"date\":\"2026-07-16\",\"category\":\"기타\",\"amount\":1,\"memo\":\"[Webhook 테스트]\",\"created_by\":\"홍혜기\",\"created_at\":\"2026-07-16T07:00:00.000Z\",\"deleted_at\":null,\"photo_url\":null}}" \
    | (command -v jq >/dev/null && jq . || cat)
  echo ""
  echo "Slack 채널에 [Webhook 테스트] 메시지 확인 후,"
  echo "Supabase Webhook 로그(실패 시 401/timeout)도 Dashboard에서 확인하세요."
else
  echo "CRON_SECRET 이 .env.local 에 없습니다."
fi
