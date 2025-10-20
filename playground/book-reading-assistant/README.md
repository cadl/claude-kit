# Book Reading Assistant - Testing Playground

This is a dedicated testing environment for the **book-reading-assistant** skill.

## Quick Start

### 1. Add Your Test Book

Place a PDF or EPUB file in the `sample-data/` directory:

```bash
cp ~/path/to/your-technical-book.pdf sample-data/
```

**Recommended test books:**
- Technical books with clear chapter structure (10-20 chapters ideal)
- Books with a table of contents
- Non-fiction, technical, or educational content
- Examples: "Deep Learning" by Goodfellow, "Clean Code" by Martin, etc.

### 2. Launch Claude Code

```bash
cd playground/book-reading-assistant
claude code
```

The book-reading-assistant skill will be automatically loaded.

### 3. Start Testing

Follow the test scenarios in `test-scenarios.md` or start with a simple test:

```
Hello! I want to test the book-reading-assistant skill.
I have a book at sample-data/your-book.pdf
```

Claude will guide you through the initialization process.

## Directory Structure

```
playground/book-reading-assistant/
├── .claude/
│   └── skills/
│       └── book-reading-assistant/ → symlink to ../../../../skills/book-reading-assistant
├── README.md (this file)
├── test-scenarios.md (detailed test scenarios)
├── sample-data/ (place your test PDFs/EPUBs here)
└── test-output/ (will be created during testing)
    └── [book-name]/
        ├── book-metadata.json
        ├── chapters/
        ├── glossary.md
        ├── cross-chapter-analysis.md
        └── review-schedule.json
```

## Testing Workflow

### First-Time Testing

1. **Initialize a book** - Test the book initialization workflow
2. **Pre-reading** - Test chapter preview functionality
3. **During-reading** - Test content expansion and clarification
4. **Post-reading** - Test chapter analysis and comprehension testing
5. **Persistence** - Verify all files are created correctly

### Advanced Testing

6. **Cross-chapter analysis** - Test theme tracking across multiple chapters
7. **Glossary management** - Verify technical terms are being captured
8. **Spaced repetition** - Test review scheduling and retention assessment
9. **Progress tracking** - Check progress reports and analytics

### Regression Testing

- Test edge cases (very long chapters, missing TOC, corrupted files)
- Test state recovery (return to reading after closing Claude Code)
- Test concurrent book reading (multiple books tracked simultaneously)

## Expected Skill Behavior

When the skill loads, it should:
- ✅ Detect book-related requests automatically
- ✅ Guide you through initialization when starting a new book
- ✅ Create persistent files in a user-specified directory
- ✅ Provide three-stage reading assistance (pre/during/post)
- ✅ Generate comprehensive chapter notes
- ✅ Test comprehension interactively
- ✅ Schedule reviews using spaced repetition
- ✅ Track cross-chapter themes and terminology

## Validating Outputs

After running tests, check the `test-output/[book-name]/` directory:

### book-metadata.json
- Should contain book title, author, TOC
- Should track reading progress and chapter status
- Should update timestamps correctly

### chapters/chapter-XX-*.md
- Should follow the 9-section format
- Should contain verbatim quotes with page numbers
- Should be human-readable and well-formatted

### glossary.md
- Should be alphabetically organized
- Should include chapter references
- Should have clear definitions

### cross-chapter-analysis.md
- Should identify recurring themes
- Should map conceptual connections
- Should track evolution of ideas

### review-schedule.json
- Should schedule reviews based on comprehension scores
- Should use correct interval calculations
- Should track retention scores

## Common Test Scenarios

See `test-scenarios.md` for detailed test cases. Quick reference:

1. **Scenario 1**: Initialize new book
2. **Scenario 2**: Pre-reading chapter preview
3. **Scenario 3**: During-reading assistance
4. **Scenario 4**: Post-reading analysis and testing
5. **Scenario 5**: Cross-chapter analysis
6. **Scenario 6**: Review session
7. **Scenario 7**: Progress tracking

## Troubleshooting

### Skill not loading?
- Verify symlink exists: `ls -la .claude/skills/`
- Check symlink target: `ls -la .claude/skills/book-reading-assistant/`
- Ensure you're in the playground directory: `pwd`

### Outputs not being created?
- Check file permissions on test-output directory
- Verify the skill is being triggered (look for book-reading behavior)
- Check Claude's responses for error messages

### Testing with multiple books?
- Each book should have its own output directory
- book-metadata.json should reference the correct book path
- You can switch between books in the same session

## Tips for Effective Testing

1. **Use a real technical book**: The skill works best with actual content, not dummy text
2. **Test incrementally**: Complete one chapter's full workflow before moving to the next
3. **Verify persistence**: Close and reopen Claude Code to test state recovery
4. **Check edge cases**: Try chapters without clear structure, very long chapters, etc.
5. **Review output quality**: Manually review generated notes for accuracy and completeness

## Cleanup

To start fresh:

```bash
# Remove all test outputs
rm -rf test-output/

# Keep sample data, remove outputs
rm -rf test-output/your-book-name/
```

The skill and sample data remain intact for future testing.

## Reporting Issues

If you find bugs or unexpected behavior:

1. Note the specific test scenario that failed
2. Check the generated output files for errors
3. Review Claude's responses for error messages
4. Document the book you were testing with (chapter structure, length, etc.)
5. Update the skill in `skills/book-reading-assistant/` to fix issues

Remember: Changes to the skill in `skills/book-reading-assistant/` are immediately available in this playground via the symlink - no need to sync or copy files.

---

Happy testing! 📚
