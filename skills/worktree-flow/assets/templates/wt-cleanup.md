---
description: Clean up worktree-flow session (remove worktrees, branches, state)
allowed-tools: Read, Bash(git:*), Write, Edit, Grep, Glob
---

Clean up the worktree-flow session by removing worktrees, deleting branches, and archiving state.

**Note**: This command should be run from the **base worktree** (the main project directory), not from a task worktree.

Check if `.worktree-flow-command.md` exists in the current directory:
- If it exists, this is a task worktree. Report error:
  ```
  Error: /wt-cleanup must be run from the base worktree, not a task worktree.

  Navigate to the base worktree (usually the parent project directory) and run /wt-cleanup there.
  ```
- If it doesn't exist, proceed.

Detect active worktree-flow sessions by listing directories in `.worktree-flow/`:
```bash
ls -1 .worktree-flow/
```

If multiple sessions exist, ask user which session to clean up, or offer to clean up all completed sessions.

For the selected session, read `.worktree-flow/<session-id>/session.json`.

Check session status:
- If status is `"completed"`: Proceed with cleanup
- If status is `"in_progress"`: Warn user that not all tasks are complete. Show list of incomplete tasks. Ask for confirmation to cancel and clean up.
- If status is `"cancelled"`: Proceed with cleanup

## Cleanup Workflow

For each task in the session:

1. **Check if worktree exists**:
   ```bash
   git worktree list | grep "<worktree_path>"
   ```

2. **Remove worktree**:
   ```bash
   git worktree remove "<worktree_path>"
   ```

   If removal fails with "changes present" error:
   - Ask user: "Worktree has uncommitted changes. Force remove? (y/n)"
   - If yes: `git worktree remove --force "<worktree_path>"`
   - If no: Skip this worktree and report to user

3. **Delete branch**:
   - If task status is `"completed"` (merged): `git branch -d "<branch>"`
   - If task status is not completed (cancelled): `git branch -D "<branch>"`

   If branch deletion fails:
   - Report which branch failed and why
   - Suggest manual deletion if needed

4. **Log cleanup action**:
   - Note which worktrees were removed
   - Note which branches were deleted

After processing all tasks:

1. **Prune worktree administrative files**:
   ```bash
   git worktree prune
   ```

2. **Update session status**:
   - If all tasks were cleaned up successfully, mark session as `"completed"` (if not already)
   - Add a `cleaned_up_at` timestamp to session.json

3. **Optionally remove state directory**:
   - Ask user: "Remove session state directory (.worktree-flow/<session-id>)? (y/n)"
   - If yes: `rm -rf ".worktree-flow/<session-id>"`
   - If no: Keep for audit/history purposes

4. **Verify cleanup**:
   ```bash
   git worktree list
   ```
   Confirm that cleaned up worktrees no longer appear.

5. **Report summary**:
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Cleanup Complete
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Session: <session-id>

   Worktrees removed: X
   Branches deleted: Y
   State directory: [removed|preserved]

   Remaining worktrees: Z
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ```

## Error Handling

**Worktree removal fails**:
- Log the error
- Continue with other worktrees
- Report all failures at the end

**Branch deletion fails**:
- Usually means branch isn't fully merged
- For `completed` tasks, this indicates a problem (branch should be merged)
- For `pending` or `in_progress` tasks, use `-D` to force delete

**State directory issues**:
- If session.json is missing or corrupted, ask user to confirm session ID manually
- Proceed with cleanup based on git worktree list output

**Permission issues**:
- If cleanup commands fail with permission errors, report to user
- Suggest running with appropriate permissions or manual cleanup

## Safety Checks

Before any destructive operation:
- Verify you're in the base worktree (not a task worktree)
- Confirm session exists and is cleanable
- Warn if tasks are incomplete
- Get user confirmation for force operations
- Preserve session.json history unless explicitly requested to delete
