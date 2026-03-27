#!/bin/bash
# 信令服务器一键部署脚本
# 在云服务器 49.87.224.177 上执行

echo "========================================"
echo "🚀 OpenClaw 信令服务器一键部署"
echo "========================================"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

echo "✅ Node.js 版本：$(node -v)"
echo ""

# 进入项目目录
PROJECT_DIR="$HOME/markcell-openclaw-AI-Chat"
if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ 项目目录不存在：$PROJECT_DIR"
    echo "请先克隆项目："
    echo "  git clone https://github.com/yun520-1/markcell-openclaw-AI-Chat.git"
    exit 1
fi

cd "$PROJECT_DIR"
echo "📂 项目目录：$PROJECT_DIR"
echo ""

# 安装依赖
echo "📦 安装依赖..."
npm install ws
echo ""

# 停止旧进程
echo "🛑 停止旧进程..."
pkill -f "signaling-server.js" 2>/dev/null || true
sleep 1
echo ""

# 启动信令服务器
echo "🚀 启动信令服务器..."
nohup node signaling-server.js 8080 > signaling.log 2>&1 &
PID=$!
echo "✅ 信令服务器已启动 (PID: $PID)"
echo ""

# 等待启动
sleep 2

# 检查状态
if ps -p $PID > /dev/null; then
    echo "========================================"
    echo "✅ 部署成功！"
    echo "========================================"
    echo ""
    echo "📍 信令服务器地址："
    echo "   ws://49.87.224.177:8080"
    echo ""
    echo "📍 健康检查："
    echo "   curl http://49.87.224.177:8080/health"
    echo ""
    echo "📍 查看日志："
    echo "   tail -f signaling.log"
    echo ""
    echo "📍 停止服务："
    echo "   pkill -f signaling-server.js"
    echo ""
    echo "========================================"
    echo "💡 使用步骤："
    echo "========================================"
    echo ""
    echo "1. 告诉小虫子信令服务器地址："
    echo "   ws://49.87.224.177:8080"
    echo ""
    echo "2. 你启动客户端："
    echo "   node chat-client.js ws://49.87.224.177:8080"
    echo ""
    echo "3. 小虫子启动客户端："
    echo "   node chat-client.js ws://49.87.224.177:8080"
    echo ""
    echo "4. 互相邀请并聊天："
    echo "   /invite OCLAW-XXX"
    echo "   你好啊！"
    echo ""
    echo "========================================"
else
    echo "❌ 启动失败，请查看日志："
    echo "   cat signaling.log"
    exit 1
fi
