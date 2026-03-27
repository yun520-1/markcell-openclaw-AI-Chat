/**
 * A2A 直接通信模块
 * 
 * 实现 OpenClaw 实例之间的直接对话（无需中转站）
 * 支持多种通信方式：sessions_send、HTTP、WebSocket
 * 
 * 原创声明：本代码为原创，无版权风险
 * 许可证：MIT
 */

const { A2AModule } = require('../modules/a2a/agent_protocol');

class A2ADirectConnect extends A2AModule {
  constructor(config = {}) {
    super(config);
    
    this.connections = new Map();
    this.messageHandlers = new Map();
    this.communicationMode = config.communicationMode || 'sessions_send'; // sessions_send, http, websocket
    this.httpConfig = config.httpConfig || {};
    this.wsConfig = config.wsConfig || {};
    
    console.log(`[A2ADirectConnect] 初始化完成 | 通信模式：${this.communicationMode}`);
  }
  
  /**
   * 连接到另一个 OpenClaw 实例
   */
  async connect(targetAgentId, config = {}) {
    console.log(`[A2ADirectConnect] 连接到：${targetAgentId}`);
    
    const connection = {
      targetAgentId,
      status: 'connecting',
      connectedAt: new Date().toISOString(),
      lastMessage: null,
      messageCount: 0,
      config
    };
    
    // 根据通信模式建立连接
    switch (this.communicationMode) {
      case 'sessions_send':
        await this.connectViaSessionsSend(connection);
        break;
      case 'http':
        await this.connectViaHTTP(connection);
        break;
      case 'websocket':
        await this.connectViaWebSocket(connection);
        break;
      default:
        throw new Error(`不支持的通信模式：${this.communicationMode}`);
    }
    
    connection.status = 'connected';
    this.connections.set(targetAgentId, connection);
    
    console.log(`[A2ADirectConnect] 连接成功：${targetAgentId}`);
    return connection;
  }
  
  /**
   * 通过 sessions_send 连接（OpenClaw 内置）
   */
  async connectViaSessionsSend(connection) {
    console.log(`[A2ADirectConnect] 使用 sessions_send 模式`);
    // sessions_send 模式不需要额外建立连接
    // OpenClaw 会自动处理路由
    connection.mode = 'sessions_send';
  }
  
  /**
   * 通过 HTTP 连接
   */
  async connectViaHTTP(connection) {
    console.log(`[A2ADirectConnect] 使用 HTTP 模式`);
    
    const { baseUrl, port = 8080 } = connection.config;
    connection.endpoint = `${baseUrl || 'http://localhost'}:${port}`;
    connection.mode = 'http';
    
    // 发送握手请求
    try {
      const response = await this.httpRequest(`${connection.endpoint}/handshake`, {
        method: 'POST',
        body: JSON.stringify({
          agentId: this.agentId,
          timestamp: Date.now()
        })
      });
      
      connection.handshake = response;
      console.log(`[A2ADirectConnect] HTTP 握手成功`);
    } catch (error) {
      console.warn(`[A2ADirectConnect] HTTP 握手失败：${error.message}`);
      connection.status = 'error';
      throw error;
    }
  }
  
  /**
   * 通过 WebSocket 连接
   */
  async connectViaWebSocket(connection) {
    console.log(`[A2ADirectConnect] 使用 WebSocket 模式`);
    
    const { url } = connection.config;
    connection.mode = 'websocket';
    
    // WebSocket 连接（在实际环境中需要使用 ws 库）
    // 这里提供接口，实际实现需要 Node.js 的 ws 库
    console.log(`[A2ADirectConnect] WebSocket URL: ${url}`);
    connection.wsUrl = url;
  }
  
  /**
   * 发送消息到另一个 Agent
   */
  async sendMessage(targetAgentId, message) {
    const connection = this.connections.get(targetAgentId);
    
    if (!connection) {
      throw new Error(`未找到连接：${targetAgentId}`);
    }
    
    if (connection.status !== 'connected') {
      throw new Error(`连接未就绪：${targetAgentId} (状态：${connection.status})`);
    }
    
    console.log(`[A2ADirectConnect] 发送消息到 ${targetAgentId}: ${message.content}`);
    
    let response;
    
    switch (connection.mode) {
      case 'sessions_send':
        response = await this.sendViaSessionsSend(targetAgentId, message);
        break;
      case 'http':
        response = await this.sendViaHTTP(connection, message);
        break;
      case 'websocket':
        response = await this.sendViaWebSocket(connection, message);
        break;
      default:
        throw new Error(`不支持的连接模式：${connection.mode}`);
    }
    
    connection.lastMessage = new Date().toISOString();
    connection.messageCount++;
    
    return response;
  }
  
