# Skill Playground

This directory provides isolated testing environments for each skill in the `skills/` directory.

## Purpose

The playground allows you to test and debug skills in a controlled environment where:
- Each skill is automatically loaded when you run Claude Code in its playground directory
- Test data and output are isolated from the main project
- You can experiment freely without affecting the skill source code

## Directory Structure

```
playground/
├── README.md (this file)
├── book-reading-assistant/
│   ├── .claude/skills/book-reading-assistant → symlink to ../../../skills/book-reading-assistant
│   ├── README.md - Testing instructions
│   ├── test-scenarios.md - Detailed test scenarios
│   └── sample-data/ - Place your test PDF/EPUB files here
└── [future-skill]/
    └── ...
```

## How to Use

### 1. Navigate to the skill's playground directory

```bash
cd playground/book-reading-assistant
```

### 2. Add test data (if needed)

For the book-reading-assistant skill, place your test PDF or EPUB files in the `sample-data/` directory:

```bash
cp ~/path/to/your/book.pdf sample-data/
```

### 3. Start Claude Code

```bash
claude code
```

The skill will be automatically loaded and ready to use.

### 4. Follow the test scenarios

Refer to the `test-scenarios.md` file in each playground directory for step-by-step testing instructions.

## How Playground Works

Each playground subdirectory contains a `.claude/skills/` directory with a symbolic link to the actual skill in `skills/`. When you run Claude Code in the playground directory, it detects and loads the skill automatically.

**Benefits:**
- ✅ Always uses the latest version of the skill (symlink)
- ✅ Changes to the skill in `skills/` are immediately available
- ✅ Isolated test environment prevents interference
- ✅ Easy cleanup - just delete the playground directory

## Adding a New Skill Playground

To create a playground for a new skill:

```bash
# Create the directory structure
mkdir -p playground/your-skill-name/.claude/skills
cd playground/your-skill-name

# Create symlink to the skill
ln -s ../../../skills/your-skill-name .claude/skills/your-skill-name

# Create README and test scenarios
touch README.md test-scenarios.md

# Add any necessary test data directories
mkdir -p sample-data
```

## Git Configuration

The `.gitignore` in this directory is configured to:
- ✅ Keep the playground directory structure
- ✅ Keep README and test scenario files
- ❌ Ignore actual test data files (PDFs, EPUBs, etc.)
- ❌ Ignore generated output directories

This ensures the playground setup is versioned while keeping test files local.

## Tips

- **Start fresh**: If you want a clean test environment, delete the output directories
- **Multiple books**: You can test with multiple books by placing several PDFs in `sample-data/`
- **Parallel testing**: Each skill's playground is independent - run multiple instances if needed
- **Debug changes**: Edit the skill in `skills/`, test immediately in playground (no sync needed)

## Available Playgrounds

- **book-reading-assistant** - Test chapter-by-chapter book reading, comprehension testing, and spaced repetition

---

Happy testing! 🎮
