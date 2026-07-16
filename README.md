# 매장 지출 관리 웹앱

60대 이상 어르신을 포함한 3명이 모바일에서 함께 사용하는 매장 지출 관리 PWA입니다.

| 항목 | 링크 |
|------|------|
| **운영 URL** | https://store-expense-app.vercel.app |
| **어르신 사용 가이드** | [docs/사용가이드.md](docs/사용가이드.md) |
| **작업·기능 정리** | [docs/WORK_SUMMARY.md](docs/WORK_SUMMARY.md) |
| **변경 이력** | [CHANGELOG.md](CHANGELOG.md) (현재 **v1.3.1**) |
| **운영 관리** | [docs/OPS_MANAGEMENT.md](docs/OPS_MANAGEMENT.md) |
| **기여·배포** | [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) |
| **Slack·백업** | [docs/SLACK_SETUP.md](docs/SLACK_SETUP.md) |

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | Next.js 16 (App Router), Tailwind CSS 4, lucide-react, recharts |
| Backend/DB | Supabase (PostgreSQL + Realtime + Storage) |
| 알림·백업 | Slack Bot API, Supabase Webhook, Vercel Cron |
| 배포 | GitHub → Vercel (Production 자동 배포) |
| CI | GitHub Actions (`npm run build` 검증) |

---

## 로컬 개발

```bash
npm install
cp .env.local.example .env.local   # Supabase + (선택) Slack 변수 입력
npm run dev                        # http://localhost:3000
```

### 주요 npm 스크립트

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 (LAN 접속: `0.0.0.0`) |
| `npm run build` | Production 빌드 (배포·CI 전 필수) |
| `npm run release -- "메시지"` | 커밋 + GitHub push → Vercel 자동 배포 |
| `npm run slack:test` | Slack 연결·메시지 전송 테스트 |
| `npm run backup:test` | 일일 백업 API 로컬 테스트 |
| `npm run backup:restore -- <파일.json> [--dry-run]` | 백업 JSON 복원 |
| `npm run slack:webhook:setup` | Supabase Webhook 설정 안내 + Production 테스트 |
| `npm run vercel:env:slack` | `.env.local` Slack 변수 → Vercel Production 동기화 |

---

## 환경 변수

### 클라이언트 (Vercel + `.env.local`)

| 변수 | 설명 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key |
| `NEXT_PUBLIC_MONTHLY_BUDGET` | 월 예산 (원, 기본 10,000,000) |

### 서버 전용 (`NEXT_PUBLIC_` 금지 · Git 커밋 금지)

| 변수 | 설명 |
|------|------|
| `SLACK_ENABLED` | `false`면 Slack 전송 비활성 |
| `SLACK_BOT_TOKEN` | Slack Bot OAuth Token (`xoxb-...`) |
| `SLACK_NOTIFY_CHANNEL_ID` | 지출 등록 알림 채널 |
| `SLACK_BACKUP_CHANNEL_ID` | 일일 백업 파일·요약 채널 |
| `CRON_SECRET` | Webhook·백업 API 인증 |
| `SUPABASE_SERVICE_ROLE_KEY` | Storage 백업 저장·복원 |
| `SLACK_CLIENT_NOTIFY` | `false`면 클라이언트 백업 알림 끔 (Webhook 설정 후) |

상세 설정: [docs/SLACK_SETUP.md](docs/SLACK_SETUP.md) · 일괄 등록: `npm run vercel:env:slack`

---

## Supabase 설정

1. [Supabase Dashboard](https://supabase.com/dashboard) → SQL Editor
2. `supabase/schema.sql` (최초) 또는 `supabase/migrations/00X_*.sql` 순서대로 실행
3. **Database → Replication** 에서 `expenses` Realtime 활성화
4. **Database → Webhooks** — 지출 등록 Slack 알림 (1회, [SLACK_SETUP.md](docs/SLACK_SETUP.md))

| 마이그레이션 | 내용 |
|-------------|------|
| `001_update_users.sql` | 작성자 이름 |
| `002_soft_delete.sql` | `deleted_at` (휴지통) |
| `003_expense_photos.sql` | `photo_url` + `expense-photos` 버킷 |
| `004_expense_backups.sql` | `expense-backups` 버킷 (일일 JSON 백업) |
| `005_slack_webhook_trigger.sql` | pg_net Webhook 대안 (선택) |

---

## Slack · 일일 백업 (v1.3.1)

| 기능 | 동작 |
|------|------|
| **지출 등록 알림** | Supabase Webhook → Slack `[지출 등록]` (KST `YYYY-MM-DD HH:mm:ss`) |
| **일일 백업** | 매일 23:00 KST — 전체 지출 JSON → Supabase Storage + Slack 파일 |
| **복원** | Slack에서 JSON 다운로드 → `npm run backup:restore` |

```
expenses INSERT → Supabase Webhook → POST /api/slack/webhook → Slack
Vercel Cron (23:00) → GET /api/backup/daily → Supabase 조회 → Storage + Slack
```

Webhook 1회 설정: `npm run slack:webhook:setup` · 상세: [docs/SLACK_SETUP.md](docs/SLACK_SETUP.md)

---

## Git · 배포

```bash
git status
npm run build                              # 배포 전 확인
npm run release -- "변경 설명"              # 커밋 + push → Vercel 자동 배포
```

| 브랜치 | 용도 |
|--------|------|
| `main` | Production (https://store-expense-app.vercel.app) |
| `feature/*` | 기능 개발 → PR → Preview 확인 후 merge |

자세한 절차: [DEPLOY.md](DEPLOY.md) · [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)

### Vercel 환경변수 (Production)

기본 3개(Supabase·예산) + Slack·백업 6개.  
일괄 등록: `npm run vercel:env:slack` (`.env.local` 기준)

Cron 스케줄 (`vercel.json`): `0 14 * * *` UTC = **매일 23:00 KST**

---

## 프로젝트 구조

```
src/
├── app/
│   ├── page.tsx
│   ├── actions/slack.ts
│   └── api/
│       ├── backup/daily/           # 일일 백업 (Cron)
│       └── slack/
│           ├── webhook/            # Supabase INSERT Webhook (주)
│           └── notify-expense/     # 클라이언트 백업
├── components/
└── lib/
    ├── constants.ts                # formatDateTime24KST 등
    ├── backup/export.ts
    ├── slack/                      # client, messages, webhook-auth
    └── supabase/
supabase/migrations/                # 001 ~ 005
scripts/
├── setup-supabase-slack-webhook.sh
├── sync-vercel-slack-env.sh
└── restore-from-backup.mjs
docs/
├── WORK_SUMMARY.md
├── SLACK_SETUP.md
└── 사용가이드.md
```

---

## CI (GitHub Actions)

`main` push 및 PR 시 `.github/workflows/build.yml`로 `npm run build` 검증.  
배포는 Vercel이 담당합니다.

---

## 저장소

- GitHub: https://github.com/gprl1357-hash/store-expense-app
- Production: https://store-expense-app.vercel.app
