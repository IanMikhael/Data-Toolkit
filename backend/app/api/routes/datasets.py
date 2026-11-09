from fastapi import APIRouter, UploadFile, File, HTTPException
import polars as pl
import io

router = APIRouter()

@router.post("/import")
async def import_dataset(file: UploadFile = File(...)):
    if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Hanya file CSV dan Excel yang didukung.")
    
    try:
        contents = await file.read()
        
        if file.filename.endswith('.csv'):
            df = pl.read_csv(io.BytesIO(contents))
        else:
            df = pl.read_excel(io.BytesIO(contents))
            
        row_count = df.height
        col_count = df.width
        dtypes = {col: str(dtype) for col, dtype in zip(df.columns, df.dtypes)}
        
        # Tambahan: Hitung baris duplikat dan nilai kosong (null)
        duplicate_count = df.is_duplicated().sum()
        null_counts = df.null_count().to_dicts()[0]
        
        preview_data = df.head(5).to_dicts()

        return {
            "status": "success",
            "data": {
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
