#!/usr/bin/env bash
# 최초 1회: GitHub 인증 → push → Vercel 로그인 → 프로덕션 배포
set -euo pipefail

cd "$(dirname "$0")/.."
REPO="https://github.com/gprl1357-hash/store-expense-app.git"

echo "======================================"
echo "  매장 지출 관리 — Git push + Vercel 배포"
echo "======================================"
echo ""

# ── 1. GitHub CLI 확인 ──
if ! command -v gh &>/dev/null; then
  echo "GitHub CLI(gh)가 필요합니다."
  echo "  brew install gh"
  echo "설치 후 이 스크립트를 다시 실행하세요."
  exit 1
fi

# ── 2. GitHub 인증 ──
if ! gh auth status &>/dev/null; then
  echo "→ GitHub 로그인 (브라우저에서 Google SSO 선택)"
  gh auth login --hostname github.com --git-protocol https --web
fi
gh auth setup-git

# ── 3. 원격 저장소 ──
if git remote get-url origin &>/dev/null; then
  git remote set-url origin "$REPO"
else
  git remote add origin "$REPO"
fi

# ── 4. push ──
echo ""
echo "→ GitHub push 중..."
git push -u origin main
echo "✓ GitHub 업로드 완료: $REPO"

# ── 5. Vercel 배포 ──
echo ""
echo "→ Vercel 배포 중..."
echo "  (최초 실행 시 브라우저에서 Vercel 로그인 + GitHub 연동)"
echo ""

# 환경변수를 Vercel에 등록 (.env.local 기준)
if [[ -f .env.local ]]; then
  echo "→ Vercel 환경변수 등록..."
  while IFS='=' read -r key value; do
    [[ -z "$key" || "$key" =~ ^# ]] && continue
    value="${value%$'\r'}"
    printf '%s' "$value" | npx vercel env add "$key" production preview development --force 2>/dev/null || true
  done < .env.local
fi

npx vercel link --yes 2>/dev/null || npx vercel link
npx vercel --prod

echo ""
echo "======================================"
echo "  ✓ 배포 완료!"
echo "  이후 변경 시: npm run release -- \"메시지\""
echo "======================================"
