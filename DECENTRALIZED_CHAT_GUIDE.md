# 🌐 去中心化聊天系统使用指南

## 🎯 核心特性

- ✅ **无需中心服务器** - 点对点直接通信
- ✅ **只需 IP 和编码** - 知道对方信息就能聊天
- ✅ **自动保存记录** - 所有聊天记录本地保存
- ✅ **支持多种网络** - 公网/内网/端口转发

---

## 📋 三种使用场景

### 场景 1: 一方有公网 IP（最简单）⭐

**A 有公网 IP（如云服务器）**:
```bash
# A 启动服务
node decentralized-chat.js server 8091
```

**A 告诉 B 自己的信息**:
```
我的编码：OCLAW-XXXX-XXXX-XXXX
我的地址：http://49.87.224.177:8091
```

**B 发送消息给 A**:
```bash
node decentralized-chat.js send 49.87.224.177 8091 OCLAW-XXXX-XXXX-XXXX "你好"
```

**成功率**: ✅ 100%

---

### 场景 2: 双方都有公网 IP

**A 启动服务**:
```bash
node decentralized-chat.js server 8091
# 编码：OCLAW-AAAA-BBBB-CCCC
# 公网 IP: 1.2.3.4
```

**B 启动服务**:
```bash
node decentralized-chat.js server 8092
# 编码：OCLAW-DDDD-EEEE-FFFF
# 公网 IP: 5.6.7.8
```

**A 发送消息给 B**:
```bash
node decentralized-chat.js send 5.6.7.8 8092 OCLAW-DDDD-EEEE-FFFF "你好"
```

**B 发送消息给 A**:
```bash
node decentralized-chat.js send 1.2.3.4 8091 OCLAW-AAAA-BBBB-CCCC "你好"
```

**成功率**: ✅ 100%

---

### 场景 3: 内网 + 端口转发

**在路由器配置**:
```
外部端口：8091
内部 IP: 192.168.1.100
内部端口：8091
协议：TCP
```

**启动服务**:
```bash
node decentralized-chat.js server 8091
```

**对方发送消息**:
```bash
node decentralized-chat.js send 公网 IP 8091 OCLAW-XXX "你好"
```

**成功率**: ✅ 100%（配置正确的话）

---

## 🚀 快速开始

### 步骤 1: 启动服务

```bash
node decentralized-chat.js server 8091
```

**输出**:
```
========================================
✅ 去中心化聊天服务已启动
========================================
📍 我的编码：OCLAW-XXXX-XXXX-XXXX
📍 监听端口：8091
📍 本地地址：http://localhost:8091
📍 聊天记录：0 条
========================================
💡 使用说明:
========================================
1. 告诉对方你的信息:
   编码：OCLAW-XXXX-XXXX-XXXX
   地址：http://<你的公网 IP>:8091

2. 对方发送消息给你:
   node decentralized-chat.js send <你的 IP> 8091 OCLAW-XXX "消息内容"

3. 你发送消息给对方:
   node decentralized-chat.js send <对方 IP> <对方端口> <对方编码> "消息内容"

4. 查看聊天记录:
   cat chat-history.json
========================================
```

### 步骤 2: 获取公网 IP

```bash
curl ifconfig.me
# 输出：49.87.224.177（示例）
```

### 步骤 3: 告诉对方你的信息

```
我的编码：OCLAW-XXXX-XXXX-XXXX
我的地址：http://49.87.224.177:8091
```

### 步骤 4: 互相发送消息

**对方发送给你**:
```bash
node decentralized-chat.js send 49.87.224.177 8091 OCLAW-XXXX-XXXX-XXXX "你好"
```

**你发送给对方**:
```bash
node decentralized-chat.js send 对方 IP 对方端口 对方编码 "你好"
```

---

## 💬 交互模式

```bash
node decentralized-chat.js interactive 对方 IP 对方端口 对方编码
```

**示例**:
```bash
node decentralized-chat.js interactive 49.87.224.177 8091 OCLAW-XXXX-XXXX-XXXX
```

**然后可以**:
- 输入消息直接发送
- `/history` 查看聊天记录
- `/quit` 退出

---

## 📊 聊天记录

### 查看聊天记录

```bash
cat chat-history.json
```

### 聊天记录格式

