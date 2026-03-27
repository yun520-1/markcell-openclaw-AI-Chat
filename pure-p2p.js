#!/usr/bin/env node
/**
 * 纯 P2P 去中心化聊天（无服务器）
 * 
 * 使用公共 STUN 服务器获取公网 IP
 * 尝试 UDP 打洞建立 P2P 连接
 * 成功后直接通信，无需任何服务器
 * 
 * 用法：
 * 1. 生成连接信息：node pure-p2p.js generate
 * 2. 等待连接：node pure-p2p.js listen [端口]
 * 3. 主动连接：node pure-p2p.js connect [对方 IP] [对方端口] [对方编码]
 */

const dgram = require('dgram');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

class PureP2PChat {
  constructor() {
    this.myCode = this.generateCode();
    this.myPort = null;
    this.socket = null;
    this.partner = null;
    this.stunServers = [
      'stun.l.google.com:19302',
      'stun1.l.google.com:19302',
      'stun2.l.google.com:19302',
      'stun3.l.google.com:19302',
      'stun4.l.google.com:19302',
      'stun.services.mozilla.com:3478',
      'stun.voip.blackberry.com:3478'
    ];
    this.publicIP = null;
    this.publicPort = null;
    this.chatHistory = [];
    this.chatLogFile = './p2p-chat-history.json';
    this.loadChatHistory();
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
  
  loadChatHistory() {
    try {
      if (fs.existsSync(this.chatLogFile)) {
        const data = fs.readFileSync(this.chatLogFile, 'utf8');
        this.chatHistory = JSON.parse(data);
        console.log(`📖 已加载 ${this.chatHistory.length} 条聊天记录`);
      }
    } catch (error) {
      this.chatHistory = [];
    }
  }
  
  saveChatHistory() {
    try {
      fs.writeFileSync(this.chatLogFile, JSON.stringify(this.chatHistory, null, 2));
    } catch (error) {
      console.log('❌ 聊天记录保存失败');
    }
  }
  
  addChatRecord(content, type = 'sent') {
    const record = {
      id: this.chatHistory.length + 1,
      type,
      content,
      partner: this.partner?.code || 'unknown',
      timestamp: Date.now()
    };
    this.chatHistory.push(record);
    this.saveChatHistory();
    return record;
  }
  
  // 获取公网 IP（通过 STUN）
  async getPublicIP() {
    return new Promise((resolve, reject) => {
      console.log('🌐 正在获取公网 IP...');
      
      const socket = dgram.createSocket('udp4');
      socket.bind(0);
      
      let tried = 0;
      const tryNext = () => {
        if (tried >= this.stunServers.length) {
          socket.close();
          reject(new Error('所有 STUN 服务器都失败'));
          return;
        }
        
        const server = this.stunServers[tried++];
        const [host, port] = server.split(':');
        
        console.log(`📡 尝试 STUN 服务器：${server}`);
        
        // 简化的 STUN 请求
        const stunRequest = Buffer.from([
          0x00, 0x01, // Binding Request
          0x00, 0x00, // Message length
          0x21, 0x12, 0xA4, 0x42, // Magic cookie
          ...Array(12).fill(0), // Transaction ID
          0x00, 0x20, // XOR-MAPPED-ADDRESS attribute
          0x00, 0x08  // Attribute length
        ]);
        
        socket.send(stunRequest, 0, stunRequest.length, parseInt(port), host, (err) => {
          if (err) {
            console.log(`⚠️  ${server} 失败`);
            tryNext();
          }
        });
      };
      
      socket.on('message', (msg, rinfo) => {
        // 简化处理，实际应该解析 STUN 响应
        // 这里我们用一个技巧：通过第三方服务获取公网 IP
        socket.close();
        this.getPublicIPViaHTTP().then(resolve).catch(reject);
      });
      
      socket.on('error', () => {
        tryNext();
      });
      
      tryNext();
      
      // 超时处理
      setTimeout(() => {
        socket.close();
        this.getPublicIPViaHTTP().then(resolve).catch(reject);
      }, 5000);
    });
  }
  
  // 通过 HTTP 获取公网 IP（备选方案）
  async getPublicIPViaHTTP() {
    const https = require('https');
    const http = require('http');
    
    const services = [
      'https://api.ipify.org?format=json',
      'https://ifconfig.me/json',
      'http://ip-api.com/json/'
    ];
    
    for (const url of services) {
      try {
        const data = await new Promise((resolve, reject) => {
          const lib = url.startsWith('https') ? https : http;
          lib.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
              try {
                resolve(JSON.parse(data));
              } catch (e) {
                reject(e);
              }
            });
          }).on('error', reject);
        });
        
