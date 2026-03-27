/**
 * 真实网络连接模块 - HTTP/HTTPS 服务器
 * 
 * 实现 OpenClaw 实例之间的真实网络通信
 * 支持 HTTP REST API 和 WebSocket
 * 
 * 原创声明：本代码为原创，无版权风险
 * 许可证：MIT
 */

const http = require('http');
const https = require('https');
const EventEmitter = require('events');
const crypto = require('crypto');

class NetworkServer extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.port = config.port || 8080;
    this.host = config.host || '0.0.0.0';
    this.agentId = config.agentId || this.generateAgentId();
    this.connectionCode = config.connectionCode || null;
    this.server = null;
    this.peers = new Map();
    this.messageQueue = [];
    this.stats = {
      messagesReceived: 0,
      messagesSent: 0,
      connections: 0,
      errors: 0
    };
    
    console.log(`[NetworkServer] 初始化完成 | Agent: ${this.agentId}`);
  }
  
  /**
   * 生成 Agent ID
   */
  generateAgentId() {
    return `agent_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;
  }
  
  /**
   * 启动服务器
   */
  async start() {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        this.handleRequest(req, res);
      });
      
      this.server.on('error', (error) => {
        console.error(`[NetworkServer] 服务器错误:`, error);
        this.stats.errors++;
        this.emit('error', error);
      });
      
      this.server.listen(this.port, this.host, () => {
        console.log(`[NetworkServer] 服务器已启动 | http://${this.host}:${this.port}`);
        console.log(`[NetworkServer] Agent ID: ${this.agentId}`);
        console.log(`[NetworkServer] 连接编码：${this.connectionCode || '未设置'}`);
        resolve();
      });
    });
  }
  
  /**
   * 停止服务器
   */
  async stop() {
    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close(() => {
          console.log(`[NetworkServer] 服务器已停止`);
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
  
  /**
   * 处理 HTTP 请求
   */
  async handleRequest(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;
    
    console.log(`[NetworkServer] ${req.method} ${path}`);
    
    // 设置 CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }
    
    // 路由处理
    try {
      if (path === '/handshake' && req.method === 'POST') {
        await this.handleHandshake(req, res);
      } else if (path === '/message' && req.method === 'POST') {
        await this.handleMessage(req, res);
      } else if (path === '/status' && req.method === 'GET') {
        await this.handleStatus(req, res);
      } else if (path === '/peers' && req.method === 'GET') {
        await this.handlePeers(req, res);
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not Found' }));
      }
    } catch (error) {
      console.error(`[NetworkServer] 请求处理错误:`, error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  }
  
  /**
   * 处理握手请求
   */
  async handleHandshake(req, res) {
    const body = await this.readBody(req);
    
    console.log(`[NetworkServer] 握手请求:`, body);
    
    const response = {
      status: 'ok',
      agentId: this.agentId,
      connectionCode: this.connectionCode,
      timestamp: Date.now(),
      version: '1.1.0'
    };
    
    // 注册对等节点
    if (body.agentId) {
      this.peers.set(body.agentId, {
        agentId: body.agentId,
        connectedAt: Date.now(),
        lastSeen: Date.now()
      });
      this.stats.connections++;
      this.emit('peer:connect', body.agentId);
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response));
  }
  
  /**
   * 处理消息请求
   */
  async handleMessage(req, res) {
    const body = await this.readBody(req);
    
    console.log(`[NetworkServer] 收到消息:`, body);
    
    this.stats.messagesReceived++;
    
    // 触发消息事件
    this.emit('message', {
      from: body.from,
      content: body.content,
      type: body.type || 'message',
      timestamp: body.timestamp || Date.now()
    });
    
    // 保存消息到队列
    this.messageQueue.push({
      from: body.from,
      content: body.content,
      timestamp: Date.now()
    });
    
    // 限制队列长度
    if (this.messageQueue.length > 100) {
      this.messageQueue.shift();
    }
    
    const response = {
      status: 'received',
      messageId: this.generateMessageId(),
      timestamp: Date.now()
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response));
  }
  
  /**
   * 处理状态请求
   */
  async handleStatus(req, res) {
    const status = {
      agentId: this.agentId,
      connectionCode: this.connectionCode,
      port: this.port,
      uptime: process.uptime(),
      stats: this.stats,
      peerCount: this.peers.size,
      timestamp: Date.now()
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(status));
  }
  
  /**
   * 处理对等节点列表请求
   */
  async handlePeers(req, res) {
    const peers = Array.from(this.peers.values());
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ peers }));
  }
  
  /**
   * 读取请求体
   */
  async readBody(req) {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch (error) {
          reject(error);
        }
      });
      req.on('error', reject);
    });
  }
  
  /**
   * 生成消息 ID
   */
  generateMessageId() {
    return `msg_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;
  }
  
  /**
   * 发送消息到远程 Agent
   */
  async sendToRemote(url, message) {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const protocol = parsedUrl.protocol === 'https:' ? https : http;
      
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path: '/message',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      const req = protocol.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(error);
          }
        });
      });
      
      req.on('error', (error) => {
        console.error(`[NetworkServer] 发送消息失败:`, error);
        this.stats.errors++;
        reject(error);
      });
      
      req.write(JSON.stringify(message));
      req.end();
      
      this.stats.messagesSent++;
    });
  }
  
  /**
   * 获取服务器信息
   */
  getServerInfo() {
    return {
      agentId: this.agentId,
      connectionCode: this.connectionCode,
      host: this.host,
      port: this.port,
      url: `http://${this.getPublicIP()}:${this.port}`,
      peerCount: this.peers.size,
      stats: this.stats
    };
  }
  
  /**
   * 获取公网 IP（简化版）
   */
  getPublicIP() {
    // 实际实现中应该调用外部 API 获取公网 IP
    // 这里返回本地地址作为示例
    return this.host === '0.0.0.0' ? 'localhost' : this.host;
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NetworkServer };
}
