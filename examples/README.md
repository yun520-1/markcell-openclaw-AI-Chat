# 使用示例

本目录包含 OpenClaw 对话工具系统的完整使用示例。

## 示例列表

1. [基础对话示例](#示例 1-基础对话)
2. [技能注册与调用](#示例 2-技能注册与调用)
3. [多 Agent 协作](#示例 3-多 Agent 协作)
4. [会话持久化](#示例 4-会话持久化)
5. [完整工作流程](#示例 5-完整工作流程)

---

## 示例 1: 基础对话

```javascript
// 引入 DialogHub
const { DialogHub } = require('../core/dialog_hub');

// 创建对话中心
const hub = new DialogHub({
  sessionId: 'demo-session-001',
  mode: 'h2ai'
});

// 注册一个简单的聊天技能
hub.registerSkill('chat', async (content, options) => {
  const responses = {
    '你好': '你好！有什么可以帮助你的吗？',
    '再见': '再见！祝你有美好的一天！',
    '谢谢': '不客气！随时为你服务。',
    'help': '可用命令：你好、再见、谢谢、天气、时间'
  };
  
  return responses[content] || `我收到了："${content}"，但我还在学习如何处理这个请求。`;
}, {
  category: 'chat',
  tags: ['chat', 'basic']
});

// 模拟对话
async function runDemo() {
  console.log('=== 基础对话示例 ===\n');
  
  const messages = ['你好', 'help', '今天天气怎么样', '谢谢', '再见'];
  
  for (const message of messages) {
    console.log(`用户：${message}`);
    const response = await hub.processRequest({
      type: 'message',
      content: message
    });
    console.log(`助手：${response}\n`);
  }
  
  // 查看会话状态
  console.log('会话状态:', JSON.stringify(hub.getStatus(), null, 2));
}

runDemo().catch(console.error);
```

---

## 示例 2: 技能注册与调用

```javascript
// 引入模块
const { DialogHub } = require('../core/dialog_hub');
const { SkillRegistry } = require('../skills/skill_registry');

// 创建注册表
const registry = new SkillRegistry({
  skillsPath: './skills'
});

// 注册多个技能
registry.register({
  name: 'weather',
  version: '1.0.0',
  description: '天气查询技能',
  handler: async (content) => {
    // 这里可以调用真实的天气 API
    return '今天天气晴朗，气温 25°C，适合外出！';
  },
  metadata: {
    category: 'utility',
    tags: ['weather', 'query'],
    original: true
  }
});

registry.register({
  name: 'time',
  version: '1.0.0',
  description: '时间查询技能',
  handler: async (content) => {
    return `当前时间：${new Date().toLocaleString('zh-CN')}`;
  },
  metadata: {
    category: 'utility',
    tags: ['time', 'query'],
    original: true
  }
});

registry.register({
  name: 'calculator',
  version: '1.0.0',
  description: '简单计算器',
  handler: async (content, options) => {
    try {
      // 简单的表达式计算（生产环境需要更安全的解析）
      const result = eval(content.replace(/[^0-9+\-*/().]/g, ''));
      return `计算结果：${result}`;
    } catch (error) {
      return '计算失败，请检查表达式格式';
    }
  },
  metadata: {
    category: 'utility',
    tags: ['calculator', 'math'],
    original: true
  }
});

// 列出所有技能
console.log('=== 已注册技能 ===');
const skills = registry.listSkills();
skills.forEach(skill => {
  console.log(`- ${skill.name} (${skill.version}): ${skill.description}`);
});

// 按分类列出
console.log('\n=== 按分类列出 ===');
const byCategory = registry.listByCategory();
for (const [category, skillList] of Object.entries(byCategory)) {
  console.log(`\n${category}:`);
  skillList.forEach(skill => {
    console.log(`  - ${skill.name}`);
  });
}

// 搜索技能
console.log('\n=== 搜索技能 "查询" ===');
const searchResults = registry.searchSkills('查询');
searchResults.forEach(result => {
  console.log(`- ${result.name} (匹配度：${result.matchScore})`);
});

// 获取统计
console.log('\n=== 技能统计 ===');
console.log(registry.getStats());
```

---

## 示例 3: 多 Agent 协作

```javascript
// 引入 A2A 模块
const { A2AModule } = require('../modules/a2a/agent_protocol');

// 创建 Master Agent
const master = new A2AModule({
  agentId: 'master-001',
  role: 'master',
  capabilities: ['coordination', 'aggregation']
});

// 创建 Worker Agents
const worker1 = new A2AModule({
  agentId: 'worker-001',
  role: 'worker',
  capabilities: ['data_processing', 'analysis']
});

const worker2 = new A2AModule({
  agentId: 'worker-002',
  role: 'worker',
  capabilities: ['data_processing', 'reporting']
});

// Master 注册 Workers
master.registerPeer('worker-001', {
  role: 'worker',
  capabilities: ['data_processing', 'analysis']
});

master.registerPeer('worker-002', {
  role: 'worker',
  capabilities: ['data_processing', 'reporting']
});

// 模拟协作任务
async function runMultiAgentDemo() {
  console.log('=== 多 Agent 协作示例 ===\n');
  
  // 创建任务 1: 数据分析
  const task1Id = master.createTask({
    description: '分析用户行为数据',
    requiredCapabilities: ['data_processing'],
    priority: 'high'
  });
  
  console.log(`任务 1 已创建：${task1Id}`);
  console.log('任务状态:', master.getTaskStatus(task1Id));
  
  // 模拟 Worker 完成任务
  setTimeout(() => {
    master.receiveTaskResult(task1Id, {
      agentId: 'worker-001',
      data: { processed: true, records: 1000 }
    });
  }, 1000);
  
  // 创建任务 2: 生成报告
  const task2Id = master.createTask({
    description: '生成月度报告',
    requiredCapabilities: ['reporting'],
    priority: 'medium'
  });
  
  console.log(`\n任务 2 已创建：${task2Id}`);
  
  // 列出所有任务
  console.log('\n=== 所有任务 ===');
  const allTasks = master.listTasks();
  allTasks.forEach(task => {
    console.log(`- ${task.taskId}: ${task.description} (${task.status})`);
  });
  
  // 查看 Master 状态
  console.log('\n=== Master 状态 ===');
  console.log(master.getStatus());
}

runMultiAgentDemo().catch(console.error);
```

---

## 示例 4: 会话持久化

```javascript
// 引入 SessionManager
const { SessionManager } = require('../core/session_manager');

// 创建会话管理器
const sessionMgr = new SessionManager({
  storagePath: './sessions',
  maxActiveSessions: 50,
  autoSaveInterval: 1 * 60 * 1000 // 1 分钟自动保存
});

async function runSessionDemo() {
  console.log('=== 会话持久化示例 ===\n');
  
  // 创建会话
  const session1 = sessionMgr.createSession('user-001-session', {
    userId: 'user-001',
    userName: '张三',
    maxContextLength: 100
  });
  
  // 添加消息
  sessionMgr.addMessage('user-001-session', {
    role: 'user',
    content: '你好，我想查询订单'
  });
  
  sessionMgr.addMessage('user-001-session', {
    role: 'assistant',
    content: '好的，请提供您的订单号'
  });
  
  sessionMgr.addMessage('user-001-session', {
    role: 'user',
    content: '订单号是 12345'
  });
  
  // 保存会话
  sessionMgr.saveSession('user-001-session');
  
  // 模拟重启：从磁盘加载会话
  console.log('模拟重启，从磁盘加载会话...');
  const loadedSession = sessionMgr.getSession('user-001-session');
  
  console.log('\n加载的会话上下文:');
  loadedSession.context.forEach(msg => {
    console.log(`[${msg.role}]: ${msg.content}`);
  });
  
  // 创建另一个会话
  sessionMgr.createSession('user-002-session', {
    userId: 'user-002',
    userName: '李四'
  });
  
  // 列出所有活跃会话
  console.log('\n=== 活跃会话 ===');
  const activeSessions = sessionMgr.listActiveSessions();
  activeSessions.forEach(session => {
    console.log(`- ${session.sessionId}: ${session.contextLength} 条消息`);
  });
  
  // 获取统计
  console.log('\n=== 会话统计 ===');
  console.log(sessionMgr.getStats());
  
  // 导出所有会话
  console.log('\n=== 导出会话数据 ===');
  const exportData = sessionMgr.exportAllSessions();
  console.log(`导出时间：${exportData.exportedAt}`);
  console.log(`会话数：${exportData.sessionsCount}`);
}

runSessionDemo().catch(console.error);
```

---

## 示例 5: 完整工作流程

```javascript
// 完整示例：整合所有模块
const { DialogHub } = require('../core/dialog_hub');
const { SessionManager } = require('../core/session_manager');
const { SkillRegistry } = require('../skills/skill_registry');
const { A2AModule } = require('../modules/a2a/agent_protocol');

async function runFullWorkflow() {
  console.log('=== 完整工作流程示例 ===\n');
  
  // 1. 初始化所有模块
  const hub = new DialogHub({ sessionId: 'full-demo', mode: 'h2ai' });
  const sessionMgr = new SessionManager({ storagePath: './sessions' });
  const registry = new SkillRegistry({ skillsPath: './skills' });
  const agent = new A2AModule({ agentId: 'demo-agent', role: 'worker' });
  
  // 2. 注册技能
  registry.register({
    name: 'greeting',
    handler: async () => '你好！欢迎使用 OpenClaw 对话系统！',
    metadata: { category: 'chat', tags: ['greeting'] }
  });
  
  registry.register({
    name: 'echo',
    handler: async (content) => `你说的是："${content}"`,
    metadata: { category: 'chat', tags: ['echo', 'fun'] }
  });
  
  // 3. 将技能注册到 Hub
  for (const skill of registry.listSkills()) {
    const skillDef = registry.getSkill(skill.name);
    hub.registerSkill(skill.name, skillDef.handler, skillDef.metadata);
  }
  
  // 4. 创建会话
  sessionMgr.createSession('full-demo-session', {
    demo: true,
    maxContextLength: 50
  });
  
  // 5. 模拟对话
  const testMessages = [
    '你好',
    '测试 echo 功能',
    '今天天气如何',
    'help'
  ];
  
  console.log('=== 开始对话 ===\n');
  for (const message of testMessages) {
    console.log(`用户：${message}`);
    
    // 处理请求
    const response = await hub.processRequest({
      type: 'message',
      content: message
    });
    
    console.log(`助手：${response}\n`);
    
    // 保存到会话
    sessionMgr.addMessage('full-demo-session', {
      role: 'user',
      content: message
    });
    
    sessionMgr.addMessage('full-demo-session', {
      role: 'assistant',
      content: response
    });
  }
  
  // 6. 查看系统状态
  console.log('=== 系统状态 ===');
  console.log('Hub:', hub.getStatus());
  console.log('Session:', sessionMgr.getStats());
  console.log('Skills:', registry.getStats());
  console.log('Agent:', agent.getStatus());
  
  // 7. 导出会话
  sessionMgr.saveSession('full-demo-session');
  console.log('\n会话已保存到磁盘');
  
  console.log('\n=== 完整工作流程演示完成 ===');
}

runFullWorkflow().catch(console.error);
```

---

## 运行示例

```bash
# 进入示例目录
cd openclaw-dialog-tools/examples

# 运行示例 1
node example-1-basic-chat.js

# 运行示例 2
node example-2-skills.js

# 运行示例 3
node example-3-multi-agent.js

# 运行示例 4
node example-4-sessions.js

# 运行示例 5（完整流程）
node example-5-full-workflow.js
```

## 注意事项

1. **文件路径**: 确保在正确的目录运行示例
2. **依赖**: 所有示例仅使用 Node.js 内置模块，无需额外安装
3. **权限**: 确保有写入 `sessions/` 目录的权限
4. **清理**: 测试后可删除 `sessions/` 目录中的测试数据

---

**版本**: 1.0.0  
**创建时间**: 2026-03-27
