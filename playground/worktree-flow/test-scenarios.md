# Detailed Test Scenarios for Worktree Flow

## Scenario 1: Happy Path - Clean Parallel Workflow

**Goal**: Verify end-to-end workflow with no conflicts.

**Initial State**:
```
project/
├── src/
│   ├── auth.js    (existing)
│   └── api.js     (existing)
└── README.md      (existing)
```

**User Request**:
"I need to add error handling to auth.js and add rate limiting to api.js"

**Expected Behavior**:

1. Coordinator analyzes and identifies 2 independent tasks
2. Conflict assessment shows LOW risk (different files)
3. Creates worktrees:
   - `../project-wt-add-error-handling/` on branch `wt/YYYYMMDD/add-error-handling`
   - `../project-wt-add-rate-limiting/` on branch `wt/YYYYMMDD/add-rate-limiting`
4. Generates command files in each worktree
5. User opens Claude Code in both worktrees simultaneously
6. Both executors work independently
7. Both complete with `/wt-done` (no conflicts)
8. Both merge successfully
9. User runs `/wt-cleanup` in base worktree
10. All worktrees and branches removed

**Verification**:
- Check `git log --oneline --graph` shows linear history
- Both features merged to main
- No merge commits
- No leftover worktrees: `git worktree list`

---

## Scenario 2: Conflict Resolution - README Overlap

**Goal**: Test conflict detection and resolution workflow.

**User Request**:
"Add installation instructions to README and add usage examples to README"

**Expected Behavior**:

1. Coordinator identifies HIGH risk (both modify README.md)
2. Suggests: "Complete installation task first, then usage task rebases"
3. User confirms
4. Task 1 (installation) completes and merges
5. Task 2 (usage) rebases → conflict in README.md
6. Executor shows conflicting files and guides resolution
7. User resolves, `git rebase --continue`, retries `/wt-done`
8. Merge succeeds

**Verification**:
- Final README.md contains both changes
- Git history shows both task branches
- No corrupted merge state

---

## Scenario 3: Lock Contention

**Goal**: Verify atomic lock mechanism prevents concurrent merges.

**Setup**:
- 2 tasks both ready to merge
- Simulate: Start `/wt-done` in task 1, immediately start `/wt-done` in task 2

**Expected Behavior**:

Task 1:
- Acquires lock
- Writes to `lock.d/owner`
- Proceeds with rebase

Task 2:
- Attempts `mkdir lock.d` → fails
- Reads `lock.d/owner` → sees "add-error-handling"
- Reports: "Lock held by add-error-handling. Retry later."
- Exits cleanly

After Task 1 completes:
- Releases lock
- Task 2 retries `/wt-done` → succeeds

**Verification**:
- Only one merge occurs at a time
- No race conditions
- Both tasks eventually complete

---

## Scenario 4: Cancellation Workflow

**Goal**: Test cleanup of incomplete tasks.

**Setup**:
- Session with 3 tasks
- Complete task 1
- Start but don't finish task 2
- Never start task 3

**Test Steps**:

1. User decides to cancel:
   ```
   > /wt-cleanup
   ```

2. Coordinator warns:
   ```
   Session has incomplete tasks:
     ● add-feature-b (in_progress, 2 commits)
     ○ add-feature-c (pending)

   Cancel and clean up? (y/n)
   ```

3. User confirms "y"

4. Coordinator:
   - Removes all worktrees (force for task 2 if dirty)
   - Deletes branches: `-d` for task 1, `-D` for tasks 2 and 3
   - Marks session as `cancelled`

**Verification**:
- All worktrees removed: `git worktree list`
- All branches deleted: `git branch -a`
- Session status is `cancelled` in session.json

---

## Scenario 5: Environment Setup

**Goal**: Test setup command execution.

**Setup**:
- Node.js project requiring dependencies

**User Request**:
"Add TypeScript support and add ESLint configuration"

**Expected Behavior**:

Coordinator generates task 1 with setup commands:
```markdown
## Setup Commands
npm install -D typescript @types/node
npx tsc --init
```

Executor in task 1 worktree:
- Detects setup commands
- Asks: "Run setup commands? (y/n)"
- Executes: `npm install -D typescript @types/node && npx tsc --init`
- Reports success
- Proceeds with task

**Verification**:
- Dependencies installed in worktree
- tsconfig.json created
- Task implementation proceeds smoothly

---

## Scenario 6: Large Session (4+ Tasks)

**Goal**: Test scalability with many parallel tasks.

**User Request**:
"Add 5 new API endpoints: users, posts, comments, likes, notifications"

