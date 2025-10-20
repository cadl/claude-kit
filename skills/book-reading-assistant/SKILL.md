---
name: book-reading-assistant
description: This skill assists with reading technical books through chapter-by-chapter analysis, comprehension testing, and persistent note-taking. Use this skill when the user wants to read and deeply understand a technical book (PDF/EPUB format), needs structured reading assistance across multiple sessions, or wants to track progress and maintain organized reading notes. Triggers include requests to start reading a book, analyze chapters, save reading notes, track terminology, or schedule review sessions.
---

# Book Reading Assistant

## Overview

This skill enables systematic reading and comprehension of technical books through chapter-by-chapter analysis, interactive learning assistance, and persistent note-taking. Designed for multi-session learning workflows, it helps readers extract key insights, validate understanding, and maintain organized knowledge bases from technical literature.

The skill operates in three reading stages (pre-reading, during-reading, post-reading) and maintains persistent files for continuous learning across sessions.

## Book Initialization Workflow

When the user wants to start reading a new book, follow this initialization sequence:

### 1. Request Book File and Output Directory

Ask the user to provide:
- Path to the book file (PDF or EPUB)
- Desired output directory for persistent notes

### 2. Extract Table of Contents

Use the Read tool to load the book file and identify the table of contents:
- For PDFs: Look for TOC in the first 10-20 pages
- For EPUBs: Claude's Read tool will display the structure
- Identify chapter titles, section headings, and page ranges
- Extract book metadata (title, author, publication info if available)

### 3. Create Directory Structure

Initialize the output directory with this structure:

```
<output-directory>/
├── book-metadata.json
├── chapters/
├── glossary.md
├── cross-chapter-analysis.md
└── review-schedule.json
```

### 4. Initialize book-metadata.json

Create the book metadata file with this structure:

```json
{
  "title": "Book Title",
  "author": "Author Name",
  "file_path": "/path/to/book.pdf",
  "total_chapters": 12,
  "table_of_contents": [
    {
      "chapter": 1,
      "title": "Chapter Title",
      "page_start": 15,
      "page_end": 42,
      "status": "not_started",
      "last_accessed": null,
      "comprehension_score": null
    }
  ],
  "reading_progress": {
    "chapters_completed": 0,
    "current_chapter": null,
    "last_session": null,
    "total_reading_time_minutes": 0
  },
  "created_at": "2025-01-20T10:30:00Z"
}
```

### 5. Initialize Supporting Files

Create empty placeholder files:
- `glossary.md`: "# Technical Glossary\n\n*Terms will be added as you read*"
- `cross-chapter-analysis.md`: "# Cross-Chapter Analysis\n\n## Recurring Themes\n\n## Conceptual Connections\n\n## Evolution of Ideas"
- `review-schedule.json`: `{"reviews": []}`

### 6. Confirm Initialization

Inform the user that the book has been initialized and show:
- Total chapters detected
- Book title and author
- Output directory location
- Suggested next action: "Ready to begin. Which chapter would you like to start with?"

## Chapter Analysis Workflow

When the user indicates they want to analyze a chapter (e.g., "I'm about to read Chapter 3" or "Let's analyze Chapter 1"):

### 1. Load Chapter Content

- Read the book file using the Read tool, focusing on the specific page range for the chapter
- If the chapter is long (>30 pages), consider processing it in sections

### 2. Determine Reading Stage

Identify what stage of reading assistance is needed:
- **Pre-reading**: User says "about to read", "preview", "what should I focus on"
- **During-reading**: User says "I'm reading", "expand on this", "explain more about"
- **Post-reading**: User says "finished", "completed", "test my understanding"

### 3. Apply Stage-Specific Workflow

Execute the appropriate reading stage workflow (detailed in next section)

### 4. Update Persistence Files

After each interaction, update the relevant files:
- Chapter note file (if analysis was performed)
- book-metadata.json (update status, timestamps)
- glossary.md (add new terms)
- cross-chapter-analysis.md (if patterns emerge)
- review-schedule.json (if chapter was completed)

## Reading Stage Workflows

### Pre-Reading Stage

**Goal**: Prepare the reader for effective chapter comprehension by previewing key concepts.

**Process**:
1. Quickly scan the chapter content
2. Identify 3-5 core concepts or topics covered
3. Highlight technical terms that will appear
4. Note any prerequisite knowledge from previous chapters
5. Provide a brief roadmap of the chapter structure

