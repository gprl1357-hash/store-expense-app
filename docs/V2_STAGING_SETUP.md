> ⚠️ **2026-09-22 갱신:** 이 문서가 제안한 별도 저장소(`store-expense-app-v2`)는 이후
> "월천가계부"라는 **별도 상용 제품**으로 독자적으로 발전해, 본 앱(v1, 제주은희네해장국)과는
> 더 이상 관련이 없습니다. 본 앱의 개발/운영 환경 분리는 별도 저장소가 아니라
> **단일 저장소 + `dev`/`main` 브랜치 + Vercel 환경변수 분리** 방식으로 진행합니다.
> 최신 방식: [`DEV_ENVIRONMENT.md`](DEV_ENVIRONMENT.md). 아래 내용은 과거 기록으로만 남깁니다.

# v2 스테이징 환경 — 별도 저장소 · 배포 가이드 (구 계획, 더 이상 사용 안 함)

> **목적:** 인증(v2) 개발·배포 테스트  
> **원칙:** 운영(`store-expense-app`)은 **코드·DB·Vercel·Slack Webhook 모두 변경하지 않음**

---

## 1. 환경 분리 구조

```
┌─────────────────────────────┐     ┌─────────────────────────────┐
│  운영 (유지)                 │     │  v2 스테이징 (신규)          │
├─────────────────────────────┤     ├─────────────────────────────┤
│ GitHub                      │     │ GitHub                      │
│  store-expense-app          │     │  store-expense-app-v2       │
│ Vercel                      │     │ Vercel                      │
│  store-expense-app.vercel.app│    │  store-expense-app-v2.vercel.app │
│ Supabase                    │     │ Supabase (신규 프로젝트)     │
│  기존 운영 DB                │     │  빈 DB + 시드               │
│ Slack Webhook               │     │  비활성 (SLACK_ENABLED=false)│
│  /api/slack/webhook (유지)   │     │  Webhook 미설정             │
│ Cron 23:00 백업             │     │  Cron 없음 (vercel.json)    │
└─────────────────────────────┘     └─────────────────────────────┘
```

| 항목 | 운영 | v2 스테이징 |
|------|------|-------------|
| 저장소 | `gprl1357-hash/store-expense-app` | `gprl1357-hash/store-expense-app-v2` |
| 브랜치 | `main` (v1.3.1) | `main` (v2.0.0-dev) |
| URL | https://store-expense-app.vercel.app | https://store-expense-app-v2.vercel.app (예상) |
| Supabase | **기존 프로젝트** | **새 dev 프로젝트** |
| 데이터 | 실제 지출 데이터 | 시드만 |
| Slack | ✅ | ❌ (테스트 시에만 test 채널) |

---

## 2. 사전 준비 체크리스트

- [ ] GitHub에 빈 저장소 생성: `store-expense-app-v2` (Private 권장)
- [ ] Supabase Dashboard → **New project** (예: `store-expense-dev`)
- [ ] Vercel 계정 (기존과 동일 팀 사용 가능)
- [ ] 로컬 SSH GitHub 인증 (`./scripts/setup-git-auth.sh` 완료 상태)

---

## 3. 로컬 v2 저장소 생성 (자동)

운영 폴더 **옆**에 v2 복사본을 만듭니다 (운영 repo는 수정하지 않음).

```bash
cd /Users/hyekihong/store-expense-app
bash scripts/setup-v2-staging-repo.sh
```

생성 위치: `/Users/hyekihong/store-expense-app-v2`

스크립트가 하는 일:

1. v1.3.1 코드 복사 (`node_modules`, `.vercel`, `.env.local` 제외)
2. `package.json` → `store-expense-app-v2`, `2.0.0-dev`
3. `vercel.json` → **Cron 제거** (스테이징 백업 방지)
4. `.vercel` 삭제 (새 Vercel 프로젝트 연결용)
5. git init + 최초 커밋
6. `origin` → `store-expense-app-v2` remote 설정

---

## 4. GitHub 업로드

```bash
cd /Users/hyekihong/store-expense-app-v2
git push -u origin main
```

> GitHub에 `store-expense-app-v2` 저장소가 **먼저** 있어야 합니다.  
> https://github.com/new → Repository name: `store-expense-app-v2` → Create (README 없이)

---

