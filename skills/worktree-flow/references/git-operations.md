# Git Operations Reference

Complete documentation of every git command used by the worktree-flow skill, organized by workflow phase.

## Coordinator Operations

### Get Project Directory Name

```bash
PROJECT_DIR=$(basename "$(pwd)")
```

Used to construct worktree directory names in consistent format.

### Generate Session Date

```bash
SESSION_DATE=$(date +%Y%m%d)
```

Used in session IDs and branch names. Format: YYYYMMDD (e.g., `20260204`).

### Get Git Common Directory

```bash
GIT_COMMON_DIR=$(git rev-parse --git-common-dir)
```

Returns the path to the common git directory shared by all worktrees. Used to access shared `info/exclude`.

**Why this works**: All worktrees in a repository share the same git object database and refs. The common directory contains:
- `info/exclude` (shared exclusions)
- `refs/` (shared branch refs)
- `objects/` (shared object database)
- `config` (shared repository config)

### Configure Git Exclusions

```bash
GIT_COMMON_DIR=$(git rev-parse --git-common-dir)

# Add .worktree-flow/ directory exclusion (idempotent)
grep -qxF '.worktree-flow/' "$GIT_COMMON_DIR/info/exclude" 2>/dev/null || \
  echo '.worktree-flow/' >> "$GIT_COMMON_DIR/info/exclude"

# Add .worktree-flow-command.md file exclusion (idempotent)
grep -qxF '.worktree-flow-command.md' "$GIT_COMMON_DIR/info/exclude" 2>/dev/null || \
  echo '.worktree-flow-command.md' >> "$GIT_COMMON_DIR/info/exclude"
```

**Explanation**:
- `grep -qxF`: Quiet, exact match, fixed string (no regex). Checks if line already exists.
- `2>/dev/null`: Suppress errors if file doesn't exist yet.
- `||`: Only append if grep found no match (exit code non-zero).
- This is idempotent: safe to run multiple times without creating duplicates.

**Important**: This configuration covers ALL worktrees because `info/exclude` is located in `$GIT_COMMON_DIR`, not `$GIT_DIR`. Each linked worktree's `$GIT_DIR/info/` is ignored in favor of the shared `$GIT_COMMON_DIR/info/`.

### Create Worktree with Branch

```bash
PROJECT_DIR=$(basename "$(pwd)")
TASK_SLUG="integrate-fastlane"  # Slugified task name
BRANCH="wt/$(date +%Y%m%d)/${TASK_SLUG}"
WORKTREE_PATH="../${PROJECT_DIR}-wt-${TASK_SLUG}"
BASE_BRANCH="main"

git worktree add -b "$BRANCH" "$WORKTREE_PATH" "$BASE_BRANCH"
```

**Explanation**:
- `-b "$BRANCH"`: Create new branch with specified name.
- `"$WORKTREE_PATH"`: Directory for the new worktree (relative or absolute).
- `"$BASE_BRANCH"`: Branch to use as starting point.

**What this does**:
1. Creates a new branch `wt/YYYYMMDD/integrate-fastlane` from `main`.
2. Creates directory `../myproject-wt-integrate-fastlane/`.
3. Checks out the new branch in that directory.
4. Links the new worktree to the main repository.

**Error handling**:
- Exit code 128: Branch already exists or path already exists.
- Check error message to distinguish between causes.
- Recovery: Append `-2` suffix or prompt user for alternative.

### List All Worktrees

```bash
git worktree list
```

Output format:
```
/path/to/main-worktree  abc1234 [main]
/path/to/worktree-1     def5678 [wt/20260204/task-1]
/path/to/worktree-2     ghi9012 [wt/20260204/task-2]
```

First column: Absolute path
Second column: Current commit SHA
Third column: Current branch (in brackets)

### Verify Worktree Creation

```bash
if git worktree list | grep -q "$WORKTREE_PATH"; then
  echo "Worktree created successfully"
else
  echo "Failed to create worktree"
  exit 1
fi
```

### Create Directory in Worktree

```bash
mkdir -p "$WORKTREE_PATH/.claude/commands"
```

Creates `.claude/commands/` directory for slash command files.

## Executor Operations

### Get Current Branch Name

```bash
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
```

Returns the current branch name (e.g., `wt/20260204/integrate-fastlane`).

### Get Repository Root

```bash
REPO_ROOT=$(git rev-parse --show-toplevel)
```

Returns absolute path to the repository root directory. Useful for constructing absolute paths.

### Stage All Changes

```bash
git add -A
```

Stages all changes (new files, modifications, deletions) in the entire working tree.

**Why this is safe**: `.worktree-flow-command.md` is excluded via `info/exclude`, so it won't be staged even though it exists in the working tree.

### Check for Uncommitted Changes

