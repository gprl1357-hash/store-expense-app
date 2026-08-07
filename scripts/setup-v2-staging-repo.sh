#!/usr/bin/env bash
# v2 스테이징용 별도 저장소 로컬 생성 (운영 repo는 변경하지 않음)
# 사용법: bash scripts/setup-v2-staging-repo.sh [대상경로]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="${1:-$(dirname "$ROOT")/store-expense-app-v2}"
GITHUB_REPO="gprl1357-hash/store-expense-app-v2"

if [[ -e "$TARGET" ]]; then
  echo "✗ 대상 폴더가 이미 있습니다: $TARGET"
  echo "  다른 경로: bash scripts/setup-v2-staging-repo.sh /path/to/store-expense-app-v2"
  exit 1
fi

echo "=============================================="
echo " v2 스테이징 저장소 로컬 생성"
echo "=============================================="
echo "  원본: $ROOT"
echo "  대상: $TARGET"
echo "  GitHub (예정): $GITHUB_REPO"
echo ""

mkdir -p "$TARGET"

rsync -a \
  --exclude node_modules \
  --exclude .next \
  --exclude .vercel \
  --exclude .env.local \
  --exclude .env.production.local \
  --exclude .git \
  "$ROOT/" "$TARGET/"

cd "$TARGET"

# package.json — v2 식별
node -e "
const fs = require('fs');
const p = JSON.parse(fs.readFileSync('package.json', 'utf8'));
p.name = 'store-expense-app-v2';
p.version = '2.0.0-dev';
fs.writeFileSync('package.json', JSON.stringify(p, null, 2) + '\n');
"

# vercel.json — Cron 제거 (스테이징이 운영 백업 호출 방지)
node -e "
const fs = require('fs');
const v = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
delete v.crons;
fs.writeFileSync('vercel.json', JSON.stringify(v, null, 2) + '\n');
"

# README 상단 스테이징 배너
STAGING_BANNER='> **⚠️ v2 스테이징** — 인증 개발용. 운영: [store-expense-app](https://github.com/gprl1357-hash/store-expense-app) · https://store-expense-app.vercel.app

'
if ! head -1 README.md | grep -q 'v2 스테이징'; then
  echo -n "$STAGING_BANNER" | cat - README.md > README.md.tmp && mv README.md.tmp README.md
fi

git init -b main
git add -A
git commit -m "$(cat <<'EOF'
chore: v2 스테이징 저장소 초기화 (v1.3.1 기반)

운영과 분리된 인증(v2) 개발용.
- vercel.json Cron 제거
- package store-expense-app-v2 @ 2.0.0-dev
EOF
)"

git remote add origin "git@github.com:${GITHUB_REPO}.git"

echo ""
echo "✓ 로컬 v2 저장소 생성 완료: $TARGET"
echo ""
echo "다음 단계:"
echo "  1) GitHub → New repository → 이름: store-expense-app-v2 (Private, README 없음)"
echo "  2) cd $TARGET && git push -u origin main"
echo "  3) Supabase dev 프로젝트 생성 → .env.local (.env.staging.example 참고)"
echo "  4) Vercel → Import store-expense-app-v2 → env 설정 → Deploy"
echo ""
echo "상세: docs/V2_STAGING_SETUP.md"
