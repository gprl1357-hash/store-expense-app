# Slack 알림 · 일일 백업 설정 (개발·운영)

개발 환경에서 Slack 알림과 일일 백업을 테스트하기 위한 설정 가이드입니다.

---

## 1. Slack 앱 만들기 (1회)

1. https://api.slack.com/apps → **Create New App** → **From scratch**
2. **OAuth & Permissions** → Bot Token Scopes 추가:
   - `chat:write` — 지출 등록 알림
   - `files:write` — 일일 백업 JSON 파일 업로드
3. **Install to Workspace** → **Bot User OAuth Token** (`xoxb-...`) 복사
4. Slack에서 `#매장-지출-백업` (또는 원하는) **비공개 채널** 생성
5. 채널에 앱 초대: `/invite @앱이름`
6. 채널 ID 확인: 채널 우클릭 → **채널 세부정보** → 하단 ID (`C...`)

---

## 2. Supabase Storage (백업 보관)

Supabase Dashboard → **SQL Editor**에서 실행:

```sql
-- supabase/migrations/004_expense_backups.sql 내용
```

`expense-backups` 버킷에 일별 JSON이 저장됩니다.  
경로 예: `daily/2026-07-16/expenses.json`

> **운영 DB:** 마이그레이션은 **읽기·추가(백업 저장)만** 수행합니다. 기존 지출 데이터는 변경하지 않습니다.

---

## 3. `.env.local` 설정

```bash
# Slack (서버 전용 — NEXT_PUBLIC 금지)
SLACK_ENABLED=true
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_NOTIFY_CHANNEL_ID=C0123456789
SLACK_BACKUP_CHANNEL_ID=C0123456789

# 일일 백업 Cron 인증 (랜덤 긴 문자열)
CRON_SECRET=your-random-secret-string

# 백업 API·복원 스크립트용 (Dashboard > API > service_role)
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

| 변수 | 용도 |
|------|------|
| `SLACK_BOT_TOKEN` | Slack API 호출 |
| `SLACK_NOTIFY_CHANNEL_ID` | 지출 등록 시 알림 |
| `SLACK_BACKUP_CHANNEL_ID` | 매일 23:00 백업 파일·요약 |
| `CRON_SECRET` | `/api/backup/daily` 인증 |
| `SUPABASE_SERVICE_ROLE_KEY` | Storage 백업 저장·복원 |

`SLACK_ENABLED=false` 이면 알림·백업 Slack 전송을 끕니다 (로컬 개발 시 유용).

---

## 4. 개발 환경 테스트

### 4-1. 지출 등록 알림

```bash
npm run dev
```

1. `.env.local`에 Slack 변수 설정
2. 앱에서 지출 1건 등록
3. Slack 채널에 `[지출 등록]` 메시지 확인

알림 실패해도 **지출 등록은 정상** 동작합니다 (비동기·오류 무시).

### 4-2. 일일 백업 (수동)

개발 서버 실행 중:

```bash
chmod +x scripts/test-daily-backup.sh
npm run backup:test
```

또는:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/backup/daily
```

성공 시:
- Slack 채널에 JSON 파일 + 요약 메시지
- Supabase Storage `expense-backups/daily/YYYY-MM-DD/expenses.json`

### 4-3. 백업 복원

Slack에서 JSON 파일 다운로드 후:

```bash
# 미리보기 (DB 변경 없음)
npm run backup:restore -- ./expenses-backup-2026-07-16.json --dry-run

# 실제 복원 (upsert — 같은 id는 덮어씀)
npm run backup:restore -- ./expenses-backup-2026-07-16.json
```

---

## 5. Vercel 배포 (Preview·Production)

Vercel Dashboard → **Settings → Environment Variables**에 위 서버 변수 추가:

- `SLACK_BOT_TOKEN`
- `SLACK_NOTIFY_CHANNEL_ID`
- `SLACK_BACKUP_CHANNEL_ID`
- `CRON_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`

`vercel.json` Cron: **매일 23:00 KST** (`0 14 * * *` UTC) 자동 백업.

> Hobby 플랜 Cron 제한이 있을 수 있습니다. Preview 배포에서는 Cron이 동작하지 않을 수 있어, Production에서 확인하세요.

---

## 6. 관련 파일

| 파일 | 설명 |
|------|------|
| `src/app/actions/slack.ts` | 지출 등록 Slack 알림 |
| `src/app/api/backup/daily/route.ts` | 일일 백업 API |
| `src/lib/slack/` | Slack 클라이언트·메시지 |
| `src/lib/backup/export.ts` | 백업 JSON 생성 |
| `scripts/test-daily-backup.sh` | 로컬 백업 테스트 |
| `scripts/restore-from-backup.mjs` | 백업 복원 |

제안 문서: `docs/SLACK_BACKUP_PROPOSAL.md`
