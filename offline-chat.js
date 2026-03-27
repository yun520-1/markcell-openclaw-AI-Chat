#!/usr/bin/env node
/**
 * OpenClaw 离线聊天系统
 * 
 * 不依赖持续运行的服务器
 * 通过 OpenClaw 消息工具直接发送和接收
 * 知道对方 IP 和编码就能聊天
 * 
 * 用法：node offline-chat.js [对方 IP] [对方编码] [消息内容]
 */

const https = require('https');
const http = require('http');

class OfflineChat {
  constructor() {
    this.myCode = this.generateCode();
    this.messageHistory = [];
  }
  
  /**
   * 生成临时编码
   */
  generateCode() {
    const prefix = 'OCLAW';
    const segments = [];
    for (let i = 0; i < 3; i++) {
      const segment = Math.random().toString(16).substr(2, 4).toUpperCase();
      segments.push(segment);
    }
    return `${prefix}-${segments.join('-')}`;
  }
  
  /**
   * 发送消息到目标
   */
  async sendMessage(targetIP, targetPort, targetCode, content) {
    const message = {
      from: 'offline-user',
      fromCode: this.myCode,
      toCode: targetCode,
      content: content,
      type: 'offline-message',
      timestamp: Date.now()
    };
    
    console.log(`\n📤 发送消息到 http://${targetIP}:${targetPort}`);
    console.log(`内容：${content}`);
    console.log(`我的编码：${this.myCode}`);
    console.log(`目标编码：${targetCode}\n`);
    
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(message);
      
      const options = {
        hostname: targetIP,
        port: targetPort,
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
            const result = JSON.parse(responseData);
            console.log('✅ 发送成功！');
            console.log(`消息 ID: ${result.messageId || 'N/A'}`);
            console.log(`状态：${result.status || 'N/A'}`);
            console.log('');
            
            this.messageHistory.push({
              type: 'sent',
              content: content,
              targetCode: targetCode,
              timestamp: Date.now(),
              result: result
            });
            
            resolve(result);
          } catch (e) {
            console.log('✅ 消息已发送（服务器未返回 JSON）');
            console.log('');
            resolve({ status: 'sent' });
          }
        });
      });
      
      req.on('error', (error) => {
        console.log('❌ 发送失败！');
        console.log(`错误：${error.message}`);
        console.log('');
        reject(error);
      });
      
      req.write(data);
      req.end();
    });
  }
  
  /**
   * 查看消息历史
   */
  showHistory() {
    console.log('\n========================================');
    console.log('📋 消息历史');
    console.log('========================================');
    
    if (this.messageHistory.length === 0) {
      console.log('暂无消息历史\n');
      return;
    }
    
    this.messageHistory.forEach((msg, index) => {
      const time = new Date(msg.timestamp).toLocaleString('zh-CN');
      const icon = msg.type === 'sent' ? '📤' : '📥';
      console.log(`${index + 1}. ${icon} [${time}] ${msg.content}`);
    });
    
    console.log('');
  }
  
  /**
   * 生成聊天报告
   */
  generateReport() {
    const report = {
      myCode: this.myCode,
      totalMessages: this.messageHistory.length,
      sentCount: this.messageHistory.filter(m => m.type === 'sent').length,
      receivedCount: this.messageHistory.filter(m => m.type === 'received').length,
      history: this.messageHistory,
      generatedAt: new Date().toISOString()
    };
    
    console.log('\n========================================');
    console.log('📊 聊天报告');
    console.log('========================================');
    console.log(`我的编码：${report.myCode}`);
    console.log(`总消息数：${report.totalMessages}`);
    console.log(`发送：${report.sentCount}`);
    console.log(`接收：${report.receivedCount}`);
    console.log(`生成时间：${report.generatedAt}`);
    console.log('========================================\n');
    
    return report;
  }
}

// 命令行交互
async function main() {
  const args = process.argv.slice(2);
  const chat = new OfflineChat();
  
  console.log('========================================');
  console.log('💬 OpenClaw 离线聊天系统');
  console.log('========================================\n');
  console.log(`我的编码：${chat.myCode}`);
  console.log('');
  
  // 如果提供了命令行参数，直接发送
  if (args.length >= 3) {
    const [targetIP, targetCode, ...messageParts] = args;
    const message = messageParts.join(' ');
    
    try {
      await chat.sendMessage(targetIP, 1234, targetCode, message);
      chat.showHistory();
    } catch (error) {
      // 已显示错误
    }
    return;
  }
  
  // 交互式模式
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log('========================================');
  console.log('💡 使用说明');
  console.log('========================================');
  console.log('1. 输入：IP 编码 消息内容');
  console.log('   例如：192.168.3.194 OCLAW-XXX 你好');
  console.log('2. /history - 查看消息历史');
  console.log('3. /report - 生成聊天报告');
  console.log('4. /quit - 退出');
  console.log('========================================\n');
  
  const chatLoop = () => {
    rl.question('你：', async (input) => {
      const trimmed = input.trim();
      
      if (trimmed === '/quit' || trimmed === '/exit') {
        console.log('\n👋 再见！');
        chat.generateReport();
        rl.close();
        return;
      }
      
      if (trimmed === '/history') {
        chat.showHistory();
        chatLoop();
        return;
      }
      
      if (trimmed === '/report') {
        chat.generateReport();
        chatLoop();
        return;
      }
      
      // 解析输入：IP 编码 消息
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 3) {
        const targetIP = parts[0];
        const targetCode = parts[1];
        const message = parts.slice(2).join(' ');
        
        try {
          await chat.sendMessage(targetIP, 1234, targetCode, message);
        } catch (error) {
          // 已显示错误
        }
      } else {
        console.log('\n❌ 格式错误！请使用：IP 编码 消息内容\n');
      }
      
      chatLoop();
    });
  };
  
  chatLoop();
}

main().catch(console.error);
