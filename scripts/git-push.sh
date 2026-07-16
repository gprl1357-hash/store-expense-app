#!/usr/bin/env bash
# GitHub push — SSH / Keychain / .env.local GITHUB_TOKEN 순으로 시도
# 사용법: ./scripts/git-push.sh [branch]
set -euo pipefail

cd "$(dirname "$0")/.."

REPO="gprl1357-hash/store-expense-app"
BRANCH="${1:-main}"

push_with_token() {
  local token="$1"
  git push "https://${token}@github.com/${REPO}.git" "$BRANCH"
}

load_token_from_env_local() {
  if [[ ! -f .env.local ]]; then
    return 1
  fi
  local line
  line=$(grep -E '^GITHUB_TOKEN=' .env.local 2>/dev/null | tail -1 || true)
  if [[ -z "$line" ]]; then
    return 1
  fi
  echo "${line#GITHUB_TOKEN=}" | tr -d '"' | tr -d "'"
}

echo "→ GitHub push (${BRANCH})..."

# 1) SSH 또는 macOS Keychain (일반 git push)
if git push origin "$BRANCH" 2>/dev/null; then
  echo "✓ push 완료 (SSH/Keychain)"
  exit 0
fi

# 2) 환경변수 GITHUB_TOKEN
if [[ -n "${GITHUB_TOKEN:-}" ]]; then
  push_with_token "$GITHUB_TOKEN"
  echo "✓ push 완료 (GITHUB_TOKEN)"
  exit 0
fi

# 3) .env.local 의 GITHUB_TOKEN
TOKEN="$(load_token_from_env_local || true)"
if [[ -n "${TOKEN:-}" ]]; then
  push_with_token "$TOKEN"
  echo "✓ push 완료 (.env.local GITHUB_TOKEN)"
  exit 0
fi

echo ""
echo "✗ GitHub 인증 정보가 없습니다."
echo "  한 번만 설정: ./scripts/setup-git-auth.sh"
exit 1
