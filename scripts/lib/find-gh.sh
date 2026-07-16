#!/usr/bin/env bash
# gh CLI 경로 자동 탐색 (brew 없어도 동작)
set -euo pipefail

find_gh() {
  if command -v gh &>/dev/null; then
    command -v gh
    return 0
  fi
  for p in \
    /opt/homebrew/bin/gh \
    /usr/local/bin/gh \
    "$HOME/.local/bin/gh" \
    "$(dirname "$0")/bin/gh"; do
    if [[ -x "$p" ]]; then
      echo "$p"
      return 0
    fi
  done
  return 1
}
