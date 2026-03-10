# 📦 SCORM Package Documentation

> **What is SCORM?** SCORM (Sharable Content Object Reference Model) is a standard for e-learning content. It defines how online learning content is packaged and how it communicates with a Learning Management System (LMS) like Moodle, Blackboard, or Canvas.

---

## 🧠 The Big Picture — What This App Does

This app lets teachers/educators:
1. **Create a quiz** (with levels, questions, and answers)
2. **Preview and edit** the quiz
3. **Export it as a SCORM `.zip` package** — ready to upload to any LMS

The SCORM package is a self-contained zip file that any LMS can open and run as an interactive quiz.

---

## 🗺️ Flow: From Quiz Creation to SCORM Export

```
User fills form
      ↓
Quiz data is built in React (FrontEnd)
      ↓
User clicks "Export" in Preview
      ↓
FrontEnd sends POST /api/export-quiz-zip  (with quiz JSON)
      ↓
BackEnd (Laravel) builds the SCORM .zip
      ↓
.zip is downloaded to user's computer
      ↓
User uploads .zip to their LMS (Moodle, etc.)
      ↓
Students play the quiz inside the LMS
```

---

## 🏗️ SCORM Package Structure

When the user clicks Export, the backend creates a `.zip` file with this structure:

```
scorm_quiz_2025-01-01_12-00-00.zip
│
├── imsmanifest.xml          ← The "table of contents" — required by every LMS
├── index.html               ← The entry point — what the LMS opens
├── README.txt               ← Basic info about the quiz
│
├── css/
│   └── style.css            ← Styling for the quiz UI
│
├── js/
│   └── app.js               ← JavaScript that loads and renders the quiz
│
└── content/
    └── questions.json       ← All quiz data (levels, questions, answers)
```

### Why each file matters:

| File | Purpose |
|------|---------|
| `imsmanifest.xml` | **Required by SCORM standard.** Tells the LMS the title, structure, and which file to open first |
| `index.html` | The actual page the student sees inside the LMS |
| `css/style.css` | Makes the quiz look good |
| `js/app.js` | Fetches `questions.json` and renders the quiz |
| `content/questions.json` | The quiz data — all levels, questions, and answers |

---

## 📄 File Deep Dive

### 1. `imsmanifest.xml` — The SCORM Manifest

```xml
<manifest identifier="quiz_abc123" version="1.0">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>   ← SCORM version used
  </metadata>
  <organizations>
    <organization identifier="org1">
      <title>Math - Algebra</title>       ← Course + Topic
      <item identifier="item1" identifierref="res1">
        <title>Math - Algebra</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="res1" type="webcontent">
      <file href="index.html"/>           ← Entry point
    </resource>
  </resources>
</manifest>
```

**Logic:** The manifest ID is generated as `quiz_` + MD5 hash of the title, making it unique per quiz.

---

### 2. `content/questions.json` — The Quiz Data

This is the heart of the SCORM package. It contains all the quiz content:

```json
{
  "title": "Math - Algebra",
  "levels": [
    {
      "level_number": 1,
      "level_type": "box",
      "questions": [
        { "text": "2 + 2 = ?", "answer": "4" },
        { "text": "5 × 3 = ?", "answer": "15" }
      ]
    },
    {
      "level_number": 2,
      "level_type": "balloon",
      "question": "Which is the correct answer for 10 ÷ 2?",
      "answers": [
        { "text": "3", "is_true": false },
        { "text": "5", "is_true": true },
        { "text": "7", "is_true": false }
      ]
    }
  ]
}
```

---

## 🎮 The Two Game Types

This app supports two types of quiz levels:

### 🟦 Box Type
- Multiple question-answer pairs per level
- Each question has one correct text answer
- Example: Flash cards, fill-in-the-blank

```json
{
  "level_type": "box",
  "questions": [
    { "text": "What is 2+2?", "answer": "4" }
  ]
}
```

### 🎈 Balloon Type
- One question per level
- Multiple answer choices (like multiple choice)
- Each answer has `is_true: true/false`
- Example: Pop the correct balloon

```json
{
  "level_type": "balloon",
  "question": "What is 2+2?",
  "answers": [
    { "text": "3", "is_true": false },
    { "text": "4", "is_true": true },
    { "text": "5", "is_true": false }
  ]
}
```

---

## 🔌 The API Endpoint

### `POST /api/export-quiz-zip`

**No authentication required** (public endpoint).

**Request Body:**
```json
{
  "course": "Mathematics",
  "topic": "Algebra",
  "gameNumber": 1,
  "numLevels": 2,
  "levels": [ ... ]
}
```

**Response:** A `.zip` file download (binary blob).

**FrontEnd call** (in [`Preview.jsx`](FrontEnd/src/components/Preview.jsx:157)):

**Step 1 — Send the quiz data to the BackEnd** ([line 157](FrontEnd/src/components/Preview.jsx:157)):
```js
const response = await api.post(`/export-quiz-zip`, payload, {
  responseType: "blob",   // ← tells axios to expect binary data (a file), not JSON
});
```

