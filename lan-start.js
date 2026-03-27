#!/usr/bin/env node
/**
 * 内网连接服务
 * 
 * 获取局域网 IP，实现在内网中的设备直接通信
 * 
 * 用法：node lan-start.js
 */

const { NetworkServer } = require('./modules/a2a/network_server');
const { ConnectionCodeSystem } = require('./modules/a2a/connection_code');
const os = require('os');

class LANService {
  constructor() {
    this.configPath = './config/lan-config.json';
    this.server = null;
    this.codeSystem = null;
    this.lanIP = null;
    this.lanAddress = null;
  }
  
  /**
   * 获取局域网 IP
   */
  getLANIP() {
    const interfaces = os.networkInterfaces();
    
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        // 跳过内部和 IPv6
        if (iface.internal || iface.family !== 'IPv4') {
          continue;
        }
        
        // 返回第一个非 127.0.0.1 的 IP
        return iface.address;
      }
    }
    
    return 'localhost';
  }
  
  /**
   * 启动内网服务
   */
  async start() {
    console.log('========================================');
    console.log('🏠 OpenClaw 内网连接服务');
    console.log('========================================\n');
    
    // 创建连接编码系统
    this.codeSystem = new ConnectionCodeSystem();
    const myCode = this.codeSystem.getMyCode();
    
    // 获取局域网 IP
    this.lanIP = this.getLANIP();
    const port = 8080;
    this.lanAddress = `http://${this.lanIP}:${port}`;
    
    console.log(`📍 连接编码：${myCode}`);
    console.log(`📍 局域网 IP: ${this.lanIP}`);
    console.log(`📍 内网地址：${this.lanAddress}\n`);
    
    // 创建网络服务器
    this.server = new NetworkServer({
      port: port,
      host: '0.0.0.0',  // 监听所有网络接口
      agentId: `lan-agent-${Date.now().toString(36)}`,
      connectionCode: myCode
    });
    
    // 设置消息监听
    this.server.on('message', (msg) => {
      console.log('\n========================================');
      console.log('📥 收到内网消息');
      console.log('========================================');
      console.log(`来自：${msg.from || msg.fromCode || 'Unknown'}`);
      console.log(`内容：${msg.content}`);
      console.log(`时间：${new Date(msg.timestamp).toLocaleString('zh-CN')}`);
      console.log('========================================\n');
      
      // 自动回复
      this.autoReply(msg);
    });
    
    // 启动服务器
    console.log('🚀 启动内网服务器...');
    await this.server.start();
    console.log('✅ 服务器已启动\n');
    
    // 显示连接信息
    this.showLANInfo();
    
    // 保存连接信息
    this.saveLANInfo();
    
    console.log('\n========================================');
    console.log('✅ 内网服务已启动，等待连接...');
    console.log('========================================');
    console.log('\n💡 提示:');
    console.log('  - 同一局域网内的设备可以连接');
    console.log('  - 无需公网 IP，无需端口转发');
    console.log('  - 按 Ctrl+C 停止服务');
    console.log('========================================\n');
    
    // 保持运行
    await new Promise(() => {});
  }
  
  /**
   * 自动回复
   */
  autoReply(msg) {
    const content = msg.content.toLowerCase();
    let reply = null;
    
    if (content.includes('你好') || content.includes('hello')) {
      reply = '你好！我是内网 OpenClaw 服务！😊';
    } else if (content.includes('名字')) {
      reply = '我是 markcell-openclaw-AI Chat 内网服务！';
    } else if (content.includes('功能')) {
      reply = '我支持内网直接通信，无需公网 IP！';
    } else {
      reply = `收到你的消息："${msg.content}"。有什么我可以帮助你的吗？😊`;
    }
    
    console.log(`📤 自动回复：${reply}`);
  }
  
  /**
   * 显示内网信息
   */
  showLANInfo() {
    console.log('\n========================================');
    console.log('📋 内网连接信息');
    console.log('========================================');
    console.log(`🔗 连接编码：${this.codeSystem.getMyCode()}`);
    console.log(`🏠 局域网 IP: ${this.lanIP}`);
    console.log(`🔌 端口：8080`);
    console.log(`📍 内网地址：${this.lanAddress}`);
    console.log('\n========================================');
    console.log('💡 在同一局域网内的其他设备可以:');
    console.log('========================================');
    console.log(`1. 使用连接编码：${this.codeSystem.getMyCode()}`);
    console.log(`2. 直接访问：${this.lanAddress}`);
    console.log(`3. 发送消息：${this.lanAddress}/message`);
    console.log('\n示例命令:');
    console.log(`node examples/example-real-chat.js client ${this.codeSystem.getMyCode()} ${this.lanAddress}`);
    console.log('========================================\n');
  }
  
  /**
   * 保存内网信息
   */
  saveLANInfo() {
    const fs = require('fs');
    const info = `
========================================
我的 OpenClaw 内网连接信息
========================================

连接编码：${this.codeSystem.getMyCode()}
局域网 IP: ${this.lanIP}
内网地址：${this.lanAddress}
端口：8080

生成时间：${new Date().toLocaleString('zh-CN')}

========================================
同一局域网内的设备可以通过以下方式连接:
1. 连接编码：${this.codeSystem.getMyCode()}
2. 内网地址：${this.lanAddress}
3. 发送消息：${this.lanAddress}/message
========================================

💡 提示:
- 确保设备在同一局域网（连接同一个 WiFi/路由器）
- 无需公网 IP，无需端口转发
- 如果无法连接，请检查防火墙设置
========================================
`.trim();
    
    fs.writeFileSync('./my-lan-info.txt', info);
    console.log(`\n💾 内网信息已保存到：my-lan-info.txt`);
  }
}

// 启动服务
const service = new LANService();
service.start().catch(console.error);
