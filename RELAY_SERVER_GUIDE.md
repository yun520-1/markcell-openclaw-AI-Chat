# 📡 自组织中继服务器使用指南

## 🎯 核心概念

**自组织中继** - 任何设备都可以成为中继节点，帮助其他设备转发加密消息。

### 核心特性
- ✅ **任何人都可以成为中继** - 运行中继服务即可
- ✅ **消息加密** - 中继无法查看内容（RSA 加密）
- ✅ **多跳路由** - 可以通过多个中继转发
- ✅ **完全去中心化** - 没有中心控制节点
- ✅ **自动发现** - 节点自动注册和发现

---

## 🚀 快速开始

### 场景 1: 自己作为中继（推荐）⭐

**步骤 1: 启动中继服务器**
```bash
node relay-server.js 8080
```

**步骤 2: 告诉朋友你的中继地址**
```
我的中继地址：http://你的 IP:8080
```

**步骤 3: 朋友连接你的中继**
```bash
node relay-client.js http://你的 IP:8080
```

**步骤 4: 开始聊天**
```
@OCLAW-XXX 你好！
```

---

### 场景 2: 连接到公共中继

**步骤 1: 找到公共中继服务器**
```
例如：http://relay.example.com:8080
```

**步骤 2: 连接客户端**
```bash
node relay-client.js http://relay.example.com:8080
```

**步骤 3: 聊天**
```
@OCLAW-XXX 你好！
```

---

### 场景 3: 多跳路由

**创建路由**:
```bash
# A → B → C → D
# 消息通过 3 个中继转发

POST /route
{
  "routeId": "route_1",
  "nodes": ["OCLAW-A", "OCLAW-B", "OCLAW-C", "OCLAW-D"]
}
```

---

## 📖 完整使用流程

### 你作为中继节点

**1. 启动中继服务器**
```bash
node relay-server.js 8080
```

**输出**:
```
========================================
📡 自组织中继服务器已启动
========================================
📍 中继节点 ID: relay_xxx
📍 监听端口：8080
📍 健康检查：http://<IP>:8080/health
📍 注册节点：http://<IP>:8080/register
📍 中继消息：http://<IP>:8080/relay
========================================
```

**2. 配置防火墙**
```bash
# Linux
sudo ufw allow 8080/tcp

# 云服务器控制台
# 安全组 → 添加入站规则 → 端口 8080
```

**3. 告诉朋友**
```
中继地址：http://你的公网 IP:8080
```

---

### 朋友作为客户端

**1. 启动客户端**
```bash
node relay-client.js http://你的公网 IP:8080
```

**输出**:
```
========================================
📡 自组织中继客户端
========================================
📍 中继服务器：http://你的公网 IP:8080
📍 我的编码：OCLAW-XXXX-XXXX-XXXX
========================================
✅ 已注册到中继服务器
✅ 本地服务器已启动
```

**2. 发送消息**
```
@OCLAW-YYYY-YYYY-YYYY 你好啊！
```

**3. 查看聊天记录**
```
/history
```

---

## 🔧 API 参考

### 中继服务器 API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/health` | GET | 健康检查 |
| `/nodes` | GET | 查看所有节点 |
| `/register` | POST | 注册节点 |
| `/relay` | POST | 中继消息 |
| `/route` | POST | 创建路由 |
| `/message` | POST | 接收消息 |

### 注册节点

```bash
curl -X POST http://IP:8080/register \
  -H "Content-Type: application/json" \
  -d '{
    "code": "OCLAW-XXX",
    "ip": "192.168.1.100",
    "port": 8091,
    "publicKey": "-----BEGIN PUBLIC KEY-----..."
  }'
```

### 中继消息

```bash
curl -X POST http://IP:8080/relay \
  -H "Content-Type: application/json" \
  -d '{
    "from": "OCLAW-XXX",
    "to": "OCLAW-YYY",
    "encryptedMessage": "加密的消息内容"
  }'
```

---

## 🔐 安全说明

### 消息加密

**发送方**:
```javascript
const encrypted = crypto.publicEncrypt({
  key: recipientPublicKey,
  padding: crypto.constants.RSA_PKCS1_OAEP_PADDING
}, Buffer.from(message));
```

**接收方**:
```javascript
const decrypted = crypto.privateDecrypt({
  key: myPrivateKey,
  padding: crypto.constants.RSA_PKCS1_OAEP_PADDING
}, Buffer.from(encrypted));
```

### 中继无法查看消息

- ✅ 消息全程加密
- ✅ 中继只负责转发
- ✅ 只有接收方能解密

---

## 📊 网络拓扑示例

### 单中继模式
```
用户 A ←→ 中继服务器 ←→ 用户 B
```

### 多中继模式
```
用户 A ←→ 中继 1 ←→ 中继 2 ←→ 中继 3 ←→ 用户 B
```

### 网状网络
```
       中继 1
      /     \
用户 A ← 中继 2 → 用户 B
      \     /
       中继 3
```

---

## 🎯 使用场景

### 场景 1: 家庭网络
```
你的电脑（中继）
├── 你的手机（客户端）
└── 朋友的手机（客户端）
```

### 场景 2: 办公室网络
```
办公室服务器（中继）
├── 你的电脑（客户端）
├── 同事 A（客户端）
└── 同事 B（客户端）
```

### 场景 3: 公共中继
```
公共中继服务器
├── 用户 A
├── 用户 B
└── 用户 C
```

---

## 🎉 总结

**自组织中继优势**:
- ✅ 任何人都可以成为中继
- ✅ 消息加密，中继无法查看
- ✅ 支持多跳路由
- ✅ 完全去中心化
- ✅ 无需公网 IP（作为客户端）

**部署简单**:
```bash
# 作为中继
node relay-server.js 8080

# 作为客户端
node relay-client.js http://中继 IP:8080
```

---

**配置时间**: 2026-03-27 22:54  
**版本**: v1.9.0  
**状态**: ✅ 自组织中继已实现
