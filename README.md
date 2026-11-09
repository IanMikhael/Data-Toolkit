# Data Toolkit

Aplikasi lokal untuk analisis, pembersihan, dan automasi data.
Dibangun menggunakan React (Vite + TypeScript) untuk antarmuka pengguna dan FastAPI (Python) sebagai backend pemrosesan data.

## Struktur Proyek
- `/frontend`: Antarmuka pengguna (React, Vite, TypeScript)
- `/backend`: API dan logika pemrosesan data (FastAPI, Python)
- `/storage`: Folder runtime lokal untuk metadata dan file ekspor (diabaikan oleh Git)

## Cara Menjalankan Aplikasi

### 1. Jalankan Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload

### 2. Jalankan Frontend
cd frontend
npm run dev

Aplikasi dapat diakses melalui http://localhost:5173
