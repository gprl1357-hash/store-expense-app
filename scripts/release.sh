#!/usr/bin/env bash
# 변경사항 커밋 + GitHub push → Vercel 자동 배포 트리거
# 사용법: ./scripts/release.sh "커밋 메시지"
set -euo pipefail

cd "$(dirname "$0")/.."

MSG="${1:-update}"

if [[ -z "$(git status --porcelain)" ]]; then
  echo "변경된 파일이 없습니다."
  exit 0
fi

echo "→ 변경사항 커밋 중..."
git add -A
git commit -m "$MSG"

echo "→ GitHub push 중..."
"$(dirname "$0")/git-push.sh" main

echo ""
echo "✓ 완료! GitHub 업로드됨."
echo "  Vercel이 연결되어 있다면 1~2분 내 자동 배포됩니다."
echo "  확인: https://vercel.com/dashboard"
