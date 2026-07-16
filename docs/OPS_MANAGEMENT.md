# 운영 소스 관리 체계 (Production Ops)

> **대상:** 제주은희네해장국광명GIDC 매장 지출 관리 앱  
> **전제:** 3명 공동 사용 · Supabase(데이터) + Vercel(앱) + GitHub(소스)  
> **목표:** 실수 배포·데이터 손실·복구 불가 상황 방지

---

## 1. 관리 원칙 (4가지)

| 원칙 | 설명 |
|------|------|
| **코드와 데이터 분리** | Vercel 배포 = UI/로직만. DB 변경 = Supabase SQL 마이그레이션만 |
| **main = 운영** | `main` 브랜치에 있는 것만 https://store-expense-app.vercel.app 에 반영 |
| **기록 남기기** | 모든 변경은 Git 커밋 + (가능하면) CHANGELOG 한 줄 |
| **되돌릴 수 있게** | Vercel 롤백 + Git revert 항상 가능한 상태 유지 |

---

## 2. 환경 구조

```
┌─────────────┐    push/PR     ┌─────────────┐    merge main    ┌─────────────┐
│  로컬 개발   │ ─────────────► │ GitHub      │ ───────────────► │ Vercel      │
│ npm run dev │                │ feature/*   │                  │ Production  │
└─────────────┘                └──────┬──────┘                  └──────┬──────┘
                                      │ Preview (자동)                     │
                                      └──────────────────────────►       │
                                                         store-expense-app.vercel.app
                                                                      │
┌─────────────┐                                                       │
│  Supabase   │ ◄─────────────── NEXT_PUBLIC_* (읽기/쓰기) ───────────┘
│  (운영 DB)  │
└─────────────┘
```

| 환경 | URL / 위치 | 용도 | 데이터 |
|------|------------|------|--------|
| **로컬** | `localhost:3000` | 기능 개발·테스트 | 운영 DB 공유 ⚠️ (주의) |
| **Preview** | Vercel PR별 URL | 배포 전 확인 | **운영 DB 공유** ⚠️ |
| **Production** | store-expense-app.vercel.app | 어르신 실사용 | **운영 DB** |

> ⚠️ 현재 Supabase 프로젝트가 하나이므로, Preview/로컬도 **같은 DB**를 씁니다.  
> 테스트용 시드 스크립트는 **운영에서 실행 금지**.

---

## 3. Git 브랜치 · 버전 전략

### 브랜치

| 브랜치 | 규칙 |
|--------|------|
| `main` | **운영**. 직접 실험적 push 지양 |
| `feature/기능명` | 새 기능·수정 (예: `feature/date-picker`, `feature/slack-backup`) |
| `fix/버그명` | 긴급 수정 |

### 버전 태그 (권장)

의미 있는 배포마다 Git 태그:

```bash
git tag -a v1.1.0 -m "날짜 선택 입력 추가"
git push origin v1.1.0
```

**간단 버전 규칙 (Semantic Versioning)**

| 변경 | 예 | 버전 |
|------|-----|------|
| 버그 수정 | 엑셀 오류 수정 | 1.0. **1** |
| 기능 추가 | 날짜 선택, Slack 백업 | 1. **1**. 0 |
| DB 스키마 변경·큰 개편 | 로그인 추가 | **2**. 0. 0 |

### CHANGELOG

`CHANGELOG.md`에 배포마다 기록 ( **KST 24시간** ):

```markdown
## [1.3.0] - 2026-07-16 15:30:00

### Added
- 새 기능 설명
```

---

## 4. 배포 절차 (표준)

### 일반 배포 (기능 추가·개선)

```
1. feature/* 브랜치에서 개발
2. npm run build 로 로컬 빌드 확인
3. GitHub PR 생성 (본인이 3명이면 셀프 리뷰 + Preview URL 확인)
4. main merge → Vercel 자동 Production 배포 (1~2분)
5. store-expense-app.vercel.app 에서 핵심 기능 3분 smoke test
6. CHANGELOG + git tag (선택)
7. Slack #매장-지출-백업 채널에 「v1.1.0 배포 완료」 한 줄 (백업 연동 후)
```

### 긴급 핫픽스

```
1. main에서 fix/* 브랜치 (또는 최소 diff)
2. npm run build
3. merge + 배포
4. 문제 지속 시 → Vercel Dashboard 「Instant Rollback」 (5.절)
```

### 배포 전 체크리스트 (필수)

- [ ] `npm run build` 성공
- [ ] `.env.local` / 시크릿 파일 **커밋 안 됨** 확인
- [ ] Supabase **마이그레이션** 필요 시 → SQL 먼저 실행, 그다음 코드 배포
- [ ] `docs/사용가이드.md` UI 변경 시 업데이트
- [ ] Preview 또는 로컬에서 **입력 → 조회 → 엑셀** 한 번씩

---

## 5. 롤백 (되돌리기)

| 상황 | 방법 | 소요 |
|------|------|------|
| **앱만** 이상 | Vercel → Deployments → 이전 배포 → **Promote to Production** | 1분 |
| **코드** 되돌림 | `git revert <커밋>` → push | 2~3분 |
| **DB** 잘못 적용 | Supabase Dashboard → SQL로 역마이그레이션 또는 Point-in-Time Recovery | 플랜별 |

> Vercel 롤백은 **코드만** 되돌립니다. DB는 Supabase에서 별도 복구.

---

## 6. 데이터베이스 변경 규칙

**절대 규칙:** Dashboard에서만 임의 ALTER 하지 말고, **항상 파일로 남기기**

```
supabase/migrations/004_설명.sql   ← 새 파일만 추가
supabase/schema.sql                ← 전체 스키마 참고용 동기화
```

