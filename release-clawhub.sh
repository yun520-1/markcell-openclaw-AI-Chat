#!/bin/bash
# markcell-openclaw-AI Chat - ClawHub 发布脚本
# 原创声明：本脚本为原创，无版权风险
# 许可证：MIT

set -e

echo "========================================"
echo "markcell-openclaw-AI Chat - ClawHub 发布"
echo "========================================"
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "📂 项目目录：$SCRIPT_DIR"
echo ""

# 检查 clawhub CLI 是否安装
if ! command -v clawhub &> /dev/null; then
    echo "⚠️  clawhub CLI 未安装"
    echo ""
    echo "请先安装 clawhub CLI:"
    echo "  npm install -g clawhub"
    echo ""
    echo "或者使用 OpenClaw 内置的 clawhub 技能"
    echo ""
    exit 1
fi

echo "✅ clawhub CLI 已安装：$(clawhub --version)"
echo ""

# 检查 clawhub.json 是否存在
if [ ! -f "clawhub.json" ]; then
    echo "❌ clawhub.json 不存在"
    exit 1
fi

echo "📋 clawhub.json 配置:"
cat clawhub.json | head -20
echo "..."
echo ""

# 登录 ClawHub（如果需要）
echo "🔐 检查 ClawHub 登录状态..."
if ! clawhub whoami &> /dev/null; then
    echo "  ⚠️  未登录 ClawHub"
    echo ""
    echo "请先登录:"
    echo "  clawhub login"
    echo ""
    exit 1
else
    echo "  ✅ 已登录 ClawHub"
fi

echo ""

# 验证配置
echo "🔍 验证 clawhub.json 配置..."
clawhub validate || echo "  ⚠️  验证失败，请检查配置"
echo ""

# 发布到 ClawHub
echo "📦 准备发布到 ClawHub..."
echo ""
echo "发布命令:"
echo "  clawhub publish"
echo ""
echo "或者使用 OpenClaw 消息命令:"
echo "  在 OpenClaw 中发送：clawhub publish"
echo ""

# 显示 ClawHub 技能信息
echo "📊 ClawHub 技能信息:"
echo "  - 名称：markcell-openclaw-ai-chat"
echo "  - 显示名称：markcell-openclaw-AI Chat"
echo "  - 版本：1.0.0"
echo "  - 作者：markcell"
echo "  - 许可证：MIT"
echo "  - 分类：对话管理，AI 协作，技能系统"
echo ""

# 显示下一步操作
echo "📋 下一步操作："
echo ""
echo "1. 使用 clawhub CLI 发布:"
echo "   cd ~/.jvs/.openclaw/workspace/openclaw-dialog-tools"
echo "   clawhub publish"
echo ""
echo "2. 或在 OpenClaw 中使用 clawhub 技能:"
echo "   发送消息：clawhub publish markcell-openclaw-ai-chat"
echo ""
echo "3. 查看 ClawHub 页面:"
echo "   https://clawhub.ai/skills/markcell-openclaw-ai-chat"
echo ""

echo "========================================"
echo "✅ ClawHub 发布准备完成！"
echo "========================================"
echo ""
