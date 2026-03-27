/**
 * 简单的 OpenClaw 对话示例
 * 
 * 展示如何与 OpenClaw 进行简单对话
 */

const { DialogHub } = require('../core/dialog_hub');

async function simpleChat() {
  console.log('========================================');
  console.log('与 OpenClaw 简单对话');
  console.log('========================================\n');
  
  // 创建对话中心
  const hub = new DialogHub({
    sessionId: 'simple-chat-001',
    mode: 'h2ai'
  });
  
  // 注册一个简单的对话技能
  hub.registerSkill('chat', async (content) => {
    // 简单的关键词回复
    const responses = {
      '你好': '你好！我是 OpenClaw AI 助手，很高兴为你服务！😊',
      '您好': '您好！有什么我可以帮助你的吗？',
      'openclaw 是什么': 'OpenClaw 是一个强大的 AI 助手平台，支持对话管理、技能扩展、多 Agent 协作等功能。',
      '功能': '主要功能：1.对话管理 2.技能系统 3.会话管理 4.多 Agent 协作',
      '如何使用': '使用很简单！参考 QUICKSTART.md 文档，或运行 node examples/example-1-basic-chat.js',
      '谢谢': '不客气！随时为你服务！😊',
      '再见': '再见！祝你有美好的一天！👋'
    };
    
    // 查找匹配的回复
    for (const [keyword, reply] of Object.entries(responses)) {
      if (content.toLowerCase().includes(keyword.toLowerCase())) {
        return reply;
      }
    }
    
    // 默认回复
    return `我收到了："${content}"\n\n我可以回答：\n- 你好/您好\n- OpenClaw 是什么\n- 有什么功能\n- 如何使用\n- 谢谢/再见`;
  }, {
    category: 'chat',
    tags: ['chat', 'dialog']
  });
  
  // 模拟几轮对话
  const testMessages = [
    '你好',
    'OpenClaw 是什么？',
    '有什么功能？',
    '如何使用？',
    '谢谢',
    '再见'
  ];
  
  for (const message of testMessages) {
    console.log(`👤 你：${message}`);
    
    const response = await hub.processRequest({
      type: 'message',
      content: message
    });
    
    console.log(`🤖 OpenClaw: ${response}\n`);
  }
  
  console.log('=== 对话完成 ===');
  console.log(`会话 ID: ${hub.sessionId}`);
  console.log(`消息数：${hub.getContext().length}`);
}

simpleChat().catch(console.error);
