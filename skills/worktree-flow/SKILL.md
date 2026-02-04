---
name: worktree-flow
description: This skill should be used when the user asks to "split tasks for parallel development", "create worktrees for parallel work", "work on multiple features simultaneously", or when .worktree-flow-command.md exists in the project root. Orchestrates parallel Claude Code sessions using git worktrees with two modes - Coordinator (analyzes requirements, splits into independent tasks, creates branches/worktrees/plans) and Executor (auto-activates in worktrees, follows task plan, provides /wt-commit /wt-done /wt-status commands for structured commit and merge-back workflow).
---

# Worktree Flow

## Overview

Worktree Flow orchestrates parallel development across multiple Claude Code instances using git worktrees. The skill operates in two distinct modes based on context:

**Coordinator Mode**: Analyzes complex requirements, decomposes them into independent tasks, creates isolated git worktrees for each task, and generates detailed implementation plans.

**Executor Mode**: Auto-activates in worktrees with task command files, follows the implementation plan, and provides structured workflow commands for committing and merging back to the base branch.

This dual-mode architecture enables maximized parallel development velocity while maintaining code integrity through atomic locking, conflict detection, and structured merge protocols.

For detailed specifications, see references files: `state-formats.md`, `coordinator-workflow.md`, `executor-workflow.md`, and `git-operations.md`.

## Mode Detection

Detect which mode to activate based on project state:

1. **Executor Mode (Priority)**: If `.worktree-flow-command.md` exists in the project root, activate Executor mode immediately.
2. **Coordinator Mode**: If user invokes `/worktree-flow` or asks to split tasks for parallel development, activate Coordinator mode.

Always check for the command file first to ensure executors activate correctly when opening worktrees.

## Coordinator Mode

Activate when user requests parallel task decomposition. The coordinator analyzes requirements, assesses conflict risks, creates worktrees, and distributes task specifications.

### Task Decomposition

Analyze the user's requirements and split into independent subtasks based on:
- Feature boundaries (separate features that can be implemented independently)
- Layer separation (frontend vs backend, UI vs business logic)
- File isolation (tasks that touch different files minimize conflicts)
- Dependency minimization (reduce inter-task dependencies)

For each identified task:
- Define clear objective (1-2 sentences)
- List specific requirements
- Create step-by-step implementation plan
- Identify files to create/modify
- Document scope boundaries (what NOT to touch)

Defer detailed task decomposition strategies to `references/coordinator-workflow.md`.

### Conflict Risk Assessment

Before creating worktrees, assess conflict potential by analyzing file overlap:

Generate a matrix showing which tasks will modify which files. Flag high-risk scenarios:
- **HIGH**: Multiple tasks modifying the same source file
- **MEDIUM**: Tasks touching shared configuration files
- **LOW**: Tasks working on completely separate files

Present the assessment to the user with recommendations:
- Proceed if risk is acceptable
- Adjust task boundaries to reduce overlap
- Designate "owner" tasks for shared files
- Document conflict zones explicitly in task plans

See `references/coordinator-workflow.md` for matrix format and assessment guidelines.

### User Confirmation

Present the complete plan for user approval:
- List all tasks with brief descriptions
- Show conflict risk assessment matrix
- Display proposed branch names and worktree paths
- Estimate parallel vs. sequential time savings (optional)

Wait for explicit confirmation before creating worktrees. Allow user to request adjustments to task boundaries or priorities.

### Session Initialization

After user confirmation, create the session infrastructure:

1. Generate session ID: Format as `YYYYMMDD-<summary-slug>`, max 60 characters. Example: `20260204-fastlane-revenuecat-i18n`.

2. Create state directory: `<base-worktree-path>/.worktree-flow/<session-id>/`

3. Initialize `session.json` with session metadata and task list (see `references/state-formats.md` for schema).

4. For each task, create subdirectory `<session-id>/<task-name>/` with `status.json`.

### Configure Git Exclusions

Configure git to ignore worktree-flow files using shared `info/exclude`:

```bash
GIT_COMMON_DIR=$(git rev-parse --git-common-dir)
grep -qxF '.worktree-flow/' "$GIT_COMMON_DIR/info/exclude" 2>/dev/null || \
  echo '.worktree-flow/' >> "$GIT_COMMON_DIR/info/exclude"
grep -qxF '.worktree-flow-command.md' "$GIT_COMMON_DIR/info/exclude" 2>/dev/null || \
  echo '.worktree-flow-command.md' >> "$GIT_COMMON_DIR/info/exclude"
```

This single configuration covers the main worktree and all linked worktrees because `info/exclude` is shared via `$GIT_COMMON_DIR`.

### Create Worktrees

For each task, create a git worktree with dedicated branch:

```bash
PROJECT_DIR=$(basename "$(pwd)")
BRANCH="wt/$(date +%Y%m%d)/<task-slug>"
WORKTREE_PATH="../${PROJECT_DIR}-wt-<task-slug>"

git worktree add -b "$BRANCH" "$WORKTREE_PATH" main
```

