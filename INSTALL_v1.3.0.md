# 📥 安装 v1.3.0 更新指南

## 🎉 新版本特性

**v1.3.0** - 内网双向对话，智能回复！

### 新增功能
- ✅ 内网双向对话 - 两个 OpenClaw 实例可以完整对话
- ✅ 智能回复 - 自动响应各种消息
- ✅ 对话历史 - 保存最近 20 条对话
- ✅ 上下文感知 - 基于历史智能回复

---

## 🚀 快速安装

### 方式 1: Git Pull（推荐）⭐

**如果已经安装过**:

```bash
# 进入安装目录
cd ~/.jvs/.openclaw/workspace/markcell-openclaw-AI-Chat

# 拉取最新代码
git pull origin main
```

**输出**:
```
remote: Enumerating objects: 21, done.
remote: Counting objects: 100% (21/21), done.
remote: Total 21 (delta 15), reused 0 (delta 0)
Unpacking objects: 100% (21/21), 1.23 MiB | 2.34 MiB/s, done.
From https://github.com/yun520-1/markcell-openclaw-AI-Chat
   aa5dfa6..421bdaf  main     -> origin/main
Updating aa5dfa6..421bdaf
Fast-forward
 lan-chat.js              | 258 ++++++++++++
 LAN_CHAT_GUIDE.md        | 113 ++++++
 LAN_CHAT_COMPLETE.md     | 89 ++++
 ... (more files)
 21 files changed, 3629 insertions(+), 15 deletions(-)
```

### 方式 2: 重新克隆

**如果是第一次安装**:

```bash
# 克隆仓库
git clone https://github.com/yun520-1/markcell-openclaw-AI-Chat.git
cd markcell-openclaw-AI-Chat
```

---

## 📋 验证安装

### 检查版本

```bash
cat package.json | grep version
```

**应该显示**:
```json
"version": "1.3.0"
```

### 检查新文件

```bash
ls -la lan-chat.js LAN_CHAT_GUIDE.md
```

**应该存在**:
```
-rwxr-xr-x  lan-chat.js
-rw-r--r--  LAN_CHAT_GUIDE.md
```

### 运行测试

```bash
node test-all.js
```

**预期输出**:
```
✅ 通过：26
❌ 失败：0
📈 通过率：100.0%
```

---

## 💬 使用内网对话功能

### 步骤 1: 启动内网对话服务

```bash
node lan-chat.js
```

**输出**:
```
========================================
💬 OpenClaw 内网对话服务
========================================

📍 连接编码：OCLAW-XXXX-XXXX-XXXX
📍 局域网 IP: 192.168.x.x
📍 内网地址：http://192.168.3.x:8080

✅ 内网对话服务已启动，等待连接...

💡 功能:
  - 自动接收内网消息
  - 智能回复消息
  - 保存对话历史
```

### 步骤 2: 在另一台设备上也启动

在**同一局域网内的另一台设备**上执行相同操作：

```bash
git clone https://github.com/yun520-1/markcell-openclaw-AI-Chat.git
cd markcell-openclaw-AI-Chat
node lan-chat.js
```

### 步骤 3: 测试对话

在**设备 B**上打开新终端：

```bash
node examples/example-real-chat.js client <设备 A 的编码> http://<设备 A 的 IP>:8080
```

**对话示例**:
```
📤 发送：你叫什么名字？
📥 收到回复：我是 markcell-openclaw-AI Chat 内网对话服务！
```

---

## 🔧 故障排查

### 问题 1: Git Pull 失败

**症状**: `error: Your local changes to the following files would be overwritten`

**解决方案**:
```bash
# 保存本地修改（如果需要）
git stash

# 拉取更新
git pull origin main

# 恢复本地修改（如果需要）
git stash pop
```

### 问题 2: 端口被占用

**症状**: `Error: listen EADDRINUSE: address already in use 0.0.0.0:8080`

**解决方案**:
```bash
# 找到占用端口的进程
lsof -i :8080

# 杀死进程
kill -9 <PID>

# 或者修改端口
# 编辑 lan-chat.js，修改 port: 8080 为 port: 8081
```

### 问题 3: 无法找到模块

**症状**: `Cannot find module 'xxx'`

**解决方案**:
```bash
# 检查是否在正确的目录
cd ~/.jvs/.openclaw/workspace/markcell-openclaw-AI-Chat

# 重新安装（如果需要）
git pull origin main
```

---

## 📊 更新内容

### 新增文件（21 个）

| 文件 | 说明 |
|------|------|
| `lan-chat.js` | 内网对话服务（258 行） |
| `lan-start.js` | 内网连接服务 |
| `LAN_CHAT_GUIDE.md` | 内网对话指南 |
| `LAN_CHAT_COMPLETE.md` | 实现报告 |
| `LAN_GUIDE.md` | 内网连接指南 |
| `LAN_IMPLEMENTATION_COMPLETE.md` | 实现总结 |
| `LAN_2MIN_TEST_REPORT.md` | 2 分钟测试报告 |
| `LAN_MESSAGE_TEST_REPORT.md` | 消息测试报告 |
| `examples/send-lan-message.js` | 内网消息发送示例 |
| `examples/send-message-to-target.js` | 目标消息发送示例 |
| ... | 更多文档和示例 |

### 更新文件

| 文件 | 更新内容 |
|------|---------|
| `README.md` | 添加 v1.3.0 特性说明 |
| `package.json` | 版本更新到 1.3.0，添加 lan 脚本 |

---

## 🎯 快速参考

### 安装命令
```bash
cd ~/.jvs/.openclaw/workspace/markcell-openclaw-AI-Chat
git pull origin main
```

### 启动内网对话
```bash
node lan-chat.js
```

### 查看连接信息
```bash
cat lan-chat-info.txt
```

### 测试对话
```bash
node examples/example-real-chat.js client <编码> http://<IP>:8080
```

---

## 📖 相关文档

- [RELEASE_v1.3.0.md](RELEASE_v1.3.0.md) - v1.3.0 发布说明
- [LAN_CHAT_GUIDE.md](LAN_CHAT_GUIDE.md) - 内网对话完整指南
- [README.md](README.md) - 项目说明
- [QUICKSTART.md](QUICKSTART.md) - 快速开始

---

## 🎉 总结

**v1.3.0 安装完成！**

### 已实现功能
- ✅ 内网双向对话
- ✅ 智能回复
- ✅ 对话历史
- ✅ 上下文感知

### 现在可以
1. ✅ 在两台设备上启动内网对话
2. ✅ 互相发送消息
3. ✅ 自动智能回复
4. ✅ 保存对话历史

---

**更新时间**: 2026-03-27 12:18  
**版本**: v1.3.0  
**状态**: ✅ 安装完成

🎉 **现在可以在内网中进行完整的双向对话了！**
