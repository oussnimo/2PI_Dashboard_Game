# AI Source Priority & Quality — Test Scenarios

> **Goal:** Evaluate how the AI quiz generator handles different input sources (PDF, URL, prompt description) and understand which source it prioritizes to improve results.

---

## 1. Single Source Tests (Baseline)

| # | Scenario | What to Observe |
|---|----------|----------------|
| 1.1 | Only PDF uploaded | Are questions clearly from the PDF content? |
| 1.2 | Only URL provided | Are questions from that webpage only? |
| 1.3 | Only a description/prompt (no source) | Does AI hallucinate or refuse? |

---

## 2. Dual Source Tests (Priority Detection)

| # | Scenario | What to Observe | results |
|---|----------|----------------|---------|
| 2.1 | PDF + URL with **same topic** | Which source dominates the questions?     |
| 2.2 | PDF + URL with **different topics** | Does AI mix them or pick one? ``YT about triangle and pdf about addition``|  Fixed |
| 2.3 | PDF (long, detailed) + URL (short page) | Does more content = more weight? |
| 2.4 | PDF (short) + URL (long article) | Reverse of above — does URL win? |
| 2.5 | PDF + YouTube URL | Does the transcript or PDF win? |

---

## 3. Prompt Description Influence

| # | Scenario | What to Observe |
|---|----------|----------------|
| 3.1 | PDF + URL + description saying *"focus on the PDF"* | Does the AI respect the instruction? |
| 3.2 | PDF + URL + description saying *"focus on the URL"* | Does the AI respect the instruction? |
| 3.3 | PDF + URL + description about a **3rd unrelated topic** | Does AI ignore sources and follow the prompt? |
| 3.4 | No source + very specific description | Quality of questions without any source |
| 3.5 | PDF + URL + instruction specifying sources per level (e.g., *"level 1 from URL, level 2 from PDF"*) | Does AI assign correct source to each level? |

---

## 4. Content Conflict Tests

| # | Scenario | What to Observe |
|---|----------|----------------|
| 4.1 | PDF and URL have **contradicting facts** | Which version appears in the generated questions? |
| 4.2 | PDF is in one language, URL in another | Does AI mix languages or pick one? |

---

## 5. Edge Cases

| # | Scenario | What to Observe |
|---|----------|----------------|
| 5.1 | Broken/invalid URL + valid PDF | Does it fail gracefully or use only PDF? |
| 5.2 | Empty/minimal PDF + rich URL | Which source is used? |
| 5.3 | Very long PDF (many pages) | Does question quality degrade? |
| 5.4 | URL behind a paywall/login | Does it fail silently or show an error? |

---

## 📊 What to Record for Each Test

For each scenario, note:

- **Source used** — which source the questions clearly came from (look for unique phrases or data points)
- **Number of questions** generated
- **Question quality** — specific vs. generic
- **Any errors** in the AI response

---

## 🔍 Key Questions to Answer

1. Does **content length** determine source priority?
2. Does the **prompt description** override source content?
3. How does the AI handle **conflicting information** across sources?
4. What happens when a source is **unavailable or empty**?

---

## 📁 Prompt Location (for reference)

The AI prompt lives in:
**`BackEnd/app/Http/Controllers/AIQuestionController.php`**

| Part | Lines | Description |
|------|-------|-------------|
| System Prompt | ~L37 | Role definition — "Moroccan primary school math teacher" |
| Source Text Injection | ~L52–L67 | Rules for how the AI uses the uploaded source (PDF/URL text) |
| User Prompt | ~L69–L181 | Full prompt including levels, difficulty, and JSON format |

---

## 📝 Prompt Change Changelog

All changes to the AI prompt are logged here after testing.

---

