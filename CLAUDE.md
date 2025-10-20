# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Purpose

This repository is a development workspace for creating and testing Claude Code skills. Skills are modular packages that extend Claude's capabilities with specialized knowledge, workflows, and tools.

## Project Architecture

### Directory Structure

```
claude-kit/
├── skills/                    # Skill source code (production)
│   └── [skill-name]/
│       ├── SKILL.md          # Required: Skill instructions with YAML frontmatter
│       └── references/       # Optional: Reference documentation loaded as needed
├── playground/               # Isolated testing environments for skills
│   └── [skill-name]/
│       ├── .claude/skills/   # Symlink to skills/[skill-name]
│       ├── README.md         # Testing instructions
│       ├── test-scenarios.md # Detailed test cases
│       └── sample-data/      # Test data files (gitignored)
└── *.zip                     # Packaged skills ready for distribution
```

### Key Concepts

**Skills vs Playground:**
- `skills/` contains the actual skill source code - this is what gets packaged and distributed
- `playground/` contains isolated testing environments with symlinks to skills for debugging
- Changes to `skills/` are immediately available in `playground/` via symlinks

**Skill Structure:**
- `SKILL.md` is the only required file (contains YAML frontmatter + Markdown instructions)
- `references/` contains documentation that Claude loads into context when needed
- `scripts/` (if present) contains executable utilities
- `assets/` (if present) contains files used in output (templates, boilerplate, etc.)

## Common Commands

### Creating a New Skill

Use the skill-creator skill to scaffold a new skill:

```bash
# Initialize a new skill
python3 ~/.claude/plugins/marketplaces/anthropic-agent-skills/skill-creator/scripts/init_skill.py <skill-name> --path skills/

# Example:
python3 ~/.claude/plugins/marketplaces/anthropic-agent-skills/skill-creator/scripts/init_skill.py my-new-skill --path skills/
```

This creates the skill directory structure with:
- `SKILL.md` template with TODO placeholders
- Example `scripts/`, `references/`, and `assets/` directories (delete if not needed)

### Packaging a Skill

Package a skill into a distributable .zip file:

```bash
# Package a skill (automatically validates first)
python3 ~/.claude/plugins/marketplaces/anthropic-agent-skills/skill-creator/scripts/package_skill.py skills/<skill-name>

# Example:
python3 ~/.claude/plugins/marketplaces/anthropic-agent-skills/skill-creator/scripts/package_skill.py skills/book-reading-assistant
```

The packaged .zip file appears in the repository root: `<skill-name>.zip`

### Validating a Skill

Validate skill structure without packaging:

```bash
python3 ~/.claude/plugins/marketplaces/anthropic-agent-skills/skill-creator/scripts/quick_validate.py skills/<skill-name>
```

### Testing a Skill

#### Option 1: Using Playground (Recommended)

```bash
# Navigate to the skill's playground
cd playground/<skill-name>

# Start Claude Code (skill auto-loads via symlink)
claude code
```

The skill will be automatically loaded and ready to test.

#### Option 2: Create New Playground

If a playground doesn't exist yet:

```bash
# Create playground structure
mkdir -p playground/<skill-name>/.claude/skills
cd playground/<skill-name>

# Create symlink to the skill
ln -s ../../../skills/<skill-name> .claude/skills/<skill-name>

# Create test files
touch README.md test-scenarios.md
mkdir -p sample-data

# Start testing
claude code
```

## Skill Development Workflow

### 1. Initialize Skill

```bash
python3 ~/.claude/plugins/marketplaces/anthropic-agent-skills/skill-creator/scripts/init_skill.py <skill-name> --path skills/
```

### 2. Edit SKILL.md

- Update YAML frontmatter `description` - this determines when Claude uses the skill
- Replace TODO placeholders with actual skill instructions
- Use **imperative/infinitive form** (e.g., "To accomplish X, do Y" not "You should do X")
- Delete example files (`scripts/example.py`, `references/api_reference.md`, etc.) if not needed

### 3. Add References/Scripts/Assets (Optional)

- `references/` - Documentation Claude loads as needed (API docs, schemas, guides)
- `scripts/` - Executable code for deterministic operations
- `assets/` - Files used in output (templates, boilerplate code)

