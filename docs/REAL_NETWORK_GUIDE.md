# 🌐 真实网络连接使用指南

通过**真实 HTTP/网络**实现 OpenClaw 实例之间的通信！

---

## 📋 目录

1. [两种通信模式](#两种通信模式)
2. [HTTP 模式（推荐）](#http 模式推荐)
3. [WebSocket 模式](#websocket 模式)
4. [跨网络通信](#跨网络通信)
5. [实际部署](#实际部署)

---

## 两种通信模式

### HTTP 模式 ⭐ 推荐

**优点**:
- ✅ 无需额外依赖
- ✅ Node.js 原生支持
- ✅ 穿透防火墙能力强
- ✅ 易于调试

**适用场景**:
- 局域网内通信
- 跨网络通信
- 生产环境部署

### WebSocket 模式

**优点**:
- ✅ 实时双向通信
- ✅ 低延迟
- ✅ 连接保持

**适用场景**:
- 需要实时性的场景
- 高频消息交换
- 需要推送通知

**要求**: 需要安装 `ws` 库
```bash
npm install ws
```

---

## HTTP 模式（推荐）

### 快速开始

#### 1. 启动网络服务器

```javascript
const { NetworkServer } = require('./modules/a2a/network_server');

// 创建服务器
const server = new NetworkServer({
  port: 8080,           // 监听端口
  host: '0.0.0.0',      // 监听地址
  agentId: 'my-agent',  // Agent ID
  connectionCode: 'OCLAW-XXXX-XXXX-XXXX'  // 连接编码
});

// 启动服务器
await server.start();
console.log('服务器已启动：http://localhost:8080');
```

#### 2. 监听消息

```javascript
server.on('message', (msg) => {
  console.log(`收到消息 from ${msg.from}: ${msg.content}`);
  
  // 处理消息逻辑
  // ...
});
```

#### 3. 发送消息

```javascript
// 发送到远程服务器
const result = await server.sendToRemote('http://target-ip:8080/message', {
  from: 'my-agent',
  content: '你好！',
  type: 'message',
  timestamp: Date.now()
});

console.log('发送结果:', result);
```

### 完整示例

```javascript
const { NetworkServer } = require('./modules/a2a/network_server');

async function httpExample() {
  // 创建服务器
  const server = new NetworkServer({
    port: 8080,
    agentId: 'alice',
    connectionCode: 'OCLAW-AAAA-BBBB-CCCC'
  });
  
  // 启动服务器
  await server.start();
  
  // 监听消息
  server.on('message', async (msg) => {
    console.log(`Alice 收到：${msg.content}`);
    
    // 回复消息
    if (msg.content.includes('你好')) {
      await server.sendToRemote(`http://localhost:8081/message`, {
        from: 'alice',
        content: '你好！收到你的消息了！',
        type: 'reply',
        timestamp: Date.now()
      });
    }
  });
  
  console.log('Alice 服务器已就绪');
}

httpExample();
```

---

## WebSocket 模式

### 安装依赖

```bash
npm install ws
```

### 服务器端

```javascript
const { WebSocketServer } = require('./modules/a2a/websocket_client');

const wsServer = new WebSocketServer({
  port: 8081,
  host: '0.0.0.0'
});

// 启动服务器
await wsServer.start();

// 监听消息
wsServer.on('message', (msg) => {
  console.log(`收到 WebSocket 消息:`, msg);
  
  // 广播给所有客户端
  wsServer.broadcast({
    type: 'broadcast',
    content: '新消息！',
    from: msg.clientId
  });
});
```

### 客户端

```javascript
const { WebSocketClient } = require('./modules/a2a/websocket_client');

const client = new WebSocketClient({
  url: 'ws://localhost:8081',
  agentId: 'ws-client',
  connectionCode: 'OCLAW-1111-2222-3333'
});

// 监听事件
client.on('connect', () => {
  console.log('WebSocket 连接成功！');
});

client.on('message', (msg) => {
  console.log('收到消息:', msg);
});

// 连接
await client.connect();

// 发送消息
client.send({
  type: 'message',
  content: '你好！',
  timestamp: Date.now()
});
```

---

## 跨网络通信

### 场景 1: 局域网通信

#### 服务器 A（192.168.1.100）

```javascript
const server = new NetworkServer({
  port: 8080,
  host: '0.0.0.0',  // 监听所有网络接口
  agentId: 'server-a'
});

await server.start();
console.log('服务器 A 已启动');
```

#### 服务器 B（192.168.1.101）

```javascript
const serverB = new NetworkServer({
  port: 8080,
  host: '0.0.0.0',
  agentId: 'server-b'
});

