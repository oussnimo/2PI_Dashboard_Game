# 2Pi Teacher Dashboard — Canva Presentation

> **21 slides** — Copy-paste each slide's content into Canva.
> Recommended color palette: Primary `#6B21A8` (purple) · Accent `#00C4CC` (cyan) · Background `#1F2937` (dark)

---

## ==================== SPRINT 1 ====================

---

## SLIDE 1 — Title Slide (Sprint 1)

**Heading:** 2Pi Teacher Dashboard

**Subheading:** Interactive Quiz Creator for Teachers

**Body:** Sprint 1 — Core Application Setup

> 🎨 *Visual suggestion: Purple/cyan gradient background, math symbols (∑ π ÷)*

---

## SLIDE 2 — The Starting Point (Sprint 1)

**Heading:** The Original 2Pi Dashboard

**What was the existing project?**
- 🎓 A web app for teachers to create interactive math quizzes
- 🎮 Students play quizzes as games (Boxes & Balloons)
- 📝 Teachers fill in questions and answers **100% manually**
- 📦 Export quizzes as SCORM packages for any LMS

> 🎨 *Visual suggestion: Simple flow diagram — Teacher (Manual typing) → Quiz → Students*

---

## SLIDE 3 — The Problem with Sprint 1

**Heading:** The Limitation

**The Challenge:**
- Creating quizzes **manually** takes a lot of time
- Teachers had to manually invent 5-10 questions per level
- They had to type out the right/wrong answers for every single balloon/box

**The Goal for the future:** Automate this process using AI so teachers can generate full quizzes in seconds!

> 🎨 *Visual suggestion: A clock or a teacher looking stressed, transitioning to a robot/AI icon*

---

## SLIDE 4 — Tech Stack (Sprint 1)

**Heading:** Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Backend | Laravel 11 (PHP) |
| Database | MySQL |
| Auth | Laravel Sanctum |
| Export | SCORM 1.2 ZIP |

> 🎨 *Visual suggestion: Icon grid (React logo, Laravel logo, MySQL icon)*

---

## SLIDE 5 — Frontend Pages Created (Sprint 1)

**Heading:** Frontend Pages Created

| File | Purpose |
|---|---|
| `pages/Login.jsx` | User login with email/password |
| `pages/Signup.jsx` | User registration |
| `pages/Dashboard.jsx` | View all created quizzes |
| `pages/Settings.jsx` | User preferences, language, theme |

> 🎨 *Visual suggestion: Screenshot thumbnails of each page*

---

## SLIDE 6 — Frontend Components Created (Sprint 1)

**Heading:** Frontend Components Created

| File | Purpose |
|---|---|
| `components/InitialForm.jsx` | Step 0 — Enter course, topic, game#, levels |
| `components/LevelForm.jsx` | Steps 1-N — Add questions/answers per level |
| `components/Preview.jsx` | Final review before save/export |
| `components/Game.jsx` | Student game player |
| `components/Games.jsx` | List of available quizzes to play |

> 🎨 *Visual suggestion: Component diagram showing data flow*

---

## SLIDE 7 — UI Components Created (Sprint 1)

**Heading:** UI Components & Inputs

| File | Purpose |
|---|---|
| `components/Navbar.jsx` | Top navigation bar |
| `components/LoadingSpinner.jsx` | Loading state indicator |
| `components/formQuizInputs/QuizInput.jsx` | Styled text input |
| `components/formQuizInputs/QuizSelect.jsx` | Styled dropdown select |
| `components/LevelForm_btn_inp/box_bal.jsx` | Box/Balloon type toggle buttons |

> 🎨 *Visual suggestion: Show each UI element in a grid*

---

## SLIDE 8 — Context Providers (Sprint 1)

**Heading:** React Context (State Management)

| File | Purpose |
|---|---|
| `context/AuthContext.jsx` | User login/logout, token management |
| `context/ThemeContext.jsx` | Light/Dark mode toggle |
| `context/LanguageContext.jsx` | Multi-language support (EN/FR) |

> 🎨 *Visual suggestion: Three cards with icons*

---

## SLIDE 9 — Backend Controllers Created (Sprint 1)

**Heading:** Backend Controllers

| File | Purpose |
|---|---|
| `AuthController.php` | Login, signup, logout, password reset |
| `GameController.php` | Save quiz to database |
| `GetGamesController.php` | Fetch user's quizzes |
| `RemoveGameController.php` | Delete a quiz |
| `ExportController.php` | Build SCORM ZIP package |

> 🎨 *Visual suggestion: PHP class icons in a row*

---

## SLIDE 10 — Database Schema (Sprint 1)

**Heading:** Database Schema

```
users
  └── games (course, topic, gameNumber, user_id)
        └── levels (level_number, level_type)
              ├── box_question_answers (question, answer)
              └── balloon_types (question)
                    └── balloon_answers (text, is_true)
```

> 🎨 *Visual suggestion: Entity-relationship diagram*

---

## SLIDE 11 — API Endpoints (Sprint 1)

**Heading:** API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|---|
| POST | `/api/login` | User login |
| POST | `/api/register` | User signup |
| POST | `/api/logout` | User logout |
| GET | `/api/select` | Get user's quizzes |
| POST | `/api/game` | Save new quiz |
| DELETE | `/api/delete` | Delete quiz |
| POST | `/api/export-quiz-zip` | Download SCORM package |

> 🎨 *Visual suggestion: Table with method badges (GET/POST/DELETE)*

---

## SLIDE 12 — Two Game Types (Sprint 1)

**Heading:** Two Game Types

### 🟦 Box Type
- Up to 5 question-answer pairs per level
- Flash-card style
- Student types the answer

