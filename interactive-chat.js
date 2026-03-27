#!/usr/bin/env node
/**
 * OpenClaw 交互式对话客户端
 * 
 * 实现两个人工之间的实时对话
 * 支持本地和外网通信
 * 
 * 用法：node interactive-chat.js [targetAddress] [targetCode]
 */

const { NetworkServer } = require('./modules/a2a/network_server');
const { ConnectionCodeSystem } = require('./modules/a2a/connection_code');
const readline = require('readline');

class InteractiveChat {
  constructor() {
    this.server = null;
    this.codeSystem = null;
    this.targetAddress = null;
    this.targetCode = null;
    this.myCode = null;
    this.rl = null;
    this.isTyping = false;
  }
  
  /**
   * 启动交互式对话
   */
  async start(targetAddress, targetCode) {
    console.log('========================================');
    console.log('💬 OpenClaw 交互式对话客户端');
    console.log('========================================\n');
    
    this.targetAddress = targetAddress || 'http://localhost:1234';
    this.targetCode = targetCode || 'UNKNOWN';
    
    // 创建连接编码系统
    this.codeSystem = new ConnectionCodeSystem();
    this.myCode = this.codeSystem.getMyCode();
    
    console.log(`📍 我的连接编码：${this.myCode}`);
    console.log(`📍 目标地址：${this.targetAddress}`);
    console.log(`📍 目标编码：${this.targetCode}`);
    console.log('');
    
    // 创建网络服务器
    this.server = new NetworkServer({
      port: 8091,
      host: '0.0.0.0',
      agentId: `interactive-${Date.now().toString(36)}`,
      connectionCode: this.myCode
    });
    
    // 设置消息监听
    this.server.on('message', (msg) => {
      this.handleIncomingMessage(msg);
    });
    
    // 启动服务器
    console.log('🚀 启动对话服务器...');
    await this.server.start();
    console.log('✅ 服务器已启动\n');
    
    // 显示使用说明
    this.showInstructions();
    
    // 启动 readline
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    // 开始对话
    this.startChat();
  }
  
  /**
   * 处理收到的消息
   */
  handleIncomingMessage(msg) {
    // 如果正在输入，先换行
    if (this.isTyping) {
      process.stdout.write('\n');
    }
    
    console.log('\n========================================');
    console.log('📥 收到消息');
    console.log('========================================');
    console.log(`来自：${msg.fromCode || msg.from || 'Unknown'}`);
    console.log(`内容：${msg.content}`);
    console.log(`时间：${new Date(msg.timestamp).toLocaleString('zh-CN')}`);
    console.log('========================================\n');
    
    // 显示输入提示
    if (!this.isTyping) {
      this.rl.prompt(true);
    }
  }
  
  /**
   * 显示使用说明
   */
  showInstructions() {
    console.log('========================================');
    console.log('💡 使用说明');
    console.log('========================================');
    console.log('1. 输入消息后按 Enter 发送');
    console.log('2. 输入 /quit 退出对话');
    console.log('3. 输入 /help 查看帮助');
    console.log('4. 输入 /status 查看状态');
    console.log('========================================\n');
  }
  
  /**
   * 开始对话
   */
  startChat() {
    console.log('🎯 开始对话！输入消息后按 Enter 发送\n');
    
    const chatLoop = () => {
      this.isTyping = true;
      
      this.rl.question('你：', async (input) => {
        this.isTyping = false;
        
        const command = input.trim();
        
        // 处理命令
        if (command === '/quit' || command === '/exit') {
          console.log('\n👋 再见！');
          this.rl.close();
          this.stop();
          return;
        }
        
        if (command === '/help') {
          this.showInstructions();
          chatLoop();
          return;
        }
        
        if (command === '/status') {
          console.log(`\n我的编码：${this.myCode}`);
          console.log(`目标地址：${this.targetAddress}`);
          console.log(`目标编码：${this.targetCode}`);
          console.log('');
          chatLoop();
          return;
        }
        
        // 发送消息
        if (command) {
          await this.sendMessage(command);
        }
        
        chatLoop();
      });
    };
    
    chatLoop();
  }
  
  /**
   * 发送消息
   */
  async sendMessage(content) {
    try {
      const message = {
        from: 'interactive-user',
        fromCode: this.myCode,
        toCode: this.targetCode,
        content: content,
        type: 'message',
        timestamp: Date.now(),
        fromAddress: `http://localhost:8091`
      };
      
      console.log('\n📤 发送中...');
      
      const result = await this.server.sendToRemote(
        `${this.targetAddress}/message`,
        message
      );
      
      console.log('✅ 发送成功！\n');
      
    } catch (error) {
      console.log('\n❌ 发送失败！');
      console.log(`错误：${error.message}\n`);
    }
  }
  
  /**
   * 停止服务
   */
  async stop() {
    if (this.server) {
      await this.server.stop();
    }
    if (this.rl) {
      this.rl.close();
    }
    process.exit(0);
  }
}

// 解析命令行参数
const args = process.argv.slice(2);
const targetAddress = args[0] || 'http://localhost:1234';
const targetCode = args[1] || 'UNKNOWN';

// 启动交互式对话
const chat = new InteractiveChat();
chat.start(targetAddress, targetCode).catch(console.error);
