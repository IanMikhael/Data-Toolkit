from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import polars as pl
import os
import time
from app.database import get_db, log_action, STORAGE_DIR

router = APIRouter()

class DBConfig(BaseModel):
    db_type: str
    host: str
    port: str
    username: str
    password: str
    database: str
    query: str
    dataset_name: str

def build_uri(config: DBConfig):
    # Format URI standar: postgresql://user:pass@host:port/dbname
    return f"{config.db_type}://{config.username}:{config.password}@{config.host}:{config.port}/{config.database}"

@router.post("/import")
async def import_from_db(config: DBConfig):
    uri = build_uri(config)
    try:
        # Eksekusi Query langsung ke Server DB (Super Cepat via ConnectorX)
        df = pl.read_database_uri(query=config.query, uri=uri, engine="connectorx")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Koneksi gagal atau Query error: {str(e)}")
    
    # Simpan hasil tarikan query ke format Parquet lokal agar performanya ngebut
    safe_name = f"{config.dataset_name.replace(' ', '_')}_{int(time.time())}.parquet"
    file_path = os.path.join(STORAGE_DIR, safe_name)
    
    try:
        df.write_parquet(file_path)
        
        # Daftarkan ke DMS (Data Explorer) kita
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO datasets (filename, file_path) VALUES (?, ?)", (f"{config.dataset_name}.parquet", file_path))
        dataset_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        log_action(dataset_id, "DB_IMPORT", f"Ditarik dari {config.db_type.upper()} ({config.database}) dengan custom query.")
        
        null_counts = {col: int(df[col].is_null().sum()) for col in df.columns}
        
        return {
            "status": "success",
            "data": {
                "id": dataset_id,
                "filename": f"{config.dataset_name}.parquet",
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
        raise HTTPException(status_code=500, detail=f"Gagal menyimpan data ke Workspace: {str(e)}")
