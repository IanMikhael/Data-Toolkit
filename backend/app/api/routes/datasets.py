from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
import shutil
import os
import polars as pl
from app.database import get_db, log_action, STORAGE_DIR

router = APIRouter()

@router.get("/download")
def download_dataset(file_path: str, filename: str):
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File tidak ditemukan")
    
    media_type = 'application/octet-stream'
    if file_path.endswith('.xlsx'): media_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    elif file_path.endswith('.csv'): media_type = 'text/csv'
    elif file_path.endswith('.json'): media_type = 'application/json'
    
    return FileResponse(path=file_path, filename=f"cleaned_{filename}", media_type=media_type)

@router.post("/import")
async def import_dataset(file: UploadFile = File(...)):
    # BUKA KUNCI EKSTENSI BARU
    allowed_ext = ('.csv', '.xlsx', '.xls', '.json', '.parquet')
    if not file.filename.endswith(allowed_ext):
        raise HTTPException(status_code=400, detail="Format tidak didukung. Gunakan CSV, Excel, JSON, atau Parquet.")
    
    file_path = os.path.join(STORAGE_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO datasets (filename, file_path) VALUES (?, ?)", (file.filename, file_path))
        dataset_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        log_action(dataset_id, "UPLOAD", "File pertama kali diunggah ke sistem.")
        
        # LOGIKA BACA POLARS YANG BARU
        if file.filename.endswith('.csv'): df = pl.read_csv(file_path)
        elif file.filename.endswith('.json'): df = pl.read_json(file_path)
        elif file.filename.endswith('.parquet'): df = pl.read_parquet(file_path)
        else: df = pl.read_excel(file_path)
        
        null_counts = {col: int(df[col].is_null().sum()) for col in df.columns}
        
        return {
            "status": "success",
            "data": {
                "id": dataset_id,
                "filename": file.filename,
                "file_path": file_path,
                "rows": df.height,
                "columns": df.width,
                "dtypes": {col: str(dtype) for col, dtype in zip(df.columns, df.dtypes)},
                "duplicate_count": int(df.is_duplicated().sum()),
                "null_counts": null_counts,
                "preview": df.head(10).to_dicts()
            }
        }
    except Exception as e:
        if os.path.exists(file_path): os.remove(file_path)
        raise HTTPException(status_code=400, detail=f"Gagal membaca file: {str(e)}")

@router.get("/")
def get_all_datasets():
    conn = get_db()
    datasets = conn.execute("SELECT * FROM datasets ORDER BY updated_at DESC").fetchall()
    result = []
    for d in datasets:
        dataset = dict(d)
        logs = conn.execute("SELECT * FROM logs WHERE dataset_id = ? ORDER BY created_at DESC", (dataset['id'],)).fetchall()
        dataset['logs'] = [dict(l) for l in logs]
        result.append(dataset)
    conn.close()
    return {"status": "success", "data": result}

@router.delete("/{dataset_id}")
def delete_dataset(dataset_id: int):
    conn = get_db()
    dataset = conn.execute("SELECT * FROM datasets WHERE id = ?", (dataset_id,)).fetchone()
    if not dataset:
        conn.close()
        raise HTTPException(status_code=404, detail="Dataset tidak ditemukan")
    if os.path.exists(dataset['file_path']): os.remove(dataset['file_path'])
    conn.execute("DELETE FROM datasets WHERE id = ?", (dataset_id,))
    conn.commit()
    conn.close()
    return {"status": "success"}

@router.put("/{dataset_id}")
def rename_dataset(dataset_id: int, new_name: str):
    conn = get_db()
    dataset = conn.execute("SELECT * FROM datasets WHERE id = ?", (dataset_id,)).fetchone()
    if not dataset:
        conn.close()
        raise HTTPException(status_code=404, detail="Dataset tidak ditemukan")
    conn.execute("UPDATE datasets SET filename = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (new_name, dataset_id))
    conn.commit()
    conn.close()
    log_action(dataset_id, "RENAME", f"Mengubah nama file menjadi {new_name}")
    return {"status": "success"}

@router.post("/{dataset_id}/log")
def add_custom_log(dataset_id: int, action: str, details: str = ""):
    log_action(dataset_id, action, details)
    return {"status": "success"}

@router.get("/{dataset_id}/load")
def load_dataset(dataset_id: int):
    conn = get_db()
    dataset = conn.execute("SELECT * FROM datasets WHERE id = ?", (dataset_id,)).fetchone()
    conn.close()
    if not dataset: raise HTTPException(status_code=404, detail="Dataset tidak ditemukan")
    
    file_path = dataset['file_path']
    if dataset['filename'].endswith('.csv'): df = pl.read_csv(file_path)
    elif dataset['filename'].endswith('.json'): df = pl.read_json(file_path)
    elif dataset['filename'].endswith('.parquet'): df = pl.read_parquet(file_path)
    else: df = pl.read_excel(file_path)
    
    null_counts = {col: int(df[col].is_null().sum()) for col in df.columns}
    log_action(dataset_id, "OPEN", "Dataset dibuka untuk workspace cleaning.")
    
    return {
        "status": "success",
        "data": {
            "id": dataset['id'],
            "filename": dataset['filename'],
            "file_path": file_path,
            "rows": df.height,
            "columns": df.width,
            "dtypes": {col: str(dtype) for col, dtype in zip(df.columns, df.dtypes)},
            "duplicate_count": int(df.is_duplicated().sum()),
            "null_counts": null_counts,
            "preview": df.head(10).to_dicts()
        }
    }
