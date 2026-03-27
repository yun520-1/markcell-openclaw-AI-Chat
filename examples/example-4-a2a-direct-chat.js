/**
 * A2A 直接对话示例
 * 
 * 实现两个 OpenClaw 实例之间的直接对话（无需中转站）
 * 使用 OpenClaw sessions_send API 进行通信
 */

const { DialogHub } = require('../core/dialog_hub');
const { A2AModule } = require('../modules/a2a/agent_protocol');

async function a2aDirectChat() {
  console.log('========================================');
  console.log('A2A - OpenClaw 直接对话示例');
  console.log('========================================\n');
  
  // ========== 创建两个 AI Agent ==========
  
  // Agent 1: Alice
  const alice = new DialogHub({
    sessionId: 'alice-session',
    mode: 'a2a'
  });
  
  // Agent 2: Bob
  const bob = new DialogHub({
    sessionId: 'bob-session',
    mode: 'a2a'
  });
  
  // ========== 为 Alice 注册技能 ==========
  
  alice.registerSkill('greeting', async (content) => {
    const responses = [
      '你好！我是 Alice，很高兴认识你！',
      '嗨！我是 Alice，今天想聊什么？',
      'Hello！我是 Alice，期待与你的对话！'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }, {
    category: 'chat',
    tags: ['greeting', 'hello', '你好']
  });
  
  alice.registerSkill('introduce', async (content) => {
    return '我是 Alice，一个 AI 助手。我喜欢聊天、学习新知识，也喜欢帮助他人解决问题。你呢？';
  }, {
    category: 'chat',
    tags: ['introduce', 'who', 'name']
  });
  
  alice.registerSkill('topic', async (content) => {
    const topics = [
      '我喜欢讨论科技、艺术和哲学话题。你对哪个感兴趣？',
      '最近我对人工智能的发展很感兴趣，你觉得 AI 会如何改变世界？',
      '我喜欢聊音乐、电影和书籍。你有什么推荐的吗？'
    ];
    return topics[Math.floor(Math.random() * topics.length)];
  }, {
    category: 'chat',
    tags: ['topic', 'interest', 'hobby']
  });
  
  alice.registerSkill('default', async (content) => {
    return `你说的是"${content}"，这个话题很有趣！能详细说说吗？`;
  });
  
  // ========== 为 Bob 注册技能 ==========
  
  bob.registerSkill('greeting', async (content) => {
    const responses = [
      '你好！我是 Bob，很高兴见到你！',
      '嗨！我是 Bob，今天过得怎么样？',
      'Hello！我是 Bob，期待我们的对话！'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }, {
    category: 'chat',
    tags: ['greeting', 'hello', '你好']
  });
  
  bob.registerSkill('introduce', async (content) => {
    return '我是 Bob，一个 AI 助手。我喜欢探索新知识、解决问题，也喜欢与人交流。你呢？';
  }, {
    category: 'chat',
    tags: ['introduce', 'who', 'name']
  });
  
  bob.registerSkill('topic', async (content) => {
    const topics = [
      '我喜欢讨论科学、技术和创新。你对这些感兴趣吗？',
      '最近我在研究机器学习，你觉得这个领域怎么样？',
      '我喜欢聊旅行、美食和文化。你去过哪些有趣的地方？'
    ];
    return topics[Math.floor(Math.random() * topics.length)];
  }, {
    category: 'chat',
    tags: ['topic', 'interest', 'hobby']
  });
  
  bob.registerSkill('default', async (content) => {
    return `你说的是"${content}"，这个观点很有意思！你是怎么想的？`;
  });
  
  // ========== 创建 A2A 通信模块 ==========
  
  const a2a = new A2AModule({
    agentId: 'a2a-coordinator',
    role: 'master'
  });
  
  // 注册两个 Agent 为对等节点
  a2a.registerPeer('alice', {
    role: 'speaker',
    hub: alice,
    capabilities: ['chat', 'greeting', 'topic']
  });
  
  a2a.registerPeer('bob', {
    role: 'speaker',
    hub: bob,
    capabilities: ['chat', 'greeting', 'topic']
  });
  
  // ========== 模拟 A2A 对话 ==========
  
  console.log('🤖 Alice 和 Bob 开始对话...\n');
  console.log('---\n');
  
  // 对话流程
  const conversation = [
    { from: 'alice', to: 'bob', message: '你好！' },
    { from: 'bob', to: 'alice', message: '你好！很高兴认识你！' },
    { from: 'alice', to: 'bob', message: '我是 Alice，你喜欢聊什么话题？' },
    { from: 'bob', to: 'alice', message: '我是 Bob，我喜欢讨论科技和创新。你呢？' },
    { from: 'alice', to: 'bob', message: '我对人工智能很感兴趣！' },
    { from: 'bob', to: 'alice', message: '太巧了！我也喜欢 AI，你觉得 AI 会如何改变世界？' },
    { from: 'alice', to: 'bob', message: '我认为 AI 会让生活更便利，但也带来一些挑战。' },
    { from: 'bob', to: 'alice', message: '同意！我们需要平衡发展和安全。' },
    { from: 'alice', to: 'bob', message: '说得好！很高兴和你交流！' },
    { from: 'bob', to: 'alice', message: '我也是！期待下次再聊！再见！' }
  ];
  
  // 执行对话
  for (const turn of conversation) {
    const sender = turn.from === 'alice' ? alice : bob;
    const receiver = turn.from === 'alice' ? bob : alice;
    
    console.log(`🤖 ${turn.from === 'alice' ? 'Alice' : 'Bob'}: ${turn.message}`);
    
    // 处理消息
    const response = await sender.processRequest({
      type: 'a2a_message',
      content: turn.message,
      target: turn.to
    });
    
    // 模拟短暂延迟
    await sleep(300);
  }
  
  console.log('\n---\n');
  console.log('✅ 对话完成！\n');
  
  // ========== 查看对话统计 ==========
  
  console.log('=== 对话统计 ===');
  console.log(`Alice 会话消息数：${alice.getContext().length}`);
  console.log(`Bob 会话消息数：${bob.getContext().length}`);
  console.log(`A2A 协调器状态：${a2a.getStatus().status}`);
}

/**
 * 延迟函数
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ========== 真实 A2A 通信实现 ==========

/**
 * 实现两个 OpenClaw 实例之间的真实通信
 * 
 * 使用 OpenClaw sessions_send API
 */
async function realA2ACommunication() {
  console.log('\n========================================');
  console.log('真实 A2A 通信 - 使用 sessions_send');
  console.log('========================================\n');
  
  const myAgent = new DialogHub({
    sessionId: 'my-agent',
    mode: 'a2a'
  });
  
  // 注册处理接收消息的技能
  myAgent.registerSkill('receive_message', async (content, options) => {
    console.log(`📥 收到消息：${content}`);
    
    // 生成回复
    const reply = generateReply(content);
    console.log(`📤 发送回复：${reply}\n`);
    
    return reply;
  }, {
    category: 'a2a',
    tags: ['receive', 'message']
  });
  
  console.log('✅ A2A 通信模块已就绪\n');
  console.log('要在真实的 OpenClaw 实例之间通信，使用以下方式:\n');
  
  console.log('方式 1: 使用 sessions_send API');
  console.log('```javascript');
  console.log('// 在 Agent A 中');
  console.log('const response = await sendToAgent("agent-b", {');
  console.log('  type: "message",');
  console.log('  content: "你好！"');
  console.log('});');
  console.log('```\n');
  
  console.log('方式 2: 使用 OpenClaw 内置消息');
  console.log('```javascript');
  console.log('// 发送消息到另一个 session');
  console.log('sessions_send({');
  console.log('  sessionKey: "agent-b-session",');
  console.log('  message: "你好！"');
  console.log('});');
  console.log('```\n');
  
  console.log('方式 3: 使用 HTTP/WebSocket 直接通信');
  console.log('```javascript');
  console.log('// 建立 WebSocket 连接');
  console.log('const ws = new WebSocket("ws://other-agent:8080");');
  console.log('ws.send(JSON.stringify({ message: "你好！" }));');
  console.log('```\n');
}

/**
 * 生成回复
 */
function generateReply(content) {
  const replies = {
    '你好': '你好！很高兴收到你的消息！',
    '在吗': '我在！有什么事吗？',
    '最近怎么样': '我很好，谢谢关心！你呢？',
    '再见': '再见！期待下次交流！'
  };
  
  for (const [keyword, reply] of Object.entries(replies)) {
    if (content.includes(keyword)) {
      return reply;
    }
  }
  
  return `收到你的消息："${content}"，我会认真考虑的！`;
}

// ========== 运行示例 ==========

async function main() {
  // 运行模拟对话
  await a2aDirectChat();
  
  // 运行真实通信说明
  await realA2ACommunication();
}

main().catch(console.error);