Verify each worktree creation succeeds. Handle errors (branch exists, path conflict) by adjusting names or reporting to user.

### Generate Task Command Files

For each worktree, create `.worktree-flow-command.md` in the worktree root using the standardized format defined in `references/state-formats.md`.

Include in YAML frontmatter:
- `session_id`: The session identifier
- `task_name`: This task's identifier
- `base_branch`: Base branch to merge back to (usually `main`)
- `base_worktree_path`: Absolute path to main worktree
- `state_dir`: Absolute path to session state directory
- `created_at`: ISO 8601 timestamp

Include in markdown body:
- **Objective**: Clear goal statement
- **Requirements**: Specific numbered requirements
- **Plan**: Step-by-step implementation steps
- **Scope**: Files to create/modify, files NOT to touch
- **Conflict Zones**: Shared files with guidance
- **Setup Commands**: Environment initialization (npm install, pod install, etc.)
- **Acceptance Criteria**: Completion checklist

### Distribute Slash Commands

Copy command templates from `assets/templates/` to enable workflow commands:

**For each worktree** (executor commands):
```bash
mkdir -p "<worktree-path>/.claude/commands"
cp assets/templates/wt-commit.md "<worktree-path>/.claude/commands/"
cp assets/templates/wt-done.md "<worktree-path>/.claude/commands/"
cp assets/templates/wt-status.md "<worktree-path>/.claude/commands/"
```

**For main worktree** (coordinator commands):
```bash
mkdir -p ".claude/commands"
cp assets/templates/wt-status.md ".claude/commands/"
cp assets/templates/wt-cleanup.md ".claude/commands/"
```

### Output Summary

Display the complete setup to the user:

```
Worktree Flow Session: 20260204-fastlane-revenuecat-i18n

Created 3 tasks:

1. integrate-fastlane
   Branch: wt/20260204/integrate-fastlane
   Path: /Users/cadl/Workspace/cadl/myapp-wt-integrate-fastlane

2. integrate-revenuecat
   Branch: wt/20260204/integrate-revenuecat
   Path: /Users/cadl/Workspace/cadl/myapp-wt-integrate-revenuecat

3. add-i18n
   Branch: wt/20260204/add-i18n
   Path: /Users/cadl/Workspace/cadl/myapp-wt-add-i18n

Next steps:
1. Open separate Claude Code instances in each worktree path
2. Claude will auto-detect the task and activate Executor mode
3. Work on tasks in parallel
4. Use /wt-done in each worktree when ready to merge back
5. Use /wt-status here to monitor overall progress
6. Use /wt-cleanup when all tasks complete
```

Remind user to check conflict zones before starting parallel work.

## Executor Mode

Activate automatically when `.worktree-flow-command.md` exists in the project root. The executor follows the task plan and provides structured workflow commands.

### Activation Sequence

On session start:

1. Detect `.worktree-flow-command.md` in project root.
2. Parse YAML frontmatter to extract session metadata.
3. Verify `state_dir` is accessible (path exists and is readable).
4. Read `<state_dir>/<task_name>/status.json` for current task state.
5. If status is `pending`, update to `in_progress` and set `started_at` timestamp.
6. Greet user with task summary.

Example greeting:

```
Worktree Flow - Executor Mode

Task: integrate-fastlane
Session: 20260204-fastlane-revenuecat-i18n
Status: in_progress (started just now)

Objective: Integrate fastlane for automated App Store releases

Available commands:
- /wt-commit: Commit current work
- /wt-done: Complete task and merge back to main
- /wt-status: Show task and session status

Review the full task plan in .worktree-flow-command.md
```

### Task Execution

Follow the implementation plan specified in `.worktree-flow-command.md`:

1. Review the **Setup Commands** section and execute any environment initialization.
2. Work through the **Plan** section step-by-step.
3. Stay within the defined **Scope** (files to create/modify).
4. Avoid touching files listed under "Files NOT to Touch".
5. Be aware of **Conflict Zones** and coordinate if needed.
6. Track progress against **Acceptance Criteria**.

If the user discovers scope conflicts during implementation (needs to touch files assigned to other tasks), report the conflict and suggest coordination strategies.

### /wt-commit Command

Stage and commit current work following the commit message protocol:

1. Read `.worktree-flow-command.md` frontmatter to get session and task info.
2. Read `<state_dir>/<task_name>/status.json` to check `commit_count`.
3. Stage all changes: `git add -A` (command file is excluded via info/exclude).
4. Determine commit message format:
   - **First commit** (`commit_count == 0`): Short summary + blank line + full command file content
   - **Subsequent commits**: Short summary + blank line + `[worktree-flow] task: <name>, session: <id>`
5. Create commit with appropriate message.
6. Update `status.json`: increment `commit_count`, set `last_commit_hash`.

See `references/executor-workflow.md` for detailed commit message construction.

### /wt-done Command

Complete the task and merge back to the base branch using the structured merge-back protocol:

