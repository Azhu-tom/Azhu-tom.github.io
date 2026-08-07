#!/bin/bash

echo "═══════════════════════════════════════"
echo "  结构工程师AI助手 - 快速启动脚本"
echo "═══════════════════════════════════════"
echo ""

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "[错误] 未检测到 Node.js，请先安装 Node.js >= 18.0"
    exit 1
fi

# 显示版本信息
node -v
echo ""

echo "[1/2] 正在启动后端服务 (端口 8080)..."
cd server && npm run dev &
BACKEND_PID=$!
cd ..

sleep 2

echo "[2/2] 正在启动前端服务 (端口 3000)..."
cd client && npm run dev &
FRONTEND_PID=$!
cd ..

sleep 3

echo ""
echo "✅ 服务正在启动..."
echo ""
echo "   前端地址: http://localhost:3000"
echo "   后端地址: http://localhost:8080"
echo "   API文档: http://localhost:8080/api/health"
echo ""
echo "请在浏览器中打开 http://localhost:3000"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 捕获退出信号，关闭子进程
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

wait
