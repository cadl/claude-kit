# Book Reading Assistant - Test Scenarios

This document provides detailed test scenarios to validate all features of the book-reading-assistant skill.

## Prerequisites

- Claude Code running in the `playground/book-reading-assistant/` directory
- A technical book (PDF or EPUB) in the `sample-data/` directory
- Familiarity with the skill's capabilities (see SKILL.md)

---

## Scenario 1: Initialize a New Book

**Objective**: Test the book initialization workflow and verify all metadata files are created correctly.

### Test Steps

1. **Start initialization**
   ```
   I want to start reading a new book. The file is at sample-data/your-book.pdf
   ```

2. **Provide output directory when asked**
   ```
   Please save the notes to test-output/your-book-name/
   ```

3. **Verify initialization response**
   - Claude should extract the table of contents
   - Claude should display total chapters detected
   - Claude should show book title and author
   - Claude should confirm output directory location

### Expected Outputs

**Files created:**
- `test-output/your-book-name/book-metadata.json`
- `test-output/your-book-name/glossary.md`
- `test-output/your-book-name/cross-chapter-analysis.md`
- `test-output/your-book-name/review-schedule.json`
- `test-output/your-book-name/chapters/` (empty directory)

**book-metadata.json should contain:**
- Book title and author
- File path to the PDF
- Total chapter count
- Complete table of contents with page ranges
- All chapters marked as "not_started"
- Reading progress initialized to 0

### Validation Checklist

- [ ] All 4 base files created
- [ ] chapters/ directory created
- [ ] book-metadata.json is valid JSON
- [ ] TOC has correct chapter count
- [ ] Page ranges look reasonable
- [ ] glossary.md has placeholder text
- [ ] cross-chapter-analysis.md has section headers
- [ ] review-schedule.json has empty reviews array

### Edge Cases to Test

- Book with no clear TOC
- Book with unusual chapter numbering (e.g., Part I, Part II)
- Very long book (>30 chapters)
- EPUB instead of PDF

---

## Scenario 2: Pre-Reading Stage

**Objective**: Test chapter preview functionality before reading.

### Test Steps

1. **Request pre-reading assistance**
   ```
   I'm about to read Chapter 1. Can you give me a preview?
   ```

2. **Review the pre-reading brief**
   - Should receive focus areas (3-5 key concepts)
   - Should receive key terms to watch for
   - Should receive chapter roadmap (structure outline)
   - Should receive prerequisite connections (if applicable)

3. **Verify metadata update**
   ```
   Check test-output/your-book-name/book-metadata.json
   ```

### Expected Outputs

**Pre-reading brief format:**
```markdown
## Chapter X Pre-Reading Brief

### Focus Areas
1. [Concept 1] - ...
2. [Concept 2] - ...

### Key Terms to Watch For
- **Term 1**: Context...
- **Term 2**: Context...

### Chapter Roadmap
- Section (pages X-Y): Purpose...

### Prerequisite Connections
- Chapter Y: [concept]
```

**book-metadata.json updates:**
- Chapter 1 status should be "in_progress"
- current_chapter should be 1
- last_session timestamp updated

### Validation Checklist

- [ ] Focus areas are relevant to chapter content
- [ ] 3-5 key concepts identified
- [ ] Technical terms are actually in the chapter
- [ ] Chapter roadmap reflects actual structure
- [ ] Metadata correctly updated
- [ ] No chapter note file created yet (pre-reading only)

### Edge Cases to Test

- Very short chapter (<5 pages)
- Very long chapter (>50 pages)
- Chapter with minimal structure
- First chapter vs. later chapter (prerequisite connections)

---

## Scenario 3: During-Reading Assistance

**Objective**: Test interactive content expansion while reading.

### Test Steps

1. **Start reading and request expansion**
   ```
   I'm reading Chapter 1, section about [specific topic]. Can you expand on [concept]?
   ```

2. **Request clarification**
   ```
   I'm confused about the relationship between [X] and [Y]. Can you clarify?
   ```

3. **Request real-world application**
   ```
   How would this concept apply to [specific scenario]?
   ```

### Expected Outputs

**For each request, Claude should:**
- Provide focused explanation of the requested concept
- Use analogies or examples relevant to technical readers
- Connect to other parts of the chapter or book
- Ask probing questions to deepen understanding
- Not create any persistent files (conversational only)

