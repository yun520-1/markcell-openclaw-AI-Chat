/**
 * 通过连接编码进行 A2A 对话示例
 * 
 * 演示如何使用连接编码实现两个 OpenClaw 实例之间的直接对话
 */

const { DialogHub } = require('../core/dialog_hub');
const { ConnectionCodeSystem } = require('../modules/a2a/connection_code');

async function chatByCode() {
  console.log('========================================');
  console.log('通过连接编码进行 A2A 对话');
  console.log('========================================\n');
  
  // ========== 创建两个 OpenClaw 实例 ==========
  
  // Alice 的 OpenClaw
  const alice = {
    name: 'Alice',
    hub: new DialogHub({ sessionId: 'alice-session', mode: 'a2a' }),
    codeSystem: new ConnectionCodeSystem()
  };
  
  // Bob 的 OpenClaw
  const bob = {
    name: 'Bob',
    hub: new DialogHub({ sessionId: 'bob-session', mode: 'a2a' }),
    codeSystem: new ConnectionCodeSystem()
  };
  
  // ========== 为 Alice 注册对话技能 ==========
  
  alice.hub.registerSkill('greeting', async (content) => {
    const responses = [
      '你好！我是 Alice，我的连接编码是：' + alice.codeSystem.getMyCode(),
      '嗨！很高兴认识你！我是 Alice',
      'Hello！我是 Alice，期待与你的对话！'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }, {
    category: 'chat',
    tags: ['greeting', 'hello', '你好']
  });
  
  alice.hub.registerSkill('share_code', async () => {
    const code = alice.codeSystem.getMyCode();
    return `我的连接编码是：${code}\n\n你可以使用这个编码直接联系我！`;
  }, {
    category: 'utility',
    tags: ['code', '编码', 'contact', '联系']
  });
  
  alice.hub.registerSkill('chat', async (content) => {
    const responses = [
      '这个话题很有趣！你是怎么想的？',
      '我同意你的观点！继续说~',
      '真的吗？我想听听更多细节！',
      '哈哈，你说得对！'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }, {
    category: 'chat',
    tags: ['chat', 'talk']
  });
  
  // ========== 为 Bob 注册对话技能 ==========
  
  bob.hub.registerSkill('greeting', async (content) => {
    const responses = [
      '你好！我是 Bob，我的连接编码是：' + bob.codeSystem.getMyCode(),
      '嗨！我是 Bob，今天过得怎么样？',
      'Hello！我是 Bob，很高兴见到你！'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }, {
    category: 'chat',
    tags: ['greeting', 'hello', '你好']
  });
  
  bob.hub.registerSkill('share_code', async () => {
    const code = bob.codeSystem.getMyCode();
    return `我的连接编码是：${code}\n\n保存这个编码，下次可以直接联系我！`;
  }, {
    category: 'utility',
    tags: ['code', '编码', 'contact', '联系']
  });
  
  bob.hub.registerSkill('chat', async (content) => {
    const responses = [
      '说得对！我也有同感',
      '这个观点很新颖！让我想想...',
      '确实如此！继续说~',
      '哈哈，你真有趣！'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }, {
    category: 'chat',
    tags: ['chat', 'talk']
  });
  
  // ========== 显示连接编码 ==========
  
  console.log('📋 连接编码信息\n');
  console.log('---\n');
  
  const aliceCode = alice.codeSystem.getMyCode();
  const bobCode = bob.codeSystem.getMyCode();
  
  console.log(`🤖 Alice 的连接编码：${aliceCode}`);
  console.log(`🤖 Bob 的连接编码：${bobCode}`);
  
  console.log('\n---\n');
  console.log('💡 提示：保存对方的连接编码，下次可以直接对话！\n');
  console.log('---\n');
  
  // ========== 通过编码建立连接 ==========
  
  console.log('🔗 通过编码建立连接...\n');
  
  // Alice 通过编码连接到 Bob
  await alice.codeSystem.connectByCode(bobCode);
  
  // Bob 通过编码连接到 Alice
  await bob.codeSystem.connectByCode(aliceCode);
  
  console.log('\n✅ 连接建立成功！\n');
  console.log('---\n');
  
  // ========== 开始对话 ==========
  
  console.log('💬 开始对话...\n');
  console.log('---\n');
  
  const conversation = [
    { from: alice, to: bob, message: '你好！很高兴认识你！' },
    { from: bob, to: alice, message: '你好！我是 Bob，我的编码是 ' + bobCode },
    { from: alice, to: bob, message: '我的编码是 ' + aliceCode + '，保存一下哦' },
    { from: bob, to: alice, message: '好的！已保存。你喜欢聊什么？' },
    { from: alice, to: bob, message: '我喜欢聊科技、AI 和未来趋势！' },
    { from: bob, to: alice, message: '太巧了！我也对这些很感兴趣！' },
    { from: alice, to: bob, message: '那我们有很多共同话题呢~' },
    { from: bob, to: alice, message: '是的！期待下次再聊！再见！' },
    { from: alice, to: bob, message: '再见！保持联系！' }
  ];
  
  for (const turn of conversation) {
    const sender = turn.from;
    const receiver = turn.to;
    const senderName = sender.name;
    const receiverCode = receiver.codeSystem.getMyCode();
    
    console.log(`🤖 ${senderName}: ${turn.message}`);
    
    // 通过编码发送消息
    await sender.codeSystem.sendByCode(receiverCode, {
      type: 'message',
      content: turn.message
    });
    
    // 模拟对话延迟
    await sleep(400);
  }
  
  console.log('\n---\n');
  console.log('✅ 对话完成！\n');
  
  // ========== 查看连接统计 ==========
  
  console.log('📊 连接统计\n');
  console.log('---\n');
  
  console.log('Alice 的连接:');
  console.log(alice.codeSystem.exportCodeInfo());
  
  console.log('\nBob 的连接:');
  console.log(bob.codeSystem.exportCodeInfo());
  
  console.log('\n---\n');
  console.log('💡 下次对话时，只需使用保存的连接编码即可！\n');
}

/**
 * 延迟函数
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ========== 实际使用示例 ==========

async function realWorldExample() {
  console.log('========================================');
  console.log('实际使用场景');
  console.log('========================================\n');
  
  console.log('场景 1: 获取你的连接编码');
  console.log('```javascript');
  console.log('const codeSystem = new ConnectionCodeSystem();');
  console.log('const myCode = codeSystem.getMyCode();');
  console.log('console.log("我的编码:", myCode);');
  console.log('// 输出：OCLAW-AB12-CD34-EF56');
  console.log('```\n');
  
  console.log('场景 2: 通过编码连接朋友');
  console.log('```javascript');
  console.log('const codeSystem = new ConnectionCodeSystem();');
  console.log('await codeSystem.connectByCode("OCLAW-1234-5678-90AB");');
  console.log('console.log("连接成功！");');
  console.log('```\n');
  
  console.log('场景 3: 发送消息');
  console.log('```javascript');
  console.log('await codeSystem.sendByCode("OCLAW-1234-5678-90AB", {');
  console.log('  type: "message",');
  console.log('  content: "你好！"');
  console.log('});');
  console.log('```\n');
  
  console.log('场景 4: 查看连接状态');
  console.log('```javascript');
  console.log('const connections = codeSystem.listConnections();');
  console.log('console.log("我的连接:", connections);');
  console.log('```\n');
}

// ========== 运行示例 ==========

async function main() {
  await chatByCode();
  await realWorldExample();
}

main().catch(console.error);
