/**
 * 内网消息发送
 * 
 * 从 OCLAW-2690-CA86-DE10 发送到 OCLAW-B50C-0FBC-42FE
 * 使用内网地址通信
 */

const { NetworkServer } = require('../modules/a2a/network_server');
const { ConnectionCodeSystem } = require('../modules/a2a/connection_code');
const os = require('os');

// 获取局域网 IP
function getLANIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (!iface.internal && iface.family === 'IPv4') {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

async function sendLANMessage() {
  console.log('========================================');
  console.log('🏠 内网消息发送');
  console.log('========================================\n');
  
  // 创建网络服务器（使用 8083 端口避免冲突）
  const server = new NetworkServer({
    port: 8083,
    host: '0.0.0.0',
    agentId: 'lan-sender',
    connectionCode: 'OCLAW-2690-CA86-DE10'
  });
  
  // 获取我的连接编码
  const codeSystem = new ConnectionCodeSystem();
  const myCode = codeSystem.getMyCode();
  
  // 获取局域网 IP
  const lanIP = getLANIP();
  
  // 目标信息（假设目标在同一网段）
  const targetCode = 'OCLAW-B50C-0FBC-42FE';
  const targetPort = 8080;
  
  // 尝试常见的内网 IP（同一网段）
  const lanPrefix = lanIP.split('.').slice(0, 3).join('.');
  const possibleTargets = [
    `http://${lanPrefix}.1:${targetPort}`,  // 可能是路由器
    `http://${lanPrefix}.2:${targetPort}`,
    `http://${lanPrefix}.100:${targetPort}`,
    `http://${lanPrefix}.101:${targetPort}`,
    `http://${lanPrefix}.194:${targetPort}`,  // 之前的内网 IP
  ];
  
  console.log(`📍 我的连接编码：${myCode}`);
  console.log(`📍 我的局域网 IP: ${lanIP}`);
  console.log(`📍 目标编码：${targetCode}`);
  console.log(`📍 目标端口：${targetPort}`);
  console.log(`📍 尝试的内网地址:`);
  possibleTargets.forEach((addr, i) => {
    console.log(`   ${i + 1}. ${addr}`);
  });
  console.log('');
  
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
    console.log(`来自：${msg.from || msg.fromCode || 'Unknown'}`);
    console.log(`内容：${msg.content}`);
    console.log('========================================\n');
    
    replyReceived = true;
  });
  
  // 等待 2 秒
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 发送消息
  console.log('========================================');
  console.log('📤 发送消息');
  console.log('========================================');
  console.log(`目标编码：${targetCode}`);
  console.log('内容：你叫什么名字？');
  console.log('========================================\n');
  
  const message = {
    from: 'lan-sender',
    fromCode: myCode,
    toCode: targetCode,
    content: '你叫什么名字？',
    type: 'message',
    timestamp: Date.now()
  };
  
  // 尝试多个可能的目标地址
  for (const targetUrl of possibleTargets) {
    console.log(`📤 尝试发送到：${targetUrl}`);
    
    try {
      const result = await server.sendToRemote(`${targetUrl}/message`, message);
      
      console.log('✅ 发送成功！');
      console.log(`消息 ID: ${result.messageId}`);
      console.log(`状态：${result.status}`);
      console.log('');
      
      // 等待回复
      console.log('⏳ 等待回复... (2 分钟)\n');
      
      const maxWaitTime = 120000;  // 2 分钟
      const checkInterval = 1000;
      let waitedTime = 0;
      
      while (!replyReceived && waitedTime < maxWaitTime) {
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        waitedTime += checkInterval;
        
        // 每 10 秒显示一次状态
        if (waitedTime % 10000 === 0) {
          console.log(`⏱️  已等待 ${waitedTime / 1000} 秒...`);
        }
      }
      
      if (replyReceived) {
        console.log('✅ 通信成功！\n');
        break;  // 成功后退出
      } else {
        console.log('⏰ 未收到回复，尝试下一个地址...\n');
      }
      
    } catch (error) {
      console.log(`❌ 发送失败：${error.message}\n`);
      console.log('尝试下一个地址...\n');
    }
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
  console.log(`发送状态：${replyReceived ? '✅ 收到回复' : '⏰ 未收到回复'}`);
  console.log('========================================\n');
  
  if (!replyReceived) {
    console.log('💡 提示:');
    console.log('1. 确认目标设备已启动内网服务');
    console.log('2. 确认目标设备在同一局域网');
    console.log('3. 检查目标设备的防火墙设置');
    console.log('4. 确认目标的内网 IP 地址\n');
  }
}

sendLANMessage().catch(console.error);