### Validation Checklist

- [ ] Explanations are accurate to the book content
- [ ] Analogies are appropriate and helpful
- [ ] Connections to other chapters are valid
- [ ] Questions promote deeper thinking
- [ ] No files created during this stage
- [ ] Responses are concise and focused

### Edge Cases to Test

- Request about a concept not clearly explained in the book
- Request for expansion on a very technical topic
- Request connecting to a chapter not yet read
- Multiple clarification requests in sequence

---

## Scenario 4: Post-Reading - Full Chapter Analysis

**Objective**: Test comprehensive chapter analysis, comprehension testing, and persistence.

### Test Steps

1. **Indicate chapter completion**
   ```
   I finished reading Chapter 1.
   ```

2. **Answer comprehension questions**
   - Claude should ask 3-5 questions
   - Questions should test core concepts, application, and connections
   - Provide thoughtful answers

3. **Review generated chapter note**
   ```
   Can you show me the chapter note you created?
   ```

4. **Verify all updates**
   - Check chapter note file
   - Check book-metadata.json
   - Check glossary.md
   - Check review-schedule.json

### Expected Outputs

**Chapter note file created:**
`test-output/your-book-name/chapters/chapter-01-[title-slug].md`

**File should contain 9 sections:**
1. Chapter Metadata (number, title, pages, date, score)
2. Key Quotes (4-8 verbatim quotes with page numbers)
3. Main Stories/Examples (summaries with moral/meaning)
4. Chapter Summary (clear 4-6 sentence paragraph)
5. Core Teachings (main ideas with explanations)
6. Actionable Lessons (practical applications)
7. Mindset/Philosophical Insights (deeper reflections)
8. Memorable Metaphors & Analogies (from the book)
9. Questions for Reflection (3-5 thought-provoking questions)

**book-metadata.json updates:**
- Chapter 1 status: "completed"
- comprehension_score: 0-100
- chapters_completed: 1
- last_accessed timestamp

**glossary.md updates:**
- 5-10 new technical terms added
- Terms alphabetically organized
- Each term has definition, chapter reference, context

**review-schedule.json updates:**
- New review entry for Chapter 1
- Scheduled reviews based on comprehension score
- Dates calculated correctly

### Validation Checklist

**Chapter Note Quality:**
- [ ] All 9 sections present
- [ ] Quotes are verbatim with page numbers
- [ ] Summary is clear and comprehensive
- [ ] Core teachings are accurate
- [ ] Actionable lessons are practical
- [ ] Content is human-readable and well-formatted
- [ ] No TODO or placeholder text

**Comprehension Testing:**
- [ ] 3-5 questions asked
- [ ] Questions cover different aspects (recall, application, connection)
- [ ] Feedback provided for each answer
- [ ] Score (0-100) assigned and justified

**Persistence:**
- [ ] Chapter file created with correct naming
- [ ] book-metadata.json updated correctly
- [ ] glossary.md has new terms
- [ ] review-schedule.json has scheduled reviews
- [ ] All JSON files are valid

**Review Scheduling:**
- [ ] Number of reviews matches comprehension score tier
- [ ] Intervals calculated correctly
- [ ] Dates are in the future

### Edge Cases to Test

- Perfect comprehension (score 90-100)
- Poor comprehension (score <50)
- Chapter with no clear examples or metaphors
- Chapter with 50+ pages (section handling)

---

## Scenario 5: Cross-Chapter Analysis

**Objective**: Test theme tracking and conceptual connections across multiple chapters.

### Test Steps

1. **Complete at least 3 chapters** (repeat Scenario 4)

2. **Request cross-chapter analysis**
   ```
   What themes have emerged across the chapters I've read so far?
   ```

3. **Check cross-chapter-analysis.md**
   ```
   cat test-output/your-book-name/cross-chapter-analysis.md
   ```

### Expected Outputs

**cross-chapter-analysis.md should contain:**

**Recurring Themes:**
- Theme name
- Chapters where it appears
- How it evolves
- Key insight

**Conceptual Connections:**
- Concept A and Concept B
- Chapter references
- Relationship description

**Evolution of Ideas:**
- Core argument/idea
- How it's introduced, expanded, applied

### Validation Checklist

- [ ] Themes are genuinely recurring (not one-off)
- [ ] Connections are valid and meaningful
- [ ] Evolution tracking shows progression
- [ ] References to specific chapters are accurate
- [ ] Insights are substantive, not superficial
- [ ] File is human-readable

