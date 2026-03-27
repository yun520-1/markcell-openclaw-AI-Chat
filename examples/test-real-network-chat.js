/**
 * 测试真实网络连接 - 发送消息并接收回复
 * 
 * 目标编码：OCLAW-58F8-1FE2-CE27
 * 发送内容：你叫什么名字？
 */

const { NetworkServer } = require('../modules/a2a/network_server');
const { ConnectionCodeSystem } = require('../modules/a2a/connection_code');

async function testRealNetwork() {
  console.log('========================================');
  console.log('真实网络连接测试');
  console.log('========================================\n');
  
  // 创建网络服务器
  const server = new NetworkServer({
    port: 8080,
    host: '0.0.0.0',
    agentId: 'test-agent',
    connectionCode: 'OCLAW-TEST-0001'
  });
  
  // 创建连接编码系统
  const codeSystem = new ConnectionCodeSystem();
  const myCode = codeSystem.getMyCode();
  
  console.log(`📍 我的连接编码：${myCode}`);
  console.log(`📍 目标连接编码：OCLAW-58F8-1FE2-CE27`);
  console.log(`📍 网络服务器：http://0.0.0.0:8080\n`);
  
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
    console.log(`时间：${new Date(msg.timestamp).toLocaleString('zh-CN')}`);
    console.log('========================================\n');
    
    replyReceived = true;
    
    // 发送确认回复
    const confirmMsg = {
      from: 'test-agent',
      content: `收到你的回复了！谢谢！😊`,
      type: 'reply',
      timestamp: Date.now()
    };
    
    console.log('📤 发送确认回复...');
    try {
      // 尝试回复（需要知道对方的服务器地址）
      console.log('✅ 确认消息已准备发送');
    } catch (error) {
      console.log('⚠️  回复失败（对方可能已断开）');
    }
  });
  
  // 等待 2 秒确保服务器完全启动
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 发送测试消息
  console.log('========================================');
  console.log('📤 发送测试消息');
  console.log('========================================');
  console.log('目标：OCLAW-58F8-1FE2-CE27');
  console.log('内容：你叫什么名字？');
  console.log('========================================\n');
  
  // 注意：真实网络通信需要知道对方的服务器地址
  // 这里演示两种场景
  
  console.log('⚠️  注意：真实网络通信需要知道对方的服务器地址\n');
  console.log('场景 1: 如果知道对方的服务器地址');
  console.log('```javascript');
  console.log('await server.sendToRemote("http://对方 IP:8080/message", {');
  console.log('  from: "test-agent",');
  console.log('  content: "你叫什么名字？",');
  console.log('  type: "message"');
  console.log('});');
  console.log('```\n');
  
  console.log('场景 2: 通过连接编码查找服务器地址');
  console.log('这需要一个中央注册表服务来映射编码到地址\n');
  
  // 模拟发送（因为不知道对方的真实服务器地址）
  console.log('========================================');
  console.log('📋 测试说明');
  console.log('========================================\n');
  console.log('要完成真实网络通信，需要:');
  console.log('1. ✅ 连接编码（已有）');
  console.log('2. ⏳ 对方的服务器地址（需要获取）');
  console.log('3. ✅ 网络服务器（已启动）');
  console.log('4. ✅ 消息监听（已设置）\n');
  
  console.log('💡 解决方案:');
  console.log('方式 1: 直接告知服务器地址');
  console.log('  例如：http://192.168.1.100:8080\n');
  
  console.log('方式 2: 使用中央注册表');
  console.log('  将连接编码注册到中央服务，通过编码查找地址\n');
  
  console.log('方式 3: 手动交换地址');
  console.log('  双方互相告知自己的服务器地址\n');
  
  // 保持服务器运行 30 秒等待回复
  console.log('⏳ 等待回复中... (10 秒)\n');
  console.log('如果对方服务器在线且地址正确，将会收到回复。\n');
  
  // 等待回复
  const maxWaitTime = 10000; // 10 秒
  const checkInterval = 1000; // 1 秒检查一次
  let waitedTime = 0;
  
  while (!replyReceived && waitedTime < maxWaitTime) {
    await new Promise(resolve => setTimeout(resolve, checkInterval));
    waitedTime += checkInterval;
    
    // 每 5 秒显示一次状态
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
    console.log('2. 服务器地址不正确');
    console.log('3. 网络连接问题');
    console.log('4. 防火墙阻止连接');
    console.log('========================================\n');
  }
  
  // 停止服务器
  console.log('🛑 停止服务器...');
  await server.stop();
  console.log('✅ 测试完成\n');
  
  // 显示使用指南
  console.log('========================================');
  console.log('📖 使用指南');
  console.log('========================================\n');
  console.log('完整的真实网络通信示例:');
  console.log('```bash');
  console.log('node examples/example-6-real-network.js');
  console.log('```\n');
  
  console.log('文档:');
  console.log('```bash');
  console.log('cat docs/REAL_NETWORK_GUIDE.md');
  console.log('```\n');
}

testRealNetwork().catch(console.error);
