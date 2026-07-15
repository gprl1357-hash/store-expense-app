# 매장 지출 관리 웹앱

60대 이상 어르신을 포함한 3명이 모바일에서 함께 사용하는 매장 지출 관리 PWA입니다.

## 기술 스택

- **Frontend:** Next.js (App Router), Tailwind CSS, lucide-react
- **Backend/DB:** Supabase (PostgreSQL + Realtime)
- **배포:** Vercel

## 로컬 개발

```bash
# 의존성 설치
npm install

# 환경변수 설정
cp .env.local.example .env.local
# .env.local 에 Supabase URL / anon key 입력

# 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

## Supabase 설정

1. [Supabase Dashboard](https://supabase.com/dashboard) → SQL Editor
2. `supabase/schema.sql` 파일 내용 전체 실행
3. **Database → Replication** 에서 `expenses` 테이블 Realtime 활성화 확인

## Git 형상관리

```bash
# 상태 확인
git status

# 변경사항 커밋
git add .
git commit -m "변경 내용 설명"

# 원격 저장소에 push
git push origin main
```

### 브랜치 전략

| 브랜치 | 용도 |
|--------|------|
| `main` | 프로덕션 (Vercel 자동 배포) |
| `feature/*` | 기능 개발 |

## Vercel 배포

### 1. GitHub 저장소 연결

1. GitHub에 `store-expense-app` 저장소 생성
2. 로컬에서 원격 연결 후 push:

```bash
git remote add origin https://github.com/<YOUR_USERNAME>/store-expense-app.git
# 예: git remote add origin https://github.com/gprl1357-hash/store-expense-app.git
git push -u origin main
```

### 2. Vercel 프로젝트 생성

1. [vercel.com/new](https://vercel.com/new) 접속
2. GitHub 저장소 `store-expense-app` Import
3. Framework Preset: **Next.js** (자동 감지)

### 3. 환경변수 설정 (Vercel Dashboard → Settings → Environment Variables)

| 변수명 | 값 | 환경 |
|--------|-----|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://mklmpbtozqteofgeksrc.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public key | Production, Preview, Development |
| `NEXT_PUBLIC_MONTHLY_BUDGET` | `3000000` | Production, Preview, Development |

> ⚠️ `.env.local` 은 Git에 포함되지 않습니다. Vercel에 반드시 별도 등록하세요.

### 4. 배포

- `main` 브랜치 push 시 **Production** 자동 배포
- PR 생성 시 **Preview** URL 자동 생성

### CLI로 배포 (선택)

```bash
npx vercel login
npx vercel link
npx vercel env pull .env.local   # Vercel 환경변수 로컬 동기화
npx vercel --prod                # 프로덕션 배포
```

## CI (GitHub Actions)

`main` 브랜치 push 및 PR 시 자동으로 lint + build 검증합니다.
(`.github/workflows/ci.yml`)

## 프로젝트 구조

```
src/
├── app/              # Next.js App Router
├── components/       # UI 컴포넌트
└── lib/
    ├── constants.ts
    └── supabase/     # Supabase 클라이언트 & CRUD
supabase/
└── schema.sql        # DB 스키마
```
