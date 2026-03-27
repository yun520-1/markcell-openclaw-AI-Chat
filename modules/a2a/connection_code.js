/**
 * 连接编码系统
 * 
 * 为每个 OpenClaw 实例生成唯一连接编码
 * 通过编码实现直接对话连接
 * 
 * 原创声明：本代码为原创，无版权风险
 * 许可证：MIT
 */

const crypto = require('crypto');

class ConnectionCodeSystem {
  constructor(config = {}) {
    this.storagePath = config.storagePath || './connection-codes';
    this.codes = new Map();
    this.myCode = null;
    this.activeConnections = new Map();
    
    console.log(`[ConnectionCode] 系统初始化完成`);
  }
  
  /**
   * 生成唯一连接编码
   * 格式：OCLAW-XXXX-XXXX-XXXX
   */
  generateCode() {
    const prefix = 'OCLAW';
    const segments = [];
    
    // 生成 3 个 4 位随机段
    for (let i = 0; i < 3; i++) {
      const segment = crypto.randomBytes(2).toString('hex').toUpperCase();
      segments.push(segment);
    }
    
    const code = `${prefix}-${segments.join('-')}`;
    
    console.log(`[ConnectionCode] 生成新编码：${code}`);
    return code;
  }
  
  /**
   * 验证编码格式
   */
  validateCode(code) {
    const pattern = /^OCLAW-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/i;
    return pattern.test(code);
  }
  
  /**
   * 获取我的连接编码
   */
  getMyCode() {
    if (!this.myCode) {
      this.myCode = this.generateCode();
      console.log(`[ConnectionCode] 我的编码：${this.myCode}`);
    }
    return this.myCode;
  }
  
  /**
   * 注册连接编码
   */
  registerCode(code, metadata = {}) {
    if (!this.validateCode(code)) {
      throw new Error(`无效的编码格式：${code}`);
    }
    
    this.codes.set(code, {
      code,
      registeredAt: new Date().toISOString(),
      metadata,
      status: 'active',
      lastSeen: new Date().toISOString()
    });
    
    console.log(`[ConnectionCode] 已注册编码：${code}`);
    return this.codes.get(code);
  }
  
  /**
   * 通过编码连接到另一个 Agent
   */
  async connectByCode(targetCode, options = {}) {
    if (!this.validateCode(targetCode)) {
      throw new Error(`无效的目标编码：${targetCode}`);
    }
    
    console.log(`[ConnectionCode] 连接到：${targetCode}`);
    
    const connection = {
      targetCode,
      status: 'connecting',
      connectedAt: new Date().toISOString(),
      options,
      messageCount: 0
    };
    
    // 模拟连接过程
    // 实际实现中，这里会通过编码查找目标并建立连接
    await this.establishConnection(connection);
    
    connection.status = 'connected';
    this.activeConnections.set(targetCode, connection);
    
    console.log(`[ConnectionCode] 连接成功：${targetCode}`);
    return connection;
  }
  
  /**
   * 建立连接（内部方法）
   */
  async establishConnection(connection) {
    console.log(`[ConnectionCode] 建立连接中...`);
    
    // 模拟连接延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 实际实现中，这里会：
    // 1. 通过编码查找目标 Agent 的网络地址
    // 2. 建立 TCP/HTTP/WebSocket 连接
    // 3. 进行握手验证
    
    connection.established = true;
  }
  
  /**
   * 通过编码发送消息
   */
  async sendByCode(targetCode, message) {
    const connection = this.activeConnections.get(targetCode);
    
    if (!connection) {
      throw new Error(`未找到连接：${targetCode}`);
    }
    
    if (connection.status !== 'connected') {
      throw new Error(`连接未就绪：${targetCode}`);
    }
    
    console.log(`[ConnectionCode] 发送消息到 ${targetCode}: ${message.content}`);
    
    connection.messageCount++;
    connection.lastMessage = new Date().toISOString();
    
    // 模拟消息发送
    return {
      status: 'sent',
      messageId: this.generateMessageId(),
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * 生成消息 ID
   */
  generateMessageId() {
    return `msg_${Date.now().toString(36)}`;
  }
  
  /**
   * 列出所有活动连接
   */
  listConnections() {
    const connections = [];
    
    for (const [code, conn] of this.activeConnections) {
      connections.push({
        code,
        status: conn.status,
        messageCount: conn.messageCount,
        connectedAt: conn.connectedAt,
        lastMessage: conn.lastMessage
      });
    }
    
    return connections;
  }
  
  /**
   * 断开连接
   */
  async disconnectByCode(targetCode) {
    const connection = this.activeConnections.get(targetCode);
    
    if (!connection) {
      return false;
    }
    
    console.log(`[ConnectionCode] 断开连接：${targetCode}`);
    
    connection.status = 'disconnected';
    connection.disconnectedAt = new Date().toISOString();
    
    return true;
  }
  
  /**
   * 导出连接编码信息
   */
  exportCodeInfo() {
    return {
      myCode: this.myCode,
      totalConnections: this.activeConnections.size,
      connections: this.listConnections(),
      exportedAt: new Date().toISOString()
    };
  }
  
  /**
   * 获取统计信息
   */
  getStats() {
    const connections = this.listConnections();
    const totalMessages = connections.reduce((sum, c) => sum + c.messageCount, 0);
    
    return {
      myCode: this.myCode,
      totalCodes: this.codes.size,
      activeConnections: connections.length,
      totalMessages,
      timestamp: new Date().toISOString()
    };
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ConnectionCodeSystem };
}
