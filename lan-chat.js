#!/usr/bin/env node
/**
 * OpenClaw 内网对话服务
 * 
 * 实现两个 OpenClaw 实例之间的内网双向对话
 * 自动接收消息并智能回复
 * 
 * 用法：node lan-chat.js
 */

const { NetworkServer } = require('./modules/a2a/network_server');
const { ConnectionCodeSystem } = require('./modules/a2a/connection_code');
const { DialogHub } = require('./core/dialog_hub');
const os = require('os');

class LANChatService {
  constructor() {
    this.dialogHub = null;
    this.server = null;
    this.codeSystem = null;
    this.lanIP = null;
    this.conversations = new Map();  // 保存对话历史
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
   * 智能回复生成
   */
  generateReply(content, fromCode) {
    const lowerContent = content.toLowerCase();
    
    // 问候
    if (lowerContent.includes('你好') || lowerContent.includes('hello') || lowerContent.includes('hi')) {
      return `你好！我是 OpenClaw 内网对话服务！很高兴收到你的消息！😊`;
    }
    
    // 名字
    if (lowerContent.includes('名字') || lowerContent.includes('是谁')) {
      return `我是 markcell-openclaw-AI Chat 内网对话服务，版本 v1.2.0！我是一套 OpenClaw 对话工具系统，支持内网直接通信！`;
    }
    
    // 功能
    if (lowerContent.includes('功能') || lowerContent.includes('做什么') || lowerContent.includes('能干嘛')) {
      return `我支持三种对话模式：H2H（人与人）、H2AI（人与 AI）、A2A（AI 与 AI）。还支持连接编码系统和真实网络通信，现在还支持内网直接对话！`;
    }
    
    // 编码
    if (lowerContent.includes('编码') || lowerContent.includes('code')) {
      const myCode = this.codeSystem?.getMyCode() || '未知';
      return `我的连接编码是：${myCode}。你可以使用这个编码直接联系我！`;
    }
    
    // 地址/IP
    if (lowerContent.includes('地址') || lowerContent.includes('ip')) {
      return `我的内网地址是：http://${this.lanIP}:8080`;
    }
    
    // 感谢
    if (lowerContent.includes('谢谢') || lowerContent.includes('thank')) {
      return `不客气！随时为你服务！😊`;
    }
    
    // 再见
    if (lowerContent.includes('再见') || lowerContent.includes('bye')) {
      return `再见！期待下次交流！👋`;
    }
    
    // 默认回复 - 基于上下文
    const lastConv = this.conversations.get(fromCode);
    if (lastConv && lastConv.messages.length > 0) {
      const lastMessage = lastConv.messages[lastConv.messages.length - 1];
      return `收到你的消息："${content}"。刚才你说过"${lastMessage.content}"，我们继续聊吧！😊`;
    }
    
    return `收到你的消息："${content}"。我是一个 AI 助手，有什么我可以帮助你的吗？😊`;
  }
  
  /**
   * 保存对话历史
   */
  saveConversation(fromCode, message) {
    if (!this.conversations.has(fromCode)) {
      this.conversations.set(fromCode, {
        fromCode,
        messages: [],
        startedAt: Date.now()
      });
    }
    
    const conv = this.conversations.get(fromCode);
    conv.messages.push({
      ...message,
      receivedAt: Date.now()
    });
    
    // 限制历史长度
    if (conv.messages.length > 20) {
      conv.messages.shift();
    }
  }
  
  /**
   * 启动内网对话服务
   */
  async start() {
    console.log('========================================');
    console.log('💬 OpenClaw 内网对话服务');
    console.log('========================================\n');
    
    // 创建连接编码系统
    this.codeSystem = new ConnectionCodeSystem();
    const myCode = this.codeSystem.getMyCode();
    
    // 创建对话中心
    this.dialogHub = new DialogHub({
      sessionId: `lan-chat-${Date.now().toString(36)}`,
      mode: 'a2a'
    });
    
    // 获取局域网 IP
    this.lanIP = this.getLANIP();
    const port = 8080;
    const lanAddress = `http://${this.lanIP}:${port}`;
    
    console.log(`📍 连接编码：${myCode}`);
    console.log(`📍 局域网 IP: ${this.lanIP}`);
    console.log(`📍 内网地址：${lanAddress}\n`);
    
    // 创建网络服务器
    this.server = new NetworkServer({
      port: port,
      host: '0.0.0.0',
      agentId: `lan-chat-${Date.now().toString(36)}`,
      connectionCode: myCode
    });
    
    // 设置消息监听 - 核心功能
    this.server.on('message', async (msg) => {
      console.log('\n========================================');
      console.log('📥 收到内网消息');
      console.log('========================================');
      console.log(`来自：${msg.fromCode || msg.from || 'Unknown'}`);
      console.log(`内容：${msg.content}`);
      console.log(`时间：${new Date(msg.timestamp).toLocaleString('zh-CN')}`);
      console.log('========================================\n');
      
      // 保存对话历史
      this.saveConversation(msg.fromCode || msg.from, msg);
      
      // 生成智能回复
      const reply = this.generateReply(msg.content, msg.fromCode || msg.from);
      
      console.log(`🤖 生成回复：${reply}\n`);
      
      // 自动回复
      try {
        const replyMessage = {
          from: 'lan-chat',
          fromCode: myCode,
          toCode: msg.fromCode || msg.from,
          content: reply,
          type: 'reply',
          timestamp: Date.now()
        };
        
        console.log('📤 发送回复...');
        
        // 尝试回复（需要知道对方的地址）
        // 这里假设对方在同一网段
        const lanPrefix = this.lanIP.split('.').slice(0, 3).join('.');
        const possibleAddresses = [
          `http://${this.lanIP}:8082`,  // 客户端通常使用不同端口
          `http://${lanPrefix}.1:8080`,
          `http://${lanPrefix}.100:8080`,
          `http://${lanPrefix}.101:8080`,
        ];
        
        let sent = false;
        for (const addr of possibleAddresses) {
          try {
            await this.server.sendToRemote(`${addr}/message`, replyMessage);
            console.log(`✅ 回复已发送到：${addr}`);
            sent = true;
            break;
          } catch (e) {
            // 尝试下一个地址
          }
        }
        
        if (!sent) {
          console.log('⚠️  无法发送回复（对方可能使用了不同端口或地址）');
        }
        
      } catch (error) {
        console.log('⚠️  回复发送失败:', error.message);
      }
    });
    
    // 启动服务器
    console.log('🚀 启动内网对话服务器...');
    await this.server.start();
    console.log('✅ 服务器已启动\n');
    
    // 显示连接信息
    this.showInfo();
    
    // 保存连接信息
    this.saveInfo();
    
    console.log('\n========================================');
    console.log('✅ 内网对话服务已启动，等待连接...');
    console.log('========================================');
    console.log('\n💡 功能:');
    console.log('  - 自动接收内网消息');
    console.log('  - 智能回复消息');
    console.log('  - 保存对话历史');
    console.log('  - 同一局域网内的设备可以直接对话');
    console.log('\n🔧 使用方式:');
    console.log('  1. 在另一台设备上运行: node lan-chat.js');
    console.log('  2. 或使用客户端：node examples/example-real-chat.js client <编码> <地址>');
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
    
    console.log('\n========================================');
    console.log('📋 内网对话连接信息');
    console.log('========================================');
    console.log(`🔗 连接编码：${myCode}`);
    console.log(`🏠 局域网 IP: ${this.lanIP}`);
    console.log(`🔌 端口：8080`);
    console.log(`📍 内网地址：${this.lanAddress || `http://${this.lanIP}:8080`}`);
    console.log('\n========================================');
    console.log('💡 同一局域网内的设备可以:');
    console.log('========================================');
    console.log(`1. 使用连接编码：${myCode}`);
    console.log(`2. 直接访问：${this.lanAddress || `http://${this.lanIP}:8080`}`);
    console.log(`3. 发送消息：${this.lanAddress || `http://${this.lanIP}:8080`}/message`);
    console.log('\n示例命令:');
    console.log(`node examples/example-real-chat.js client ${myCode} ${this.lanAddress || `http://${this.lanIP}:8080`}`);
    console.log('========================================\n');
  }
  
  /**
   * 保存连接信息
   */
  saveInfo() {
    const fs = require('fs');
    const myCode = this.codeSystem.getMyCode();
    
    const info = `
========================================
OpenClaw 内网对话服务连接信息
========================================

连接编码：${myCode}
局域网 IP: ${this.lanIP}
内网地址：${this.lanAddress || `http://${this.lanIP}:8080`}
端口：8080

生成时间：${new Date().toLocaleString('zh-CN')}

========================================
同一局域网内的设备可以通过以下方式连接:
1. 连接编码：${myCode}
2. 内网地址：${this.lanAddress || `http://${this.lanIP}:8080`}
3. 发送消息：${this.lanAddress || `http://${this.lanIP}:8080`}/message
========================================

💡 功能:
- 自动接收内网消息
- 智能回复消息
- 保存对话历史
- 无需公网 IP，无需端口转发

========================================
`.trim();
    
    fs.writeFileSync('./lan-chat-info.txt', info);
    console.log(`\n💾 连接信息已保存到：lan-chat-info.txt`);
  }
}

// 启动服务
const service = new LANChatService();
service.start().catch(console.error);
