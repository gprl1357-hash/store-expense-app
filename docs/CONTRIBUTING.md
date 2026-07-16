# 기여 · 배포 워크플로

운영 환경(`main` → https://store-expense-app.vercel.app)에 반영하기 전 절차입니다.  
**Supabase 데이터는 이 워크플로만으로 변경되지 않습니다.** DB 변경은 [마이그레이션](../supabase/migrations/)을 별도로 실행할 때만 해당합니다.

---

## 1. 브랜치 만들기

```bash
cd /Users/hyekihong/store-expense-app
git checkout main
git pull origin main
git checkout -b feature/기능-설명
# 예: feature/date-picker, fix/excel-export
```

---

## 2. 개발 · 로컬 확인

```bash
npm run dev          # http://localhost:3000
npm run build        # 배포 전 필수 (CI와 동일)
```

**운영 DB 주의:** 로컬·Preview는 **운영 Supabase**를 사용합니다.  
테스트 입력은 등록 후 **휴지통**으로 옮기거나, 테스트용 소액·명확한 메모(`[테스트]`)로 구분하세요.

---

## 3. 커밋

```bash
git add .
git commit -m "feat: 변경 내용을 한 줄로"
```

커밋 접두어 (선택): `feat:` `fix:` `docs:` `chore:`

---

## 4. Push · Pull Request

```bash
git push -u origin feature/기능-설명
```

GitHub에서 **Pull Request** → `main` 대상으로 생성.

- Vercel이 **Preview URL**을 PR에 자동으로 붙입니다.
- Preview에서 입력·조회·엑셀 등 **핵심 기능** 확인 후 merge.

---

## 5. merge 후

1. `main` merge → Vercel **Production** 자동 배포 (1~2분)
2. https://store-expense-app.vercel.app smoke test
3. [`CHANGELOG.md`](../CHANGELOG.md)에 `[Unreleased]` 항목 정리 후 버전 섹션 추가  
   - 형식: `## [1.x.x] - YYYY-MM-DD HH:MM:SS` (KST, 24시간)  
   - 예: `## [1.3.0] - 2026-07-16 15:30:00`
4. (선택) `git tag -a v1.x.x -m "설명" && git push origin v1.x.x`
5. Slack·백업 env 변경 시: `npm run vercel:env:slack` 후 `npx vercel --prod` (재배포)

---

## 6. DB 스키마 변경이 필요할 때만

1. `supabase/migrations/00X_설명.sql` **새 파일** 추가 (기존 데이터 삭제 SQL 금지)
2. Supabase Dashboard → SQL Editor에서 **수동 실행**
3. 앱 코드 변경 → feature 브랜치 → PR → merge
4. CHANGELOG에 **Database** 섹션 기록

현재 마이그레이션: `001` ~ `004` (004: `expense-backups` Storage 버킷)

---

## 7. 긴급 핫픽스

```bash
git checkout main && git pull
git checkout -b fix/긴급-설명
# 최소 수정 → build → push → PR → merge
```

배포 후에도 문제면 Vercel Dashboard → **Instant Rollback**.

---

더 자세한 운영 정책: [`docs/OPS_MANAGEMENT.md`](OPS_MANAGEMENT.md)
