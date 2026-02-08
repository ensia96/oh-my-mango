#!/bin/bash

set -euo pipefail

if [[ "${CI:-}" != "true" ]]; then
  echo "Error: CI 환경에서만 실행 가능합니다."
  exit 1
fi

echo "=== 도구 목록 ==="
bun -e "
  import('./dist/src/index.js').then(async m => {
    const plugin = await m.default();
    const tools = Object.keys(plugin.tool).sort();
    tools.forEach(t => console.log(t));
    console.log();
    console.log('총 ' + tools.length + '개');
  });
"
