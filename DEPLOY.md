# GitHub / Vercel 배포 빠른 가이드

## ⚡ 완전 자동화 (한 번만 설정)

**원리:** `git push` → GitHub 업로드 → Vercel이 자동 감지 → 배포  
CLI로 매번 Vercel 명령을 칠 필요 없습니다.

```
코드 수정 → git push (또는 npm run release)
                ↓
         GitHub 저장소 업데이트
                ↓
    GitHub Actions (lint + build 검증)
                ↓
    Vercel 자동 Production 배포  ← 1~2분
```

### 1회 설정 체크리스트

| # | 작업 | 상태 |
|---|------|------|
| ① | `brew install gh` 후 `gh auth login` (Google SSO) | ☐ |
| ② | `git push -u origin main` 으로 GitHub 업로드 | ☐ |
| ③ | [vercel.com/new](https://vercel.com/new) → GitHub 연동 → `store-expense-app` Import | ☐ |
| ④ | Vercel Environment Variables 3개 등록 (아래 참고) | ☐ |
| ⑤ | Deploy 완료 확인 | ☐ |

**③이 핵심입니다.** Vercel과 GitHub를 연결하면, 이후 `main` 브랜치 push마다 **자동 배포**됩니다.

### 이후 매일 사용 (한 줄)

```bash
npm run release -- "지출 폼 버튼 크기 수정"
# 또는
git add . && git commit -m "메시지" && git push origin main
```

---

## 계정 정보

| 항목 | 값 |
|------|-----|
| GitHub 사용자명 | `gprl1357-hash` |
| GitHub 이메일 | `gprl1357@gmail.com` |
| 저장소 URL | https://github.com/gprl1357-hash/store-expense-app |

> GitHub **아이디(사용자명)** 는 이메일과 다릅니다.  
> 로그인 이메일: `gprl1357@gmail.com` → 사용자명: **`gprl1357-hash`**

---

## 1. GitHub push (터미널에서 실행)

```bash
cd /Users/hyekihong/store-expense-app

# 원격 저장소 연결
git remote add origin https://github.com/gprl1357-hash/store-expense-app.git
# 이미 origin이 있으면:
# git remote set-url origin https://github.com/gprl1357-hash/store-expense-app.git

# push
git push -u origin main
```

또는 스크립트 사용:

```bash
./scripts/setup-github.sh
# (기본값: gprl1357-hash)
```

인증 창이 뜨면 GitHub 로그인 후 승인하세요.

---

## 2. Vercel 배포

1. https://vercel.com/new 접속 → GitHub 연동
2. **`gprl1357-hash/store-expense-app`** 저장소 Import
3. Environment Variables 추가:

```
NEXT_PUBLIC_SUPABASE_URL=https://mklmpbtozqteofgeksrc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Supabase anon public key>
NEXT_PUBLIC_MONTHLY_BUDGET=3000000
```

4. **Deploy** 클릭

---

## 3. 이후 워크플로

```bash
# 코드 수정 후
git add .
git commit -m "변경 설명"
git push origin main
# → GitHub Actions CI + Vercel 자동 배포
```
