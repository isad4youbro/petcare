@echo off
cd /d "%~dp0"
if not exist "frontend\dist\index.html" (
  if not exist "frontend\node_modules" (
    call npm.cmd --prefix frontend ci
    if errorlevel 1 exit /b 1
  )
  call npm.cmd --prefix frontend run build
  if errorlevel 1 exit /b 1
)
python backend/server.py
pause
