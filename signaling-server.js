#!/usr/bin/env node
/**
 * 去中心化聊天信令服务器
 * 
 * 帮助双方交换连接信息，实现 P2P 通信
 * 不存储消息，只协助建立连接
 * 
 * 用法：node signaling-server.js [端口]
 */

const http = require('http');
const WebSocket = require('ws');

class SignalingServer {
  constructor(port = 8080) {
    this.port = port;
    this.clients = new Map(); // clientId -> { ws, code, ip, port }
    this.rooms = new Map();   // roomId -> [clientId1, clientId2]
    this.httpServer = null;
    this.wsServer = null;
  }
  
  async start() {
    return new Promise((resolve, reject) => {
      // HTTP 服务器（REST API）
      this.httpServer = http.createServer((req, res) => {
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
            clients: this.clients.size,
            rooms: this.rooms.size,
            timestamp: Date.now()
          }));
        } else if (req.url === '/stats' && req.method === 'GET') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            clients: Array.from(this.clients.values()).map(c => ({
              code: c.code,
              ip: c.ip
            })),
            rooms: Array.from(this.rooms.entries()).map(([id, clients]) => ({
              id,
              clients
            }))
          }));
        } else {
          res.writeHead(404);
          res.end('Not Found');
        }
      });
      
      // WebSocket 服务器
      this.wsServer = new WebSocket.Server({ server: this.httpServer });
      
      this.wsServer.on('connection', (ws, req) => {
        const clientId = `client_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;
        console.log(`📎 新客户端连接：${clientId}`);
        
        this.clients.set(clientId, {
          ws,
          code: null,
          ip: req.socket.remoteAddress,
          port: null,
          connectedAt: Date.now()
        });
        
        // 发送客户端 ID
        ws.send(JSON.stringify({
          type: 'connected',
          clientId,
          timestamp: Date.now()
        }));
        
        // 处理消息
        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data);
            this.handleMessage(clientId, message);
          } catch (error) {
            console.log(`❌ 消息解析失败：${error.message}`);
            ws.send(JSON.stringify({
              type: 'error',
              error: error.message
            }));
          }
        });
        
        // 断开连接
        ws.on('close', () => {
          console.log(`📎 客户端断开：${clientId}`);
          this.clients.delete(clientId);
          this.cleanupRooms(clientId);
        });
        
        ws.on('error', (error) => {
          console.log(`❌ 客户端错误：${clientId} - ${error.message}`);
        });
      });
      
      this.httpServer.listen(this.port, '0.0.0.0', () => {
        console.log('========================================');
        console.log('✅ 信令服务器已启动');
        console.log('========================================');
        console.log(`📍 WebSocket: ws://<IP>:${this.port}`);
        console.log(`📍 HTTP: http://<IP>:${this.port}`);
        console.log(`📍 健康检查：http://<IP>:${this.port}/health`);
        console.log(`📍 统计信息：http://<IP>:${this.port}/stats`);
        console.log('========================================');
        console.log('💡 使用说明:');
        console.log('========================================');
        console.log('1. 客户端连接:');
        console.log('   const ws = new WebSocket(\'ws://<IP>:8080\')');
        console.log('');
        console.log('2. 注册编码:');
        console.log('   ws.send(JSON.stringify({ type: \'register\', code: \'OCLAW-XXX\' }))');
        console.log('');
        console.log('3. 创建房间:');
        console.log('   ws.send(JSON.stringify({ type: \'create\', partnerCode: \'OCLAW-YYY\' }))');
        console.log('');
        console.log('4. 交换信息:');
        console.log('   通过信令服务器交换 IP、端口、SDP 等信息');
        console.log('');
        console.log('5. 建立 P2P 连接后直接通信');
        console.log('========================================\n');
        resolve();
      });
      
      this.httpServer.on('error', reject);
    });
  }
  
  handleMessage(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    console.log(`📨 收到消息 [${clientId}]: ${message.type}`);
    
    switch (message.type) {
      case 'register':
        // 注册编码
        client.code = message.code;
        client.port = message.port;
        console.log(`📝 注册编码：${client.code}`);
        
        this.sendTo(clientId, {
          type: 'registered',
          code: message.code,
          timestamp: Date.now()
        });
        break;
        
      case 'create':
        // 创建房间，邀请对方
        this.createRoom(clientId, message.partnerCode);
        break;
        
      case 'join':
        // 加入房间
        this.joinRoom(clientId, message.roomId);
        break;
        
      case 'offer':
      case 'answer':
      case 'ice-candidate':
        // 转发 SDP/ICE 信息
        this.forwardToPartner(clientId, message);
        break;
        
      case 'chat':
        // 转发聊天消息（P2P 失败时的备选）
        this.forwardChat(clientId, message);
        break;
        
      case 'ping':
        // 心跳
        this.sendTo(clientId, { type: 'pong', timestamp: Date.now() });
        break;
    }
  }
  
  createRoom(clientId, partnerCode) {
    const client = this.clients.get(clientId);
    
    // 查找对方
    let partnerId = null;
    for (const [id, c] of this.clients) {
      if (c.code === partnerCode) {
        partnerId = id;
        break;
      }
    }
    
    if (!partnerId) {
      this.sendTo(clientId, {
        type: 'error',
        error: '对方不在线',
        partnerCode
      });
      return;
    }
    
    // 创建房间
    const roomId = `room_${Date.now().toString(36)}`;
    this.rooms.set(roomId, [clientId, partnerId]);
    
    console.log(`🏠 创建房间：${roomId} (${clientId} ↔ ${partnerId})`);
    
    // 通知双方
    this.sendTo(clientId, {
      type: 'room-created',
      roomId,
      partner: {
        code: this.clients.get(partnerId).code,
        ip: this.clients.get(partnerId).ip,
        port: this.clients.get(partnerId).port
      }
    });
    
    this.sendTo(partnerId, {
      type: 'room-joined',
      roomId,
      partner: {
        code: client.code,
        ip: client.ip,
        port: client.port
      }
    });
  }
  
  joinRoom(clientId, roomId) {
    const room = this.rooms.get(roomId);
    if (!room) {
      this.sendTo(clientId, { type: 'error', error: '房间不存在' });
      return;
    }
    
    if (!room.includes(clientId)) {
      room.push(clientId);
    }
    
    console.log(`🏠 加入房间：${roomId}`);
    
    // 通知房间内所有人
    room.forEach(id => {
      if (id !== clientId) {
        this.sendTo(id, {
          type: 'peer-joined',
          roomId,
          peerId: clientId,
          peer: this.clients.get(clientId)
        });
      }
    });
    
    this.sendTo(clientId, {
      type: 'room-joined',
      roomId,
      peers: room.filter(id => id !== clientId).map(id => ({
        id,
        ...this.clients.get(id)
      }))
    });
  }
  
  forwardToPartner(clientId, message) {
    const room = this.findRoom(clientId);
    if (!room) {
      this.sendTo(clientId, { type: 'error', error: '未找到房间' });
      return;
    }
    
    const partnerId = room.find(id => id !== clientId);
    if (!partnerId) {
      this.sendTo(clientId, { type: 'error', error: '未找到对方' });
      return;
    }
    
    console.log(`📤 转发消息：${clientId} → ${partnerId} (${message.type})`);
    
    this.sendTo(partnerId, {
      type: message.type,
      from: clientId,
      fromCode: this.clients.get(clientId)?.code,
      data: message.data,
      timestamp: Date.now()
    });
  }
  
  forwardChat(clientId, message) {
    const room = this.findRoom(clientId);
    if (!room) return;
    
    const partnerId = room.find(id => id !== clientId);
    if (!partnerId) return;
    
    this.sendTo(partnerId, {
      type: 'chat-message',
      from: clientId,
      fromCode: this.clients.get(clientId)?.code,
      content: message.content,
      timestamp: Date.now()
    });
  }
  
  findRoom(clientId) {
    for (const [id, room] of this.rooms) {
      if (room.includes(clientId)) {
        return room;
      }
    }
    return null;
  }
  
  cleanupRooms(clientId) {
    for (const [roomId, room] of this.rooms) {
      if (room.includes(clientId)) {
        this.rooms.delete(roomId);
        console.log(`🧹 清理房间：${roomId}`);
        break;
      }
    }
  }
  
  sendTo(clientId, message) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }
  
  async stop() {
    return new Promise((resolve) => {
      if (this.wsServer) {
        this.wsServer.close(() => {
          console.log('🛑 WebSocket 服务器已停止');
        });
      }
      if (this.httpServer) {
        this.httpServer.close(() => {
          console.log('🛑 HTTP 服务器已停止');
          resolve();
        });
      }
    });
  }
}

// 启动服务器
async function main() {
  const port = parseInt(process.argv[2]) || 8080;
  const server = new SignalingServer(port);
  
  try {
    await server.start();
    
    // 优雅退出
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

// 检查 ws 模块
try {
  require.resolve('ws');
  main();
} catch (error) {
  console.log('❌ 缺少 ws 模块，请安装：npm install ws');
  console.log('\n或者使用无需 ws 的 HTTP 长轮询版本');
  process.exit(1);
}