### Edge Cases to Test

- Chapters with no obvious connections
- Very similar chapters (repetitive content)
- Chapters that contradict each other

---

## Scenario 6: Glossary Management

**Objective**: Test terminology tracking across multiple chapters.

### Test Steps

1. **After completing 2-3 chapters, check glossary**
   ```
   Can you show me the glossary so far?
   ```

2. **Request definition of a specific term**
   ```
   What's the definition of [term] in the glossary?
   ```

3. **Verify glossary file**
   ```
   cat test-output/your-book-name/glossary.md
   ```

### Expected Outputs

**glossary.md structure:**
```markdown
# Technical Glossary

## A
**[Term]**
- **Definition**: ...
- **Chapter Introduced**: X
- **Context**: ...
- **Related Terms**: ...

## B
...
```

### Validation Checklist

- [ ] Terms are alphabetically organized
- [ ] Each term has all 4 fields
- [ ] Definitions are clear and concise
- [ ] Chapter references are correct
- [ ] Context explains book-specific usage
- [ ] Related terms are valid cross-references
- [ ] 5-10 terms per chapter added
- [ ] No duplicate terms

### Edge Cases to Test

- Term appearing in multiple chapters (should reference first occurrence)
- Very technical term requiring detailed definition
- Common term with book-specific meaning

---

## Scenario 7: Spaced Repetition Review

**Objective**: Test review scheduling and retention assessment.

### Test Steps

1. **Check what reviews are due**
   ```
   What reviews do I have scheduled?
   ```

2. **Simulate time passing** (edit review-schedule.json to make a review "due")
   - Change a scheduled_date to today's date or earlier

3. **Request review session**
   ```
   Let's do the review for Chapter 1.
   ```

4. **Complete review**
   - Answer recall questions
   - Receive retention score
   - Verify schedule updated

### Expected Outputs

**Review session should include:**
- Free recall questions (recall without notes)
- Application questions (apply to new scenario)
- Reflection questions (from original chapter notes)
- Immediate feedback on answers
- Retention score (0-100)

**review-schedule.json updates:**
- completed: true
- completed_date: today's date
- retention_score: assigned score
- Future reviews adjusted based on performance

### Validation Checklist

- [ ] Review questions are appropriate
- [ ] Questions test different levels (recall, application, reflection)
- [ ] Feedback is constructive
- [ ] Retention score is justified
- [ ] review-schedule.json updated correctly
- [ ] Future intervals adjusted appropriately
- [ ] High retention (>90) → longer intervals
- [ ] Low retention (<70) → shorter intervals or extra review

### Edge Cases to Test

- Perfect retention (score 95+)
- Poor retention (score <50)
- Multiple reviews due on same day
- Review of a chapter read months ago (simulate)

---

## Scenario 8: Progress Tracking

**Objective**: Test progress reporting and analytics.

### Test Steps

1. **Request overall progress**
   ```
   What's my reading progress for this book?
   ```

2. **Request chapter status**
   ```
   Show me the status of all chapters.
   ```

3. **Verify progress calculation**
   - Check book-metadata.json
   - Calculate expected percentages

### Expected Outputs

**Progress report:**
```markdown
## Reading Progress: [Book Title]

**Completion**: X/Y chapters (ZZ%)

**Chapters Completed**: 1, 2, 3
**Current Chapter**: 4
**Chapters Remaining**: 5, 6, 7, ...

**Average Comprehension**: XX/100
**Total Reading Time**: XX hours (if tracked)

**Upcoming Reviews**:
- Chapter 1: Due in X days
- Chapter 2: Due in Y days
```

**Chapter status overview:**
```markdown
1. Introduction ✓ (Score: 85)
2. Foundations ✓ (Score: 92)
3. Core Concepts ⏸ (In progress)
4. Advanced Topics ○ (Not started)
```

### Validation Checklist

- [ ] Completion percentage is correct
- [ ] Chapter lists are accurate
- [ ] Average comprehension calculated correctly
- [ ] Upcoming reviews listed
- [ ] Status symbols are appropriate (✓ ⏸ ○)
- [ ] All data matches book-metadata.json

---

## Scenario 9: State Recovery (Session Continuity)

**Objective**: Test that the skill can resume reading across sessions.