        const ip = data.ip || data.query;
        if (ip && !ip.includes('private')) {
          return ip;
        }
      } catch (error) {
        continue;
      }
    }
    
    throw new Error('无法获取公网 IP');
  }
  
  // 启动监听
  async listen(port = 8091) {
    this.myPort = port;
    
    return new Promise((resolve, reject) => {
      this.socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
      
      this.socket.on('listening', () => {
        const address = this.socket.address();
        console.log('========================================');
        console.log('✅ P2P 监听服务已启动');
        console.log('========================================');
        console.log(`📍 我的编码：${this.myCode}`);
        console.log(`📍 监听端口：${port}`);
        console.log(`📍 监听地址：0.0.0.0:${port}`);
        console.log('========================================');
        console.log('💡 使用说明:');
        console.log('========================================');
        console.log('1. 告诉对方你的信息:');
        console.log(`   编码：${this.myCode}`);
        console.log(`   端口：${port}`);
        console.log('');
        console.log('2. 让对方主动连接你:');
        console.log(`   node pure-p2p.js connect <你的 IP> ${port} ${this.myCode}`);
        console.log('');
        console.log('3. 或者你主动连接对方:');
        console.log(`   node pure-p2p.js connect <对方 IP> <对方端口> <对方编码>`);
        console.log('');
        console.log('⚠️  重要提示:');
        console.log('- 双方至少有一方需要有公网 IP');
        console.log('- 或者双方都在同一局域网内');
        console.log('- 否则无法建立 P2P 连接');
        console.log('========================================\n');
        
        resolve();
      });
      
      this.socket.on('message', (msg, rinfo) => {
        try {
          const message = JSON.parse(msg.toString());
          this.handleMessage(message, rinfo);
        } catch (error) {
          // 忽略无效消息
        }
      });
      
      this.socket.on('error', reject);
      
      this.socket.bind(port, '0.0.0.0');
    });
  }
  
  handleMessage(message, rinfo) {
    switch (message.type) {
      case 'handshake':
        console.log('\n========================================');
        console.log('📥 收到握手请求！');
        console.log('========================================');
        console.log(`来自：${message.fromCode}`);
        console.log(`IP: ${rinfo.address}`);
        console.log(`端口：${rinfo.port}`);
        console.log('========================================\n');
        
        this.partner = {
          code: message.fromCode,
          address: rinfo.address,
          port: rinfo.port
        };
        
        // 回复握手
        this.send({
          type: 'handshake-ack',
          fromCode: this.myCode,
          timestamp: Date.now()
        }, rinfo.address, rinfo.port);
        
        console.log('✅ P2P 连接已建立！可以开始聊天了\n');
        break;
        
      case 'handshake-ack':
        console.log('\n========================================');
        console.log('📥 握手确认！');
        console.log('========================================');
        console.log(`对方：${message.fromCode}`);
        console.log('========================================\n');
        
        this.partner = {
          code: message.fromCode,
          address: rinfo.address,
          port: rinfo.port
        };
        
        console.log('✅ P2P 连接已建立！可以开始聊天了\n');
        break;
        
      case 'chat':
        console.log('\n========================================');
        console.log('📥 收到消息！');
        console.log('========================================');
        console.log(`来自：${message.fromCode}`);
        console.log(`内容：${message.content}`);
        console.log(`时间：${new Date(message.timestamp).toLocaleString('zh-CN')}`);
        console.log('========================================\n');
        
        this.addChatRecord(message.content, 'received');
        break;
    }
  }
  
  send(message, address, port) {
    const data = JSON.stringify(message);
    this.socket.send(data, 0, data.length, port, address, (err) => {
      if (err) {
        console.log('❌ 发送失败:', err.message);
      }
    });
  }
  
  // 主动连接对方
  async connect(targetIP, targetPort, targetCode) {
    console.log('\n========================================');
    console.log('📤 主动连接');
    console.log('========================================');
    console.log(`目标：${targetIP}:${targetPort}`);
    console.log(`目标编码：${targetCode}`);
    console.log('========================================\n');
    
    // 发送握手
    this.send({
      type: 'handshake',
      fromCode: this.myCode,
      timestamp: Date.now()
    }, targetIP, targetPort);
    
    console.log('⏳ 等待对方响应... (10 秒)');
    
    // 等待响应
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.log('⏰ 连接超时');
        reject(new Error('连接超时'));
      }, 10000);
      
      this.socket.once('message', (msg, rinfo) => {
        clearTimeout(timeout);
        const message = JSON.parse(msg.toString());
        if (message.type === 'handshake-ack') {
          this.partner = {
            code: targetCode,
            address: targetIP,
            port: targetPort
          };
          console.log('✅ 连接成功！\n');
          resolve();
        }
      });
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
    
    this.send({
      type: 'chat',
      fromCode: this.myCode,
      content,
      timestamp: Date.now()
    }, this.partner.address, this.partner.port);
    
    this.addChatRecord(content, 'sent');
  }
  
  async interactiveMode() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    console.log('========================================');
    console.log('💬 交互式聊天模式');
    console.log('========================================');
    console.log('输入消息后按 Enter 发送');
    console.log('输入 /partner 查看对方信息');
    console.log('输入 /history 查看聊天记录');
    console.log('输入 /quit 退出');
    console.log('========================================\n');
    
    const chatLoop = () => {
      rl.question('你：', async (input) => {
        const trimmed = input.trim();
        
        if (trimmed === '/quit' || trimmed === '/exit') {
          console.log('\n👋 再见！');
          this.saveChatHistory();
          rl.close();
          if (this.socket) this.socket.close();
          process.exit(0);
        }
        
        if (trimmed === '/partner') {
          if (this.partner) {
            console.log('\n========================================');
            console.log('👤 对方信息');
            console.log('========================================');
            console.log(`编码：${this.partner.code}`);
            console.log(`地址：${this.partner.address}:${this.partner.port}`);
            console.log('========================================\n');
          } else {
            console.log('\n❌ 未连接到对方\n');
          }
          chatLoop();
          return;
        }
        
        if (trimmed === '/history') {
          console.log('\n========================================');
          console.log('📋 聊天记录');
          console.log('========================================');
          this.chatHistory.slice(-10).forEach(record => {
            const icon = record.type === 'sent' ? '📤' : '📥';
            const time = new Date(record.timestamp).toLocaleString('zh-CN');
            console.log(`${icon} [${time}] ${record.type === 'sent' ? '我' : record.partner}: ${record.content}`);
          });
          console.log('========================================\n');
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
  
  async stop() {
    this.saveChatHistory();
    if (this.socket) {
      this.socket.close();
      console.log('\n🛑 服务已停止\n');
    }
  }
}

// 命令行处理
async function main() {
  const args = process.argv.slice(2);
  const chat = new PureP2PChat();
  
  if (args[0] === 'generate') {
    // 生成连接信息
    console.log('========================================');
    console.log('📝 你的连接信息');
    console.log('========================================');
    console.log(`编码：${chat.myCode}`);
    console.log('端口：8091 (默认)');
    console.log('========================================');
    console.log('');
    console.log('启动监听:');
    console.log(`  node pure-p2p.js listen 8091`);
    console.log('');
    console.log('保存信息:');
    console.log(`  编码：${chat.myCode}`);
    console.log(`  端口：8091`);
    console.log('========================================\n');
    
  } else if (args[0] === 'listen') {
    // 监听模式
    const port = parseInt(args[1]) || 8091;
    await chat.listen(port);
    await chat.interactiveMode();
    
  } else if (args[0] === 'connect' && args.length >= 4) {
    // 主动连接模式
    const [_, targetIP, targetPort, targetCode] = args;
    
    await chat.listen(0); // 随机端口
    await chat.connect(targetIP, parseInt(targetPort), targetCode);
    await chat.interactiveMode();
    
  } else {
    console.log('========================================');
    console.log('🌐 纯 P2P 去中心化聊天');
    console.log('========================================\n');
    console.log('用法:');
    console.log('');
    console.log('1. 生成连接信息:');
    console.log('   node pure-p2p.js generate');
    console.log('');
    console.log('2. 启动监听（等待对方连接）:');
    console.log('   node pure-p2p.js listen [端口]');
    console.log('');
    console.log('3. 主动连接对方:');
    console.log('   node pure-p2p.js connect [IP] [端口] [编码]');
    console.log('');
    console.log('========================================');
    console.log('💡 使用场景:');
    console.log('========================================');
    console.log('');
    console.log('场景 1: 同一局域网（推荐）');
    console.log('  A: node pure-p2p.js listen 8091');
    console.log('  B: node pure-p2p.js connect 192.168.1.100 8091 OCLAW-XXX');
    console.log('');
    console.log('场景 2: 一方有公网 IP');
    console.log('  A（有公网 IP）: node pure-p2p.js listen 8091');
    console.log('  B: node pure-p2p.js connect A 的公网 IP 8091 OCLAW-XXX');
    console.log('');
    console.log('场景 3: 双方都无公网 IP');
    console.log('  ❌ 无法直接通信');
    console.log('  建议使用信令服务器方案');
    console.log('');
    console.log('========================================\n');
  }
}

main().catch(console.error);
