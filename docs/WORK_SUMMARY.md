# 매장 지출 관리 앱 — 작업 정리

> **프로젝트:** `store-expense-app`  
> **매장:** 제주은희네해장국광명GIDC  
> **작성자:** 홍혜기, 홍성미, 손선애  
> **현재 버전:** v1.3.1  
> **최종 갱신:** 2026-07-16 17:51 KST

---

## 1. 프로젝트 개요

3명이 모바일로 함께 쓰는 **매장 지출 관리 PWA**입니다. 60대 사용자를 포함해 누구나 쉽게 입력·조회할 수 있도록 큰 글씨·큰 버튼 UI를 적용했습니다.

| 항목 | 내용 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) |
| 스타일 | Tailwind CSS 4 |
| 백엔드 | Supabase (PostgreSQL + Realtime + Storage) |
| 알림·백업 | Slack Bot + Supabase Webhook + Vercel Cron |
| 배포 | GitHub `main` → Vercel Production 자동 배포 |
| 운영 URL | https://store-expense-app.vercel.app |
| 월 예산 | 1,000만 원 (`NEXT_PUBLIC_MONTHLY_BUDGET`) |

---

## 2. 구현된 기능

### 입력 탭
- 날짜 선택 (오늘·어제·달력)
- 작성자 선택 (홍혜기 / 홍성미 / 손선애)
- 카테고리 카드 (식자재, 공과금, 인건비, 기타)
- 금액 직접 입력 + 단축 버튼 (+1천 ~ +100만)
- 메모 (선택)
- **사진 첨부** (선택, 카메라/갤러리)
- 월 예산 신호등 게이지 (초록/노랑/빨강)
- 등록 후 자동으로 조회 탭 이동
- **Slack 지출 등록 알림** (Supabase Webhook, 실패해도 등록 유지)

### 조회 탭
- 연 / 월 / 일 달력·기간 탐색
- 작성자·카테고리 필터, 검색
- 카테고리별 합계 (클릭 필터)
- 도넛·막대 그래프 (recharts)
- 지출 목록 → 수정·삭제(휴지통)
- **첨부 사진** 목록 아이콘 + 상세 모달에서 확대 보기
- **엑셀 저장** (지출내역 / 카테고리합계 / 그래프 시트)
- **인쇄** (HTML 팝업)
- **복원** (휴지통, 90일 이내 soft delete)

### 운영·백업 (v1.3.0+)
- **지출 등록 Slack 알림** — DB INSERT → Webhook → Slack (KST 24시간 시각)
- **일일 백업** — 매일 23:00 KST, 전체 지출 JSON
  - Supabase Storage: `expense-backups/daily/YYYY-MM-DD/expenses.json`
  - Slack 채널: JSON 파일 + 일/월 요약 메시지
- **복원 스크립트** — `npm run backup:restore -- <파일.json> [--dry-run]`

### 공통
- Supabase Realtime 동기화
- PWA manifest (홈 화면 추가 가능)
- 사용자 필터 (전체 / 개인별)

---

## 3. Slack · 백업 아키텍처 (v1.3.1)

```
┌─────────────────────────────────────────────────────────────────┐
│  [권장] Supabase Database Webhook — expenses INSERT              │
│       POST /api/slack/webhook  (x-cron-secret: CRON_SECRET)      │
│              │ await notifyExpenseData()                         │
│              ▼                                                   │
│       Slack [지출 등록] YYYY-MM-DD HH:mm:ss · 카테고리 · 금액      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  [백업] 앱 insertExpense → POST /api/slack/notify-expense        │
│         (Webhook 설정 후 SLACK_CLIENT_NOTIFY=false 로 중복 방지)  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Vercel Cron — 매일 23:00 KST (0 14 * * * UTC)                   │
│  GET /api/backup/daily  (Authorization: Bearer CRON_SECRET)      │
│       ├─► Supabase expenses 전체 조회 (읽기 전용)                  │
│       ├─► Storage expense-backups/daily/YYYY-MM-DD/expenses.json │
│       └─► Slack JSON 파일 + 요약 메시지                            │
└─────────────────────────────────────────────────────────────────┘
```

