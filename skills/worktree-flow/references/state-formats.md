# State File Formats

Complete specifications for all file formats used by the worktree-flow skill.

## session.json

Location: `<base-worktree-path>/.worktree-flow/<session-id>/session.json`

### Schema

```json
{
  "session_id": "20260204-integrate-fastlane-and-revenuecat",
  "created_at": "2026-02-04T10:30:00+08:00",
  "base_branch": "main",
  "base_worktree_path": "/Users/cadl/Workspace/cadl/my-project",
  "status": "in_progress",
  "tasks": [
    {
      "task_name": "integrate-fastlane",
      "branch": "wt/20260204/integrate-fastlane",
      "worktree_path": "/Users/cadl/Workspace/cadl/my-project-wt-integrate-fastlane",
      "status": "in_progress"
    },
    {
      "task_name": "integrate-revenuecat",
      "branch": "wt/20260204/integrate-revenuecat",
      "worktree_path": "/Users/cadl/Workspace/cadl/my-project-wt-integrate-revenuecat",
      "status": "pending"
    }
  ]
}
```

### Field Specifications

**session_id** (string, required):
- Format: `YYYYMMDD-<summary-slug>`
- Maximum 60 characters
- Use hyphens for word separation in slug
- Truncate and append "etc" if summary exceeds limit
- Example: `20260204-integrate-fastlane-revenuecat-i18n`

**created_at** (string, required):
- ISO 8601 timestamp with timezone
- Format: `YYYY-MM-DDTHH:MM:SS+TZ:TZ`
- Example: `2026-02-04T10:30:00+08:00`

**base_branch** (string, required):
- The branch that all tasks will merge back to
- Usually `main` or `master`
- Must exist in repository

**base_worktree_path** (string, required):
- Absolute path to the main worktree directory
- Used by executors to perform merge operations
- Must be accessible from all worktrees

**status** (string, required):
- Values: `in_progress` | `completed` | `cancelled`
- `in_progress`: At least one task not yet completed
- `completed`: All tasks successfully merged
- `cancelled`: Session terminated before completion

**tasks** (array, required):
- List of all tasks in this session
- Each element follows the task schema below

### Task Schema (within session.json)

**task_name** (string, required):
- Unique identifier within session
- Alphanumeric with hyphens
- Example: `integrate-fastlane`

**branch** (string, required):
- Git branch name for this task
- Format: `wt/<YYYYMMDD>/<task-slug>`
- Example: `wt/20260204/integrate-fastlane`

**worktree_path** (string, required):
- Absolute path to the worktree directory
- Format: `../<project-name>-wt-<task-slug>/`
- Example: `/Users/cadl/Workspace/cadl/myapp-wt-integrate-fastlane`

**status** (string, required):
- Values: `pending` | `in_progress` | `completed` | `failed`
- `pending`: Not yet started by any executor
- `in_progress`: Executor actively working on task
- `completed`: Successfully merged to base branch
- `failed`: Encountered unrecoverable error

---

## status.json

Location: `<base-worktree-path>/.worktree-flow/<session-id>/<task-name>/status.json`

### Schema

```json
{
  "task_name": "integrate-fastlane",
  "session_id": "20260204-integrate-fastlane-and-revenuecat",
  "branch": "wt/20260204/integrate-fastlane",
  "worktree_path": "/Users/cadl/Workspace/cadl/my-project-wt-integrate-fastlane",
  "status": "in_progress",
  "created_at": "2026-02-04T10:30:00+08:00",
  "started_at": "2026-02-04T10:35:12+08:00",
  "completed_at": null,
  "commit_count": 3,
  "last_commit_hash": "abc1234567890abcdef1234567890abcdef12345",
  "merged_at": null,
  "error": null
}
```

### Field Specifications

**task_name** (string, required):
- Must match task name in session.json
- Identifies this task uniquely within session

**session_id** (string, required):
- Must match parent session ID
- Used to validate consistency

**branch** (string, required):
- Git branch for this task
- Must match session.json entry

**worktree_path** (string, required):
- Absolute path to worktree
- Must match session.json entry

**status** (string, required):
- Values: `pending` | `in_progress` | `completed` | `failed`
- Semantics same as in session.json

**created_at** (string, required):
- ISO 8601 timestamp when task was created
- Set by coordinator during initialization

