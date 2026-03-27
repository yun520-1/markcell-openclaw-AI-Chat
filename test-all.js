/**
 * 综合测试脚本 - 测试所有模块的功能
 * 
 * 测试项目：
 * 1. DialogHub - 对话中心
 * 2. SessionManager - 会话管理
 * 3. SkillRegistry - 技能注册
 * 4. A2AModule - 多 Agent 协作
 */

const { DialogHub } = require('./core/dialog_hub');
const { SessionManager } = require('./core/session_manager');
const { SkillRegistry } = require('./skills/skill_registry');
const { A2AModule } = require('./modules/a2a/agent_protocol');

const fs = require('fs');
const path = require('path');

// 测试结果统计
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function test(name, fn) {
  try {
    fn();
    testResults.passed++;
    testResults.tests.push({ name, status: '✅ PASS' });
    console.log(`✅ ${name}`);
    return true;
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({ name, status: '❌ FAIL', error: error.message });
    console.log(`❌ ${name}`);
    console.log(`   错误：${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('========================================');
  console.log('OpenClaw 对话工具系统 - 综合测试');
  console.log('========================================\n');
  
  // ========== 测试 1: DialogHub ==========
  console.log('📦 测试模块 1: DialogHub（对话中心）');
  console.log('----------------------------------------');
  
  test('DialogHub - 初始化', () => {
    const hub = new DialogHub({ sessionId: 'test-001', mode: 'h2ai' });
    if (!hub.sessionId) throw new Error('sessionId 不存在');
    if (hub.mode !== 'h2ai') throw new Error('mode 设置失败');
  });
  
  test('DialogHub - 注册技能', () => {
    const hub = new DialogHub();
    hub.registerSkill('test', async () => 'test', { category: 'test' });
    const skills = hub.listSkills();
    if (skills.length === 0) throw new Error('技能注册失败');
  });
  
  test('DialogHub - 处理请求', async () => {
    const hub = new DialogHub();
    hub.registerSkill('echo', async (content) => `Echo: ${content}`, { category: 'test' });
    const response = await hub.processRequest({
      type: 'message',
      content: 'hello'
    });
    if (!response.includes('Echo')) throw new Error('请求处理失败');
  });
  
  test('DialogHub - 上下文管理', () => {
    const hub = new DialogHub();
    hub.addToContext({ role: 'user', content: 'test1' });
    hub.addToContext({ role: 'assistant', content: 'test2' });
    const context = hub.getContext();
    if (context.length !== 2) throw new Error('上下文管理失败');
  });
  
  test('DialogHub - 导出会话', () => {
    const hub = new DialogHub({ sessionId: 'export-test' });
    hub.addToContext({ role: 'user', content: 'test' });
    const exported = hub.exportSession();
    if (!exported.sessionId) throw new Error('导出失败');
    if (exported.context.length === 0) throw new Error('上下文未导出');
  });
  
  console.log('');
  
  // ========== 测试 2: SessionManager ==========
  console.log('📦 测试模块 2: SessionManager（会话管理）');
  console.log('----------------------------------------');
  
  const testSessionPath = path.join(__dirname, 'test-sessions');
  
  test('SessionManager - 初始化', () => {
    const mgr = new SessionManager({ storagePath: testSessionPath });
    if (!mgr.storagePath) throw new Error('storagePath 不存在');
  });
  
  test('SessionManager - 创建会话', () => {
    const mgr = new SessionManager({ storagePath: testSessionPath });
    const session = mgr.createSession('session-test-001', { test: true });
    if (!session.sessionId) throw new Error('创建会话失败');
    if (session.state !== 'active') throw new Error('会话状态错误');
  });
  
  test('SessionManager - 添加消息', () => {
    const mgr = new SessionManager({ storagePath: testSessionPath });
    mgr.createSession('session-test-002');
    mgr.addMessage('session-test-002', { role: 'user', content: 'hello' });
    const session = mgr.getSession('session-test-002');
    if (session.context.length !== 1) throw new Error('添加消息失败');
  });
  
  test('SessionManager - 保存会话', () => {
    const mgr = new SessionManager({ storagePath: testSessionPath });
    mgr.createSession('session-test-003');
    mgr.addMessage('session-test-003', { role: 'user', content: 'test' });
    const saved = mgr.saveSession('session-test-003');
    if (!saved) throw new Error('保存失败');
    
    // 检查文件是否存在
    const filePath = path.join(testSessionPath, 'session-test-003.json');
    if (!fs.existsSync(filePath)) throw new Error('文件未创建');
  });
  
  test('SessionManager - 加载会话', () => {
    const mgr = new SessionManager({ storagePath: testSessionPath });
    mgr.createSession('session-test-004');
    mgr.addMessage('session-test-004', { role: 'user', content: 'persist' });
    mgr.saveSession('session-test-004');
    
    const loaded = mgr.getSession('session-test-004');
    if (!loaded) throw new Error('加载失败');
    if (loaded.context.length === 0) throw new Error('上下文未加载');
  });
  
  test('SessionManager - 列出会话', () => {
    const mgr = new SessionManager({ storagePath: testSessionPath });
    mgr.createSession('session-test-005');
    const sessions = mgr.listActiveSessions();
    if (!Array.isArray(sessions)) throw new Error('返回类型错误');
  });
  
  test('SessionManager - 统计信息', () => {
    const mgr = new SessionManager({ storagePath: testSessionPath });
    const stats = mgr.getStats();
    if (stats.activeSessions === undefined) throw new Error('统计信息缺失 activeSessions');
    if (!stats.timestamp) throw new Error('统计信息缺失 timestamp');
  });
  
  console.log('');
  
  // ========== 测试 3: SkillRegistry ==========
  console.log('📦 测试模块 3: SkillRegistry（技能注册）');
  console.log('----------------------------------------');
  
  test('SkillRegistry - 初始化', () => {
    const registry = new SkillRegistry();
    if (!registry.skillsPath) throw new Error('skillsPath 不存在');
  });
  
  test('SkillRegistry - 注册技能', () => {
    const registry = new SkillRegistry();
    registry.register({
      name: 'test-skill',
      handler: async () => 'test',
      metadata: { category: 'test', tags: ['demo'] }
    });
    const skill = registry.getSkill('test-skill');
    if (!skill) throw new Error('注册失败');
  });
  
  test('SkillRegistry - 列出技能', () => {
    const registry = new SkillRegistry();
    registry.register({
      name: 'test-skill-2',
      handler: async () => 'test',
      metadata: { category: 'test2' }
    });
    const skills = registry.listSkills();
    if (!Array.isArray(skills)) throw new Error('返回类型错误');
  });
  
  test('SkillRegistry - 按分类列出', () => {
    const registry = new SkillRegistry();
    registry.register({
      name: 'cat-skill',
      handler: async () => 'test',
      metadata: { category: 'category-test' }
    });
    const byCategory = registry.listByCategory();
    if (typeof byCategory !== 'object') throw new Error('返回类型错误');
  });
  
  test('SkillRegistry - 搜索技能', () => {
    const registry = new SkillRegistry();
    registry.register({
      name: 'search-test',
      description: '这是一个测试技能',
      handler: async () => 'test',
      metadata: { category: 'search', tags: ['测试'] }
    });
    const results = registry.searchSkills('测试');
    if (!Array.isArray(results)) throw new Error('返回类型错误');
  });
  
  test('SkillRegistry - 启用/禁用技能', () => {
    const registry = new SkillRegistry();
    registry.register({
      name: 'toggle-skill',
      handler: async () => 'test',
      metadata: { category: 'toggle' }
    });
    registry.toggleSkill('toggle-skill', false);
    const skill = registry.getSkill('toggle-skill');
    if (skill.enabled !== false) throw new Error('禁用失败');
  });
  
  test('SkillRegistry - 统计信息', () => {
    const registry = new SkillRegistry();
    registry.register({
      name: 'stats-skill',
      handler: async () => 'test',
      metadata: { category: 'stats', original: true }
    });
    const stats = registry.getStats();
    if (!stats.totalSkills) throw new Error('统计信息缺失');
    if (!stats.originalSkills) throw new Error('原创统计缺失');
  });
  
  console.log('');
  
  // ========== 测试 4: A2AModule ==========
  console.log('📦 测试模块 4: A2AModule（多 Agent 协作）');
  console.log('----------------------------------------');
  
  test('A2AModule - 初始化', () => {
    const agent = new A2AModule({ agentId: 'test-agent', role: 'worker' });
    if (!agent.agentId) throw new Error('agentId 不存在');
    if (agent.role !== 'worker') throw new Error('role 设置失败');
  });
  
  test('A2AModule - 注册对等 Agent', () => {
    const agent = new A2AModule({ agentId: 'test-agent-2' });
    agent.registerPeer('peer-001', { role: 'worker' });
    if (agent.peers.size !== 1) throw new Error('注册失败');
  });
  
  test('A2AModule - 创建任务', () => {
    const agent = new A2AModule({ agentId: 'test-agent-3', role: 'master' });
    const taskId = agent.createTask({
      description: '测试任务',
      priority: 'high'
    });
    if (!taskId) throw new Error('任务创建失败');
  });
  
  test('A2AModule - 获取任务状态', () => {
    const agent = new A2AModule({ agentId: 'test-agent-4', role: 'master' });
    const taskId = agent.createTask({ description: 'test' });
    const status = agent.getTaskStatus(taskId);
    if (!status) throw new Error('状态获取失败');
    if (!status.taskId) throw new Error('任务 ID 缺失');
  });
  
  test('A2AModule - 列出任务', () => {
    const agent = new A2AModule({ agentId: 'test-agent-5', role: 'master' });
    agent.createTask({ description: 'task1' });
    agent.createTask({ description: 'task2' });
    const tasks = agent.listTasks();
    if (!Array.isArray(tasks)) throw new Error('返回类型错误');
    if (tasks.length < 2) throw new Error('任务数量错误');
  });
  
  test('A2AModule - 能力匹配', () => {
    const agent = new A2AModule({ agentId: 'test-agent-6' });
    const match1 = agent.capabilitiesMatch(['a', 'b'], ['a', 'b', 'c']);
    const match2 = agent.capabilitiesMatch(['a', 'b'], ['a']);
    if (match1 !== true) throw new Error('匹配判断错误 1');
    if (match2 !== false) throw new Error('匹配判断错误 2');
  });
  
  test('A2AModule - 获取状态', () => {
    const agent = new A2AModule({ agentId: 'test-agent-7' });
    agent.registerPeer('peer-001');
    const status = agent.getStatus();
    if (!status.agentId) throw new Error('agentId 缺失');
    if (!status.peersCount) throw new Error('peersCount 缺失');
  });
  
  console.log('');
  
  // ========== 测试结果汇总 ==========
  console.log('========================================');
  console.log('测试结果汇总');
  console.log('========================================');
  console.log(`✅ 通过：${testResults.passed}`);
  console.log(`❌ 失败：${testResults.failed}`);
  console.log(`📊 总计：${testResults.passed + testResults.failed}`);
  console.log(`📈 通过率：${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  console.log('========================================');
  
  // 清理测试文件
  try {
    if (fs.existsSync(testSessionPath)) {
      fs.rmSync(testSessionPath, { recursive: true, force: true });
      console.log('🧹 已清理测试文件');
    }
  } catch (error) {
    console.log('⚠️  清理测试文件失败:', error.message);
  }
  
  console.log('');
  
  if (testResults.failed === 0) {
    console.log('🎉 所有测试通过！系统可用性良好！');
    return 0;
  } else {
    console.log('⚠️  部分测试失败，请检查错误信息');
    return 1;
  }
}

// 运行测试
runAllTests().then(code => {
  process.exit(code);
}).catch(error => {
  console.error('测试执行失败:', error);
  process.exit(1);
});
