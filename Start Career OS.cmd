@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo 请先安装 Node.js 24 LTS 和 Python 3.12，详见 README.md。
  pause
  exit /b 1
)
node scripts/quick-start.mjs
if errorlevel 1 (
  pause
  exit /b 1
)
