# Claude Kit

A development workspace for creating, testing, and distributing Claude Code skills.

## 什么是 Claude Kit?

Claude Kit 是一个用于开发 [Claude Code](https://claude.ai/code) Skills 的工具集和工作空间。Skills 是模块化的扩展包，为 Claude 提供专业领域的知识、工作流程和工具集成能力。

通过 Claude Kit，你可以：
- 📚 使用现成的 Skills（如 book-reading-assistant）
- 🛠️ 创建自己的 Skills
- 🧪 在隔离环境中测试 Skills
- 📦 打包 Skills 用于分发

## 快速开始

### 使用现有的 Skills

#### 方式一：直接安装（推荐）

1. **下载 Skill 包**
   ```bash
   # 下载打包好的 .zip 文件
   # 例如：book-reading-assistant.zip
   ```

2. **在 Claude Code 中安装**
   ```bash
   # 将 .zip 文件解压到 Claude 的 skills 目录
   # macOS/Linux: ~/.claude/skills/
   # Windows: %USERPROFILE%\.claude\skills\

   unzip book-reading-assistant.zip -d ~/.claude/skills/
   ```

3. **启动 Claude Code 并使用**
   ```bash
   claude code
   ```

   Skill 将自动加载，当你的请求匹配 skill 的描述时，Claude 会自动使用它。

#### 方式二：使用 Playground 测试

如果你想先在隔离环境中测试 skill：

```bash
# 进入 playground 目录
cd playground/book-reading-assistant

# 添加测试数据（对于 book-reading-assistant）
cp ~/path/to/your-book.pdf sample-data/

# 启动 Claude Code
claude code
```

Skill 会自动加载并可以立即测试。

## 可用 Skills

### 📚 book-reading-assistant

**用途**：帮助阅读和理解技术书籍，通过章节分析、理解测试和间隔重复来深化学习。

**主要功能**：

1. **书籍初始化**
   - 自动提取目录（TOC）
   - 创建结构化的笔记目录
   - 初始化进度跟踪

2. **三阶段阅读辅助**
   - **Pre-reading**：预览章节关键概念和重点
   - **During-reading**：内容扩展、发散思考、概念澄清
   - **Post-reading**：生成全面的章节笔记、理解测试、安排复习

3. **9 节章节分析**
   - 章节元数据
   - 关键引用（逐字引用，含页码）
   - 主要故事/案例
   - 章节摘要
   - 核心教学
   - 可执行的经验
   - 思维/哲学洞见
   - 难忘的隐喻和类比
   - 反思问题

4. **跨章节分析**
   - 识别重复主题
   - 映射概念连接
   - 追踪思想演进

5. **术语表管理**
   - 自动构建技术术语词汇表
   - 按字母顺序组织
   - 包含定义、章节引用和上下文

6. **间隔重复系统**
   - 基于理解分数的智能复习调度
   - 使用遗忘曲线原理
   - 自适应间隔调整

7. **进度跟踪**
   - 章节完成状态
   - 理解分数
   - 即将到来的复习
   - 阅读统计

**适用场景**：
- 阅读技术书籍（编程、机器学习、系统设计等）
- 需要深入理解和长期记忆
- 多会话学习工作流
- 希望保持结构化笔记

**文件位置**：
- Skill 源码：`skills/book-reading-assistant/`
- 打包文件：`book-reading-assistant.zip`
- 测试环境：`playground/book-reading-assistant/`

**如何使用**：

```bash
# 方式 1: 在 playground 中测试
cd playground/book-reading-assistant
cp ~/Books/your-technical-book.pdf sample-data/
claude code

# 方式 2: 直接安装到 Claude
unzip book-reading-assistant.zip -d ~/.claude/skills/
claude code

# 在 Claude Code 中
> I want to start reading a new book. The file is at sample-data/your-book.pdf
> Please save the notes to test-output/your-book-name/
```

**详细测试场景**：
参见 `playground/book-reading-assistant/test-scenarios.md`，包含 10 个详细的测试场景，涵盖所有功能。

---

## 项目结构

```
claude-kit/
├── skills/                          # Skills 源代码（生产环境）
│   └── book-reading-assistant/
│       ├── SKILL.md                # 必需：包含 YAML frontmatter 的 skill 指令
│       └── references/             # 可选：按需加载的参考文档
│           ├── output-formats.md   # 文件格式规范
│           └── spaced-repetition-guide.md  # 复习算法
│
├── playground/                      # Skills 的隔离测试环境
│   ├── README.md                   # Playground 总说明
│   └── book-reading-assistant/
│       ├── .claude/
│       │   └── skills/
│       │       └── book-reading-assistant/  # → 符号链接到 ../../../../skills/book-reading-assistant
│       ├── README.md               # 测试说明
│       ├── test-scenarios.md       # 10 个详细测试场景
│       └── sample-data/            # 测试数据目录（gitignored）
│           └── .gitkeep
│
├── book-reading-assistant.zip      # 打包的 skill（可分发）
├── CLAUDE.md                       # Claude Code 工作指南
└── README.md                       # 本文件
```

### 目录说明

#### `skills/`
存放 skills 的源代码。这是"真实的"代码，会被打包和分发。

**Skill 结构**：
- `SKILL.md` (必需) - 包含 YAML frontmatter 和 Markdown 指令的主文件
- `references/` (可选) - Claude 按需加载的参考文档（API 文档、架构说明等）
- `scripts/` (可选) - 可执行脚本（Python、Bash 等）
- `assets/` (可选) - 输出中使用的文件（模板、样板代码等）

#### `playground/`
每个 skill 的隔离测试环境。

**关键特性**：
- 使用符号链接（symlink）指向 `skills/` 中的源代码
- 修改 `skills/` 中的代码会立即在 playground 中生效（无需同步）
- 测试数据和输出被隔离，不影响 skill 源代码
- 每个 skill 的 playground 是独立的

**优势**：
- ✅ 始终使用最新版本的 skill
- ✅ 无需手动同步
- ✅ 一次编辑，立即测试
- ✅ 隔离的测试环境

#### `.zip 文件`
打包好的 skills，可以直接分发和安装。

---

## 开发指南

### 创建新 Skill

#### 1. 初始化 Skill

使用 skill-creator 脚本创建 skill 框架：

```bash
python3 ~/.claude/plugins/marketplaces/anthropic-agent-skills/skill-creator/scripts/init_skill.py <skill-name> --path skills/

# 示例
python3 ~/.claude/plugins/marketplaces/anthropic-agent-skills/skill-creator/scripts/init_skill.py my-new-skill --path skills/
```

这会创建：
- `skills/my-new-skill/SKILL.md` - 包含 TODO 占位符的模板
- `skills/my-new-skill/scripts/example.py` - 示例脚本
- `skills/my-new-skill/references/api_reference.md` - 示例参考文档
- `skills/my-new-skill/assets/example_asset.txt` - 示例资源

#### 2. 编辑 SKILL.md

**YAML Frontmatter（关键！）**

```yaml
---
name: my-new-skill
description: 详细描述 skill 的功能和使用场景。包含 skill 何时被触发的具体场景、文件类型或任务。
---
```

**重要**：
- `name` 必须与目录名匹配
- `description` 决定了 Claude 何时使用这个 skill
- 描述要具体，包含触发场景

**示例对比**：

❌ **不好的描述**：
```yaml
description: Helps with reading books
```

✅ **好的描述**：
```yaml
description: This skill assists with reading technical books through chapter-by-chapter analysis, comprehension testing, and persistent note-taking. Use this skill when the user wants to read and deeply understand a technical book (PDF/EPUB format), needs structured reading assistance across multiple sessions, or wants to track progress and maintain organized reading notes. Triggers include requests to start reading a book, analyze chapters, save reading notes, track terminology, or schedule review sessions.
```

**编写风格**：
- 使用祈使语气（imperative form）："To accomplish X, do Y"
- 避免第二人称："Do X" 而不是 "You should do X"
- 简洁、可执行的指令
- 客观描述，不用"你"、"您"

**内容组织**：
- 替换所有 TODO 占位符
- 删除不需要的示例文件
- 保持 SKILL.md 精简（<5k 词）
- 详细文档放在 `references/` 中

#### 3. 添加 References、Scripts、Assets（可选）

**references/**
按需加载的文档（Claude 在需要时才读取）：
- API 文档
- 数据库架构
- 详细工作流指南
- 政策或规范文档

**scripts/**
可执行代码（Python、Bash 等）：
- 确定性操作
- 重复编写的代码
- Claude 可以执行而无需加载到上下文的脚本

**assets/**
输出中使用的文件（不会加载到上下文）：
- 模板文件
- 样板代码
- 图片、图标、字体
- 示例文档

#### 4. 创建 Playground 测试环境

```bash
# 创建 playground 目录结构
mkdir -p playground/my-new-skill/.claude/skills
cd playground/my-new-skill

# 创建符号链接到 skill
ln -s ../../../skills/my-new-skill .claude/skills/my-new-skill

# 创建测试文档
touch README.md test-scenarios.md

# 创建测试数据目录
mkdir -p sample-data

# 返回根目录
cd ../..
```

#### 5. 测试 Skill

```bash
# 进入 playground
cd playground/my-new-skill

# 启动 Claude Code
claude code

# 在 Claude Code 中测试你的 skill
```

**测试要点**：
- 验证 skill 是否在正确场景下被触发
- 测试所有主要功能
- 检查生成的输出文件
- 测试边界情况

#### 6. 迭代开发

在 `skills/my-new-skill/` 中编辑代码，playground 中的更改会立即生效：

```bash
# 编辑 skill
vim skills/my-new-skill/SKILL.md

# 在 playground 中测试（无需重新加载或同步）
cd playground/my-new-skill
claude code
```

#### 7. 打包 Skill

```bash
# 打包 skill（会先自动验证）
python3 ~/.claude/plugins/marketplaces/anthropic-agent-skills/skill-creator/scripts/package_skill.py skills/my-new-skill

# 输出：my-new-skill.zip
```

打包会自动验证：
- YAML frontmatter 格式
- 必需字段
- 文件结构
- 描述完整性

如果验证失败，修复错误后重新运行打包命令。

---

## 进阶主题

### Progressive Disclosure（渐进式披露）

Skills 使用三级加载系统来高效管理上下文：

1. **Metadata（元数据）** - 始终在上下文中（~100 词）
   - name + description

2. **SKILL.md body（主体）** - 当 skill 被触发时加载（<5k 词）
   - 核心指令和工作流

3. **References/Scripts（引用/脚本）** - 按需加载（无限制）
   - 详细文档
   - 脚本可以执行而无需加载到上下文

**最佳实践**：
- 保持 SKILL.md 精简
- 将详细文档移到 `references/`
- 仅在 SKILL.md 中包含核心工作流

### YAML Frontmatter 最佳实践

**必需字段**：
```yaml
---
name: skill-name          # 必须与目录名匹配
description: |            # 使用 | 支持多行
  详细描述 skill 的功能。
  包含何时使用此 skill。
  列出触发场景。
---
```

**好的描述包含**：
1. **功能**：skill 做什么
2. **使用场景**：何时使用（when to use）
3. **触发条件**：哪些请求会触发（file types, tasks, scenarios）

**示例**：
```yaml
description: This skill assists with reading technical books through chapter-by-chapter analysis, comprehension testing, and persistent note-taking. Use this skill when the user wants to read and deeply understand a technical book (PDF/EPUB format), needs structured reading assistance across multiple sessions, or wants to track progress and maintain organized reading notes. Triggers include requests to start reading a book, analyze chapters, save reading notes, track terminology, or schedule review sessions.
```

### References 组织

当 `references/` 很大时（>10k 词），在 SKILL.md 中包含 grep 搜索模式：

```markdown
## References

This skill includes detailed references:

### references/api-documentation.md
Contains complete API documentation. Use grep patterns:
- `GET /api/` for API endpoints
- `class \w+Service` for service classes
- `interface \w+Config` for configuration interfaces
```

这帮助 Claude 高效地找到需要的信息。

---

## 常用命令

### 创建 Skill
```bash
python3 ~/.claude/plugins/marketplaces/anthropic-agent-skills/skill-creator/scripts/init_skill.py <skill-name> --path skills/
```

### 验证 Skill
```bash
python3 ~/.claude/plugins/marketplaces/anthropic-agent-skills/skill-creator/scripts/quick_validate.py skills/<skill-name>
```

### 打包 Skill
```bash
python3 ~/.claude/plugins/marketplaces/anthropic-agent-skills/skill-creator/scripts/package_skill.py skills/<skill-name>

# 可选：指定输出目录
python3 ~/.claude/plugins/marketplaces/anthropic-agent-skills/skill-creator/scripts/package_skill.py skills/<skill-name> ./dist
```

### 创建 Playground
```bash
mkdir -p playground/<skill-name>/.claude/skills
ln -s ../../../skills/<skill-name> playground/<skill-name>/.claude/skills/<skill-name>
```

### 测试 Skill
```bash
cd playground/<skill-name>
claude code
```

---

## 故障排查

### Skill 未在 Playground 中加载

**检查符号链接**：
```bash
ls -la playground/<skill-name>/.claude/skills/
# 应该显示符号链接指向 ../../../../skills/<skill-name>

# 验证目标存在
ls -la playground/<skill-name>/.claude/skills/<skill-name>/
# 应该显示 SKILL.md 和其他 skill 文件
```

**修复**：
```bash
# 删除错误的符号链接
rm playground/<skill-name>/.claude/skills/<skill-name>

# 重新创建
ln -s ../../../../skills/<skill-name> playground/<skill-name>/.claude/skills/<skill-name>
```

### 打包命令失败

打包会先验证 skill。常见问题：
- 缺少 YAML frontmatter
- description 为空或不完整
- skill 名称与目录名不匹配

**查看验证错误**：
```bash
python3 ~/.claude/plugins/marketplaces/anthropic-agent-skills/skill-creator/scripts/quick_validate.py skills/<skill-name>
```

修复错误后重新运行打包命令。

### 更改未在测试中生效

如果使用 playground 和符号链接，更改应该立即生效。如果没有：

1. **检查编辑位置**
   ```bash
   # 确保你编辑的是 skills/ 而不是 playground/
   vim skills/<skill-name>/SKILL.md  # ✅ 正确
   # 不是
   vim playground/<skill-name>/.claude/skills/<skill-name>/SKILL.md  # ❌ 错误
   ```

2. **重启 Claude Code**
   ```bash
   # 退出 Claude Code
   exit

   # 重新启动
   claude code
   ```

3. **验证符号链接有效**
   ```bash
   readlink playground/<skill-name>/.claude/skills/<skill-name>
   # 应该输出：../../../../skills/<skill-name>
   ```

### Skill 未在正确场景下触发

问题通常在 YAML frontmatter 的 `description` 中。

**改进描述**：
1. 更具体地说明 **何时** 使用 skill
2. 包含 **触发关键词**（file types, task types, scenarios）
3. 给出具体的 **使用案例**

**示例**：
```yaml
# 前：模糊
description: Helps analyze code

# 后：具体
description: Analyzes Python code for performance bottlenecks and suggests optimizations. Use this skill when the user requests code review, performance analysis, or optimization suggestions for Python files (.py). Triggers include "analyze this code", "find performance issues", "optimize this function".
```

---

## 参考资源

### 内部文档
- **CLAUDE.md** - Claude Code 在此仓库工作的详细指南
- **playground/README.md** - Playground 使用说明
- **playground/book-reading-assistant/test-scenarios.md** - 详细测试场景示例

### 外部资源
- **Skill Creator Scripts**: `~/.claude/plugins/marketplaces/anthropic-agent-skills/skill-creator/scripts/`
- **Claude Code 全局设置**: `~/.claude/`
- **项目本地设置**: `.claude/settings.local.json`

---

## 贡献

欢迎贡献新的 skills 或改进现有 skills！

### 贡献流程

1. **Fork 此仓库**

2. **创建新 skill 或改进现有 skill**
   ```bash
   # 创建新 skill
   python3 ~/.claude/plugins/marketplaces/anthropic-agent-skills/skill-creator/scripts/init_skill.py your-skill --path skills/

   # 编辑 SKILL.md 和相关文件
   ```

3. **创建 playground 并测试**
   ```bash
   mkdir -p playground/your-skill/.claude/skills
   ln -s ../../../skills/your-skill playground/your-skill/.claude/skills/your-skill
   cd playground/your-skill
   claude code
   # 测试所有功能
   ```

4. **打包 skill**
   ```bash
   python3 ~/.claude/plugins/marketplaces/anthropic-agent-skills/skill-creator/scripts/package_skill.py skills/your-skill
   ```

5. **提交 Pull Request**
   - 包含 skill 源代码（`skills/your-skill/`）
   - 包含 playground 测试环境（`playground/your-skill/`）
   - 包含打包的 .zip 文件
   - 更新此 README.md 的"可用 Skills"部分

### Skill 质量标准

- ✅ 清晰、具体的 YAML description
- ✅ 完整的 SKILL.md（无 TODO 占位符）
- ✅ 至少 3 个测试场景
- ✅ README.md 说明 skill 用途和使用方法
- ✅ 验证通过（无错误）
- ✅ 在 playground 中测试成功

---

## License

[在此添加许可证信息]

---

## 联系方式

[在此添加联系方式或反馈渠道]

---

**Happy Skill Building! 🚀**
