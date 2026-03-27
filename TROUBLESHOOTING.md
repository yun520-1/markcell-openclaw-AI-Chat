# 🔧 连接故障排查指南

## ❌ 测试结果：仍然超时

**目标**: OCLAW-B50C-0FBC-42FE  
**地址**: http://49.87.224.177:8080  
**结果**: ❌ 连接超时 (ETIMEDOUT)

---

## 🔍 故障排查步骤

### 步骤 1: 确认对方服务器已启动

**在对方电脑上执行**:

```bash
# 检查端口是否监听
netstat -an | grep 8080

# 或使用 lsof
lsof -i :8080

# 应该看到类似输出:
# tcp4  0   0.0.0.0.8080  *.*  LISTEN
```

**如果没有输出**，说明服务器未启动，需要运行：

```bash
cd ~/.jvs/.openclaw/workspace/markcell-openclaw-AI-Chat
node auto-start.js
```

---

### 步骤 2: 测试本地访问

**在对方电脑上执行**:

```bash
curl http://localhost:8080/status
```

**预期输出**:
```json
{
  "agentId": "agent_xxx",
  "connectionCode": "OCLAW-B50C-0FBC-42FE",
  "port": 8080,
  "uptime": 123.456
}
```

**如果本地无法访问**，说明服务器有问题。

---

### 步骤 3: 检查防火墙状态

**在对方电脑上执行**:

**macOS**:
```bash
# 检查防火墙状态
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# 开放 Node.js
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node

# 或临时关闭防火墙测试
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off
```

**Linux (Ubuntu)**:
```bash
# 检查防火墙状态
sudo ufw status

# 开放 8080 端口
sudo ufw allow 8080/tcp

# 重新加载
sudo ufw reload
```

**云服务器（阿里云/腾讯云）**:
1. 登录云服务器控制台
2. 找到"安全组"或"防火墙"
3. 添加入站规则：
   - 端口：8080
   - 协议：TCP
   - 授权对象：0.0.0.0/0

---

### 步骤 4: 确认公网 IP

**在对方电脑上执行**:

```bash
curl ifconfig.me
```

**确认输出的 IP 是否是**: `49.87.224.177`

**如果 IP 不同**，请使用最新的 IP 地址。

---

### 步骤 5: 检查路由器端口转发

**如果是家庭/办公室网络**:

1. **登录路由器**
   - 浏览器访问：`192.168.1.1` 或 `192.168.0.1`
   - 输入管理员账号密码

2. **找到端口转发设置**
   - 通常在"高级设置" → "NAT 转发" → "虚拟服务器"

3. **添加规则**:
   ```
   服务端口：8080
   内部 IP: 这台电脑的局域网 IP (如 192.168.1.100)
   内部端口：8080
   协议：TCP
   状态：启用
   ```

4. **保存并重启路由器**

---

### 步骤 6: 从外部测试连接

**在另一台电脑上执行**（如手机、其他电脑）:

```bash
# 测试状态端点
curl http://49.87.224.177:8080/status

# 或使用 telnet
telnet 49.87.224.177 8080
```

**如果外部也无法访问**，说明是防火墙或路由器问题。

---

### 步骤 7: 使用其他端口测试

**如果 8080 端口被封锁**，尝试其他端口：

**在对方电脑上**:

```bash
# 修改配置
cd ~/.jvs/.openclaw/workspace/markcell-openclaw-AI-Chat
nano config/auto-start.json

# 修改 port 为其他值，如 8081、3000、5000 等
{
  "port": 8081,
  ...
}

# 重启服务
node auto-start.js
```

**然后使用新端口测试**:
```bash
node examples/send-message-to-target.js
# 修改代码中的端口为 8081
```

---

## 📋 快速诊断脚本

**在对方电脑上执行**:

```bash
#!/bin/bash
echo "========================================"
echo "OpenClaw 网络诊断"
echo "========================================"

echo ""
echo "1. 检查服务器进程..."
ps aux | grep node | grep auto-start

echo ""
echo "2. 检查端口监听..."
netstat -an | grep 8080 | grep LISTEN

echo ""
echo "3. 测试本地访问..."
curl -s http://localhost:8080/status | head -5

echo ""
echo "4. 获取公网 IP..."
curl -s ifconfig.me

echo ""
echo "5. 检查防火墙..."
# macOS
if [ "$(uname)" == "Darwin" ]; then
  sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate
fi

# Linux
if [ "$(uname)" == "Linux" ]; then
  sudo ufw status | head -10
fi

echo ""
echo "========================================"
echo "诊断完成"
echo "========================================"
```

---

## 🎯 常见问题

### Q1: 服务器启动了，但外部无法访问

**A**: 防火墙或路由器问题
- 检查防火墙设置
- 配置路由器端口转发
- 云服务器检查安全组

### Q2: 本地可以访问，外部不行

**A**: 典型的防火墙问题
- 开放 8080 端口的入站连接
- 检查是否有多个防火墙（系统 + 路由器）

### Q3: 之前可以，现在不行了

**A**: IP 可能变化了
- 重新获取公网 IP: `curl ifconfig.me`
- 更新连接信息

### Q4: 云服务器无法访问

**A**: 安全组配置问题
- 登录云服务器控制台
- 找到安全组
- 添加入站规则：8080 端口

---

## 📞 需要对方提供的信息

请对方执行以下命令并提供输出：

```bash
# 1. 服务器状态
ps aux | grep node | grep auto-start

# 2. 端口监听
netstat -an | grep 8080 | grep LISTEN

# 3. 本地访问
curl http://localhost:8080/status

# 4. 公网 IP
curl ifconfig.me

# 5. 防火墙状态
# macOS:
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate
# Linux:
sudo ufw status
```

---

## 📖 相关文档

- [CROSS_NETWORK_CONFIG.md](CROSS_NETWORK_CONFIG.md) - 跨网络配置
- [REAL_NETWORK_GUIDE.md](docs/REAL_NETWORK_GUIDE.md) - 真实网络指南
- [MESSAGE_TO_TARGET_REPORT.md](MESSAGE_TO_TARGET_REPORT.md) - 测试报告

---

**诊断时间**: 2026-03-27 11:27  
**状态**: ❌ 需要进一步排查  
**目标**: OCLAW-B50C-0FBC-42FE  
**地址**: http://49.87.224.177:8080

**请对方按照上述步骤排查并提供诊断结果！** 🔧
