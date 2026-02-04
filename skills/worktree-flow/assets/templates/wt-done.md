---
description: Complete worktree-flow task - commit, rebase, merge back to base
allowed-tools: Read, Bash(git:*), Write, Edit, Grep, Glob
---

Execute the complete merge-back protocol to complete the current worktree-flow task.

Read `.worktree-flow-command.md` to extract:
- `session_id`
- `task_name`
- `base_branch`
- `base_worktree_path`
- `state_dir`

## Pre-checks

1. Check for uncommitted changes:
   ```bash
   git diff-index --quiet HEAD --
   ```
   If changes exist, run the `/wt-commit` workflow first to commit them.

2. Verify on correct branch:
   ```bash
   git rev-parse --abbrev-ref HEAD
   ```
   Compare with expected branch from task.

## Step 1: Acquire Lock

Attempt to acquire the lock atomically:
```bash
mkdir "<state_dir>/lock.d"
```

If this fails (exit code non-zero):
- Read `<state_dir>/lock.d/owner` to identify the lock owner
- Report to user: "Lock is held by task '<owner>'. Wait for it to complete and retry /wt-done."
- Exit without proceeding further

If successful:
- Write the current task name to `<state_dir>/lock.d/owner`
- Proceed to next step

## Step 2: Rebase onto Base Branch

Execute rebase:
```bash
git rebase <base_branch>
```

If rebase exits with non-zero status (conflicts detected):
- Display conflicting files: `git diff --name-only --diff-filter=U`
- Provide guidance to user:
  ```
  Rebase conflicts detected.

  Conflicting files:
  <list of files>

  To resolve:
  1. Edit conflicting files and resolve markers
  2. Stage resolved files: git add <files>
  3. Continue rebase: git rebase --continue
  4. Retry /wt-done

  Or abort: git rebase --abort (will release lock)
  ```
- **DO NOT release lock** - keep it held during conflict resolution
- Exit and wait for user to retry after resolution

If user wants to abort:
- Run `git rebase --abort`
- Release lock: `rm -rf "<state_dir>/lock.d"`
- Exit

If rebase succeeds, proceed to next step.

## Step 3: Merge into Base Branch

Execute fast-forward merge from the base worktree:
```bash
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
git -C "<base_worktree_path>" merge --ff-only "$CURRENT_BRANCH"
```

If merge fails (exit code non-zero):
- Report error: "Merge failed (not fast-forwardable). This should not happen after successful rebase."
- Suggest: "Possible cause: base branch updated during rebase. Retry rebase."
- Release lock: `rm -rf "<state_dir>/lock.d"`
- Exit

If merge succeeds, proceed to next step.

## Step 4: Update Task Status

Update `<state_dir>/<task_name>/status.json`:
- Set `status` to `"completed"`
- Set `completed_at` to current timestamp (ISO 8601 format)
- Set `merged_at` to current timestamp

## Step 5: Update Session Status

Update `<state_dir>/session.json`:
- Find the task entry matching `task_name`
- Update its `status` to `"completed"`

Check if all tasks are completed:
- Read all task statuses from `session.json`
- If all tasks have `status == "completed"`, update session `status` to `"completed"`

## Step 6: Release Lock

Remove the lock directory:
```bash
rm -rf "<state_dir>/lock.d"
```

## Step 7: Report Success

Display success message with:
- Task name
- Base branch merged to
- Total commit count for this task
- Remaining tasks (if any)

If all tasks completed:
- Display celebration: "🎉 All tasks completed!"
- Suggest: "Run /wt-cleanup in the base worktree to clean up worktrees and branches"

If tasks remain:
- List remaining tasks with their status
- Remind user they can continue working on other tasks
