/**
 * Skill Registry - 技能注册与发现系统
 * 
 * 功能：管理技能的注册、发现、加载、卸载
 * 原创声明：本代码为原创，无版权风险
 * 许可证：MIT
 */

const fs = require('fs');
const path = require('path');

class SkillRegistry {
  constructor(config = {}) {
    this.skillsPath = config.skillsPath || './skills';
    this.registry = new Map();
    this.categories = new Map();
    this.loadedSkills = new Map();
    
    // 确保技能目录存在
    this.ensureSkillsDir();
    
    console.log(`[SkillRegistry] 初始化完成 | 技能路径：${this.skillsPath}`);
  }

  /**
   * 确保技能目录存在
   */
  ensureSkillsDir() {
    if (!fs.existsSync(this.skillsPath)) {
      fs.mkdirSync(this.skillsPath, { recursive: true });
      console.log(`[SkillRegistry] 创建技能目录：${this.skillsPath}`);
    }
  }

  /**
   * 注册技能
   */
  register(skillDefinition) {
    const { name, version, description, handler, metadata = {} } = skillDefinition;

    if (!name || !handler) {
      throw new Error('技能注册失败：缺少 name 或 handler');
    }

    const skill = {
      name,
      version: version || '1.0.0',
      description: description || '',
      handler,
      metadata: {
        category: metadata.category || 'general',
        tags: metadata.tags || [],
        author: metadata.author || 'anonymous',
        license: metadata.license || 'MIT',
        original: metadata.original !== false, // 默认标记为原创
        dependencies: metadata.dependencies || [],
        ...metadata
      },
      registeredAt: new Date().toISOString(),
      enabled: true
    };

    this.registry.set(name, skill);

    // 添加到分类索引
    const category = skill.metadata.category;
    if (!this.categories.has(category)) {
      this.categories.set(category, []);
    }
    this.categories.get(category).push(name);

    console.log(`[SkillRegistry] 技能已注册：${name} (v${skill.version})`);
    return skill;
  }

  /**
   * 注销技能
   */
  unregister(skillName) {
    const skill = this.registry.get(skillName);
    if (!skill) {
      return false;
    }

    // 从分类索引中移除
    const category = skill.metadata.category;
    const categorySkills = this.categories.get(category);
    if (categorySkills) {
      const index = categorySkills.indexOf(skillName);
      if (index > -1) {
        categorySkills.splice(index, 1);
      }
    }

    // 从已加载技能中移除
    this.loadedSkills.delete(skillName);

    // 从注册表中移除
    const deleted = this.registry.delete(skillName);
    
    if (deleted) {
      console.log(`[SkillRegistry] 技能已注销：${skillName}`);
    }
    
    return deleted;
  }

  /**
   * 获取技能
   */
  getSkill(skillName) {
    return this.registry.get(skillName);
  }

  /**
   * 列出所有技能
   */
  listSkills(filter = {}) {
    const skills = [];
    
    for (const [name, skill] of this.registry) {
      // 应用过滤器
      if (filter.category && skill.metadata.category !== filter.category) {
        continue;
      }
      if (filter.tag && !skill.metadata.tags.includes(filter.tag)) {
        continue;
      }
      if (filter.enabled !== undefined && skill.enabled !== filter.enabled) {
        continue;
      }

      skills.push({
        name: skill.name,
        version: skill.version,
        description: skill.description,
        category: skill.metadata.category,
        tags: skill.metadata.tags,
        author: skill.metadata.author,
        license: skill.metadata.license,
        original: skill.metadata.original,
        enabled: skill.enabled
      });
    }

    return skills;
  }

  /**
   * 按分类列出技能
   */
  listByCategory() {
    const result = {};
    
    for (const [category, skillNames] of this.categories) {
      result[category] = skillNames.map(name => {
        const skill = this.registry.get(name);
        return {
          name: skill.name,
          description: skill.description,
          enabled: skill.enabled
        };
      });
    }

    return result;
  }

  /**
   * 搜索技能（按关键词）
   */
  searchSkills(query) {
    const queryLower = query.toLowerCase();
    const results = [];

    for (const [name, skill] of this.registry) {
      const searchableText = [
        skill.name,
        skill.description,
        ...skill.metadata.tags,
        skill.metadata.category
      ].join(' ').toLowerCase();

      if (searchableText.includes(queryLower)) {
        results.push({
          name: skill.name,
          description: skill.description,
          category: skill.metadata.category,
          tags: skill.metadata.tags,
          matchScore: this.calculateMatchScore(searchableText, queryLower)
        });
      }
    }

    // 按匹配度排序
    results.sort((a, b) => b.matchScore - a.matchScore);

    return results;
  }

