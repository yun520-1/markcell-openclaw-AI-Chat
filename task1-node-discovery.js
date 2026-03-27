#!/usr/bin/env node
/**
 * 任务 1: 节点发现系统（DHT 简化版）
 * 
 * 参考比特币节点发现机制
 * 每个节点都知道其他节点
 * 新节点通过已知节点加入网络
 * 
 * 用法：node task1-node-discovery.js [端口]
 */

const dgram = require('dgram');
const crypto = require('crypto');

class NodeDiscovery {
  constructor(port = 8091) {
    this.myId = this.generateNodeId();
    this.myCode = this.generateCode();
    this.port = port;
    this.socket = null;
    this.knownNodes = new Map(); // nodeId -> { code, ip, port, lastSeen }
    this.bootstrapNodes = [
      // 初始引导节点（可以配置公共节点）
      { ip: '127.0.0.1', port: 8091 },
      { ip: '127.0.0.1', port: 8092 },
      { ip: '127.0.0.1', port: 8093 }
    ];
  }
  
  generateNodeId() {
    return crypto.randomBytes(20).toString('hex');
  }
  
  generateCode() {
    const prefix = 'OCLAW';
    const segments = [];
    for (let i = 0; i < 3; i++) {
      const segment = Math.random().toString(16).substr(2, 4).toUpperCase();
      segments.push(segment);
    }
    return `${prefix}-${segments.join('-')}`;
  }
  
  async start() {
    return new Promise((resolve, reject) => {
      this.socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
      
      this.socket.on('listening', () => {
        console.log('========================================');
        console.log('✅ 任务 1: 节点发现系统已启动');
        console.log('========================================');
        console.log(`📍 节点 ID: ${this.myId}`);
        console.log(`📍 连接编码：${this.myCode}`);
        console.log(`📍 监听端口：${this.port}`);
        console.log(`📍 已知节点：${this.knownNodes.size}`);
        console.log('========================================');
        console.log('💡 使用说明:');
        console.log('========================================');
        console.log('1. 启动多个节点（不同端口）:');
        console.log('   node task1-node-discovery.js 8091');
        console.log('   node task1-node-discovery.js 8092');
        console.log('   node task1-node-discovery.js 8093');
        console.log('');
        console.log('2. 节点会自动发现彼此');
        console.log('3. 查看已知节点:');
        console.log('   发送：PING');
        console.log('========================================\n');
        
        resolve();
        
        // 定期广播自己
        setInterval(() => this.broadcastPresence(), 30000);
        // 定期清理过期节点
        setInterval(() => this.cleanup(), 60000);
      });
      
      this.socket.on('message', (msg, rinfo) => {
        this.handleMessage(msg, rinfo);
      });
      
      this.socket.on('error', reject);
      
      this.socket.bind(this.port, '0.0.0.0');
      
      // 连接引导节点
      setTimeout(() => this.connectToBootstrap(), 2000);
    });
  }
  
  handleMessage(msg, rinfo) {
    try {
      const message = JSON.parse(msg.toString());
      
      switch (message.type) {
        case 'PING':
          // 收到 Ping，回复 Pong
          this.send({
            type: 'PONG',
            nodeId: this.myId,
            code: this.myCode,
            ip: rinfo.address,
            port: this.port,
            timestamp: Date.now()
          }, rinfo.address, rinfo.port);
          
          // 添加发送者到已知节点
          this.addKnownNode(message.nodeId, message.code, rinfo.address, rinfo.port);
          break;
          
        case 'PONG':
          // 收到 Pong，添加节点
          this.addKnownNode(message.nodeId, message.code, message.ip || rinfo.address, message.port || rinfo.port);
          console.log(`📎 发现节点：${message.code} (${rinfo.address}:${rinfo.port})`);
          break;
          
        case 'GET_NODES':
          // 请求节点列表
          const nodes = Array.from(this.knownNodes.values()).slice(0, 10);
          this.send({
            type: 'NODES',
            nodes
          }, rinfo.address, rinfo.port);
          break;
          
        case 'NODES':
          // 收到节点列表
          message.nodes.forEach(node => {
            this.addKnownNode(node.nodeId, node.code, node.ip, node.port);
          });
          break;
      }
    } catch (error) {
      // 忽略无效消息
    }
  }
  
