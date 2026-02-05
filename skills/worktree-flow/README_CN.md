# Worktree Flow

使用 git worktree 编排并行 Claude Code 开发流程，支持自动任务分解、冲突检测和结构化合并工作流。

[English Version](./README.md)

## 概述

Worktree Flow 允许多个 Claude Code 实例同时处理独立任务，同时保持代码完整性。该技能在两种不同模式下运行:

- **协调器模式**: 分析复杂需求，将其分解为独立任务，为每个任务创建隔离的 git worktree，并生成详细的实现计划
- **执行器模式**: 在包含任务命令文件的 worktree 中自动激活，遵循实现计划，并提供结构化的工作流命令用于提交和合并回基础分支

这种双模式架构通过原子锁定、冲突检测和仅快进合并来最大化并行开发速度，同时防止合并冲突。

## 工作原理

### 协调器工作流

1. **任务分解**: 分析用户需求，基于功能边界、层级分离和文件隔离将其拆分为独立子任务
2. **冲突评估**: 生成文件重叠矩阵，标记 HIGH/MEDIUM/LOW 风险场景，推荐合并顺序
3. **用户确认**: 展示包含冲突风险的完整计划供批准
4. **会话初始化**: 创建 `.worktree-flow/<session-id>/` 状态目录，包含 `session.json` 和每个任务的 `status.json` 文件
5. **创建 Worktree**: 使用专用分支创建 git worktree: `wt/YYYYMMDD/<task-slug>`
6. **分发计划**: 在每个 worktree 中生成 `.worktree-flow-command.md`，包含详细任务规范
7. **命令设置**: 将斜杠命令模板复制到 worktree 和主仓库的 `.claude/commands/` 目录

### 执行器工作流

1. **自动激活**: 在会话启动时检测 `.worktree-flow-command.md`，解析任务元数据，将状态更新为 `in_progress`
2. **任务执行**: 遵循实现计划，尊重范围边界，监控冲突区域
3. **提交协议**: 使用 `/wt-commit` 暂存和提交工作，采用结构化消息(首次提交嵌入完整任务规范)
4. **合并回基础分支**: 使用 `/wt-done` 获取锁，rebase 到基础分支，使用 `--ff-only` 合并，释放锁
5. **状态跟踪**: 使用 `/wt-status` 查看任务进度和整体会话状态

## 安装

### 方式 1: 从打包的技能安装(推荐)

```bash
# 从 releases 下载 worktree-flow.zip
# 解压到 Claude Code 技能目录
unzip worktree-flow.zip -d ~/.claude/skills/
```

### 方式 2: 从源码安装

```bash
# 克隆或复制技能目录
cp -r skills/worktree-flow ~/.claude/skills/

# 或者创建符号链接用于开发
ln -s /path/to/claude-kit/skills/worktree-flow ~/.claude/skills/worktree-flow
```

重启 Claude Code 以加载技能。

## 使用方法

### 激活协调器模式

使用以下任一方法:

```bash
# 斜杠命令(在基础 worktree 中)
/worktree-flow

# 自然语言
"将此任务拆分为并行开发"
"为并行工作创建 worktree"
"同时处理多个功能"
```

### 激活执行器模式

当您在根目录包含 `.worktree-flow-command.md` 的 worktree 中启动 Claude Code 时，执行器模式会自动激活。无需手动调用。

## 命令

### 协调器命令(在基础 worktree 中)

| 命令 | 描述 |
|------|------|
| `/worktree-flow` | 激活协调器以分解任务并创建 worktree |
| `/wt-status` | 监控所有任务的整体会话进度 |
| `/wt-cleanup` | 清理已完成的会话(移除 worktree、分支、状态) |

### 执行器命令(在任务 worktree 中)

| 命令 | 描述 |
|------|------|
| `/wt-commit` | 使用结构化消息暂存并提交当前工作 |
| `/wt-done` | 完成任务 — 获取锁、rebase、合并回基础分支、释放锁 |
| `/wt-status` | 显示当前任务状态和整体会话进度 |

