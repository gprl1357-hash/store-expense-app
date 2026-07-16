#!/usr/bin/env bash
# GitHub push (자동 인증 — setup-git-auth.sh 1회 설정 후)
# 수동 PAT 입력: ./scripts/push-with-token.sh --interactive
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ "${1:-}" == "--interactive" ]]; then
  REPO="gprl1357-hash/store-expense-app"
  echo "======================================"
  echo "  GitHub PAT 수동 입력 push"
  echo "======================================"
  echo ""
  echo "PAT 발급: https://github.com/settings/tokens/new (repo 권한)"
  echo ""
  read -r -s -p "토큰 (ghp_...): " TOKEN
  echo ""
  if [[ -z "$TOKEN" ]]; then exit 1; fi
  git push "https://${TOKEN}@github.com/${REPO}.git" main
  echo "✓ 완료"
  echo "  자동화 설정: ./scripts/setup-git-auth.sh"
  exit 0
fi

exec "$(dirname "$0")/git-push.sh" main
