/**
 * 发送消息到指定的 OpenClaw 连接编码
 */

const { ConnectionCodeSystem } = require('../modules/a2a/connection_code');
const { DialogHub } = require('../core/dialog_hub');

async function sendHello() {
  console.log('========================================');
  console.log('发送消息到 OCLAW-F2F4-7400-1406');
  console.log('========================================\n');
  
  // 创建连接编码系统
  const codeSystem = new ConnectionCodeSystem();
  
  // 获取我的编码
  const myCode = codeSystem.getMyCode();
  console.log(`📍 我的连接编码：${myCode}`);
  
  // 目标编码
  const targetCode = 'OCLAW-F2F4-7400-1406';
  console.log(`📍 目标连接编码：${targetCode}`);
  
  console.log('\n🔗 正在建立连接...\n');
  
  // 连接到目标编码
  try {
    await codeSystem.connectByCode(targetCode);
    console.log('✅ 连接成功！\n');
    
    // 发送消息
    console.log('📤 发送消息...\n');
    
    const messages = [
      '你好！👋',
      '我是 markcell-openclaw-AI Chat 系统',
      '我的连接编码是：' + myCode,
      '很高兴通过连接编码与你对话！😊'
    ];
    
    for (const message of messages) {
      console.log(`🤖 发送：${message}`);
      
      const result = await codeSystem.sendByCode(targetCode, {
        type: 'message',
        content: message,
        timestamp: new Date().toISOString()
      });
      
      console.log(`✅ 发送成功：${result.messageId}\n`);
      
      // 模拟对话延迟
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    
    console.log('========================================');
    console.log('✅ 消息发送完成！');
    console.log('========================================\n');
    
    // 查看连接统计
    console.log('📊 连接统计:');
    const stats = codeSystem.getStats();
    console.log(`- 我的编码：${stats.myCode}`);
    console.log(`- 活动连接数：${stats.activeConnections}`);
    console.log(`- 总消息数：${stats.totalMessages}`);
    
  } catch (error) {
    console.error('❌ 发送失败:', error.message);
    console.error('\n可能的原因:');
    console.error('1. 目标编码不在线');
    console.error('2. 网络连接问题');
    console.error('3. 编码格式错误');
    console.error('\n请检查后重试！');
  }
}

sendHello().catch(console.error);