### 4. Create Playground

```bash
mkdir -p playground/<skill-name>/.claude/skills
ln -s ../../../skills/<skill-name> playground/<skill-name>/.claude/skills/<skill-name>
```

### 5. Test

```bash
cd playground/<skill-name>
claude code
# Test the skill interactively
```

### 6. Iterate

Edit files in `skills/<skill-name>/` - changes are immediately available in playground (no sync needed).

### 7. Package

```bash
python3 ~/.claude/plugins/marketplaces/anthropic-agent-skills/skill-creator/scripts/package_skill.py skills/<skill-name>
```

The .zip file is ready for distribution.

## Important Notes

### Skill Metadata (YAML Frontmatter)

The `name` and `description` in SKILL.md frontmatter are critical:

```yaml
---
name: skill-name
description: Specific, detailed description of what the skill does and WHEN to use it. Include triggering scenarios, file types, or tasks.
---
```

**Bad description:** "Helps with reading books"
**Good description:** "This skill assists with reading technical books through chapter-by-chapter analysis, comprehension testing, and persistent note-taking. Use this skill when the user wants to read and deeply understand a technical book (PDF/EPUB format), needs structured reading assistance across multiple sessions, or wants to track progress and maintain organized reading notes."

### Progressive Disclosure

Skills use a three-level loading system:
1. **Metadata** (name + description) - Always in context (~100 words)
2. **SKILL.md body** - When skill triggers (<5k words)
3. **References/scripts** - As needed by Claude

Keep SKILL.md lean. Move detailed docs to `references/`, keep only essential instructions in SKILL.md.

### Writing Style

- Use imperative/infinitive form throughout SKILL.md
- Write objectively: "To accomplish X, do Y" not "You should do X"
- Avoid second person (you/your)
- Be concise and actionable

### Playground Symlinks

Playground uses symlinks (not copies) for skills:
- ✅ Always uses latest version
- ✅ No manual syncing needed
- ✅ Edit once, test immediately
- ⚠️ Ensure symlink paths are correct (relative: `../../../skills/<skill-name>`)

### Git Ignore Patterns

- Test data in `playground/*/sample-data/` is gitignored
- Test output in `playground/*/test-output/` is gitignored
- Packaged .zip files are currently committed (consider gitignoring if they get large)

## Available Skills

### book-reading-assistant

**Purpose:** Assists with reading technical books through chapter-by-chapter analysis, comprehension testing, and spaced repetition.

**Key Features:**
- Book initialization (extract TOC, create metadata)
- Three-stage reading assistance (pre-reading, during-reading, post-reading)
- 9-section chapter analysis format
- Cross-chapter theme tracking
- Terminology glossary
- Spaced repetition review scheduling
- Progress tracking

**Files:**
- `skills/book-reading-assistant/SKILL.md` (main instructions)
- `skills/book-reading-assistant/references/output-formats.md` (file format specs)
- `skills/book-reading-assistant/references/spaced-repetition-guide.md` (review algorithms)

**Testing:**
- See `playground/book-reading-assistant/test-scenarios.md` for 10 detailed test scenarios
- Requires test PDF/EPUB in `playground/book-reading-assistant/sample-data/`

## Troubleshooting

### Skill Not Loading in Playground

Check symlink:
```bash
ls -la playground/<skill-name>/.claude/skills/
# Should show symlink pointing to ../../../../skills/<skill-name>

# Verify target exists
ls -la playground/<skill-name>/.claude/skills/<skill-name>/
# Should show SKILL.md and other skill files
```

### Package Command Fails

Validation errors will be shown. Common issues:
- Missing YAML frontmatter in SKILL.md
- Empty or incomplete description
- Invalid skill name (must match directory name)

Fix issues and re-run package command.

### Changes Not Appearing in Tests

If using playground with symlinks, changes should appear immediately. If not:
- Verify you edited the file in `skills/` not `playground/`
- Restart Claude Code to reload the skill
- Check symlink is valid

## External Resources

- **Skill creator scripts:** `~/.claude/plugins/marketplaces/anthropic-agent-skills/skill-creator/scripts/`
- **Global Claude settings:** `~/.claude/`
- **Project-local settings:** `.claude/settings.local.json`
