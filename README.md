# 2Pi Teacher Dashboard

An interactive quiz/game creator for teachers with AI-powered question generation and SCORM export.

---

## ⚡ Quick Setup (Windows + XAMPP)

### ✅ Step 1 — Install Prerequisites (one-time only)

Make sure you have all of these installed before running the setup:

| Tool | Download |
|---|---|
| **XAMPP** (with MySQL) | https://www.apachefriends.org/ |
| **PHP** (8.1+) | https://www.php.net/downloads (add to PATH) |
| **Composer** | https://getcomposer.org/ |
| **Node.js** (18+) | https://nodejs.org/ |

> 💡 **Tip:** After installing PHP, open a terminal and run `php -v` to confirm it's working. Same for `composer -v` and `node -v`.

---

### ✅ Step 2 — Start XAMPP MySQL

Open XAMPP Control Panel and click **Start** next to **MySQL**.

---

### ✅ Step 3 — Clone the repository

```bash
git clone <repo-url>
cd 2pi-Dashboard-sprint-2-SCORM-package-main
```

---

### ✅ Step 4 — Run the setup script

```powershell
.\setup.ps1
```

This automatically:
- 📁 Creates all required Laravel directories
- 🗄️ Creates the MySQL database `2pi_dashboard`
- 📄 Copies `.env.example` → `.env`
- 📦 Runs `composer install`
- 🔑 Generates the Laravel app key
- 🛠️ Runs database migrations
- 📦 Runs `npm install`

---

### ✅ Step 5 — Add your AI API Keys

Open `BackEnd\.env` and fill in your API keys:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here
```

> 🔑 **Get your keys:**
> - Gemini: https://aistudio.google.com/app/apikey
> - Groq: https://console.groq.com/keys

---

### ✅ Step 6 — Start the servers (two terminals)

**Terminal 1 — Backend:**
```bash
cd BackEnd
php artisan serve
```

**Terminal 2 — Frontend:**
```bash
cd FrontEnd
npm run dev
```

---

### ✅ Step 7 — Open the app

👉 **http://localhost:3000**

---

## 🔧 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | Laravel (PHP) |
| Database | MySQL (via XAMPP) |
| AI | Groq API + Gemini API |
| Export | SCORM 1.2 (ZIP) |

---

## 📁 Project Structure

```
├── BackEnd/          # Laravel API
├── FrontEnd/         # React app
├── setup.ps1         # One-click setup script
└── README.md
```

---

## 🎮 Features

- **AI Question Generator** — Generate quiz questions from text, URLs, or YouTube videos
- **Manual Question Editor** — Type questions manually level by level
- **SCORM Export** — Export your quiz as a SCORM 1.2 compatible package
- **Multi-level Quizzes** — Box and Balloon game types, up to 6 levels
- **Real-time Preview** — Review and edit before exporting

---

## 🛠️ Troubleshooting

**`bootstrap/cache` directory must be present and writable**
> This is fixed automatically by the setup script. If it still happens, run manually:
> ```powershell
> mkdir -Force BackEnd\bootstrap\cache
> mkdir -Force BackEnd\storage\framework\sessions
> mkdir -Force BackEnd\storage\framework\views
> mkdir -Force BackEnd\storage\framework\cache\data
> mkdir -Force BackEnd\storage\logs
> ```

**MySQL not running**
> Open XAMPP Control Panel and make sure MySQL is started before running `setup.ps1`.

**`php` or `composer` not found**
> Make sure PHP and Composer are installed and added to your system PATH.

**App key is empty after setup**
> Run manually from the `BackEnd` folder:
> ```bash
> php artisan key:generate --force
> ```

**Migrations failed**
> Make sure MySQL is running and the database was created. Then run:
> ```bash
> php artisan migrate --force
> ```
