/**
 * A2A Module - AI 与 AI 对话协作模块
 * 
 * 功能：实现多个 OpenClaw AI 实例之间的协作对话
 * 协议：ACP-Lite (Agent Communication Protocol - Lite)
 * 原创声明：本代码为原创，无版权风险
 * 许可证：MIT
 */

class A2AModule {
  constructor(config = {}) {
    this.agentId = config.agentId || this.generateAgentId();
    this.role = config.role || 'worker'; // master, worker, peer
    this.peers = new Map();
    this.tasks = new Map();
    this.messageQueue = [];
    this.capabilities = config.capabilities || [];
    
    console.log(`[A2A] Agent 初始化完成 | ID: ${this.agentId} | 角色：${this.role}`);
  }

  /**
   * 生成 Agent ID
   */
  generateAgentId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `agent_${timestamp}_${random}`;
  }

  /**
   * 注册对等 Agent
   */
  registerPeer(peerId, metadata = {}) {
    this.peers.set(peerId, {
      peerId,
      metadata,
      registeredAt: new Date().toISOString(),
      lastHeartbeat: Date.now(),
      status: 'active'
    });
    console.log(`[A2A] 注册对等 Agent: ${peerId}`);
    return this;
  }

  /**
   * 注销对等 Agent
   */
  unregisterPeer(peerId) {
    const deleted = this.peers.delete(peerId);
    if (deleted) {
      console.log(`[A2A] 注销对等 Agent: ${peerId}`);
    }
    return deleted;
  }

  /**
   * 创建协作任务
   */
  createTask(taskDefinition) {
    const taskId = `task_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;
    
    const task = {
      taskId,
      ...taskDefinition,
      createdAt: new Date().toISOString(),
      status: 'pending',
      assignedTo: [],
      results: [],
      completedAt: null
    };

    this.tasks.set(taskId, task);
    console.log(`[A2A] 创建任务：${taskId} | 描述：${taskDefinition.description}`);
    
    // 如果是 master 角色，自动分配任务
    if (this.role === 'master') {
      this.assignTask(taskId);
    }

    return taskId;
  }

  /**
   * 分配任务给合适的 Agent
   */
  assignTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`任务不存在：${taskId}`);
    }

    // 查找可用的 worker
    const availableWorkers = [];
    for (const [peerId, peer] of this.peers) {
      if (peer.status === 'active' && peer.metadata.role === 'worker') {
        // 检查能力匹配
        if (this.capabilitiesMatch(task.requiredCapabilities, peer.metadata.capabilities)) {
          availableWorkers.push(peerId);
        }
      }
    }

    if (availableWorkers.length === 0) {
      console.warn(`[A2A] 没有可用的 worker 来执行任务：${taskId}`);
      task.status = 'no_workers';
      return false;
    }

    // 简单的轮询分配（可扩展为更复杂的调度算法）
    const assignedWorker = availableWorkers[Math.floor(Math.random() * availableWorkers.length)];
    task.assignedTo.push(assignedWorker);
    task.status = 'assigned';

    console.log(`[A2A] 任务分配 | 任务：${taskId} → Worker: ${assignedWorker}`);
    
    // 发送任务消息
    this.sendTaskMessage(assignedWorker, task);
    
    return true;
  }

  /**
   * 检查能力匹配
   */
  capabilitiesMatch(required, available) {
    if (!required || required.length === 0) {
      return true;
    }
    if (!available || available.length === 0) {
      return false;
    }
    return required.every(cap => available.includes(cap));
  }

  /**
   * 发送任务消息
   */
  sendTaskMessage(targetAgentId, task) {
    const message = {
      type: 'task_assignment',
      from: this.agentId,
      to: targetAgentId,
      task: task,
      timestamp: new Date().toISOString()
    };

    this.messageQueue.push(message);
    console.log(`[A2A] 任务消息已加入队列 | 目标：${targetAgentId}`);
    
    // 实际实现中，这里会调用 OpenClaw 的 sessions_send API
    return message;
  }

  /**
   * 接收任务结果
   */
  receiveTaskResult(taskId, result) {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`任务不存在：${taskId}`);
    }

    task.results.push({
      result,
      submittedAt: new Date().toISOString(),
      submittedBy: result.agentId
    });

    // 检查是否所有 worker 都完成了
    if (task.results.length >= task.assignedTo.length) {
      task.status = 'completed';
      task.completedAt = new Date().toISOString();
      console.log(`[A2A] 任务完成：${taskId}`);
      
      // 聚合结果
      return this.aggregateResults(task);
    }

    return null;
  }

  /**
   * 聚合多个 Agent 的结果
   */
  aggregateResults(task) {
    const aggregated = {
      taskId: task.taskId,
      description: task.description,
      resultsCount: task.results.length,
      aggregatedData: [],
      completedAt: task.completedAt
    };

    // 简单的结果聚合（可根据任务类型定制）
    for (const result of task.results) {
      aggregated.aggregatedData.push(result.result);
    }

    console.log(`[A2A] 结果聚合完成 | 任务：${task.taskId} | 结果数：${aggregated.resultsCount}`);
    return aggregated;
  }

  /**
   * 发送心跳
   */
  sendHeartbeat() {
    const heartbeat = {
      type: 'heartbeat',
      from: this.agentId,
      timestamp: new Date().toISOString(),
      status: 'active',
      load: this.getCurrentLoad()
    };

    // 广播给所有对等 Agent
    for (const [peerId, peer] of this.peers) {
      peer.lastHeartbeat = Date.now();
      // 实际实现中会发送消息
    }

    return heartbeat;
  }

  /**
   * 获取当前负载（简化版）
   */
  getCurrentLoad() {
    const activeTasks = Array.from(this.tasks.values())
      .filter(t => t.status === 'assigned' || t.status === 'processing')
      .length;
    
    return {
      activeTasks,
      queuedMessages: this.messageQueue.length,
      timestamp: Date.now()
    };
  }

  /**
   * 检查对等 Agent 健康状态
   */
  checkPeerHealth(timeoutMs = 30000) {
    const now = Date.now();
    let unhealthyCount = 0;

    for (const [peerId, peer] of this.peers) {
      if (now - peer.lastHeartbeat > timeoutMs) {
        peer.status = 'unhealthy';
        unhealthyCount++;
        console.warn(`[A2A] 对等 Agent 健康检查失败：${peerId}`);
      }
    }

    if (unhealthyCount > 0) {
      console.warn(`[A2A] 发现 ${unhealthyCount} 个不健康的对等 Agent`);
    }

    return {
      totalPeers: this.peers.size,
      unhealthyCount,
      healthyCount: this.peers.size - unhealthyCount
    };
  }

  /**
   * 获取任务状态
   */
  getTaskStatus(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) {
      return null;
    }

    return {
      taskId: task.taskId,
      description: task.description,
      status: task.status,
      assignedTo: task.assignedTo,
      resultsCount: task.results.length,
      createdAt: task.createdAt,
      completedAt: task.completedAt
    };
  }

  /**
   * 列出所有任务
   */
  listTasks(filter = {}) {
    const tasks = [];
    for (const [taskId, task] of this.tasks) {
      if (filter.status && task.status !== filter.status) {
        continue;
      }
      tasks.push(this.getTaskStatus(taskId));
    }
    return tasks;
  }

  /**
   * 获取 Agent 状态
   */
  getStatus() {
    return {
      agentId: this.agentId,
      role: this.role,
      peersCount: this.peers.size,
      activePeers: Array.from(this.peers.values()).filter(p => p.status === 'active').length,
      tasksCount: this.tasks.size,
      pendingTasks: Array.from(this.tasks.values()).filter(t => t.status === 'pending').length,
      messageQueueLength: this.messageQueue.length,
      capabilities: this.capabilities,
      timestamp: new Date().toISOString()
    };
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { A2AModule };
}
