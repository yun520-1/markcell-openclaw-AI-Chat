#!/usr/bin/env node
/**
 * 去中心化聊天系统
 * 
 * 只需要知道对方 IP 和编码就能通信
 * 支持：
 * 1. 一方有公网 IP（推荐）
 * 2. 双方都有公网 IP
 * 3. 内网 + 端口转发
 * 
 * 用法：
 * 1. 启动服务：node decentralized-chat.js server [端口]
 * 2. 发送消息：node decentralized-chat.js send [IP] [端口] [编码] [消息]
 * 3. 交互模式：node decentralized-chat.js interactive [对方 IP] [对方端口] [对方编码]
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

class DecentralizedChat {
  constructor() {
    this.myCode = this.generateCode();
    this.myPort = null;
    this.server = null;
    this.chatHistory = [];
    this.chatLogFile = './chat-history.json';
    this.loadChatHistory();
  }
  
  // 生成编码
  generateCode() {
    const prefix = 'OCLAW';
    const segments = [];
    for (let i = 0; i < 3; i++) {
      const segment = Math.random().toString(16).substr(2, 4).toUpperCase();
      segments.push(segment);
    }
    return `${prefix}-${segments.join('-')}`;
  }
  
  // 加载聊天记录
  loadChatHistory() {
    try {
      if (fs.existsSync(this.chatLogFile)) {
        const data = fs.readFileSync(this.chatLogFile, 'utf8');
        this.chatHistory = JSON.parse(data);
        console.log(`📖 已加载 ${this.chatHistory.length} 条聊天记录`);
      }
    } catch (error) {
      console.log('⚠️  聊天记录加载失败，将创建新记录');
      this.chatHistory = [];
    }
  }
  
  // 保存聊天记录
  saveChatHistory() {
    try {
      fs.writeFileSync(this.chatLogFile, JSON.stringify(this.chatHistory, null, 2));
      console.log('💾 聊天记录已保存');
    } catch (error) {
      console.log('❌ 聊天记录保存失败:', error.message);
    }
  }
  
  // 添加聊天记录
  addChatRecord(message, type = 'sent') {
    const record = {
      id: this.chatHistory.length + 1,
      type: type, // 'sent' or 'received'
      from: message.from || 'me',
      fromCode: message.fromCode || this.myCode,
      to: message.to || 'partner',
      toCode: message.toCode || 'partner',
      content: message.content,
      timestamp: message.timestamp || Date.now(),
      status: message.status || 'sent'
    };
    
    this.chatHistory.push(record);
    this.saveChatHistory();
    return record;
  }
  
  // 启动服务器（接收消息）
  async startServer(port = 8091) {
    return new Promise((resolve, reject) => {
      this.myPort = port;
      
      this.server = http.createServer(async (req, res) => {
        if (req.url === '/message' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', () => {
            try {
              const message = JSON.parse(body);
              
              console.log('\n========================================');
              console.log('📥 收到消息！');
              console.log('========================================');
              console.log(`来自：${message.from || message.fromCode || 'Unknown'}`);
              console.log(`编码：${message.fromCode || 'Unknown'}`);
              console.log(`内容：${message.content}`);
              console.log(`时间：${new Date(message.timestamp).toLocaleString('zh-CN')}`);
              console.log('========================================\n');
              
              // 保存聊天记录
              this.addChatRecord({
                from: message.from || message.fromCode,
                fromCode: message.fromCode,
                toCode: message.toCode,
                content: message.content,
                timestamp: message.timestamp,
                status: 'received'
              }, 'received');
              
              // 自动回复（如果有 fromAddress）
              if (message.fromAddress) {
                console.log('📤 发送自动回复...\n');
                const reply = {
                  from: 'decentralized-chat',
                  fromCode: this.myCode,
                  toCode: message.fromCode,
                  content: `收到你的消息了！"${message.content}" - 来自 ${this.myCode}`,
                  type: 'reply',
                  timestamp: Date.now()
                };
                
                this.sendRaw(message.fromAddress, reply).then(() => {
                  console.log('✅ 自动回复已发送\n');
                }).catch(e => {
                  console.log('⚠️  自动回复发送失败\n');
                });
              }
              
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                status: 'received',
                messageId: `msg_${Date.now().toString(36)}`,
                timestamp: Date.now(),
                myCode: this.myCode,
                myAddress: `http://<你的 IP>:${this.myPort}`
              }));
            } catch (error) {
              res.writeHead(400);
              res.end(JSON.stringify({ error: error.message }));
            }
          });
        } else if (req.url === '/status' && req.method === 'GET') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            status: 'ok',
            myCode: this.myCode,
            port: this.myPort,
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
      
      this.server.listen(port, '0.0.0.0', () => {
        console.log('========================================');
        console.log('✅ 去中心化聊天服务已启动');
        console.log('========================================');
        console.log(`📍 我的编码：${this.myCode}`);
        console.log(`📍 监听端口：${port}`);
        console.log(`📍 本地地址：http://localhost:${port}`);
        console.log(`📍 聊天记录：${this.chatHistory.length} 条`);
        console.log('========================================');
        console.log('💡 使用说明:');
        console.log('========================================');
        console.log('1. 告诉对方你的信息:');
        console.log(`   编码：${this.myCode}`);
        console.log(`   地址：http://<你的公网 IP>:${port}`);
        console.log('');
        console.log('2. 对方发送消息给你:');
        console.log(`   node decentralized-chat.js send <你的 IP> ${port} ${this.myCode} "消息内容"`);
        console.log('');
        console.log('3. 你发送消息给对方:');
        console.log(`   node decentralized-chat.js send <对方 IP> <对方端口> <对方编码> "消息内容"`);
        console.log('');
        console.log('4. 查看聊天记录:');
        console.log(`   cat ${this.chatLogFile}`);
        console.log('========================================\n');
        resolve();
      });
      
      this.server.on('error', reject);
    });
  }
  
  // 发送消息（原始方法）
  async sendRaw(url, message) {
    return new Promise((resolve, reject) => {
      const parsed = new URL(url);
      const data = JSON.stringify(message);
      
      const req = http.request({
        hostname: parsed.hostname,
        port: parsed.port || 80,
        path: '/message',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        },
        timeout: 10000
      }, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(responseData));
          } catch (e) {
            resolve({ status: 'sent' });
          }
        });
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('请求超时'));
      });
      
      req.write(data);
      req.end();
    });
  }
  
  // 发送消息
  async sendMessage(targetIP, targetPort, targetCode, content) {
    const message = {
      from: 'decentralized-user',
      fromCode: this.myCode,
      toCode: targetCode,
      content: content,
      type: 'chat',
      timestamp: Date.now(),
      fromAddress: `http://<你的 IP>:${this.myPort || 'PORT'}`
    };
    
    console.log('\n========================================');
    console.log('📤 发送消息');
    console.log('========================================');
    console.log(`目标：http://${targetIP}:${targetPort}`);
    console.log(`目标编码：${targetCode}`);
    console.log(`内容：${content}`);
    console.log(`我的编码：${this.myCode}`);
    console.log('========================================\n');
    
    try {
      const result = await this.sendRaw(`http://${targetIP}:${targetPort}/message`, message);
      
      console.log('✅ 发送成功！');
      console.log(`消息 ID: ${result.messageId || 'N/A'}`);
      console.log(`状态：${result.status || 'N/A'}`);
      if (result.myCode) {
        console.log(`对方编码：${result.myCode}`);
      }
      console.log('');
      
      // 保存聊天记录
      this.addChatRecord({
        to: targetCode,
        toCode: targetCode,
        content: content,
        status: 'sent'
      }, 'sent');
      
      return result;
    } catch (error) {
      console.log('❌ 发送失败！');
      console.log(`错误：${error.message}`);
      console.log('');
      console.log('可能原因:');
      console.log('1. 对方服务未启动');
      console.log('2. IP 地址或端口错误');
      console.log('3. 防火墙阻止连接');
      console.log('4. 网络不可达');
      console.log('');
      throw error;
    }
  }
  
  // 交互模式
  async interactiveMode(partnerIP, partnerPort, partnerCode) {
    console.log('\n========================================');
    console.log('💬 交互式聊天模式');
    console.log('========================================');
    console.log(`对方：${partnerCode}`);
    console.log(`地址：http://${partnerIP}:${partnerPort}`);
    console.log(`我的编码：${this.myCode}`);
    console.log('========================================');
    console.log('输入消息后按 Enter 发送');
    console.log('输入 /quit 退出');
    console.log('输入 /history 查看聊天记录');
    console.log('========================================\n');
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const chatLoop = () => {
      rl.question('你：', async (input) => {
        const trimmed = input.trim();
        
        if (trimmed === '/quit' || trimmed === '/exit') {
          console.log('\n👋 再见！');
          this.saveChatHistory();
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
            console.log(`${icon} [${time}] ${record.fromCode || '我'}: ${record.content}`);
          });
          console.log('========================================\n');
          chatLoop();
          return;
        }
        
        if (trimmed) {
          try {
            await this.sendMessage(partnerIP, partnerPort, partnerCode, trimmed);
          } catch (error) {
            // 已显示错误
          }
        }
        
        chatLoop();
      });
    };
    
    chatLoop();
  }
  
  // 停止服务
  async stop() {
    if (this.server) {
      this.server.close();
      console.log('\n🛑 服务已停止\n');
    }
    this.saveChatHistory();
  }
}

// 命令行处理
async function main() {
  const args = process.argv.slice(2);
  const chat = new DecentralizedChat();
  
  if (args[0] === 'server') {
    // 服务器模式
    const port = parseInt(args[1]) || 8091;
    await chat.startServer(port);
    
    // 保持运行
    process.on('SIGINT', async () => {
      await chat.stop();
      process.exit(0);
    });
    
  } else if (args[0] === 'send' && args.length >= 5) {
    // 发送模式
    const [_, targetIP, targetPort, targetCode, ...messageParts] = args;
    const message = messageParts.join(' ');
    
    try {
      await chat.sendMessage(targetIP, parseInt(targetPort), targetCode, message);
    } catch (error) {
      process.exit(1);
    }
    
  } else if (args[0] === 'interactive' && args.length >= 4) {
    // 交互模式
    const [_, partnerIP, partnerPort, partnerCode] = args;
    
    // 先启动本地服务器（用于接收回复）
    await chat.startServer(8092);
    
    // 进入交互模式
    chat.interactiveMode(partnerIP, parseInt(partnerPort), partnerCode);
    
  } else {
    console.log('========================================');
    console.log('💬 去中心化聊天系统');
    console.log('========================================\n');
    console.log('用法:');
    console.log('');
    console.log('1. 启动服务（接收消息）:');
    console.log('   node decentralized-chat.js server [端口]');
    console.log('');
    console.log('2. 发送消息:');
    console.log('   node decentralized-chat.js send [IP] [端口] [编码] [消息]');
    console.log('');
    console.log('3. 交互模式:');
    console.log('   node decentralized-chat.js interactive [对方 IP] [对方端口] [对方编码]');
    console.log('');
    console.log('4. 查看聊天记录:');
    console.log('   cat chat-history.json');
    console.log('');
    console.log('========================================');
    console.log('💡 使用场景:');
    console.log('========================================');
    console.log('');
    console.log('场景 1: 一方有公网 IP（推荐）');
    console.log('  A 有公网 IP: node decentralized-chat.js server 8091');
    console.log('  B 发送消息：node decentralized-chat.js send A 的 IP 8091 A 的编码 "你好"');
    console.log('');
    console.log('场景 2: 双方都有公网 IP');
    console.log('  A: node decentralized-chat.js server 8091');
    console.log('  B: node decentralized-chat.js server 8092');
    console.log('  然后互相发送消息');
    console.log('');
    console.log('场景 3: 内网 + 端口转发');
    console.log('  在路由器配置端口转发，将公网端口映射到内网 8091');
    console.log('');
    console.log('========================================\n');
  }
}

main().catch(console.error);
