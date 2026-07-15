#!/usr/bin/env bash
# Vercel CLI 배포 (npx 사용, 전역 설치 불필요)
set -euo pipefail

cd "$(dirname "$0")/.."

echo "=== Vercel 배포 ==="
echo ""
echo "1. Vercel 로그인 (최초 1회)"
echo "   npx vercel login"
echo ""
echo "2. 프로젝트 연결 (최초 1회)"
echo "   npx vercel link"
echo ""
echo "3. 환경변수 등록 (Vercel Dashboard 또는 CLI)"
echo "   NEXT_PUBLIC_SUPABASE_URL"
echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "   NEXT_PUBLIC_MONTHLY_BUDGET"
echo ""
echo "4. 프로덕션 배포"
echo "   npx vercel --prod"
echo ""

if [[ "${1:-}" == "--prod" ]]; then
  npx vercel --prod
elif [[ "${1:-}" == "--preview" ]]; then
  npx vercel
else
  read -r -p "프로덕션 배포를 실행할까요? (y/N): " confirm
  if [[ "$confirm" =~ ^[Yy]$ ]]; then
    npx vercel --prod
  else
    echo "취소됨. Preview 배포: npx vercel"
  fi
fi