```bash
if ! git diff-index --quiet HEAD --; then
  echo "Uncommitted changes detected"
fi
```

**Explanation**:
- `git diff-index --quiet HEAD --`: Exits 0 if working tree matches HEAD, non-zero if changes exist.
- Use this before `/wt-done` to ensure clean state.

### Create Commit

**First commit (with full command content)**:

```bash
# Read the command file content
COMMAND_CONTENT=$(cat .worktree-flow-command.md)

# Extract task name and session ID from frontmatter
# (In practice, use proper YAML parsing or grep)
TASK_NAME="integrate-fastlane"
SESSION_ID="20260204-integrate-fastlane-and-revenuecat"

# Create commit message
git commit -m "$(cat <<EOF
[worktree-flow] ${TASK_NAME}: initial implementation

Task Command:
${COMMAND_CONTENT}
EOF
)"
```

**Subsequent commits (with summary)**:

```bash
TASK_NAME="integrate-fastlane"
SESSION_ID="20260204-integrate-fastlane-and-revenuecat"
SUMMARY="Add snapshot configuration and test lanes"

git commit -m "$(cat <<EOF
[worktree-flow] ${TASK_NAME}: ${SUMMARY}

session: ${SESSION_ID}
task: ${TASK_NAME}
EOF
)"
```

**Alternative using heredoc with -m**:

```bash
git commit -F - <<EOF
[worktree-flow] integrate-fastlane: Add snapshot configuration

session: 20260204-integrate-fastlane-and-revenuecat
task: integrate-fastlane
EOF
```

### Get Last Commit Hash

```bash
LAST_COMMIT=$(git rev-parse HEAD)
```

Returns full SHA-1 hash of HEAD commit.

For short hash:
```bash
LAST_COMMIT_SHORT=$(git rev-parse --short HEAD)
```

### Count Commits on Current Branch

```bash
# Count commits since branching from base
COMMIT_COUNT=$(git rev-list --count HEAD ^main)
```

**Alternative using log**:

```bash
# Count all commits on current branch
COMMIT_COUNT=$(git rev-list --count HEAD)
```

**Note**: The first method (with `^main`) counts only commits unique to this branch, which is more accurate for worktree-flow.

### Rebase onto Base Branch

```bash
BASE_BRANCH="main"

git rebase "$BASE_BRANCH"
```

**What this does**:
1. Finds the common ancestor of current branch and base branch.
2. Replays current branch's commits on top of base branch's HEAD.
3. Creates new commit objects (new SHAs) with identical changes.

**If conflicts occur**:

```bash
# Show conflicting files
git diff --name-only --diff-filter=U

# After resolving conflicts
git add <resolved-files>
git rebase --continue

# Or abort
git rebase --abort
```

**Why this works across worktrees**: Branch refs are shared via `$GIT_COMMON_DIR/refs/`. When executor A merges into `main`, the `refs/heads/main` ref updates immediately. Executor B sees the updated `main` ref when it runs `git rebase main`.

### Check if Rebase is in Progress

```bash
if [ -d "$(git rev-parse --git-dir)/rebase-merge" ] || \
   [ -d "$(git rev-parse --git-dir)/rebase-apply" ]; then
  echo "Rebase in progress"
fi
```

### Merge into Base Branch from Another Worktree

```bash
BASE_WORKTREE_PATH="/path/to/main-worktree"
FEATURE_BRANCH="wt/20260204/integrate-fastlane"

git -C "$BASE_WORKTREE_PATH" merge --ff-only "$FEATURE_BRANCH"
```

**Explanation**:
- `git -C <path>`: Run git command in specified directory.
- `merge --ff-only`: Only merge if it can be done as fast-forward (no merge commit).
- `"$FEATURE_BRANCH"`: The branch to merge (by name, not path).

**Why this works**:
1. All worktrees share the same refs via `$GIT_COMMON_DIR/refs/`.
2. After rebase, `FEATURE_BRANCH` is descendant of `main` (fast-forwardable).
3. The merge command updates `refs/heads/main` to point to `FEATURE_BRANCH`'s HEAD.
4. All worktrees see the updated `main` immediately because refs are shared.

