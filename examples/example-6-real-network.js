/**
 * 真实网络通信示例
 * 
 * 演示两个 OpenClaw 实例通过真实网络进行通信
 * 支持 HTTP 和 WebSocket 两种模式
 */

const { NetworkServer } = require('../modules/a2a/network_server');
const { WebSocketClient, WebSocketServer } = require('../modules/a2a/websocket_client');
const { ConnectionCodeSystem } = require('../modules/a2a/connection_code');

async function realNetworkDemo() {
  console.log('========================================');
  console.log('真实网络通信演示');
  console.log('========================================\n');
  
  // ========== 场景 1: HTTP 模式 ==========
  console.log('📡 场景 1: HTTP 网络通信\n');
  console.log('---\n');
  
  // 创建两个网络服务器（模拟两个 OpenClaw 实例）
  const server1 = new NetworkServer({
    port: 8080,
    agentId: 'alice-agent',
    connectionCode: 'OCLAW-AAAA-BBBB-CCCC'
  });
  
  const server2 = new NetworkServer({
    port: 8081,
    agentId: 'bob-agent',
    connectionCode: 'OCLAW-DDDD-EEEE-FFFF'
  });
  
  // 启动服务器
  console.log('🚀 启动服务器 1 (Alice)...');
  await server1.start();
  
  console.log('🚀 启动服务器 2 (Bob)...');
  await server2.start();
  
  // 设置消息监听
  server1.on('message', (msg) => {
    console.log(`\n📥 Alice 收到来自 ${msg.from}: ${msg.content}`);
  });
  
  server2.on('message', (msg) => {
    console.log(`\n📥 Bob 收到来自 ${msg.from}: ${msg.content}`);
  });
  
  console.log('\n💬 开始 HTTP 对话...\n');
  
  // Alice 发送消息给 Bob
  const message1 = {
    from: 'alice-agent',
    content: '你好 Bob！我是 Alice！',
    type: 'message',
    timestamp: Date.now()
  };
  
  console.log('📤 Alice 发送消息给 Bob...');
  const result1 = await server1.sendToRemote('http://localhost:8081/message', message1);
  console.log('✅ 发送成功:', result1);
  
  // Bob 回复
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const message2 = {
    from: 'bob-agent',
    content: '你好 Alice！很高兴认识你！',
    type: 'message',
    timestamp: Date.now()
  };
  
  console.log('\n📤 Bob 回复消息给 Alice...');
  const result2 = await server2.sendToRemote('http://localhost:8080/message', message2);
  console.log('✅ 发送成功:', result2);
  
  // 查看服务器状态
  console.log('\n📊 服务器状态:');
  console.log('Alice:', server1.getServerInfo());
  console.log('Bob:', server2.getServerInfo());
  
  console.log('\n---\n');
  
  // ========== 场景 2: WebSocket 模式 ==========
  console.log('📡 场景 2: WebSocket 实时通信\n');
  console.log('---\n');
  
  console.log('⚠️  注意：WebSocket 模式需要安装 ws 库');
  console.log('安装命令：npm install ws\n');
  
  // 创建 WebSocket 客户端
  const wsClient = new WebSocketClient({
    url: 'ws://localhost:8082',
    agentId: 'ws-client',
    connectionCode: 'OCLAW-1111-2222-3333'
  });
  
  // 监听事件
  wsClient.on('connect', () => {
    console.log('✅ WebSocket 连接成功！');
  });
  
  wsClient.on('message', (msg) => {
    console.log(`📥 收到 WebSocket 消息:`, msg);
  });
  
  wsClient.on('close', () => {
    console.log('🔌 WebSocket 连接关闭');
  });
  
  wsClient.on('error', (error) => {
    console.log('❌ WebSocket 错误:', error.message);
  });
  
  console.log('🔌 尝试连接 WebSocket 服务器...');
  console.log('(如果 ws 库未安装，会显示错误，这是正常的)\n');
  
  try {
    await wsClient.connect();
    console.log('WebSocket 连接成功！');
  } catch (error) {
    console.log('WebSocket 连接失败（需要安装 ws 库）');
  }
  
  console.log('\n---\n');
  
  // ========== 场景 3: 连接编码 + 网络 ==========
  console.log('📡 场景 3: 连接编码 + 真实网络\n');
  console.log('---\n');
  
  const codeSystem = new ConnectionCodeSystem();
  const myCode = codeSystem.getMyCode();
  
  console.log(`我的连接编码：${myCode}`);
  console.log(`网络服务器：http://localhost:8080`);
  console.log('\n其他 OpenClaw 实例可以通过以下方式连接:');
  console.log(`1. 连接编码：${myCode}`);
  console.log(`2. 网络地址：http://<你的 IP>:8080`);
  console.log(`3. 完整 URL: http://<你的 IP>:8080/handshake`);
  
  // 停止服务器
  console.log('\n\n🛑 停止服务器...\n');
  await server1.stop();
  await server2.stop();
  
  console.log('✅ 演示完成！\n');
}

// 运行演示
realNetworkDemo().catch(console.error);