**Expected Behavior**:

1. Coordinator creates 5 tasks (one per endpoint)
2. Conflict assessment shows LOW risk (each endpoint in separate file)
3. User opens 5 Claude Code instances (or works on them serially)
4. Tasks complete in any order
5. Lock ensures merges happen one at a time
6. Progress: 0/5 → 1/5 → ... → 5/5
7. Cleanup removes all 5 worktrees

**Verification**:
- All 5 endpoints merged to main
- Git history is linear (no merge commits)
- No state corruption despite many tasks

---

## Scenario 7: Rebase Abort

**Goal**: Test abortion of rebase during `/wt-done`.

**Test Steps**:

1. Executor runs `/wt-done`
2. Rebase conflicts occur
3. User decides not to resolve now
4. User runs: `git rebase --abort`

**Expected Behavior**:

- Executor detects rebase abort
- Releases lock: `rm -rf lock.d`
- Reports: "Rebase aborted. Lock released. Retry /wt-done when ready."
- Task status remains `in_progress`

**Verification**:
- Lock is released (other tasks can proceed)
- Task can retry `/wt-done` later
- No corrupted state

---

## Scenario 8: Session Status Monitoring

**Goal**: Test coordinator's ability to monitor ongoing work.

**Setup**:
- Session with 3 tasks at different stages

**Test Steps**:

1. Coordinator runs `/wt-status` repeatedly:
   - Initially: all pending
   - After executor 1 starts: 1 in_progress, 2 pending
   - After executor 1 commits: check commit_count updates
   - After executor 1 merges: 1 completed, 1 in_progress, 1 pending

**Expected Behavior**:
- Status display updates reflect current state
- Commit counts accurate
- Lock status shown when held
- Progress percentage calculates correctly

**Verification**:
- All status transitions visible
- Data matches state files

---

## Scenario 9: Scope Boundary Violation

**Goal**: Test executor staying within defined scope.

**Setup**:
- Task with explicit "Files NOT to Touch" list

**Test Steps**:

1. User asks executor to modify a file in the exclusion list
2. Executor checks scope from command file
3. Reports: "That file is marked as 'NOT to Touch' (owned by another task)"
4. Suggests: "Coordinate with the other task or update task boundaries"

**Expected Behavior**:
- Executor enforces scope boundaries
- Warns before violating scope
- Offers coordination strategies

---

## Scenario 10: Multi-Session Cleanup

**Goal**: Test cleanup when multiple sessions exist.

**Setup**:
- 2 completed sessions
- 1 in-progress session

**Test Steps**:

1. Run `/wt-cleanup` in base worktree
2. Coordinator lists sessions:
   ```
   Found 3 worktree-flow sessions:
   1. 20260201-feature-set-a (completed)
   2. 20260203-bugfixes (completed)
   3. 20260204-current-work (in_progress)

   Which session to clean up? (1-3, or 'all completed')
   ```

3. User selects "all completed"
4. Coordinator cleans up sessions 1 and 2, preserves session 3

**Verification**:
- Completed sessions cleaned up
- In-progress session unaffected
- State directories reflect cleanup

---

## Edge Cases

### Edge Case 1: Zero Commits Before /wt-done

Executor runs `/wt-done` without making any commits.

Expected:
- Detects no commits since branch creation
- Warns: "No commits made yet. Create at least one commit before merging."
- Does not proceed with merge

### Edge Case 2: Base Branch Advanced During Work

Another developer pushes to main while tasks are in progress.

Expected:
- Executor's rebase pulls latest changes from main
- Rebase succeeds (or conflicts are resolved)
- Merge proceeds normally

### Edge Case 3: Worktree Manually Deleted

User manually deletes a worktree directory without `git worktree remove`.

Expected:
- `/wt-cleanup` detects worktree doesn't exist
- Skips removal step
- Still deletes branch
- Runs `git worktree prune` to clean admin files

---

## Performance Tests

### Test Large File Changes

Create task modifying 100+ files.

Expected:
- Commit works normally
- Rebase handles large changeset
- Merge completes successfully

### Test Long-Running Session

Keep session open for several days with periodic commits.

Expected:
- State remains consistent
- Rebasing onto significantly advanced main branch works
- No state corruption over time

---

## Testing Tips

1. Use `git log --all --graph --oneline` to visualize branch history
2. Check state files with `cat .worktree-flow/*/session.json | jq .`
3. Verify exclusions with `git status --ignored`
4. Monitor lock with `ls -la .worktree-flow/*/lock.d`
5. Test cleanup with `git worktree list` before and after
6. Use `git reflog` to trace all ref updates
