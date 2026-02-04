---
description: Commit current worktree-flow task work
allowed-tools: Read, Bash(git:*), Write, Edit, Grep, Glob
---

Execute the commit workflow for the current worktree-flow task.

Read `.worktree-flow-command.md` to extract session metadata:
- `session_id`
- `task_name`
- `state_dir`

Read `<state_dir>/<task_name>/status.json` to determine the current `commit_count`.

Stage all changes:
```bash
git add -A
```

Note: `.worktree-flow-command.md` is already excluded via `$(git rev-parse --git-common-dir)/info/exclude`, so it won't be staged.

Check if there are staged changes:
```bash
git diff-index --quiet --cached HEAD --
```

If no staged changes, report "No changes to commit" and exit.

**If commit_count is 0** (first commit):
- Read the full content of `.worktree-flow-command.md`
- Create a commit message with:
  - First line: `[worktree-flow] <task_name>: initial implementation`
  - Blank line
  - `Task Command:`
  - Full content of `.worktree-flow-command.md`

**If commit_count > 0** (subsequent commits):
- Ask user for a brief summary of the changes
- Create a commit message with:
  - First line: `[worktree-flow] <task_name>: <user-provided summary>`
  - Blank line
  - `session: <session_id>`
  - `task: <task_name>`

After committing:
1. Get the last commit hash: `git rev-parse HEAD`
2. Update `<state_dir>/<task_name>/status.json`:
   - Increment `commit_count`
   - Set `last_commit_hash` to the new commit hash
   - If `started_at` is `null`, set it to current timestamp

Report the commit hash and updated commit count to the user.
