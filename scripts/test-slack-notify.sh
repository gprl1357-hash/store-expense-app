#!/usr/bin/env bash
# Slack 연결·메시지 전송 테스트 (지출 등록 알림과 동일 API)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f .env.local ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
fi

if [[ -z "${SLACK_BOT_TOKEN:-}" || -z "${SLACK_NOTIFY_CHANNEL_ID:-}" ]]; then
  echo "SLACK_BOT_TOKEN, SLACK_NOTIFY_CHANNEL_ID 가 .env.local 에 필요합니다."
  exit 1
fi

echo "→ Slack chat.postMessage 테스트"
curl -sS -X POST https://slack.com/api/chat.postMessage \
  -H "Authorization: Bearer ${SLACK_BOT_TOKEN}" \
  -H "Content-Type: application/json; charset=utf-8" \
  --data "{\"channel\":\"${SLACK_NOTIFY_CHANNEL_ID}\",\"text\":\"*[테스트]* Slack 알림 연결 확인 ✓\\n_은희네 지출관리 개발 환경_\"}" \
  | (command -v jq >/dev/null && jq . || cat)