  send(message, address, port) {
    const data = JSON.stringify(message);
    this.socket.send(data, 0, data.length, port, address);
  }
  
  broadcastPresence() {
    // 向所有已知节点发送 Ping
    this.knownNodes.forEach((node, nodeId) => {
      this.send({
        type: 'PING',
        nodeId: this.myId,
        code: this.myCode,
        timestamp: Date.now()
      }, node.ip, node.port);
    });
    
    // 向引导节点发送 Ping
    this.bootstrapNodes.forEach(node => {
      this.send({
        type: 'PING',
        nodeId: this.myId,
        code: this.myCode,
        timestamp: Date.now()
      }, node.ip, node.port);
    });
  }
  
  connectToBootstrap() {
    console.log('🔌 连接引导节点...');
    this.bootstrapNodes.forEach(node => {
      this.send({
        type: 'PING',
        nodeId: this.myId,
        code: this.myCode,
        timestamp: Date.now()
      }, node.ip, node.port);
    });
  }
  
  addKnownNode(nodeId, code, ip, port) {
    if (nodeId === this.myId) return;
    
    this.knownNodes.set(nodeId, {
      nodeId,
      code,
      ip,
      port,
      lastSeen: Date.now()
    });
    
    // 限制节点数量
    if (this.knownNodes.size > 100) {
      const oldest = Array.from(this.knownNodes.entries())
        .sort((a, b) => a[1].lastSeen - b[1].lastSeen)[0];
      this.knownNodes.delete(oldest[0]);
    }
  }
  
  cleanup() {
    const now = Date.now();
    const timeout = 5 * 60 * 1000; // 5 分钟
    
    for (const [nodeId, node] of this.knownNodes) {
      if (now - node.lastSeen > timeout) {
        this.knownNodes.delete(nodeId);
        console.log(`🧹 清理过期节点：${node.code}`);
      }
    }
  }
  
  getKnownNodes() {
    return Array.from(this.knownNodes.values());
  }
  
  async stop() {
    if (this.socket) {
      this.socket.close();
      console.log('\n🛑 节点发现系统已停止\n');
    }
  }
}

// 命令行处理
async function main() {
  const args = process.argv.slice(2);
  const port = parseInt(args[0]) || 8091;
  
  const discovery = new NodeDiscovery(port);
  
  try {
    await discovery.start();
    
    // 交互式命令
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const commandLoop = () => {
      rl.question('命令 (nodes/ping/quit): ', async (cmd) => {
        const trimmed = cmd.trim().toLowerCase();
        
        if (trimmed === 'quit' || trimmed === 'exit') {
          await discovery.stop();
          rl.close();
          process.exit(0);
        }
        
        if (trimmed === 'nodes') {
          const nodes = discovery.getKnownNodes();
          console.log('\n========================================');
          console.log('📋 已知节点');
          console.log('========================================');
          nodes.forEach(node => {
            console.log(`${node.code} - ${node.ip}:${node.port}`);
          });
          console.log(`总计：${nodes.length} 个节点`);
          console.log('========================================\n');
        }
        
        if (trimmed === 'ping') {
          discovery.broadcastPresence();
          console.log('📡 已发送 Ping 到所有已知节点');
        }
        
        commandLoop();
      });
    };
    
    commandLoop();
    
    process.on('SIGINT', async () => {
      await discovery.stop();
      process.exit(0);
    });
  } catch (error) {
    console.log(`❌ 启动失败：${error.message}`);
    process.exit(1);
  }
}

main().catch(console.error);
