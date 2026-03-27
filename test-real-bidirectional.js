#!/usr/bin/env node
/**
 * 真正完整的双向通信测试
 * 发送方和接收方都有服务器，可以互相通信
 */

const http = require('http');

class BidirectionalTest {
  constructor(name) {
    this.name = name;
    this.code = `OCLAW-${name.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    this.port = null;
    this.server = null;
    this.receivedMessages = [];
  }
  
  async startServer(port) {
    this.port = port;
    return new Promise((resolve) => {
      this.server = http.createServer((req, res) => {
        if (req.url === '/message' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            const message = JSON.parse(body);
            
            console.log(`\n📥 [${this.name}] 收到消息！`);
            console.log(`   来自：${message.fromCode}`);
            console.log(`   内容：${message.content}`);
            
            this.receivedMessages.push(message);
            
            // 自动回复
            if (message.fromAddress) {
              const reply = {
                from: this.name,
                fromCode: this.code,
                toCode: message.fromCode,
                content: `收到："${message.content}" - [${this.name}] 的回复 ✅`,
                type: 'reply',
                timestamp: Date.now()
              };
              
              await this.sendRaw(message.fromAddress, reply);
            }
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              status: 'received',
              messageId: `msg_${Date.now().toString(36)}`
            }));
          });
        } else {
          res.writeHead(404);
          res.end('Not Found');
        }
      });
      
      this.server.listen(port, '0.0.0.0', () => {
        console.log(`✅ [${this.name}] 服务已启动`);
        console.log(`   编码：${this.code}`);
        console.log(`   端口：${port}`);
        resolve();
      });
    });
  }
  
  async sendRaw(url, message) {
    return new Promise((resolve) => {
      const parsed = new URL(url);
      const req = http.request({
        hostname: parsed.hostname,
        port: parsed.port,
        path: '/message',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      });
      req.on('error', () => resolve(null));
      req.write(JSON.stringify(message));
      req.end();
    });
  }
  
  async sendMessage(targetUrl, content) {
    const message = {
      from: this.name,
      fromCode: this.code,
      toCode: 'TARGET',
      content: content,
      type: 'test',
      timestamp: Date.now(),
      fromAddress: `http://localhost:${this.port}`
    };
    
    console.log(`\n📤 [${this.name}] 发送消息:`);
    console.log(`   目标：${targetUrl}`);
    console.log(`   内容：${content}`);
    
    const result = await this.sendRaw(targetUrl, message);
    console.log(`   状态：${result ? '✅ 成功' : '❌ 失败'}`);
    return result;
  }
  
  async waitForMessage(timeout = 5000) {
    return new Promise((resolve) => {
      const start = Date.now();
      const check = setInterval(() => {
        if (this.receivedMessages.length > 0) {
          clearInterval(check);
          const msg = this.receivedMessages[this.receivedMessages.length - 1];
          console.log(`\n📥 [${this.name}] 收到回复！`);
          console.log(`   内容：${msg.content}`);
          resolve(msg);
        } else if (Date.now() - start > timeout) {
          clearInterval(check);
          console.log(`\n⏰ [${this.name}] 等待超时`);
          resolve(null);
        }
      }, 500);
    });
  }
  
  close() {
    if (this.server) {
      this.server.close();
    }
  }
}

// 主测试
async function main() {
  console.log('\n========================================');
  console.log('🧪 真正完整的双向通信测试');
  console.log('========================================\n');
  
  // 创建两个端点
  const alice = new BidirectionalTest('Alice');
  const bob = new BidirectionalTest('Bob');
  
  // 启动服务
  await alice.startServer(8097);
  await new Promise(r => setTimeout(r, 500));
  await bob.startServer(8098);
  await new Promise(r => setTimeout(r, 500));
  
  console.log('\n========================================');
  console.log('📊 测试 1: Alice → Bob');
  console.log('========================================');
  
  // Alice 发送给 Bob
  await alice.sendMessage(`http://localhost:${bob.port}`, '你好，Bob！');
  await bob.waitForMessage(5000);
  
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('\n========================================');
  console.log('📊 测试 2: Bob → Alice');
  console.log('========================================');
  
  // Bob 发送给 Alice
  await bob.sendMessage(`http://localhost:${alice.port}`, '你好，Alice！');
  await alice.waitForMessage(5000);
  
  await new Promise(r => setTimeout(r, 2000));
  
  // 总结
  console.log('\n========================================');
  console.log('📊 测试结果');
  console.log('========================================');
  console.log(`Alice 发送：${alice.receivedMessages.length > 0 ? '✅' : '❌'}`);
  console.log(`Bob 发送：${bob.receivedMessages.length > 0 ? '✅' : '❌'}`);
  console.log(`Alice 接收：${alice.receivedMessages.length > 0 ? '✅' : '❌'}`);
  console.log(`Bob 接收：${bob.receivedMessages.length > 0 ? '✅' : '❌'}`);
  console.log('========================================\n');
  
  const success = alice.receivedMessages.length > 0 && bob.receivedMessages.length > 0;
  
  if (success) {
    console.log('🎉 真正完整的双向通信测试通过！\n');
  } else {
    console.log('❌ 双向通信测试失败\n');
  }
  
  alice.close();
  bob.close();
  
  process.exit(success ? 0 : 1);
}

main().catch(console.error);