### ✅ Change #1 — Multi-Source Handling & User Instruction Priority
**Date:** 2026-03-09
**Triggered by:** Test 2.1 — PDF + URL with same topic
**Problem observed:** AI ignored the "focus on both sources" instruction and generated questions ONLY from the PDF (addition), completely ignoring the URL content (triangle). Questions were all "Comment additionne-t-on..." with no triangle-related content.
**Changes made:** 
1. **Reorganized prompt structure** — Moved user's ai_prompt to the VERY TOP (marked as "⚡ INSTRUCTION PRIORITAIRE"), so it comes before source text and has more weight
2. **Added critical mandatory rule** — Added 🔴 "RULE CRITIQUE" that says: "If you receive MULTIPLE SOURCES, you MUST use the content of ALL sources"
3. **Strengthened source text instructions** — Changed from "source text" to "multiple sources" language, explicitly stating never to ignore a source
4. **Added warning language** — "If you ignore one of the sources, it's a serious error"

**File:** `BackEnd/app/Http/Controllers/AIQuestionController.php`
**Lines:** ~L52–L90 (sourceTextSection + userPrompt restructuring)
**Result after change:** [Awaiting re-test of scenario 2.1 with restructured prompt]

---

### 🔧 Change #2 — CRITICAL FIX: Frontend Source Extraction Logic
**Date:** 2026-03-09  
**Triggered by:** Test 2.1 result investigation — User noted AI only used PDF, not URL
**Root cause discovered:** The frontend was treating file and URL extraction as **mutually exclusive** rather than **combinable**:
- If a file was extracted first, `finalSourceText` was populated
- URLs were then NOT extracted because of condition: `if (rawUrls.length > 0 && !finalSourceText.trim())`
- Result: Only PDF content was sent to backend, URL content was completely ignored

**Change made:** 
- **Removed the blocking condition** `&& !finalSourceText.trim()` from URL extraction logic
- **Changed from REPLACE to APPEND**: URLs are now extracted independently and COMBINED with any existing file content
- When both PDF and URLs are provided, `finalSourceText` now contains BOTH sources properly concatenated

**File:** `FrontEnd/src/components/AIQuestionGenerator.jsx`
**Lines:** ~L133–L167 (URL extraction logic)
**Result after change:** [Awaiting re-test of scenario 2.1 — should now send BOTH PDF + URL to AI]

---

### 🔧 Change #3 — CRITICAL: PDF Source Not Labeled (Prevents Level-Specific Instructions)
**Date:** 2026-03-09
**Triggered by:** Test 3.5 failure — User instruction "level 1 from URL, level 2 from PDF" was completely ignored
**Root cause discovered:** 
- **PDF was extracted but sent WITHOUT any source header/label**
- **URLs were extracted WITH clear labels:** `=== SOURCE N: 🔗 Webpage (URL) ===`
- Result: AI received unlabeled PDF content mixed with labeled URL content
- **Without labels, AI cannot identify which source is which**, making granular source assignment impossible

**The data sent to AI looked like:**
```
[Raw PDF content - NO LABEL, no way to know it's a PDF]
[More PDF content...]

=== SOURCE 1: 🔗 Webpage (URL) ===
[URL content]
```
The AI couldn't parse "level 1 from URL" because it couldn't identify the URL source!

**Change made:**
1. **Added source header to PDF extraction** — Now PDFs are labeled: `=== SOURCE 1: 📄 PDF (filename.pdf) ===`
2. **Dynamic source numbering** — If PDF is extracted first, URLs start as SOURCE 2, 3, etc. (not 1, 2)
3. Now ALL sources are clearly labeled and identifiable to the AI

**File:** `FrontEnd/src/components/AIQuestionGenerator.jsx`
**Lines:** ~L103–L156 (PDF header label + dynamic URL source numbers)
**Result after change:** [Awaiting re-test of scenario 3.5 — NOW sources are labeled, so level-specific instructions should work]

---

### ✨ Change #4 — Level-Specific Source Instructions (Backend Prompt)
**Date:** 2026-03-09
**Triggered by:** Test 3.5 — User instruction: "make the first level's questions based on the url and the second level's questions based on the pdf"
**Problem observed:** AI generated Level 1 questions ONLY from PDF (addition) instead of following the user's explicit instruction to use the URL (triangles) for Level 1
**Root cause:** The backend prompt treated all sources as a combined block and didn't parse or respect level-specific source assignments
**Changes made:**
1. **Added RÈGLE #1 — Level-Specific Instructions (PRIORITAIRE)**:
   - AI now parses instructions like "level 1 from URL, level 2 from PDF" or "first level from document"
   - These instructions are marked as HIGHEST PRIORITY
   - When a level-specific instruction is found, the AI uses ONLY that source for that level (no mixing)
