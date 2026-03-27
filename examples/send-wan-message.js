/**
 * 外网消息发送测试
 * 
 * 发送到公网地址：http://49.87.224.177:8080
 * 目标编码：OCLAW-CECB-2C97-44F3
 * 发送内容：你叫什么名字？
 */

const { NetworkServer } = require('../modules/a2a/network_server');
const { ConnectionCodeSystem } = require('../modules/a2a/connection_code');

async function sendWANMessage() {
  console.log('========================================');
  console.log('🌐 外网消息发送测试');
  console.log('========================================\n');
  
  // 创建网络服务器（使用 8085 端口避免冲突）
  const server = new NetworkServer({
    port: 8085,
    host: '0.0.0.0',
    agentId: 'wan-test-sender',
    connectionCode: 'OCLAW-TEST-SENDER'
  });
  
  // 获取我的连接编码
  const codeSystem = new ConnectionCodeSystem();
  const myCode = codeSystem.getMyCode();
  
  // 目标信息（公网地址）
  const targetCode = 'OCLAW-CECB-2C97-44F3';
  const targetIP = '49.87.224.177';
  const targetPort = 8080;
  const targetUrl = `http://${targetIP}:${targetPort}`;
  
  console.log(`📍 我的连接编码：${myCode}`);
  console.log(`📍 目标编码：${targetCode}`);
  console.log(`📍 目标公网地址：${targetUrl}`);
  console.log('📍 发送内容：你叫什么名字？\n');
  
  // 启动服务器
  console.log('🚀 启动网络服务器...');
  await server.start();
  console.log('✅ 服务器已启动\n');
  
  // 监听回复
  let replyReceived = false;
  
  server.on('message', (msg) => {
    console.log('\n========================================');
    console.log('📥 收到外网回复！');
    console.log('========================================');
    console.log(`来自：${msg.fromCode || msg.from || 'Unknown'}`);
    console.log(`内容：${msg.content}`);
    console.log(`类型：${msg.type || 'message'}`);
    console.log(`时间：${new Date(msg.timestamp).toLocaleString('zh-CN')}`);
    console.log('========================================\n');
    
    replyReceived = true;
  });
  
  // 等待 2 秒
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 发送消息
  console.log('========================================');
  console.log('📤 发送外网消息');
  console.log('========================================');
  console.log(`目标：${targetCode}`);
  console.log(`地址：${targetUrl}/message`);
  console.log('内容：你叫什么名字？');
  console.log('========================================\n');
  
  try {
    const message = {
      from: 'wan-test-sender',
      fromCode: myCode,
      toCode: targetCode,
      content: '你叫什么名字？',
      type: 'message',
      timestamp: Date.now(),
      fromAddress: `http://localhost:8085`  // 提供回复地址
    };
    
    console.log('📤 正在发送到外网服务器...\n');
    console.log('消息内容:', JSON.stringify(message, null, 2));
    console.log('');
    
    const result = await server.sendToRemote(`${targetUrl}/message`, message);
    
    console.log('✅ 发送成功！');
    console.log(`消息 ID: ${result.messageId}`);
    console.log(`状态：${result.status}`);
    console.log(`时间：${new Date(result.timestamp).toLocaleString('zh-CN')}`);
    console.log('');
    
    // 等待回复（2 分钟）
    console.log('⏳ 等待外网回复... (2 分钟)\n');
    
    const maxWaitTime = 120000;
    const checkInterval = 1000;
    let waitedTime = 0;
    
    while (!replyReceived && waitedTime < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      waitedTime += checkInterval;
      
      // 每 10 秒显示状态
      if (waitedTime % 10000 === 0) {
        console.log(`⏱️  已等待 ${waitedTime / 1000} 秒...`);
      }
    }
    
    if (replyReceived) {
      console.log('========================================');
      console.log('✅ 外网通信成功！');
      console.log('========================================\n');
    } else {
      console.log('\n========================================');
      console.log('⏰ 等待超时（2 分钟）');
      console.log('========================================');
      console.log('未收到回复，可能原因:');
      console.log('1. 目标服务器未运行自动回复');
      console.log('2. 目标服务器已停止');
      console.log('3. 防火墙阻止回复');
      console.log('4. 网络延迟较高');
      console.log('========================================\n');
    }
    
  } catch (error) {
    console.log('\n❌ 发送失败！');
    console.log(`错误信息：${error.message}`);
    console.log('\n可能原因:');
    console.log('1. 目标服务器未启动');
    console.log('2. 公网 IP 不正确');
    console.log('3. 端口未开放');
    console.log('4. 防火墙阻止连接');
    console.log('5. 网络不可达\n');
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

sendWANMessage().catch(console.error);
