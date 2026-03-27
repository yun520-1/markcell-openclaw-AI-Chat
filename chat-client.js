#!/usr/bin/env node
/**
 * 去中心化聊天客户端（带信令服务器）
 * 
 * 通过信令服务器协助建立 P2P 连接
 * P2P 失败时自动切换到信令服务器中转
 * 
 * 用法：node chat-client.js [信令服务器地址]
 */

const WebSocket = require('ws');
const http = require('http');

class ChatClient {
  constructor(signalingServer = 'ws://localhost:8080') {
    this.signalingServer = signalingServer;
    this.ws = null;
    this.clientId = null;
    this.myCode = this.generateCode();
    this.myPort = 8091;
    this.partner = null;
    this.roomId = null;
    this.chatHistory = [];
    this.httpServer = null;
  }
  
  generateCode() {
    const prefix = 'OCLAW';
    const segments = [];
    for (let i = 0; i < 3; i++) {
      const segment = Math.random().toString(16).substr(2, 4).toUpperCase();
      segments.push(segment);
    }
    return `${prefix}-${segments.join('-')}`;
  }
  
  async connect() {
    return new Promise((resolve, reject) => {
      console.log(`📶 连接到信令服务器：${this.signalingServer}`);
      
      this.ws = new WebSocket(this.signalingServer);
      
      this.ws.on('open', () => {
        console.log('✅ 已连接到信令服务器');
        
        // 注册自己
        this.send({
          type: 'register',
          code: this.myCode,
          port: this.myPort
        });
        
        resolve();
      });
      
      this.ws.on('message', (data) => {
        const message = JSON.parse(data);
        this.handleMessage(message);
      });
      
      this.ws.on('close', () => {
        console.log('❌ 与信令服务器断开连接');
      });
      
      this.ws.on('error', reject);
    });
  }
  
  handleMessage(message) {
    console.log(`\n📨 收到消息：${message.type}`);
    
    switch (message.type) {
      case 'connected':
        this.clientId = message.clientId;
        console.log(`🆔 我的客户端 ID: ${this.clientId}`);
        console.log(`📍 我的编码：${this.myCode}`);
        break;
        
      case 'registered':
        console.log(`✅ 编码已注册：${message.code}`);
        break;
        
      case 'room-created':
        this.roomId = message.roomId;
        this.partner = message.partner;
        console.log(`\n🏠 房间已创建：${this.roomId}`);
        console.log(`👤 对方：${this.partner.code}`);
        console.log(`🌐 对方 IP: ${this.partner.ip}`);
        console.log(`🔌 对方端口：${this.partner.port}`);
        console.log('\n💡 现在可以尝试 P2P 连接，或通过信令服务器聊天');
        break;
        
      case 'room-joined':
        this.roomId = message.roomId;
        this.partner = message.partner;
        console.log(`\n🏠 已加入房间：${this.roomId}`);
        console.log(`👤 对方：${this.partner.code}`);
        break;
        
      case 'chat-message':
        console.log('\n========================================');
        console.log('📥 收到消息！');
        console.log('========================================');
        console.log(`来自：${message.fromCode || message.from}`);
        console.log(`内容：${message.content}`);
        console.log(`时间：${new Date(message.timestamp).toLocaleString('zh-CN')}`);
        console.log('========================================\n');
        
        this.chatHistory.push({
          type: 'received',
          from: message.fromCode,
          content: message.content,
          timestamp: message.timestamp
        });
        break;
        
      case 'error':
        console.log(`❌ 错误：${message.error}`);
        break;
    }
  }
  
  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
  
  async invite(partnerCode) {
    console.log(`\n📤 邀请对方：${partnerCode}`);
    this.send({
      type: 'create',
      partnerCode
    });
  }
  
  async sendMessage(content) {
    if (!this.partner) {
      console.log('❌ 未连接到对方');
      return;
    }
    
    console.log('\n========================================');
    console.log('📤 发送消息');
    console.log('========================================');
    console.log(`对方：${this.partner.code}`);
    console.log(`内容：${content}`);
    console.log('========================================\n');
    
    // 通过信令服务器发送
    this.send({
      type: 'chat',
      content
    });
    
    this.chatHistory.push({
      type: 'sent',
      to: this.partner.code,
      content,
      timestamp: Date.now()
    });
  }
  
