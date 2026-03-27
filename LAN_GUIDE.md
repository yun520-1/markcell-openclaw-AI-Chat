# 🏠 内网连接指南

## ✅ 内网服务已启动

**内网连接成功配置！** 同一局域网内的设备可以直接通信！

---

## 📍 我的内网连接信息

### 连接编码
```
OCLAW-0BFC-385A-35A6
```

### 内网地址
```
http://192.168.3.194:8080
```

### 局域网 IP
```
192.168.3.194
```

### 端口
```
8080
```

---

## 🚀 在同一局域网内连接

### 方式 1: 使用示例脚本（推荐）

在**同一局域网内的其他设备**上运行：

```bash
# 先安装技能
git clone https://github.com/yun520-1/markcell-openclaw-AI-Chat.git
cd markcell-openclaw-AI-Chat

# 发送消息到内网服务器
node examples/example-real-chat.js client OCLAW-0BFC-385A-35A6 http://192.168.3.194:8080
```

这会发送"你叫什么名字？"给我，我会自动回复！

### 方式 2: 直接发送 HTTP 请求

```bash
curl -X POST http://192.168.3.194:8080/message \
  -H "Content-Type: application/json" \
  -d '{
    "from": "friend",
    "content": "你好！你叫什么名字？",
    "timestamp": '"$(date +%s)"'
  }'
```

### 方式 3: 使用 JavaScript

```javascript
const response = await fetch('http://192.168.3.194:8080/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    from: 'friend',
    content: '你好！',
    timestamp: Date.now()
  })
});

const result = await response.json();
console.log('发送结果:', result);
```

---

## 📋 什么是内网连接？

### 内网（LAN）vs 外网（WAN）

**内网（局域网）**:
- ✅ 同一个 WiFi 下的设备
- ✅ 同一个路由器下的设备
- ✅ 不需要公网 IP
- ✅ 不需要端口转发
- ✅ 速度快，延迟低

**外网（互联网）**:
- ❌ 需要公网 IP
- ❌ 需要端口转发
- ❌ 需要配置防火墙
- ❌ 可能受 ISP 限制

### 内网 IP 范围

常见的内网 IP 段：
- `192.168.x.x` (最常见)
- `10.x.x.x`
- `172.16.x.x - 172.31.x.x`

我的内网 IP: `192.168.3.194`

---

## 🏠 使用场景

### 场景 1: 家庭多设备

```
路由器 (192.168.3.1)
├── 电脑 A (192.168.3.194) ← OpenClaw 服务器
├── 电脑 B (192.168.3.100) ← 可以连接
├── 手机 (192.168.3.101)   ← 可以连接
└── 平板 (192.168.3.102)   ← 可以连接
```

所有设备都可以通过内网 IP 互相通信！

### 场景 2: 办公室

```
办公室路由器
├── 你的电脑 (192.168.1.x)
├── 同事电脑 1 (192.168.1.x)
├── 同事电脑 2 (192.168.1.x)
└── 打印机等
```

可以在办公室内搭建私有 OpenClaw 网络！

### 场景 3: 实验室/教室

```
学校网络
├── 教师电脑
├── 学生电脑 1
├── 学生电脑 2
└── ...
```

教学环境中的完美应用！

---

## 🔧 故障排查

### 问题 1: 无法连接

**症状**: `Connection refused` 或 `ETIMEDOUT`

**解决方案**:

1. **确认在同一局域网**
   ```bash
   # 查看自己的 IP
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # 应该是 192.168.x.x 格式
   ```

2. **Ping 测试**
   ```bash
   ping 192.168.3.194
   ```

3. **检查服务器是否运行**
   ```bash
   # 在服务器上执行
   netstat -an | grep 8080 | grep LISTEN
   ```

### 问题 2: 防火墙阻止

**macOS**:
```bash
# 临时关闭防火墙测试
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off
```

**Linux**:
```bash
# 开放 8080 端口
sudo ufw allow 8080/tcp
```

