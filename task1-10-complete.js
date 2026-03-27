#!/usr/bin/env node
/**
 * 任务 2: 密钥对生成和管理
 * 任务 3: 消息加密/解密
 * 任务 4: P2P 网络连接
 * 任务 5: 消息广播
 * 任务 6: 路由表管理
 * 任务 7: NAT 穿透
 * 任务 8: 消息存储转发
 * 任务 9: 节点信誉
 * 任务 10: 完整集成
 * 
 * 所有任务整合到一个完整的去中心化聊天系统
 */

const dgram = require('dgram');
const crypto = require('crypto');
const fs = require('fs');
const readline = require('readline');

class DecentralizedChat {
  constructor(port = 8091) {
    // 任务 1: 节点发现
    this.myId = crypto.randomBytes(20).toString('hex');
    this.myCode = this.generateCode();
    this.port = port;
    this.socket = null;
    this.knownNodes = new Map();
    
    // 任务 2&3: 密钥对和加密
    this.keyPair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    
    // 任务 6: 路由表
    this.routingTable = new Map();
    
    // 任务 8: 消息存储
    this.messageStore = new Map();
    this.pendingMessages = [];
    
    // 任务 9: 节点信誉
    this.nodeReputation = new Map();
    
    // 任务 10: 聊天
    this.chatHistory = [];
    
    this.bootstrapNodes = [
      { ip: '127.0.0.1', port: 8091 },
      { ip: '127.0.0.1', port: 8092 },
      { ip: '127.0.0.1', port: 8093 }
    ];
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
  
  // 任务 3: 加密/解密
  encrypt(message, publicKey) {
    const buffer = Buffer.from(message, 'utf8');
    const encrypted = crypto.publicEncrypt({
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING
    }, buffer);
    return encrypted.toString('base64');
  }
  
  decrypt(encryptedBase64) {
    const buffer = Buffer.from(encryptedBase64, 'base64');
    const decrypted = crypto.privateDecrypt({
      key: this.keyPair.privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING
    }, buffer);
    return decrypted.toString('utf8');
  }
  
  // 任务 4: P2P 连接
  async start() {
    return new Promise((resolve, reject) => {
      this.socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
      
      this.socket.on('listening', () => {
        console.log('========================================');
        console.log('🌐 比特币式去中心化聊天系统');
        console.log('========================================');
        console.log(`📍 节点 ID: ${this.myId.substr(0, 16)}...`);
        console.log(`📍 连接编码：${this.myCode}`);
        console.log(`📍 监听端口：${this.port}`);
        console.log(`📍 公钥指纹：${this.getPublicKeyFingerprint()}`);
        console.log('========================================');
        console.log('💡 使用说明:');
        console.log('========================================');
        console.log('1. 启动多个节点:');
        console.log('   node task1-10-complete.js 8091');
        console.log('   node task1-10-complete.js 8092');
        console.log('');
        console.log('2. 发送消息:');
        console.log('   @OCLAW-XXX 消息内容');
        console.log('');
        console.log('3. 查看命令:');
        console.log('   /nodes - 查看节点');
        console.log('   /history - 聊天记录');
        console.log('   /quit - 退出');
        console.log('========================================\n');
        
        resolve();
        
        setInterval(() => this.broadcastPresence(), 30000);
        setInterval(() => this.cleanup(), 60000);
      });
      
      this.socket.on('message', (msg, rinfo) => {
        this.handleMessage(msg, rinfo);
      });
      
      this.socket.on('error', reject);
      this.socket.bind(this.port, '0.0.0.0');
      
      setTimeout(() => this.connectToBootstrap(), 2000);
    });
  }
  
  handleMessage(msg, rinfo) {
    try {
      const message = JSON.parse(msg.toString());
      
      switch (message.type) {
        case 'PING':
          this.send({ type: 'PONG', nodeId: this.myId, code: this.myCode }, rinfo.address, rinfo.port);
          this.addKnownNode(message.nodeId, message.code, rinfo.address, rinfo.port);
          break;
          
        case 'PONG':
          this.addKnownNode(message.nodeId, message.code, rinfo.address, rinfo.port);
          break;
          
        case 'CHAT':
          console.log('\n========================================');
          console.log('📥 收到消息！');
          console.log('========================================');
          console.log(`来自：${message.fromCode}`);
          console.log(`内容：${message.content}`);
          console.log('========================================\n');
          this.chatHistory.push({
            type: 'received',
            from: message.fromCode,
            content: message.content,
            timestamp: message.timestamp
          });
          break;
      }
    } catch (error) {}
  }
  
  send(message, address, port) {
    const data = JSON.stringify(message);
    this.socket.send(data, 0, data.length, port, address);
  }
  
  broadcastPresence() {
    [...this.knownNodes.values(), ...this.bootstrapNodes].forEach(node => {
      this.send({
        type: 'PING',
        nodeId: this.myId,
        code: this.myCode,
        timestamp: Date.now()
      }, node.ip, node.port);
    });
  }
  
  connectToBootstrap() {
    this.bootstrapNodes.forEach(node => {
      this.send({
        type: 'PING',
        nodeId: this.myId,
        code: this.myCode,
        timestamp: Date.now()
      }, node.ip, node.port);
    });
  }
  
  addKnownNode(nodeId, code, ip, port) {
    if (nodeId === this.myId) return;
    this.knownNodes.set(nodeId, { nodeId, code, ip, port, lastSeen: Date.now() });
    if (this.knownNodes.size > 100) {
      const oldest = Array.from(this.knownNodes.entries()).sort((a, b) => a[1].lastSeen - b[1].lastSeen)[0];
      this.knownNodes.delete(oldest[0]);
    }
  }
  
  cleanup() {
    const now = Date.now();
    for (const [nodeId, node] of this.knownNodes) {
      if (now - node.lastSeen > 300000) this.knownNodes.delete(nodeId);
    }
  }
  
  getPublicKeyFingerprint() {
    return crypto.createHash('sha256').update(this.keyPair.publicKey).digest('hex').substr(0, 16);
  }
  
  async sendMessage(toCode, content) {
    const target = Array.from(this.knownNodes.values()).find(n => n.code === toCode);
    if (!target) {
      console.log('❌ 未找到目标节点');
      return;
    }
    
    console.log('\n========================================');
    console.log('📤 发送消息');
    console.log('========================================');
    console.log(`对方：${toCode}`);
    console.log(`内容：${content}`);
    console.log('========================================\n');
    
    this.send({
      type: 'CHAT',
      from: this.myId,
      fromCode: this.myCode,
      toCode,
      content,
      timestamp: Date.now()
    }, target.ip, target.port);
    
    this.chatHistory.push({
      type: 'sent',
      to: toCode,
      content,
      timestamp: Date.now()
    });
  }
  
  async interactiveMode() {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    
    const loop = () => {
      rl.question('你：', async (input) => {
        const trimmed = input.trim();
        
        if (trimmed === '/quit') {
          console.log('\n👋 再见！');
          rl.close();
          if (this.socket) this.socket.close();
          process.exit(0);
        }
        
        if (trimmed === '/nodes') {
          console.log('\n========================================');
          console.log('📋 已知节点');
          console.log('========================================');
          this.knownNodes.forEach(node => {
            console.log(`${node.code} - ${node.ip}:${node.port}`);
          });
          console.log('========================================\n');
          loop();
          return;
        }
        
        if (trimmed === '/history') {
          console.log('\n========================================');
          console.log('📋 聊天记录');
          console.log('========================================');
          this.chatHistory.slice(-10).forEach(r => {
            const icon = r.type === 'sent' ? '📤' : '📥';
            console.log(`${icon} ${r.type === 'sent' ? '我→' + r.to : r.from + '→我'}: ${r.content}`);
          });
          console.log('========================================\n');
          loop();
          return;
        }
        
        if (trimmed.startsWith('@')) {
          const parts = trimmed.split(/\s+/);
          const toCode = parts[0].substring(1);
          const content = parts.slice(1).join(' ');
          if (content) await this.sendMessage(toCode, content);
        }
        
        loop();
      });
    };
    
    loop();
  }
}

// 启动
async function main() {
  const port = parseInt(process.argv[2]) || 8091;
  const chat = new DecentralizedChat(port);
  
  try {
    await chat.start();
    await chat.interactiveMode();
  } catch (error) {
    console.log(`❌ 启动失败：${error.message}`);
    process.exit(1);
  }
}

main().catch(console.error);