**적용 순서**
1. Supabase SQL Editor에서 `migrations/00X_*.sql` 실행
2. 로컬·운영 앱에서 동작 확인
3. 코드 변경이 필요하면 feature 브랜치 → 배포
4. `docs/WORK_SUMMARY.md` 또는 CHANGELOG에 기록

**금지**
- `scripts/seed-*.mjs` 를 **운영 DB**에 실행
- `deleted_at` 없이 DELETE (앱은 soft delete 사용)

---

## 7. 비밀정보 · 접근 권한

| 항목 | 보관 위치 | Git 포함 |
|------|-----------|----------|
| Supabase anon key | Vercel Env, `.env.local` | ❌ |
| Supabase **service role** | Vercel Env (백업 API만) | ❌ |
| GitHub SSH / PAT | Keychain, `.env.local` GITHUB_TOKEN | ❌ |
| Slack Bot Token | Vercel Env (추후) | ❌ |

**접근 권한 (권장)**

| 역할 | GitHub | Vercel | Supabase |
|------|--------|--------|----------|
| 관리자 (1명) | Admin | Owner | Owner |
| 운영자 (2명) | Read 또는 없음 | — | Read (Dashboard) |

> 코드 수정·배포는 **1명(관리자)** 만 담당하고, 나머지는 앱 사용만 — 실수 배포 방지.

---

## 8. CI/CD 복구 (권장)

과거 PAT `workflow` 이슈로 CI를 제거했으나, **운영 단계에서는 빌드 검증 자동화** 권장.

**최소 CI** (`.github/workflows/build.yml`):

```yaml
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci && npm run build
```

- `workflow` scope 필요 → PAT 재발급 또는 GitHub Actions 기본 `GITHUB_TOKEN` 사용
- **배포는 Vercel**이 담당, CI는 **깨진 코드 main merge 방지**만

---

## 9. 모니터링 · 알림

| 항목 | 도구 | 주기 |
|------|------|------|
| 사이트 다운 | [UptimeRobot](https://uptimerobot.com) 무료 | 5분 ping |
| Vercel 배포 실패 | Vercel 이메일 알림 ON | 이벤트 |
| Supabase 사용량 | Dashboard → Usage | 월 1회 |
| 지출 데이터 | Slack 백업 (별도 제안) | 매일/매주 |
| npm 보안 | `npm audit` | 분기 1회 |

**Smoke test (배포 후 3분)**

1. 앱 열림
2. 지출 1건 입력 (테스트 후 삭제 또는 휴지통)
3. 조회 탭 목록 표시
4. 예산 게이지 숫자 정상

---

## 10. 문서 관리 (변경 시 업데이트)

| 파일 | 언제 |
|------|------|
| `CHANGELOG.md` | **매 Production 배포** |
| `docs/사용가이드.md` | UI·기능 변경 시 |
| `docs/WORK_SUMMARY.md` | 큰 기능 묶음 완료 시 |
| `docs/SBOM.json` | `package.json` 의존성 변경 시 |
| `DEPLOY.md` | 배포 방법 변경 시 |
| `supabase/migrations/` | **DB 변경 시 필수** |

---

## 11. 의존성 · 보안 유지

| 작업 | 주기 | 명령 |
|------|------|------|
| 패치 업데이트 | 1~2개월 | `npm update` → build → 배포 |
| 메이저(Next.js 등) | 분기 검토 | CHANGELOG + 충분한 로컬 테스트 |
| SBOM 갱신 | 의존성 변경 후 | `docs/SBOM.json` 수동 또는 `npm ls` |
| 미사용 패키지 | 여유 있을 때 | `xlsx` 등 제거 검토 |

---

## 12. 역할 · 의사결정

| 결정 | 담당 |
|------|------|
| 기능 추가 여부 | 3명 합의 (매장) |
| 코드·배포 | 관리자 1명 |
| DB 스키마 변경 | 관리자 + SQL 파일 리뷰 |
| 롤백 실행 | 관리자 (긴급 시 즉시) |
| 어르신 가이드 수정 | UI 변경 담당자 |

---

## 13. 사고 대응 (간단)

```
1. 증상 확인 (앱 안 열림 / 입력 안 됨 / 데이터 이상)
2. Vercel Status + Supabase Status 확인
3. 앱 문제 → Vercel Instant Rollback
4. 데이터 문제 → Supabase 백업 / Slack 백업 파일 확인
5. 원인 파악 후 fix/* → 배포
6. CHANGELOG + (선택) incident 메모 docs/incidents/YYYY-MM-DD.md
```

---

## 14. 지금 당장 적용할 Top 5

| # | 작업 | 효과 |
|---|------|------|
| 1 | **`CHANGELOG.md` 생성** + 앞으로 배포마다 기록 | 무엇이 바뀌었는지 추적 |
| 2 | **feature 브랜치** 습관 (`main` 직접 push 줄이기) | Preview로 배포 전 확인 |
| 3 | **GitHub `main` 브랜치 보호** (Settings → Rules) | force push·실수 merge 방지 |
| 4 | **CI build.yml** 복구 | 깨진 코드 운영 반영 차단 |
| 5 | **Slack 백업 1단계** (일일 요약) | 데이터 + 배포 알림 통합 |

---

## 15. 다음 단계 (구현 지원)

원하시면 아래를 코드·설정으로 바로 추가할 수 있습니다.

1. `CHANGELOG.md` + `v1.1.0` 태그
2. `.github/workflows/build.yml` (CI)
3. GitHub branch protection 설정 가이드
4. `docs/incidents/` 템플릿
5. Slack 일일 요약 Cron (백업 1단계)

---

*작성: 2026-07-16 · store-expense-app 운영 관리 체계 v1*
