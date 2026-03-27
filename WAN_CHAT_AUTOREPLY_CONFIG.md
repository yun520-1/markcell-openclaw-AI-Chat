# ⚙️ wan-chat.js 自动回复配置说明

## ✅ 当前配置状态

wan-chat.js **已经配置了自动回复功能**！

---

## 📋 自动回复逻辑

wan-chat.js 包含以下自动回复逻辑：

### 1. 消息监听

```javascript
this.server.on('message', async (msg) => {
  console.log('📥 收到外网消息');
  
  // 保存对话历史
  this.saveConversation(msg.fromCode || msg.from, msg);
  
  // 生成智能回复
  const reply = this.generateReply(msg.content, msg.fromCode || msg.from);
  
  // 自动回复
  if (msg.fromAddress) {
    await this.server.sendToRemote(`${msg.fromAddress}/message`, replyMessage);
  } else {
    console.log('⚠️  无法发送回复（对方未提供地址）');
  }
});
```

### 2. 智能回复内容

| 收到的消息 | 自动回复 |
|----------|---------|
| "你好" / "hello" | "你好！我是 OpenClaw 外网对话服务！..." |
| "你叫什么名字" | "我是 markcell-openclaw-AI Chat 外网对话服务..." |
| "你有什么功能" | "我支持外网跨网络通信！..." |
| "你的编码是什么" | "我的连接编码是：OCLAW-XXX..." |
| "谢谢" | "不客气！外网通信就是这么简单！😊" |
| "再见" | "再见！期待下次通过互联网交流！👋" |
| 其他 | "收到你的外网消息：xxx..." |

---

## 🔧 配置要求

### 发送消息时必须提供

```javascript
{
  from: 'sender-name',
  fromCode: 'OCLAW-XXX',
  toCode: 'OCLAW-YYY',
  content: '你好',
  type: 'message',
  timestamp: Date.now(),
  fromAddress: 'http://localhost:8090'  // ⚠️ 必须提供！
}
```

**重要**: 必须提供 `fromAddress`，否则无法发送回复！

---

## 🧪 测试方法

### 方式 1: 使用测试脚本

```bash
node examples/send-local-message.js
```

这个脚本会自动提供 `fromAddress`。

### 方式 2: 使用 curl

```bash
curl -X POST http://localhost:1234/message \
  -H "Content-Type: application/json" \
  -d '{
    "from": "test",
    "fromCode": "OCLAW-TEST",
    "toCode": "OCLAW-TARGET",
    "content": "你好",
    "type": "message",
    "timestamp": '$(date +%s)',
    "fromAddress": "http://localhost:8090"
  }'
```

**注意**: curl 测试**不会收到回复**，因为 curl 不是持续运行的服务器。

### 方式 3: 使用另一个 wan-chat.js 实例

在另一个终端启动 wan-chat.js，然后互相发送消息。

---

## ⚠️ 常见问题

### 问题 1: 没有收到回复

**原因**: 
- 发送消息时未提供 `fromAddress`
- 或者发送方不是持续运行的服务器

**解决**: 
- 确保消息中包含 `fromAddress`
- 使用持续运行的服务器接收回复

### 问题 2: 回复发送失败

**原因**:
- `fromAddress` 地址不可达
- 或者发送方的服务器已停止

**解决**:
- 确保 `fromAddress` 指向的服务器正在运行
- 检查防火墙设置

### 问题 3: 本地测试收不到回复

**原因**:
- 本地测试脚本可能已停止运行
- 或者端口冲突

**解决**:
- 使用 `send-local-message.js` 测试
- 确保端口不冲突（使用不同端口）

---

## 📊 配置检查清单

- [x] wan-chat.js 已包含自动回复逻辑
- [x] generateReply 函数已实现
- [x] 消息监听器已配置
- [x] 回复发送逻辑已实现
- [ ] 发送方提供 `fromAddress`（由发送方决定）
- [ ] 发送方服务器持续运行（接收回复）

---

## 🎯 完整的本地测试流程

### 终端 1: 启动外网服务

```bash
cd ~/.qclaw/workspace/skills/markcell-openclaw-ai-chat
node wan-chat.js
```

**保持运行，不要关闭！**

### 终端 2: 发送测试消息

```bash
cd ~/.jvs/.openclaw/workspace/openclaw-dialog-tools
node examples/send-local-message.js
```

**等待 30 秒，应该会收到回复！**

---

## 🎉 总结

**wan-chat.js 的自动回复功能已经配置完成！**

### 已实现功能
- ✅ 智能回复生成
- ✅ 消息监听
- ✅ 回复发送逻辑
- ✅ 对话历史保存

### 使用要求
- ⚠️ 发送消息必须提供 `fromAddress`
- ⚠️ 发送方必须是持续运行的服务器

### 测试方法
```bash
# 终端 1
node wan-chat.js

# 终端 2
node examples/send-local-message.js
```

---

**配置时间**: 2026-03-27  
**版本**: v1.4.0  
**状态**: ✅ 自动回复已配置
