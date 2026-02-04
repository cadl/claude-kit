# Coordinator Workflow

Detailed guide for the coordinator mode: task decomposition, conflict assessment, worktree creation, and session initialization.

## Task Decomposition Strategy

Decompose complex requirements into independent, parallelizable tasks.

### Decomposition Criteria

**Feature Boundaries**: Split by distinct features that can be implemented independently.
- Example: "Fastlane integration" + "RevenueCat SDK" + "i18n support" are three separate features.

**Layer Separation**: Separate frontend, backend, infrastructure concerns.
- Example: "API endpoints" + "UI components" + "Database schema" could be parallel tasks.

**File Isolation**: Prioritize tasks that touch different sets of files.
- Tasks modifying `src/api/` vs. `src/ui/` have minimal conflict risk.

**Dependency Minimization**: Reduce inter-task dependencies.
- Avoid: Task A creates a module that Task B imports.
- Prefer: Both tasks work on independent modules.

**Size Balance**: Aim for similarly-sized tasks (2-8 hours of work each).
- Too small: Coordination overhead exceeds benefit.
- Too large: Reduces parallelism opportunity.

### Decomposition Process

1. **Parse user requirements**: Extract all requested features, changes, improvements.

2. **Identify natural boundaries**: Look for:
   - Separate features or modules
   - Different layers (UI, business logic, data)
   - Different platforms or targets
   - Independent refactoring opportunities

3. **Group related work**: Combine tightly coupled changes into single tasks.

4. **Assess dependencies**: Identify which tasks must complete before others can start.
   - If dependency chain is long, consider sequential execution instead.

5. **Evaluate parallelism benefit**:
   - 2-3 independent tasks: Good candidate for worktree-flow.
   - 4+ independent tasks: Excellent candidate.
   - 1-2 tasks with long dependency chain: Not suitable.

### Example Decomposition

**User request**: "Integrate fastlane for app store releases, add RevenueCat for subscriptions, and add internationalization support for Chinese and Japanese."

**Analysis**:
- Fastlane: Touches `fastlane/` directory, `Gemfile`, `README.md`.
- RevenueCat: Touches `Package.swift`, `Sources/Services/`, `Sources/UI/`.
- i18n: Touches `Sources/Localization/`, `Resources/`, `README.md`.

**Identified overlap**: Both fastlane and i18n modify `README.md`.

**Task decomposition**:
1. `integrate-fastlane`: Set up fastlane configuration and automation.
2. `integrate-revenuecat`: Integrate RevenueCat SDK and implement subscription UI.
3. `add-i18n`: Add localization infrastructure and translate to Chinese/Japanese.

**Conflict mitigation**: Document that README.md is modified by tasks 1 and 3. Suggest task 1 completes first, task 3 rebases.

## Conflict Risk Assessment

Analyze potential conflicts before creating worktrees.

### File Overlap Matrix

Create a matrix showing which tasks touch which files:

| File | Task 1 | Task 2 | Task 3 | Risk |
|------|--------|--------|--------|------|
| Gemfile | modify | - | - | LOW |
| fastlane/ | create | - | - | LOW |
| Package.swift | - | modify | - | LOW |
| Sources/Services/ | - | create | - | LOW |
| Sources/Localization/ | - | - | create | LOW |
| Resources/Strings/ | - | - | create | LOW |
| README.md | modify | - | modify | HIGH |
| .gitignore | modify | - | - | LOW |

**Risk levels**:
- **HIGH**: Same source file modified by multiple tasks (merge conflicts likely).
- **MEDIUM**: Shared config files (package.json, build files) modified by multiple tasks.
- **LOW**: No overlap or different directories modified.

### Assessment Guidelines

**No overlap (GREEN)**:
- Tasks touch completely different files.
- Proceed without concerns.

**Config file overlap (YELLOW)**:
- Tasks modify package.json, Gemfile, .gitignore, etc.
- Usually safe (additive changes, simple merge).
- Warn user but generally OK to proceed.

**Source file overlap (RED)**:
- Multiple tasks modify same .swift, .js, .py files.
- High risk of semantic conflicts.
- Strategies:
  - **Designate owner**: One task owns the file, other task coordinates.
  - **Serialize**: Complete task A, then start task B.
  - **Split differently**: Refactor decomposition to avoid overlap.

### Presenting Risk Assessment

Show the matrix to the user with color coding or symbols:

```
Conflict Risk Assessment

FILES WITH HIGH RISK:
  ⚠️  README.md - Modified by [integrate-fastlane, add-i18n]
      Recommendation: Complete integrate-fastlane first, then add-i18n rebases.

FILES WITH MEDIUM RISK:
  (None)

FILES WITH LOW RISK:
  ✓ All other files - No conflicts expected

Overall Risk: MEDIUM - Proceed with coordination on README.md
```

### User Decision

After presenting assessment:
1. **Proceed**: User accepts risk and coordination plan.
2. **Adjust**: User requests different task boundaries.
3. **Serialize**: User prefers sequential execution for high-risk tasks.

Do not create worktrees until user explicitly confirms.

## User Confirmation Flow

Present complete plan and await approval.

### Confirmation Prompt Format

```
Worktree Flow Plan

Session ID: 20260204-fastlane-revenuecat-i18n

Tasks to Create:
1. integrate-fastlane (estimated scope: medium)
   - Branch: wt/20260204/integrate-fastlane
   - Objective: Set up fastlane for automated releases
   - Files: Gemfile, fastlane/, README.md

2. integrate-revenuecat (estimated scope: medium)
   - Branch: wt/20260204/integrate-revenuecat
   - Objective: Integrate RevenueCat SDK and subscription UI
   - Files: Package.swift, Sources/Services/, Sources/UI/

3. add-i18n (estimated scope: large)
   - Branch: wt/20260204/add-i18n
   - Objective: Add Chinese and Japanese localization
   - Files: Sources/Localization/, Resources/, README.md

Conflict Risk: MEDIUM (README.md shared)
Coordination Plan: integrate-fastlane completes first

Proceed with worktree creation? (y/n)
```

**Await user response**. Do not proceed until explicit "y" or "yes".

### Handling User Feedback

**User requests changes**:
- Adjust task boundaries as requested.
- Re-run conflict assessment.
- Present updated plan.

**User declines**:
- Ask if they prefer different decomposition or sequential execution.
- Offer to work on tasks sequentially without worktrees.

**User approves**:
- Proceed with session initialization.

## Session Initialization

Create the infrastructure for parallel development.

### Generate Session ID

Format: `YYYYMMDD-<summary-slug>`
Maximum: 60 characters

Algorithm:
1. Get current date: `$(date +%Y%m%d)`
2. Extract key words from overall goal: "fastlane revenuecat i18n"
3. Join with hyphens: `fastlane-revenuecat-i18n`
4. Combine: `20260204-fastlane-revenuecat-i18n`
5. If > 60 chars, truncate and append "etc": `20260204-fastlane-revenuecat-etc`

**Valid examples**:
- `20260204-fastlane-revenuecat-i18n`
- `20260204-refactor-api-add-tests`
- `20260204-ui-redesign-performance-etc`

**Invalid examples** (avoid):
- `fastlane-revenuecat-i18n` (missing date)
- `2026-02-04-fastlane` (wrong date format)
- `20260204-this-is-a-very-long-session-name-that-exceeds-the-sixty-character-limit-for-session-identifiers` (too long)

### Create State Directory Structure

```bash
BASE_PATH="$(pwd)"
SESSION_ID="20260204-fastlane-revenuecat-i18n"
STATE_DIR="${BASE_PATH}/.worktree-flow/${SESSION_ID}"

# Create session directory
mkdir -p "$STATE_DIR"

# Create per-task directories
mkdir -p "$STATE_DIR/integrate-fastlane"
mkdir -p "$STATE_DIR/integrate-revenuecat"
mkdir -p "$STATE_DIR/add-i18n"
```

### Initialize session.json

```bash
cat > "$STATE_DIR/session.json" <<EOF
{
  "session_id": "${SESSION_ID}",
  "created_at": "$(date -u +"%Y-%m-%dT%H:%M:%S%z")",
  "base_branch": "main",
  "base_worktree_path": "${BASE_PATH}",
  "status": "in_progress",
  "tasks": [
    {
      "task_name": "integrate-fastlane",
      "branch": "wt/$(date +%Y%m%d)/integrate-fastlane",
      "worktree_path": "${BASE_PATH}/../$(basename "$BASE_PATH")-wt-integrate-fastlane",
      "status": "pending"
    },
    {
      "task_name": "integrate-revenuecat",
      "branch": "wt/$(date +%Y%m%d)/integrate-revenuecat",
      "worktree_path": "${BASE_PATH}/../$(basename "$BASE_PATH")-wt-integrate-revenuecat",
      "status": "pending"
    },
    {
      "task_name": "add-i18n",
      "branch": "wt/$(date +%Y%m%d)/add-i18n",
      "worktree_path": "${BASE_PATH}/../$(basename "$BASE_PATH")-wt-add-i18n",
      "status": "pending"
    }
  ]
}
EOF
```

