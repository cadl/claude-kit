# Executor Workflow

Detailed guide for executor mode: activation, task execution, commit protocol, merge-back protocol, and status management.

## Activation Sequence

Execute when `.worktree-flow-command.md` exists in project root.

### Step 1: Detect Command File

```bash
if [ -f ".worktree-flow-command.md" ]; then
  echo "Executor mode: Command file detected"
else
  echo "Not in executor mode"
  exit 0
fi
```

Run this check at session start before any other operations.

### Step 2: Parse YAML Frontmatter

Extract metadata from command file:

```bash
# Parse using sed/awk or proper YAML parser
SESSION_ID=$(sed -n 's/^session_id: *//p' .worktree-flow-command.md)
TASK_NAME=$(sed -n 's/^task_name: *//p' .worktree-flow-command.md)
BASE_BRANCH=$(sed -n 's/^base_branch: *//p' .worktree-flow-command.md)
BASE_WORKTREE_PATH=$(sed -n 's/^base_worktree_path: *//p' .worktree-flow-command.md)
STATE_DIR=$(sed -n 's/^state_dir: *//p' .worktree-flow-command.md)
CREATED_AT=$(sed -n 's/^created_at: *//p' .worktree-flow-command.md)
```

**Validation**: Ensure all required fields are present and non-empty.

```bash
for VAR in SESSION_ID TASK_NAME BASE_BRANCH BASE_WORKTREE_PATH STATE_DIR; do
  if [ -z "${!VAR}" ]; then
    echo "Error: Missing required field: $VAR"
    exit 1
  fi
done
```

### Step 3: Verify State Directory Access

```bash
if [ ! -d "$STATE_DIR" ]; then
  echo "Error: State directory not accessible: $STATE_DIR"
  echo "Verify base worktree is mounted and paths are correct"
  exit 1
fi

if [ ! -f "$STATE_DIR/session.json" ]; then
  echo "Error: session.json not found in state directory"
  exit 1
fi
```

### Step 4: Read Task Status

```bash
STATUS_FILE="$STATE_DIR/$TASK_NAME/status.json"

if [ ! -f "$STATUS_FILE" ]; then
  echo "Error: status.json not found: $STATUS_FILE"
  exit 1
fi

# Parse current status
CURRENT_STATUS=$(jq -r '.status' "$STATUS_FILE")
COMMIT_COUNT=$(jq -r '.commit_count' "$STATUS_FILE")
STARTED_AT=$(jq -r '.started_at' "$STATUS_FILE")
```

### Step 5: Update Status if Pending

If this is the first activation (status is `pending`):

```bash
if [ "$CURRENT_STATUS" = "pending" ]; then
  # Update to in_progress
  TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S%z")

  jq --arg ts "$TIMESTAMP" \
    '.status = "in_progress" | .started_at = $ts' \
    "$STATUS_FILE" > "$STATUS_FILE.tmp"

  mv "$STATUS_FILE.tmp" "$STATUS_FILE"

  echo "✓ Task status updated to in_progress"
fi
```

### Step 6: Greet User

Display task summary and available commands:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Worktree Flow - Executor Mode
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Task: integrate-fastlane
Session: 20260204-fastlane-revenuecat-i18n
Status: in_progress (started just now)

Objective:
  Integrate fastlane into the project to automate App Store
  releases, screenshot generation, and metadata management.

Review full task plan: .worktree-flow-command.md

Available Commands:
  /wt-commit  - Commit current work
  /wt-done    - Complete task and merge back to main
  /wt-status  - Show task and session status

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Task Execution Guidelines

Follow the implementation plan while respecting boundaries.

### Read Task Plan

Parse the markdown body of `.worktree-flow-command.md`:

```bash
# Extract sections using sed/awk
# In practice, Claude reads the file directly
cat .worktree-flow-command.md
```

**Key sections to review**:
1. **Objective**: Understand the goal.
2. **Requirements**: Know what must be delivered.
3. **Plan**: Follow step-by-step implementation.
4. **Scope**: Stay within file boundaries.
5. **Conflict Zones**: Be aware of coordination needs.
6. **Setup Commands**: Run before starting work.
7. **Acceptance Criteria**: Track completion checklist.

### Execute Setup Commands

If the task includes setup commands:

```bash
# Example from command file
bundle install
fastlane --version
```

Run these before beginning implementation. Report any setup failures to user.

### Respect Scope Boundaries

