# Slack 알림 · 일일 백업 운영 가이드

> **상태:** v1.3.0 Production 운영 중  
> **관련:** [WORK_SUMMARY.md](WORK_SUMMARY.md) · [OPS_MANAGEMENT.md](OPS_MANAGEMENT.md) · [CHANGELOG.md](../CHANGELOG.md)

---

## 1. 기능 요약

| 기능 | 트리거 | 결과 |
|------|--------|------|
| **지출 등록 알림** | 앱에서 지출 등록 | Slack `[지출 등록]` 메시지 |
| **일일 백업** | Vercel Cron 23:00 KST | JSON → Storage + Slack 파일 |
| **수동 백업** | `npm run backup:test` 또는 curl | 위와 동일 |
| **복원** | `npm run backup:restore` | 백업 JSON → DB upsert |

알림 실패 시 **지출 등록은 정상 유지** (비동기·오류 무시).

---

## 2. 아키텍처

```
[권장] Supabase Webhook — expenses INSERT
        → POST /api/slack/webhook → Slack [지출 등록]

[백업] 앱 insertExpense → POST /api/slack/notify-expense → Slack

[Vercel Cron] GET /api/backup/daily → Storage + Slack 파일
```

| 코드 | 역할 |
|------|------|
| `src/app/api/slack/webhook/route.ts` | **Supabase INSERT Webhook (권장)** |
| `src/app/api/slack/notify-expense/route.ts` | 클라이언트 백업 알림 |
| `src/app/api/backup/daily/route.ts` | 일일 백업 API |
| `src/lib/slack/` | Slack API 클라이언트 |

---

## 3. Supabase Database Webhook (권장 · 1회)

앱·PWA 캐시와 관계없이 **DB INSERT 시 자동 Slack 알림**합니다.

```bash
npm run slack:webhook:setup   # 설정 값 출력 + 연결 테스트
```

**Supabase Dashboard → Database → Webhooks → Create hook**

| 항목 | 값 |
|------|-----|
| Name | `expense-slack-notify` |
| Table | `expenses` |
| Events | **INSERT** |
| Method | POST |
| URL | `https://store-expense-app.vercel.app/api/slack/webhook` |
| Header | `Authorization: Bearer <CRON_SECRET>` |

설정 후 지출 1건 등록 → Slack `[지출 등록]` 확인.

Webhook 설정 완료 후 Vercel에 `SLACK_CLIENT_NOTIFY=false` 를 넣으면 클라이언트 백업 알림을 끌 수 있습니다 (중복 방지).

---

## 4. Slack 앱 설정 (1회)

1. https://api.slack.com/apps → **Create New App** → **From scratch**
2. **OAuth & Permissions** → Bot Token Scopes: `chat:write`, `files:write`
3. **Install to Workspace** → Bot Token (`xoxb-...`) 복사
4. **비공개 채널** 생성 후 앱 초대 (`/invite @앱이름`)
5. 채널 ID: 채널 우클릭 → **채널 세부정보** → `C...`

---

## 5. Supabase Storage (일일 백업)

```sql
-- supabase/migrations/004_expense_backups.sql
```

| 버킷 | 경로 예 | 용도 |
|------|---------|------|
| `expense-backups` | `daily/2026-07-16/expenses.json` | 일일 전체 지출 JSON |

> 기존 지출 데이터는 **변경하지 않음**. 백업 저장(추가)만 수행.

---

## 6. 환경 변수

### `.env.local` (로컬) · Vercel Production (운영)

