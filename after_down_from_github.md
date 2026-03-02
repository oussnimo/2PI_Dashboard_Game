# ✅ Setup Guide — After Downloading from GitHub

Follow these steps **in order** every time you clone/download this project fresh.

---

## �️ DATABASE SETUP (MySQL — do this first!)

This project uses **MySQL** (via XAMPP). Before running anything, you need to create the database.

### Option A — Using phpMyAdmin (easiest)
1. Make sure **XAMPP** is running (Apache + MySQL)
2. Open `http://localhost/phpmyadmin`
3. Click **"New"** on the left sidebar
4. Name the database: `2pi_dashboard`
5. Collation: `utf8mb4_unicode_ci`
6. Click **Create**

### Option B — Using the command line
```
C:\xampp\mysql\bin\mysql.exe -u root -e "CREATE DATABASE IF NOT EXISTS ``2pi_dashboard`` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

---

## �📦 BACKEND (Laravel)

### 1. Go to the BackEnd folder
```
cd BackEnd
```

### 2. Install PHP dependencies
```
composer install
```

### 3. Create the .env file and generate app key
```
Copy-Item .env.example .env
php artisan key:generate
```

### 4. Configure the .env file
Open `BackEnd/.env` and make sure these lines look exactly like this:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=2pi_dashboard
DB_USERNAME=root
DB_PASSWORD=
```

Then add these lines at the **bottom** of the file:
```env
GEMINI_API_KEY=your_gemini_api_key_here

GROQ_API_KEY=your_groq_api_key_here
```

### 5. Run database migrations
```
php artisan migrate
```

### 6. Start the backend server
```
php artisan serve
```
> Backend runs on: **http://127.0.0.1:8000**

---

## 🌐 FRONTEND (React / Vite)

### 7. Open a new terminal and go to the FrontEnd folder
```
cd FrontEnd
```

### 8. Create the frontend .env file
Create a file called `.env` inside the `FrontEnd/` folder with this content:
```
VITE_API_URL=http://127.0.0.1:8000/api
```

### 9. Install JS dependencies
```
npm install
```

### 9. Start the frontend dev server
```
npm run dev
```
> Frontend runs on: **http://localhost:3000**

---

## 🚀 Quick copy-paste summary

```bash
# --- MYSQL (run once) ---
C:\xampp\mysql\bin\mysql.exe -u root -e "CREATE DATABASE IF NOT EXISTS ``2pi_dashboard`` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# --- BACKEND ---
cd BackEnd
composer install
Copy-Item .env.example .env
php artisan key:generate
# (then manually edit .env — see step 4 above)
php artisan migrate
php artisan serve

# --- FRONTEND (new terminal) ---
cd FrontEnd
npm install
npm run dev
```

---

## 🔑 API Keys Reference

| Key | Value |
|-----|-------|
| `GROQ_API_KEY` | *(ask the project owner)* |
| `GEMINI_API_KEY` | *(ask the project owner)* |

---

## ⚠️ Notes
- Make sure **XAMPP is running** (Apache + MySQL) before starting the backend.
- The `vendor/` folder (PHP) and `node_modules/` folder (JS) are **not included** in GitHub — that's why you need to run `composer install` and `npm install` each time.
- The `.env` file is also **not included** in GitHub (it's in `.gitignore`) — that's why you need to create and configure it manually.
- The database `2pi_dashboard` must exist in MySQL **before** running `php artisan migrate`.