**DO modify/create**:
- Files listed under "Files to Create"
- Files listed under "Files to Modify"

**DO NOT modify**:
- Files listed under "Files NOT to Touch"
- Files outside the documented scope
- Files owned by other tasks

**If scope expansion needed**:
- Report to user that additional files need modification.
- Suggest updating task plan or coordinating with other tasks.
- Get explicit approval before expanding scope.

### Monitor Conflict Zones

For files listed in "Conflict Zones":
- Make changes conservatively.
- Document changes clearly in commits.
- Coordinate timing with other tasks if possible.
- Test thoroughly to avoid breaking changes.

### Track Progress

Periodically check progress against **Acceptance Criteria**:
- Mark criteria as you complete them.
- If a criterion seems unreachable, report to user.
- Verify all criteria before considering task complete.

## Commit Protocol

Structure commits to maintain clear history and enable proper merge-back.

### Determine Commit Type

```bash
STATUS_FILE="$STATE_DIR/$TASK_NAME/status.json"
COMMIT_COUNT=$(jq -r '.commit_count' "$STATUS_FILE")

if [ "$COMMIT_COUNT" -eq 0 ]; then
  COMMIT_TYPE="first"
else
  COMMIT_TYPE="subsequent"
fi
```

### First Commit Format

Include full command file content in commit message:

```bash
# Read command file
COMMAND_CONTENT=$(cat .worktree-flow-command.md)

# Generate summary line (user-provided or auto-generated)
SUMMARY="[worktree-flow] $TASK_NAME: initial implementation"

# Create commit message
git commit -F - <<EOF
$SUMMARY

Task Command:
$COMMAND_CONTENT
EOF
```

**Why include full content**:
- Creates permanent record of task specification in git history.
- Reviewers can understand context without external files.
- Useful for audit trail and retrospectives.

### Subsequent Commit Format

Include only summary and metadata:

```bash
SUMMARY="Add fastlane snapshot configuration and test lanes"

git commit -m "[worktree-flow] $TASK_NAME: $SUMMARY

session: $SESSION_ID
task: $TASK_NAME"
```

**Format rules**:
- First line: `[worktree-flow] <task-name>: <summary>`
- Blank line
- Metadata: `session: <id>` and `task: <name>`
- Keep summary line under 72 characters if possible

### Update Status After Commit

```bash
# Get last commit hash
LAST_COMMIT=$(git rev-parse HEAD)

# Increment commit count and update hash
jq --arg hash "$LAST_COMMIT" \
  '.commit_count += 1 | .last_commit_hash = $hash' \
  "$STATUS_FILE" > "$STATUS_FILE.tmp"

mv "$STATUS_FILE.tmp" "$STATUS_FILE"

echo "✓ Commit recorded: $LAST_COMMIT"
```

### /wt-commit Command Implementation

Complete implementation of the commit workflow:

```bash
#!/bin/bash

# Parse command file
SESSION_ID=$(sed -n 's/^session_id: *//p' .worktree-flow-command.md)
TASK_NAME=$(sed -n 's/^task_name: *//p' .worktree-flow-command.md)
STATE_DIR=$(sed -n 's/^state_dir: *//p' .worktree-flow-command.md)
STATUS_FILE="$STATE_DIR/$TASK_NAME/status.json"

# Check commit count
COMMIT_COUNT=$(jq -r '.commit_count' "$STATUS_FILE")

# Stage changes (command file is excluded via info/exclude)
git add -A

# Check if there are staged changes
if git diff-index --quiet --cached HEAD --; then
  echo "No changes to commit"
  exit 0
fi

# Generate commit message based on type
if [ "$COMMIT_COUNT" -eq 0 ]; then
  # First commit: include full command content
  COMMAND_CONTENT=$(cat .worktree-flow-command.md)
  SUMMARY="[worktree-flow] $TASK_NAME: initial implementation"

  git commit -F - <<EOF
$SUMMARY

Task Command:
$COMMAND_CONTENT
EOF
else
  # Subsequent commit: ask user for summary
  echo "Enter commit summary (describing changes):"
  read -r USER_SUMMARY

  git commit -m "[worktree-flow] $TASK_NAME: $USER_SUMMARY

session: $SESSION_ID
task: $TASK_NAME"
fi

# Update status.json
LAST_COMMIT=$(git rev-parse HEAD)
jq --arg hash "$LAST_COMMIT" \
  '.commit_count += 1 | .last_commit_hash = $hash' \
  "$STATUS_FILE" > "$STATUS_FILE.tmp"
mv "$STATUS_FILE.tmp" "$STATUS_FILE"

# Update started_at if null
STARTED_AT=$(jq -r '.started_at' "$STATUS_FILE")
if [ "$STARTED_AT" = "null" ]; then
  TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S%z")
  jq --arg ts "$TIMESTAMP" '.started_at = $ts' \
    "$STATUS_FILE" > "$STATUS_FILE.tmp"
  mv "$STATUS_FILE.tmp" "$STATUS_FILE"
fi

echo "✓ Committed: $LAST_COMMIT (commit #$((COMMIT_COUNT + 1)))"
```

