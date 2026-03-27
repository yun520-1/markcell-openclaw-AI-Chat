#!/usr/bin/env node
/**
 * 完整双向通信测试
 * 验证：发送 → 接收 → 回复 → 收到回复
 */

const http = require('http');

let myCode = '';
let receivedMessage = null;
let sentReply = false;

// 启动接收服务器
async function startReceiver() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      if (req.url === '/message' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          const message = JSON.parse(body);
          
          console.log('\n========================================');
          console.log('📥 接收方：收到消息！');
          console.log('========================================');
          console.log(`来自：${message.fromCode}`);
          console.log(`内容：${message.content}`);
          console.log(`时间：${new Date(message.timestamp).toLocaleString('zh-CN')}`);
          console.log('========================================\n');
          
          receivedMessage = message;
          
          // 自动回复
          const reply = {
            from: 'receiver',
            fromCode: myCode,
            toCode: message.fromCode,
            content: `我收到你的消息了："${message.content}" - 这是自动回复 ✅`,
            type: 'reply',
            timestamp: Date.now()
          };
          
          console.log('📤 接收方：发送回复...\n');
          
          if (message.fromAddress) {
            http.request(message.fromAddress, (res) => {
              let data = '';
              res.on('data', chunk => data += chunk);
              res.on('end', () => {
                console.log('✅ 接收方：回复已发送\n');
                sentReply = true;
              });
            }).on('error', e => {
              console.log('⚠️  接收方：回复发送失败\n');
            }).write(JSON.stringify(reply));
          }
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            status: 'received',
            messageId: `msg_${Date.now().toString(36)}`
          }));
        });
      } else if (req.url === '/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'ok',
          myCode: myCode,
          received: receivedMessage !== null
        }));
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });
    
    server.listen(8095, '0.0.0.0', () => {
      myCode = 'OCLAW-RECEIVER-TEST';
      console.log('========================================');
      console.log('✅ 接收方服务已启动');
      console.log('========================================');
      console.log(`编码：${myCode}`);
      console.log(`端口：8095`);
      console.log('========================================\n');
      resolve(server);
    });
  });
}

// 发送消息
async function sendMessage() {
  return new Promise((resolve, reject) => {
    const senderCode = 'OCLAW-SENDER-TEST';
    const message = {
      from: 'sender',
      fromCode: senderCode,
      toCode: myCode,
      content: '你好，这是完整双向通信测试！🎉',
      type: 'test',
      timestamp: Date.now(),
      fromAddress: 'http://localhost:8096'
    };
    
    console.log('========================================');
    console.log('📤 发送方：准备发送消息');
    console.log('========================================');
    console.log(`目标：${myCode}`);
    console.log(`内容：${message.content}`);
    console.log('========================================\n');
    
    const req = http.request({
      hostname: 'localhost',
      port: 8095,
      path: '/message',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('✅ 发送方：消息已送达');
        console.log(`回复：${data}\n`);
        resolve(JSON.parse(data));
      });
    });
    
    req.on('error', reject);
    req.write(JSON.stringify(message));
    req.end();
  });
}

// 主流程
async function main() {
  console.log('\n========================================');
  console.log('🧪 完整双向通信测试');
  console.log('========================================\n');
  
  // 1. 启动接收方
  const receiver = await startReceiver();
  await new Promise(r => setTimeout(r, 2000));
  
  // 2. 发送消息
  await sendMessage();
  await new Promise(r => setTimeout(r, 2000));
  
  // 3. 验证结果
  console.log('========================================');
  console.log('📊 测试结果');
  console.log('========================================');
  console.log(`发送消息：${receivedMessage ? '✅ 成功' : '❌ 失败'}`);
  console.log(`接收消息：${receivedMessage ? '✅ 成功' : '❌ 失败'}`);
  console.log(`自动回复：${sentReply ? '✅ 成功' : '❌ 失败'}`);
  console.log('========================================\n');
  
  if (receivedMessage && sentReply) {
    console.log('🎉 完整双向通信测试通过！\n');
  } else {
    console.log('❌ 双向通信测试失败\n');
  }
  
  receiver.close();
  process.exit(receivedMessage && sentReply ? 0 : 1);
}

main().catch(console.error);
