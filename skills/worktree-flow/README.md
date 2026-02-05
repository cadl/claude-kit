# Worktree Flow

Orchestrate parallel Claude Code development using git worktrees with automatic task decomposition, conflict detection, and structured merge workflows.

[中文版](./README_CN.md)

## Overview

Worktree Flow enables multiple Claude Code instances to work on independent tasks simultaneously while maintaining code integrity. The skill operates in two distinct modes:

- **Coordinator Mode**: Analyzes complex requirements, decomposes them into independent tasks, creates isolated git worktrees for each task, and generates detailed implementation plans
- **Executor Mode**: Auto-activates in worktrees with task command files, follows the implementation plan, and provides structured workflow commands for committing and merging back to the base branch

This dual-mode architecture maximizes parallel development velocity while preventing merge conflicts through atomic locking, conflict detection, and fast-forward only merges.

## How It Works

### Coordinator Workflow

1. **Task Decomposition**: Analyze user requirements and split into independent subtasks based on feature boundaries, layer separation, and file isolation
2. **Conflict Assessment**: Generate file overlap matrix, flag HIGH/MEDIUM/LOW risk scenarios, recommend merge ordering
3. **User Confirmation**: Present complete plan with conflict risks for approval
4. **Session Initialization**: Create `.worktree-flow/<session-id>/` state directory with `session.json` and per-task `status.json` files
5. **Worktree Creation**: Create git worktrees with dedicated branches: `wt/YYYYMMDD/<task-slug>`
6. **Plan Distribution**: Generate `.worktree-flow-command.md` in each worktree with detailed task specification
7. **Command Setup**: Copy slash command templates to `.claude/commands/` in worktrees and main repo

### Executor Workflow

1. **Auto-Activation**: Detect `.worktree-flow-command.md` on session start, parse task metadata, update status to `in_progress`
2. **Task Execution**: Follow implementation plan, respect scope boundaries, monitor conflict zones
3. **Commit Protocol**: Use `/wt-commit` to stage and commit work with structured messages (first commit embeds full task spec)
4. **Merge-Back**: Use `/wt-done` to acquire lock, rebase onto base branch, merge with `--ff-only`, release lock
5. **Status Tracking**: Use `/wt-status` to view task progress and overall session status

## Installation

### Option 1: Install from packaged skill (recommended)

```bash
# Download worktree-flow.zip from releases
# Extract to Claude Code skills directory
unzip worktree-flow.zip -d ~/.claude/skills/
```

### Option 2: Install from source

```bash
# Clone or copy the skill directory
cp -r skills/worktree-flow ~/.claude/skills/

# Or symlink for development
ln -s /path/to/claude-kit/skills/worktree-flow ~/.claude/skills/worktree-flow
```

Restart Claude Code to load the skill.

## Usage

### Activating Coordinator Mode

Use one of the following methods:

```bash
# Slash command (in base worktree)
/worktree-flow

# Natural language
"Split this task for parallel development"
"Create worktrees for parallel work"
"Work on multiple features simultaneously"
```

### Activating Executor Mode

Executor mode activates automatically when you start Claude Code in a worktree that contains `.worktree-flow-command.md` in its root. No manual invocation needed.

## Commands

### Coordinator Commands (in base worktree)

| Command | Description |
|---------|-------------|
| `/worktree-flow` | Activate coordinator to decompose tasks and create worktrees |
| `/wt-status` | Monitor overall session progress across all tasks |
| `/wt-cleanup` | Clean up completed session (remove worktrees, branches, state) |

### Executor Commands (in task worktrees)

| Command | Description |
|---------|-------------|
| `/wt-commit` | Stage and commit current work with structured message |
| `/wt-done` | Complete task — acquire lock, rebase, merge back to base branch, release lock |
| `/wt-status` | Show current task status and overall session progress |

## Architecture

### Key Design Decisions

- **Atomic Locking**: Uses `mkdir` as an atomic primitive to prevent concurrent merges. Lock directory contains `owner` file for identification.
- **Fast-Forward Only Merges**: Executors rebase onto base branch before merging with `--ff-only`, guaranteeing linear git history with no merge commits.
- **Shared Git State**: All worktrees share refs via `$GIT_COMMON_DIR`, so branch updates are visible immediately across worktrees.
- **Git Exclusions**: Configured once in shared `info/exclude` to exclude `.worktree-flow/` and `.worktree-flow-command.md` from all worktrees.
- **First Commit Protocol**: The first commit in each task branch embeds the full `.worktree-flow-command.md` content in the commit message, creating a permanent audit trail.
- **Session ID Format**: `YYYYMMDD-<summary-slug>` (max 60 chars), used as directory name and human-readable identifier.
- **Worktree Path Convention**: `../<project-name>-wt-<task-slug>/` — sibling directories to the main project.
- **Branch Naming Convention**: `wt/YYYYMMDD/<task-slug>` — namespaced to avoid collision with regular branches.

### State Management

All session state is stored in `.worktree-flow/<session-id>/` in the base worktree:

```
.worktree-flow/
└── 20260204-fastlane-revenuecat-i18n/
    ├── session.json                    # Session metadata and task list
    ├── lock.d/                         # Merge lock directory (atomic)
    │   └── owner                       # Lock owner identifier
    ├── integrate-fastlane/
    │   └── status.json                 # Task status tracking
    ├── integrate-revenuecat/
    │   └── status.json
    └── add-i18n/
        └── status.json
```

See `references/state-formats.md` for complete JSON schemas.

## File Structure

```
worktree-flow/
├── SKILL.md                        # Core skill instructions (both modes)
├── README.md                       # This file (English)
├── README_CN.md                    # Chinese translation
├── references/
│   ├── state-formats.md            # JSON schemas for session/status/command files
│   ├── coordinator-workflow.md     # Task decomposition and conflict assessment
│   ├── executor-workflow.md        # Merge protocol and lock mechanism
│   └── git-operations.md           # Git commands reference
└── assets/
    └── templates/
        ├── wt-commit.md            # Slash command: commit work
        ├── wt-done.md              # Slash command: merge back
        ├── wt-status.md            # Slash command: show status
        └── wt-cleanup.md           # Slash command: cleanup session
```

## Requirements

- **Git**: Version 2.5+ (with worktree support)
- **Claude Code**: Latest version with skill support

## References

Detailed specifications and workflows:

- **`references/state-formats.md`**: Complete schemas for `session.json`, `status.json`, `.worktree-flow-command.md`, and lock mechanism
- **`references/coordinator-workflow.md`**: Task decomposition strategies, conflict risk assessment matrix format, user confirmation flow, and worktree creation sequences
- **`references/executor-workflow.md`**: Detailed activation sequence, commit message protocol (first vs. subsequent), merge-back protocol with step-by-step error handling, and stale lock detection
- **`references/git-operations.md`**: Every git command used by the skill with explanations: worktree add/remove/list/prune, branch create/delete, info/exclude configuration, rebase, merge ff-only

## Testing

See the playground directory for comprehensive test scenarios:

```bash
cd playground/worktree-flow
claude code
```

Refer to `playground/worktree-flow/test-scenarios.md` for 10 detailed test cases covering:
- Task decomposition and conflict assessment
- Worktree creation and initialization
- Parallel execution and commit protocol
- Lock mechanism and merge-back workflow
- Error handling and recovery
- Cleanup procedures

## License

MIT