## Merge-Back Protocol

Complete workflow for merging task back to base branch.

### Pre-Merge Checks

Before starting merge process:

```bash
# Ensure clean working tree
if ! git diff-index --quiet HEAD --; then
  echo "Uncommitted changes detected. Committing..."
  # Run /wt-commit logic
fi

# Verify on correct branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
EXPECTED_BRANCH=$(sed -n 's/^branch: *//p' "$STATUS_FILE")
if [ "$CURRENT_BRANCH" != "$(basename "$EXPECTED_BRANCH")" ]; then
  echo "Error: On wrong branch ($CURRENT_BRANCH), expected $EXPECTED_BRANCH"
  exit 1
fi
```

### Step 1: Acquire Lock

```bash
STATE_DIR=$(sed -n 's/^state_dir: *//p' .worktree-flow-command.md)
LOCK_DIR="$STATE_DIR/lock.d"
TASK_NAME=$(sed -n 's/^task_name: *//p' .worktree-flow-command.md)

# Attempt to acquire lock (atomic)
if mkdir "$LOCK_DIR" 2>/dev/null; then
  echo "✓ Lock acquired"
  echo "$TASK_NAME" > "$LOCK_DIR/owner"
else
  # Lock already held
  if [ -f "$LOCK_DIR/owner" ]; then
    LOCK_OWNER=$(cat "$LOCK_DIR/owner")
    echo "⏸ Lock held by: $LOCK_OWNER"
    echo "Wait for $LOCK_OWNER to complete /wt-done, then retry"
  else
    echo "⏸ Lock held (owner unknown)"
  fi
  exit 1
fi
```

**Lock contention handling**:
- Exit immediately if lock is held.
- Display lock owner to user.
- Suggest retrying after a delay.
- Do NOT wait/poll automatically (user controls retry timing).

### Step 2: Rebase onto Base Branch

```bash
BASE_BRANCH=$(sed -n 's/^base_branch: *//p' .worktree-flow-command.md)

echo "Rebasing onto $BASE_BRANCH..."
git rebase "$BASE_BRANCH"
REBASE_EXIT_CODE=$?

if [ $REBASE_EXIT_CODE -ne 0 ]; then
  echo "⚠️ Rebase conflicts detected"
  echo ""
  echo "Conflicting files:"
  git diff --name-only --diff-filter=U
  echo ""
  echo "Resolve conflicts, then run: git rebase --continue"
  echo "Or abort with: git rebase --abort"
  echo ""
  echo "After resolving, retry /wt-done"

  # DO NOT release lock - keep it held during conflict resolution
  # User will retry /wt-done after resolution
  exit 1
fi

echo "✓ Rebase successful"
```

**Conflict resolution flow**:
1. Display conflicting files.
2. Guide user to resolve conflicts manually.
3. Instruct to run `git rebase --continue`.
4. Keep lock held during resolution.
5. User retries `/wt-done` after resolution.

**If user aborts rebase**:
```bash
if [ -d "$(git rev-parse --git-dir)/rebase-merge" ]; then
  echo "Rebase in progress. Aborting..."
  git rebase --abort

  # Release lock
  rm -rf "$LOCK_DIR"
  echo "✓ Lock released"
  exit 1
fi
```

### Step 3: Merge into Base Branch

```bash
BASE_WORKTREE_PATH=$(sed -n 's/^base_worktree_path: *//p' .worktree-flow-command.md)
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo "Merging into $BASE_BRANCH..."
git -C "$BASE_WORKTREE_PATH" merge --ff-only "$CURRENT_BRANCH"
MERGE_EXIT_CODE=$?

if [ $MERGE_EXIT_CODE -ne 0 ]; then
  echo "✗ Merge failed (not fast-forwardable)"
  echo "This should not happen after successful rebase."
  echo "Possible causes:"
  echo "  - Base branch was updated during rebase (retry rebase)"
  echo "  - Worktree state inconsistency (check git status)"

  # Release lock
  rm -rf "$LOCK_DIR"
  echo "✓ Lock released"
  exit 1
fi

echo "✓ Merged to $BASE_BRANCH"
```

