#!/usr/bin/env bash
# GitHub push 자동화 1회 설정 (SSH 권장, 또는 PAT → Keychain + .env.local)
# 사용법: ./scripts/setup-git-auth.sh
set -euo pipefail

cd "$(dirname "$0")/.."

REPO="gprl1357-hash/store-expense-app"
GITHUB_USER="gprl1357-hash"
SSH_KEY="$HOME/.ssh/id_ed25519_github"
SSH_CONFIG="$HOME/.ssh/config"

echo "======================================"
echo "  GitHub push 자동화 설정 (1회)"
echo "======================================"
echo ""
echo "방법 선택:"
echo "  1) SSH 키 (권장 — 토큰 만료 없음, Cursor/터미널 모두 자동)"
echo "  2) PAT 토큰 (Keychain + .env.local 저장)"
echo ""
read -r -p "선택 [1/2] (기본 1): " CHOICE
CHOICE="${CHOICE:-1}"

mkdir -p "$HOME/.ssh"
chmod 700 "$HOME/.ssh"

setup_ssh() {
  if [[ ! -f "$SSH_KEY" ]]; then
    echo ""
    echo "→ SSH 키 생성 중..."
    ssh-keygen -t ed25519 -C "${GITHUB_USER}@github" -f "$SSH_KEY" -N ""
  else
    echo "→ 기존 SSH 키 사용: $SSH_KEY"
  fi

  # ssh config 블록 추가
  if ! grep -q "Host github.com" "$SSH_CONFIG" 2>/dev/null; then
    cat >> "$SSH_CONFIG" << EOF

# store-expense-app GitHub (443 — Wi-Fi에서 22번 차단 시)
Host github.com
  HostName ssh.github.com
  Port 443
  User git
  IdentityFile ${SSH_KEY}
  AddKeysToAgent yes
  UseKeychain yes
EOF
    chmod 600 "$SSH_CONFIG"
  fi

  # macOS: 키체인에 키 등록
  if [[ "$(uname)" == "Darwin" ]]; then
    ssh-add --apple-use-keychain "$SSH_KEY" 2>/dev/null || ssh-add "$SSH_KEY" 2>/dev/null || true
  else
    ssh-add "$SSH_KEY" 2>/dev/null || true
  fi

  git remote set-url origin "git@github.com:${REPO}.git"

  echo ""
  echo "======================================"
  echo "  GitHub에 공개키 등록 (1회만)"
  echo "======================================"
  echo ""
  echo "아래 URL 접속 → New SSH key → 붙여넣기:"
  echo "  https://github.com/settings/ssh/new"
  echo ""
  echo "  Title: Mac store-expense-app"
  echo "  Key:"
  echo ""
  cat "${SSH_KEY}.pub"
  echo ""

  if command -v pbcopy &>/dev/null; then
    pbcopy < "${SSH_KEY}.pub"
    echo "(공개키가 클립보드에 복사되었습니다)"
  fi

  echo ""
  read -r -p "GitHub에 SSH 키 등록을 완료했으면 Enter..." _

  echo ""
  echo "→ 연결 테스트..."
  if ssh -T git@github.com 2>&1 | grep -qi "successfully authenticated"; then
    echo "✓ SSH 인증 성공!"
  else
    echo "⚠ 아직 인증되지 않았을 수 있습니다. GitHub SSH 키 등록 후 다시 시도하세요."
  fi
}

setup_pat() {
  echo ""
  echo "PAT 발급: https://github.com/settings/tokens/new"
  echo "  권한: repo (체크)"
  echo ""
  read -r -s -p "토큰 붙여넣기 (ghp_...): " TOKEN
  echo ""

  if [[ -z "$TOKEN" ]]; then
    echo "토큰이 비어 있습니다."
    exit 1
  fi

  git remote set-url origin "https://github.com/${REPO}.git"

  # macOS Keychain 저장
  if [[ "$(uname)" == "Darwin" ]]; then
    git config --local credential.helper osxkeychain
    printf "protocol=https\nhost=github.com\nusername=%s\npassword=%s\n" \
      "$GITHUB_USER" "$TOKEN" | git credential-osxkeychain store
    echo "✓ macOS Keychain에 저장됨"
  fi

  # .env.local 에 GITHUB_TOKEN 추가/갱신
  if [[ -f .env.local ]]; then
    if grep -q '^GITHUB_TOKEN=' .env.local; then
      if [[ "$(uname)" == "Darwin" ]]; then
        sed -i '' "s|^GITHUB_TOKEN=.*|GITHUB_TOKEN=${TOKEN}|" .env.local
      else
        sed -i "s|^GITHUB_TOKEN=.*|GITHUB_TOKEN=${TOKEN}|" .env.local
      fi
    else
      printf '\n# GitHub push 자동화 (gitignore 됨)\nGITHUB_TOKEN=%s\n' "$TOKEN" >> .env.local
    fi
  else
    printf '# GitHub push 자동화\nGITHUB_TOKEN=%s\n' "$TOKEN" > .env.local
  fi
  echo "✓ .env.local 에 GITHUB_TOKEN 저장됨 (git에 포함되지 않음)"

  echo ""
  echo "→ push 테스트..."
  git push "https://${TOKEN}@github.com/${REPO}.git" main
  echo "✓ push 성공!"
}

case "$CHOICE" in
  2) setup_pat ;;
  *) setup_ssh ;;
esac

echo ""
echo "======================================"
echo "  설정 완료"
echo "======================================"
echo ""
echo "이후 배포:"
echo "  ./scripts/git-push.sh          # push만"
echo "  npm run release -- \"메시지\"    # 커밋 + push"
echo ""
