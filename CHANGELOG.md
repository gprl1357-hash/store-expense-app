# Changelog

이 프로젝트의 모든 주요 변경은 이 파일에 기록합니다.  
형식은 [Keep a Changelog](https://keepachangelog.com/ko/1.0.0/)를 따릅니다.

**기록 형식:** `## [버전] - YYYY-MM-DD HH:MM:SS` (KST, 24시간)

---

## [Unreleased]

### Added (dev 브랜치, 운영 미반영)
- 매장 ID(4자리) + 비밀번호 기반 매장 인증, 최초 로그인 시 비밀번호 변경 강제
- 매장별 간편 로그인(자동 로그인) 및 세션 무효화(비밀번호 변경 시)
- 지출/예산 조회·등록·수정·삭제를 서버(API Route) 경유로 전환 (OWASP A01 대응)
- DB 마이그레이션 `008_store_auth.sql`
- 개선요청(피드백) 채널 1단계 MVP — 텍스트+사진 제보, Slack 즉시 알림
  (동영상·관리자 대시보드는 2단계 이후), DB 마이그레이션 `009_feedback.sql`

---

## [1.4.0] - 2026-08-07 21:06:00

### Added
- **다매장** — 광명GIDC점 / 인천가정점 (`store_id`, 상단 매장 전환)
- 지점별 작성자 (광명: 홍혜기·홍성미·손선애 / 인천: 홍성미·신계승)
- 카테고리 **카드** (`💳`)
- **설정** 탭 — 매장별 월 예산 변경 (`stores.monthly_budget`)
- DB 마이그레이션 `006_stores_and_card.sql`, 롤백 호환 `007_store_id_default_rollback.sql`
- 긴급 롤백 문서 [`docs/ROLLBACK.md`](docs/ROLLBACK.md)

### Changed
- Slack 지출 알림에 **매장명** 표시
- 매장 전환 시 이전 매장 데이터가 남지 않도록 조회 레이스 수정
- 사용가이드·README — 다매장·설정·카드 반영

### Database
- `stores` 테이블 + `expenses.store_id` (기존 행 → 광명GIDC)
- `created_by`에 `신계승` 허용

---

## [1.3.1] - 2026-07-16 17:51:16

### Added
- **Supabase Database Webhook** 기반 지출 등록 Slack 알림 (`POST /api/slack/webhook`)
- Webhook 인증 `x-cron-secret` 헤더 지원 (`src/lib/slack/webhook-auth.ts`)
- Slack 알림 본문 **KST 24시간 등록 시각** (`YYYY-MM-DD HH:mm:ss`, `formatDateTime24KST`)
- Webhook 설정·테스트 스크립트 (`npm run slack:webhook:setup`)
- SQL trigger 대안 (`supabase/migrations/005_slack_webhook_trigger.sql`)
- 클라이언트 백업 알림 경로 (`/api/slack/notify-expense`, 재시도·sendBeacon)

### Fixed
- **Production 지출 등록 Slack 알림 미수신** — Server Action 취소 → API Route → Supabase Webhook으로 전환
- Webhook **200 응답이지만 Slack 미전송** — `after()` 제거, Slack `await` 후 `slackSent` 응답
- Supabase Webhook payload 테이블명·record 파싱 보강 (`public.expenses`, ID fallback)
- Slack `chat.postMessage` form-urlencoded 전송 (Production curl·앱 등록 모두 확인)
- PWA 캐시로 구버전 JS 사용 — `Cache-Control: no-store` 등 반영

### Changed
- Slack·백업 운영 문서 전면 갱신 (`README`, `WORK_SUMMARY`, `SLACK_SETUP`, `OPS_MANAGEMENT`, `DEPLOY`)

---

## [1.3.0] - 2026-07-16 15:43:38

### Added
- Slack 지출 등록 알림 (Server Action, `SLACK_BOT_TOKEN`)
- 일일 백업 API (`/api/backup/daily`) — JSON → Storage + Slack 파일
- Vercel Cron 매일 23:00 KST 백업 스케줄
- 백업 복원 스크립트 (`npm run backup:restore`)
- Slack·백업 설정 가이드 (`docs/SLACK_SETUP.md`)
- Storage 마이그레이션 `004_expense_backups.sql`
- Vercel Slack 환경변수 동기화 스크립트 (`npm run vercel:env:slack`)

---

## [1.2.0] - 2026-07-16 14:18:18

### Added
- 운영 관리 체계 문서 (`docs/OPS_MANAGEMENT.md`)
- Slack 백업 구성 제안 (`docs/SLACK_BACKUP_PROPOSAL.md`)
- GitHub Actions CI — `npm run build` 검증 (데이터·배포 변경 없음)
- `main` 브랜치 보호 설정 가이드 (`docs/BRANCH_PROTECTION.md`)
- feature 브랜치 워크플로 (`docs/CONTRIBUTING.md`)

---

## [1.1.1] - 2026-07-16 13:56:31

### Added
- 입력 탭 **날짜 선택** (달력 + 오늘/어제 단축 버튼)
- 어르신 사용 가이드 (`docs/사용가이드.md`)

### Changed
- LAN 개발 접속 (`allowedDevOrigins`, SSH 443 포트)
- Git push 자동화 스크립트 (`setup-git-auth.sh`, `git-push.sh`)

---

## [1.1.0] - 2026-07-16 12:17:34

### Added
- **조회** 탭: 달력, 카테고리 필터, 검색, 차트, 엑셀/인쇄
- **사진 첨부** (Supabase Storage, 조회 탭에서만 확인)
- 휴지통 soft delete 및 **복원** (조회 탭)
- 60대+ UI 개선 (큰 글씨·버튼, 핀치 줌)
- SBOM 및 작업 정리 문서

### Fixed
- 엑셀 저장 `lab()` 색상 오류 (SVG 캡처)

---

## [1.0.0] - 2026-07-15 23:00:24

### Added
- 지출 입력, 월 예산 게이지, Realtime 동기화
- Supabase + Vercel 배포
- PWA manifest

[Unreleased]: https://github.com/gprl1357-hash/store-expense-app/compare/v1.3.1...main
[1.3.1]: https://github.com/gprl1357-hash/store-expense-app/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/gprl1357-hash/store-expense-app/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/gprl1357-hash/store-expense-app/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/gprl1357-hash/store-expense-app/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/gprl1357-hash/store-expense-app/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/gprl1357-hash/store-expense-app/releases/tag/v1.0.0