**Why ff-only works**: After successful rebase, the feature branch is a direct descendant of base branch, so merge is always fast-forwardable.

### Step 4: Update Task Status

```bash
STATUS_FILE="$STATE_DIR/$TASK_NAME/status.json"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S%z")

jq --arg ts "$TIMESTAMP" \
  '.status = "completed" | .completed_at = $ts | .merged_at = $ts' \
  "$STATUS_FILE" > "$STATUS_FILE.tmp"

mv "$STATUS_FILE.tmp" "$STATUS_FILE"

echo "✓ Task status updated to completed"
```

### Step 5: Update Session Status

```bash
SESSION_FILE="$STATE_DIR/session.json"

# Update task status in session.json
jq --arg task "$TASK_NAME" \
  '(.tasks[] | select(.task_name == $task) | .status) = "completed"' \
  "$SESSION_FILE" > "$SESSION_FILE.tmp"

mv "$SESSION_FILE.tmp" "$SESSION_FILE"

# Check if all tasks completed
ALL_COMPLETED=$(jq -r '[.tasks[].status] | all(. == "completed")' "$SESSION_FILE")

if [ "$ALL_COMPLETED" = "true" ]; then
  jq '.status = "completed"' "$SESSION_FILE" > "$SESSION_FILE.tmp"
  mv "$SESSION_FILE.tmp" "$SESSION_FILE"
  echo "✓ All tasks completed - session marked as completed"
fi
```

### Step 6: Release Lock

```bash
rm -rf "$LOCK_DIR"
echo "✓ Lock released"
```

### Step 7: Report Success

```bash
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Task Completed Successfully"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Task: $TASK_NAME"
echo "Merged to: $BASE_BRANCH"
echo "Commits: $COMMIT_COUNT"
echo ""

# Show remaining tasks
REMAINING=$(jq -r '[.tasks[] | select(.status != "completed")] | length' "$SESSION_FILE")

if [ "$REMAINING" -eq 0 ]; then
  echo "🎉 All tasks completed!"
  echo "Run /wt-cleanup in the base worktree to clean up"
else
  echo "Remaining tasks: $REMAINING"
  echo ""
  jq -r '.tasks[] | select(.status != "completed") | "  - \(.task_name) (\(.status))"' "$SESSION_FILE"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
```

## Error Handling

### Stale Lock Detection

Detect and recover from stale locks:

```bash
LOCK_DIR="$STATE_DIR/lock.d"

if [ -d "$LOCK_DIR" ]; then
  # Lock exists, check if stale
  LOCK_OWNER=$(cat "$LOCK_DIR/owner" 2>/dev/null)

  if [ -n "$LOCK_OWNER" ]; then
    # Check owner's status
    OWNER_STATUS=$(jq -r --arg task "$LOCK_OWNER" \
      '.tasks[] | select(.task_name == $task) | .status' \
      "$STATE_DIR/session.json")

    if [ "$OWNER_STATUS" = "completed" ] || [ "$OWNER_STATUS" = "failed" ]; then
      echo "⚠️ Stale lock detected"
      echo "Lock owner $LOCK_OWNER is $OWNER_STATUS"
      echo "Lock should have been released"
      echo ""
      echo "Force release lock? (y/n)"
      read -r RESPONSE

      if [ "$RESPONSE" = "y" ]; then
        rm -rf "$LOCK_DIR"
        echo "✓ Stale lock released"
        echo "Retry /wt-done"
      fi
    fi
  fi
fi
```

### State File Corruption

```bash
STATUS_FILE="$STATE_DIR/$TASK_NAME/status.json"

# Verify JSON is valid
if ! jq empty "$STATUS_FILE" 2>/dev/null; then
  echo "✗ status.json is corrupted or invalid JSON"
  echo "Manual recovery required:"
  echo "  1. Inspect $STATUS_FILE"
  echo "  2. Restore from backup or regenerate"
  exit 1
fi
```

### Base Worktree Inaccessible

