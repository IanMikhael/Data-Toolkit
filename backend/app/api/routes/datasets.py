from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
import polars as pl
import os
import shutil
import uuid

router = APIRouter()
TEMP_DIR = os.path.abspath(os.path.join(os.getcwd(), "../storage/temp"))
os.makedirs(TEMP_DIR, exist_ok=True)

@router.post("/import")
async def import_dataset(file: UploadFile = File(...)):
    if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Hanya file CSV dan Excel yang didukung.")
    try:
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4().hex}{file_ext}"
        file_path = os.path.join(TEMP_DIR, unique_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        if file_ext == '.csv':
            df = pl.read_csv(file_path)
        else:
            df = pl.read_excel(file_path)
            
        row_count = df.height
        col_count = df.width
        dtypes = {col: str(dtype) for col, dtype in zip(df.columns, df.dtypes)}
        duplicate_count = df.is_duplicated().sum()
        null_counts = df.null_count().to_dicts()[0]
        preview_data = df.head(5).to_dicts()

        return {
            "status": "success",
            "data": {
                "file_path": file_path,
                "filename": file.filename,
                "rows": row_count,
                "columns": col_count,
                "dtypes": dtypes,
                "duplicate_count": duplicate_count,
                "null_counts": null_counts,
                "preview": preview_data
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal memproses file: {str(e)}")

@router.get("/download")
async def download_dataset(file_path: str, filename: str):
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File tidak ditemukan.")
    # Mengirim file langsung ke browser untuk diunduh
    return FileResponse(path=file_path, filename=f"cleaned_{filename}", media_type='application/octet-stream')
