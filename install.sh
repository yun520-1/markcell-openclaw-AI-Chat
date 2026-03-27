#!/bin/bash
# OpenClaw 对话工具系统 - 安装脚本
# 原创声明：本脚本为原创，无版权风险
# 许可证：MIT

set -e

echo "========================================"
echo "OpenClaw 对话工具系统 - 安装脚本"
echo "========================================"
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="$HOME/.jvs/.openclaw/workspace"

echo "📂 脚本目录：$SCRIPT_DIR"
echo "📂 工作目录：$WORKSPACE_DIR"
echo ""

# 检查项目是否存在
if [ ! -d "$SCRIPT_DIR" ]; then
    echo "❌ 错误：项目目录不存在"
    exit 1
fi

# 检查必要文件
echo "🔍 检查必要文件..."
REQUIRED_FILES=(
    "core/dialog_hub.js"
    "core/session_manager.js"
    "modules/a2a/agent_protocol.js"
    "skills/skill_registry.js"
    "README.md"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$SCRIPT_DIR/$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file (缺失)"
        exit 1
    fi
done

echo ""
echo "✅ 所有必要文件存在"
echo ""

# 创建符号链接（可选）
echo "🔗 创建符号链接..."
LINK_DIR="$WORKSPACE_DIR/dialog-tools"
if [ -L "$LINK_DIR" ] || [ -d "$LINK_DIR" ]; then
    echo "  ℹ️  符号链接已存在，跳过"
else
    ln -s "$SCRIPT_DIR" "$LINK_DIR"
    echo "  ✅ 已创建符号链接：$LINK_DIR"
fi

echo ""

# 测试 Node.js 环境
echo "🧪 测试 Node.js 环境..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "  ✅ Node.js 版本：$NODE_VERSION"
else
    echo "  ❌ Node.js 未安装"
    exit 1
fi

echo ""

# 运行示例测试
echo "🧪 运行示例测试..."
cd "$SCRIPT_DIR"
if node examples/example-1-basic-chat.js > /tmp/dialog-test-output.txt 2>&1; then
    echo "  ✅ 示例运行成功"
    echo ""
    echo "📊 测试输出（前 20 行）："
    echo "----------------------------------------"
    head -20 /tmp/dialog-test-output.txt
    echo "----------------------------------------"
else
    echo "  ❌ 示例运行失败"
    echo ""
    echo "📄 错误信息："
    cat /tmp/dialog-test-output.txt
    exit 1
fi

echo ""
echo "========================================"
echo "✅ 安装完成！"
echo "========================================"
echo ""
echo "📚 下一步："
echo "  1. 阅读文档：cat README.md"
echo "  2. 快速开始：cat QUICKSTART.md"
echo "  3. 运行示例：node examples/example-1-basic-chat.js"
echo "  4. 查看架构：cat ARCHITECTURE.md"
echo ""
echo "🎉 祝你使用愉快！"
echo ""
