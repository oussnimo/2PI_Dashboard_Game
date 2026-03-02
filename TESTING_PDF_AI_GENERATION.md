# 🧪 Guide de Test - AI PDF Question Generator

## Objectif

Vérifier que l'IA peut maintenant générer des questions **basées sur le contenu du PDF et des liens** fournis par l'utilisateur.

---

## 📊 Architecture du Workflow

```
USER INTERFACE
    ↓ Upload PDF + Add Links + Write Prompt
    ↓
┌─────────────────────────────────────────┐
│  AIQuestionGenerator.jsx (Frontend)    │
│  handleGenerateAllQuestions()           │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  STEP 1: Process Attachments            │
│  POST /api/attachments/process          │
│  (FormData: {pdf, links[]})             │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  AttachmentController.php               │
│  • Parse PDF with smalot/pdfparser      │
│  • Extract text completely              │
│  • Validate URLs                        │
│  • Store file in storage/app/pdfs/      │
│  Returns: {pdf_text, links, ...}       │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  STEP 2: Generate Questions             │
│  POST /api/generate-questions           │
│  (JSON: {pdf_text, links, prompt, ...}) │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  AIQuestionController.php               │
│  • Enrich prompt with PDF content       │
│  • Add links to prompt                  │
│  • Call Groq API                        │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  Groq API (LLaMA/Mixtral)               │
│  🤖 AI SEES:                             │
│    • Original prompt from user          │
│    • 📄 COMPLETE PDF TEXT               │
│    • 🔗 ALL REFERENCE LINKS             │
│  → Generates contextual questions       │
└─────────────────────────────────────────┘
    ↓ Questions based on PDF content!
```

---

## ✅ QUICK TEST (5 minutes)

### Prerequisites

- Backend running: `php artisan serve`
- Frontend running: `npm run dev`
- Logged in to the application

### Steps

1. **Go to AI Question Generator**
   - Open the application
   - Click on AI Question Generator panel

2. **Fill Basic Form**

   ```
   Course: Sciences
   Topic: Système Solaire
   Game Number: 1
   ```

3. **Select Levels** (important!)
   - Level 1: Select "Boxes"
   - Level 2: Select "Balloons"

4. **Add Attachments** (This is the KEY TEST)

   **Option A - Upload PDF**
   - Click PDF upload button
   - Choose any PDF file (~1-5MB)
   - Should see: "✅ PDF ajouté"

   **Option B - Add Links** (easier to test first)
   - Click Link button
   - Add one of these links:
     ```
     https://en.wikipedia.org/wiki/Solar_System
     https://www.nasa.gov/our-universe/solar-system/
     ```
   - Should see: "✅ Lien ajouté"

5. **Write Meaningful Prompt**

   ```
   Generate 5 questions about planets in the solar system,
   focusing on their distances from the Sun, temperatures,
   and number of satellites. Base questions on the provided
   PDF and reference links.
   ```

6. **Click "Generate All Questions"**
   - Wait for generation (30-60 seconds)
   - Should see: "✅ All 2 levels generated successfully!"

---

## 🔍 How to Verify AI Used PDF/Links

### Method 1: Check Generated Questions (Visual)

**Expected Behavior WITH PDF/Links:**

- Questions mention specific planets (Mercury, Venus, Mars, etc.)
- Questions include specific data (distances: "150 million km", temperatures)
- Questions reference facts from PDF/web content
- Questions are contextual and specific

**Bad Sign (AI NOT using content):**

- Generic questions: "What is a planet?"
- No reference to provided PDF/links
- Unrelated questions
- Same questions as without PDF

### Method 2: Check Backend Logs (Console)

Open **new terminal** in BackEnd folder:

```bash
cd C:\Users\hp\Desktop\2pi-Dashboard-AI-integration-main\BackEnd
tail -f storage/logs/laravel.log
```

**Expected Log Output:**

```
📎 [Attachment] Processing attachments...
📄 [Attachment] Processing PDF file...
✅ PDF stored at: pdfs/xxxxxx.pdf
✅ PDF text extracted. Length: 2847 chars
🔗 [Attachment] Validating provided links...
✅ Link valid: https://wikipedia.org/Solar_System
✅ [Attachment] Processing complete
🚀 [AIQuestion] Bulk generation request received
📄 [AIQuestion] Adding PDF content to prompt
🔗 [AIQuestion] Adding links to prompt. Count: 1
🌐 [AIQuestion] Calling Groq API matching user provided script...
🔄 Trying Groq API with model: llama-3.1-8b-instant
✅ [AIQuestion] Successfully generated all levels.
```

### Method 3: Check File Storage

Verify that PDF files are being stored:

