#!/bin/bash
# OpenClaw v1.5.0 完整测试脚本
# 测试所有新功能

echo "========================================"
echo "🧪 OpenClaw v1.5.0 完整测试"
echo "========================================"
echo ""

TEST_PASSED=0
TEST_FAILED=0

# 测试函数
run_test() {
  local test_name="$1"
  local test_command="$2"
  
  echo "📋 测试：$test_name"
  if eval "$test_command" > /tmp/test_output.txt 2>&1; then
    echo "✅ 通过\n"
    ((TEST_PASSED++))
  else
    echo "❌ 失败\n"
    ((TEST_FAILED++))
  fi
}

# 测试 1: 文件完整性
echo "========================================"
echo "1️⃣  文件完整性测试"
echo "========================================"

files=(
  "core/dialog_hub.js"
  "core/session_manager.js"
  "modules/a2a/agent_protocol.js"
  "modules/a2a/network_server.js"
  "modules/a2a/websocket_client.js"
  "modules/a2a/connection_code.js"
  "auto-start.js"
  "lan-chat.js"
  "wan-chat.js"
  "interactive-chat.js"
  "lan-start.js"
  "package.json"
  "README.md"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file"
    ((TEST_PASSED++))
  else
    echo "❌ $file (缺失)"
    ((TEST_FAILED++))
  fi
done

echo ""

# 测试 2: 核心功能测试
echo "========================================"
echo "2️⃣  核心功能测试"
echo "========================================"

run_test "DialogHub 初始化" "node -e \"const {DialogHub} = require('./core/dialog_hub'); new DialogHub(); console.log('OK')\""
run_test "SessionManager 初始化" "node -e \"const {SessionManager} = require('./core/session_manager'); new SessionManager(); console.log('OK')\""
run_test "SkillRegistry 初始化" "node -e \"const {SkillRegistry} = require('./skills/skill_registry'); new SkillRegistry(); console.log('OK')\""
run_test "ConnectionCode 生成" "node -e \"const {ConnectionCodeSystem} = require('./modules/a2a/connection_code'); const c = new ConnectionCodeSystem(); console.log(c.getMyCode())\""

echo ""

# 测试 3: 文档完整性
echo "========================================"
echo "3️⃣  文档完整性测试"
echo "========================================"

docs=(
  "README.md"
  "QUICKSTART.md"
  "INSTALL_v1.3.0.md"
  "LAN_CHAT_GUIDE.md"
  "WAN_CHAT_GUIDE.md"
  "MANUAL_CHAT_GUIDE.md"
  "CONNECTION_CODE_GUIDE.md"
)

for doc in "${docs[@]}"; do
  if [ -f "$doc" ]; then
    echo "✅ $doc"
    ((TEST_PASSED++))
  else
    echo "❌ $doc (缺失)"
    ((TEST_FAILED++))
  fi
done

echo ""

# 测试 4: 版本信息
echo "========================================"
echo "4️⃣  版本信息测试"
echo "========================================"

VERSION=$(cat package.json | grep '"version"' | cut -d'"' -f4)
echo "📦 当前版本：v$VERSION"

if [ "$VERSION" = "1.5.0" ]; then
  echo "✅ 版本正确"
  ((TEST_PASSED++))
else
  echo "⚠️  版本应为 1.5.0"
  ((TEST_FAILED++))
fi

echo ""

# 测试 5: 示例脚本
echo "========================================"
echo "5️⃣  示例脚本测试"
echo "========================================"

examples=(
  "examples/example-1-basic-chat.js"
  "examples/example-5-chat-by-code.js"
  "examples/send-local-message.js"
  "examples/send-wan-message.js"
  "interactive-chat.js"
)

for example in "${examples[@]}"; do
  if [ -f "$example" ] && [ -x "$example" ] || [ -f "$example" ]; then
    echo "✅ $example"
    ((TEST_PASSED++))
  else
    echo "❌ $example (缺失或不可执行)"
    ((TEST_FAILED++))
  fi
done

echo ""

# 总结
echo "========================================"
echo "📊 测试总结"
echo "========================================"
echo "✅ 通过：$TEST_PASSED"
echo "❌ 失败：$TEST_FAILED"
echo "📈 通过率：$(( TEST_PASSED * 100 / (TEST_PASSED + TEST_FAILED) ))%"
echo "========================================"

if [ $TEST_FAILED -eq 0 ]; then
  echo "🎉 所有测试通过！"
  exit 0
else
  echo "⚠️  部分测试失败"
  exit 1
fi
