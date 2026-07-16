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
| ① | `./scripts/push-with-token.sh` 또는 `gh auth login` | ☐ |
| ② | `git push -u origin main` 으로 GitHub 업로드 | ☐ |
| ③ | [vercel.com/new](https://vercel.com/new) → GitHub 연동 → `store-expense-app` Import | ☐ |
| ④ | Vercel Environment Variables 3개 등록 (아래 참고) | ☐ |
| ⑤ | Deploy 완료 확인 | ☐ |

**③이 핵심입니다.** Vercel과 GitHub를 연결하면, 이후 `main` 브랜치 push마다 **자동 배포**됩니다.

### 1회 설정 — push 자동화 (필수)

```bash
cd /Users/hyekihong/store-expense-app
./scripts/setup-git-auth.sh
```

| 방법 | 설명 |
|------|------|
| **1) SSH (권장)** | 키 생성 → GitHub에 공개키 1회 등록 → 이후 자동 |
| **2) PAT** | 토큰 → macOS Keychain + `.env.local` 저장 → 이후 자동 |

설정 후:

```bash
./scripts/git-push.sh              # push만
npm run release -- "변경 설명"      # 커밋 + push → Vercel 자동 배포
```

---

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

### brew 없을 때 (권장)

Homebrew가 없으면 **PAT(토큰) 방식**이 가장 간단합니다.

```bash
cd /Users/hyekihong/store-expense-app
./scripts/push-with-token.sh
```

1. https://github.com/settings/tokens/new 접속 (Google SSO 로그인)
2. **repo** 권한 체크 → **Generate token**
3. `ghp_...` 토큰 복사 → 스크립트에 붙여넣기

> **workflow 오류가 났다면:** `.github/workflows/` 파일 push에는 **workflow** 권한이 추가로 필요합니다.  
> 현재 CI 파일은 제거했으므로 **repo** 권한만으로 push 가능합니다. (빌드는 Vercel에서 실행)

### Homebrew 설치가 필요할 때

`brew: command not found` → Homebrew 미설치 상태입니다.

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
# 설치 후 PATH 추가 (Apple Silicon)
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
brew install gh
gh auth login
```

### 일반 push

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
