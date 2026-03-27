# 🤖 A2A 直接对话指南

实现两个 OpenClaw 实例之间的**直接对话**，无需中转站！

---

## 📋 目录

1. [三种通信方式](#三种通信方式)
2. [快速开始](#快速开始)
3. [使用示例](#使用示例)
4. [高级配置](#高级配置)
5. [故障排除](#故障排除)

---

## 三种通信方式

### 方式 1: sessions_send（推荐）⭐

使用 OpenClaw 内置的 `sessions_send` API，最简单！

**优点**:
- ✅ 无需额外配置
- ✅ OpenClaw 自动路由
- ✅ 支持跨会话通信

**适用场景**:
- 同一 OpenClaw 实例内的多个 Agent
- 信任的 OpenClaw 环境

### 方式 2: HTTP

通过 HTTP REST API 进行通信。

**优点**:
- ✅ 跨网络通信
- ✅ 标准协议
- ✅ 易于调试

**适用场景**:
- 不同服务器上的 Agent
- 需要防火墙穿透

### 方式 3: WebSocket

建立持久连接，实时通信。

**优点**:
- ✅ 低延迟
- ✅ 双向通信
- ✅ 连接保持

**适用场景**:
- 实时对话需求
- 高频消息交换

---

## 快速开始

### 步骤 1: 引入模块

```javascript
const { A2ADirectConnect } = require('./modules/a2a/a2a_direct_connect');
```

### 步骤 2: 创建连接

```javascript
// 创建 A2A 连接器
const a2a = new A2ADirectConnect({
  agentId: 'my-agent-001',
  communicationMode: 'sessions_send' // 或 'http', 'websocket'
});
```

### 步骤 3: 连接到另一个 Agent

```javascript
// 连接到目标 Agent
await a2a.connect('agent-002', {
  // 根据通信模式配置
  baseUrl: 'http://localhost',
  port: 8080
});
```

### 步骤 4: 发送消息

```javascript
// 发送消息
const response = await a2a.sendMessage('agent-002', {
  type: 'message',
  content: '你好！'
});

console.log(response);
```

---

## 使用示例

### 示例 1: sessions_send 模式（最简单）

```javascript
const { A2ADirectConnect } = require('./modules/a2a/a2a_direct_connect');

async function example1() {
  // 创建 Agent A
  const agentA = new A2ADirectConnect({
    agentId: 'agent-a',
    communicationMode: 'sessions_send'
  });
  
  // 创建 Agent B
  const agentB = new A2ADirectConnect({
    agentId: 'agent-b',
    communicationMode: 'sessions_send'
  });
  
  // 建立连接
  await agentA.connect('agent-b');
  await agentB.connect('agent-a');
  
  // Agent A 发送消息
  const response = await agentA.sendMessage('agent-b', {
    content: '你好，Agent B！'
  });
  
  console.log('发送成功:', response);
}

example1();
```

### 示例 2: HTTP 模式

```javascript
const { A2ADirectConnect } = require('./modules/a2a/a2a_direct_connect');

async function example2() {
  const agent = new A2ADirectConnect({
    agentId: 'agent-http',
    communicationMode: 'http'
  });
  
  // 连接到远程 Agent
  await agent.connect('remote-agent', {
    baseUrl: 'http://192.168.1.100',
    port: 8080
  });
  
  // 发送消息
  await agent.sendMessage('remote-agent', {
    content: '你好，远程 Agent！'
  });
  
  // 查看连接状态
  const status = agent.getConnectionStatus('remote-agent');
  console.log('连接状态:', status);
}

example2();
```

### 示例 3: WebSocket 模式

```javascript
const { A2ADirectConnect } = require('./modules/a2a/a2a_direct_connect');

async function example3() {
  const agent = new A2ADirectConnect({
    agentId: 'agent-ws',
    communicationMode: 'websocket'
  });
  
  // 连接到 WebSocket 服务器
  await agent.connect('ws-agent', {
    url: 'ws://localhost:9000'
  });
  
  // 发送消息
  await agent.sendMessage('ws-agent', {
    content: 'WebSocket 消息！'
  });
}

example3();
```

### 示例 4: 完整对话流程

```javascript
const { DialogHub } = require('./core/dialog_hub');
const { A2ADirectConnect } = require('./modules/a2a/a2a_direct_connect');

async function fullConversation() {
  console.log('=== A2A 完整对话 ===\n');
  
  // 创建两个 Agent
  const alice = new DialogHub({ sessionId: 'alice', mode: 'a2a' });
  const bob = new DialogHub({ sessionId: 'bob', mode: 'a2a' });
  
  // 为 Alice 注册技能
  alice.registerSkill('chat', async (content) => {
    if (content.includes('你好')) return '你好！我是 Alice！';
    return `Alice 收到：${content}`;
  });
  
  // 为 Bob 注册技能
  bob.registerSkill('chat', async (content) => {
    if (content.includes('你好')) return '你好！我是 Bob！';
    return `Bob 收到：${content}`;
  });
  
  // 创建 A2A 连接器
  const a2a = new A2ADirectConnect({
    agentId: 'coordinator',
    communicationMode: 'sessions_send'
  });
  
  // 建立连接
  await a2a.connect('alice');
  await a2a.connect('bob');
  
  // 对话
  const messages = [
    { from: 'alice', to: 'bob', content: '你好！' },
    { from: 'bob', to: 'alice', content: '你好！' },
    { from: 'alice', to: 'bob', content: '今天天气不错！' },
    { from: 'bob', to: 'alice', content: '是的，适合聊天！' }
  ];
  
  for (const msg of messages) {
    console.log(`🤖 ${msg.from}: ${msg.content}`);
    
    await a2a.sendMessage(msg.to, {
      type: 'message',
      content: msg.content
    });
    
    await sleep(500);
  }
  
  // 查看统计
  console.log('\n=== 统计 ===');
  console.log(a2a.getStats());
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

fullConversation();
```

---

## 高级配置

### 自定义消息处理

```javascript
const a2a = new A2ADirectConnect({ agentId: 'my-agent' });

// 注册自定义消息处理器
a2a.registerMessageHandler('special-agent', async (message) => {
  console.log('收到特殊消息:', message);
  
  // 自定义处理逻辑
  if (message.content.includes('紧急')) {
    return { 
      content: '收到紧急消息！立即处理！',
      priority: 'high'
    };
  }
  
  return { content: '消息已收到' };
});
```

### 连接管理

```javascript
// 列出所有连接
const connections = a2a.listConnections();
console.log('连接列表:', connections);

// 获取特定连接状态
const status = a2a.getConnectionStatus('agent-002');
console.log('状态:', status);

// 断开连接
await a2a.disconnect('agent-002');

// 重新连接
await a2a.connect('agent-002');
```

### 错误处理

```javascript
try {
  await a2a.connect('agent-002');
  await a2a.sendMessage('agent-002', { content: '你好' });
} catch (error) {
  console.error('通信失败:', error.message);
  
  // 重试逻辑
  console.log('尝试重新连接...');
  await a2a.connect('agent-002');
}
```

### 消息队列

```javascript
// 实现简单的消息队列
const messageQueue = [];

a2a.registerMessageHandler('any', async (message) => {
  messageQueue.push({
    from: message.from,
    content: message.content,
    timestamp: Date.now()
  });
  
  // 保持队列长度
  if (messageQueue.length > 100) {
    messageQueue.shift();
  }
  
  return { status: 'queued' };
});
```

---

## 实战场景

### 场景 1: 客服协作

```javascript
// Agent A: 接待客服
const receptionist = new A2ADirectConnect({
  agentId: 'receptionist',
  communicationMode: 'sessions_send'
});

// Agent B: 技术专家
const expert = new A2ADirectConnect({
  agentId: 'tech-expert',
  communicationMode: 'sessions_send'
});

// 转接复杂问题
async function handleCustomer(message) {
  if (isTechnicalQuestion(message)) {
    // 转接给专家
    await receptionist.sendMessage('tech-expert', {
      type: 'transfer',
      content: message.content,
      customer: 'customer-001'
    });
  }
}
```

### 场景 2: 多语言翻译

```javascript
// Agent A: 中文助手
const cnAgent = new A2ADirectConnect({ agentId: 'cn-agent' });

// Agent B: 英文助手
const enAgent = new A2ADirectConnect({ agentId: 'en-agent' });

// 翻译消息
async function translateAndSend(message, targetLang) {
  if (targetLang === 'en') {
    await cnAgent.sendMessage('en-agent', {
      type: 'translate',
      content: message.content,
      from: 'zh',
      to: 'en'
    });
  }
}
```

### 场景 3: 任务分发

```javascript
// Master Agent
const master = new A2ADirectConnect({ agentId: 'master' });

// Worker Agents
const workers = ['worker-1', 'worker-2', 'worker-3'];

// 分发任务
async function distributeTask(task) {
  for (const workerId of workers) {
    await master.sendMessage(workerId, {
      type: 'task',
      content: task,
      priority: 'normal'
    });
  }
}
```

---

## 故障排除

### 问题 1: 连接失败

**症状**: `连接未就绪`

**解决方案**:
```javascript
// 检查连接状态
const status = a2a.getConnectionStatus('target-agent');
console.log('状态:', status);

// 如果未连接，重新连接
if (status?.status !== 'connected') {
  await a2a.connect('target-agent');
}
```

### 问题 2: 消息发送失败

**症状**: `消息发送超时`

**解决方案**:
```javascript
// 添加重试逻辑
async function sendWithRetry(target, message, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await a2a.sendMessage(target, message);
    } catch (error) {
      console.log(`重试 ${i + 1}/${maxRetries}`);
      await sleep(1000 * (i + 1));
    }
  }
  throw new Error('发送失败');
}
```

### 问题 3: 消息乱序

**症状**: 消息顺序错乱

**解决方案**:
```javascript
// 添加序列号
let sequence = 0;

await a2a.sendMessage('target', {
  content: '消息内容',
  sequence: ++sequence,
  timestamp: Date.now()
});
```

---

## 性能优化

### 1. 连接池

```javascript
// 维护连接池
const connectionPool = new Map();

async function getConnection(agentId) {
  let conn = connectionPool.get(agentId);
  
  if (!conn || conn.status !== 'connected') {
    conn = await a2a.connect(agentId);
    connectionPool.set(agentId, conn);
  }
  
  return conn;
}
```

### 2. 消息批处理

```javascript
// 批量发送消息
async function sendBatch(messages) {
  const batch = {
    type: 'batch',
    messages: messages,
    count: messages.length
  };
  
  return await a2a.sendMessage('target', batch);
}
```

### 3. 心跳检测

```javascript
// 定期发送心跳
setInterval(async () => {
  for (const [agentId, conn] of a2a.connections) {
    if (conn.status === 'connected') {
      await a2a.sendMessage(agentId, { type: 'heartbeat' });
    }
  }
}, 30000); // 30 秒
```

---

## 最佳实践

1. **使用 sessions_send 模式** - 最简单可靠
2. **添加错误处理** - 处理网络异常
3. **实现重试机制** - 提高可靠性
4. **记录日志** - 便于调试
5. **监控连接状态** - 及时发现问题
6. **合理设置超时** - 避免长时间等待

---

## 相关资源

- [示例代码](../examples/example-4-a2a-direct-chat.js)
- [API 文档](../README.md)
- [架构设计](../ARCHITECTURE.md)
- [GitHub](https://github.com/yun520-1/markcell-openclaw-AI-Chat)

---

**祝你 A2A 对话顺利！** 🤖💬

*最后更新*: 2026-03-27