```bash
ls -la C:\Users\hp\Desktop\2pi-Dashboard-AI-integration-main\BackEnd\storage\app\pdfs\
```

You should see PDF files like: `pdfs/xxxxxx.pdf`

---

## 🧪 DETAILED TEST SCENARIOS

### Scenario 1: Test with Solar System Content

**Input PDF Content:**

```
LE SYSTÈME SOLAIRE

Planètes:
1. MERCURE - 58 millions km du Soleil, -173°C à 427°C
2. VÉNUS - 108 millions km du Soleil, 464°C, aucun satellite
3. TERRE - 150 millions km du Soleil, 15°C, 1 satellite (Lune)
4. MARS - 228 millions km, -140°C à 20°C, 2 satellites (Phobos, Déimos)
5. JUPITER - 778 millions km, -110°C, 95+ satellites
6. SATURNE - 1,4 milliards km, -140°C, 146+ satellites, anneaux
```

**Expected Questions Generated:**

```
Level 1 (Box - 5 questions):
Q1: Quelle planète est la plus proche du Soleil?
    A: Mercure

Q2: À quelle température se trouve la surface de Vénus?
    A: 464°C

Q3: Combien de satellites naturels la Terre a-t-elle?
    A: 1

Q4: Quel est le nom du plus grand satellite de Mars?
    A: Phobos

Q5: Laquelle est la plus grande planète du système solaire?
    A: Jupiter

Level 2 (Balloon - 10 true/false):
Q: Jupiter a plus de 90 satellites?
   ✓ True
   ✓ True (multiple correct answers for balloon mode)
   ✗ False
   ...
```

---

## ⚠️ Troubleshooting

### Problem: "❌ PDF not processed"

- Check logs for parsing errors
- Verify PDF is valid (not corrupted)
- Try with a different PDF file
- Check file size < 5MB

### Problem: "Generated questions don't reference PDF"

- Verify API received `pdf_text` (check logs)
- Confirm PDF text was extracted (check logs: "PDF text extracted")
- Check if attachment_id is in database
- Verify Groq API received enriched prompt

### Problem: "❌ Backend error on attachment upload"

- Ensure `storage/pdfs/` directory exists
- Run: `php artisan storage:link`
- Check file permissions on storage folder

### Problem: "⏱️ Generation taking too long"

- Groq API might be rate-limited
- Check if GROQ_API_KEY is set correctly
- Try again in 60 seconds

---

## 📝 Test Checklist

- [ ] Backend is running (`php artisan serve`)
- [ ] Frontend is running (`npm run dev`)
- [ ] I'm logged in
- [ ] I can access AI Question Generator
- [ ] I filled Course, Topic, Game Number
- [ ] I selected Level Types (Box + Balloon)
- [ ] I uploaded a PDF OR added links
- [ ] I wrote a specific prompt
- [ ] Generation completed without errors
- [ ] Generated questions reference PDF/link content
- [ ] Level 1 has 5 questions (Box type)
- [ ] Level 2 has 1 question with 10 answers (Balloon type)
- [ ] Questions are specific (not generic)
- [ ] Backend logs show PDF parsed successfully

---

## 🚀 Expected Timeline

- **Upload PDF:** 1-2 seconds
- **Validate Links:** instant
- **Generate Questions:** 15-30 seconds (depends on Groq API)
- **Total Time:** 20-40 seconds

---

## 📚 Files to Understand

1. **[AttachmentController.php](../../BackEnd/app/Http/Controllers/AttachmentController.php)**
   - Handles PDF parsing and link validation

2. **[AIQuestionController.php](../../BackEnd/app/Http/Controllers/AIQuestionController.php)**
   - Enriches prompt with PDF content
   - Sends to Groq API

3. **[AIQuestionGenerator.jsx](../../FrontEnd/src/components/AIQuestionGenerator.jsx)**
   - 2-step workflow (upload attachments, then generate)
   - Sends pdf_text and links to backend

4. **[routes/api.php](../../BackEnd/routes/api.php)**
   - Defines `/attachments/process` endpoint

---

## 🎯 Success Criteria

**✅ AI is using PDF/Links if:**

1. Generated questions refer to specific content
2. Questions include data/facts from PDF
3. Questions are contextual
4. Backend logs show PDF parsed
5. Questions are different from generic AI output

**❌ AI is NOT using PDF/Links if:**

1. Questions are generic and generic
2. No reference to provided content
3. Questions don't match the domain
4. Same questions as without PDF

---

## 💡 Tips

- Start with simple PDFs or just use links for testing
- Use content about a specific topic (e.g., Solar System)
- Write prompts that align with the PDF content
- Check logs while testing
- Use different PDFs to verify it works consistently

---

Good luck with testing! 🚀
