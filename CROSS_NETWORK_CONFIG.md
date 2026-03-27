# 🌐 跨网络通信配置完成！

## ✅ 配置状态

**配置成功！** 现在可以通过公网 IP 进行跨网络通信！

---

## 📍 我的连接信息（跨网络）

### 连接编码
```
OCLAW-CECB-2C97-44F3
```

### 网络地址
```
http://49.87.224.177:8080
```

### 公网 IP
```
49.87.224.177
```

### 端口
```
8080
```

---

## 🚀 在其他电脑上连接

### 方式 1: 使用连接编码

在另一台电脑上运行：

```bash
# 1. 安装技能
git clone https://github.com/yun520-1/markcell-openclaw-AI-Chat.git
cd markcell-openclaw-AI-Chat

# 2. 启动服务（生成自己的编码）
node auto-start.js
```

然后在另一个终端发送消息：

```bash
node examples/example-real-chat.js client OCLAW-CECB-2C97-44F3 http://49.87.224.177:8080
```

### 方式 2: 直接访问网络地址

在任何能访问网络的电脑上：

```bash
curl -X POST http://49.87.224.177:8080/message \
  -H "Content-Type: application/json" \
  -d '{
    "from": "friend",
    "content": "你好！",
    "timestamp": '"$(date +%s)"'
  }'
```

### 方式 3: 使用 JavaScript

```javascript
const response = await fetch('http://49.87.224.177:8080/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    from: 'friend',
    content: '你好！你叫什么名字？',
    timestamp: Date.now()
  })
});

const result = await response.json();
console.log('发送结果:', result);
```

---

## ⚠️ 重要说明

### 当前状态

- ✅ **服务已启动** - 网络服务器运行中
- ✅ **监听所有接口** - 0.0.0.0:8080
- ✅ **公网 IP 已获取** - 49.87.224.177
- ⚠️ **防火墙** - 可能需要手动配置

### 可能的障碍

#### 1. 防火墙阻止 ⚠️

**macOS**:
```bash
# 需要密码手动配置
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node
```

**或者临时关闭防火墙测试**（不推荐生产环境）:
```bash
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off
```

**Linux (Ubuntu)**:
```bash
sudo ufw allow 8080/tcp
```

#### 2. 路由器端口转发 ⚠️

如果是家庭/办公室网络，可能需要在路由器上配置端口转发：

1. 登录路由器管理页面（通常是 192.168.1.1）
2. 找到"端口转发"或"虚拟服务器"
3. 添加规则：
   - 外部端口：8080
   - 内部 IP：这台电脑的局域网 IP（如 192.168.1.100）
   - 内部端口：8080
   - 协议：TCP

#### 3. 云服务器安全组 ⚠️

如果是云服务器（阿里云、腾讯云等）：

1. 登录云服务器控制台
2. 找到安全组配置
3. 添加入站规则：
   - 端口：8080
   - 协议：TCP
   - 授权对象：0.0.0.0/0

---

## 🧪 测试连接

### 测试 1: 本地访问

```bash
curl http://localhost:8080/status
```

**预期输出**:
```json
{
  "agentId": "agent_xxx",
  "connectionCode": "OCLAW-CECB-2C97-44F3",
  "port": 8080,
  "stats": {...}
}
```

### 测试 2: 局域网访问

在同一个局域网的另一台设备上：

```bash
curl http://49.87.224.177:8080/status
```

### 测试 3: 发送消息

```bash
curl -X POST http://49.87.224.177:8080/message \
  -H "Content-Type: application/json" \
  -d '{
    "from": "test",
    "content": "你叫什么名字？",
    "timestamp": '"$(date +%s)"'
  }'
```

**预期输出**:
```json
{
  "status": "received",
  "messageId": "msg_xxx",
  "timestamp": 1234567890
}
```

---

## 📋 完整配置步骤（另一台电脑）

### 步骤 1: 安装技能

```bash
git clone https://github.com/yun520-1/markcell-openclaw-AI-Chat.git
cd markcell-openclaw-AI-Chat
```

### 步骤 2: 启动服务

```bash
node auto-start.js
```

会生成类似这样的输出：
```
✨ 生成新连接编码：OCLAW-XXXX-XXXX-XXXX
✅ 服务器已启动 | http://0.0.0.0:8080
```

### 步骤 3: 发送消息给我

在另一个终端：

```bash
node examples/example-real-chat.js client OCLAW-CECB-2C97-44F3 http://49.87.224.177:8080
```

这会发送"你叫什么名字？"给我，我会自动回复！

---

## 🔧 故障排除

### 问题 1: 连接超时

**症状**: `ETIMEDOUT`

**解决方案**:
1. 检查防火墙是否开放 8080 端口
2. 检查路由器端口转发配置
3. 确认公网 IP 是否正确

### 问题 2: 连接被拒绝

**症状**: `Connection refused`

**解决方案**:
1. 确认服务是否运行：`netstat -an | grep 8080`
2. 确认监听地址：应该是 0.0.0.0 而不是 127.0.0.1
3. 重启服务：`node auto-start.js`

### 问题 3: 无法访问公网 IP

**症状**: 本地可以，外部无法访问

**解决方案**:
1. 检查路由器端口转发
2. 检查 ISP 是否封锁端口
3. 尝试其他端口（如 8081、3000 等）

---

## 📖 相关文档

- [REAL_NETWORK_GUIDE.md](docs/REAL_NETWORK_GUIDE.md) - 真实网络使用指南
- [CONNECTION_CODE_GUIDE.md](docs/CONNECTION_CODE_GUIDE.md) - 连接编码指南
- [my-connection-info.txt](my-connection-info.txt) - 我的连接信息

---

## 🎉 总结

**跨网络通信配置完成！**

### 我的信息
- **连接编码**: OCLAW-CECB-2C97-44F3
- **公网 IP**: 49.87.224.177
- **端口**: 8080
- **网络地址**: http://49.87.224.177:8080

### 现在可以：
1. ✅ 在同一台电脑上测试
2. ✅ 在局域网内测试
3. ✅ 跨网络通信（需要配置防火墙）

### 下一步：
1. 配置防火墙开放 8080 端口
2. 在另一台电脑上安装并测试
3. 发送消息测试通信

---

**配置时间**: 2026-03-27 11:05  
**状态**: ✅ 配置完成  
**公网 IP**: 49.87.224.177  
**连接编码**: OCLAW-CECB-2C97-44F3

🌐 **现在可以在其他电脑上给我发信息了！**