### Initialize status.json for Each Task

```bash
for TASK in integrate-fastlane integrate-revenuecat add-i18n; do
  BRANCH="wt/$(date +%Y%m%d)/${TASK}"
  WORKTREE_PATH="${BASE_PATH}/../$(basename "$BASE_PATH")-wt-${TASK}"

  cat > "$STATE_DIR/${TASK}/status.json" <<EOF
{
  "task_name": "${TASK}",
  "session_id": "${SESSION_ID}",
  "branch": "${BRANCH}",
  "worktree_path": "${WORKTREE_PATH}",
  "status": "pending",
  "created_at": "$(date -u +"%Y-%m-%dT%H:%M:%S%z")",
  "started_at": null,
  "completed_at": null,
  "commit_count": 0,
  "last_commit_hash": null,
  "merged_at": null,
  "error": null
}
EOF
done
```

## Worktree Creation

Create isolated worktrees for each task.

### Pre-Creation Checks

Before creating each worktree:

```bash
TASK="integrate-fastlane"
BRANCH="wt/$(date +%Y%m%d)/${TASK}"
WORKTREE_PATH="../$(basename "$(pwd)")-wt-${TASK}"

# Check branch doesn't exist
if git show-ref --verify --quiet "refs/heads/${BRANCH}"; then
  echo "Error: Branch ${BRANCH} already exists"
  exit 1
fi

# Check path doesn't exist
if [ -e "$WORKTREE_PATH" ]; then
  echo "Error: Path ${WORKTREE_PATH} already exists"
  exit 1
fi
```

### Create Worktree

```bash
git worktree add -b "$BRANCH" "$WORKTREE_PATH" main

if [ $? -eq 0 ]; then
  echo "✓ Created worktree: $WORKTREE_PATH"
else
  echo "✗ Failed to create worktree"
  # Rollback: remove state directory entry
  rm -rf "$STATE_DIR/$TASK"
  exit 1
fi
```

### Verify Creation

```bash
if ! git worktree list | grep -q "$WORKTREE_PATH"; then
  echo "✗ Worktree not in git worktree list"
  exit 1
fi

if [ ! -d "$WORKTREE_PATH/.git" ]; then
  echo "✗ Worktree .git file not found"
  exit 1
fi

echo "✓ Worktree verified"
```

## Task Command File Generation

Generate `.worktree-flow-command.md` for each worktree.

### Template Population

For each task, populate the template with specific details:

```markdown
---
session_id: ${SESSION_ID}
task_name: ${TASK_NAME}
base_branch: main
base_worktree_path: ${BASE_PATH}
state_dir: ${STATE_DIR}
created_at: $(date -u +"%Y-%m-%dT%H:%M:%S%z")
---

# Task: ${TASK_TITLE}

## Objective
${OBJECTIVE}

## Requirements
${REQUIREMENTS}

## Plan
${PLAN}

## Scope
### Files to Create
${FILES_TO_CREATE}

### Files to Modify
${FILES_TO_MODIFY}

### Files NOT to Touch (owned by other tasks)
${FILES_NOT_TO_TOUCH}

## Conflict Zones
${CONFLICT_ZONES}

## Setup Commands
${SETUP_COMMANDS}

## Acceptance Criteria
${ACCEPTANCE_CRITERIA}
```

### Content Generation Guidelines

**Objective**: 1-2 sentence summary. Focus on "what" and "why".

**Requirements**: Numbered list, 3-10 items. Be specific and measurable.

**Plan**: Step-by-step implementation. 5-15 steps. Include testing and verification.

**Scope - Files to Create**: Bullet list of new files. Use full paths relative to repo root.

**Scope - Files to Modify**: Bullet list of existing files. Use full paths.

**Scope - Files NOT to Touch**: Explicitly list files modified by other tasks. Prevents scope creep.

**Conflict Zones**: Document shared files (from risk assessment). Provide coordination guidance.

**Setup Commands**: Optional. Bash commands to run before starting (npm install, bundle, etc.).

**Acceptance Criteria**: Numbered list, 3-8 items. Each must be verifiable.

### Write Command File

```bash
WORKTREE_PATH="../myproject-wt-integrate-fastlane"
COMMAND_CONTENT="..." # Generated from template

echo "$COMMAND_CONTENT" > "$WORKTREE_PATH/.worktree-flow-command.md"

if [ $? -eq 0 ]; then
  echo "✓ Created command file in $WORKTREE_PATH"
else
  echo "✗ Failed to create command file"
  exit 1
fi
```

