# Worktree Flow Skill - Testing Playground

This playground is for testing the worktree-flow skill, which orchestrates parallel Claude Code development using git worktrees.

## Quick Start

```bash
cd playground/worktree-flow
claude code
```

The skill will load automatically via the symlink in `.claude/skills/`.

## What is Worktree Flow?

The worktree-flow skill enables parallel development by:
1. **Coordinator Mode**: Splits complex tasks into independent subtasks, creates git worktrees for each
2. **Executor Mode**: Auto-activates in worktrees, follows task plans, provides structured merge workflow

## Testing Scenarios

See `test-scenarios.md` for detailed test cases covering:
- Task decomposition and conflict assessment
- Worktree creation and initialization
- Parallel execution and commit protocol
- Lock mechanism and merge-back workflow
- Error handling and recovery
- Cleanup procedures

## Skill Structure

```
skills/worktree-flow/
├── SKILL.md                       # Core skill instructions (both modes)
├── references/
│   ├── coordinator-workflow.md    # Task decomposition, conflict assessment
│   ├── executor-workflow.md       # Merge protocol, lock mechanism
│   ├── state-formats.md           # JSON schemas and file formats
│   └── git-operations.md          # Git commands reference
└── assets/
    └── templates/
        ├── wt-commit.md           # Slash command: commit work
        ├── wt-done.md             # Slash command: merge back
        ├── wt-status.md           # Slash command: show status
        └── wt-cleanup.md          # Slash command: cleanup session
```

## Key Files

- **SKILL.md**: Main skill logic with mode detection and workflows
- **references/**: Detailed specifications for complex operations
- **assets/templates/**: Slash command files copied to worktrees

## Commands Available

### Coordinator Mode (in base worktree)
- `/worktree-flow` - Activate coordinator to split tasks
- `/wt-status` - Monitor overall session progress
- `/wt-cleanup` - Clean up completed session

### Executor Mode (in task worktrees)
- `/wt-commit` - Commit current work
- `/wt-done` - Complete task and merge back
- `/wt-status` - Show task status

## Notes

- The skill automatically detects which mode to use based on presence of `.worktree-flow-command.md`
- Executors activate automatically when opening Claude Code in a task worktree
- State is shared via `.worktree-flow/` directory in the base worktree
- Lock mechanism prevents merge conflicts using atomic mkdir operations
