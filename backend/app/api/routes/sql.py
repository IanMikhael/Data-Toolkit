from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import polars as pl
import duckdb
import os
import uuid

router = APIRouter()
TEMP_DIR = os.path.abspath(os.path.join(os.getcwd(), "../storage/temp"))
os.makedirs(TEMP_DIR, exist_ok=True)

class QueryRequest(BaseModel):
    file_path: str
    query: str

@router.post("/execute")
async def execute_query(request: QueryRequest):
    if not os.path.exists(request.file_path):
        raise HTTPException(status_code=404, detail="File tidak ditemukan.")
    
    try:
        # 1. Baca file saat ini
        file_ext = os.path.splitext(request.file_path)[1]
        if file_ext == '.csv':
            data = pl.read_csv(request.file_path)
        else:
            data = pl.read_excel(request.file_path)
            
        # 2. Buka koneksi DuckDB
        con = duckdb.connect()
        con.register('data', data)
        
        # 3. FIX: Gunakan con.sql() alih-alih con.execute() agar dikenali sebagai Relation Object
        result_df = con.sql(request.query).pl()
        
        # 4. Ambil metadata
        row_count = result_df.height
        col_count = result_df.width
        dtypes = {col: str(dtype) for col, dtype in zip(result_df.columns, result_df.dtypes)}
        preview_data = result_df.head(100).to_dicts()
        
        # 5. Simpan file hasil query untuk Export
        export_filename = f"query_result_{uuid.uuid4().hex}.csv"
        export_path = os.path.join(TEMP_DIR, export_filename)
        result_df.write_csv(export_path)
        
        con.close()

        return {
            "status": "success",
            "message": "Query berhasil dieksekusi",
            "data": {
                "rows": row_count,
                "columns": col_count,
                "dtypes": dtypes,
                "preview": preview_data,
                "export_path": export_path,
                "export_filename": export_filename
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error SQL: {str(e)}")
