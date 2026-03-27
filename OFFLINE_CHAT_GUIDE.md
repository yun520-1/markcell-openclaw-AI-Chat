# 💬 OpenClaw 离线聊天系统使用指南

## 🎯 什么是离线聊天？

**离线聊天系统**不需要持续运行的服务器，只需要知道对方的：
- IP 地址
- 连接编码

就可以直接发送消息！

---

## 🚀 快速开始

### 方式 1: 命令行发送（最简单）

```bash
node offline-chat.js [对方 IP] [对方编码] [消息内容]
```

**示例**:
```bash
node offline-chat.js 192.168.3.194 OCLAW-CECB-2C97-44F3 你好，测试消息！
```

### 方式 2: 交互模式

```bash
node offline-chat.js
```

然后输入：
```
192.168.3.194 OCLAW-XXX 你好
```

---

## 📋 完整使用流程

### 步骤 1: 启动离线聊天

```bash
cd ~/.jvs/.openclaw/workspace/openclaw-dialog-tools
node offline-chat.js
```

**输出**:
```
========================================
💬 OpenClaw 离线聊天系统
========================================

我的编码：OCLAW-XXXX-XXXX-XXXX

========================================
💡 使用说明
========================================
1. 输入：IP 编码 消息内容
   例如：192.168.3.194 OCLAW-XXX 你好
2. /history - 查看消息历史
3. /report - 生成聊天报告
4. /quit - 退出
========================================

你：
```

### 步骤 2: 发送消息

```
你：192.168.3.194 OCLAW-CECB-2C97-44F3 你好，新版本测试！

📤 发送消息到 http://192.168.3.194:1234
内容：你好，新版本测试！
我的编码：OCLAW-YYYY-YYYY-YYYY
目标编码：OCLAW-CECB-2C97-44F3

✅ 发送成功！
消息 ID: msg_xxx
状态：received
```

### 步骤 3: 查看历史

```
你：/history

========================================
📋 消息历史
========================================
1. 📤 [2026-03-27 20:45:00] 你好，新版本测试！
```

### 步骤 4: 生成报告

```
你：/report

========================================
📊 聊天报告
========================================
我的编码：OCLAW-YYYY-YYYY-YYYY
总消息数：1
发送：1
接收：0
生成时间：2026-03-27T20:45:00.000Z
========================================
```

---

## 🔧 命令行参数

### 快速发送

```bash
node offline-chat.js <IP> <编码> <消息>
```

**示例**:
```bash
# 本地测试
node offline-chat.js localhost OCLAW-XXX 你好

# 内网通信
node offline-chat.js 192.168.3.194 OCLAW-XXX 测试

# 外网通信（需要公网 IP）
node offline-chat.js 1.2.3.4 OCLAW-XXX 跨网络消息
```

---

## 🌐 使用场景

### 场景 1: 本地测试

**终端 1**: 启动 wan-chat.js
```bash
node wan-chat.js
```

**终端 2**: 发送消息
```bash
node offline-chat.js localhost OCLAW-XXX 你好
```

### 场景 2: 内网通信

**用户 A**: 启动 wan-chat.js
```bash
node wan-chat.js
# 记录 IP: 192.168.3.194
```

**用户 B**: 发送消息
```bash
node offline-chat.js 192.168.3.194 OCLAW-A 的编码 你好
```

### 场景 3: 外网通信

**用户 A**（云服务器）:
```bash
node wan-chat.js
# 公网 IP: 1.2.3.4
# 编码：OCLAW-AAAA-BBBB-CCCC
```

**用户 B**（本地）:
```bash
node offline-chat.js 1.2.3.4 OCLAW-AAAA-BBBB-CCCC 跨网络消息
```

---

## 📊 命令说明

| 命令 | 说明 |
|------|------|
| `IP 编码 消息` | 发送消息到指定目标 |
| `/history` | 查看消息历史 |
| `/report` | 生成聊天报告 |
| `/quit` | 退出并显示报告 |

---

## 🎯 完整示例

### 示例 1: 发送单条消息

```bash
node offline-chat.js 192.168.3.194 OCLAW-CECB-2C97-44F3 "你好，这是测试消息！"
```

### 示例 2: 交互式聊天

```bash
node offline-chat.js
```

然后：
```
你：192.168.3.194 OCLAW-XXX 第一条消息
你：192.168.3.194 OCLAW-XXX 第二条消息
你：/history
你：/report
你：/quit
```

### 示例 3: 批量发送

```bash
# 创建脚本
cat > send-messages.sh << 'EOF'
#!/bin/bash
node offline-chat.js 192.168.3.194 OCLAW-XXX "消息 1"
node offline-chat.js 192.168.3.194 OCLAW-XXX "消息 2"
node offline-chat.js 192.168.3.194 OCLAW-XXX "消息 3"
EOF

chmod +x send-messages.sh
./send-messages.sh
```

---

## 📖 消息格式

### 发送的消息

```json
{
  "from": "offline-user",
  "fromCode": "OCLAW-XXXX-XXXX-XXXX",
  "toCode": "OCLAW-YYYY-YYYY-YYYY",
  "content": "你好",
  "type": "offline-message",
  "timestamp": 1234567890
}
```

### 接收的响应

```json
{
  "status": "received",
  "messageId": "msg_xxx",
  "timestamp": 1234567890
}
```

---

## ⚠️ 注意事项

### 1. 目标服务必须运行

离线聊天不需要你自己运行服务器，但**目标必须运行 wan-chat.js** 才能接收消息。

### 2. 需要网络连接

- 本地：localhost 或 192.168.x.x
- 外网：需要公网 IP 和端口转发

### 3. 消息不存储

离线聊天系统不存储接收的消息，只记录你发送的消息历史。

---

## 🎉 总结

**离线聊天系统优势**:
- ✅ 不需要持续运行服务器
- ✅ 知道 IP 和编码就能发送
- ✅ 命令行和交互两种模式
- ✅ 自动记录消息历史
- ✅ 生成聊天报告

**使用方式**:
```bash
# 快速发送
node offline-chat.js IP 编码 消息

# 交互模式
node offline-chat.js
```

---

**配置时间**: 2026-03-27  
**版本**: v1.5.0  
**状态**: ✅ 离线聊天已实现
