import sqlite3
import os

STORAGE_DIR = os.path.abspath(os.path.join(os.getcwd(), "../storage/datasets"))
os.makedirs(STORAGE_DIR, exist_ok=True)
DB_PATH = os.path.abspath(os.path.join(os.getcwd(), "../storage/database.db"))

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    # Tabel File Manager
    cursor.execute('''CREATE TABLE IF NOT EXISTS datasets (id INTEGER PRIMARY KEY AUTOINCREMENT, filename TEXT NOT NULL, file_path TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS logs (id INTEGER PRIMARY KEY AUTOINCREMENT, dataset_id INTEGER, action TEXT NOT NULL, details TEXT, created_at DATETIME DEFAULT (datetime('now', 'localtime')), FOREIGN KEY (dataset_id) REFERENCES datasets (id) ON DELETE CASCADE)''')
    
    # --- TABEL BARU: SQL SCRIPT MANAGER ---
    cursor.execute('''CREATE TABLE IF NOT EXISTS sql_scripts (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, query_text TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS sql_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, script_id INTEGER, action TEXT NOT NULL, details TEXT, created_at DATETIME DEFAULT (datetime('now', 'localtime')), FOREIGN KEY (script_id) REFERENCES sql_scripts (id) ON DELETE CASCADE)''')
    
    conn.commit()
    conn.close()

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def log_action(dataset_id: int, action: str, details: str = ""):
    conn = get_db()
    conn.execute("INSERT INTO logs (dataset_id, action, details) VALUES (?, ?, ?)", (dataset_id, action, details))
    conn.commit()
    conn.close()

def log_sql_action(script_id: int, action: str, details: str = ""):
    conn = get_db()
    conn.execute("INSERT INTO sql_logs (script_id, action, details) VALUES (?, ?, ?)", (script_id, action, details))
    conn.commit()
    conn.close()