  /**
   * 计算匹配分数
   */
  calculateMatchScore(text, query) {
    let score = 0;
    
    // 完全匹配
    if (text.includes(query)) {
      score += 10;
    }

    // 单词匹配
    const queryWords = query.split(/\s+/);
    for (const word of queryWords) {
      if (text.includes(word)) {
        score += 5;
      }
    }

    return score;
  }

  /**
   * 加载技能文件
   */
  async loadSkillFile(filePath) {
    try {
      const absolutePath = path.resolve(filePath);
      
      if (!fs.existsSync(absolutePath)) {
        throw new Error(`文件不存在：${absolutePath}`);
      }

      // 动态加载模块
      const module = require(absolutePath);
      
      // 支持多种导出格式
      let skillDefinition;
      if (module.default) {
        skillDefinition = module.default;
      } else if (module.skill) {
        skillDefinition = module.skill;
      } else {
        skillDefinition = module;
      }

      // 注册技能
      const skill = this.register(skillDefinition);
      this.loadedSkills.set(skill.name, {
        filePath: absolutePath,
        loadedAt: new Date().toISOString()
      });

      console.log(`[SkillRegistry] 技能文件已加载：${filePath}`);
      return skill;

    } catch (error) {
      console.error(`[SkillRegistry] 加载技能文件失败：${filePath}`, error);
      throw error;
    }
  }

  /**
   * 扫描并加载技能目录
   */
  async scanAndLoad(directory = this.skillsPath) {
    const loadedCount = 0;
    const errorCount = 0;
    
    try {
      const absoluteDir = path.resolve(directory);
      const files = fs.readdirSync(absoluteDir);

      for (const file of files) {
        if (file.endsWith('.js') && !file.startsWith('_')) {
          try {
            await this.loadSkillFile(path.join(absoluteDir, file));
            loadedCount++;
          } catch (error) {
            console.error(`[SkillRegistry] 加载技能失败：${file}`, error);
            errorCount++;
          }
        }
      }

      console.log(`[SkillRegistry] 扫描完成 | 加载：${loadedCount} | 失败：${errorCount}`);
      return { loadedCount, errorCount };

    } catch (error) {
      console.error(`[SkillRegistry] 扫描目录失败：${directory}`, error);
      throw error;
    }
  }

  /**
   * 启用/禁用技能
   */
  toggleSkill(skillName, enabled) {
    const skill = this.registry.get(skillName);
    if (!skill) {
      return false;
    }

    skill.enabled = enabled;
    console.log(`[SkillRegistry] 技能已${enabled ? '启用' : '禁用'}：${skillName}`);
    return true;
  }

  /**
   * 导出技能配置
   */
  exportConfig() {
    const config = {
      exportedAt: new Date().toISOString(),
      skillsCount: this.registry.size,
      skills: []
    };

    for (const [name, skill] of this.registry) {
      config.skills.push({
        name: skill.name,
        version: skill.version,
        description: skill.description,
        metadata: skill.metadata,
        enabled: skill.enabled
      });
    }

    return config;
  }

  /**
   * 导入技能配置
   */
  importConfig(config) {
    let importedCount = 0;

    for (const skillConfig of config.skills) {
      try {
        // 这里只导入配置，不导入 handler（需要代码）
        const existingSkill = this.registry.get(skillConfig.name);
        if (existingSkill) {
          Object.assign(existingSkill.metadata, skillConfig.metadata);
          existingSkill.enabled = skillConfig.enabled;
          importedCount++;
        }
      } catch (error) {
        console.error(`[SkillRegistry] 导入技能配置失败：${skillConfig.name}`, error);
      }
    }

    console.log(`[SkillRegistry] 导入配置完成 | 导入数：${importedCount}`);
    return importedCount;
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const skills = Array.from(this.registry.values());
    const categories = Array.from(this.categories.keys());
    const enabledCount = skills.filter(s => s.enabled).length;
    const originalCount = skills.filter(s => s.metadata.original).length;

    return {
      totalSkills: skills.length,
      enabledSkills: enabledCount,
      disabledSkills: skills.length - enabledCount,
      originalSkills: originalCount,
      categories: categories.length,
      categoryList: categories,
      loadedSkills: this.loadedSkills.size,
      timestamp: new Date().toISOString()
    };
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SkillRegistry };
}