### Test Steps

1. **Complete some chapters** (at least 2)

2. **Exit Claude Code**
   ```
   exit
   ```

3. **Restart Claude Code**
   ```bash
   claude code
   ```

4. **Request to continue reading**
   ```
   I want to continue reading my book.
   ```

### Expected Outputs

**Welcome back message:**
```markdown
Welcome back! You're reading "[Book Title]".

**Last session**: Chapter X completed on [date]
**Current progress**: X/Y chapters (ZZ%)
**Suggested next**:
- Continue to Chapter Y
- Review Chapter A (scheduled for today)
```

### Validation Checklist

- [ ] Skill recognizes existing book
- [ ] Loads correct metadata
- [ ] Shows accurate progress
- [ ] Suggests appropriate next action
- [ ] Can resume from current chapter
- [ ] All previous data intact

---

## Scenario 10: Multiple Books Management

**Objective**: Test handling multiple books simultaneously.

### Test Steps

1. **Initialize first book** (Scenario 1)
   - Save to `test-output/book-one/`

2. **Complete a few chapters** of book one

3. **Initialize second book**
   ```
   I want to start a new book: sample-data/another-book.pdf
   Save notes to test-output/book-two/
   ```

4. **Switch between books**
   ```
   Let's continue with [first book name]
   ```
   ```
   Now switch to [second book name]
   ```

### Expected Outputs

- Each book has separate output directory
- Correct metadata loaded when switching
- No data pollution between books
- Progress tracked independently

### Validation Checklist

- [ ] Both books initialized correctly
- [ ] Separate output directories
- [ ] Can switch between books
- [ ] Data doesn't mix
- [ ] Progress tracked per book
- [ ] Reviews scheduled per book

---

## Regression Test Suite

After making changes to the skill, run this quick regression test:

### Quick Smoke Test (15 minutes)
1. ✅ Initialize a book (Scenario 1)
2. ✅ Pre-read Chapter 1 (Scenario 2)
3. ✅ Complete Chapter 1 (Scenario 4)
4. ✅ Check all files created
5. ✅ Verify JSON validity

### Comprehensive Test (1-2 hours)
1. ✅ All scenarios 1-10
2. ✅ Edge cases for each scenario
3. ✅ File integrity checks
4. ✅ Session continuity test
5. ✅ Multiple books test

---

## Test Data Recommendations

**Good test books:**
- Technical books with 10-20 chapters
- Clear chapter structure and TOC
- Mix of concepts, examples, and applications
- Well-formatted PDFs with readable text

**Avoid:**
- Scanned PDFs (text extraction issues)
- Books without clear chapters
- Very short books (<100 pages)
- Novels or fiction (skill designed for technical content)

**Suggested books if you need examples:**
- "Clean Code" by Robert Martin
- "Deep Learning" by Goodfellow et al.
- "Designing Data-Intensive Applications" by Kleppmann
- "The Pragmatic Programmer" by Hunt & Thomas
- Any O'Reilly technical book

---

## Debugging Tips

**If a test fails:**

1. **Check the logs**
   - Review Claude's responses for errors
   - Look for incomplete workflows

2. **Validate output files**
   ```bash
   # Check JSON validity
   python3 -m json.tool test-output/book-name/book-metadata.json

   # Check file existence
   ls -la test-output/book-name/

   # Check chapter note format
   head -50 test-output/book-name/chapters/chapter-01-*.md
   ```

3. **Verify symlink**
   ```bash
   ls -la .claude/skills/book-reading-assistant
   readlink .claude/skills/book-reading-assistant
   ```

4. **Test with minimal book**
   - Use a short PDF (5 chapters) to isolate issues
   - Reduces variables for debugging

5. **Check skill code**
   - Review `skills/book-reading-assistant/SKILL.md`
   - Check reference files for formatting templates

---

## Success Criteria

The skill passes testing if:

✅ **All 10 scenarios complete successfully**
✅ **All output files are well-formatted**
✅ **JSON files are valid**
✅ **Chapter notes follow 9-section format**
✅ **Comprehension testing is interactive and meaningful**
✅ **Review scheduling uses correct intervals**
✅ **Cross-chapter analysis identifies real patterns**
✅ **Glossary is comprehensive and organized**
✅ **State recovery works across sessions**
✅ **Multiple books can be managed independently**

---

Happy testing! 🧪📚
