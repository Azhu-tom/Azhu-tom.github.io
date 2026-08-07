@echo off
chcp 65001 >nul
echo ════════════════════════════════════════
echo   结构工程师AI助手 - 快速启动脚本
echo ════════════════════════════════════════
echo.

:: 检查Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js >= 18.0
    pause
    exit /b 1
)

:: 显示版本信息
node -v
echo.

echo [1/2] 正在启动后端服务 (端口 8080)...
start "Backend Server" cmd /k "cd server && npm run dev"

echo [2/2] 正在启动前端服务 (端口 3000)...
timeout /t 3 >nul
start "Frontend Dev" cmd /k "cd client && npm run dev"

echo.
echo ✅ 服务正在启动...
echo.
echo   前端地址: http://localhost:3000
echo   后端地址: http://localhost:8080
echo   API文档: http://localhost:8080/api/health
echo.
echo 请在浏览器中打开 http://localhost:3000
echo.
pause
