#!/usr/bin/env node
/**
 * 自组织中继服务器
 * 
 * 任何设备都可以成为中继节点
 * 帮助其他设备转发加密消息
 * 中继无法查看消息内容
 * 
 * 用法：node relay-server.js [端口]
 */

const http = require('http');
const crypto = require('crypto');

class RelayServer {
  constructor(port = 8080) {
    this.port = port;
    this.nodes = new Map(); // nodeId -> { code, ip, port, publicKey, lastSeen }
    this.routes = new Map(); // routeId -> [nodeId1, nodeId2, ...]
    this.messages = new Map(); // messageId -> { encrypted, from, to, timestamp }
    this.server = null;
    this.nodeId = `relay_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;
    this.stats = {
      messagesRelayed: 0,
      nodesConnected: 0,
      routesCreated: 0
    };
  }
  
  // 生成密钥对
  generateKeyPair() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    return { publicKey, privateKey };
  }
  
  // 加密消息
  encrypt(message, publicKey) {
    const buffer = Buffer.from(message, 'utf8');
    const encrypted = crypto.publicEncrypt({
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING
    }, buffer);
    return encrypted.toString('base64');
  }
  
  // 解密消息
  decrypt(encryptedBase64, privateKey) {
    const buffer = Buffer.from(encryptedBase64, 'base64');
    const decrypted = crypto.privateDecrypt({
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING
    }, buffer);
    return decrypted.toString('utf8');
  }
  
  async start() {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        if (req.method === 'OPTIONS') {
          res.writeHead(200);
          res.end();
          return;
        }
        
        if (req.url === '/health' && req.method === 'GET') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            status: 'ok',
            nodeId: this.nodeId,
            nodes: this.nodes.size,
            routes: this.routes.size,
            messagesRelayed: this.stats.messagesRelayed,
            uptime: process.uptime(),
            timestamp: Date.now()
          }));
        } else if (req.url === '/nodes' && req.method === 'GET') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            status: 'ok',
            nodes: Array.from(this.nodes.values()).map(n => ({
              code: n.code,
              ip: n.ip,
              port: n.port,
              lastSeen: n.lastSeen
            }))
          }));
        } else if (req.url === '/register' && req.method === 'POST') {
          this.handleRegister(req, res);
        } else if (req.url === '/relay' && req.method === 'POST') {
          this.handleRelay(req, res);
        } else if (req.url === '/route' && req.method === 'POST') {
          this.handleRoute(req, res);
        } else if (req.url.startsWith('/message/')) {
          this.handleMessage(req, res);
        } else {
          res.writeHead(404);
          res.end('Not Found');
        }
      });
      
      this.server.listen(this.port, '0.0.0.0', () => {
        console.log('========================================');
        console.log('📡 自组织中继服务器已启动');
        console.log('========================================');
        console.log(`📍 中继节点 ID: ${this.nodeId}`);
        console.log(`📍 监听端口：${this.port}`);
        console.log(`📍 健康检查：http://<IP>:${this.port}/health`);
        console.log(`📍 注册节点：http://<IP>:${this.port}/register`);
        console.log(`📍 中继消息：http://<IP>:${this.port}/relay`);
        console.log('========================================');
        console.log('💡 使用说明:');
        console.log('========================================');
        console.log('1. 注册为节点:');
        console.log('   POST /register { code, ip, port, publicKey }');
        console.log('');
        console.log('2. 中继消息:');
        console.log('   POST /relay { from, to, encryptedMessage }');
        console.log('');
        console.log('3. 创建路由:');
        console.log('   POST /route { nodes: [code1, code2, ...] }');
        console.log('');
        console.log('4. 查看状态:');
        console.log('   GET /health');
        console.log('========================================\n');
        resolve();
      });
      
      this.server.on('error', reject);
      
      // 定期清理过期节点
      setInterval(() => this.cleanup(), 60000);
    });
  }
  
  async handleRegister(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const { code, ip, port, publicKey } = data;
        
        if (!code || !ip || !port) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: '缺少必要参数' }));
          return;
        }
        
        this.nodes.set(code, {
          code,
          ip,
          port,
          publicKey,
          lastSeen: Date.now()
        });
        
        this.stats.nodesConnected = this.nodes.size;
        
        console.log(`📎 节点注册：${code} (${ip}:${port})`);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'ok',
          nodeId: this.nodeId,
          message: '注册成功',
          nodes: this.nodes.size
        }));
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  }
  
  async handleRelay(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const { from, to, encryptedMessage, route } = data;
        
        if (!from || !to || !encryptedMessage) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: '缺少必要参数' }));
          return;
        }
        
        // 中继无法查看消息内容（已加密）
        console.log(`📤 中继消息：${from} → ${to} (加密)`);
        
        // 查找目标节点
        const targetNode = this.nodes.get(to);
        if (!targetNode) {
          res.writeHead(404);
          res.end(JSON.stringify({ error: '目标节点不存在' }));
          return;
        }
        
        // 转发消息（通过 HTTP POST）
        try {
          const http = require('http');
          const postData = JSON.stringify({
            type: 'relayed-message',
            from,
            encryptedMessage,
            timestamp: Date.now()
          });
          
          await new Promise((resolve, reject) => {
            const req = http.request({
              hostname: targetNode.ip,
              port: targetNode.port,
              path: '/message',
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
              }
            }, (res) => {
              resolve();
            });
            req.on('error', reject);
            req.write(postData);
            req.end();
          });
          
          this.stats.messagesRelayed++;
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            status: 'ok',
            message: '中继成功',
            relayed: true
          }));
        } catch (error) {
          res.writeHead(500);
          res.end(JSON.stringify({ error: '转发失败：' + error.message }));
        }
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  }
  
  async handleRoute(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const { routeId, nodes } = data;
        
        if (!routeId || !nodes || nodes.length < 2) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: '路由至少需要 2 个节点' }));
          return;
        }
        
        // 验证所有节点都存在
        for (const nodeCode of nodes) {
          if (!this.nodes.has(nodeCode)) {
            res.writeHead(404);
            res.end(JSON.stringify({ error: `节点 ${nodeCode} 不存在` }));
            return;
          }
        }
        
        this.routes.set(routeId, nodes);
        this.stats.routesCreated++;
        
        console.log(`🛣️  创建路由：${routeId} (${nodes.join(' → ')})`);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'ok',
          routeId,
          nodes,
          hops: nodes.length
        }));
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  }
  
  handleMessage(req, res) {
    // 接收中继来的消息
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        console.log(`📥 收到中继消息 from ${data.from}`);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', received: true }));
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  }
  
  cleanup() {
    const now = Date.now();
    const timeout = 5 * 60 * 1000; // 5 分钟
    
    for (const [code, node] of this.nodes) {
      if (now - node.lastSeen > timeout) {
        this.nodes.delete(code);
        console.log(`🧹 清理过期节点：${code}`);
      }
    }
    
    this.stats.nodesConnected = this.nodes.size;
  }
  
  async stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('🛑 中继服务器已停止');
          resolve();
        });
      }
    });
  }
}

// 启动服务器
async function main() {
  const port = parseInt(process.argv[2]) || 8080;
  const server = new RelayServer(port);
  
  try {
    await server.start();
    
    process.on('SIGINT', async () => {
      console.log('\n🛑 收到退出信号...');
      await server.stop();
      process.exit(0);
    });
  } catch (error) {
    console.log(`❌ 启动失败：${error.message}`);
    process.exit(1);
  }
}

main().catch(console.error);