| 구분 | 파일 |
|------|------|
| Webhook 알림 (주) | `src/app/api/slack/webhook/route.ts` |
| 클라이언트 백업 알림 | `src/app/api/slack/notify-expense/route.ts` |
| Webhook 인증 | `src/lib/slack/webhook-auth.ts` |
| 메시지 포맷 | `src/lib/slack/messages.ts` |
| 일일 백업 API | `src/app/api/backup/daily/route.ts` |
| Slack 클라이언트 | `src/lib/slack/client.ts`, `config.ts` |
| 백업 JSON | `src/lib/backup/export.ts` |
| Supabase 서버 | `src/lib/supabase/admin.ts` |
| Cron 스케줄 | `vercel.json` |
| Webhook 설정 스크립트 | `scripts/setup-supabase-slack-webhook.sh` |

운영 설정: [SLACK_SETUP.md](SLACK_SETUP.md)

---

## 4. 데이터베이스

### `expenses` 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| date | DATE | 지출일 |
| category | TEXT | 식자재/공과금/인건비/기타 |
| amount | NUMERIC | 금액 (원) |
| memo | TEXT | 메모 |
| created_by | TEXT | 작성자 |
| created_at | TIMESTAMPTZ | 등록 시각 |
| deleted_at | TIMESTAMPTZ | soft delete (휴지통) |
| photo_url | TEXT | 첨부 사진 URL |

### 마이그레이션

| 파일 | 내용 | 상태 |
|------|------|------|
| `001_update_users.sql` | 작성자 이름 변경 | 적용됨 |
| `002_soft_delete.sql` | `deleted_at` 컬럼 | 적용됨 |
| `003_expense_photos.sql` | `photo_url` + `expense-photos` 버킷 | 적용됨 |
| `004_expense_backups.sql` | `expense-backups` 버킷 (일일 JSON) | 적용됨 |
| `005_slack_webhook_trigger.sql` | pg_net Webhook 대안 (선택) | 참고용 |

### Storage

| 버킷 | 용도 | 접근 |
|------|------|------|
| `expense-photos` | 영수증·사진 (5MB) | public |
| `expense-backups` | 일일 백업 JSON (10MB) | private (service role) |

---

## 5. 주요 파일 구조

```
src/
├── app/
│   ├── page.tsx                    # 메인 (탭·CRUD·Slack 백업 호출)
│   ├── layout.tsx
│   ├── globals.css
│   ├── actions/slack.ts            # (레거시) Server Action
│   └── api/
│       ├── backup/daily/route.ts   # 일일 백업 (Cron)
│       └── slack/
│           ├── webhook/route.ts    # Supabase INSERT Webhook (주)
│           └── notify-expense/route.ts
├── components/
│   ├── ExpenseForm.tsx
│   ├── ExpenseList.tsx
│   ├── ExpenseModal.tsx
│   ├── AnalyticsCalendar.tsx
│   ├── BudgetGauge.tsx
│   ├── ExpenseCharts.tsx
│   ├── ExportButtons.tsx
│   ├── TrashModal.tsx
│   └── TabNav.tsx
└── lib/
    ├── constants.ts                # formatDateTime24KST 등
    ├── exportExcel.ts
    ├── chartData.ts
    ├── filterExpenses.ts
    ├── backup/export.ts
    ├── slack/
    │   ├── client.ts
    │   ├── config.ts
    │   ├── messages.ts
    │   ├── notify-expense.ts
    │   ├── trigger-notify.ts
    │   └── webhook-auth.ts
    └── supabase/
        ├── client.ts
        ├── admin.ts
        ├── expenses.ts
        ├── storage.ts
        └── types.ts
supabase/
├── schema.sql
└── migrations/                     # 001 ~ 005
scripts/
├── release.sh
├── git-push.sh
├── sync-vercel-slack-env.sh
├── setup-supabase-slack-webhook.sh
├── test-slack-notify.sh
├── test-daily-backup.sh
└── restore-from-backup.mjs
```

---

## 6. 환경 변수