**Step 2 — Construct the downloadable zip in the browser** ([line 165](FrontEnd/src/components/Preview.jsx:165)):
```js
// The BackEnd sends back raw binary zip data.
// Here we wrap it in a Blob object so the browser can handle it as a file.
const blob = new Blob([response.data], { type: "application/zip" });

// Create a temporary in-memory URL pointing to the Blob
const url = window.URL.createObjectURL(blob);

// Create an invisible <a> link, set the filename, and click it to trigger download
const link = document.createElement("a");
const ts = new Date().toISOString().split(".")[0].replace(/:/g, "-");
link.href = url;
link.setAttribute("download", `scorm_quiz_${ts}.zip`);
document.body.appendChild(link);
link.click();   // ← triggers the browser's "Save file" dialog
link.remove();  // ← clean up the DOM
```

> **Key concept:** The zip file is **built on the BackEnd** (PHP/Laravel assembles all the files into a `.zip`).  
> The **FrontEnd** (starting at line 165) receives the raw binary response and wraps it in a `Blob` — this is how browsers handle file downloads from API responses.  
> `window.URL.createObjectURL(blob)` creates a temporary in-memory URL the browser can download from.

---

## ⚙️ BackEnd Logic — Step by Step

File: [`ExportController.php`](BackEnd/app/Http/Controllers/ExportController.php:10)

```
1. Validate incoming request (course, topic, gameNumber, numLevels, levels)
2. Generate a unique filename: scorm_quiz_2025-01-01_12-00-00.zip
3. Create temp directory: storage/app/temp/
4. Open a new ZipArchive
5. Add files to the zip:
   - imsmanifest.xml  (generated from title)
   - index.html       (generated from title)
   - css/style.css    (static CSS)
   - js/app.js        (static JS)
   - content/questions.json  (the actual quiz data as JSON)
   - README.txt       (basic info)
6. Close the zip
7. Send the zip as a download response
8. Delete the temp file after sending
```

---

## 💾 Database — How Quiz Data is Stored

Before exporting, the quiz is saved to the database. Here's the data model:

```
games
  ├── game_id (PK)
  ├── course
  ├── topic
  ├── game_number
  ├── number_of_levels
  └── user_id

levels
  ├── id (PK)
  ├── game_id (FK → games)
  ├── level_number
  └── level_type  ("box" or "balloon")

box_question_answers          ← For "box" levels
  ├── id (PK)
  ├── level_id (FK → levels)
  ├── question_text
  └── answer_text

balloon_types                 ← For "balloon" levels (the question)
  ├── id (PK)
  ├── level_id (FK → levels)
  └── question_text

balloon_answers               ← For "balloon" levels (the answer choices)
  ├── id (PK)
  ├── balloon_id (FK → balloon_types)
  ├── answer_text
  └── is_correct (boolean)
```

---

## 🖥️ FrontEnd Components Involved

| Component | Role |
|-----------|------|
| [`InitialForm.jsx`](FrontEnd/src/components/InitialForm.jsx) | User fills in course, topic, game number, number of levels |
| [`LevelForm.jsx`](FrontEnd/src/components/LevelForm.jsx) | User configures each level (type + questions/answers) |
| [`LevelsAccordion.jsx`](FrontEnd/src/components/LevelsAccordion.jsx) | Shows all levels in an expandable list |
| [`Preview.jsx`](FrontEnd/src/components/Preview.jsx) | Shows the final quiz, allows editing, and has the **Export** button |
| [`AIQuestionGenerator.jsx`](FrontEnd/src/components/AIQuestionGenerator.jsx) | Optional: AI generates questions automatically |

---

## 🔄 Complete Data Flow

```
InitialForm
  → sets: course, topic, gameNumber, numLevels
  
LevelForm (repeated per level)
  → sets: level_type ("box" or "balloon")
  → sets: questions[] or question + answers[]

Preview
  → displays all data
  → user can edit inline
  → "Save" → sends to /api/game → stored in DB
  → "Export" → sends to /api/export-quiz-zip → downloads .zip
```

---

## 📥 How to Use the SCORM Package in an LMS

1. **Export** the quiz from the app → you get `scorm_quiz_xxx.zip`
2. Go to your LMS (e.g., Moodle)
3. Create a new **SCORM activity**
4. **Upload** the `.zip` file
5. The LMS reads `imsmanifest.xml` to understand the package
6. Students open the activity → LMS loads `index.html`
7. `index.html` runs `js/app.js` which fetches `content/questions.json`
8. The quiz is displayed and students can interact with it

---

## ⚠️ Current Limitations

| Limitation | Description |
|-----------|-------------|
| **Basic SCORM 1.2** | Uses SCORM 1.2 (older standard). No score reporting back to LMS yet |
| **No SCORM API calls** | The `js/app.js` doesn't call `LMSInitialize()` / `LMSSetValue()` — so the LMS won't track completion or scores |
| **Simple UI** | The exported quiz HTML is basic — no game animations like the dashboard |
| **No auth on export** | The `/api/export-quiz-zip` endpoint has no authentication |

---

## 🚀 Summary

| Step | Who | What |
|------|-----|------|
| 1 | Teacher | Creates quiz in the dashboard |
| 2 | FrontEnd | Collects all data into a JSON object |
| 3 | Teacher | Clicks "Export" in Preview |
| 4 | FrontEnd | POSTs JSON to `/api/export-quiz-zip` |
| 5 | BackEnd | Builds a `.zip` with all SCORM files |
| 6 | BackEnd | Sends `.zip` as file download |
| 7 | Teacher | Uploads `.zip` to their LMS |
| 8 | Student | Opens the activity in LMS and plays the quiz |
