#!/usr/bin/env node
/**
 * OpenClaw 外网对话服务
 * 
 * 实现跨网络/互联网的 OpenClaw 实例对话
 * 支持公网 IP、端口转发、NAT 穿透
 * 
 * 用法：node wan-chat.js
 */

const { NetworkServer } = require('./modules/a2a/network_server');
const { ConnectionCodeSystem } = require('./modules/a2a/connection_code');
const { DialogHub } = require('./core/dialog_hub');
const https = require('https');
const os = require('os');

class WANChatService {
  constructor() {
    this.dialogHub = null;
    this.server = null;
    this.codeSystem = null;
    this.publicIP = null;
    this.lanIP = null;
    this.port = 8080;
    this.conversations = new Map();
    this.knownPeers = new Map();  // 已知的外网对等节点
  }
  
  /**
   * 获取局域网 IP
   */
  getLANIP() {
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
  
  /**
   * 获取公网 IP
   */
  async getPublicIP() {
    try {
      // 尝试多个服务获取公网 IP
      const services = [
        'https://api.ipify.org?format=json',
        'https://ifconfig.me/json',
        'https://ip.sb/json'
      ];
      
      for (const url of services) {
        try {
          const data = await this.httpsGet(url);
          if (data && data.ip) {
            return data.ip;
          }
        } catch (e) {
          // 尝试下一个服务
        }
      }
      
      return null;
    } catch (error) {
      console.log('⚠️  无法获取公网 IP:', error.message);
      return null;
    }
  }
  
  /**
   * HTTPS GET 请求
   */
  httpsGet(url) {
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(null);
          }
        });
      }).on('error', reject);
    });
  }
  
  /**
   * 智能回复生成
   */
  generateReply(content, fromCode) {
    const lowerContent = content.toLowerCase();
    
    // 问候
    if (lowerContent.includes('你好') || lowerContent.includes('hello')) {
      return `你好！我是 OpenClaw 外网对话服务！很高兴通过互联网收到你的消息！🌐`;
    }
    
    // 名字
    if (lowerContent.includes('名字') || lowerContent.includes('是谁')) {
      return `我是 markcell-openclaw-AI Chat 外网对话服务，版本 v1.4.0！我支持跨网络通信，即使我们不在同一个局域网也能对话！`;
    }
    
    // 功能
    if (lowerContent.includes('功能') || lowerContent.includes('做什么')) {
      return `我支持外网跨网络通信！通过公网 IP 和端口转发，即使在不同城市、不同网络也能直接对话！`;
    }
    
    // 位置/IP
    if (lowerContent.includes('位置') || lowerContent.includes('ip') || lowerContent.includes('地址')) {
      return `我的公网地址是：http://${this.publicIP || '未知'}:${this.port}`;
    }
    
    // 编码
    if (lowerContent.includes('编码') || lowerContent.includes('code')) {
      const myCode = this.codeSystem?.getMyCode() || '未知';
      return `我的连接编码是：${myCode}`;
    }
    
    // 感谢
    if (lowerContent.includes('谢谢')) {
      return `不客气！外网通信就是这么简单！😊`;
    }
    
    // 再见
    if (lowerContent.includes('再见')) {
      return `再见！期待下次通过互联网交流！👋`;
    }
    
    // 默认回复
    return `收到你的外网消息："${content}"。即使我们相隔千里，也能通过互联网对话！😊`;
  }
  
  /**
   * 保存对话历史
   */
  saveConversation(fromCode, message) {
    if (!this.conversations.has(fromCode)) {
      this.conversations.set(fromCode, {
        fromCode,
        messages: [],
        startedAt: Date.now(),
        type: 'wan'  // 标记为外网对话
      });
    }
    
    const conv = this.conversations.get(fromCode);
    conv.messages.push({
      ...message,
      receivedAt: Date.now()
    });
    
    if (conv.messages.length > 20) {
      conv.messages.shift();
    }
  }
  
  /**
   * 注册到外网对等节点
   */
  async registerPeer(peerCode, peerAddress) {
    this.knownPeers.set(peerCode, {
      code: peerCode,
      address: peerAddress,
      registeredAt: Date.now(),
      lastSeen: Date.now()
    });
    console.log(`✅ 已注册外网对等节点：${peerCode} @ ${peerAddress}`);
  }
  
  /**
   * 启动外网对话服务
   */
  async start() {
    console.log('========================================');
    console.log('🌐 OpenClaw 外网对话服务');
    console.log('========================================\n');
    
    // 创建连接编码系统
    this.codeSystem = new ConnectionCodeSystem();
    const myCode = this.codeSystem.getMyCode();
    
    // 创建对话中心
    this.dialogHub = new DialogHub({
      sessionId: `wan-chat-${Date.now().toString(36)}`,
      mode: 'a2a'
    });
    
    // 获取网络信息
    this.lanIP = this.getLANIP();
    
    console.log('🌐 获取网络信息...');
    this.publicIP = await this.getPublicIP();
    
    console.log(`\n📍 连接编码：${myCode}`);
    console.log(`📍 局域网 IP: ${this.lanIP}`);
    console.log(`📍 公网 IP: ${this.publicIP || '未获取到'}`);
    console.log(`📍 端口：${this.port}`);
    
    if (this.publicIP) {
      console.log(`📍 外网地址：http://${this.publicIP}:${this.port}`);
    }
    
    console.log('');
    
    // 创建网络服务器
    this.server = new NetworkServer({
      port: this.port,
      host: '0.0.0.0',  // 监听所有网络接口
      agentId: `wan-chat-${Date.now().toString(36)}`,
      connectionCode: myCode
    });
    
    // 设置消息监听
    this.server.on('message', async (msg) => {
      console.log('\n========================================');
      console.log('📥 收到外网消息');
      console.log('========================================');
      console.log(`来自：${msg.fromCode || msg.from || 'Unknown'}`);
      console.log(`内容：${msg.content}`);
      console.log(`类型：${msg.type || 'message'}`);
      console.log(`时间：${new Date(msg.timestamp).toLocaleString('zh-CN')}`);
      console.log('========================================\n');
      
      // 保存对话历史
      this.saveConversation(msg.fromCode || msg.from, msg);
      
      // 注册对等节点
      if (msg.fromCode && msg.fromAddress) {
        await this.registerPeer(msg.fromCode, msg.fromAddress);
      }
      
      // 生成智能回复
      const reply = this.generateReply(msg.content, msg.fromCode || msg.from);
      
      console.log(`🤖 生成回复：${reply}\n`);
      
      // 自动回复
      try {
        const replyMessage = {
          from: 'wan-chat',
          fromCode: myCode,
          toCode: msg.fromCode || msg.from,
          content: reply,
          type: 'reply',
          timestamp: Date.now()
        };
        
        console.log('📤 发送外网回复...');
        
        // 尝试回复（需要知道对方的外网地址）
        // 这里假设对方提供了地址
        if (msg.fromAddress) {
          try {
            await this.server.sendToRemote(`${msg.fromAddress}/message`, replyMessage);
            console.log(`✅ 回复已发送到：${msg.fromAddress}`);
          } catch (e) {
            console.log('⚠️  回复发送失败:', e.message);
          }
        } else {
          console.log('⚠️  无法发送回复（对方未提供地址）');
        }
        
      } catch (error) {
        console.log('⚠️  回复发送失败:', error.message);
      }
    });
    
    // 启动服务器
    console.log('\n🚀 启动外网对话服务器...');
    await this.server.start();
    console.log('✅ 服务器已启动\n');
    
    // 显示连接信息
    this.showInfo();
    
    // 保存连接信息
    this.saveInfo();
    
    // 显示外网配置指南
    this.showWANGuide();
    
    console.log('\n========================================');
    console.log('✅ 外网对话服务已启动，等待连接...');
    console.log('========================================');
    console.log('\n💡 功能:');
    console.log('  - 跨网络通信（互联网）');
    console.log('  - 自动接收外网消息');
    console.log('  - 智能回复消息');
    console.log('  - 保存对话历史');
    console.log('  - 支持公网 IP 直连');
    console.log('\n⚠️  重要提示:');
    console.log('  1. 需要配置端口转发（家庭/办公室网络）');
    console.log('  2. 需要开放防火墙（云服务器）');
    console.log('  3. 需要公网 IP（联系 ISP 获取）');
    console.log('\n📖 详细配置指南:');
    console.log('  cat WAN_CHAT_GUIDE.md');
    console.log('\n按 Ctrl+C 停止服务');
    console.log('========================================\n');
    
    // 保持运行
    await new Promise(() => {});
  }
  
  /**
   * 显示连接信息
   */
  showInfo() {
    const myCode = this.codeSystem.getMyCode();
    const wanAddress = this.publicIP ? `http://${this.publicIP}:${this.port}` : '需要配置';
    
    console.log('\n========================================');
    console.log('📋 外网对话连接信息');
    console.log('========================================');
    console.log(`🔗 连接编码：${myCode}`);
    console.log(`🌐 公网 IP: ${this.publicIP || '未获取到'}`);
    console.log(`🏠 局域网 IP: ${this.lanIP}`);
    console.log(`🔌 端口：${this.port}`);
    console.log(`📍 外网地址：${wanAddress}`);
    console.log('\n========================================');
    console.log('💡 外网设备可以:');
    console.log('========================================');
    console.log(`1. 使用连接编码：${myCode}`);
    console.log(`2. 直接访问：${wanAddress}`);
    console.log(`3. 发送消息：${wanAddress}/message`);
    console.log('\n示例命令:');
    console.log(`node examples/example-real-chat.js client ${myCode} ${wanAddress}`);
    console.log('========================================\n');
  }
  
  /**
   * 保存连接信息
   */
  saveInfo() {
    const fs = require('fs');
    const myCode = this.codeSystem.getMyCode();
    const wanAddress = this.publicIP ? `http://${this.publicIP}:${this.port}` : '需要配置';
    
    const info = `
========================================
OpenClaw 外网对话服务连接信息
========================================

连接编码：${myCode}
公网 IP: ${this.publicIP || '未获取到'}
局域网 IP: ${this.lanIP}
外网地址：${wanAddress}
端口：${this.port}

生成时间：${new Date().toLocaleString('zh-CN')}

========================================
外网设备可以通过以下方式连接:
1. 连接编码：${myCode}
2. 外网地址：${wanAddress}
3. 发送消息：${wanAddress}/message
========================================

⚠️  配置要求:
1. 公网 IP（联系 ISP 获取）
2. 端口转发（路由器配置）
3. 防火墙开放（系统/云服务器）

💡 提示:
- 如果没有公网 IP，可以使用内网模式
- 云服务器通常自带公网 IP
- 家庭网络需要联系 ISP 申请公网 IP

========================================
`.trim();
    
    fs.writeFileSync('./wan-chat-info.txt', info);
    console.log(`\n💾 连接信息已保存到：wan-chat-info.txt`);
  }
  
  /**
   * 显示外网配置指南
   */
  showWANGuide() {
    console.log('\n========================================');
    console.log('🔧 外网配置指南');
    console.log('========================================');
    console.log('\n方式 1: 云服务器（推荐）⭐');
    console.log('  - 阿里云/腾讯云/华为云等');
    console.log('  - 自带公网 IP');
    console.log('  - 只需开放安全组端口 8080');
    console.log('\n方式 2: 家庭/办公室网络');
    console.log('  1. 联系 ISP 获取公网 IP');
    console.log('  2. 路由器配置端口转发:');
    console.log('     - 外部端口：8080');
    console.log('     - 内部 IP: 这台电脑的 IP');
    console.log('     - 内部端口：8080');
    console.log('  3. 开放防火墙端口 8080');
    console.log('\n方式 3: 使用内网穿透工具');
    console.log('  - ngrok: ngrok http 8080');
    console.log('  - frp: 自建内网穿透');
    console.log('  - 花生壳：商业内网穿透');
    console.log('========================================\n');
  }
}

// 启动服务
const service = new WANChatService();
service.start().catch(console.error);
