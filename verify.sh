#!/bin/bash

set -euo pipefail

if [[ "${CI:-}" != "true" ]]; then
  echo "Error: CI 환경에서만 실행 가능합니다."
  exit 1
fi

# v0.1.4 도구, 스킬 및 에이전트 검증
EXPECTED="git-branch
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
  echo "✅ 도구 목록 일치 (9개)"
else
  echo "❌ 도구 목록 불일치"
  echo ""
  echo "기대:"
  echo "$EXPECTED"
  exit 1
fi

# 스킬 검증
EXPECTED_SKILLS="before-everything
before-git
orchestration-client
orchestration-server"

echo ""
echo "=== 스킬 목록 검증 ==="

ACTUAL_SKILLS=$(bun -e "
  import('./dist/src/skill.js').then(m => {
    Object.keys(m.Skill.pack).sort().forEach(s => console.log(s));
  });
" 2>/dev/null | grep -v "^\[")

echo "$ACTUAL_SKILLS"
echo ""

if [[ "$ACTUAL_SKILLS" == "$EXPECTED_SKILLS" ]]; then
  echo "✅ 스킬 목록 일치 (4개)"
else
  echo "❌ 스킬 목록 불일치"
  echo ""
  echo "기대:"
  echo "$EXPECTED_SKILLS"
  exit 1
fi

# 에이전트 검증
EXPECTED_ENABLED_AGENTS="build-mango
decision-mango
mango
remind-mango
research-mango
scout-mango
workflow-mango"

EXPECTED_DISABLED_AGENTS="build
explore
general
plan"

echo ""
echo "=== 에이전트 목록 검증 ==="

ACTUAL_ENABLED_AGENTS=$(bun -e "
  import('./dist/src/agent.js').then(m => {
    const excluded = new Set(['title', 'summary', 'compaction']);
    Object.entries(m.Agent.team)
      .filter(([name, config]) => !excluded.has(name) && config?.disable !== true)
      .map(([name]) => name)
      .sort()
      .forEach(name => console.log(name));
  });
" 2>/dev/null | grep -v "^\[")

ACTUAL_DISABLED_AGENTS=$(bun -e "
  import('./dist/src/agent.js').then(m => {
    const excluded = new Set(['title', 'summary', 'compaction']);
    Object.entries(m.Agent.team)
      .filter(([name, config]) => !excluded.has(name) && config?.disable === true)
      .map(([name]) => name)
      .sort()
      .forEach(name => console.log(name));
  });
" 2>/dev/null | grep -v "^\[")

echo "활성 에이전트:"
echo "$ACTUAL_ENABLED_AGENTS"
echo ""
echo "비활성 에이전트:"
echo "$ACTUAL_DISABLED_AGENTS"
echo ""

if [[ "$ACTUAL_ENABLED_AGENTS" == "$EXPECTED_ENABLED_AGENTS" ]]; then
  echo "✅ 활성 에이전트 목록 일치 (7개)"
else
  echo "❌ 활성 에이전트 목록 불일치"
  echo ""
  echo "기대:"
  echo "$EXPECTED_ENABLED_AGENTS"
  exit 1
fi

if [[ "$ACTUAL_DISABLED_AGENTS" == "$EXPECTED_DISABLED_AGENTS" ]]; then
  echo "✅ 비활성 에이전트 목록 일치 (4개)"
else
  echo "❌ 비활성 에이전트 목록 불일치"
  echo ""
  echo "기대:"
  echo "$EXPECTED_DISABLED_AGENTS"
  exit 1
fi
