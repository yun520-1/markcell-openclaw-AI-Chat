# 🚀 快速开始指南

欢迎使用 OpenClaw 对话工具系统！本指南帮助你在 5 分钟内上手。

## 前置要求

- ✅ OpenClaw 环境
- ✅ Node.js (OpenClaw 内置)
- ✅ 无需任何外部依赖

## 5 分钟快速上手

### 第 1 分钟：查看项目

```bash
# 进入项目目录
cd ~/.jvs/.openclaw/workspace/openclaw-dialog-tools

# 查看项目结构
ls -la
```

### 第 2 分钟：运行示例

```bash
# 运行基础对话示例
node examples/example-1-basic-chat.js
```

你会看到类似输出：
```
=== OpenClaw 对话工具 - 基础对话示例 ===

[DialogHub] 初始化完成 | Session: demo-session-001 | Mode: h2ai
[DialogHub] 技能已注册：chat
[DialogHub] 技能已注册：weather
[DialogHub] 技能已注册：time
开始对话...

👤 用户：你好
🤖 助手：你好！有什么可以帮助你的吗？

👤 用户：今天天气怎么样
🤖 助手：今天阳光明媚，气温 26°C，非常适合户外运动！🌤️

👤 用户：现在几点了
🤖 助手：当前时间：2026/03/27 08:27:20
```

### 第 3 分钟：理解核心概念

系统有 4 个核心模块：

1. **DialogHub** - 对话中心
   - 处理所有对话请求
   - 管理技能注册
   - 维护对话上下文

2. **SessionManager** - 会话管理
   - 保存会话状态
   - 支持断点续传
   - 自动持久化

3. **SkillRegistry** - 技能系统
   - 注册和管理技能
   - 智能搜索和路由
   - 支持热插拔

4. **A2AModule** - AI 协作
   - 多 Agent 通信
   - 任务分配和协调
   - 结果聚合

### 第 4 分钟：创建你的第一个技能

创建文件 `my-first-skill.js`：

```javascript
module.exports = {
  name: 'greeting',
  version: '1.0.0',
  description: '我的第一个技能',
  handler: async (content, options) => {
    return `你好！我是你的专属助手，很高兴为你服务！`;
  },
  metadata: {
    category: 'chat',
    tags: ['greeting', 'demo'],
    author: '你的名字',
    original: true
  }
};
```

### 第 5 分钟：使用你的技能

创建文件 `use-my-skill.js`：

```javascript
const { DialogHub } = require('./core/dialog_hub');

async function main() {
  const hub = new DialogHub({ sessionId: 'my-session' });
  
  // 注册你的技能
  const mySkill = require('./my-first-skill.js');
  hub.registerSkill(mySkill.name, mySkill.handler, mySkill.metadata);
  
  // 测试技能
  const response = await hub.processRequest({
    type: 'message',
    content: '你好'
  });
  
  console.log(response);
}

main();
```

运行：
```bash
node use-my-skill.js
```

## 常用操作

### 查看所有技能

```javascript
const { SkillRegistry } = require('./skills/skill_registry');
const registry = new SkillRegistry();

// 列出所有技能
const skills = registry.listSkills();
console.log(skills);

// 搜索技能
const results = registry.searchSkills('天气');
console.log(results);
```

### 管理会话

```javascript
const { SessionManager } = require('./core/session_manager');
const sessionMgr = new SessionManager();

// 创建会话
sessionMgr.createSession('user-001', { maxContextLength: 50 });

// 添加消息
sessionMgr.addMessage('user-001', {
  role: 'user',
  content: '你好'
});

// 保存会话
sessionMgr.saveSession('user-001');
```

### 多 Agent 协作

```javascript
const { A2AModule } = require('./modules/a2a/agent_protocol');

// 创建 Master Agent
const master = new A2AModule({
  agentId: 'master-001',
  role: 'master'
});

// 创建任务
const taskId = master.createTask({
  description: '分析数据',
  priority: 'high'
});

// 查看任务状态
console.log(master.getTaskStatus(taskId));
```

## 下一步学习

- 📖 阅读 [README.md](README.md) 了解完整 API
- 🏗️ 阅读 [ARCHITECTURE.md](ARCHITECTURE.md) 理解架构设计
- 📝 阅读 [examples/README.md](examples/README.md) 查看更多示例
- ⚖️ 阅读 [COPYRIGHT.md](COPYRIGHT.md) 了解版权信息

## 常见问题

### Q: 如何添加新技能？

A: 有两种方式：

1. **直接注册**：
```javascript
hub.registerSkill('my-skill', async (content) => {
  return '处理结果';
}, { category: 'custom' });
```

2. **文件加载**：
```javascript
await registry.loadSkillFile('./skills/my-skill.js');
```

### Q: 会话数据保存在哪里？

A: 默认保存在 `./sessions/` 目录，每个会话一个 JSON 文件。

### Q: 如何清理过期会话？

```javascript
// 清理 24 小时前的会话
sessionMgr.cleanupExpiredSessions(24 * 60 * 60 * 1000);
```

### Q: 支持中文吗？

A: 完全支持！所有模块都支持中文输入和输出。

### Q: 可以用于商业项目吗？

A: 可以！本项目采用 MIT 许可证，可自由用于商业项目。

## 获取帮助

- 📚 查看文档目录
- 🐛 遇到问题？检查日志输出
- 💬 通过 OpenClaw 会话提问

---

**祝你使用愉快！** 🎉