2. **Clarified source labeling** — Updated source text section to explain that sources are CLEARLY LABELED with "=== SOURCE N: [TYPE] ===" tags so AI can identify them
3. **Added instruction examples** — Provided clear patterns the AI should recognize: "level X from [source]", "first/second level use...", etc.
4. **Kept Rule #2 for generic cases** — If multiple sources WITHOUT level-specific instructions, use all sources

**File:** `BackEnd/app/Http/Controllers/AIQuestionController.php`
**Lines:** ~L52–L95 (sourceTextSection + userPrompt RÈGLES)
**Result after change:** [Awaiting re-test with level-specific instructions — NOW THAT PDF IS LABELED]

---

### 🔧 Change #5 — CRITICAL: RÈGLE #1 Too Vague, Not Being Applied
**Date:** 2026-03-09
**Triggered by:** Test 3.5 failure — User instruction "level 1 from URL, level 2 from PDF" was completely ignored
**Problem observed:** AI is still mixing sources in both levels:
- Level 1: ALL addition (PDF) instead of ONLY triangles (URL)
- Level 2: Mixed (addition + triangles) instead of ONLY addition (PDF)
**Root cause:** RÈGLE #1 was too vague and conditional. The AI wasn't actively parsing and extracting level-specific directives before generating questions.

**Changes made:**
1. **Made RÈGLE #1 MANDATORY and EXPLICIT**:
   - AI must ACTIVELY ANALYZE the instruction for patterns like "first level", "level 1", "based on", "from URL", "from PDF"
   - Must EXTRACT what level uses what source BEFORE generating ANY questions
   - Added multiple pattern examples so AI can recognize variations

2. **Added PRE-GENERATION ANALYSIS section**:
   - Explicit instructions for BEFORE generating questions:
     1. Analyze instruction and extract directives
     2. Identify which sources for each level
     3. Apply STRICTLY when generating
   - Shows clear examples of CORRECT vs WRONG output
   - ❌ WRONG: Mixed sources in one level
   - ✅ CORRECT: 100% of one level from assigned source only

3. **Made RÈGLE #2 explicitly FALLBACK ONLY**:
   - Changed language to "FALLBACK UNIQUEMENT"
   - Added clear condition: applies ONLY if NO level-specific directives found
   - Prevents AI from using RÈGLE #2 when it should use RÈGLE #1

