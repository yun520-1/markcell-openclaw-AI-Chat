#!/usr/bin/env node
/**
 * OpenClaw 双向聊天测试
 * 
 * 测试完整的发送 - 接收 - 回复流程
 * 
 * 用法：
 * 1. 启动接收服务：node bidirectional-chat.js receive
 * 2. 启动发送服务：node bidirectional-chat.js send [IP] [编码] [消息]
 */

const http = require('http');
const https = require('https');

class BidirectionalChat {
  constructor() {
    this.myCode = this.generateCode();
    this.receivedMessages = [];
    this.server = null;
    this.port = 8092;
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
  
  // 启动接收服务器
  async startReceiver() {
    return new Promise((resolve, reject) => {
      this.server = http.createServer(async (req, res) => {
        if (req.url === '/message' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            try {
              const message = JSON.parse(body);
              console.log('\n========================================');
              console.log('📥 收到消息！');
              console.log('========================================');
              console.log(`来自：${message.fromCode || message.from || 'Unknown'}`);
              console.log(`内容：${message.content || message.text || '无内容'}`);
              console.log(`时间：${new Date(message.timestamp).toLocaleString('zh-CN')}`);
              console.log('========================================\n');
              
              // 保存消息
              this.receivedMessages.push({
                ...message,
                receivedAt: Date.now()
              });
              
              // 自动回复
              const reply = {
                from: 'bidirectional-chat',
                fromCode: this.myCode,
                toCode: message.fromCode || message.from,
                content: `收到你的消息了："${message.content || message.text}" - 来自 ${this.myCode}`,
                type: 'reply',
                timestamp: Date.now()
              };
              
              console.log('📤 发送自动回复...');
              
              // 如果有 fromAddress，就回复过去
              if (message.fromAddress) {
                try {
                  await this.sendMessageRaw(message.fromAddress, reply);
                  console.log('✅ 回复已发送\n');
                } catch (e) {
                  console.log('⚠️  回复发送失败:', e.message, '\n');
                }
              } else {
                console.log('⚠️  无法回复（没有 fromAddress）\n');
              }
              
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                status: 'received',
                messageId: `msg_${Date.now().toString(36)}`,
                timestamp: Date.now()
              }));
            } catch (error) {
              console.log('❌ 消息处理失败:', error.message, '\n');
              res.writeHead(400);
              res.end(JSON.stringify({ error: error.message }));
            }
          });
        } else if (req.url === '/status' && req.method === 'GET') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            status: 'ok',
            myCode: this.myCode,
            port: this.port,
            receivedCount: this.receivedMessages.length
          }));
        } else {
          res.writeHead(404);
          res.end('Not Found');
        }
      });
      
      this.server.listen(this.port, '0.0.0.0', () => {
        console.log('========================================');
        console.log('✅ 双向聊天服务已启动');
        console.log('========================================');
        console.log(`我的编码：${this.myCode}`);
        console.log(`监听端口：${this.port}`);
        console.log(`本地地址：http://localhost:${this.port}`);
        console.log('========================================');
        console.log('💡 使用说明:');
        console.log('1. 在另一个终端发送消息:');
        console.log(`   node bidirectional-chat.js send localhost ${this.myCode} "你好"`);
        console.log('2. 或使用离线聊天:');
        console.log(`   node offline-chat.js localhost ${this.myCode} "你好"`);
        console.log('========================================\n');
        resolve();
      });
      
      this.server.on('error', (error) => {
        console.log('❌ 服务器错误:', error.message, '\n');
        reject(error);
      });
    });
  }
  
  // 发送消息（原始方法）
  async sendMessageRaw(url, message) {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const data = JSON.stringify(message);
      
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 80,
        path: '/message',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        },
        timeout: 5000
      };
      
      const req = http.request(options, (res) => {
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
      from: 'bidirectional-user',
      fromCode: this.myCode,
      toCode: targetCode,
      content: content,
      type: 'test-message',
      timestamp: Date.now(),
      fromAddress: `http://localhost:${this.port}`  // 关键：提供回复地址
    };
    
    console.log('\n========================================');
    console.log('📤 发送消息');
    console.log('========================================');
    console.log(`目标：http://${targetIP}:${targetPort}`);
    console.log(`目标编码：${targetCode}`);
    console.log(`内容：${content}`);
    console.log(`我的编码：${this.myCode}`);
    console.log(`我的地址：${message.fromAddress}`);
    console.log('========================================\n');
    
    try {
      const result = await this.sendMessageRaw(`http://${targetIP}:${targetPort}/message`, message);
      console.log('✅ 发送成功！');
      console.log(`消息 ID: ${result.messageId || 'N/A'}`);
      console.log(`状态：${result.status || 'N/A'}`);
      console.log('⏳ 等待对方回复... (10 秒)\n');
      
      // 等待回复
      await this.waitForReply(10000);
      
      return result;
    } catch (error) {
      console.log('❌ 发送失败！');
      console.log(`错误：${error.message}\n`);
      throw error;
    }
  }
  
  // 等待回复
  async waitForReply(timeout) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const checkInterval = setInterval(() => {
        const newMessages = this.receivedMessages.filter(m => 
          m.receivedAt >= startTime
        );
        
        if (newMessages.length > 0) {
          clearInterval(checkInterval);
          console.log('\n========================================');
          console.log('📥 收到回复！');
          console.log('========================================');
          console.log(`来自：${newMessages[0].fromCode || newMessages[0].from}`);
          console.log(`内容：${newMessages[0].content || newMessages[0].text}`);
          console.log('========================================\n');
          resolve(newMessages[0]);
        } else if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          console.log('⏰ 等待超时，未收到回复\n');
          resolve(null);
        }
      }, 500);
    });
  }
  
  // 停止服务
  async stop() {
    if (this.server) {
      this.server.close();
      console.log('\n🛑 服务已停止\n');
    }
  }
}

// 命令行处理
async function main() {
  const args = process.argv.slice(2);
  const chat = new BidirectionalChat();
  
  if (args[0] === 'receive') {
    // 接收模式
    await chat.startReceiver();
    
    // 保持运行
    process.on('SIGINT', async () => {
      await chat.stop();
      process.exit(0);
    });
    
  } else if (args[0] === 'send' && args.length >= 4) {
    // 发送模式
    const [_, targetIP, targetCode, ...messageParts] = args;
    const message = messageParts.join(' ');
    
    try {
      await chat.sendMessage(targetIP, 1234, targetCode, message);
    } catch (error) {
      // 已显示错误
    }
    
  } else {
    console.log('========================================');
    console.log('💬 OpenClaw 双向聊天测试');
    console.log('========================================\n');
    console.log('用法:');
    console.log('1. 启动接收服务:');
    console.log('   node bidirectional-chat.js receive\n');
    console.log('2. 发送消息 (另一个终端):');
    console.log('   node bidirectional-chat.js send [IP] [编码] [消息]\n');
    console.log('示例:');
    console.log('   node bidirectional-chat.js send localhost OCLAW-XXX "你好"\n');
  }
}

main().catch(console.error);
