/**
 * 示例 1: 基础对话
 * 
 * 演示如何使用 DialogHub 创建简单的对话系统
 */

const { DialogHub } = require('../core/dialog_hub');

async function runDemo() {
  console.log('=== OpenClaw 对话工具 - 基础对话示例 ===\n');
  
  // 创建对话中心
  const hub = new DialogHub({
    sessionId: 'demo-session-001',
    mode: 'h2ai'
  });
  
  // 注册聊天技能
  hub.registerSkill('chat', async (content, options) => {
    const responses = {
      '你好': '你好！有什么可以帮助你的吗？',
      '您好': '您好！很高兴为您服务。',
      '再见': '再见！祝你有美好的一天！',
      '拜拜': '拜拜！期待下次见面。',
      '谢谢': '不客气！随时为你服务。',
      '感谢': '应该的！有问题随时找我。',
      'help': '可用命令：你好、再见、谢谢、天气、时间、帮助',
      '帮助': '我是一个 AI 助手，可以陪你聊天、回答问题、执行任务。试试说"你好"开始吧！'
    };
    
    return responses[content] || `我收到了："${content}"\n\n提示：说"帮助"查看可用功能，或说"你好"开始聊天。`;
  }, {
    category: 'chat',
    tags: ['chat', 'basic', 'demo']
  });
  
  // 注册天气技能（模拟）
  hub.registerSkill('weather', async (content) => {
    const weathers = [
      '今天天气晴朗，气温 25°C，微风，适合外出活动！☀️',
      '今天多云转晴，气温 22-28°C，空气质量良好。⛅',
      '今天有小雨，气温 20°C，记得带伞哦！☔',
      '今天阳光明媚，气温 26°C，非常适合户外运动！🌤️'
    ];
    return weathers[Math.floor(Math.random() * weathers.length)];
  }, {
    category: 'utility',
    tags: ['weather', 'query']
  });
  
  // 注册时间技能
  hub.registerSkill('time', async () => {
    const now = new Date();
    return `当前时间：${now.toLocaleString('zh-CN', { 
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })}`;
  }, {
    category: 'utility',
    tags: ['time', 'query']
  });
  
  // 模拟对话
  const messages = [
    '你好',
    'help',
    '今天天气怎么样',
    '现在几点了',
    '谢谢',
    '再见'
  ];
  
  console.log('开始对话...\n');
  
  for (const message of messages) {
    console.log(`👤 用户：${message}`);
    
    const response = await hub.processRequest({
      type: 'message',
      content: message
    });
    
    console.log(`🤖 助手：${response}\n`);
  }
  
  // 查看会话状态
  console.log('=== 会话状态 ===');
  const status = hub.getStatus();
  console.log(`会话 ID: ${status.sessionId}`);
  console.log(`模式：${status.mode}`);
  console.log(`状态：${status.state}`);
  console.log(`上下文消息数：${status.contextLength}`);
  console.log(`注册技能数：${status.skillsCount}`);
  
  // 导出会话
  console.log('\n=== 导出会话数据 ===');
  const exported = hub.exportSession();
  console.log(`导出时间：${exported.exportedAt}`);
  console.log(`消息数量：${exported.context.length}`);
  
  console.log('\n=== 示例完成 ===');
}

// 运行示例
runDemo().catch(console.error);
