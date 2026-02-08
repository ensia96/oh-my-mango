#!/bin/bash

set -euo pipefail

if [[ "${CI:-}" != "true" ]]; then
  echo "Error: CI 환경에서만 실행 가능합니다."
  exit 1
fi

# v0.0.17 도구 교체 검증
EXPECTED="find-files
git-branch
git-commit
git-issue
git-request-merge
git-request-pull
git-workflow-list
git-workflow-status
remind-messages
remind-sessions"

echo "=== 도구 목록 검증 ==="

ACTUAL=$(bun -e "
  import('./dist/src/index.js').then(async m => {
    const plugin = await m.default();
    Object.keys(plugin.tool).sort().forEach(t => console.log(t));
  });
" 2>/dev/null | grep -v "^\[")

echo "$ACTUAL"
echo ""

if [[ "$ACTUAL" == "$EXPECTED" ]]; then
  echo "✅ 도구 목록 일치 (10개)"
else
  echo "❌ 도구 목록 불일치"
  echo ""
  echo "기대:"
  echo "$EXPECTED"
  exit 1
fi
