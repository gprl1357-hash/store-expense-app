#!/usr/bin/env bash
# GitHub 원격 저장소 연결 및 push
# 사용법: ./scripts/setup-github.sh <GITHUB_USERNAME>
set -euo pipefail

USERNAME="${1:-gprl1357-hash}"
REPO_NAME="store-expense-app"

if [[ -z "$USERNAME" ]]; then
  echo "사용법: ./scripts/setup-github.sh <GITHUB_USERNAME>"
  echo "예:     ./scripts/setup-github.sh hyekihong"
  exit 1
fi

REMOTE_URL="https://github.com/${USERNAME}/${REPO_NAME}.git"

echo "→ GitHub에서 '${REPO_NAME}' 저장소를 먼저 생성해 주세요."
echo "  https://github.com/new"
echo ""
read -r -p "저장소 생성 완료 후 Enter를 누르세요..."

if git remote get-url origin &>/dev/null; then
  git remote set-url origin "$REMOTE_URL"
else
  git remote add origin "$REMOTE_URL"
fi

git push -u origin main
echo "✓ push 완료: $REMOTE_URL"