**started_at** (string, nullable):
- ISO 8601 timestamp when executor first activated
- `null` if status is still `pending`
- Set when transitioning from `pending` to `in_progress`

**completed_at** (string, nullable):
- ISO 8601 timestamp when task completed
- `null` until status becomes `completed`
- Set during `/wt-done` after successful merge

**commit_count** (integer, required):
- Number of commits made on this task branch
- Starts at 0
- Incremented after each `/wt-commit`
- Used to determine first vs. subsequent commit message format

**last_commit_hash** (string, nullable):
- Full SHA-1 hash of most recent commit
- `null` if no commits yet
- Updated after each `/wt-commit`
- Used for verification and status display

**merged_at** (string, nullable):
- ISO 8601 timestamp when merged to base branch
- `null` until merge completes
- Set during `/wt-done` after `git merge --ff-only` succeeds

**error** (string, nullable):
- Error message if task failed
- `null` if no error
- Set when status transitions to `failed`
- Include error details for debugging

---

## .worktree-flow-command.md

Location: `<worktree-path>/.worktree-flow-command.md`

### Format

YAML frontmatter followed by markdown body with standardized sections.

### Example

```markdown
---
session_id: 20260204-integrate-fastlane-and-revenuecat
task_name: integrate-fastlane
base_branch: main
base_worktree_path: /Users/cadl/Workspace/cadl/my-project
state_dir: /Users/cadl/Workspace/cadl/my-project/.worktree-flow/20260204-integrate-fastlane-and-revenuecat
created_at: 2026-02-04T10:30:00+08:00
---

# Task: Integrate Fastlane

## Objective
Integrate fastlane into the project to automate App Store releases, screenshot generation, and metadata management for iOS and macOS builds.

## Requirements
1. Install fastlane gem and initialize fastlane configuration
2. Create Fastfile with lanes for building, testing, and uploading
3. Configure snapshot for automated screenshot generation
4. Set up deliver for App Store Connect uploads
5. Add fastlane to project documentation

## Plan
1. Add fastlane to Gemfile and run `bundle install`
2. Run `fastlane init` to create basic configuration
3. Create `fastlane/Fastfile` with custom lanes:
   - `lane :test` - Run unit and UI tests
   - `lane :screenshots` - Generate screenshots with snapshot
   - `lane :beta` - Upload to TestFlight
   - `lane :release` - Upload to App Store
4. Create `fastlane/Snapfile` for screenshot configuration
5. Set up App Store Connect API key in `.env` file
6. Test each lane to verify functionality
7. Update README.md with fastlane usage instructions

## Scope
### Files to Create
- Gemfile (if not exists)
- fastlane/Fastfile
- fastlane/Appfile
- fastlane/Snapfile
- fastlane/.env.default (template for API keys)
- docs/fastlane-usage.md

### Files to Modify
- README.md (add fastlane section)
- .gitignore (exclude fastlane/report.xml, fastlane/.env)

### Files NOT to Touch (owned by other tasks)
- Package.swift (owned by integrate-revenuecat)
- Sources/Localization/ (owned by add-i18n)

## Conflict Zones
**README.md**: Both this task and `add-i18n` will modify README.md. This task adds fastlane documentation in the "Build & Release" section. The i18n task adds localization instructions in the "Features" section. Coordinate to avoid conflicts, or designate one task to merge first and the other to rebase.

## Setup Commands
```bash
# Install Ruby dependencies
bundle install

# Verify fastlane installation
fastlane --version
```

## Acceptance Criteria
1. `fastlane test` successfully runs all tests
2. `fastlane screenshots` generates screenshots for configured devices
3. `fastlane beta` uploads build to TestFlight (manual verification required)
4. All fastlane configuration files are properly gitignored
5. README.md documents all available fastlane lanes
6. Fastlane runs successfully in CI environment (if applicable)
```

### YAML Frontmatter Fields

**session_id** (string, required):
- Must match session.json session_id
- Used to locate state directory

**task_name** (string, required):
- Must match task name in session.json and status.json
- Used to locate task-specific status file

**base_branch** (string, required):
- Branch to rebase and merge back to
- Usually `main` or `master`

**base_worktree_path** (string, required):
- Absolute path to main worktree
- Used for `git -C` merge operations
- Critical for executors to find state directory

**state_dir** (string, required):
- Absolute path to session state directory
- Pre-computed to avoid path construction errors
- Format: `<base_worktree_path>/.worktree-flow/<session_id>`

