/**
 * 本地/内网消息发送
 * 
 * 发送到同一台电脑上的外网服务
 * 端口：1234
 */

const { NetworkServer } = require('../modules/a2a/network_server');
const { ConnectionCodeSystem } = require('../modules/a2a/connection_code');

async function sendLocalMessage() {
  console.log('========================================');
  console.log('🏠 本地消息发送 - 同一台电脑');
  console.log('========================================\n');
  
  // 创建网络服务器（使用 8090 端口避免冲突）
  const server = new NetworkServer({
    port: 8090,
    host: '0.0.0.0',
    agentId: 'local-sender',
    connectionCode: 'OCLAW-LOCAL-SENDER'
  });
  
  // 获取我的连接编码
  const codeSystem = new ConnectionCodeSystem();
  const myCode = codeSystem.getMyCode();
  
  // 目标信息（本地地址）
  const targetCode = 'OCLAW-F519-A7DB-2310';
  const targetPort = 1234;  // 外网服务的端口
  const targetUrl = `http://localhost:${targetPort}`;
  
  console.log(`📍 我的连接编码：${myCode}`);
  console.log(`📍 目标编码：${targetCode}`);
  console.log(`📍 目标地址：${targetUrl}`);
  console.log(`📍 发送内容：你好\n`);
  
  // 启动服务器
  console.log('🚀 启动网络服务器...');
  await server.start();
  console.log('✅ 服务器已启动\n');
  
  // 监听回复
  let replyReceived = false;
  
  server.on('message', (msg) => {
    console.log('\n========================================');
    console.log('📥 收到回复！');
    console.log('========================================');
    console.log(`来自：${msg.fromCode || msg.from || 'Unknown'}`);
    console.log(`内容：${msg.content}`);
    console.log(`类型：${msg.type || 'message'}`);
    console.log(`时间：${new Date(msg.timestamp).toLocaleString('zh-CN')}`);
    console.log('========================================\n');
    
    replyReceived = true;
    
    // 显示回复摘要
    console.log('✅ 收到对方回复！');
    console.log(`回复内容："${msg.content}"\n`);
  });
  
  // 等待 2 秒
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 发送消息
  console.log('========================================');
  console.log('📤 发送本地消息');
  console.log('========================================');
  console.log(`目标：${targetCode}`);
  console.log(`地址：${targetUrl}/message`);
  console.log('内容：你好');
  console.log('========================================\n');
  
  try {
    const message = {
      from: 'local-sender',
      fromCode: myCode,
      toCode: targetCode,
      content: '你好',
      type: 'message',
      timestamp: Date.now(),
      fromAddress: `http://localhost:8090`
    };
    
    console.log('📤 正在发送到本地服务器...\n');
    
    const result = await server.sendToRemote(`${targetUrl}/message`, message);
    
    console.log('✅ 发送成功！');
    console.log(`消息 ID: ${result.messageId}`);
    console.log(`状态：${result.status}`);
    console.log('');
    
    // 等待回复（30 秒）
    console.log('⏳ 等待回复... (30 秒)\n');
    
    const maxWaitTime = 30000;
    const checkInterval = 1000;
    let waitedTime = 0;
    
    while (!replyReceived && waitedTime < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      waitedTime += checkInterval;
      
      if (waitedTime % 5000 === 0) {
        console.log(`⏱️  已等待 ${waitedTime / 1000} 秒...`);
      }
    }
    
    if (!replyReceived) {
      console.log('\n========================================');
      console.log('⏰ 等待超时');
      console.log('========================================');
      console.log('未收到回复，可能原因:');
      console.log('1. 目标服务未运行自动回复');
      console.log('2. 目标服务已停止');
      console.log('========================================\n');
    } else {
      console.log('========================================');
      console.log('✅ 本地通信成功！');
      console.log('========================================\n');
    }
    
  } catch (error) {
    console.log('\n❌ 发送失败！');
    console.log(`错误信息：${error.message}`);
    console.log('\n可能原因:');
    console.log('1. 目标服务未启动');
    console.log('2. 端口不正确（应该是 1234）');
    console.log('3. 服务监听地址不是 0.0.0.0\n');
  }
  
  // 停止服务器
  console.log('🛑 停止服务器...');
  await server.stop();
  console.log('✅ 测试完成\n');
  
  // 总结
  console.log('========================================');
  console.log('📊 测试总结');
  console.log('========================================');
  console.log(`我的编码：${myCode}`);
  console.log(`目标编码：${targetCode}`);
  console.log(`目标地址：${targetUrl}`);
  console.log(`发送状态：${replyReceived ? '✅ 收到回复' : '⏰ 未收到回复'}`);
  console.log('========================================\n');
}

sendLocalMessage().catch(console.error);