## 5. Supabase dev 프로젝트

1. [Supabase Dashboard](https://supabase.com/dashboard) → **New project**
2. 이름 예: `store-expense-dev`
3. SQL Editor → v2 repo의 `supabase/schema.sql` + `migrations/001~005` 순서 실행  
   (인증 마이그레이션 `006+`는 v2 개발 시 추가)
4. **Replication** → `expenses` Realtime 활성화
5. **API Settings**에서 URL, anon key, service_role key 복사

> ⚠️ 운영 Supabase URL/키를 v2 `.env.local`에 넣지 마세요.

---

## 6. Vercel 스테이징 프로젝트

### 6-1. GitHub 연동 (권장)

1. https://vercel.com/new → Import `gprl1357-hash/store-expense-app-v2`
2. Project Name: `store-expense-app-v2`
3. Environment Variables (Production + Preview 동일):

```
NEXT_PUBLIC_SUPABASE_URL=<dev Supabase URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<dev anon key>
NEXT_PUBLIC_MONTHLY_BUDGET=10000000
SUPABASE_SERVICE_ROLE_KEY=<dev service role>
SLACK_ENABLED=false
CRON_SECRET=<임의 문자열 — 백업 API 테스트용>
```

4. Deploy

### 6-2. CLI로 연결 (대안)

```bash
cd /Users/hyekihong/store-expense-app-v2
npx vercel link          # 새 프로젝트 생성/선택
npx vercel env add ...     # 위 변수 등록
npx vercel --prod --yes
```

---

## 7. 배포 후 Smoke test

| # | 확인 | 기대 |
|---|------|------|
| 1 | 스테이징 URL 접속 | 앱 로딩 |
| 2 | 운영 URL 접속 | **기존과 동일** (v1.3.1) |
| 3 | 스테이징에서 지출 등록 | dev Supabase에만 반영 |
| 4 | 운영 Supabase Dashboard | **행 수 변화 없음** |
| 5 | 운영 Slack | 스테이징 등록 시 **알림 없음** |

---

## 8. v2 개발 워크플로

```bash
cd /Users/hyekihong/store-expense-app-v2
npm install
cp .env.staging.example .env.local   # dev Supabase 값 입력
npm run dev                          # http://localhost:3000

# 기능 완료 후
npm run build
git add . && git commit -m "feat: ..."
git push origin main                 # → Vercel 자동 배포 (v2만)
```

운영 hotfix는 **운영 repo**(`store-expense-app`)에서만:

```bash
cd /Users/hyekihong/store-expense-app
# v1 수정 → push → store-expense-app.vercel.app 만 갱신
```

---

## 9. 운영과의 동기화 (선택)

| 상황 | 방법 |
|------|------|
| v1 버그 수정을 v2에 반영 | v2 repo에서 `git remote add v1 git@github.com:gprl1357-hash/store-expense-app.git` 후 cherry-pick |
| v2 완료 후 운영 전환 | 운영 Supabase additive 마이그레이션 → v2 코드를 운영 repo merge **또는** repo 통합 결정 |
| v2 폐기 | v2 repo·Vercel·Supabase dev 프로젝트 삭제, 운영 무영향 |

---

## 10. 주의사항

1. **Supabase Webhook** — 스테이징 URL을 운영 Supabase Webhook에 등록하지 마세요.
2. **`.env.local`** — v1·v2 폴더 각각 다른 Supabase 키 사용.
3. **PWA 홈 화면** — 운영·스테이징 URL이 다르므로 별도 설치.
4. **Cron** — v2 `vercel.json`에는 Cron 없음 (실수로 운영 DB 백업 방지).
5. **Slack** — v2 기본 `SLACK_ENABLED=false`.

---

## 11. v2 인증 개발 순서 (다음)

1. `006_stores_auth.sql` — stores, profiles, store_members, PIN
2. `scripts/seed-dev.mjs` — 홍혜기(owner), 홍성미(leader), 손선애(staff)
3. 2단계 로그인 UI + RLS
4. owner TOTP MFA (선택 enroll)

상세: [WORK_SUMMARY.md](WORK_SUMMARY.md) · 향후 과제는 [FUTURE_IMPROVEMENTS.md](FUTURE_IMPROVEMENTS.md)

---

*작성: 2026-07-17 · v2 스테이징 분리*
