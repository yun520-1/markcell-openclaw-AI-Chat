/**
 * WebSocket 通信模块
 * 
 * 实现 OpenClaw 实例之间的实时双向通信
 * 使用原生 WebSocket API（Node.js 18+）
 * 
 * 原创声明：本代码为原创，无版权风险
 * 许可证：MIT
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class WebSocketClient extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.url = config.url || 'ws://localhost:8080';
    this.agentId = config.agentId || this.generateAgentId();
    this.connectionCode = config.connectionCode || null;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = config.maxReconnectAttempts || 5;
    this.reconnectDelay = config.reconnectDelay || 3000;
    this.connected = false;
    this.messageQueue = [];
    this.stats = {
      messagesSent: 0,
      messagesReceived: 0,
      reconnects: 0,
      errors: 0
    };
    
    console.log(`[WebSocketClient] 初始化完成 | Agent: ${this.agentId}`);
  }
  
  /**
   * 生成 Agent ID
   */
  generateAgentId() {
    return `ws_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;
  }
  
  /**
   * 连接到 WebSocket 服务器
   */
  async connect() {
    return new Promise((resolve, reject) => {
      try {
        // 检查是否支持 WebSocket
        if (typeof WebSocket === 'undefined') {
          // Node.js 环境需要 ws 库
          console.warn('[WebSocketClient] 当前环境不支持 WebSocket，请使用 HTTP 模式');
          reject(new Error('WebSocket not supported'));
          return;
        }
        
        console.log(`[WebSocketClient] 连接到：${this.url}`);
        
        this.ws = new WebSocket(this.url);
        
        this.ws.on('open', () => {
          console.log(`[WebSocketClient] 连接成功`);
          this.connected = true;
          this.reconnectAttempts = 0;
          this.emit('connect');
          
          // 发送握手消息
          this.sendHandshake();
          
          resolve();
        });
        
        this.ws.on('message', (data) => {
          const message = JSON.parse(data.toString());
          console.log(`[WebSocketClient] 收到消息:`, message);
          this.stats.messagesReceived++;
          this.emit('message', message);
        });
        
        this.ws.on('close', () => {
          console.log(`[WebSocketClient] 连接关闭`);
          this.connected = false;
          this.emit('close');
          
          // 尝试重连
          this.attemptReconnect();
        });
        
        this.ws.on('error', (error) => {
          console.error(`[WebSocketClient] 错误:`, error);
          this.stats.errors++;
          this.emit('error', error);
          reject(error);
        });
        
      } catch (error) {
        console.error(`[WebSocketClient] 连接失败:`, error);
        reject(error);
      }
    });
  }
  
  /**
   * 断开连接
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.connected = false;
      console.log(`[WebSocketClient] 已断开连接`);
    }
  }
  
  /**
   * 发送握手消息
   */
  sendHandshake() {
    const handshake = {
      type: 'handshake',
      agentId: this.agentId,
      connectionCode: this.connectionCode,
      timestamp: Date.now(),
      version: '1.1.0'
    };
    
    this.send(handshake);
  }
  
  /**
   * 发送消息
   */
  send(message) {
    if (!this.connected || !this.ws) {
      console.warn(`[WebSocketClient] 未连接，消息已排队`);
      this.messageQueue.push(message);
      return false;
    }
    
    try {
      this.ws.send(JSON.stringify(message));
      this.stats.messagesSent++;
      console.log(`[WebSocketClient] 发送消息:`, message);
      return true;
    } catch (error) {
      console.error(`[WebSocketClient] 发送失败:`, error);
      this.stats.errors++;
      return false;
    }
  }
  
  /**
   * 发送消息到目标 Agent
   */
  sendTo(targetAgentId, content) {
    const message = {
      type: 'message',
      from: this.agentId,
      to: targetAgentId,
      content: content,
      timestamp: Date.now()
    };
    
    return this.send(message);
  }
  
  /**
   * 尝试重连
   */
  async attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`[WebSocketClient] 重连失败，已达到最大尝试次数`);
      this.emit('reconnect:failed');
      return;
    }
    
    this.reconnectAttempts++;
    this.stats.reconnects++;
    
    const delay = this.reconnectDelay * this.reconnectAttempts;
    console.log(`[WebSocketClient] ${delay}ms 后尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(async () => {
      try {
        await this.connect();
        console.log(`[WebSocketClient] 重连成功`);
        
        // 发送排队的消息
        while (this.messageQueue.length > 0) {
          const message = this.messageQueue.shift();
          this.send(message);
        }
      } catch (error) {
        console.error(`[WebSocketClient] 重连失败:`, error);
      }
    }, delay);
  }
  
  /**
   * 获取连接状态
   */
  getStatus() {
    return {
      agentId: this.agentId,
      connectionCode: this.connectionCode,
      connected: this.connected,
      url: this.url,
      reconnectAttempts: this.reconnectAttempts,
      queuedMessages: this.messageQueue.length,
      stats: this.stats
    };
  }
}

