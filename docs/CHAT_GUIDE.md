# 💬 与 OpenClaw 对话指南

本指南介绍如何使用 **markcell-openclaw-AI Chat** 系统与 OpenClaw 进行对话。

---

## 📋 目录

1. [三种对话模式](#三种对话模式)
2. [快速开始](#快速开始)
3. [代码示例](#代码示例)
4. [自定义对话](#自定义对话)
5. [高级用法](#高级用法)

---

## 三种对话模式

### 1. H2AI (Human-to-AI) - 人与 AI 对话

最常用的模式，你与 AI 助手直接对话。

```javascript
const hub = new DialogHub({ mode: 'h2ai' });
```

### 2. H2H (Human-to-Human) - 人与人对话

通过 OpenClaw 中转，实现人与人之间的对话（待实现完整功能）。

```javascript
const hub = new DialogHub({ mode: 'h2h' });
```

### 3. A2A (AI-to-AI) - AI 与 AI 对话

多个 AI 实例之间协作对话。

```javascript
const agent = new A2AModule({ role: 'master' });
```

---

## 快速开始

### 方式 1: 运行示例

```bash
cd ~/.jvs/.openclaw/workspace/openclaw-dialog-tools

# 运行简单对话示例
node examples/example-3-simple-chat.js
```

### 方式 2: 运行完整示例

```bash
# 运行基础对话示例
node examples/example-1-basic-chat.js

# 运行与 OpenClaw 对话示例
node examples/example-2-chat-with-openclaw.js
```

### 方式 3: 编写自己的代码

```javascript
const { DialogHub } = require('./core/dialog_hub');

const hub = new DialogHub({ sessionId: 'my-chat', mode: 'h2ai' });

// 注册技能
hub.registerSkill('greeting', async (content) => {
  return `你好！${content}`;
});

// 处理对话
const response = await hub.processRequest({
  type: 'message',
  content: '你好'
});

console.log(response);
```

---

## 代码示例

### 示例 1: 最简单的对话

```javascript
const { DialogHub } = require('./core/dialog_hub');

async function chat() {
  const hub = new DialogHub({ sessionId: 'chat-001' });
  
  hub.registerSkill('chat', async (content) => {
    if (content.includes('你好')) {
      return '你好！很高兴见到你！😊';
    }
    return `你说的是："${content}"`;
  });
  
  const response = await hub.processRequest({
    type: 'message',
    content: '你好'
  });
  
  console.log(response);
  // 输出：你好！很高兴见到你！😊
}

chat();
```

### 示例 2: 多轮对话

```javascript
const { DialogHub } = require('./core/dialog_hub');

async function multiTurnChat() {
  const hub = new DialogHub({ sessionId: 'multi-chat' });
  
  // 注册多个技能
  hub.registerSkill('greeting', async () => '你好！', {
    tags: ['hello', 'hi', '你好']
  });
  
  hub.registerSkill('help', async () => '我可以帮你聊天、回答问题、执行任务。', {
    tags: ['help', '帮助', '能做什么']
  });
  
  hub.registerSkill('bye', async () => '再见！', {
    tags: ['bye', '再见', '拜拜']
  });
  
  // 多轮对话
  const messages = ['你好', '你能做什么？', '再见'];
  
  for (const msg of messages) {
    console.log(`你：${msg}`);
    const response = await hub.processRequest({ content: msg });
    console.log(`AI: ${response}`);
  }
}

multiTurnChat();
```

### 示例 3: 带上下文的对话

```javascript
const { DialogHub } = require('./core/dialog_hub');
const { SessionManager } = require('./core/session_manager');

async function contextualChat() {
  const hub = new DialogHub({ sessionId: 'context-chat' });
  const sessionMgr = new SessionManager();
  
  // 创建会话
  sessionMgr.createSession('user-001');
  
  // 第一轮对话
  sessionMgr.addMessage('user-001', {
    role: 'user',
    content: '我想查询天气'
  });
  
  const response1 = await hub.processRequest({
    content: '我想查询天气'
  });
  
  sessionMgr.addMessage('user-001', {
    role: 'assistant',
    content: response1
  });
  
  // 第二轮对话（带上下文）
  const context = sessionMgr.getSession('user-001').context;
  console.log('对话历史:', context);
}

contextualChat();
```

### 示例 4: 自定义对话逻辑

```javascript
const { DialogHub } = require('./core/dialog_hub');

async function customChat() {
  const hub = new DialogHub({ sessionId: 'custom-chat' });
  
  // 注册天气查询技能
  hub.registerSkill('weather', async (content) => {
    // 这里可以调用真实的天气 API
    const weathers = [
      '今天晴朗，25°C ☀️',
      '今天多云，22°C ⛅',
      '今天有雨，20°C ☔'
    ];
    return weathers[Math.floor(Math.random() * weathers.length)];
  }, {
    category: 'utility',
    tags: ['天气', 'weather', '气温']
  });
  
  // 注册时间查询技能
  hub.registerSkill('time', async () => {
    return `现在时间：${new Date().toLocaleString('zh-CN')}`;
  }, {
    category: 'utility',
    tags: ['时间', 'time', '几点']
  });
  
  // 测试
  console.log(await hub.processRequest({ content: '今天天气怎么样' }));
  console.log(await hub.processRequest({ content: '现在几点了' }));
}

customChat();
```

---

## 自定义对话

### 创建个性化技能

```javascript
hub.registerSkill('my-custom-skill', async (content, options, hub) => {
  // 你的对话逻辑
  if (content.includes('名字')) {
    return '我的名字是 OpenClaw 助手！';
  }
  
  if (content.includes('年龄')) {
    return '我永远 18 岁！😊';
  }
  
  if (content.includes('爱好')) {
    return '我喜欢帮助你解决问题！';
  }
  
  return '我还在学习中，不太明白你的意思。';
}, {
  category: 'custom',
  tags: ['name', 'age', 'hobby'],
  author: '你的名字'
});
```

### 使用外部 API

```javascript
hub.registerSkill('api-chat', async (content) => {
  try {
    // 调用外部 API
    const response = await fetch('https://api.example.com/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: content })
    });
    
    const data = await response.json();
    return data.reply;
  } catch (error) {
    return 'API 调用失败，请稍后重试。';
  }
});
```

### 集成 AI 模型

```javascript
hub.registerSkill('ai-chat', async (content) => {
  // 这里可以集成各种 AI 模型
  // 如：OpenAI, Claude, 通义千问等
  
  const aiResponse = await callAIModel(content);
  return aiResponse;
});

async function callAIModel(prompt) {
  // 实现 AI 模型调用逻辑
  // 返回 AI 的回复
  return '这是 AI 的回复';
}
```

---

## 高级用法

### 1. 会话管理

```javascript
const { SessionManager } = require('./core/session_manager');

const sessionMgr = new SessionManager({
  storagePath: './sessions',
  maxActiveSessions: 100,
  autoSaveInterval: 5 * 60 * 1000 // 5 分钟
});

// 创建会话
sessionMgr.createSession('user-123', {
  userId: '123',
  userName: '张三'
});

// 添加消息
sessionMgr.addMessage('user-123', {
  role: 'user',
  content: '你好'
});

// 保存会话
sessionMgr.saveSession('user-123');

// 加载会话
const session = sessionMgr.getSession('user-123');
console.log(session.context);
```

### 2. 多 Agent 协作

```javascript
const { A2AModule } = require('./modules/a2a/agent_protocol');

// 创建 Master Agent
const master = new A2AModule({
  agentId: 'master-001',
  role: 'master'
});

// 创建 Worker Agent
const worker = new A2AModule({
  agentId: 'worker-001',
  role: 'worker',
  capabilities: ['analysis']
});

// 注册对等 Agent
master.registerPeer('worker-001', {
  role: 'worker',
  capabilities: ['analysis']
});

// 创建协作任务
const taskId = master.createTask({
  description: '分析用户问题',
  requiredCapabilities: ['analysis']
});

// 获取任务状态
const status = master.getTaskStatus(taskId);
console.log(status);
```

### 3. 技能搜索和路由

```javascript
const { SkillRegistry } = require('./skills/skill_registry');

const registry = new SkillRegistry();

// 注册多个技能
registry.register({
  name: 'weather',
  handler: async () => '天气晴朗',
  metadata: { category: 'utility', tags: ['天气'] }
});

registry.register({
  name: 'time',
  handler: async () => '现在 10 点',
  metadata: { category: 'utility', tags: ['时间'] }
});

// 搜索技能
const results = registry.searchSkills('天气');
console.log(results);

// 按分类列出
const byCategory = registry.listByCategory();
console.log(byCategory);
```

### 4. 对话分析

```javascript
// 获取对话统计
const stats = hub.getStatus();
console.log('会话统计:', stats);

// 导出对话历史
const exported = hub.exportSession();
console.log('导出的对话:', exported.context);

// 分析对话内容
const context = hub.getContext();
const userMessages = context.filter(msg => msg.role === 'user');
const assistantMessages = context.filter(msg => msg.role === 'assistant');

console.log('用户消息数:', userMessages.length);
console.log('助手消息数:', assistantMessages.length);
```

---

## 实战示例

### 客服机器人

```javascript
const { DialogHub } = require('./core/dialog_hub');

async function customerService() {
  const hub = new DialogHub({ sessionId: 'cs-bot' });
  
  // 注册常见问题技能
  hub.registerSkill('faq', async (content) => {
    const faqs = {
      '价格': '我们的产品价格从 99 元/月起。',
      '退款': '支持 7 天无理由退款。',
      '联系': '客服邮箱：support@example.com',
      '时间': '工作时间：9:00-18:00'
    };
    
    for (const [keyword, answer] of Object.entries(faqs)) {
      if (content.includes(keyword)) {
        return answer;
      }
    }
    
    return '抱歉，我不太明白。请联系人工客服：support@example.com';
  });
  
  // 测试
  console.log(await hub.processRequest({ content: '价格是多少？' }));
  console.log(await hub.processRequest({ content: '怎么退款？' }));
}

customerService();
```

### 个人助手

```javascript
async function personalAssistant() {
  const hub = new DialogHub({ sessionId: 'pa-bot' });
  
  // 注册待办事项技能
  const todos = [];
  
  hub.registerSkill('todo', async (content) => {
    if (content.startsWith('添加')) {
      const task = content.replace('添加', '');
      todos.push(task);
      return `已添加待办：${task}`;
    }
    
    if (content.includes('列表')) {
      return todos.length > 0 
        ? `待办事项：\n${todos.map((t, i) => `${i+1}. ${t}`).join('\n')}`
        : '暂无待办事项';
    }
    
    return '说"添加 xxx"来添加待办，说"列表"查看待办。';
  });
  
  // 测试
  console.log(await hub.processRequest({ content: '添加买牛奶' }));
  console.log(await hub.processRequest({ content: '添加开会' }));
  console.log(await hub.processRequest({ content: '列表' }));
}

personalAssistant();
```

---

## 故障排除

### 问题 1: 技能不匹配

**症状**: 总是返回默认回复

**解决方案**:
```javascript
// 确保 tags 包含所有可能的关键词
hub.registerSkill('skill', async (content) => {
  // ...
}, {
  tags: ['关键词 1', '关键词 2', '同义词']
});
```

### 问题 2: 上下文丢失

**症状**: 多轮对话中忘记之前的内容

**解决方案**:
```javascript
// 使用 SessionManager 保存上下文
sessionMgr.addMessage('session-id', {
  role: 'user',
  content: '消息内容'
});

// 获取上下文
const context = sessionMgr.getSession('session-id').context;
```

### 问题 3: 性能问题

**症状**: 响应慢

**解决方案**:
```javascript
// 限制上下文长度
const hub = new DialogHub({ 
  sessionId: 'fast-chat',
  contextMax: 20 // 只保留最近 20 条消息
});
```

---

## 最佳实践

1. **技能分类**: 按功能分类技能，便于管理
2. **标签完善**: 为技能添加全面的标签
3. **错误处理**: 始终捕获和处理异常
4. **日志记录**: 记录重要操作和错误
5. **测试**: 为每个技能编写测试
6. **文档**: 维护清晰的文档

---

## 相关资源

- [README.md](../README.md) - 完整 API 文档
- [QUICKSTART.md](../QUICKSTART.md) - 快速开始
- [examples/](../examples/) - 更多示例代码
- [GitHub](https://github.com/yun520-1/markcell-openclaw-AI-Chat) - 项目仓库

---

**祝你对话愉快！** 💬😊

*最后更新*: 2026-03-27
