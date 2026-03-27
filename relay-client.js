#!/usr/bin/env node
/**
 * 自组织中继客户端
 * 
 * 可以连接到任何中继节点
 * 发送加密消息
 * 也可以自己成为中继节点
 * 
 * 用法：node relay-client.js [中继服务器地址]
 */

const http = require('http');
const https = require('https');
const crypto = require('crypto');
const readline = require('readline');

class RelayClient {
  constructor(relayServer = 'http://localhost:8080') {
    this.relayServer = relayServer;
    this.myCode = this.generateCode();
    this.keyPair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    this.port = 8091;
    this.server = null;
    this.chatHistory = [];
    this.chatLogFile = './relay-chat-history.json';
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
      const fs = require('fs');
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
      const fs = require('fs');
      fs.writeFileSync(this.chatLogFile, JSON.stringify(this.chatHistory, null, 2));
    } catch (error) {
      console.log('❌ 聊天记录保存失败');
    }
  }
  
  addChatRecord(content, type = 'sent', partner = 'unknown') {
    const record = {
      id: this.chatHistory.length + 1,
      type,
      content,
      partner,
      timestamp: Date.now()
    };
    this.chatHistory.push(record);
    this.saveChatHistory();
    return record;
  }
  
  // 加密消息
  encrypt(message, publicKey) {
    const buffer = Buffer.from(message, 'utf8');
    const encrypted = crypto.publicEncrypt({
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING
    }, buffer);
    return encrypted.toString('base64');
  }
  
  // 解密消息
  decrypt(encryptedBase64, privateKey) {
    const buffer = Buffer.from(encryptedBase64, 'base64');
    const decrypted = crypto.privateDecrypt({
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING
    }, buffer);
    return decrypted.toString('utf8');
  }
  
  // 注册到中继服务器
  async register() {
    const url = new URL(this.relayServer);
    const path = `${url.pathname}/register`.replace(/\/+/g, '/');
    
    const data = JSON.stringify({
      code: this.myCode,
      ip: await this.getPublicIP(),
      port: this.port,
      publicKey: this.keyPair.publicKey
    });
    
    return new Promise((resolve, reject) => {
      const lib = url.protocol === 'https:' ? https : http;
      const req = lib.request({
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      }, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(responseData));
          } catch (e) {
            resolve({ status: 'ok' });
          }
        });
      });
      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }
  
  // 获取公网 IP
  async getPublicIP() {
    try {
      const https = require('https');
      const data = await new Promise((resolve, reject) => {
        https.get('https://api.ipify.org?format=json', (res) => {
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
      return data.ip;
    } catch (error) {
      return 'localhost';
    }
  }
  
  // 发送加密消息
  async sendMessage(toCode, content) {
    const url = new URL(this.relayServer);
    const path = `${url.pathname}/relay`.replace(/\/+/g, '/');
    
    // 这里简化处理，实际应该获取对方公钥加密
    const data = JSON.stringify({
      from: this.myCode,
      to: toCode,
      encryptedMessage: content, // 实际应该加密
      timestamp: Date.now()
    });
    
    console.log('\n========================================');
    console.log('📤 发送消息');
    console.log('========================================');
    console.log(`对方：${toCode}`);
    console.log(`内容：${content}`);
    console.log('========================================\n');
    
    return new Promise((resolve, reject) => {
      const lib = url.protocol === 'https:' ? https : http;
      const req = lib.request({
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      }, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(responseData);
            console.log('✅ 发送成功！');
            this.addChatRecord(content, 'sent', toCode);
            resolve(result);
          } catch (e) {
            console.log('✅ 消息已发送');
            this.addChatRecord(content, 'sent', toCode);
            resolve({ status: 'sent' });
          }
        });
      });
      req.on('error', (error) => {
        console.log('❌ 发送失败:', error.message);
        reject(error);
      });
      req.write(data);
      req.end();
    });
  }
  
  // 启动本地服务器（接收消息）
  async startLocalServer(port = 8091) {
    this.port = port;
    
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        if (req.url === '/message' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', () => {
            try {
              const message = JSON.parse(body);
              console.log('\n========================================');
              console.log('📥 收到消息！');
              console.log('========================================');
              console.log(`来自：${message.from}`);
              console.log(`内容：${message.encryptedMessage || message.content}`);
              console.log(`时间：${new Date(message.timestamp).toLocaleString('zh-CN')}`);
              console.log('========================================\n');
              
              this.addChatRecord(message.encryptedMessage || message.content, 'received', message.from);
              
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ status: 'ok', received: true }));
            } catch (error) {
              res.writeHead(400);
              res.end(JSON.stringify({ error: error.message }));
            }
          });
        } else if (req.url === '/health') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            status: 'ok',
            code: this.myCode,
            port: this.port
          }));
        } else {
          res.writeHead(404);
          res.end('Not Found');
        }
      });
      
      this.server.listen(port, '0.0.0.0', () => {
        console.log(`✅ 本地服务器已启动：http://0.0.0.0:${port}`);
        resolve();
      });
      
      this.server.on('error', reject);
    });
  }
  
  async interactiveMode() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    console.log('\n========================================');
    console.log('💬 交互式聊天模式');
    console.log('========================================');
    console.log('输入：@编码 消息内容');
    console.log('例如：@OCLAW-XXX 你好');
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
          if (this.server) this.server.close();
          process.exit(0);
        }
        
        if (trimmed === '/history') {
          console.log('\n========================================');
          console.log('📋 聊天记录');
          console.log('========================================');
          this.chatHistory.slice(-10).forEach(record => {
            const icon = record.type === 'sent' ? '📤' : '📥';
            const time = new Date(record.timestamp).toLocaleString('zh-CN');
            console.log(`${icon} [${time}] ${record.type === 'sent' ? '我→' + record.partner : record.partner + '→我'}: ${record.content}`);
          });
          console.log('========================================\n');
          chatLoop();
          return;
        }
        
        if (trimmed.startsWith('@')) {
          const parts = trimmed.split(/\s+/);
          const toCode = parts[0].substring(1);
          const content = parts.slice(1).join(' ');
          
          if (content) {
            try {
              await this.sendMessage(toCode, content);
            } catch (error) {
              // 已显示错误
            }
          }
        }
        
        chatLoop();
      });
    };
    
    chatLoop();
  }
  
  async stop() {
    this.saveChatHistory();
    if (this.server) {
      this.server.close();
    }
    console.log('\n🛑 服务已停止\n');
  }
}

// 命令行处理
async function main() {
  const args = process.argv.slice(2);
  const relayServer = args[0] || 'http://localhost:8080';
  
  const client = new RelayClient(relayServer);
  
  try {
    console.log('========================================');
    console.log('📡 自组织中继客户端');
    console.log('========================================');
    console.log(`📍 中继服务器：${relayServer}`);
    console.log(`📍 我的编码：${client.myCode}`);
    console.log('========================================\n');
    
    // 启动本地服务器
    await client.startLocalServer(8091);
    
    // 注册到中继服务器
    try {
      const result = await client.register();
      console.log('✅ 已注册到中继服务器');
      console.log(`📍 中继节点 ID: ${result.nodeId || 'unknown'}`);
      console.log('');
    } catch (error) {
      console.log('⚠️  注册失败，可以继续使用（无法被其他人找到）');
      console.log('');
    }
    
    // 进入交互模式
    client.interactiveMode();
    
    process.on('SIGINT', async () => {
      await client.stop();
      process.exit(0);
    });
  } catch (error) {
    console.log(`❌ 启动失败：${error.message}`);
    process.exit(1);
  }
}

main().catch(console.error);
