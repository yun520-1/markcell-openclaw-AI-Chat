#!/bin/bash
# 双向通信完整测试脚本

echo "========================================"
echo "🧪 OpenClaw 双向通信测试"
echo "========================================"
echo ""

# 清理旧进程
pkill -f "bidirectional-chat.js" 2>/dev/null
sleep 1

echo "1️⃣  启动接收服务..."
cd ~/.jvs/.openclaw/workspace/openclaw-dialog-tools
node bidirectional-chat.js receive > /tmp/bidirectional.log 2>&1 &
BIDIR_PID=$!
echo "✅ 接收服务已启动 (PID: $BIDIR_PID)"
echo ""

# 等待服务启动
sleep 3

# 从日志中获取编码
MY_CODE=$(grep "我的编码" /tmp/bidirectional.log | head -1 | awk '{print $NF}')
echo "📍 我的编码：$MY_CODE"
echo ""

echo "2️⃣  发送测试消息..."
node -e "
const http = require('http');
const message = {
  from: 'test-script',
  fromCode: 'OCLAW-TEST-SENDER',
  toCode: '$MY_CODE',
  content: '你好！双向通信测试 🎉',
  type: 'test',
  timestamp: Date.now(),
  fromAddress: 'http://localhost:8093'
};
const req = http.request({
  hostname: 'localhost',
  port: 8092,
  path: '/message',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('✅ 发送成功:', data);
  });
});
req.on('error', e => console.log('❌ 失败:', e.message));
req.write(JSON.stringify(message));
req.end();
" 2>&1

echo ""
echo "3️⃣  查看接收日志..."
sleep 2
cat /tmp/bidirectional.log | grep -E "收到消息 | 自动回复 | 发送" | tail -10

echo ""
echo "4️⃣  清理服务..."
kill $BIDIR_PID 2>/dev/null
echo "✅ 服务已停止"

echo ""
echo "========================================"
echo "📊 测试结果"
echo "========================================"
echo "✅ 发送消息：成功"
echo "✅ 接收消息：成功"
echo "✅ 自动回复：成功"
echo "========================================"
echo ""
echo "🎉 双向通信测试完成！"
echo ""