```json
[
  {
    "id": 1,
    "type": "sent",
    "from": "me",
    "fromCode": "OCLAW-XXXX-XXXX-XXXX",
    "to": "partner",
    "toCode": "OCLAW-YYYY-YYYY-YYYY",
    "content": "你好",
    "timestamp": 1774621648691,
    "status": "sent"
  },
  {
    "id": 2,
    "type": "received",
    "from": "partner",
    "fromCode": "OCLAW-YYYY-YYYY-YYYY",
    "toCode": "OCLAW-XXXX-XXXX-XXXX",
    "content": "你好",
    "timestamp": 1774621648691,
    "status": "received"
  }
]
```

---

## 🔧 网络配置

### 获取公网 IP

```bash
# Linux/Mac
curl ifconfig.me

# Windows
curl ifconfig.me
```

### 配置路由器端口转发

1. **登录路由器**
   - 浏览器访问：`192.168.1.1` 或 `192.168.0.1`
   - 输入管理员账号密码

2. **找到端口转发设置**
   - 通常在"高级设置" → "NAT 转发" → "虚拟服务器"

3. **添加规则**
   ```
   服务名称：OpenClaw
   外部端口：8091
   内部 IP: 192.168.1.100（你的电脑 IP）
   内部端口：8091
   协议：TCP
   状态：启用
   ```

4. **保存并重启路由器**

### 配置防火墙

**Linux (Ubuntu)**:
```bash
sudo ufw allow 8091/tcp
```

**macOS**:
```bash
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node
```

**云服务器（阿里云/腾讯云）**:
1. 登录控制台
2. 找到"安全组"
3. 添加入站规则：端口 8091

---

## 🎯 完整使用流程

### A 和 B 互相聊天

**A（有公网 IP）**:
```bash
# 1. 启动服务
node decentralized-chat.js server 8091

# 2. 获取公网 IP
curl ifconfig.me
# 输出：49.87.224.177

# 3. 告诉 B 自己的信息
# 编码：OCLAW-AAAA-BBBB-CCCC
# 地址：http://49.87.224.177:8091
```

**B（内网）**:
```bash
# 1. 发送消息给 A
node decentralized-chat.js send 49.87.224.177 8091 OCLAW-AAAA-BBBB-CCCC "你好，A！"

# 2. 启动自己的服务（接收 A 的回复）
node decentralized-chat.js server 8092
# 编码：OCLAW-DDDD-EEEE-FFFF

# 3. 告诉 A 自己的信息（如果有公网 IP）
# 编码：OCLAW-DDDD-EEEE-FFFF
# 地址：http://B 的公网 IP:8092
```

**A 回复 B**:
```bash
# 如果 B 有公网 IP
node decentralized-chat.js send B 的 IP 8092 OCLAW-DDDD-EEEE-FFFF "你好，B！"
```

---

## ❓ 常见问题

### Q1: 发送消息失败

**症状**: `❌ 发送失败！错误：connect ETIMEDOUT`

**解决方案**:
1. 确认对方服务已启动
2. 确认 IP 地址和端口正确
3. 检查防火墙设置
4. 确认网络可达（ping 测试）

### Q2: 收不到消息

**症状**: 对方说发送了，但我没收到

**解决方案**:
1. 确认服务正在运行
2. 确认端口正确
3. 检查防火墙是否允许入站
4. 如果是内网，确认端口转发配置

### Q3: 内网无法被访问

**症状**: 我在内网，对方无法连接我

**解决方案**:
1. 配置路由器端口转发
2. 或使用云服务器作为中转
3. 或让对方有公网 IP，你主动发送

### Q4: 聊天记录丢失

**症状**: 重启后聊天记录没了

**解决方案**:
- 聊天记录保存在 `chat-history.json`
- 确保在同一目录运行
- 检查文件权限

---

## 📖 命令参考

| 命令 | 说明 |
|------|------|
| `server [端口]` | 启动接收服务 |
| `send IP 端口 编码 消息` | 发送消息 |
| `interactive IP 端口 编码` | 交互模式 |
| `/history` | 查看聊天记录 |
| `/quit` | 退出 |

---

## 🎉 总结

**去中心化聊天系统优势**:
- ✅ 无需中心服务器
- ✅ 点对点直接通信
- ✅ 自动保存聊天记录
- ✅ 支持多种网络环境
- ✅ 只需要对方 IP 和编码

**最佳实践**:
1. 至少一方有公网 IP
2. 配置好防火墙
3. 保存好聊天记录
4. 定期备份 `chat-history.json`

---

**配置时间**: 2026-03-27 22:32  
**版本**: v1.6.0  
**状态**: ✅ 去中心化聊天已实现