```bash
BASE_WORKTREE_PATH=$(sed -n 's/^base_worktree_path: *//p' .worktree-flow-command.md)

if [ ! -d "$BASE_WORKTREE_PATH" ]; then
  echo "✗ Base worktree not accessible: $BASE_WORKTREE_PATH"
  echo "Possible causes:"
  echo "  - Path is mounted network drive that's unavailable"
  echo "  - Base worktree was moved or deleted"
  echo "  - Incorrect path in .worktree-flow-command.md"
  exit 1
fi
```

### Rebase Incomplete

If user attempts `/wt-done` while rebase is in progress:

```bash
if [ -d "$(git rev-parse --git-dir)/rebase-merge" ] || \
   [ -d "$(git rev-parse --git-dir)/rebase-apply" ]; then
  echo "✗ Rebase in progress"
  echo "Complete the rebase first:"
  echo "  - Resolve conflicts"
  echo "  - Run: git rebase --continue"
  echo "  - Or abort: git rebase --abort"
  exit 1
fi
```

## Status Display

### /wt-status Command Implementation

```bash
#!/bin/bash

# Parse command file
SESSION_ID=$(sed -n 's/^session_id: *//p' .worktree-flow-command.md)
TASK_NAME=$(sed -n 's/^task_name: *//p' .worktree-flow-command.md)
STATE_DIR=$(sed -n 's/^state_dir: *//p' .worktree-flow-command.md)

# Read files
SESSION_FILE="$STATE_DIR/session.json"
STATUS_FILE="$STATE_DIR/$TASK_NAME/status.json"

# Extract data
BASE_BRANCH=$(jq -r '.base_branch' "$SESSION_FILE")
CREATED_AT=$(jq -r '.created_at' "$SESSION_FILE")
TASK_STATUS=$(jq -r '.status' "$STATUS_FILE")
COMMIT_COUNT=$(jq -r '.commit_count' "$STATUS_FILE")
LAST_COMMIT=$(jq -r '.last_commit_hash' "$STATUS_FILE")

# Check lock
if [ -d "$STATE_DIR/lock.d" ]; then
  LOCK_OWNER=$(cat "$STATE_DIR/lock.d/owner" 2>/dev/null || echo "unknown")
  LOCK_STATUS="Held by: $LOCK_OWNER"
else
  LOCK_STATUS="Not held"
fi

# Display status
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Worktree Flow Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Session: $SESSION_ID"
echo "Base: $BASE_BRANCH"
echo "Created: $CREATED_AT"
echo ""
echo "Current Task: $TASK_NAME"
echo "├─ Status: $TASK_STATUS"
echo "├─ Commits: $COMMIT_COUNT"
echo "└─ Last commit: ${LAST_COMMIT:0:7}"
echo ""
echo "All Tasks:"

# Display all tasks table
jq -r '.tasks[] | "\(.task_name)|\(.status)|\(.branch)"' "$SESSION_FILE" | \
while IFS='|' read -r task status branch; do
  # Status indicator
  case "$status" in
    pending) INDICATOR="○" ;;
    in_progress) INDICATOR="●" ;;
    completed) INDICATOR="✓" ;;
    failed) INDICATOR="✗" ;;
    *) INDICATOR="?" ;;
  esac

  printf "  %s %-25s %-12s %s\n" "$INDICATOR" "$task" "$status" "$branch"
done

echo ""
echo "Lock: $LOCK_STATUS"
echo ""

# Calculate progress
TOTAL=$(jq '.tasks | length' "$SESSION_FILE")
COMPLETED=$(jq '[.tasks[] | select(.status == "completed")] | length' "$SESSION_FILE")
PERCENT=$((COMPLETED * 100 / TOTAL))

echo "Progress: $COMPLETED/$TOTAL tasks completed ($PERCENT%)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
```

## Best Practices

1. **Always verify state directory access** before operations.
2. **Parse YAML carefully** - invalid frontmatter causes failures.
3. **Respect scope boundaries** - don't modify files outside scope.
4. **Keep lock held during conflict resolution** - ensures atomicity.
5. **Update both status.json and session.json** - maintain consistency.
6. **Use atomic operations** for critical sections (mkdir for lock).
7. **Provide clear user guidance** during conflicts or errors.
8. **Release locks in all error paths** - prevent deadlocks.
9. **Verify merge success** before updating status.
10. **Display actionable next steps** after each operation.

This executor workflow ensures coordinated parallel development with safe merge-back protocol and comprehensive error handling.