### 🎈 Balloon Type
- 1 question with up to 10 answer balloons
- Multiple-choice style
- Student pops the correct balloon

> 🎨 *Visual suggestion: Two side-by-side cards with different accent colors*

---

## SLIDE 13 — Teacher Flow (Sprint 1)

**Heading:** How a Teacher Creates a Quiz

1. Login → Dashboard
2. Click "Create New Quiz"
3. **InitialForm** — Enter course, topic, game#, levels
4. **LevelForm** — For each level: choose Box or Balloon, add Q&A
5. **Preview** — Review all levels
6. Save to database OR Export as SCORM ZIP

> 🎨 *Visual suggestion: Numbered step timeline with icons*

---

## SLIDE 14 — SCORM Export (Sprint 1)

**Heading:** SCORM Export

**ZIP contents:**
```
scorm_quiz.zip
├── imsmanifest.xml   ← LMS table of contents
├── index.html        ← Entry point
├── css/style.css     ← Quiz styling
├── js/app.js         ← Quiz renderer
└── content/
    └── questions.json ← All quiz data
```

**Flow:** Quiz → Export → ZIP → Upload to LMS (Moodle, Canvas, etc.)

> 🎨 *Visual suggestion: ZIP file icon with file tree*

---

## ==================== SPRINT 2 ====================

---

## SLIDE 15 — Title Slide (Sprint 2)

**Heading:** 2Pi Teacher Dashboard

**Subheading:** AI-Powered Quiz Creator & SCORM Exporter

**Body:** Sprint 2 — Source Input & AI Generation Feature

> 🎨 *Visual suggestion: Purple/cyan gradient, sparkles ✨*

---

## SLIDE 16 — Sprint 2 Overview

**Heading:** Sprint 2 — AI Question Generator

**The Evolutionary Leap:**
To upgrade the app from 100% manual to AI-driven, we transformed the UI by adding the **`AIQuestionGenerator`** and **`SourceInputPanel`** components, and built the backend plumbing with **`AIQuestionController`** and **`SourceInputController`** to connect the user's files and prompts directly to the AI models.

**New Feature:** AI generates questions automatically!
- Teacher selects game type (Box/Balloon) for each level
- Provides context: text prompt, file upload, or URL
- One click → AI generates **ALL levels at once**
- Questions auto-fill the quiz form
- Jumps directly to Preview

> 🎨 *Visual suggestion: Purple gradient card with sparkles*

---

## SLIDE 17 — New InitialForm Flow (Sprint 2)

**Heading:** Revamped Quiz Setup (InitialForm)

**What changed?**
- **Sprint 1:** Only one button → "Start Creating" (Manual entry)
- **Sprint 2:** Now features **two buttons**!
  1. ▶️ **Start Creating** (Manual flow)
  2. ✨ **Generate Quiz with AI** (Opens the AI Panel)

When the AI button is clicked, the new **`AIQuestionGenerator`** panel slides in right next to the form.

> 🎨 *Visual suggestion: Before/After screenshot of the InitialForm buttons*

---

## SLIDE 18 — Source Input Panel (Sprint 2)

**Heading:** Source Input Panel (ChatGPT-style)

| 📝 Text Prompt | 📄 File Upload | 🔗 URL / YouTube |
|---|---|---|
| Type any instruction | PDF, TXT, DOCX (max 5 MB) | Paste any webpage or YouTube link |
| e.g. "Generate 5 questions about fractions" | Text extracted server-side | Transcript extracted automatically |

**Component:** `components/SourceInputPanel.jsx`

> 🎨 *Visual suggestion: 3-column layout with icons*

---

## SLIDE 19 — How the AI Works (Backend)

**Heading:** How the AI Works (Backend)

**New Backend Files:**
- `AIQuestionController.php` — Groq API integration
- `SourceInputController.php` — File/URL extraction

**Flow:**
```
Frontend sends: course + topic + numLevels + prompt + source_text
          ↓
AIQuestionController.php
  1. Injects source text into prompt
  2. Calls Groq API (tries 3 models)
  3. Cleans response (strips markdown, commas)
  4. Returns structured levels[]
```

**Model fallback:** `llama-3.1-8b` → `llama-3.3-70b` → `mixtral-8x7b`

> 🎨 *Visual suggestion: Vertical flowchart*

---

## SLIDE 20 — YouTube Transcript Extraction

**Heading:** YouTube Transcript Extraction

**3-tier strategy in `SourceInputController.php`:**

| Tier | Method | When it works |
|---|---|---|
| **Tier 1** | YouTube timedtext API | Videos with captions |
| **Tier 2** | YouTube player API | Auto-generated captions |
| **Tier 3** | Title + Description | Last resort |

> 🎨 *Visual suggestion: YouTube icon + 3-step ladder*

---

## SLIDE 21 — Demo / Thank You

**Heading:** Live Demo

**Subheading:** Let's see it in action

**Body:** Running at `http://localhost:3001`

**Footer:** 2Pi Teacher Dashboard — Sprint 1 + Sprint 2 Complete!

> 🎨 *Visual suggestion: App screenshot as background, or QR code*

---

## 🎨 Canva Design Tips

| Element | Value |
|---|---|
| Primary color | `#6B21A8` (purple-deep) |
| Accent color | `#00C4CC` (cyan-main) |
| Dark background | `#1F2937` |
| Light background | `#F9FAFB` |
| Font (heading) | Poppins Bold or Montserrat Bold |
| Font (body) | Inter or Roboto |
| Slide size | 16:9 (1920×1080) |

**Recommended Canva template search:** "Tech Startup Dark Presentation" or "Modern Purple Gradient"
