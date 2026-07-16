# Slack 운영 데이터 백업 구성 제안

> **상태:** ✅ **v1.3.0~1.3.1에서 1·2단계 구현 완료** (2026-07-16)  
> **v1.3.1:** Supabase Webhook 기반 Production 알림 안정화  
> **운영 가이드:** [SLACK_SETUP.md](SLACK_SETUP.md)  
> **기능 정리:** [WORK_SUMMARY.md](WORK_SUMMARY.md)

---

> **목표:** Supabase(운영 DB)의 지출 데이터를 주기적으로 Slack에 백업·알림  
> **원칙:** 배포(코드)와 데이터(DB) 분리 — 백업은 **읽기 전용** 조회만 수행

### 구현 현황 (v1.3.0)

| 제안 단계 | 내용 | 상태 |
|----------|------|------|
| 1단계 | 지출 등록 Slack 알림 + 일일 요약 | ✅ |
| 2단계 | 일일 JSON 파일 Slack·Storage 백업 | ✅ |
| 3단계 | Storage 사진 zip·장기 보관 | ⬜ 미구현 |
| 주간 엑셀 | 매주 xlsx Slack 업로드 | ⬜ 미구현 |

---

## 1. 무엇을 백업할까?

| 대상 | 내용 | 우선순위 |
|------|------|----------|
| `expenses` 테이블 | 날짜, 카테고리, 금액, 작성자, 메모, 등록일 | **필수** |
| `photo_url` | 사진 URL 목록 (파일 자체는 Storage) | 권장 |
| 요약 통계 | 일/월 합계, 건수, 카테고리별 비율 | 권장 |
| Storage 사진 | `expense-photos` 버킷 파일 | 선택 (용량 큼) |

**권장 주기**

| 주기 | 내용 |
|------|------|
| **매일 23:00** | 당일 등록 건수 + 월 누적 요약 메시지 |
| **매주 일요일** | 전체 활성 지출 CSV/엑셀 파일 Slack 업로드 |
| **매월 1일** | 전월 마감 리포트 + Supabase 공식 백업 확인 |

---

## 2. 추천 아키텍처 (Vercel Cron + Slack Bot)

현재 스택(Next.js + Vercel + Supabase)과 잘 맞는 구성입니다.

```
┌─────────────┐     Cron (매일/매주)      ┌──────────────────┐
│   Vercel    │ ────────────────────────► │ /api/backup/slack │
│  Scheduler  │   Authorization: CRON_SECRET                  │
└─────────────┘                           └────────┬─────────┘
                                                   │ read only
                                                   ▼
                                          ┌──────────────────┐
                                          │     Supabase     │
                                          │  expenses 테이블  │
                                          └────────┬─────────┘
                                                   │ CSV/요약
                                                   ▼
                                          ┌──────────────────┐
                                          │      Slack       │
                                          │  #매장-지출-백업  │
                                          └──────────────────┘
```

### 필요한 설정

**Slack (1회)**
1. https://api.slack.com/apps → **Create New App**
2. Bot Token Scopes: `chat:write`, `files:write`, `channels:read`
3. 채널 `#매장-지출-백업` 생성 후 앱 초대
4. `SLACK_BOT_TOKEN`, `SLACK_BACKUP_CHANNEL_ID` 발급

**Vercel 환경변수 (서버 전용 — NEXT_PUBLIC 아님)**
```
CRON_SECRET=랜덤_긴_문자열
SUPABASE_SERVICE_ROLE_KEY=...   # anon이 아닌 service role (읽기 전용 정책 권장)
SLACK_BOT_TOKEN=xoxb-...
SLACK_BACKUP_CHANNEL_ID=C...
```

**vercel.json**
```json
{
  "crons": [
    { "path": "/api/backup/slack?mode=daily", "schedule": "0 14 * * *" },
    { "path": "/api/backup/slack?mode=weekly", "schedule": "0 14 * * 0" }
  ]
}
```
> `0 14 * * *` = UTC 14:00 = **한국 시간 23:00**

**API Route (`src/app/api/backup/slack/route.ts`)**
- `Authorization: Bearer ${CRON_SECRET}` 검증
- Supabase에서 `deleted_at IS NULL` 지출 조회
- **daily:** Slack 메시지 (오늘 N건, 이번 달 합계)
- **weekly:** exceljs로 xlsx 생성 → `files.uploadV2` 로 채널에 업로드

---

## 3. 대안 비교

| 방식 | 장점 | 단점 |
|------|------|------|
| **A. Vercel Cron + API Route** ⭐ | 이미 Vercel 사용 중, 코드 한곳 관리 | Hobby 플랜 Cron 제한 확인 필요 |
| **B. Supabase Edge Function + pg_cron** | DB 가까워 빠름 | Deno/Edge 별도 배포·관리 |
| **C. GitHub Actions schedule** | 무료, git과 함께 | repo secrets 관리, Vercel과 분리 |
| **D. Slack Incoming Webhook만** | 설정 5분 | **파일 업로드 불가**, 텍스트만 |
| **E. n8n / Make / Zapier** | 코드 없음 | 유료·외부 서비스 의존 |

**소규모 매장(3명):** **A안(Vercel Cron)** 또는 **D안(웹훅 요약만)** 으로 시작 → 필요 시 주간 파일 백업 추가.

---

## 4. 단계별 도입 (추천)

### 1단계 — 요약 알림만 (1~2시간)
- Slack Incoming Webhook
- 매일 「오늘 3건 / 450,000원 등록, 이번 달 8,200,000원」 메시지
- DB 변경 없음, 읽기만

### 2단계 — 주간 엑셀 파일 (반나절)
- Slack Bot + `files:write`
- 조회 탭과 동일 형식 xlsx → `#매장-지출-백업`에 파일

### 3단계 — 사진·장기 보관 (선택)
- Storage → 주간 zip → Supabase Storage `backups/` 또는 Google Drive
- Slack에는 「백업 완료 + 다운로드 링크」만

---

## 5. 보안 주의

| 항목 | 권장 |
|------|------|
| Supabase 키 | **Service Role**은 서버 API Route에만, 절대 `NEXT_PUBLIC_` 금지 |
| Cron URL | `CRON_SECRET` 없으면 401 반환 |
| Slack 채널 | **비공개** 채널, 멤버만 초대 |
| 백업 파일 | 개인정보(작성자명) 포함 → Slack 워크스페이스 접근 통제 |

---

## 6. Supabase 공식 백업 (병행 권장)

Slack 백업은 **운영 편의용**이고, Supabase Dashboard의 **Point-in-Time Recovery / Daily Backup**(플랜에 따라)은 **재해 복구용**으로 함께 켜 두는 것이 좋습니다.

---

## 7. 다음 단계

~~1~4단계 코드 구현~~ → **v1.3.0 완료**. 아래는 향후 확장:

1. 주간 엑셀 파일 Slack 업로드 (`mode=weekly`)
2. Storage 사진 zip 백업
3. Supabase PITR + Slack 백업 병행 점검

운영 설정·테스트: [SLACK_SETUP.md](SLACK_SETUP.md)
