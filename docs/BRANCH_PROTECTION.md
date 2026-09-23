# GitHub `main` 브랜치 보호 설정 가이드

> **목적:** 실수로 `main`에 force push하거나, 빌드 실패 코드를 merge하는 것을 방지  
> **데이터 영향:** 없음 (GitHub 설정만 변경)

---

## 1. 설정 위치

1. https://github.com/gprl1357-hash/store-expense-app 접속
2. **Settings** → 왼쪽 **Branches**
3. **Add branch protection rule** (또는 `main` 규칙 **Edit**)

---

## 2. 권장 설정

| 항목 | 설정 | 이유 |
|------|------|------|
| **Branch name pattern** | `main` | 운영 브랜치만 보호 |
| **Require a pull request before merging** | ✅ ON | Preview 확인 후 merge |
| └ Require approvals | **0** (3명 소규모) 또는 **1** | 팀 정책에 맞게 |
| **Require status checks to pass before merging** | ✅ ON | CI 빌드 통과 필수 |
| └ Status checks | **`build`** 선택 (workflow명 `Build`, job명 `build`) | `.github/workflows/build.yml` |
| **Require branches to be up to date before merging** | ✅ ON (권장) | 최신 main 기준 |
| **Do not allow bypassing the above settings** | ✅ ON (관리자만 예외 가능) | |
| **Allow force pushes** | ❌ OFF | 운영 히스토리 보호 |
| **Allow deletions** | ❌ OFF | `main` 삭제 방지 |

> CI 워크플로가 **최근 7일 내 성공적으로 실행된 이후**에야 검색창에 `build` 체크가 나타납니다
> (검색창은 입력해야 후보가 뜨며, 비어 있으면 빈 목록으로 보입니다).

---

## 3. 설정 후 워크플로 (2026-09-22~ dev/main 분리)

```
feature/* → dev로 PR/머지 (Preview = dev Supabase)
dev → main으로 PR (2차 검토 + 사용자 최종 승인 후에만) → CI Build 통과 → Merge → Vercel Production
```

**직접 `main` push**는 보호 규칙 때문에 거부됩니다. (관리자 bypass 제외)  
상세: [`DEV_ENVIRONMENT.md`](DEV_ENVIRONMENT.md)

---

## 4. CLI로 설정 (선택, `gh` 설치 시)

```bash
gh auth login

gh api repos/gprl1357-hash/store-expense-app/branches/main/protection \
  --method PUT \
  -f required_status_checks='{"strict":true,"contexts":["build"]}' \
  -f enforce_admins=false \
  -f required_pull_request_reviews='{"required_approving_review_count":0}' \
  -F restrictions=null \
  -f allow_force_pushes=false \
  -f allow_deletions=false
```

> `build`는 Actions 탭에서 실제 job 이름과 일치해야 합니다. (2026-09-22: `main` 브랜치에 적용 완료, `protected: true` 확인됨)

---

## 5. 문제 해결

| 증상 | 해결 |
|------|------|
| Merge 버튼 비활성 | CI 실패 → Actions 탭 로그 확인 |
| Status check 목록 비어 있음 | workflow merge 후 PR을 한 번 열어 CI 실행 |
| 긴급 hotfix 막힘 | 관리자 bypass 또는 임시 규칙 완화 (사용 후 복구) |

---

*관련: [`docs/CONTRIBUTING.md`](CONTRIBUTING.md), [`docs/OPS_MANAGEMENT.md`](OPS_MANAGEMENT.md)*
