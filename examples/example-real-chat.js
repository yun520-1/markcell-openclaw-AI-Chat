/**
 * 真实网络聊天客户端
 * 
 * 用法：node examples/example-real-chat.js <mode> [targetCode] [targetUrl]
 * 
 * 示例：
 * node examples/example-real-chat.js client OCLAW-D850-118F-19E5 http://8.147.147.199:3456
 */

const { NetworkServer } = require('../modules/a2a/network_server');
const { ConnectionCodeSystem } = require('../modules/a2a/connection_code');

// 解析命令行参数
const args = process.argv.slice(2);
const mode = args[0] || 'client';
const targetCode = args[1] || null;
const targetUrl = args[2] || null;

async function runChat() {
  console.log('========================================');
  console.log('真实网络聊天客户端');
  console.log('========================================\n');
  
  // 创建网络服务器
  const server = new NetworkServer({
    port: 8080,
    host: '0.0.0.0',
    agentId: 'chat-client',
    connectionCode: 'OCLAW-CLIENT-001'
  });
  
  // 获取我的连接编码
  const codeSystem = new ConnectionCodeSystem();
  const myCode = codeSystem.getMyCode();
  
  console.log(`📍 我的连接编码：${myCode}`);
  console.log(`📍 模式：${mode}`);
  
  if (targetCode && targetUrl) {
    console.log(`📍 目标编码：${targetCode}`);
    console.log(`📍 目标地址：${targetUrl}\n`);
  }
  
  // 启动服务器
  console.log('🚀 启动网络服务器...');
  await server.start();
  console.log('✅ 服务器已启动\n');
  
  // 监听收到的消息
  server.on('message', async (msg) => {
    console.log('\n========================================');
    console.log('📥 收到消息');
    console.log('========================================');
    console.log(`来自：${msg.from || msg.fromCode || 'Unknown'}`);
    console.log(`内容：${msg.content}`);
    console.log(`时间：${new Date(msg.timestamp).toLocaleString('zh-CN')}`);
    console.log('========================================\n');
    
    // 自动回复逻辑
    if (msg.content.includes('你叫什么名字')) {
      const reply = {
        from: 'chat-client',
        fromCode: myCode,
        content: '我是 markcell-openclaw-AI Chat 系统，版本 v1.1.0！很高兴认识你！😊',
        type: 'reply',
        timestamp: Date.now()
      };
      
      console.log('📤 自动回复...');
      console.log(`回复内容：${reply.content}\n`);
      
      // 如果有目标地址，发送回复
      if (targetUrl) {
        try {
          await server.sendToRemote(`${targetUrl}/message`, reply);
          console.log('✅ 回复发送成功\n');
        } catch (error) {
          console.log('⚠️  回复发送失败:', error.message, '\n');
        }
      }
    } else if (msg.content.includes('你好')) {
      const reply = {
        from: 'chat-client',
        fromCode: myCode,
        content: '你好！很高兴收到你的消息！有什么我可以帮助你的吗？😊',
        type: 'reply',
        timestamp: Date.now()
      };
      
      console.log('📤 自动回复...');
      console.log(`回复内容：${reply.content}\n`);
      
      if (targetUrl) {
        try {
          await server.sendToRemote(`${targetUrl}/message`, reply);
          console.log('✅ 回复发送成功\n');
        } catch (error) {
          console.log('⚠️  回复发送失败:', error.message, '\n');
        }
      }
    }
  });
  
  // 如果是客户端模式且有目标地址，发送测试消息
  if (mode === 'client' && targetCode && targetUrl) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('========================================');
    console.log('📤 发送测试消息');
    console.log('========================================');
    console.log(`目标：${targetCode}`);
    console.log(`地址：${targetUrl}/message`);
    console.log('内容：你叫什么名字？');
    console.log('========================================\n');
    
    try {
      const message = {
        from: 'chat-client',
        fromCode: myCode,
        toCode: targetCode,
        content: '你叫什么名字？',
        type: 'message',
        timestamp: Date.now()
      };
      
      console.log('📤 正在发送消息...\n');
      
      const result = await server.sendToRemote(`${targetUrl}/message`, message);
      
      console.log('✅ 发送成功！');
      console.log(`消息 ID: ${result.messageId}`);
      console.log(`状态：${result.status}`);
      console.log('');
      
      // 等待回复
      console.log('⏳ 等待对方回复... (20 秒)\n');
      
      const maxWaitTime = 20000;
      let replyReceived = false;
      
      // 临时监听回复
      const replyHandler = (msg) => {
        if (msg.type === 'reply' || msg.content.includes('我是') || msg.content.includes('名字')) {
          replyReceived = true;
          console.log('\n========================================');
          console.log('✅ 收到回复！');
          console.log('========================================');
          console.log(`内容：${msg.content}`);
          console.log('========================================\n');
        }
      };
      
      server.on('message', replyHandler);
      
      // 等待回复
      await new Promise(resolve => setTimeout(resolve, maxWaitTime));
      
      if (!replyReceived) {
        console.log('\n⏰ 等待超时，未收到回复\n');
      }
      
    } catch (error) {
      console.log('\n❌ 发送失败！');
      console.log(`错误信息：${error.message}`);
      console.log('\n可能原因:');
      console.log('1. 对方服务器未启动');
      console.log('2. IP 地址或端口错误');
      console.log('3. 网络连接问题');
      console.log('4. 防火墙阻止连接\n');
    }
  } else {
    console.log('💡 服务器已就绪，等待连接...\n');
    console.log('其他 OpenClaw 实例可以通过以下方式连接:');
    console.log(`- 连接编码：${myCode}`);
    console.log(`- 网络地址：http://你的 IP:8080`);
    console.log('');
  }
  
  // 保持运行，等待消息
  console.log('========================================');
  console.log('按 Ctrl+C 停止服务器');
  console.log('========================================\n');
  
  // 保持进程运行
  await new Promise(() => {}); // 永久等待
}

// 运行聊天
runChat().catch(console.error);