// WebSocket 服务器（需要 ws 库）
class WebSocketServer extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.port = config.port || 8081;
    this.host = config.host || '0.0.0.0';
    this.server = null;
    this.clients = new Map();
    this.stats = {
      connections: 0,
      messagesReceived: 0,
      messagesSent: 0,
      errors: 0
    };
    
    console.log(`[WebSocketServer] 初始化完成 | 端口：${this.port}`);
  }
  
  /**
   * 启动服务器
   */
  async start() {
    return new Promise((resolve, reject) => {
      try {
        // 检查 ws 库
        let WebSocket;
        try {
          WebSocket = require('ws');
        } catch (error) {
          console.warn('[WebSocketServer] ws 库未安装，使用 HTTP 模式');
          reject(new Error('ws library not found'));
          return;
        }
        
        this.server = new WebSocket.Server({
          port: this.port,
          host: this.host
        });
        
        this.server.on('listening', () => {
          console.log(`[WebSocketServer] 服务器已启动 | ws://${this.host}:${this.port}`);
          resolve();
        });
        
        this.server.on('connection', (ws, req) => {
          this.handleConnection(ws, req);
        });
        
        this.server.on('error', (error) => {
          console.error(`[WebSocketServer] 服务器错误:`, error);
          this.stats.errors++;
          this.emit('error', error);
          reject(error);
        });
        
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * 处理新连接
   */
  handleConnection(ws, req) {
    const clientId = this.generateClientId();
    
    console.log(`[WebSocketServer] 新连接：${clientId}`);
    this.stats.connections++;
    
    this.clients.set(clientId, {
      ws,
      connectedAt: Date.now(),
      lastSeen: Date.now,
      agentId: null
    });
    
    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      console.log(`[WebSocketServer] 收到消息:`, message);
      this.stats.messagesReceived++;
      
      // 更新最后活动时间
      const client = this.clients.get(clientId);
      if (client) {
        client.lastSeen = Date.now();
        if (message.agentId) {
          client.agentId = message.agentId;
        }
      }
      
      // 触发消息事件
      this.emit('message', {
        clientId,
        ...message
      });
    });
    
    ws.on('close', () => {
      console.log(`[WebSocketServer] 连接关闭：${clientId}`);
      this.clients.delete(clientId);
      this.emit('client:disconnect', clientId);
    });
    
    ws.on('error', (error) => {
      console.error(`[WebSocketServer] 客户端错误：${clientId}`, error);
      this.stats.errors++;
    });
    
    // 发送欢迎消息
    ws.send(JSON.stringify({
      type: 'welcome',
      clientId,
      timestamp: Date.now()
    }));
  }
  
  /**
   * 生成客户端 ID
   */
  generateClientId() {
    return `client_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;
  }
  
  /**
   * 广播消息
   */
  broadcast(message, excludeId = null) {
    const data = JSON.stringify(message);
    this.stats.messagesSent++;
    
    for (const [clientId, client] of this.clients) {
      if (clientId !== excludeId && client.ws.readyState === 1) { // WebSocket.OPEN
        client.ws.send(data);
      }
    }
  }
  
  /**
   * 发送消息到特定客户端
   */
  sendTo(clientId, message) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === 1) {
      client.ws.send(JSON.stringify(message));
      this.stats.messagesSent++;
      return true;
    }
    return false;
  }
  
  /**
   * 停止服务器
   */
  async stop() {
    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close(() => {
          console.log(`[WebSocketServer] 服务器已停止`);
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
  
  /**
   * 获取服务器状态
   */
  getStatus() {
    return {
      port: this.port,
      host: this.host,
      clientCount: this.clients.size,
      stats: this.stats
    };
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WebSocketClient, WebSocketServer };
}