## 架构

### 关键设计决策

- **原子锁定**: 使用 `mkdir` 作为原子原语防止并发合并。锁目录包含 `owner` 文件用于标识。
- **仅快进合并**: 执行器在使用 `--ff-only` 合并前先 rebase 到基础分支，保证线性 git 历史，无合并提交。
- **共享 Git 状态**: 所有 worktree 通过 `$GIT_COMMON_DIR` 共享引用，因此分支更新在各个 worktree 间立即可见。
- **Git 排除规则**: 在共享的 `info/exclude` 中统一配置，将 `.worktree-flow/` 和 `.worktree-flow-command.md` 从所有 worktree 中排除。
- **首次提交协议**: 每个任务分支的第一次提交将完整的 `.worktree-flow-command.md` 内容嵌入提交消息，创建永久审计跟踪。
- **会话 ID 格式**: `YYYYMMDD-<summary-slug>`(最多 60 字符)，用作目录名和人类可读标识符。
- **Worktree 路径约定**: `../<project-name>-wt-<task-slug>/` — 主项目的同级目录。
- **分支命名约定**: `wt/YYYYMMDD/<task-slug>` — 使用命名空间避免与常规分支冲突。

### 状态管理

所有会话状态存储在基础 worktree 的 `.worktree-flow/<session-id>/` 目录中:

```
.worktree-flow/
└── 20260204-fastlane-revenuecat-i18n/
    ├── session.json                    # 会话元数据和任务列表
    ├── lock.d/                         # 合并锁目录(原子)
    │   └── owner                       # 锁持有者标识符
    ├── integrate-fastlane/
    │   └── status.json                 # 任务状态跟踪
    ├── integrate-revenuecat/
    │   └── status.json
    └── add-i18n/
        └── status.json
```

完整的 JSON schema 请参见 `references/state-formats.md`。

## 文件结构

```
worktree-flow/
├── SKILL.md                        # 核心技能指令(两种模式)
├── README.md                       # 英文说明文档
├── README_CN.md                    # 本文件(中文)
├── references/
│   ├── state-formats.md            # session/status/command 文件的 JSON schema
│   ├── coordinator-workflow.md     # 任务分解和冲突评估
│   ├── executor-workflow.md        # 合并协议和锁机制
│   └── git-operations.md           # Git 命令参考
└── assets/
    └── templates/
        ├── wt-commit.md            # 斜杠命令: 提交工作
        ├── wt-done.md              # 斜杠命令: 合并回主分支
        ├── wt-status.md            # 斜杠命令: 显示状态
        └── wt-cleanup.md           # 斜杠命令: 清理会话
```

## 系统要求

- **Git**: 版本 2.5+(支持 worktree)
- **Claude Code**: 最新版本(支持技能)

## 参考文档

详细规范和工作流:

- **`references/state-formats.md`**: `session.json`、`status.json`、`.worktree-flow-command.md` 和锁机制的完整 schema
- **`references/coordinator-workflow.md`**: 任务分解策略、冲突风险评估矩阵格式、用户确认流程和 worktree 创建序列
- **`references/executor-workflow.md`**: 详细的激活序列、提交消息协议(首次 vs. 后续)、带逐步错误处理的合并回协议、陈旧锁检测
- **`references/git-operations.md`**: 技能使用的所有 git 命令及说明: worktree add/remove/list/prune、分支 create/delete、info/exclude 配置、rebase、merge ff-only

## 测试

参见 playground 目录中的综合测试场景:

```bash
cd playground/worktree-flow
claude code
```

参考 `playground/worktree-flow/test-scenarios.md` 了解 10 个详细测试用例，涵盖:
- 任务分解和冲突评估
- Worktree 创建和初始化
- 并行执行和提交协议
- 锁机制和合并回工作流
- 错误处理和恢复
- 清理过程

## 许可证

MIT