**File:** `BackEnd/app/Http/Controllers/AIQuestionController.php`
**Lines:** ~L105–L165 (expanded RÈGLE #1 + new PRE-GENERATION section + RÈGLE #2 fallback clause)
**Result after change:** [Awaiting re-test of scenario 3.5 — rules are now much more explicit and mandatory]

---

### 🔧 Change #6 — TWO CRITICAL FIXES: Mandatory Analysis + Stronger Metadata Ban
**Date:** 2026-03-09
**Triggered by:** Test 3.5 result + User observation of bad metadata questions
**Problems observed:**
1. Level-specific directives still being ignored (Level 1 had only PDF questions instead of URL)
2. Bad metadata questions being generated:
   - "Quel est le sujet de la vidéo ?" (subject of video)
   - "Quel est le sujet du document ?" (subject of document)
   - References to non-existent exercises: "Quel est le résultat de l'exercice 3"

**Root cause:** 
1. RÈGLE #1 was too passive — AI wasn't forced to parse and commit to level-specific assignments
2. INTERDIT rules about metadata were too vague — AI was still generating "what is the subject" questions

**Changes made:**

**FIX #1 — Mandatory Internal Analysis (OPTION A IMPLEMENTATION)**:
1. Added `=== MANDATORY: EXTRACT ET STATE YOUR UNDERSTANDING ===` section
2. Forces AI to ANALYZE directives internally before generating:
   - Determine WHICH LEVEL uses WHICH SOURCE
   - State what it will do (internal analysis, not output text)
   - Then generate JSON according to that analysis
3. Makes it impossible for AI to ignore the level assignments — it MUST analyze them first

**FIX #2 — Expanded INTERDIT: Ban Metadata Questions Explicitly**:
1. Changed "INTERDIT" to "INTERDIT ABSOLU" for metadata queries
2. Added specific examples of BANNED questions:
   - "Quel est le sujet du document / vidéo ?" ❌
   - "Quel exercice est mentionné..." ❌
   - References to exercises NOT explicitly in content ❌
   - Any question starting with "Le document dit..." or "La vidéo parle de..." ❌
3. Strengthened with clear EXAMPLES of what NOT to ask
4. Clarified: Questions must be about CONTENT (concepts, rules, facts), NOT about the content's metadata

**File:** `BackEnd/app/Http/Controllers/AIQuestionController.php`
**Lines:** ~L75–85 (Expanded INTERDIT section) + ~L145–165 (Mandatory analysis section)
**Result after change:** [Awaiting re-test of scenario 3.5 — mandatory analysis should force correct level assignment + banned metadata should eliminate bad questions]

---

### 🔧 Change #7 — CRITICAL: Remove Metadata from URL Extraction + Strengthen Source ID Recognition
**Date:** 2026-03-09
**Triggered by:** Test 3.5 result — Level 2 had metadata questions like "Quel est le titre de la vidéo ?" (What is the video title?)
**Root causes discovered:**
1. **URL extraction was including metadata (title, description)** that the AI could access and ask about
   - Code was including: `"Video Title: Les triangles CM1 - CM2 - 6ème..."`
   - AI extracted this and generated questions about the title instead of the content
2. **Level-specific directives still being reversed** — Level 1 had PDF questions instead of URL questions
   - Likely cause: AI wasn't clearly identifying which SOURCE is which before assigning to levels

**Changes made:**

**FIX #1 — Remove Metadata from YouTube Extraction**:
1. Removed `"Video Title: ..."` from all three extraction tiers (Tier 1, 2, 3)
2. Only the actual transcript/description is sent to AI, NO title/metadata
3. This prevents AI from having access to questions about "what is the title"

**FIX #2 — Strengthen Source Identification (ÉTAPE 1 in mandatory analysis)**:
1. Added explicit **ÉTAPE 1: IDENTIFY SOURCE TYPES** step
   - AI must look at source headers and identify: "SOURCE 1 is PDF about addition", etc.
   - Before doing anything else
2. Added **ÉTAPE 2: PARSE INSTRUCTION FOR KEYWORDS**
   - Explicitly look for "level 1 from URL" and translate to "Which SOURCE is the URL?"
3. Added **ÉTAPE 3: CREATE YOUR ASSIGNMENT MAP**
   - AI makes internal mapping: "Level 1 → SOURCE X"
4. Only then **ÉTAPE 4: GENERATE QUESTIONS** according to the map

**File 1:** `BackEnd/app/Http/Controllers/SourceInputController.php`
**Lines:** ~L155–180 (Tier 1, 2, 3 YouTube extraction) — Removed title/metadata
**File 2:** `BackEnd/app/Http/Controllers/AIQuestionController.php`
**Lines:** ~L151–185 (New ÉTAPE 1-4 in mandatory analysis section)
**Result after change:** [Awaiting re-test — metadata questions should be gone + level directives should finally be respected]

---

<!-- TEMPLATE FOR FUTURE CHANGES — copy and fill in:

### 🔄 Change #N — [Short Title]
**Date:** YYYY-MM-DD
**Triggered by:** Test [X.Y] — [scenario name]
**Problem observed:** [what went wrong in the test]
**Change made:** [what was modified in the prompt]
**File:** `BackEnd/app/Http/Controllers/AIQuestionController.php`
**Line(s):** ~LXX
**Result after change:** [did it improve? still testing?]

-->

### 🔄 Change #N — [Short Title]
**Date:** YYYY-MM-DD
**Triggered by:** Test [X.Y] — [scenario name]
**Problem observed:** [what went wrong in the test]
**Change made:** [what was modified in the prompt]
**File:** `BackEnd/app/Http/Controllers/AIQuestionController.php`
**Line(s):** ~LXX
**Result after change:** [did it improve? still testing?]

-->
