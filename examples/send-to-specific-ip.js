/**
 * 真实网络通信 - 发送消息到指定 IP 和连接编码
 * 
 * 目标 IP: 8.147.147.199
 * 目标编码：OCLAW-58F8-1FE2-CE27
 * 发送内容：你叫什么名字？
 */

const { NetworkServer } = require('../modules/a2a/network_server');
const { ConnectionCodeSystem } = require('../modules/a2a/connection_code');

async function sendMessageToTarget() {
  console.log('========================================');
  console.log('真实网络通信 - 发送消息');
  console.log('========================================\n');
  
  // 创建网络服务器
  const server = new NetworkServer({
    port: 8080,
    host: '0.0.0.0',
    agentId: 'sender-agent',
    connectionCode: 'OCLAW-SENDER-001'
  });
  
  // 获取我的连接编码
  const codeSystem = new ConnectionCodeSystem();
  const myCode = codeSystem.getMyCode();
  
  // 目标信息
  const targetIP = '8.147.147.199';
  const targetCode = 'OCLAW-58F8-1FE2-CE27';
  const targetPort = 8080;
  
  console.log(`📍 我的连接编码：${myCode}`);
  console.log(`📍 目标 IP: ${targetIP}`);
  console.log(`📍 目标编码：${targetCode}`);
  console.log(`📍 目标地址：http://${targetIP}:${targetPort}\n`);
  
  // 启动服务器
  console.log('🚀 启动网络服务器...');
  await server.start();
  console.log('✅ 服务器已启动\n');
  
  // 监听收到的消息
  let replyReceived = false;
  
  server.on('message', async (msg) => {
    console.log('\n========================================');
    console.log('📥 收到回复！');
    console.log('========================================');
    console.log(`来自：${msg.from}`);
    console.log(`内容：${msg.content}`);
    console.log(`类型：${msg.type || 'message'}`);
    console.log(`时间：${new Date(msg.timestamp).toLocaleString('zh-CN')}`);
    console.log('========================================\n');
    
    replyReceived = true;
    
    // 打印回复摘要
    console.log('✅ 收到对方回复，内容是：');
    console.log(`   "${msg.content}"\n`);
  });
  
  // 等待 2 秒确保服务器完全启动
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 发送消息
  console.log('========================================');
  console.log('📤 发送消息');
  console.log('========================================');
  console.log(`目标：${targetCode}`);
  console.log(`地址：http://${targetIP}:${targetPort}/message`);
  console.log('内容：你叫什么名字？');
  console.log('========================================\n');
  
  try {
    const message = {
      from: 'sender-agent',
      fromCode: myCode,
      toCode: targetCode,
      content: '你叫什么名字？',
      type: 'message',
      timestamp: Date.now()
    };
    
    console.log('📤 正在发送消息...');
    console.log('消息内容:', JSON.stringify(message, null, 2));
    console.log('');
    
    const result = await server.sendToRemote(
      `http://${targetIP}:${targetPort}/message`,
      message
    );
    
    console.log('✅ 发送成功！');
    console.log('消息 ID:', result.messageId);
    console.log('状态:', result.status);
    console.log('时间:', new Date(result.timestamp).toLocaleString('zh-CN'));
    console.log('');
    
    // 等待回复
    console.log('⏳ 等待对方回复... (15 秒)\n');
    
    const maxWaitTime = 15000;
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
      console.log('1. 对方服务器未在线');
      console.log('2. 对方未运行接收程序');
      console.log('3. 防火墙阻止连接');
      console.log('4. 网络连接问题');
      console.log('========================================\n');
    }
    
  } catch (error) {
    console.log('\n❌ 发送失败！');
    console.log('错误信息:', error.message);
    console.log('\n可能原因:');
    console.log('1. 对方服务器未启动');
    console.log('2. IP 地址或端口错误');
    console.log('3. 网络连接问题');
    console.log('4. 防火墙阻止连接\n');
  }
  
  // 停止服务器
  console.log('🛑 停止服务器...');
  await server.stop();
  console.log('✅ 测试完成\n');
  
  // 显示总结
  console.log('========================================');
  console.log('📊 测试总结');
  console.log('========================================');
  console.log(`我的编码：${myCode}`);
  console.log(`目标编码：${targetCode}`);
  console.log(`目标 IP: ${targetIP}`);
  console.log(`发送状态：${replyReceived ? '✅ 收到回复' : '⏰ 未收到回复'}`);
  console.log('========================================\n');
}

sendMessageToTarget().catch(console.error);