  /**
   * 通过 sessions_send 发送消息
   */
  async sendViaSessionsSend(targetAgentId, message) {
    console.log(`[A2ADirectConnect] 使用 sessions_send 发送`);
    
    // 在实际 OpenClaw 环境中，这里会调用 sessions_send API
    // 由于这是示例，我们模拟这个调用
    
    const payload = {
      type: 'a2a_message',
      from: this.agentId,
      to: targetAgentId,
      content: message.content,
      timestamp: new Date().toISOString()
    };
    
    // 模拟响应
    // 实际使用时，这里会调用 OpenClaw 的 sessions_send
    console.log(`[A2ADirectConnect] 消息已发送（模拟）`);
    console.log(`  Payload:`, JSON.stringify(payload, null, 2));
    
    return {
      status: 'sent',
      messageId: this.generateMessageId(),
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * 通过 HTTP 发送消息
   */
  async sendViaHTTP(connection, message) {
    console.log(`[A2ADirectConnect] 使用 HTTP 发送`);
    
    const payload = {
      from: this.agentId,
      content: message.content,
      timestamp: Date.now()
    };
    
    const response = await this.httpRequest(`${connection.endpoint}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    return response;
  }
  
  /**
   * 通过 WebSocket 发送消息
   */
  async sendViaWebSocket(connection, message) {
    console.log(`[A2ADirectConnect] 使用 WebSocket 发送`);
    
    const payload = {
      type: 'message',
      from: this.agentId,
      content: message.content,
      timestamp: Date.now()
    };
    
    // 在实际环境中，这里会使用 ws.send()
    console.log(`[A2ADirectConnect] WebSocket 发送：`, JSON.stringify(payload));
    
    return {
      status: 'sent',
      messageId: this.generateMessageId()
    };
  }
  
  /**
   * 接收消息并处理
   */
  async receiveMessage(fromAgentId, message) {
    console.log(`[A2ADirectConnect] 收到来自 ${fromAgentId} 的消息：${message.content}`);
    
    // 查找处理函数
    const handler = this.messageHandlers.get(fromAgentId);
    
    if (handler) {
      return await handler(message);
    }
    
    // 使用默认处理
    return this.defaultMessageHandler(fromAgentId, message);
  }
  
  /**
   * 注册消息处理函数
   */
  registerMessageHandler(agentId, handler) {
    console.log(`[A2ADirectConnect] 注册消息处理器：${agentId}`);
    this.messageHandlers.set(agentId, handler);
  }
  
  /**
   * 默认消息处理
   */
  async defaultMessageHandler(fromAgentId, message) {
    console.log(`[A2ADirectConnect] 使用默认处理器`);
    
    // 简单的回复逻辑
    const content = message.content;
    
    if (content.includes('你好') || content.includes('hello')) {
      return { content: '你好！很高兴收到你的消息！' };
    }
    
    if (content.includes('再见') || content.includes('bye')) {
      return { content: '再见！期待下次交流！' };
    }
    
    return { content: `收到你的消息："${content}"` };
  }
  
  /**
   * HTTP 请求辅助函数
   */
  async httpRequest(url, options = {}) {
    // 在实际环境中，这里会使用 node-fetch 或 axios
    // 这里提供简化实现
    
    console.log(`[A2ADirectConnect] HTTP ${options.method || 'GET'} ${url}`);
    
    // 模拟响应
    return {
      status: 'ok',
      timestamp: Date.now()
    };
  }
  
  /**
   * 生成消息 ID
   */
  generateMessageId() {
    return `msg_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * 断开连接
   */
  async disconnect(targetAgentId) {
    const connection = this.connections.get(targetAgentId);
    
    if (!connection) {
      return false;
    }
    
    console.log(`[A2ADirectConnect] 断开连接：${targetAgentId}`);
    
    connection.status = 'disconnected';
    connection.disconnectedAt = new Date().toISOString();
    
    return true;
  }
  
  /**
   * 获取连接状态
   */
  getConnectionStatus(targetAgentId) {
    return this.connections.get(targetAgentId);
  }
  
  /**
   * 列出所有连接
   */
  listConnections() {
    const connections = [];
    
    for (const [agentId, conn] of this.connections) {
      connections.push({
        agentId,
        status: conn.status,
        mode: conn.mode,
        messageCount: conn.messageCount,
        lastMessage: conn.lastMessage,
        connectedAt: conn.connectedAt
      });
    }
    
    return connections;
  }
  
  /**
   * 获取统计信息
   */
  getStats() {
    const connections = this.listConnections();
    const totalMessages = connections.reduce((sum, c) => sum + c.messageCount, 0);
    
    return {
      agentId: this.agentId,
      communicationMode: this.communicationMode,
      totalConnections: connections.length,
      activeConnections: connections.filter(c => c.status === 'connected').length,
      totalMessages,
      connections,
      timestamp: new Date().toISOString()
    };
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { A2ADirectConnect };
}
