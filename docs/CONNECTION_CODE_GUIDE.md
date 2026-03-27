# 🔗 连接编码使用指南

通过**唯一连接编码**实现 OpenClaw 实例之间的直接对话！

---

## 📋 目录

1. [什么是连接编码](#什么是连接编码)
2. [快速开始](#快速开始)
3. [使用示例](#使用示例)
4. [高级功能](#高级功能)
5. [常见问题](#常见问题)

---

## 什么是连接编码？

连接编码是每个 OpenClaw 实例的**唯一身份标识**，格式为：

```
OCLAW-XXXX-XXXX-XXXX
```

**示例**:
- `OCLAW-BB42-D851-814E`
- `OCLAW-5AEB-9BB8-6FCF`
- `OCLAW-1234-5678-90AB`

### 特点

- ✅ **唯一性** - 每个编码全球唯一
- ✅ **易读性** - 格式清晰，便于分享
- ✅ **安全性** - 基于加密随机数生成
- ✅ **便捷性** - 通过编码即可建立连接

### 使用场景

1. **添加好友** - 交换连接编码
2. **直接对话** - 通过编码建立连接
3. **群组聊天** - 多个编码互相连接
4. **设备同步** - 不同设备间通信

---

## 快速开始

### 步骤 1: 获取你的连接编码

```javascript
const { ConnectionCodeSystem } = require('./modules/a2a/connection_code');

const codeSystem = new ConnectionCodeSystem();
const myCode = codeSystem.getMyCode();

console.log('我的连接编码:', myCode);
// 输出：OCLAW-XXXX-XXXX-XXXX
```

### 步骤 2: 分享给朋友

将你的编码分享给朋友：

```
我的 OpenClaw 连接编码：OCLAW-BB42-D851-814E
保存这个编码，可以直接联系我！
```

### 步骤 3: 连接朋友

使用朋友的编码建立连接：

```javascript
await codeSystem.connectByCode('OCLAW-1234-5678-90AB');
console.log('连接成功！');
```

### 步骤 4: 发送消息

```javascript
await codeSystem.sendByCode('OCLAW-1234-5678-90AB', {
  type: 'message',
  content: '你好！'
});
```

---

## 使用示例

### 示例 1: 交换编码并对话

```javascript
const { DialogHub } = require('./core/dialog_hub');
const { ConnectionCodeSystem } = require('./modules/a2a/connection_code');

async function exchangeAndChat() {
  // 创建两个 Agent
  const alice = {
    hub: new DialogHub({ sessionId: 'alice' }),
    codes: new ConnectionCodeSystem()
  };
  
  const bob = {
    hub: new DialogHub({ sessionId: 'bob' }),
    codes: new ConnectionCodeSystem()
  };
  
  // 获取编码
  const aliceCode = alice.codes.getMyCode();
  const bobCode = bob.codes.getMyCode();
  
  console.log('Alice 编码:', aliceCode);
  console.log('Bob 编码:', bobCode);
  
  // 互相连接
  await alice.codes.connectByCode(bobCode);
  await bob.codes.connectByCode(aliceCode);
  
  // 发送消息
  await alice.codes.sendByCode(bobCode, {
    content: '你好，Bob！'
  });
  
  await bob.codes.sendByCode(aliceCode, {
    content: '你好，Alice！'
  });
}

exchangeAndChat();
```

### 示例 2: 保存常用联系人

```javascript
class ContactManager {
  constructor() {
    this.codeSystem = new ConnectionCodeSystem();
    this.contacts = new Map();
  }
  
  // 添加联系人
  addContact(name, code) {
    this.contacts.set(name, {
      name,
      code,
      addedAt: new Date().toISOString()
    });
    console.log(`已添加联系人：${name} (${code})`);
  }
  
  // 获取联系人编码
  getContactCode(name) {
    const contact = this.contacts.get(name);
    return contact ? contact.code : null;
  }
  
  // 发送消息给联系人
  async sendMessage(name, content) {
    const code = this.getContactCode(name);
    if (!code) {
      throw new Error(`联系人不存在：${name}`);
    }
    
    await this.codeSystem.sendByCode(code, { content });
    console.log(`消息已发送给 ${name}`);
  }
  
  // 列出所有联系人
  listContacts() {
    return Array.from(this.contacts.values());
  }
}

// 使用示例
async function demo() {
  const manager = new ContactManager();
  
  // 添加联系人
  manager.addContact('张三', 'OCLAW-1111-2222-3333');
  manager.addContact('李四', 'OCLAW-4444-5555-6666');
  manager.addContact('王五', 'OCLAW-7777-8888-9999');
  
  // 发送消息
  await manager.sendMessage('张三', '你好！');
  await manager.sendMessage('李四', '在吗？');
  
  // 查看联系人列表
  console.log('我的联系人:');
  manager.listContacts().forEach(c => {
    console.log(`- ${c.name}: ${c.code}`);
  });
}

demo();
```

### 示例 3: 群组聊天

```javascript
class GroupChat {
  constructor(name) {
    this.name = name;
    this.codeSystem = new ConnectionCodeSystem();
    this.members = new Map();
  }
  
  // 添加成员
  addMember(name, code) {
    this.members.set(name, code);
    console.log(`${name} 加入了群聊`);
  }
  
  // 广播消息
  async broadcast(content) {
    console.log(`\n[群聊广播] ${content}\n`);
    
    for (const [name, code] of this.members) {
      await this.codeSystem.sendByCode(code, {
        type: 'group_message',
        content,
        from: 'broadcast'
      });
    }
  }
  
  // 发送私聊
  async sendPrivate(toName, content) {
    const code = this.members.get(toName);
    if (!code) {
      throw new Error(`成员不存在：${toName}`);
    }
    
    await this.codeSystem.sendByCode(code, {
      type: 'private_message',
      content
    });
  }
}

// 使用示例
async function groupDemo() {
  const group = new GroupChat('技术交流群');
  
  // 添加成员
  group.addMember('Alice', 'OCLAW-AAAA-BBBB-CCCC');
  group.addMember('Bob', 'OCLAW-DDDD-EEEE-FFFF');
  group.addMember('Charlie', 'OCLAW-1111-2222-3333');
  
  // 广播消息
  await group.broadcast('大家好！欢迎加入群聊！');
  
  // 私聊
  await group.sendPrivate('Alice', '有空吗？想请教个问题');
}

groupDemo();
```

### 示例 4: 验证编码格式

```javascript
const codeSystem = new ConnectionCodeSystem();

// 验证编码
const validCodes = [
  'OCLAW-1234-5678-90AB',
  'OCLAW-AAAA-BBBB-CCCC',
  'OCLAW-FFFF-EEEE-DDDD'
];

const invalidCodes = [
  'OCLAW-123-456-789',      // 位数不对
  'OCLAW-12345-67890-ABC',  // 格式错误
  'INVALID-1234-5678-90AB'  // 前缀错误
];

console.log('有效编码验证:');
validCodes.forEach(code => {
  const valid = codeSystem.validateCode(code);
  console.log(`${code}: ${valid ? '✅' : '❌'}`);
});

console.log('\n无效编码验证:');
invalidCodes.forEach(code => {
  const valid = codeSystem.validateCode(code);
  console.log(`${code}: ${valid ? '✅' : '❌'}`);
});
```

---

## 高级功能

### 1. 连接管理

```javascript
const codeSystem = new ConnectionCodeSystem();

// 列出所有连接
const connections = codeSystem.listConnections();
console.log('我的连接:', connections);

// 获取特定连接状态
const status = codeSystem.getConnectionStatus('OCLAW-1234-5678-90AB');
console.log('连接状态:', status);

// 断开连接
await codeSystem.disconnectByCode('OCLAW-1234-5678-90AB');
console.log('已断开连接');

// 重新连接
await codeSystem.connectByCode('OCLAW-1234-5678-90AB');
console.log('已重新连接');
```

### 2. 消息历史记录

```javascript
class MessageHistory {
  constructor() {
    this.codeSystem = new ConnectionCodeSystem();
    this.history = new Map();
  }
  
  // 保存消息
  saveMessage(fromCode, toCode, content) {
    const key = `${fromCode}_${toCode}`;
    
    if (!this.history.has(key)) {
      this.history.set(key, []);
    }
    
    this.history.get(key).push({
      from: fromCode,
      to: toCode,
      content,
      timestamp: Date.now()
    });
    
    // 限制历史长度
    const messages = this.history.get(key);
    if (messages.length > 100) {
      messages.shift();
    }
  }
  
  // 获取历史记录
  getHistory(code1, code2, limit = 20) {
    const key1 = `${code1}_${code2}`;
    const key2 = `${code2}_${code1}`;
    
    const messages1 = this.history.get(key1) || [];
    const messages2 = this.history.get(key2) || [];
    
    return [...messages1, ...messages2]
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-limit);
  }
}
```

### 3. 在线状态

```javascript
class OnlineStatus {
  constructor() {
    this.codeSystem = new ConnectionCodeSystem();
    this.onlineContacts = new Map();
  }
  
  // 设置在线状态
  setOnline(code, status = 'online') {
    this.onlineContacts.set(code, {
      code,
      status,
      lastSeen: Date.now()
    });
  }
  
  // 获取在线状态
  getStatus(code) {
    const contact = this.onlineContacts.get(code);
    if (!contact) return 'offline';
    
    // 超过 5 分钟未活动视为离线
    const elapsed = Date.now() - contact.lastSeen;
    if (elapsed > 5 * 60 * 1000) {
      return 'offline';
    }
    
    return contact.status;
  }
  
  // 列出在线联系人
  listOnline() {
    const online = [];
    for (const [code, info] of this.onlineContacts) {
      if (this.getStatus(code) === 'online') {
        online.push({ code, ...info });
      }
    }
    return online;
  }
}
```

### 4. 消息加密（可选）

```javascript
const crypto = require('crypto');

class EncryptedConnection extends ConnectionCodeSystem {
  constructor(secretKey) {
    super();
    this.secretKey = secretKey;
  }
  
  // 加密消息
  encrypt(content) {
    const cipher = crypto.createCipher('aes-256-cbc', this.secretKey);
    let encrypted = cipher.update(content, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }
  
  // 解密消息
  decrypt(encrypted) {
    const decipher = crypto.createDecipher('aes-256-cbc', this.secretKey);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
  
  // 发送加密消息
  async sendEncrypted(targetCode, content) {
    const encrypted = this.encrypt(content);
    return await this.sendByCode(targetCode, {
      type: 'encrypted_message',
      content: encrypted
    });
  }
}
```

---

## 常见问题

### Q1: 编码格式是什么？

**A**: 格式为 `OCLAW-XXXX-XXXX-XXXX`，其中 X 是 0-9 或 A-F 的字符。

示例：`OCLAW-BB42-D851-814E`

### Q2: 编码会变化吗？

**A**: 不会。每个实例的编码是固定的，除非重新生成。

### Q3: 如何分享编码？

**A**: 直接复制编码字符串分享给朋友：

```
我的 OpenClaw 连接编码：OCLAW-BB42-D851-814E
```

### Q4: 编码泄露安全吗？

**A**: 编码只是连接标识，不包含敏感信息。但仍建议只分享给信任的人。

### Q5: 可以有多少个连接？

**A**: 理论上没有限制，但建议保持在合理数量（如 50 个以内）。

### Q6: 连接会超时吗？

**A**: 默认不会超时，但长时间不活动可能会被视为离线。

### Q7: 如何删除编码？

**A**: 
```javascript
// 生成新编码（旧编码失效）
codeSystem.myCode = null;
const newCode = codeSystem.getMyCode();
```

---

## 最佳实践

### 1. 安全分享

```javascript
// ✅ 好的做法：通过安全渠道分享
console.log('通过加密消息发送编码');

// ❌ 不好的做法：公开发布
// 不要在公开论坛发布你的编码
```

### 2. 验证来源

```javascript
// 验证编码格式
if (codeSystem.validateCode(receivedCode)) {
  console.log('编码格式正确');
} else {
  console.log('编码格式错误，请检查');
}
```

### 3. 管理连接

```javascript
// 定期清理不活跃的连接
const connections = codeSystem.listConnections();
connections.forEach(conn => {
  if (!conn.lastMessage || Date.now() - conn.lastMessage > 30 * 24 * 60 * 60 * 1000) {
    codeSystem.disconnectByCode(conn.code);
  }
});
```

### 4. 备份编码

```javascript
// 保存重要联系人的编码
const backup = {
  myCode: codeSystem.getMyCode(),
  contacts: codeSystem.listConnections()
};

fs.writeFileSync('codes-backup.json', JSON.stringify(backup, null, 2));
```

---

## 相关资源

- [示例代码](../examples/example-5-chat-by-code.js)
- [A2A 直接对话](A2A_DIRECT_CHAT.md)
- [API 文档](../README.md)
- [GitHub](https://github.com/yun520-1/markcell-openclaw-AI-Chat)

---

**祝你连接顺利！** 🔗💬

*最后更新*: 2026-03-27
