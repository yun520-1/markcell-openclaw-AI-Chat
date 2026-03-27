/**
 * OpenClaw Dialog Hub - 核心对话引擎
 * 
 * 功能：统一管理三种对话模式 (H2H, H2AI, A2A)
 * 原创声明：本代码为原创，无版权风险
 * 许可证：MIT
 */

class DialogHub {
  constructor(config = {}) {
    this.sessionId = config.sessionId || this.generateSessionId();
    this.mode = config.mode || 'h2ai'; // h2h, h2ai, a2a
    this.state = 'idle'; // idle, processing, waiting, completed
    this.context = [];
    this.skills = new Map();
    this.callbacks = new Map();
    
    console.log(`[DialogHub] 初始化完成 | Session: ${this.sessionId} | Mode: ${this.mode}`);
  }

  /**
   * 生成唯一会话 ID
   */
  generateSessionId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `dlg_${timestamp}_${random}`;
  }

  /**
   * 注册技能
   */
  registerSkill(name, handler, metadata = {}) {
    this.skills.set(name, {
      name,
      handler,
      metadata,
      registeredAt: new Date().toISOString()
    });
    console.log(`[DialogHub] 技能已注册：${name}`);
    return this;
  }

  /**
   * 注销技能
   */
  unregisterSkill(name) {
    const deleted = this.skills.delete(name);
    if (deleted) {
      console.log(`[DialogHub] 技能已注销：${name}`);
    }
    return deleted;
  }

  /**
   * 列出所有可用技能
   */
  listSkills() {
    const skills = [];
    for (const [name, skill] of this.skills) {
      skills.push({
        name: skill.name,
        metadata: skill.metadata
      });
    }
    return skills;
  }

  /**
   * 处理用户请求
   */
  async processRequest(request) {
    const { type, content, target, options = {} } = request;
    
    console.log(`[DialogHub] 收到请求 | 类型：${type} | 目标：${target || 'default'}`);
    
    this.state = 'processing';
    this.addToContext({ role: 'user', content, timestamp: new Date().toISOString() });

    try {
      // 1. 解析意图
      const intent = await this.parseIntent(content);
      
      // 2. 路由到合适的技能
      const skill = this.routeToSkill(intent);
      
      // 3. 执行技能
      const result = skill 
        ? await this.executeSkill(skill, content, options)
        : await this.defaultHandler(content, options);
      
      // 4. 记录响应
      this.addToContext({ role: 'assistant', content: result, timestamp: new Date().toISOString() });
      
      this.state = 'completed';
      return result;
      
    } catch (error) {
      this.state = 'error';
      console.error(`[DialogHub] 处理请求失败：`, error);
      return this.errorHandler(error);
    }
  }

  /**
   * 解析用户意图
   */
  async parseIntent(content) {
    // 简单的关键词匹配（可扩展为 AI 意图识别）
    const keywords = {
      'search': ['搜索', '查找', 'search', 'find'],
      'create': ['创建', '生成', 'create', 'generate'],
      'analyze': ['分析', '检查', 'analyze', 'check'],
      'chat': ['聊天', '对话', 'chat', 'talk'],
      'help': ['帮助', 'help', '支持', '功能', '命令'],
      'weather': ['天气', '气温', '晴天', '下雨', '气候'],
      'time': ['时间', '几点', '时钟', '时刻']
    };

    const contentLower = content.toLowerCase();
    
    // 查找匹配度最高的意图
    let bestMatch = null;
    let bestScore = 0;
    
    for (const [intent, words] of Object.entries(keywords)) {
      const matchCount = words.filter(word => contentLower.includes(word)).length;
      if (matchCount > bestScore) {
        bestScore = matchCount;
        bestMatch = intent;
      }
    }

    return { 
      type: bestMatch || 'chat', 
      confidence: bestScore > 0 ? 0.8 : 0.5 
    };
  }

  /**
   * 路由到合适的技能
   */
  routeToSkill(intent) {
    // 优先匹配高置信度的技能
    for (const [name, skill] of this.skills) {
      if (skill.metadata.tags?.includes(intent.type)) {
        return skill;
      }
    }
    return null;
  }

  /**
   * 执行技能
   */
  async executeSkill(skill, content, options) {
    console.log(`[DialogHub] 执行技能：${skill.name}`);
    try {
      return await skill.handler(content, options, this);
    } catch (error) {
      throw new Error(`技能执行失败 [${skill.name}]: ${error.message}`);
    }
  }

  /**
   * 默认处理器（无匹配技能时）
   */
  async defaultHandler(content, options) {
    return `我收到了你的消息："${content}"\n\n当前没有匹配的技能来处理这个请求。\n你可以：\n1. 尝试其他关键词\n2. 使用 "帮助" 查看可用功能\n3. 直接和我聊天`;
  }

  /**
   * 错误处理器
   */
  errorHandler(error) {
    return `抱歉，处理你的请求时遇到了问题：\n\n${error.message}\n\n请稍后重试，或联系管理员。`;
  }

  /**
   * 添加到上下文
   */
  addToContext(message) {
    this.context.push(message);
    // 保持上下文长度（可配置）
    const maxContext = this.contextMax || 50;
    if (this.context.length > maxContext) {
      this.context = this.context.slice(-maxContext);
    }
  }

  /**
   * 获取上下文
   */
  getContext(limit = 10) {
    return this.context.slice(-limit);
  }

  /**
   * 清除上下文
   */
  clearContext() {
    this.context = [];
    console.log(`[DialogHub] 上下文已清除`);
  }

  /**
   * 获取会话状态
   */
  getStatus() {
    return {
      sessionId: this.sessionId,
      mode: this.mode,
      state: this.state,
      contextLength: this.context.length,
      skillsCount: this.skills.size,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 导出会话数据
   */
  exportSession() {
    return {
      sessionId: this.sessionId,
      mode: this.mode,
      context: this.context,
      skills: this.listSkills(),
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * 导入会话数据
   */
  importSession(data) {
    this.sessionId = data.sessionId || this.generateSessionId();
    this.mode = data.mode || 'h2ai';
    this.context = data.context || [];
    console.log(`[DialogHub] 会话已导入：${this.sessionId}`);
    return this;
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DialogHub };
}
