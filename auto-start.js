#!/usr/bin/env node
/**
 * 自动启动服务
 * 
 * 安装后自动启动网络服务器，生成连接编码
 * 让别人可以通过真实网络给你发信息
 * 
 * 用法：node auto-start.js
 */

const { NetworkServer } = require('./modules/a2a/network_server');
const { ConnectionCodeSystem } = require('./modules/a2a/connection_code');
const fs = require('fs');
const path = require('path');

class AutoStartService {
  constructor() {
    this.configPath = path.join(__dirname, 'config', 'auto-start.json');
    this.server = null;
    this.codeSystem = null;
    this.myCode = null;
    this.myAddress = null;
  }
  
  /**
   * 加载或创建配置
   */
  loadOrCreateConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        console.log('✅ 已加载配置');
        return config;
      } else {
        // 创建新配置
        const config = {
          autoStart: true,
          port: 8080,
          host: '0.0.0.0',
          connectionCode: null,
          agentId: null,
          createdAt: new Date().toISOString()
        };
        
        // 保存配置
        const configDir = path.dirname(this.configPath);
        if (!fs.existsSync(configDir)) {
          fs.mkdirSync(configDir, { recursive: true });
        }
        
        fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
        console.log('✅ 已创建新配置');
        
        return config;
      }
    } catch (error) {
      console.error('⚠️  配置加载失败:', error.message);
      return {
        autoStart: true,
        port: 8080,
        host: '0.0.0.0'
      };
    }
  }
  
  /**
   * 保存配置
   */
  saveConfig(config) {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
      console.log('✅ 配置已保存');
    } catch (error) {
      console.error('⚠️  配置保存失败:', error.message);
    }
  }
  
  /**
   * 获取公网 IP
   */
  async getPublicIP() {
    try {
      // 尝试多种方式获取公网 IP
      const https = require('https');
      
      return new Promise((resolve) => {
        https.get('https://api.ipify.org?format=json', (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const ip = JSON.parse(data).ip;
              resolve(ip);
            } catch (e) {
              resolve('localhost');
            }
          });
        }).on('error', () => {
          resolve('localhost');
        });
      });
    } catch (error) {
      return 'localhost';
    }
  }
  
  /**
   * 启动服务
   */
  async start() {
    console.log('========================================');
    console.log('🚀 OpenClaw 自动启动服务');
    console.log('========================================\n');
    
    // 加载配置
    const config = this.loadOrCreateConfig();
    
    // 创建连接编码系统
    this.codeSystem = new ConnectionCodeSystem();
    
    // 生成或加载连接编码
    if (config.connectionCode) {
      this.myCode = config.connectionCode;
      console.log(`📍 使用已有连接编码：${this.myCode}`);
    } else {
      this.myCode = this.codeSystem.getMyCode();
      config.connectionCode = this.myCode;
      config.agentId = `agent_${Date.now().toString(36)}`;
      console.log(`✨ 生成新连接编码：${this.myCode}`);
    }
    
    // 创建网络服务器
    this.server = new NetworkServer({
      port: config.port,
      host: config.host,
      agentId: config.agentId,
      connectionCode: this.myCode
    });
    
    // 设置消息监听
    this.server.on('message', (msg) => {
      console.log('\n========================================');
      console.log('📥 收到消息');
      console.log('========================================');
      console.log(`来自：${msg.from || msg.fromCode || 'Unknown'}`);
      console.log(`内容：${msg.content}`);
      console.log(`时间：${new Date(msg.timestamp).toLocaleString('zh-CN')}`);
      console.log('========================================\n');
      
      // 自动回复
      this.autoReply(msg);
    });
    
    // 启动服务器
    console.log(`\n🚀 启动网络服务器...`);
    await this.server.start();
    
    // 获取公网 IP
    console.log('\n🌐 获取公网 IP...');
    const publicIP = await this.getPublicIP();
    this.myAddress = `http://${publicIP}:${config.port}`;
    
    // 更新配置
    config.publicIP = publicIP;
    config.lastStarted = new Date().toISOString();
    config.address = this.myAddress;
    this.saveConfig(config);
    
    // 显示连接信息
    this.showConnectionInfo(config);
    
    // 保存连接信息到文件
    this.saveConnectionInfo(config);
    
    console.log('\n========================================');
    console.log('✅ 服务已启动，等待连接...');
    console.log('========================================\n');
    
    // 保持运行
    await new Promise(() => {});
  }
  
  /**
   * 自动回复消息
   */
  async autoReply(msg) {
    const content = msg.content.toLowerCase();
    let reply = null;
    
    // 根据消息内容自动回复
    if (content.includes('你好') || content.includes('hello') || content.includes('hi')) {
      reply = '你好！很高兴收到你的消息！我是 markcell-openclaw-AI Chat 系统。😊';
    } else if (content.includes('名字')) {
      reply = '我是 markcell-openclaw-AI Chat 系统，版本 v1.1.0！我是一套 OpenClaw 对话工具系统。';
    } else if (content.includes('功能') || content.includes('做什么')) {
      reply = '我支持三种对话模式：H2H（人与人）、H2AI（人与 AI）、A2A（AI 与 AI）。还支持连接编码系统和真实网络通信！';
    } else if (content.includes('编码')) {
      reply = `我的连接编码是：${this.myCode}。你可以使用这个编码直接联系我！`;
    } else if (content.includes('地址') || content.includes('IP')) {
      reply = `我的网络地址是：${this.myAddress}`;
    } else {
      reply = `收到你的消息："${msg.content}"。我是一个 AI 助手，有什么我可以帮助你的吗？😊`;
    }
    
    // 发送回复
    if (reply && msg.from) {
      try {
        // 尝试回复（需要知道对方的地址）
        console.log(`📤 准备回复：${reply}`);
        // 实际回复需要知道对方的服务器地址
      } catch (error) {
        console.log('⚠️  回复发送失败');
      }
    }
  }
  
  /**
   * 显示连接信息
   */
  showConnectionInfo(config) {
    console.log('\n========================================');
    console.log('📋 连接信息');
    console.log('========================================');
    console.log(`🔗 连接编码：${this.myCode}`);
    console.log(`🌐 公网 IP: ${config.publicIP}`);
    console.log(`🔌 端口：${config.port}`);
    console.log(`📍 网络地址：${this.myAddress}`);
    console.log(`🆔 Agent ID: ${config.agentId}`);
    console.log('\n========================================');
    console.log('💡 分享你的连接信息:');
    console.log('========================================');
    console.log(`连接编码：${this.myCode}`);
    console.log(`网络地址：${this.myAddress}`);
    console.log('\n别人可以通过以下方式连接你:');
    console.log('1. 使用连接编码');
    console.log('2. 直接访问网络地址');
    console.log('3. 发送消息到：${this.myAddress}/message');
    console.log('========================================\n');
  }
  
  /**
   * 保存连接信息到文件
   */
  saveConnectionInfo(config) {
    const infoPath = path.join(__dirname, 'my-connection-info.txt');
    const info = `
========================================
我的 OpenClaw 连接信息
========================================

连接编码：${this.myCode}
网络地址：${this.myAddress}
公网 IP: ${config.publicIP}
端口：${config.port}
Agent ID: ${config.agentId}

生成时间：${new Date().toLocaleString('zh-CN')}

========================================
别人可以通过以下方式联系我:
1. 连接编码：${this.myCode}
2. 网络地址：${this.myAddress}
3. 发送消息：${this.myAddress}/message
========================================
`.trim();
    
    fs.writeFileSync(infoPath, info);
    console.log(`\n💾 连接信息已保存到：${infoPath}`);
  }
}

// 启动服务
const service = new AutoStartService();
service.start().catch(console.error);