  async startHTTPServer(port = 8091) {
    this.myPort = port;
    
    return new Promise((resolve) => {
      this.httpServer = http.createServer((req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        
        if (req.url === '/health' && req.method === 'GET') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            status: 'ok',
            code: this.myCode,
            clientId: this.clientId,
            partner: this.partner?.code || null,
            chatCount: this.chatHistory.length
          }));
        } else if (req.url === '/history' && req.method === 'GET') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            status: 'ok',
            history: this.chatHistory
          }));
        } else {
          res.writeHead(404);
          res.end('Not Found');
        }
      });
      
      this.httpServer.listen(port, '0.0.0.0', () => {
        console.log(`✅ HTTP 服务已启动：http://0.0.0.0:${port}`);
        console.log(`📍 健康检查：http://0.0.0.0:${port}/health`);
        console.log(`📍 聊天记录：http://0.0.0.0:${port}/history`);
        resolve();
      });
    });
  }
  
  async interactiveMode() {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    console.log('\n========================================');
    console.log('💬 交互式聊天模式');
    console.log('========================================');
    console.log('输入消息后按 Enter 发送');
    console.log('输入 /invite [编码] 邀请对方');
    console.log('输入 /history 查看聊天记录');
    console.log('输入 /quit 退出');
    console.log('========================================\n');
    
    const chatLoop = () => {
      rl.question('你：', async (input) => {
        const trimmed = input.trim();
        
        if (trimmed === '/quit' || trimmed === '/exit') {
          console.log('\n👋 再见！');
          this.saveHistory();
          rl.close();
          process.exit(0);
        }
        
        if (trimmed === '/history') {
          console.log('\n========================================');
          console.log('📋 聊天记录');
          console.log('========================================');
          this.chatHistory.slice(-10).forEach(record => {
            const icon = record.type === 'sent' ? '📤' : '📥';
            const time = new Date(record.timestamp).toLocaleString('zh-CN');
            console.log(`${icon} [${time}] ${record.type === 'sent' ? '我' : record.from}: ${record.content}`);
          });
          console.log('========================================\n');
          chatLoop();
          return;
        }
        
        if (trimmed.startsWith('/invite ')) {
          const partnerCode = trimmed.replace('/invite ', '');
          await this.invite(partnerCode);
          chatLoop();
          return;
        }
        
        if (trimmed) {
          await this.sendMessage(trimmed);
        }
        
        chatLoop();
      });
    };
    
    chatLoop();
  }
  
  saveHistory() {
    const fs = require('fs');
    try {
      fs.writeFileSync('chat-history-client.json', JSON.stringify(this.chatHistory, null, 2));
      console.log('💾 聊天记录已保存');
    } catch (error) {
      console.log('❌ 保存失败:', error.message);
    }
  }
  
  async stop() {
    this.saveHistory();
    
    if (this.ws) {
      this.ws.close();
    }
    
    if (this.httpServer) {
      this.httpServer.close();
    }
    
    console.log('\n🛑 服务已停止\n');
  }
}

// 命令行处理
async function main() {
  const args = process.argv.slice(2);
  const signalingServer = args[0] || 'ws://localhost:8080';
  
  const client = new ChatClient(signalingServer);
  
  try {
    // 连接信令服务器
    await client.connect();
    
    // 启动 HTTP 服务
    await client.startHTTPServer(8091);
    
    // 进入交互模式
    client.interactiveMode();
    
    // 优雅退出
    process.on('SIGINT', async () => {
      await client.stop();
      process.exit(0);
    });
  } catch (error) {
    console.log(`❌ 启动失败：${error.message}`);
    console.log('\n请确保信令服务器正在运行');
    console.log('启动信令服务器：node signaling-server.js');
    process.exit(1);
  }
}

// 检查 ws 模块
try {
  require.resolve('ws');
  main();
} catch (error) {
  console.log('❌ 缺少 ws 模块，请安装：npm install ws');
  process.exit(1);
}
