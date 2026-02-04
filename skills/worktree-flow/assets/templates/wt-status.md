---
description: Show worktree-flow task and session status
allowed-tools: Read, Bash(git:*), Grep, Glob
---

Display the current status of the worktree-flow task and overall session progress.

Read `.worktree-flow-command.md` to extract:
- `session_id`
- `task_name`
- `state_dir`

Read `<state_dir>/session.json` for session overview.

Read `<state_dir>/<task_name>/status.json` for current task details.

Read status for all tasks by reading each `<state_dir>/*/status.json` file.

Check if lock is held:
```bash
test -d "<state_dir>/lock.d"
```

If lock exists, read `<state_dir>/lock.d/owner` to identify the lock owner.

Display formatted status report:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Worktree Flow Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Session: <session_id>
Base: <base_branch>
Created: <created_at>

Current Task: <task_name>
├─ Status: <status>
├─ Commits: <commit_count>
└─ Last commit: <short_hash>

All Tasks:
  [Symbol] <task_name>     <status>      <branch>
  [Symbol] <task_name>     <status>      <branch>
  ...

Lock: <lock_status>

Progress: X/Y tasks completed (Z%)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Status symbols**:
- `○` pending
- `●` in_progress
- `✓` completed
- `✗` failed

**Lock status**:
- "Not held" if lock directory doesn't exist
- "Held by: <task_name>" if lock directory exists

**Progress calculation**:
- Count total tasks
- Count completed tasks
- Calculate percentage