**Output format**:
```markdown
## Chapter X Pre-Reading Brief

### Focus Areas
1. [Key concept 1] - This section introduces...
2. [Key concept 2] - Pay attention to...
3. [Key concept 3] - Understanding this will help...

### Key Terms to Watch For
- **Term 1**: You'll encounter this in the context of...
- **Term 2**: This builds on the concept from Chapter Y...

### Chapter Roadmap
- Introduction (pages X-Y): Sets up the problem
- Core Content (pages Y-Z): Presents three main solutions
- Examples (pages Z-W): Practical applications

### Prerequisite Connections
This chapter builds on concepts from:
- Chapter X: [concept]
- Chapter Y: [concept]
```

### During-Reading Stage

**Goal**: Enhance comprehension through content expansion and divergent thinking.

**Process**:
1. When user mentions a specific concept or section, provide deeper context
2. Offer alternative perspectives or analogies
3. Connect to real-world applications
4. Relate to other chapters or external knowledge
5. Anticipate potential confusion points and clarify

**Interaction style**:
- Wait for user prompts like "expand on X" or "tell me more about Y"
- Provide concise, focused explanations
- Use analogies and examples relevant to technical readers
- Ask probing questions to deepen thinking: "How might this apply to...?"

### Post-Reading Stage

**Goal**: Validate comprehension, create comprehensive chapter notes, and schedule reviews.

**Process**:

#### 1. Create Full Chapter Analysis

Generate a comprehensive chapter note file using the 9-section format (see Chapter Note Format section below). Save this as `chapters/chapter-XX-[title-slug].md`

#### 2. Interactive Comprehension Testing

Conduct a comprehension check dialogue:

```markdown
## Comprehension Check - Chapter X

Let's verify your understanding of the key concepts.

### Question 1: [Core concept]
[Thought-provoking question requiring synthesis]

*[After user answers, provide feedback]*
✓ Correct! You've grasped...
or
↻ Not quite. The chapter emphasized that...

### Question 2: [Application]
[Question about practical application]

### Question 3: [Connection]
How does [concept X] relate to [concept Y] from Chapter Z?
```

Ask 3-5 questions based on the chapter's core teachings. Evaluate user responses and provide constructive feedback.

#### 3. Calculate Comprehension Score

Based on the user's answers, assign a comprehension score (0-100):
- 90-100: Excellent understanding, minimal review needed
- 70-89: Good grasp, schedule one review
- 50-69: Partial understanding, schedule two reviews
- <50: Needs re-reading, schedule intensive review

#### 4. Update Progress Tracking

Update `book-metadata.json`:
- Set chapter status to "completed"
- Record comprehension_score
- Update chapters_completed count
- Set last_accessed timestamp

#### 5. Schedule Spaced Repetition Review

Add review entries to `review-schedule.json` based on the spaced repetition algorithm (see Spaced Repetition section)

#### 6. Update Glossary

Extract new technical terms from the chapter and add to `glossary.md` with definitions

#### 7. Update Cross-Chapter Analysis

If this chapter introduces themes or concepts that connect to previous chapters, update `cross-chapter-analysis.md`

## Chapter Note Format

Each chapter analysis file (`chapters/chapter-XX-[title-slug].md`) follows this 9-section structure:

```markdown
# Chapter X: [Chapter Title]

## 1. Chapter Metadata

- **Chapter Number**: X
- **Chapter Title**: [Title]
- **Page Range**: XX-YY
- **Date Completed**: YYYY-MM-DD
- **Comprehension Score**: XX/100

## 2. Key Quotes

> "Quote 1 - most powerful or central idea from the chapter"
> *(Page XX)*

> "Quote 2 - thought-provoking statement"
> *(Page YY)*

[4-8 quotes total - capture verbatim with page numbers]

## 3. Main Stories / Examples

**Example 1: [Title]**
- [Brief summary of story/anecdote]
- **Moral/Meaning**: [Key takeaway]

**Example 2: [Title]**
- [Summary]
- **Moral/Meaning**: [Takeaway]

## 4. Chapter Summary

[A clear, concise paragraph (4-6 sentences) summarizing the entire chapter. Capture the main arc: what problem is introduced, what solutions/concepts are presented, and what conclusions are reached.]

## 5. Core Teachings

The main ideas, arguments, or lessons from this chapter:

1. **[Teaching 1]**: [Explanation]
2. **[Teaching 2]**: [Explanation]
3. **[Teaching 3]**: [Explanation]

[Continue as needed]

## 6. Actionable Lessons

Practical lessons or advice that can be applied:

- **[Lesson 1]**: [How to apply]
- **[Lesson 2]**: [How to apply]
- **[Lesson 3]**: [How to apply]

## 7. Mindset / Philosophical Insights

Deeper reflections, shifts in thinking, or philosophical takeaways:

- [Insight 1]
- [Insight 2]
- [Insight 3]

## 8. Memorable Metaphors & Analogies

**[Metaphor 1]**: [Original metaphor from the book]
- **Meaning**: [What it illustrates]

**[Metaphor 2]**: [Another comparison]
- **Meaning**: [Explanation]

## 9. Questions for Reflection

1. [Thought-provoking question related to core concept]
2. [Question about application or implications]
3. [Question connecting to broader context]
4. [Question encouraging critical thinking]
5. [Question about personal application]

---

## Reading Notes

[Optional section for any additional observations, personal insights, or questions that arose during reading]
```