## Slash Command Distribution

Copy command templates to enable workflow commands.

### Executor Commands (per worktree)

```bash
for WORKTREE_PATH in ../myproject-wt-*; do
  mkdir -p "$WORKTREE_PATH/.claude/commands"

  cp assets/templates/wt-commit.md "$WORKTREE_PATH/.claude/commands/"
  cp assets/templates/wt-done.md "$WORKTREE_PATH/.claude/commands/"
  cp assets/templates/wt-status.md "$WORKTREE_PATH/.claude/commands/"

  echo "✓ Installed commands in $(basename "$WORKTREE_PATH")"
done
```

### Coordinator Commands (main worktree)

```bash
mkdir -p .claude/commands

cp assets/templates/wt-status.md .claude/commands/
cp assets/templates/wt-cleanup.md .claude/commands/

echo "✓ Installed coordinator commands"
```

## Output Summary

Present complete setup to user with next steps.

### Summary Format

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Worktree Flow Session Created
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Session ID: 20260204-fastlane-revenuecat-i18n
Base Branch: main
State Directory: /path/to/project/.worktree-flow/20260204-fastlane-revenuecat-i18n

Tasks Created:
┌─────────────────────────┬────────────────────────────────────────────┐
│ Task                    │ Worktree Path                              │
├─────────────────────────┼────────────────────────────────────────────┤
│ integrate-fastlane      │ ../myproject-wt-integrate-fastlane         │
│ integrate-revenuecat    │ ../myproject-wt-integrate-revenuecat       │
│ add-i18n                │ ../myproject-wt-add-i18n                   │
└─────────────────────────┴────────────────────────────────────────────┘

Next Steps:
1. Open a Claude Code session in each worktree directory
2. Claude will auto-detect the task and activate Executor mode
3. Review the task plan in .worktree-flow-command.md
4. Work on tasks in parallel
5. Use /wt-commit to commit work periodically
6. Use /wt-done when ready to merge back
7. Use /wt-status here to monitor overall progress
8. Use /wt-cleanup when all tasks complete

Conflict Zones to Watch:
⚠️  README.md - Modified by [integrate-fastlane, add-i18n]
    Coordination: integrate-fastlane should complete first

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Verification Checklist

Before displaying summary, verify:
- [ ] All worktrees created successfully
- [ ] All branches exist
- [ ] All command files written
- [ ] All status.json files initialized
- [ ] session.json is valid JSON
- [ ] Slash commands installed in all worktrees
- [ ] Git exclusions configured

If any verification fails, abort and report error.

## Error Handling

### Branch Already Exists

```bash
if git show-ref --verify --quiet "refs/heads/${BRANCH}"; then
  # Try with numeric suffix
  COUNTER=2
  while git show-ref --verify --quiet "refs/heads/${BRANCH}-${COUNTER}"; do
    COUNTER=$((COUNTER + 1))
  done
  BRANCH="${BRANCH}-${COUNTER}"
  echo "Using alternate branch name: $BRANCH"
fi
```

### Worktree Path Exists

```bash
if [ -e "$WORKTREE_PATH" ]; then
  echo "Error: Path $WORKTREE_PATH already exists"
  echo "Options:"
  echo "1. Remove existing directory manually"
  echo "2. Cleanup previous session with: git worktree remove $WORKTREE_PATH"
  echo "3. Choose different task naming"
  exit 1
fi
```

### Partial Failure Recovery

If creating worktree #3 fails after #1 and #2 succeed:

```bash
# Rollback strategy
echo "Error creating worktree 3/3. Rolling back..."

# Remove created worktrees
git worktree remove ../myproject-wt-task1 --force
git worktree remove ../myproject-wt-task2 --force

# Delete branches
git branch -D wt/20260204/task1
git branch -D wt/20260204/task2

# Remove state directory
rm -rf .worktree-flow/20260204-session-name

echo "Rollback complete. Fix issues and retry."
```

## Best Practices

1. **Always run conflict assessment before creating worktrees**.
2. **Get explicit user confirmation before modifying repository state**.
3. **Verify each worktree creation before proceeding to next**.
4. **Generate detailed task plans with clear boundaries**.
5. **Document conflict zones explicitly in command files**.
6. **Test command file validity** (parse YAML frontmatter) before writing.
7. **Keep session IDs short and descriptive**.
8. **Include setup commands in task plans** (npm install, etc.).
9. **Rollback completely if any step fails** (don't leave partial state).
10. **Display clear, actionable next steps to the user**.

This workflow ensures clean, coordinated parallel development setup with minimal conflict risk and clear recovery paths.
