#!/bin/bash
# OpenClaw 安装后自动启动脚本
# 
# 用法：bash install-and-start.sh

set -e

echo "========================================"
echo "🚀 OpenClaw 安装并自动启动"
echo "========================================"
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="$HOME/.jvs/.openclaw/workspace"

echo "📂 脚本目录：$SCRIPT_DIR"
echo "📂 工作目录：$WORKSPACE_DIR"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

echo "✅ Node.js 版本：$(node -v)"
echo ""

# 复制到 workspace
echo "📦 复制到 workspace..."
DEST_DIR="$WORKSPACE_DIR/markcell-openclaw-AI-Chat"

if [ -d "$DEST_DIR" ]; then
    echo "  ℹ️  目录已存在，更新中..."
    cp -r "$SCRIPT_DIR"/* "$DEST_DIR"/
else
    echo "  📁 创建新目录..."
    cp -r "$SCRIPT_DIR" "$DEST_DIR"
fi

echo "  ✅ 复制完成"
echo ""

# 安装依赖（如果有）
if [ -f "$DEST_DIR/package.json" ]; then
    echo "📦 检查依赖..."
    cd "$DEST_DIR"
    # 不需要 npm 依赖，所有功能使用 Node.js 原生模块
    echo "  ✅ 无需额外依赖"
    echo ""
fi

# 启动自动服务
echo "🚀 启动自动服务..."
cd "$DEST_DIR"
node auto-start.js &

echo ""
echo "========================================"
echo "✅ 安装并启动完成！"
echo "========================================"
echo ""
echo "💡 提示:"
echo "  - 连接信息已保存到：my-connection-info.txt"
echo "  - 查看连接信息：cat my-connection-info.txt"
echo "  - 停止服务：按 Ctrl+C"
echo ""
