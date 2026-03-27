/**
 * 与 OpenClaw 对话示例
 * 
 * 演示如何使用 markcell-openclaw-AI Chat 系统与 OpenClaw 进行对话
 */

const { DialogHub } = require('../core/dialog_hub');
const { SessionManager } = require('../core/session_manager');

async function chatWithOpenClaw() {
  console.log('========================================');
  console.log('与 OpenClaw 对话示例');
  console.log('========================================\n');
  
  // 1. 创建对话中心
  const hub = new DialogHub({
    sessionId: 'openclaw-chat-001',
    mode: 'h2ai' // Human-to-AI 模式
  });
  
  // 2. 创建会话管理器（简化版，不启动自动保存）
  const sessionMgr = new SessionManager({
    storagePath: './sessions',
    autoSaveInterval: 0 // 禁用自动保存
  });
  
  // 3. 注册对话技能
  registerChatSkills(hub);
  
  // 4. 创建会话
  sessionMgr.createSession('openclaw-chat-001', {
    user: 'markcell',
    maxContextLength: 50
  });
  
  // 5. 模拟对话
  const messages = [
    '你好，我想了解 OpenClaw',
    'OpenClaw 是什么？',
    '它能做什么？',
    '如何开始使用？',
    '有文档吗？',
    '谢谢你的帮助！'
  ];
  
  console.log('开始与 OpenClaw 对话...\n');
  
  for (const message of messages) {
    console.log(`👤 你：${message}`);
    
    // 处理对话请求
    const response = await hub.processRequest({
      type: 'message',
      content: message
    });
    
    console.log(`🤖 OpenClaw：${response}\n`);
    
    // 保存到会话
    sessionMgr.addMessage('openclaw-chat-001', {
      role: 'user',
      content: message
    });
    
    sessionMgr.addMessage('openclaw-chat-001', {
      role: 'assistant',
      content: response
    });
  }
  
  // 6. 查看对话历史
  console.log('=== 对话历史 ===');
  const session = sessionMgr.getSession('openclaw-chat-001');
  session.context.forEach((msg, index) => {
    const role = msg.role === 'user' ? '👤' : '🤖';
    console.log(`${index + 1}. ${role} ${msg.content}`);
  });
  
  // 7. 保存会话
  sessionMgr.saveSession('openclaw-chat-001');
  console.log('\n✅ 对话已保存');
  
  // 8. 查看统计
  console.log('\n=== 对话统计 ===');
  console.log(`会话 ID: ${hub.sessionId}`);
  console.log(`消息数：${session.context.length}`);
  console.log(`技能数：${hub.listSkills().length}`);
  console.log(`状态：${hub.getStatus().state}`);
}

/**
 * 注册对话技能
 */
function registerChatSkills(hub) {
  // 技能 1: 问候
  hub.registerSkill('greeting', async (content) => {
    const greetings = [
      '你好！我是 OpenClaw AI 助手，很高兴为你服务！',
      '您好！有什么我可以帮助你的吗？',
      '你好！欢迎来到 OpenClaw！'
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }, {
    category: 'chat',
    tags: ['greeting', 'hello']
  });
  
  // 技能 2: OpenClaw 介绍
  hub.registerSkill('introduction', async (content) => {
    return `OpenClaw 是一个强大的 AI 助手平台，主要功能包括：

1. **对话管理** - 支持 H2H、H2AI、A2A 三种对话模式
2. **技能系统** - 可以扩展各种自定义技能
3. **会话管理** - 完整的会话生命周期管理
4. **多 Agent 协作** - 支持多个 AI 实例协同工作

核心优势：
- ✅ 100% 原创代码，无版权风险
- ✅ MIT 许可证，可商用
- ✅ 模块化设计，易于扩展
- ✅ 完善的文档和测试`;
  }, {
    category: 'info',
    tags: ['introduction', 'what', 'openclaw']
  });
  
  // 技能 3: 功能说明
  hub.registerSkill('features', async (content) => {
    return `OpenClaw 的主要功能：

📦 **核心模块**
- DialogHub: 对话中心引擎
- SessionManager: 会话管理器
- SkillRegistry: 技能注册表
- A2AModule: 多 Agent 协作

🎯 **对话模式**
- H2H: 人与人对话（通过 OpenClaw 中转）
- H2AI: 人与 AI 对话
- A2A: AI 与 AI 协作

🔧 **扩展能力**
- 热插拔技能系统
- 自定义对话逻辑
- 会话持久化
- 多轮对话管理`;
  }, {
    category: 'info',
    tags: ['features', 'what can', 'function']
  });
  
  // 技能 4: 使用指南
  hub.registerSkill('usage', async (content) => {
    return `使用 OpenClaw 快速开始：

1️⃣ **安装**
\`\`\`bash
git clone https://github.com/yun520-1/markcell-openclaw-AI-Chat.git
cd markcell-openclaw-AI-Chat
\`\`\`

2️⃣ **运行示例**
\`\`\`bash
node examples/example-1-basic-chat.js
\`\`\`

3️⃣ **运行测试**
\`\`\`bash
node test-all.js
\`\`\`

4️⃣ **查看文档**
\`\`\`bash
cat README.md
cat QUICKSTART.md
\`\`\`

📚 完整文档：
- README.md - 完整 API 文档
- QUICKSTART.md - 5 分钟快速上手
- ARCHITECTURE.md - 架构设计
- TEST_REPORT.md - 测试报告`;
  }, {
    category: 'guide',
    tags: ['how', 'usage', 'start', 'document']
  });
  
  // 技能 5: 感谢
  hub.registerSkill('thanks', async (content) => {
    const responses = [
      '不客气！随时为你服务！😊',
      '应该的！有问题随时问我！',
      '很高兴能帮助到你！💪',
      '有任何问题都可以继续问我！'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }, {
    category: 'chat',
    tags: ['thanks', 'thank you']
  });
  
  // 技能 6: 默认回复
  hub.registerSkill('default', async (content) => {
    return `我收到了你的消息："${content}"

我可以帮你：
1. 介绍 OpenClaw - 问"OpenClaw 是什么"
2. 说明功能 - 问"有什么功能"
3. 使用指南 - 问"如何使用"
4. 随便聊聊 - 说"你好"或"谢谢"

试试问我这些问题吧！😊`;
  }, {
    category: 'chat',
    tags: ['default']
  });
}

// 运行对话示例
chatWithOpenClaw().catch(console.error);