**If merge fails**:
- Exit code 128: Not fast-forwardable (rebase incomplete or concurrent update).
- Exit code 1: Other error (branch doesn't exist, etc.).

### Update Local Base Branch Ref (Alternative Method)

```bash
# Not needed in worktree-flow because refs are shared
# But for reference, here's how to update a local ref:
git update-ref refs/heads/main refs/heads/wt/20260204/integrate-fastlane
```

**Note**: In worktree-flow, use `git -C` merge instead. This method is mentioned for completeness.

## Cleanup Operations

### Remove Worktree (Safe)

```bash
WORKTREE_PATH="../myproject-wt-integrate-fastlane"

git worktree remove "$WORKTREE_PATH"
```

**Requires**:
- Worktree has no uncommitted changes.
- Worktree has no untracked files (or use `--force`).

**Error handling**:
- Exit code 128: Worktree has changes or doesn't exist.

### Remove Worktree (Force)

```bash
git worktree remove --force "$WORKTREE_PATH"
```

**Use when**:
- User confirms discarding changes.
- Worktree is in inconsistent state.
- Cancelling incomplete task.

### Delete Branch (Safe)

```bash
BRANCH="wt/20260204/integrate-fastlane"

git branch -d "$BRANCH"
```

**Requires**:
- Branch is fully merged into HEAD or upstream.

**Error handling**:
- Exit code 1: Branch not fully merged.
- Shows warning with unmerged commits.

### Delete Branch (Force)

```bash
git branch -D "$BRANCH"
```

**Use when**:
- Task was cancelled before merging.
- Force cleanup after task abandonment.
- User confirms discarding unmerged work.

### Prune Worktree Administrative Files

```bash
git worktree prune
```

**What this does**:
- Removes administrative files in `$GIT_COMMON_DIR/worktrees/` for worktrees that no longer exist on disk.
- Run after manual deletion of worktree directories.
- Safe to run anytime; only cleans up orphaned metadata.

### List Worktrees (Verify Cleanup)

```bash
git worktree list
```

After cleanup, should not show removed worktrees.

## Lock Operations

### Acquire Lock (Atomic)

```bash
STATE_DIR="/path/to/.worktree-flow/20260204-session"

if mkdir "$STATE_DIR/lock.d" 2>/dev/null; then
  echo "Lock acquired"
else
  echo "Lock already held"
  exit 1
fi
```

**Why this is atomic**: On most filesystems, `mkdir` is an atomic operation. Either:
- The directory doesn't exist, `mkdir` succeeds, lock acquired.
- The directory exists, `mkdir` fails, lock held by another.

**Race condition free**: Two executors cannot both acquire the lock. One will succeed, the other will fail.

### Write Lock Owner

```bash
TASK_NAME="integrate-fastlane"
echo "$TASK_NAME" > "$STATE_DIR/lock.d/owner"
```

Do this immediately after successful lock acquisition.

### Read Lock Owner

```bash
if [ -f "$STATE_DIR/lock.d/owner" ]; then
  LOCK_OWNER=$(cat "$STATE_DIR/lock.d/owner")
  echo "Lock held by: $LOCK_OWNER"
fi
```

### Release Lock

```bash
rm -rf "$STATE_DIR/lock.d"
```

**Important**: Use `rm -rf` (not just `rmdir`) to remove the directory and its contents (the `owner` file).

### Check Lock Status

```bash
if [ -d "$STATE_DIR/lock.d" ]; then
  echo "Lock is held"
  if [ -f "$STATE_DIR/lock.d/owner" ]; then
    echo "Owner: $(cat "$STATE_DIR/lock.d/owner")"
  fi
else
  echo "Lock is free"
fi
```

## Status Query Operations

### Get Current Worktree Path

```bash
WORKTREE_PATH=$(git rev-parse --show-toplevel)
```

Returns absolute path to current worktree root.

### Check if File is Tracked

```bash
FILE=".worktree-flow-command.md"

if git ls-files --error-unmatch "$FILE" >/dev/null 2>&1; then
  echo "File is tracked"
else
  echo "File is not tracked"
fi
```

Verify that command file is excluded (should not be tracked).

### Show Files Staged for Commit

```bash
git diff --cached --name-only
```

Lists files in the staging area. Use before commit to verify `.worktree-flow-command.md` is not staged.

### Show Conflicting Files During Rebase

```bash
git diff --name-only --diff-filter=U
```

Lists files with unresolved conflicts during rebase.

### Get Merge Base

```bash
BASE_BRANCH="main"
MERGE_BASE=$(git merge-base HEAD "$BASE_BRANCH")
```

Returns the common ancestor commit. Useful for analyzing rebase distance.

### Count Commits Since Merge Base

```bash
BASE_BRANCH="main"
COMMITS_AHEAD=$(git rev-list --count HEAD ^"$BASE_BRANCH")
```

Shows how many commits the current branch has that base branch doesn't.

## Error Recovery Operations

### Abort Rebase

```bash
git rebase --abort
```

Restores working tree and branch to state before rebase started.

### Reset to Remote Branch

```bash
# If things go very wrong, reset to base branch
git reset --hard main
```

**Warning**: Discards all local commits and changes. Only use as last resort.

### Recover Deleted Branch

```bash
# Find commit SHA from reflog
git reflog

# Recreate branch
git branch wt/20260204/integrate-fastlane <commit-sha>
```

Useful if branch was accidentally force-deleted before merge.

### Check Repository Integrity

```bash
git fsck
```

Verifies repository integrity. Run if corruption suspected.

## Debugging Commands

### Show Worktree Details

```bash
git worktree list --porcelain
```

Output format (machine-readable):
```
worktree /path/to/main
HEAD abc1234567890abcdef1234567890abcdef12345
branch refs/heads/main

worktree /path/to/worktree-1
HEAD def5678901234567890abcdef1234567890abcd
branch refs/heads/wt/20260204/task-1
```

### Show Git Config

```bash
git config --list --show-origin
```

Shows all config values with their source files. Useful for debugging config issues.

### Show Refs

```bash
# All refs
git show-ref

# Branches only
git show-ref --heads

# Specific branch
git show-ref refs/heads/wt/20260204/integrate-fastlane
```

### Verify Shared Git Directory

```bash
# In main worktree
git rev-parse --git-dir
# Output: .git

git rev-parse --git-common-dir
# Output: .git

# In linked worktree
cd ../myproject-wt-integrate-fastlane
git rev-parse --git-dir
# Output: /path/to/main/.git/worktrees/myproject-wt-integrate-fastlane

git rev-parse --git-common-dir
# Output: /path/to/main/.git
```

This confirms that linked worktrees use the shared common directory.

## Complete Workflow Command Sequence

### Coordinator: Create Session

```bash
# 1. Get project name
PROJECT_DIR=$(basename "$(pwd)")
SESSION_ID="20260204-integrate-fastlane-and-revenuecat"

# 2. Create state directory
mkdir -p ".worktree-flow/$SESSION_ID/integrate-fastlane"
mkdir -p ".worktree-flow/$SESSION_ID/integrate-revenuecat"

# 3. Configure git exclusions (one-time)
GIT_COMMON_DIR=$(git rev-parse --git-common-dir)
grep -qxF '.worktree-flow/' "$GIT_COMMON_DIR/info/exclude" 2>/dev/null || \
  echo '.worktree-flow/' >> "$GIT_COMMON_DIR/info/exclude"
grep -qxF '.worktree-flow-command.md' "$GIT_COMMON_DIR/info/exclude" 2>/dev/null || \
  echo '.worktree-flow-command.md' >> "$GIT_COMMON_DIR/info/exclude"

# 4. Create worktrees
git worktree add -b "wt/20260204/integrate-fastlane" \
  "../${PROJECT_DIR}-wt-integrate-fastlane" main
git worktree add -b "wt/20260204/integrate-revenuecat" \
  "../${PROJECT_DIR}-wt-integrate-revenuecat" main

# 5. Verify
git worktree list
```

### Executor: Work and Commit

```bash
# 1. Verify command file exists
test -f .worktree-flow-command.md || echo "Not in executor mode"

# 2. Work on implementation
# ... make changes ...

# 3. Stage and commit
git add -A
git commit -m "[worktree-flow] integrate-fastlane: Add fastlane configuration

session: 20260204-integrate-fastlane-and-revenuecat
task: integrate-fastlane"
```

### Executor: Merge Back

```bash
# 1. Read metadata from command file
STATE_DIR="/path/to/.worktree-flow/20260204-integrate-fastlane-and-revenuecat"
BASE_WORKTREE_PATH="/path/to/main-worktree"
BASE_BRANCH="main"
TASK_NAME="integrate-fastlane"

# 2. Commit final changes
git add -A
git commit -m "[worktree-flow] integrate-fastlane: Final implementation

session: 20260204-integrate-fastlane-and-revenuecat
task: integrate-fastlane"

# 3. Acquire lock
mkdir "$STATE_DIR/lock.d" || { echo "Lock held"; exit 1; }
echo "$TASK_NAME" > "$STATE_DIR/lock.d/owner"

# 4. Rebase
git rebase "$BASE_BRANCH" || { rm -rf "$STATE_DIR/lock.d"; exit 1; }

# 5. Merge
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
git -C "$BASE_WORKTREE_PATH" merge --ff-only "$CURRENT_BRANCH" || {
  rm -rf "$STATE_DIR/lock.d"
  exit 1
}

# 6. Release lock
rm -rf "$STATE_DIR/lock.d"

echo "Successfully merged to $BASE_BRANCH"
```

### Coordinator: Cleanup

```bash
SESSION_ID="20260204-integrate-fastlane-and-revenuecat"

# 1. Remove worktrees
git worktree remove ../myproject-wt-integrate-fastlane
git worktree remove ../myproject-wt-integrate-revenuecat

# 2. Delete branches
git branch -d wt/20260204/integrate-fastlane
git branch -d wt/20260204/integrate-revenuecat

# 3. Prune
git worktree prune

# 4. Verify
git worktree list
```

This reference covers all git operations used by worktree-flow, with explanations of why they work and how to handle errors.
