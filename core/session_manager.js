/**
 * Session Manager - 会话状态管理器
 * 
 * 功能：管理对话会话的生命周期、状态持久化、断点续传
 * 原创声明：本代码为原创，无版权风险
 * 许可证：MIT
 */

const fs = require('fs');
const path = require('path');

class SessionManager {
  constructor(config = {}) {
    this.storagePath = config.storagePath || './sessions';
    this.activeSessions = new Map();
    this.maxActiveSessions = config.maxActiveSessions || 100;
    this.autoSaveInterval = config.autoSaveInterval || 5 * 60 * 1000; // 5 分钟
    
    // 确保存储目录存在
    this.ensureStorageDir();
    
    // 启动自动保存
    this.startAutoSave();
    
    console.log(`[SessionManager] 初始化完成 | 存储路径：${this.storagePath}`);
  }

  /**
   * 确保存储目录存在
   */
  ensureStorageDir() {
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
      console.log(`[SessionManager] 创建存储目录：${this.storagePath}`);
    }
  }

  /**
   * 启动自动保存
   */
  startAutoSave() {
    setInterval(() => {
      this.saveAllSessions();
    }, this.autoSaveInterval);
    console.log(`[SessionManager] 自动保存已启动 | 间隔：${this.autoSaveInterval}ms`);
  }

  /**
   * 创建新会话
   */
  createSession(sessionId, metadata = {}) {
    const session = {
      sessionId,
      metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      state: 'active',
      context: [],
      variables: {}
    };

    // 如果活跃会话过多，保存并移除最旧的
    if (this.activeSessions.size >= this.maxActiveSessions) {
      const oldestKey = this.activeSessions.keys().next().value;
      this.saveSession(oldestKey);
      this.activeSessions.delete(oldestKey);
    }

    this.activeSessions.set(sessionId, session);
    console.log(`[SessionManager] 创建新会话：${sessionId}`);
    return session;
  }

  /**
   * 获取会话
   */
  getSession(sessionId, createIfNotExists = false) {
    // 先在内存中查找
    let session = this.activeSessions.get(sessionId);
    
    if (session) {
      return session;
    }

    // 如果不存在且允许创建，则创建新会话
    if (createIfNotExists) {
      return this.createSession(sessionId);
    }

    // 否则尝试从磁盘加载
    session = this.loadSession(sessionId);
    if (session) {
      this.activeSessions.set(sessionId, session);
      return session;
    }

    return null;
  }

  /**
   * 更新会话
   */
  updateSession(sessionId, updates) {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error(`会话不存在：${sessionId}`);
    }

    // 合并更新
    Object.assign(session, updates, {
      updatedAt: new Date().toISOString()
    });

    // 如果更新了上下文，标记为需要保存
    if (updates.context) {
      session.needsSave = true;
    }

    console.log(`[SessionManager] 更新会话：${sessionId}`);
    return session;
  }

  /**
   * 添加消息到会话上下文
   */
  addMessage(sessionId, message) {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error(`会话不存在：${sessionId}`);
    }

    if (!session.context) {
      session.context = [];
    }

    session.context.push({
      ...message,
      timestamp: message.timestamp || new Date().toISOString()
    });

    session.updatedAt = new Date().toISOString();
    session.needsSave = true;

    // 限制上下文长度
    const maxContext = session.metadata.maxContextLength || 100;
    if (session.context.length > maxContext) {
      session.context = session.context.slice(-maxContext);
    }

    console.log(`[SessionManager] 添加消息到会话：${sessionId} | 消息数：${session.context.length}`);
    return session;
  }

  /**
   * 保存会话到磁盘
   */
  saveSession(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      console.warn(`[SessionManager] 会话不存在，无法保存：${sessionId}`);
      return false;
    }

    const filePath = path.join(this.storagePath, `${sessionId}.json`);
    
    try {
      fs.writeFileSync(filePath, JSON.stringify(session, null, 2), 'utf8');
      session.needsSave = false;
      console.log(`[SessionManager] 保存会话：${sessionId}`);
      return true;
    } catch (error) {
      console.error(`[SessionManager] 保存会话失败：${sessionId}`, error);
      return false;
    }
  }

  /**
   * 从磁盘加载会话
   */
  loadSession(sessionId) {
    const filePath = path.join(this.storagePath, `${sessionId}.json`);
    
    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        const session = JSON.parse(data);
        console.log(`[SessionManager] 加载会话：${sessionId}`);
        return session;
      }
    } catch (error) {
      console.error(`[SessionManager] 加载会话失败：${sessionId}`, error);
    }

    return null;
  }

  /**
   * 保存所有活跃会话
   */
  saveAllSessions() {
    let savedCount = 0;
    for (const sessionId of this.activeSessions.keys()) {
      const session = this.activeSessions.get(sessionId);
      if (session.needsSave || session.updatedAt) {
        if (this.saveSession(sessionId)) {
          savedCount++;
        }
      }
    }
    if (savedCount > 0) {
      console.log(`[SessionManager] 批量保存完成 | 保存数：${savedCount}`);
    }
  }

  /**
   * 关闭会话
   */
  closeSession(sessionId, reason = 'user_request') {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return false;
    }

    session.state = 'closed';
    session.closedAt = new Date().toISOString();
    session.closeReason = reason;

    this.saveSession(sessionId);
    this.activeSessions.delete(sessionId);

    console.log(`[SessionManager] 关闭会话：${sessionId} | 原因：${reason}`);
    return true;
  }

  /**
   * 列出所有活跃会话
   */
  listActiveSessions() {
    const sessions = [];
    for (const [sessionId, session] of this.activeSessions) {
      sessions.push({
        sessionId,
        state: session.state,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        contextLength: session.context?.length || 0
      });
    }
    return sessions;
  }

  /**
   * 清理过期会话
   */
  cleanupExpiredSessions(maxAgeMs = 24 * 60 * 60 * 1000) {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [sessionId, session] of this.activeSessions) {
      const updatedAt = new Date(session.updatedAt).getTime();
      if (now - updatedAt > maxAgeMs) {
        this.closeSession(sessionId, 'expired');
        cleanedCount++;
      }
    }

    console.log(`[SessionManager] 清理过期会话完成 | 清理数：${cleanedCount}`);
    return cleanedCount;
  }

  /**
   * 导出所有会话数据
   */
  exportAllSessions() {
    const exportData = {
      exportedAt: new Date().toISOString(),
      sessionsCount: this.activeSessions.size,
      sessions: []
    };

    for (const [sessionId, session] of this.activeSessions) {
      exportData.sessions.push(session);
    }

    return exportData;
  }

  /**
   * 获取会话统计信息
   */
  getStats() {
    const sessions = Array.from(this.activeSessions.values());
    const totalMessages = sessions.reduce((sum, s) => sum + (s.context?.length || 0), 0);
    
    return {
      activeSessions: this.activeSessions.size,
      totalMessages,
      storagePath: this.storagePath,
      autoSaveInterval: this.autoSaveInterval,
      timestamp: new Date().toISOString()
    };
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SessionManager };
}