1. **Pre-checks**: Commit any uncommitted changes using `/wt-commit` logic.
2. **Acquire lock**: Run `mkdir "<state_dir>/lock.d"` (atomic operation).
   - If lock acquisition fails, read `<state_dir>/lock.d/owner` to identify the holding task.
   - Report to user: "Lock held by task '<owner>'. Wait for completion and retry /wt-done."
   - Stop here until user retries.
3. **Write lock owner**: `echo "<task_name>" > "<state_dir>/lock.d/owner"`.
4. **Rebase onto base branch**: `git rebase <base_branch>`.
   - If conflicts occur, display conflicting files and guide user through resolution.
   - After resolution, run `git rebase --continue`.
   - If user aborts, run `git rebase --abort`, release lock (`rm -rf "<state_dir>/lock.d"`), and stop.
5. **Merge into base branch**: `git -C "<base_worktree_path>" merge --ff-only <current_branch>`.
   - This works because refs are shared and rebase guarantees fast-forward.
   - If this fails, report error, release lock, and stop.
6. **Update task status**: Set `status` to `completed`, set `completed_at` and `merged_at` timestamps in `status.json`.
7. **Update session status**: Update task entry in `session.json` to `completed`.
8. **Check session completion**: If all tasks are `completed`, update session status to `completed`.
9. **Release lock**: `rm -rf "<state_dir>/lock.d"`.
10. **Report success**: Confirm merge, show remaining tasks, suggest `/wt-cleanup` if all done.

See `references/executor-workflow.md` for error handling details and conflict resolution guidance.

### /wt-status Command

Display current task status and overall session progress:

1. Read `.worktree-flow-command.md` frontmatter.
2. Read `<state_dir>/session.json` for session overview.
3. Read current task `status.json` for detailed task info.
4. Read all task `status.json` files for complete session status.
5. Check if lock exists: `test -d "<state_dir>/lock.d"`.

Format output as:

```
Worktree Flow Status

Session: 20260204-fastlane-revenuecat-i18n
Base: main
Created: 2026-02-04 10:30

Current Task: integrate-fastlane
├─ Status: in_progress
├─ Commits: 5
└─ Last commit: abc1234

All Tasks:
┌──────────────────────┬─────────────┬─────────┬─────────────────────────────┐
│ Task                 │ Status      │ Commits │ Branch                      │
├──────────────────────┼─────────────┼─────────┼─────────────────────────────┤
│ integrate-fastlane   │ in_progress │ 5       │ wt/20260204/integrate-fast… │
│ integrate-revenuecat │ completed   │ 3       │ wt/20260204/integrate-reve… │
│ add-i18n             │ pending     │ 0       │ wt/20260204/add-i18n        │
└──────────────────────┴─────────────┴─────────┴─────────────────────────────┘

Lock: Not held

Progress: 1/3 tasks completed (33%)
```

## Error Handling

Handle common error scenarios gracefully:

| Scenario | Detection | Recovery |
|----------|-----------|----------|
| Branch already exists | `git worktree add` exits non-zero with "already exists" | Append numeric suffix (e.g., `-2`) or prompt user for alternative name |
| Worktree path exists | `git worktree add` exits non-zero with "already exists" | Check if from previous session; offer cleanup or alternate path |
| Lock contention | `mkdir lock.d` exits non-zero | Read `lock.d/owner`, report holding task, suggest user retry later |
| Stale lock | `lock.d` exists but owning task is `completed` | Detect via status comparison; offer force-release option |
| Rebase conflict | `git rebase` exits non-zero with conflict markers | Show conflicting files, guide resolution, support `--continue` or `--abort` |
| FF-only merge fails | `git merge --ff-only` exits non-zero | Rebase incomplete or ref moved unexpectedly; re-attempt rebase or report |
| State dir inaccessible | `stat` or `cat` on state files fails | Verify `base_worktree_path` is mounted/accessible; report error with path |
| Command file malformed | YAML parse fails | Report parse error with line number; suggest regenerating via coordinator |
| Worktree removal fails | `git worktree remove` exits non-zero with "changes" | Use `--force` flag or ask user to commit/discard first |

## Resources

Detailed specifications and workflows:

- **`references/state-formats.md`**: Complete schemas for session.json, status.json, .worktree-flow-command.md, and lock mechanism
- **`references/coordinator-workflow.md`**: Task decomposition strategies, conflict risk assessment matrix format, user confirmation flow, and worktree creation sequences
- **`references/executor-workflow.md`**: Detailed activation sequence, commit message protocol (first vs. subsequent), merge-back protocol with step-by-step error handling, and stale lock detection
- **`references/git-operations.md`**: Every git command used by the skill with explanations: worktree add/remove/list/prune, branch create/delete, info/exclude configuration, rebase, merge ff-only

Slash command templates in `assets/templates/` provide the executable definitions for `/wt-commit`, `/wt-done`, `/wt-status`, and `/wt-cleanup`.