```bash
# 서버 전용 — NEXT_PUBLIC_ 금지, Git 커밋 금지
SLACK_ENABLED=true
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_NOTIFY_CHANNEL_ID=C0123456789
SLACK_BACKUP_CHANNEL_ID=C0123456789
CRON_SECRET=your-random-secret-string
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

| 변수 | 설명 |
|------|------|
| `SLACK_BOT_TOKEN` | Slack Bot OAuth Token |
| `SLACK_NOTIFY_CHANNEL_ID` | 지출 등록 알림 채널 |
| `SLACK_BACKUP_CHANNEL_ID` | 일일 백업 채널 (동일 채널 가능) |
| `CRON_SECRET` | 백업 API 인증 (`openssl rand -hex 32` 권장) |
| `SUPABASE_SERVICE_ROLE_KEY` | Storage 저장·복원 (Dashboard → API → service_role) |
| `SLACK_ENABLED` | `false`면 Slack 전송 끔 |

Vercel 일괄 등록:

```bash
npm run vercel:env:slack
npx vercel --prod    # env 반영 재배포
```

---

## 7. 테스트

### 로컬

```bash
npm run dev
npm run slack:test      # Slack 연결 확인
npm run backup:test     # 일일 백업 (dev 서버 실행 중)
```

지출 1건 등록 → Slack `[지출 등록]` 확인.

### Production

```bash
# 수동 백업 (CRON_SECRET 필요)
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://store-expense-app.vercel.app/api/backup/daily
```

https://store-expense-app.vercel.app 에서 지출 등록 → Slack 알림 확인.

---

## 8. 백업 · 복원

### 백업 JSON 구조

```json
{
  "schemaVersion": 1,
  "exportedAt": "2026-07-16T06:00:00.000Z",
  "store": "제주은희네...",
  "stats": { "activeCount": 308, "todayCount": 1, ... },
  "expenses": [ ... ]
}
```

- **활성 + 휴지통** 전체 포함 (완전 복원용)
- Slack에서 JSON 다운로드 또는 Supabase Storage에서 조회

### 복원

```bash
# 미리보기 (DB 변경 없음)
npm run backup:restore -- ./expenses-backup-2026-07-16.json --dry-run

# 실제 복원 (id 기준 upsert)
npm run backup:restore -- ./expenses-backup-2026-07-16.json
```

> 복원은 **관리자만** 실행. 운영 DB에 덮어쓰므로 `--dry-run`으로 먼저 확인.

---

## 9. npm 스크립트

| 명령 | 설명 |
|------|------|
| `npm run slack:webhook:setup` | Supabase Webhook 설정 안내 + 테스트 |
| `npm run slack:test` | Slack 메시지 전송 테스트 |
| `npm run backup:test` | 로컬 백업 API 호출 |
| `npm run backup:restore -- <파일> [--dry-run]` | 백업 복원 |
| `npm run vercel:env:slack` | `.env.local` → Vercel Production env |

---

## 10. 보안

| 항목 | 권장 |
|------|------|
| Bot Token · service role | Git·`.env.local.example`에 넣지 않음 |
| Slack 채널 | 비공개, 멤버만 |
| CRON_SECRET | 추측 불가능한 긴 문자열 |
| 백업 파일 | 작성자명 포함 → 접근 통제 |

---

## 11. 트러블슈팅

| 증상 | 확인 |
|------|------|
| 앱 등록 시 알림 없음 | **Supabase Webhook 설정** (`npm run slack:webhook:setup`), PWA 캐시 삭제 후 재설치 |
| 알림 없음 | `SLACK_ENABLED`, Bot Token, 채널 ID, 앱 채널 초대 |
| 백업 401 | `CRON_SECRET` 헤더 `Authorization: Bearer ...` |
| Storage 실패 | `004_expense_backups.sql` 실행, service role key |
| `invalid_arguments` (Slack 파일) | `src/lib/slack/client.ts` form-urlencoded 사용 (v1.3.0 수정됨) |
| Cron 미실행 | Vercel Hobby 플랜·Production 배포 여부 확인 |

---

## 12. 참고

- 초기 설계 제안: [SLACK_BACKUP_PROPOSAL.md](SLACK_BACKUP_PROPOSAL.md)
- Supabase 공식 백업(PITR)은 **재해 복구용**으로 Slack 백업과 병행 권장

---

*갱신: 2026-07-16 · v1.3.0*
