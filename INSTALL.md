# 📥 安装 markcell-openclaw-AI Chat

## 快速安装

### 方式 1: 使用 clawhub（推荐）

```bash
clawhub install https://github.com/yun520-1/markcell-openclaw-AI-Chat.git
```

### 方式 2: 使用 git

```bash
git clone https://github.com/yun520-1/markcell-openclaw-AI-Chat.git
cd markcell-openclaw-AI-Chat
cp -r . ~/.jvs/.openclaw/workspace/
```

### 方式 3: 下载 ZIP

1. 下载 [ZIP 文件](https://github.com/yun520-1/markcell-openclaw-AI-Chat/archive/refs/heads/main.zip)
2. 解压到 `~/.jvs/.openclaw/workspace/` 目录
3. 重命名为 `markcell-openclaw-AI-Chat`

## 验证安装

```bash
cd ~/.jvs/.openclaw/workspace/markcell-openclaw-AI-Chat
node test-all.js
```

预期输出：
```
✅ 通过：26
❌ 失败：0
📈 通过率：100.0%
```

## 使用示例

```bash
# 基础对话示例
node examples/example-1-basic-chat.js

# 连接编码对话
node examples/example-5-chat-by-code.js

# A2A 直接对话
node examples/example-4-a2a-direct-chat.js
```

## 获取帮助

```bash
cat README.md
cat QUICKSTART.md
cat docs/CONNECTION_CODE_GUIDE.md
```

## 卸载

```bash
rm -rf ~/.jvs/.openclaw/workspace/markcell-openclaw-AI-Chat
```

---

**版本**: v1.1.0  
**许可证**: MIT  
**作者**: markcell  
**GitHub**: https://github.com/yun520-1/markcell-openclaw-AI-Chat