**Writing Guidelines**:
- Capture quotes **verbatim** - exact wording from the book
- All other content should be in clear, engaging language
- Keep explanations free of unnecessary fluff
- Maintain the original context and tone of the book
- Make notes human-readable and suitable for future review

## Cross-Chapter Analysis

As the user progresses through multiple chapters, maintain `cross-chapter-analysis.md` to track:

### Recurring Themes

Identify concepts, principles, or topics that appear across multiple chapters:

```markdown
## Recurring Themes

### Theme: [Name]
- **Chapters**: 1, 3, 5, 7
- **Evolution**: How this theme develops across chapters
- **Key Insight**: What the recurring emphasis reveals

### Theme: [Name]
- **Chapters**: 2, 4, 6
- **Evolution**: ...
```

### Conceptual Connections

Map relationships between concepts from different chapters:

```markdown
## Conceptual Connections

### Connection: [Concept A] ↔ [Concept B]
- **Concept A** (Chapter X): [Brief description]
- **Concept B** (Chapter Y): [Brief description]
- **Relationship**: How they relate, dependencies, or contrast
```

### Evolution of Ideas

Track how the author builds arguments progressively:

```markdown
## Evolution of Ideas

### Idea: [Core Argument]
- **Chapter 1**: Foundation - [What's established]
- **Chapter 3**: Expansion - [How it's built upon]
- **Chapter 5**: Application - [Practical implementation]
- **Chapter 8**: Advanced - [Complex extensions]
```

**Update frequency**: Add to cross-chapter analysis after completing each chapter, but only when genuine connections exist. Not every chapter will contribute to every theme.

## Terminology Glossary Management

Maintain `glossary.md` as an alphabetically organized reference of technical terms:

```markdown
# Technical Glossary

## A

**[Term]**
- **Definition**: [Clear, concise explanation]
- **Chapter Introduced**: X
- **Context**: [How it's used in the book]
- **Related Terms**: [term1], [term2]

## B

**[Term]**
- **Definition**: ...
```

**Process**:
1. When processing a chapter, identify technical terms that are:
   - Newly introduced concepts
   - Domain-specific terminology
   - Terms with specific meaning in the book's context
2. Add 5-10 most important terms per chapter
3. Maintain alphabetical order
4. Cross-reference related terms
5. Include the chapter where each term first appears

## Spaced Repetition System

Schedule chapter reviews using a spaced repetition algorithm to combat the forgetting curve.

### Review Intervals

Base review schedule on comprehension score:

**High comprehension (90-100)**:
- Review 1: +7 days
- Review 2: +30 days
- Review 3: +90 days

**Good comprehension (70-89)**:
- Review 1: +3 days
- Review 2: +14 days
- Review 3: +45 days
- Review 4: +90 days

**Moderate comprehension (50-69)**:
- Review 1: +1 day
- Review 2: +7 days
- Review 3: +21 days
- Review 4: +60 days

**Low comprehension (<50)**:
- Suggest immediate re-reading
- Review 1: +2 days (after re-reading)
- Review 2: +7 days
- Review 3: +21 days

### review-schedule.json Format

```json
{
  "reviews": [
    {
      "chapter": 1,
      "chapter_title": "Introduction to Neural Networks",
      "completed_date": "2025-01-15",
      "comprehension_score": 85,
      "reviews": [
        {
          "review_number": 1,
          "scheduled_date": "2025-01-18",
          "completed": true,
          "completed_date": "2025-01-18",
          "retention_score": 90
        },
        {
          "review_number": 2,
          "scheduled_date": "2025-01-29",
          "completed": false,
          "completed_date": null,
          "retention_score": null
        }
      ]
    }
  ]
}
```

### Review Session Workflow

When a review is due or user requests to review a chapter:

1. **Load chapter note file** from `chapters/`
2. **Present key questions** from section 9 (Questions for Reflection)
3. **Add new questions** based on cross-chapter connections discovered since initial reading
4. **Assess retention**: Ask user to recall core teachings without looking at notes
5. **Score retention** (0-100) and record in review-schedule.json
6. **Adjust future intervals**: If retention < 70, schedule an additional review

