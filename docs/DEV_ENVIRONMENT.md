# 개발(dev) / 운영(main) 환경 분리

> **배경:** 기존에는 `main`에 머지되지 않은 로컬·Preview 작업도 **운영 Supabase**를 그대로 사용했습니다
> ([`CONTRIBUTING.md`](CONTRIBUTING.md) 옛 버전 참고). 인증 기능처럼 DB 마이그레이션이 따르는 위험한
> 변경을 안전하게 검증하기 위해, 저장소는 하나로 유지한 채 **Vercel 환경변수 스코프**로 DB만 분리합니다.
>
> `store-expense-app-v2`는 이 분리와 무관한 별도 제품(월천가계부)이므로 대상에서 제외합니다.

---

## 1. 구조

```
GitHub (단일 저장소, store-expense-app)
  main ─────────────► Vercel Production 환경변수 ─────────────► 운영 Supabase (실제 매장 데이터)
  dev / feature/* ───► Vercel Preview 환경변수    ─────────────► dev Supabase (테스트 데이터)
```

- 저장소는 **하나만** 유지 (v2처럼 별도 저장소로 쪼개지 않음 → 드리프트 방지)
- Vercel은 브랜치별이 아니라 **Environment(Production/Preview)별**로 환경변수를 다르게 설정 가능 →
  `main`이 아닌 모든 브랜치의 Preview 배포는 자동으로 dev Supabase를 바라봄
- `dev`가 기본 작업 브랜치. 기능별로 `dev`에서 파생한 `feature/*`를 쓰고 `dev`로 먼저 머지해도 됨
- **운영 반영은 오직 `dev → main` PR 머지 한 지점**에서만 발생

---

## 2. 필요 조치 (담당자 구분)

| # | 작업 | 담당 | 상태 |
|---|------|------|------|
| 1 | GitHub `dev` 브랜치 생성 | Claude | ✅ 완료 |
| 2 | CI(`build.yml`)가 `dev` push/PR에도 실행되도록 트리거 추가, Node 20→22 (Supabase 패키지 요구사항) | Claude | ✅ 완료 |
| 3 | `package-lock.json` 동기화 수정 (`npm ci` 실패 원인) | Claude | ✅ 완료 |
| 4 | Supabase **dev 프로젝트** 생성 | **사용자** | ⬜ 대기 |
| 5 | dev 프로젝트에 `supabase/schema.sql` + `migrations/001~007` 실행 | Claude (키 전달 시) 또는 사용자 | ⬜ 대기 |
| 6 | Vercel 프로젝트 → Settings → Environment Variables에서 **Preview** 스코프에 dev Supabase 키 등록 | 사용자 (Vercel 대시보드 접근 필요) | ⬜ 대기 |
| 7 | `main` 브랜치 보호 규칙 (`dev → main` PR 필수, CI 통과 필수) | 사용자 (repo admin 설정) | ⬜ 대기 |

### 4번 — Supabase dev 프로젝트 생성
1. https://supabase.com/dashboard → **New project** (이름 예: `store-expense-dev`)
2. 생성 후 **Project Settings → API**에서 URL, `anon public` key, `service_role` key 확인

### 5번 — 스키마 적용
dev 프로젝트의 **SQL Editor**에서 아래를 순서대로 실행 (운영과 동일한 순서):
1. `supabase/schema.sql`
2. `supabase/migrations/001_update_users.sql` ~ `007_store_id_default_rollback.sql`

### 6번 — Vercel 환경변수 (Preview 스코프)
Vercel 프로젝트 → **Settings → Environment Variables**에서 아래 값을 **Preview**에만 적용
(Production 값은 그대로 운영 Supabase 유지):

```
NEXT_PUBLIC_SUPABASE_URL=<dev Supabase URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<dev anon key>
SUPABASE_SERVICE_ROLE_KEY=<dev service role key>
SLACK_ENABLED=false          # Preview에서 운영 Slack 채널로 오발송 방지
CRON_SECRET=<dev용 임의 문자열>
```

### 7번 — 브랜치 보호
[`BRANCH_PROTECTION.md`](BRANCH_PROTECTION.md)의 설정을 적용하되, PR 대상은 `main`, 기반 브랜치는 `dev`로 운용합니다.

---

## 3. "운영환경에 반영해줘" 워크플로

사용자가 이 표현(또는 유사한 맥락)으로 요청하면:

1. `dev` 브랜치의 변경사항을 `main` 대상 PR로 생성
2. **1차 검토** — 코드 diff·CI 결과 확인 (`/code-review` 등)
3. **2차 검토** — Preview 배포에서 실제 동작 확인 (dev Supabase 기준)
4. 결과를 사용자에게 요약 보고 → **최종 승인**을 받은 뒤에만 merge
5. merge 후 Vercel Production 자동 배포 → smoke test

이 문서 이전 단계까지는 모든 작업이 `dev`에만 반영되며 운영에 영향이 없습니다.

---

*작성: 2026-09-22*
