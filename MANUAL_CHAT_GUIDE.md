# 💬 OpenClaw 人工对话配置指南

## 🎯 目标

实现**两个人工之间的实时对话**，而不是自动回复。

---

## 🚀 快速开始

### 方式 1: 交互式对话客户端（推荐）⭐

**终端 1（用户 A）**:
```bash
cd ~/.jvs/.openclaw/workspace/openclaw-dialog-tools
node interactive-chat.js http://localhost:1234 OCLAW-TARGET
```

**终端 2（用户 B）**:
```bash
cd ~/.qclaw/workspace/skills/markcell-openclaw-ai-chat
node wan-chat.js
```

现在两个人可以互相发消息聊天了！

---

### 方式 2: 两个 wan-chat.js 实例

**终端 1（用户 A）**:
```bash
cd ~/.jvs/.openclaw/workspace/openclaw-dialog-tools
node wan-chat.js
# 记录端口和编码
```

**终端 2（用户 B）**:
```bash
cd ~/.qclaw/workspace/skills/markcell-openclaw-ai-chat
node wan-chat.js
# 记录端口和编码
```

然后互相发送消息。

---

## 📋 交互式对话客户端使用说明

### 启动

```bash
node interactive-chat.js [目标地址] [目标编码]
```

**示例**:
```bash
# 连接到本地的 wan-chat 服务
node interactive-chat.js http://localhost:1234 OCLAW-F519-A7DB-2310
```

### 命令

| 命令 | 说明 |
|------|------|
| `/quit` 或 `/exit` | 退出对话 |
| `/help` | 查看帮助 |
| `/status` | 查看状态 |
| 其他输入 | 作为消息发送 |

### 使用流程

```
========================================
💬 OpenClaw 交互式对话客户端
========================================

📍 我的连接编码：OCLAW-XXX
📍 目标地址：http://localhost:1234
📍 目标编码：OCLAW-YYY

🚀 启动对话服务器...
✅ 服务器已启动

========================================
💡 使用说明
========================================
1. 输入消息后按 Enter 发送
2. 输入 /quit 退出对话
3. 输入 /help 查看帮助
4. 输入 /status 查看状态
========================================

🎯 开始对话！输入消息后按 Enter 发送

你：你好！

📤 发送中...
✅ 发送成功！

========================================
📥 收到消息
========================================
来自：OCLAW-YYY
内容：你好！最近怎么样？
时间：2026-03-27 20:05:00
========================================

你：我很好，谢谢！
```

---

## 🌐 外网人工对话

### 用户 A（云服务器）

**步骤 1: 启动 wan-chat.js**
```bash
cd ~/.qclaw/workspace/skills/markcell-openclaw-ai-chat
node wan-chat.js
```

**记录信息**:
```
连接编码：OCLAW-AAAA-BBBB-CCCC
公网 IP: 1.2.3.4
端口：1234
外网地址：http://1.2.3.4:1234
```

**步骤 2: 配置防火墙**
- 云服务器控制台 → 安全组 → 开放端口 1234

### 用户 B（本地电脑）

**启动交互式客户端**:
```bash
node interactive-chat.js http://1.2.3.4:1234 OCLAW-AAAA-BBBB-CCCC
```

### 开始对话

现在两个人可以跨网络聊天了！

---

## 🏠 本地人工对话

### 同一台电脑上的两个终端

**终端 1**:
```bash
node wan-chat.js
# 端口：1234
# 编码：OCLAW-F519-A7DB-2310
```

**终端 2**:
```bash
node interactive-chat.js http://localhost:1234 OCLAW-F519-A7DB-2310
```

### 对话示例

```
终端 2（你）: 你好！
终端 1（对方）: 你好！有什么事吗？
终端 2（你）: 想测试一下外网对话功能
终端 1（对方）: 好的，功能正常吗？
终端 2（你）: 正常！可以正常聊天了！
```

---

## 📊 对比：自动回复 vs 人工对话

| 特性 | 自动回复 | 人工对话 |
|------|---------|---------|
| **回复来源** | 程序自动生成 | 人工输入 |
| **灵活性** | ⭐⭐ 固定回复 | ⭐⭐⭐⭐⭐ 自由对话 |
| **配置复杂度** | ⭐⭐⭐⭐⭐ 自动 | ⭐⭐⭐ 需要客户端 |
| **适用场景** | 测试、演示 | 真实对话 |

---

## 🎯 完整配置步骤

### 步骤 1: 对方启动 wan-chat.js

```bash
cd ~/.qclaw/workspace/skills/markcell-openclaw-ai-chat
node wan-chat.js
```

**记录输出**:
```
📍 连接编码：OCLAW-F519-A7DB-2310
📍 端口：1234
```

### 步骤 2: 你启动 interactive-chat.js

```bash
cd ~/.jvs/.openclaw/workspace/openclaw-dialog-tools
node interactive-chat.js http://localhost:1234 OCLAW-F519-A7DB-2310
```

### 步骤 3: 开始对话

在交互式客户端中输入消息，按 Enter 发送。

对方会在 wan-chat.js 的终端看到消息，但**无法回复**（因为 wan-chat.js 是自动回复的）。

---

## ⚠️ 重要说明

### wan-chat.js 是自动回复的

wan-chat.js 设计为**自动回复服务**，不适合人工对话。

### 如果要人工对话

**两个用户都需要运行 interactive-chat.js**：

**用户 A**:
```bash
node interactive-chat.js http://用户 B 的 IP:8091 用户 B 的编码
```

**用户 B**:
```bash
node interactive-chat.js http://用户 A 的 IP:8091 用户 A 的编码
```

这样两个人都可以输入消息并收到对方的消息。

---

## 🎉 总结

### 自动回复（wan-chat.js）
- ✅ 适合测试、演示
- ✅ 配置简单
- ❌ 不能人工对话

### 人工对话（interactive-chat.js）
- ✅ 可以真正聊天
- ✅ 支持本地和外网
- ⚠️ 需要两个终端

### 推荐方案

**本地测试**:
```bash
# 终端 1
node wan-chat.js

# 终端 2
node interactive-chat.js http://localhost:1234 OCLAW-XXX
```

**外网对话**:
```bash
# 用户 A（云服务器）
node interactive-chat.js

# 用户 B（本地）
node interactive-chat.js http://用户 A 的 IP:8091 用户 A 的编码
```

---

**配置时间**: 2026-03-27  
**版本**: v1.4.0  
**状态**: ✅ 人工对话已实现
