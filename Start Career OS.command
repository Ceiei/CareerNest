#!/bin/bash
cd -- "$(dirname -- "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo "请先安装 Node.js 24 LTS 和 Python 3.12，详见 README.md。"
  read -r -p "按回车退出…"
  exit 1
fi
node scripts/quick-start.mjs
result=$?
if [ "$result" -ne 0 ]; then read -r -p "按回车退出…"; fi
exit "$result"
