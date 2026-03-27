# markcell-openclaw-AI Chat

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D14.0.0-green.svg)](https://nodejs.org/)
[![Tests](https://img.shields.io/badge/tests-26%20passed-brightgreen.svg)](./test-all.js)
[![Code Size](https://img.shields.io/github/languages/code-size/markcell/markcell-openclaw-AI-Chat.svg)](.)

> 一套原创的、无版权风险的 OpenClaw 对话工具系统
> 
> 支持 **H2H**（人与人）、**H2AI**（人与 AI）、**A2A**（AI 与 AI）三种对话模式

## 🎯 特性

- ✅ **三种对话模式** - H2H、H2AI、A2A 完整支持
- ✅ **100% 原创代码** - 无第三方依赖，无版权风险
- ✅ **模块化设计** - 易于理解、维护和扩展
- ✅ **完善的文档** - 8 个文档文件，覆盖所有场景
- ✅ **测试充分** - 26 项测试，100% 通过率
- ✅ **MIT 许可证** - 可自由用于商业项目

## 📦 安装

### 方式 1: 从 ClawHub 安装

```bash
# 使用 OpenClaw ClawHub 安装
clawhub install markcell-openclaw-ai-chat
```

### 方式 2: 从 GitHub 克隆

```bash
git clone https://github.com/markcell/markcell-openclaw-AI-Chat.git
cd markcell-openclaw-AI-Chat
```

### 方式 3: 直接复制

```bash
# 复制到你的 OpenClaw workspace
cp -r markcell-openclaw-AI-Chat ~/.jvs/.openclaw/workspace/
```

## 🚀 快速开始

### 1. 运行示例

```bash
# 运行基础对话示例
node examples/example-1-basic-chat.js
```

### 2. 运行测试

```bash
# 运行所有测试
npm test
# 或
node test-all.js
```

### 3. 在你的代码中使用

```javascript
const { DialogHub } = require('./core/dialog_hub');

// 创建对话中心
const hub = new DialogHub({ sessionId: 'my-session', mode: 'h2ai' });

// 注册技能
hub.registerSkill('greeting', async (content) => {
  return `你好！${content}`;
}, { category: 'chat', tags: ['greeting'] });

// 处理请求
const response = await hub.processRequest({
  type: 'message',
  content: '你好'
});

console.log(response);
// 输出：你好！你好！
```

## 📚 核心模块

### DialogHub (对话中心)

统一管理三种对话模式的核心引擎。

```javascript
const { DialogHub } = require('./core/dialog_hub');

const hub = new DialogHub({
  sessionId: 'my-session',
  mode: 'h2ai' // h2h, h2ai, a2a
});
```

### SessionManager (会话管理)

管理会话生命周期、状态持久化。

```javascript
const { SessionManager } = require('./core/session_manager');

const sessionMgr = new SessionManager({
  storagePath: './sessions'
});
```

### SkillRegistry (技能注册)

技能的注册、发现、加载系统。

```javascript
const { SkillRegistry } = require('./skills/skill_registry');

const registry = new SkillRegistry();
registry.register({
  name: 'my-skill',
  handler: async (content) => `结果：${content}`,
  metadata: { category: 'custom' }
});
```

### A2AModule (多 Agent 协作)

AI 与 AI 之间的协作协议。

```javascript
const { A2AModule } = require('./modules/a2a/agent_protocol');

const master = new A2AModule({
  agentId: 'master-001',
  role: 'master'
});
```

## 📖 文档

| 文档 | 说明 |
|------|------|
| [QUICKSTART.md](./QUICKSTART.md) | 5 分钟快速上手指南 |
| [README.md](./README.md) | 完整 API 文档 |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 架构设计说明 |
| [TEST_REPORT.md](./TEST_REPORT.md) | 测试报告 |
| [examples/README.md](./examples/README.md) | 使用示例 |
| [COPYRIGHT.md](./COPYRIGHT.md) | 版权说明 |

## 🧪 测试

```bash
# 运行所有测试
node test-all.js

# 输出：
# ✅ 通过：26
# ❌ 失败：0
# 📊 总计：26
# 📈 通过率：100.0%
```

## 📦 项目结构

```
markcell-openclaw-AI-Chat/
├── core/
│   ├── dialog_hub.js          # 对话中心引擎
│   └── session_manager.js     # 会话管理器
├── modules/
│   └── a2a/
│       └── agent_protocol.js  # AI 协作协议
├── skills/
│   └── skill_registry.js      # 技能注册表
├── examples/
│   ├── README.md              # 示例说明
│   └── example-1-basic-chat.js # 基础示例
├── package.json               # 项目配置
├── README.md                  # 项目说明
├── QUICKSTART.md              # 快速开始
├── ARCHITECTURE.md            # 架构设计
├── TEST_REPORT.md             # 测试报告
├── test-all.js                # 测试脚本
└── LICENSE                    # MIT 许可证
```

## 🎯 使用场景

- ✅ 个人 AI 助手项目
- ✅ 企业客服系统
- ✅ 多 Agent 协作平台
- ✅ 对话式应用开发
- ✅ 技能系统原型

## 🛡️ 版权说明

- **原创性**: 100% 原创代码，无第三方依赖
- **许可证**: MIT License（商业友好）
- **无风险**: 无 GPL/AGPL 等传染性许可证代码
- **可商用**: 可自由用于个人和商业项目

## 🤝 贡献

欢迎贡献代码、文档或建议！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系方式

- **作者**: markcell
- **项目**: markcell-openclaw-AI Chat
- **版本**: 1.0.0

## 🌟 Star History

如果这个项目对你有帮助，请给一个 Star！⭐

---

**最后更新**: 2026-03-27  
**版本**: 1.0.0  
**许可证**: MIT