**created_at** (string, required):
- ISO 8601 timestamp when task was created
- Matches status.json created_at

### Markdown Body Sections

All sections are required unless marked optional.

**# Task: [Title]** (required):
- Clear, descriptive title
- Appears as H1 heading
- Should match or expand on task_name

**## Objective** (required):
- 1-2 sentence clear goal statement
- Explains "why" not "how"
- Provides context for the implementer

**## Requirements** (required):
- Numbered list of specific requirements
- Each requirement should be testable
- Avoid vague statements

**## Plan** (required):
- Step-by-step implementation plan
- Numbered steps in logical order
- Specific enough to guide implementation
- Include testing/verification steps

**## Scope** (required):
- Three subsections: Files to Create, Files to Modify, Files NOT to Touch
- Use bullet lists with full file paths
- "Files NOT to Touch" prevents scope creep and conflicts
- Be explicit about boundaries

**## Conflict Zones** (required if conflicts exist, otherwise empty):
- Document files that multiple tasks will modify
- Provide coordination guidance
- Suggest merge order if helpful
- Include workaround strategies

**## Setup Commands** (optional):
- Shell commands to run before starting
- Dependency installation (npm, bundle, pod, etc.)
- Environment verification
- Use code blocks with bash syntax

**## Acceptance Criteria** (required):
- Numbered checklist of completion criteria
- Each criterion must be verifiable
- Covers functionality, testing, documentation
- Includes edge cases if relevant

---

## Lock Mechanism

The lock is a directory-based atomic mechanism using `mkdir`'s atomic nature on most filesystems.

### Lock Directory

Location: `<state_dir>/lock.d/`

When the lock is held, this directory exists and contains an `owner` file.

### Acquire Lock

```bash
mkdir "<state_dir>/lock.d"
```

- Exit code 0: Lock acquired successfully
- Exit code non-zero: Lock already held by another executor

### Write Owner

Immediately after successful acquisition:

```bash
echo "<task_name>" > "<state_dir>/lock.d/owner"
```

### Read Owner

When lock acquisition fails:

```bash
cat "<state_dir>/lock.d/owner"
```

Displays which task currently holds the lock.

### Release Lock

After merge completes:

```bash
rm -rf "<state_dir>/lock.d"
```

### Stale Lock Detection

A lock is stale if:
1. `lock.d/` directory exists
2. Owning task's status in status.json is `completed` or `failed`
3. Lock has existed for unreasonable time (>30 minutes)

Recovery:
- Verify owning task truly completed by checking git history
- If confirmed stale, offer user option to force-release: `rm -rf "<state_dir>/lock.d"`
- Log the forced release for auditing

---

## File Format Summary

| File | Location | Format | Purpose |
|------|----------|--------|---------|
| session.json | `.worktree-flow/<session-id>/` | JSON | Session-level metadata and task list |
| status.json | `.worktree-flow/<session-id>/<task-name>/` | JSON | Per-task state tracking |
| .worktree-flow-command.md | `<worktree-root>/` | Markdown + YAML | Task specification for executors |
| lock.d/ | `.worktree-flow/<session-id>/` | Directory | Atomic lock mechanism |
| lock.d/owner | `.worktree-flow/<session-id>/lock.d/` | Plain text | Lock owner identifier |

## Data Flow

1. **Coordinator creates session**:
   - Writes session.json
   - Creates status.json for each task
   - Generates .worktree-flow-command.md in each worktree

2. **Executor activates**:
   - Reads .worktree-flow-command.md frontmatter
   - Locates state_dir from frontmatter
   - Reads status.json for current state
   - Updates status from `pending` to `in_progress`

3. **Executor commits**:
   - Reads commit_count from status.json
   - Determines commit message format
   - Increments commit_count
   - Updates last_commit_hash

4. **Executor merges**:
   - Acquires lock (creates lock.d/)
   - Writes owner to lock.d/owner
   - Performs rebase and merge
   - Updates status to `completed`
   - Updates session.json task entry
   - Releases lock (removes lock.d/)

5. **Coordinator monitors**:
   - Reads session.json for overview
   - Checks lock.d/ for merge activity
   - Detects completion when all tasks `completed`

This file format ensures consistency, enables coordination, and provides complete audit trail of parallel development workflow.
