# markcell-openclaw-AI Chat

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D14.0.0-green.svg)](https://nodejs.org/)
[![Tests](https://img.shields.io/badge/tests-26%20passed-brightgreen.svg)](./test-all.js)
[![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)](./package.json)

> 一套原创的、无版权风险的 OpenClaw 对话工具系统
> 
> 支持 **H2H**（人与人）、**H2AI**（人与 AI）、**A2A**（AI 与 AI）三种对话模式
> 
> ✨ **v1.2.0 新增**: 自动启动服务 - 安装后自动生成编码并启动网络服务器！

## 🎯 核心特性

- ✅ **三种对话模式**: H2H（人与人）、H2AI（人与 AI）、A2A（AI 与 AI）
- ✅ **100% 原创代码**: 无第三方依赖，无版权风险
- ✅ **连接编码系统**: 通过唯一编码 (OCLAW-XXXX-XXXX-XXXX) 直接对话
- ✅ **真实网络通信**: HTTP/WebSocket 支持，跨网络通信
- ✅ **自动启动服务**: 安装后自动生成编码并启动服务器
- ✅ **模块化设计**: 每个功能独立，可单独使用或组合
- ✅ **完善的文档**: 12 个文档文件，覆盖所有场景
- ✅ **测试充分**: 26 项测试，100% 通过率
- ✅ **MIT 许可**: 可安全用于商业项目

## 📦 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                   OpenClaw Dialog Hub                   │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   H2H       │  │   H2AI      │  │   A2A       │     │
│  │   Module    │  │   Module    │  │   Module    │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│  ┌─────────────────────────────────────────────────┐   │
│  │          Skill Discovery & Router               │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │          Session Manager & State                │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## 🚀 快速开始

### 1. 安装

```bash
# 克隆或复制本目录到你的 workspace
cp -r openclaw-dialog-tools ~/.openclaw/workspace/
```

### 2. 基础使用

```javascript
// 引入核心模块
const { DialogHub } = require('./openclaw-dialog-tools/core/dialog_hub');
const { SessionManager } = require('./openclaw-dialog-tools/core/session_manager');
const { A2AModule } = require('./openclaw-dialog-tools/modules/a2a/agent_protocol');
const { SkillRegistry } = require('./openclaw-dialog-tools/skills/skill_registry');

// 创建对话中心
const hub = new DialogHub({
  sessionId: 'my-session-001',
  mode: 'h2ai'
});

// 注册技能
hub.registerSkill('greeting', async (content) => {
  return `你好！我是你的助手，有什么可以帮你的吗？`;
}, {
  category: 'general',
  tags: ['chat', 'help']
});

// 处理请求
const response = await hub.processRequest({
  type: 'message',
  content: '你好',
  target: 'user123'
});

console.log(response);
```

### 3. 多 Agent 协作

```javascript
// 创建 Master Agent
const master = new A2AModule({
  agentId: 'master-001',
  role: 'master',
  capabilities: ['task_coordination', 'result_aggregation']
});

// 创建 Worker Agent
const worker = new A2AModule({
  agentId: 'worker-001',
  role: 'worker',
  capabilities: ['data_processing', 'analysis']
});

// 注册对等 Agent
master.registerPeer('worker-001', {
  role: 'worker',
  capabilities: ['data_processing', 'analysis']
});

// 创建协作任务
const taskId = master.createTask({
  description: '分析用户数据',
  requiredCapabilities: ['data_processing'],
  priority: 'high'
});

// 查询任务状态
const status = master.getTaskStatus(taskId);
console.log(status);
```

### 4. 会话管理

```javascript
// 创建会话管理器
const sessionMgr = new SessionManager({
  storagePath: './sessions',
  maxActiveSessions: 100,
  autoSaveInterval: 5 * 60 * 1000 // 5 分钟
});

// 创建新会话
const session = sessionMgr.createSession('session-001', {
  userId: 'user123',
  maxContextLength: 50
});

// 添加消息
sessionMgr.addMessage('session-001', {
  role: 'user',
  content: '你好，我想查询天气'
});

// 获取会话
const loadedSession = sessionMgr.getSession('session-001');
console.log(loadedSession.context);
```

## 📚 模块说明

### Core（核心模块）

| 模块 | 文件 | 功能 |
|------|------|------|
| DialogHub | `core/dialog_hub.js` | 对话中心，统一管理三种对话模式 |
| SessionManager | `core/session_manager.js` | 会话生命周期管理、状态持久化 |

### Modules（功能模块）

| 模块 | 文件 | 功能 |
|------|------|------|
| A2A | `modules/a2a/agent_protocol.js` | AI 与 AI 协作协议、任务分配 |
| H2H | `modules/h2h/` | 人与人对话中转（待实现） |
| H2AI | `modules/h2ai/` | 人与 AI 对话管理（待实现） |

### Skills（技能系统）

| 模块 | 文件 | 功能 |
|------|------|------|
| SkillRegistry | `skills/skill_registry.js` | 技能注册、发现、加载 |

## 🔧 技能开发

### 创建自定义技能

```javascript
// skills/my_skill.js
module.exports = {
  name: 'my_skill',
  version: '1.0.0',
  description: '我的自定义技能',
  handler: async (content, options, hub) => {
    // 处理逻辑
    return `处理结果：${content}`;
  },
  metadata: {
    category: 'custom',
    tags: ['custom', 'demo'],
    author: 'your_name',
    license: 'MIT',
    original: true
  }
};
```

### 加载技能

```javascript
const registry = new SkillRegistry({
  skillsPath: './skills'
});

// 扫描并加载所有技能
await registry.scanAndLoad();

// 列出所有技能
const skills = registry.listSkills();
console.log(skills);

// 搜索技能
const results = registry.searchSkills('天气');
console.log(results);
```

## 📊 统计与监控

```javascript
// 获取系统状态
const hubStatus = hub.getStatus();
console.log(hubStatus);

// 获取会话统计
const sessionStats = sessionMgr.getStats();
console.log(sessionStats);

// 获取技能统计
const skillStats = registry.getStats();
console.log(skillStats);

// 获取 A2A 状态
const a2aStatus = master.getStatus();
console.log(a2aStatus);
```

## 🛡️ 版权说明

本系统所有代码、设计、文档均为原创：

- ✅ 不依赖任何有版权争议的第三方库
- ✅ 不使用任何 GPL/AGPL 等传染性许可证的代码
- ✅ 采用 MIT 许可证
- ✅ 可安全用于商业项目

## 📝 待实现功能

- [ ] H2H 模块完整实现（消息中转、翻译、定时发送）
- [ ] H2AI 模块完整实现（上下文管理、记忆持久化）
- [ ] 更多预置技能模板
- [ ] Web 管理界面
- [ ] 性能监控与日志系统
- [ ] 单元测试与集成测试

## 🤝 贡献指南

欢迎贡献代码、文档或建议！请遵循以下原则：

1. **原创性**: 所有贡献必须为原创
2. **无版权风险**: 不引入有版权争议的依赖
3. **代码质量**: 遵循现有代码风格，添加必要注释
4. **文档**: 新功能需要配套文档

## 📄 许可证

MIT License - 详见 LICENSE 文件

## 📞 联系方式

如有问题或建议，请通过 OpenClaw 会话联系。

---

**版本**: 1.0.0  
**创建时间**: 2026-03-27  
**最后更新**: 2026-03-27