## Progress Tracking

Provide progress visibility when requested:

### Overall Progress Command

When user asks "What's my progress?" or "How far have I gotten?":

```markdown
## Reading Progress: [Book Title]

**Completion**: X/Y chapters (ZZ%)

**Chapters Completed**: 1, 2, 3, 5
**Current Chapter**: 6
**Chapters Remaining**: 7, 8, 9, 10, 11, 12

**Average Comprehension**: XX/100
**Total Reading Time**: XX hours

**Upcoming Reviews**:
- Chapter 1: Due in 2 days
- Chapter 3: Due in 5 days

**Current Streak**: Read X chapters in the last Y days
```

### Chapter Status Overview

Provide a visual status overview:

```markdown
## Chapter Status

1. Introduction ✓ (Score: 85)
2. Foundations ✓ (Score: 92)
3. Core Concepts ✓ (Score: 78)
4. Advanced Topics ⏸ (In progress)
5. Applications ○ (Not started)
...
```

## State Management

To maintain continuity across sessions, track and persist:

### Current Session State

Keep in working memory during active reading:
- Current book being read
- Current chapter number
- Current reading stage (pre/during/post)
- Output directory path
- Recently discussed concepts

### Load Previous Session

When user returns to reading, check `book-metadata.json` to determine:
- Which book they're reading
- Last chapter accessed
- Reading progress
- Upcoming reviews

Greet returning users with context:
```markdown
Welcome back! You're reading "[Book Title]".

**Last session**: Chapter X completed on [date]
**Current progress**: X/Y chapters (ZZ%)
**Suggested next**:
- Continue to Chapter Y
- Review Chapter A (scheduled for today)
```

## File Update Protocol

After each meaningful interaction, update persistent files:

### Always Update
- `book-metadata.json`: Update timestamps, current chapter, status changes

### Conditionally Update
- Chapter note files: When post-reading analysis is complete
- `glossary.md`: When new terms are identified (batch updates preferable)
- `cross-chapter-analysis.md`: When completing a chapter that reveals connections
- `review-schedule.json`: When completing a chapter or finishing a review

### Write Strategy
- Use Write tool for new files
- Use Edit tool for updates to existing JSON/Markdown files
- Preserve all existing data when making updates
- Validate JSON syntax before writing

## Usage Examples

### Example 1: Starting a New Book

**User**: "I want to start reading 'Deep Learning' by Goodfellow. The PDF is at ~/Books/deep-learning.pdf"

**Response**:
1. Ask for output directory
2. Read PDF to extract TOC
3. Create directory structure
4. Initialize all metadata files
5. Respond: "Initialized 'Deep Learning' with 15 chapters detected. Ready to begin. Which chapter would you like to start with?"

### Example 2: Pre-Reading

**User**: "I'm about to read Chapter 3"

**Response**:
1. Read Chapter 3 content
2. Provide pre-reading brief with focus areas, key terms, roadmap
3. Update book-metadata.json with current_chapter = 3

### Example 3: During Reading Assistance

**User**: "I'm reading the section on backpropagation. Can you expand on the chain rule application?"

**Response**:
1. Provide detailed explanation of chain rule in backpropagation context
2. Offer analogies and examples
3. Connect to previous chapters if relevant
4. No file updates needed (just conversational assistance)

### Example 4: Post-Reading

**User**: "I finished Chapter 3"

**Response**:
1. Generate full 9-section chapter note
2. Conduct comprehension testing (3-5 questions)
3. Calculate score based on answers
4. Save chapter note file
5. Update book-metadata.json
6. Add terms to glossary.md
7. Update cross-chapter-analysis.md if applicable
8. Schedule reviews in review-schedule.json
9. Confirm completion and suggest next chapter

### Example 5: Review Session

**User**: "What reviews are due?"

**Response**:
1. Check review-schedule.json
2. List chapters with reviews scheduled today or overdue
3. Offer to conduct review session
4. When user agrees, load chapter notes and quiz on key concepts

## Resources

This skill uses references to maintain lean instructions while providing detailed specifications:

### references/output-formats.md

Contains detailed templates and schemas for all persistent file formats, including:
- Complete JSON schemas for book-metadata.json and review-schedule.json
- Extended chapter note examples
- Glossary formatting guidelines

### references/spaced-repetition-guide.md

Provides in-depth explanation of:
- Forgetting curve science
- Review interval calculations
- Comprehension scoring rubric
- Retention assessment techniques

**Note**: These reference files are loaded into context only when needed for detailed formatting questions or troubleshooting. The main SKILL.md provides sufficient guidance for typical usage.
