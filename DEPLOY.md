# GitHub / Vercel 배포 빠른 가이드

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