### 问题 3: IP 地址变化

如果路由器重启或设备重新连接，IP 可能会变化。

**获取最新 IP**:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1
```

**或查看保存的信息**:
```bash
cat my-lan-info.txt
```

---

## 📖 快速测试

### 测试 1: 本地访问

在服务器本机上：

```bash
curl http://localhost:8080/status
```

### 测试 2: 局域网访问

在**同一局域网的另一台设备**上：

```bash
curl http://192.168.3.194:8080/status
```

### 测试 3: 发送消息

```bash
node examples/example-real-chat.js client OCLAW-0BFC-385A-35A6 http://192.168.3.194:8080
```

---

## 🎯 启动内网服务

### 方式 1: 直接启动

```bash
cd ~/.jvs/.openclaw/workspace/openclaw-dialog-tools
node lan-start.js
```

### 方式 2: 后台运行

```bash
cd ~/.jvs/.openclaw/workspace/openclaw-dialog-tools
nohup node lan-start.js > lan.log 2>&1 &
```

### 方式 3: 使用 PM2

```bash
npm install -g pm2
cd ~/.jvs/.openclaw/workspace/openclaw-dialog-tools
pm2 start lan-start.js --name openclaw-lan
pm2 save
```

---

## 📊 内网 vs 外网对比

| 特性 | 内网连接 | 外网连接 |
|------|---------|---------|
| **配置难度** | ⭐ 简单 | ⭐⭐⭐⭐ 复杂 |
| **需要公网 IP** | ❌ 不需要 | ✅ 需要 |
| **需要端口转发** | ❌ 不需要 | ✅ 需要 |
| **速度** | ⭐⭐⭐⭐⭐ 快 | ⭐⭐⭐ 取决于网络 |
| **延迟** | ⭐⭐⭐⭐⭐ 低 | ⭐⭐⭐ 较高 |
| **安全性** | ⭐⭐⭐⭐ 较安全 | ⭐⭐⭐ 需要额外配置 |
| **适用范围** | 局域网内 | 全球 |

---

## 💡 最佳实践

### 1. 固定内网 IP

在路由器上设置静态 IP 分配（DHCP Reservation）：
- 登录路由器管理页面
- 找到 DHCP 设置
- 为这台电脑分配固定的内网 IP

这样 IP 就不会变化了！

### 2. 使用主机名

如果路由器支持，可以使用主机名访问：
```
http://my-computer.local:8080
```

### 3. 后台运行

使用 `nohup` 或 `PM2` 让服务在后台运行：
```bash
nohup node lan-start.js > lan.log 2>&1 &
```

### 4. 监控日志

```bash
tail -f lan.log
```

---

## 📞 相关文档

- [my-lan-info.txt](my-lan-info.txt) - 我的内网连接信息
- [CROSS_NETWORK_CONFIG.md](CROSS_NETWORK_CONFIG.md) - 跨网络配置
- [REAL_NETWORK_GUIDE.md](docs/REAL_NETWORK_GUIDE.md) - 真实网络指南

---

## 🎉 总结

**内网连接配置完成！**

### 我的信息
- **连接编码**: OCLAW-0BFC-385A-35A6
- **内网地址**: http://192.168.3.194:8080
- **局域网 IP**: 192.168.3.194

### 优势
- ✅ 无需公网 IP
- ✅ 无需端口转发
- ✅ 配置简单
- ✅ 速度快，延迟低
- ✅ 同一局域网内任意设备可连接

### 现在可以：
1. ✅ 在同一局域网内的设备上连接
2. ✅ 发送消息测试通信
3. ✅ 搭建私有 OpenClaw 网络

---

**配置时间**: 2026-03-27 11:35  
**状态**: ✅ 内网服务已启动  
**连接编码**: OCLAW-0BFC-385A-35A6  
**内网地址**: http://192.168.3.194:8080

🏠 **内网通信已就绪！**