await serverB.start();

// 发送到服务器 A
await serverB.sendToRemote('http://192.168.1.100:8080/message', {
  from: 'server-b',
  content: '你好，服务器 A！'
});
```

### 场景 2: 互联网通信

#### 配置公网访问

**方式 1: 端口转发**

在路由器上配置：
- 外部端口：8080
- 内部 IP：192.168.1.100
- 内部端口：8080

**方式 2: 使用内网穿透工具**

```bash
# 使用 ngrok
ngrok http 8080

# 输出：https://abc123.ngrok.io
```

**方式 3: 云服务器**

将服务器部署到云服务器（阿里云、腾讯云等），使用公网 IP。

#### 发送消息

```javascript
// 发送到公网服务器
await server.sendToRemote('http://公网 IP:8080/message', {
  from: 'client',
  content: '跨网络消息！'
});
```

---

## 实际部署

### 生产环境配置

#### 1. 使用 HTTPS（推荐）

```javascript
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

const server = https.createServer(options, (req, res) => {
  // 处理请求
});

server.listen(443);
```

#### 2. 配置防火墙

```bash
# 开放端口（Linux）
sudo ufw allow 8080/tcp

# 或者使用 iptables
sudo iptables -A INPUT -p tcp --dport 8080 -j ACCEPT
```

#### 3. 使用反向代理（Nginx）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 4. 进程管理（PM2）

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start network-server.js --name openclaw-network

# 开机自启
pm2 startup
pm2 save
```

### 监控和日志

```javascript
// 添加日志
server.on('message', (msg) => {
  console.log(`[${new Date().toISOString()}] 收到消息:`, msg);
  
  // 记录到日志文件
  fs.appendFileSync('network.log', JSON.stringify({
    timestamp: new Date().toISOString(),
    event: 'message',
    data: msg
  }) + '\n');
});

// 错误监控
server.on('error', (error) => {
  console.error(`[${new Date().toISOString()}] 错误:`, error);
});
```

---

## API 参考

### NetworkServer

#### 构造函数

```javascript
new NetworkServer({
  port: 8080,              // 监听端口
  host: '0.0.0.0',         // 监听地址
  agentId: 'my-agent',     // Agent ID
  connectionCode: '...'    // 连接编码
})
```

#### 方法

| 方法 | 说明 |
|------|------|
| `start()` | 启动服务器 |
| `stop()` | 停止服务器 |
| `sendToRemote(url, message)` | 发送消息到远程服务器 |
| `getServerInfo()` | 获取服务器信息 |

#### 事件

| 事件 | 说明 |
|------|------|
| `message` | 收到消息 |
| `peer:connect` | 对等节点连接 |
| `error` | 发生错误 |

### WebSocketClient

#### 方法

| 方法 | 说明 |
|------|------|
| `connect()` | 连接到服务器 |
| `disconnect()` | 断开连接 |
| `send(message)` | 发送消息 |
| `sendTo(targetId, content)` | 发送到目标 |
| `getStatus()` | 获取状态 |

---

## 故障排除

### 问题 1: 端口被占用

**症状**: `Error: listen EADDRINUSE`

**解决方案**:
```javascript
// 使用不同端口
const server = new NetworkServer({ port: 8081 });
```

### 问题 2: 无法连接远程

**症状**: `Connection refused`

**解决方案**:
1. 检查远程服务器是否运行
2. 检查防火墙设置
3. 确认 IP 和端口正确
4. 测试网络连通性：`ping <ip>`

### 问题 3: 跨域问题

**症状**: CORS 错误

**解决方案**:
```javascript
// 服务器已自动设置 CORS 头
res.setHeader('Access-Control-Allow-Origin', '*');
```

---

## 最佳实践

1. **使用 HTTPS** - 生产环境务必使用加密
2. **身份验证** - 添加 token 验证机制
3. **限流** - 防止 DDoS 攻击
4. **日志记录** - 记录所有重要事件
5. **错误处理** - 完善的错误处理机制
6. **重连机制** - 自动重连断开的连接
7. **消息队列** - 缓存未发送的消息

---

## 相关资源

- [示例代码](../examples/example-6-real-network.js)
- [连接编码指南](CONNECTION_CODE_GUIDE.md)
- [GitHub](https://github.com/yun520-1/markcell-openclaw-AI-Chat)

---

**祝你网络通信顺利！** 🌐

*最后更新*: 2026-03-27
