#!/usr/bin/env bash
# Homebrew / gh CLI 없이 GitHub Personal Access Token으로 push
# 사용법: ./scripts/push-with-token.sh
set -euo pipefail

cd "$(dirname "$0")/.."
REPO="gprl1357-hash/store-expense-app"

echo "======================================"
echo "  GitHub PAT로 push (gh/brew 불필요)"
echo "======================================"
echo ""
echo "1. 브라우저에서 PAT 발급:"
echo "   https://github.com/settings/tokens/new"
echo ""
echo "   설정:"
echo "   - Note: store-expense-app"
echo "   - Expiration: 90 days (또는 원하는 기간)"
echo "   - 권한: repo (전체 체크)"
echo ""
echo "2. Generate token → 토큰 복사 (ghp_ 로 시작)"
echo ""
read -r -s -p "3. 토큰을 붙여넣고 Enter: " TOKEN
echo ""

if [[ -z "$TOKEN" ]]; then
  echo "토큰이 비어 있습니다."
  exit 1
fi

if git remote get-url origin &>/dev/null; then
  git remote set-url origin "https://github.com/${REPO}.git"
else
  git remote add origin "https://github.com/${REPO}.git"
fi

echo ""
echo "→ GitHub push 중..."
git push "https://${TOKEN}@github.com/${REPO}.git" main

# 원격 URL에서 토큰 제거 (보안)
git remote set-url origin "https://github.com/${REPO}.git"

echo ""
echo "✓ GitHub 업로드 완료!"
echo "  https://github.com/${REPO}"
echo ""
echo "→ Vercel 배포는 웹에서 진행하세요:"
echo "  https://vercel.com/new"
echo "  → gprl1357-hash/store-expense-app Import → Deploy"