### 클라이언트 (`NEXT_PUBLIC_*`)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_MONTHLY_BUDGET=10000000
```

### 서버 전용 (Git·공개 금지)

```
SLACK_ENABLED=true
SLACK_BOT_TOKEN=xoxb-...
SLACK_NOTIFY_CHANNEL_ID=C...
SLACK_BACKUP_CHANNEL_ID=C...
CRON_SECRET=...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SLACK_CLIENT_NOTIFY=false          # Webhook 설정 후 중복 알림 방지 (선택)
```

Vercel Production 일괄 등록: `npm run vercel:env:slack`

---

## 7. npm 스크립트 · 운영 명령

| 명령 | 설명 |
|------|------|
| `npm run dev` | 로컬 개발 서버 |
| `npm run build` | Production 빌드 |
| `npm run release -- "메시지"` | 커밋 + push → Vercel 배포 |
| `npm run slack:webhook:setup` | Supabase Webhook 설정 안내 + Production 테스트 |
| `npm run slack:test` | Slack 메시지 연결 테스트 |
| `npm run backup:test` | 로컬 일일 백업 API 테스트 |
| `npm run backup:restore -- <파일> [--dry-run]` | 백업 JSON 복원 |
| `npm run vercel:env:slack` | Slack env → Vercel Production |

---

## 8. 버전별 주요 변경

| 버전 | 날짜 | 내용 |
|------|------|------|
| **v1.3.1** | 2026-07-16 | Supabase Webhook Slack 알림 안정화, KST 24시간 시각, x-cron-secret |
| **v1.3.0** | 2026-07-16 | Slack 지출 알림, 일일 백업, Vercel Cron, 복원 스크립트 |
| v1.2.0 | 2026-07-16 | 운영 관리 문서, CI build, Slack 백업 제안 |
| v1.1.1 | 2026-07-16 | 날짜 선택, LAN 개발, Git push 자동화 |
| v1.1.0 | 2026-07-16 | 사진 첨부, soft delete·복원, 엑셀 개선 |

상세: [CHANGELOG.md](../CHANGELOG.md)

---

## 9. 해결한 이슈

| 이슈 | 해결 |
|------|------|
| Production Slack 알림 미수신 | Supabase Database Webhook + `await` 전송 |
| Webhook 200이지만 Slack 없음 | `after()` 제거, `slackSent` 응답으로 확인 |
| Bearer 헤더 입력 실수 | `x-cron-secret` 헤더 지원 |
| Server Action / fetch 취소 | Webhook으로 DB INSERT 트리거 |
| PWA 구버전 JS 캐시 | Cache-Control no-store, Webhook으로 클라이언트 무관화 |
| 엑셀 `lab()` 색상 오류 | SVG 직접 캡처, 그래프 실패 시에도 시트 1·2 저장 |
| LAN(192.168.x.x) 로딩 무한 | `allowedDevOrigins` + SSH 443 |
| GitHub push 인증 | SSH / PAT 자동화 스크립트 |
| Slack 파일 업로드 `invalid_arguments` | `files.getUploadURLExternal` form-urlencoded 전송 |
| 복원 버튼 위치 | 입력 탭 제거, 조회 탭만 표시 |

---

## 10. 60대+ UX (2026-07-16)

| 영역 | 변경 |
|------|------|
| 전역 | 본문 20px, 줄간격 1.6, 포커스 링 강화 |
| 확대 | 핀치 줌 허용 |
| 하단 탭 | `지출 입력` / `내역 조회`, 높이 80px |
| 버튼 | 최소 높이 72px, ring-2 테두리 |
| 예산 게이지 | 금액 4xl, 진행바 두께 증가 |

---

## 11. 문서 목록

| 문서 | 용도 |
|------|------|
| [README.md](../README.md) | 프로젝트 진입·빠른 참조 |
| [WORK_SUMMARY.md](WORK_SUMMARY.md) | 이 문서 — 기능·구조 종합 |
| [SLACK_SETUP.md](SLACK_SETUP.md) | Slack·Webhook·백업 설정·테스트 |
| [OPS_MANAGEMENT.md](OPS_MANAGEMENT.md) | 운영·배포·롤백 정책 |
| [CONTRIBUTING.md](CONTRIBUTING.md) | feature 브랜치·PR 절차 |
| [DEPLOY.md](../DEPLOY.md) | GitHub·Vercel 배포 가이드 |
| [사용가이드.md](사용가이드.md) | 어르신용 앱 사용법 |
| [CHANGELOG.md](../CHANGELOG.md) | 버전별 변경 이력 |
| [SLACK_BACKUP_PROPOSAL.md](SLACK_BACKUP_PROPOSAL.md) | 초기 설계 제안 (참고) |

---

## 12. 향후 선택 과제

- 주간 엑셀 파일 Slack 업로드 (제안 2단계 확장)
- PWA Service Worker·오프라인 캐시
- Supabase Auth (사용자별 권한)
- `CRON_SECRET` 강화 (`openssl rand -hex 32`)
- Supabase Point-in-Time Recovery (재해 복구)

---

*작성·갱신: 2026-07-16 · store-expense-app v1.3.1*
