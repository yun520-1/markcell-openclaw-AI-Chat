# 💬 OpenClaw 内网双向对话指南

## ✅ 内网对话功能已实现

**两个 OpenClaw 实例现在可以在内网中进行完整的双向对话！**

---

## 🚀 快速开始

### 方式 1: 启动内网对话服务（推荐）

在**设备 A**上：

```bash
cd ~/.jvs/.openclaw/workspace/openclaw-dialog-tools
node lan-chat.js
```

**输出**:
```
========================================
💬 OpenClaw 内网对话服务
========================================

📍 连接编码：OCLAW-XXXX-XXXX-XXXX
📍 局域网 IP: 192.168.x.x
📍 内网地址：http://192.168.x.x:8080

✅ 内网对话服务已启动，等待连接...

💡 功能:
  - 自动接收内网消息
  - 智能回复消息
  - 保存对话历史
```

在**设备 B**上（同一局域网）：

```bash
cd ~/.jvs/.openclaw/workspace/openclaw-dialog-tools
node lan-chat.js
```

然后两个设备可以互相发送消息！

---

### 方式 2: 使用客户端测试

在**设备 A**上启动服务：

```bash
node lan-chat.js
```

在**设备 B**上发送消息：

```bash
node examples/example-real-chat.js client <设备 A 的编码> http://<设备 A 的 IP>:8080
```

---

## 🎯 完整对话示例

### 设备 A（192.168.3.194）

```bash
node lan-chat.js
```

**输出**:
```
📍 连接编码：OCLAW-AAAA-BBBB-CCCC
📍 内网地址：http://192.168.3.194:8080
```

### 设备 B（192.168.3.100）

```bash
node lan-chat.js
```

**输出**:
```
📍 连接编码：OCLAW-DDDD-EEEE-FFFF
📍 内网地址：http://192.168.3.100:8080
```

### 发送测试消息

在**设备 B**上打开另一个终端：

```bash
node examples/send-lan-message.js
```

**对话流程**:
```
设备 B 发送：你叫什么名字？
    ↓
设备 A 接收并自动回复
    ↓
设备 A 回复：我是 markcell-openclaw-AI Chat 内网对话服务！
    ↓
设备 B 收到回复
```

---

## 💡 智能回复功能

### 支持的自动回复

| 消息内容 | 自动回复 |
|---------|---------|
| "你好" / "hello" | "你好！我是 OpenClaw 内网对话服务！😊" |
| "你叫什么名字" | "我是 markcell-openclaw-AI Chat..." |
| "你有什么功能" | "我支持三种对话模式..." |
| "你的编码是什么" | "我的连接编码是：OCLAW-XXX..." |
| "谢谢" | "不客气！随时为你服务！😊" |
| "再见" | "再见！期待下次交流！👋" |
| 其他 | "收到你的消息：xxx。有什么我可以帮助你的吗？😊" |

### 对话历史

系统会保存最近 20 条对话历史，支持基于上下文的智能回复。

---

## 🔧 配置选项

### 修改端口

编辑 `lan-chat.js`:

```javascript
this.server = new NetworkServer({
  port: 8080,  // 修改这里
  host: '0.0.0.0'
});
```

### 修改自动回复

编辑 `generateReply` 函数：

```javascript
generateReply(content, fromCode) {
  if (content.includes('自定义关键词')) {
    return '自定义回复内容';
  }
  // ...
}
```

---

## 📖 使用场景

### 场景 1: 家庭多设备对话

```
家庭 WiFi (192.168.3.x)
├── 电脑 A (192.168.3.194) - OpenClaw 服务
├── 电脑 B (192.168.3.100) - OpenClaw 服务
└── 手机/平板 - 可以连接
```

**用法**:
- 两台电脑互相发送消息
- 测试内网通信
- 搭建私有聊天系统

### 场景 2: 办公室协作

```
办公室网络
├── 你的电脑 - OpenClaw 服务
├── 同事电脑 1 - OpenClaw 服务
├── 同事电脑 2 - OpenClaw 服务
```

**用法**:
- 办公室内部消息系统
- 文件传输中转
- 任务协调

### 场景 3: 实验室/教室

```
学校网络
├── 教师电脑
├── 学生电脑 1
├── 学生电脑 2
```

**用法**:
- 教学演示
- 实验环境
- 学习 OpenClaw

---

## 🧪 测试命令

### 测试 1: 本地服务

```bash
node lan-chat.js
```

### 测试 2: 发送消息

```bash
node examples/send-lan-message.js
```

### 测试 3: 客户端对话

```bash
node examples/example-real-chat.js client <编码> http://<IP>:8080
```

### 测试 4: 查看连接信息

```bash
cat lan-chat-info.txt
```

---

## 🎯 完整对话流程

### 步骤 1: 在设备 A 启动

```bash
node lan-chat.js
```

**输出**:
```
📍 连接编码：OCLAW-AAAA-BBBB-CCCC
📍 内网地址：http://192.168.3.194:8080
✅ 服务已启动
```

### 步骤 2: 在设备 B 启动

```bash
node lan-chat.js
```

**输出**:
```
📍 连接编码：OCLAW-DDDD-EEEE-FFFF
📍 内网地址：http://192.168.3.100:8080
✅ 服务已启动
```

### 步骤 3: 设备 B 发送消息到设备 A

在设备 B 上打开新终端：

```bash
node examples/send-lan-message.js
```

**自动扫描并发送**:
```
📍 尝试发送到：http://192.168.3.194:8080
✅ 发送成功！

⏳ 等待回复...
📥 收到回复！
内容：我是 markcell-openclaw-AI Chat 内网对话服务！
```

### 步骤 4: 继续对话

重复步骤 3，继续发送消息！

---

## 📊 对话统计

### 查看对话历史

```javascript
// 在 lan-chat.js 中
console.log('对话历史:');
for (const [code, conv] of this.conversations) {
  console.log(`\n与 ${code} 的对话:`);
  conv.messages.forEach(msg => {
    console.log(`  - ${msg.content}`);
  });
}
```

---

## 🎉 总结

**内网双向对话已实现！**

### 功能
- ✅ 自动接收消息
- ✅ 智能回复消息
- ✅ 保存对话历史
- ✅ 支持多个设备
- ✅ 无需公网 IP
- ✅ 无需端口转发

### 使用方式
1. 在设备上运行 `node lan-chat.js`
2. 在另一台设备上运行相同命令
3. 互相发送消息测试对话

### 优势
- ⭐ 配置简单
- ⭐ 速度快，延迟低
- ⭐ 安全可靠
- ⭐ 支持智能回复

---

**实现时间**: 2026-03-27 12:15  
**状态**: ✅ 内网双向对话已实现  
**功能**: 自动接收、智能回复、对话历史

💬 **两个 OpenClaw 实例现在可以在内网中完整对话了！**
