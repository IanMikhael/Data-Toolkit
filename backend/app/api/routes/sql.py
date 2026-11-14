from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import duckdb
import polars as pl
import os
from app.database import get_db, log_sql_action

router = APIRouter()

class QueryRequest(BaseModel):
    file_path: Optional[str] = None
    query: str

class ScriptCreate(BaseModel):
    title: str
    query_text: str

class ScriptUpdate(BaseModel):
    title: Optional[str] = None
    query_text: Optional[str] = None

# --- CRUD SQL SCRIPTS ---
@router.post("/scripts")
def save_script(script: ScriptCreate):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO sql_scripts (title, query_text) VALUES (?, ?)", (script.title, script.query_text))
    script_id = cursor.lastrowid
    conn.commit()
    conn.close()
    log_sql_action(script_id, "CREATE", f"Script '{script.title}' disimpan untuk pertama kali.")
    return {"status": "success", "data": {"id": script_id}}

@router.get("/scripts")
def get_scripts():
    conn = get_db()
    scripts = conn.execute("SELECT * FROM sql_scripts ORDER BY updated_at DESC").fetchall()
    result = []
    for s in scripts:
        script_dict = dict(s)
        logs = conn.execute("SELECT * FROM sql_logs WHERE script_id = ? ORDER BY created_at DESC", (script_dict['id'],)).fetchall()
        script_dict['logs'] = [dict(l) for l in logs]
        result.append(script_dict)
    conn.close()
    return {"status": "success", "data": result}

@router.put("/scripts/{script_id}")
def update_script(script_id: int, script: ScriptUpdate):
    conn = get_db()
    current = conn.execute("SELECT * FROM sql_scripts WHERE id = ?", (script_id,)).fetchone()
    if not current:
        conn.close()
        raise HTTPException(status_code=404, detail="Script tidak ditemukan")
    
    new_title = script.title if script.title is not None else current['title']
    new_text = script.query_text if script.query_text is not None else current['query_text']
    
    conn.execute("UPDATE sql_scripts SET title = ?, query_text = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (new_title, new_text, script_id))
    conn.commit()
    conn.close()
    log_sql_action(script_id, "UPDATE", f"Menyimpan perubahan pada script '{new_title}'.")
    return {"status": "success"}

@router.delete("/scripts/{script_id}")
def delete_script(script_id: int):
    conn = get_db()
    conn.execute("DELETE FROM sql_scripts WHERE id = ?", (script_id,))
    conn.commit()
    conn.close()
    return {"status": "success"}

@router.post("/scripts/{script_id}/log")
def add_sql_log(script_id: int, action: str, details: str = ""):
    log_sql_action(script_id, action, details)
    return {"status": "success"}

# --- EKSEKUSI QUERY ---
@router.post("/")
async def execute_sql(request: QueryRequest):
    try:
        conn = duckdb.connect(database=':memory:')
        if request.file_path and os.path.exists(request.file_path):
            if request.file_path.endswith('.csv'): df = pl.read_csv(request.file_path)
            elif request.file_path.endswith('.json'): df = pl.read_json(request.file_path)
            elif request.file_path.endswith('.parquet'): df = pl.read_parquet(request.file_path)
            else: df = pl.read_excel(request.file_path)
            arrow_table = df.to_arrow()
            conn.register('dataset', arrow_table)
        
        result = conn.execute(request.query)
        try:
            arrow_result = result.fetch_arrow_table()
            result_df = pl.from_arrow(arrow_result)
            preview_data = result_df.head(1000).to_dicts()
            columns = result_df.columns
            rows = result_df.height
        except Exception:
            preview_data = [{"status": "Query berhasil dieksekusi tanpa mengembalikan baris data."}]
            columns = ["status"]
            rows = 0
        
        return {"status": "success", "data": {"columns": columns, "rows": rows, "preview": preview_data}}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
