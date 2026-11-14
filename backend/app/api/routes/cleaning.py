from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import polars as pl
from typing import List, Dict, Any
import os

router = APIRouter()

class CleaningOperation(BaseModel):
    action: str
    params: Dict[str, Any] = {}

class CleaningRequest(BaseModel):
    file_path: str
    operations: List[CleaningOperation]

@router.post("/")
async def clean_data(request: CleaningRequest):
    if not os.path.exists(request.file_path):
        raise HTTPException(status_code=404, detail="File tidak ditemukan.")
    
    try:
        if request.file_path.endswith('.csv'): df = pl.read_csv(request.file_path)
        elif request.file_path.endswith('.json'): df = pl.read_json(request.file_path)
        elif request.file_path.endswith('.parquet'): df = pl.read_parquet(request.file_path)
        else: df = pl.read_excel(request.file_path)
        
        for op in request.operations:
            action = op.action
            params = op.params
            
            if action == 'drop_duplicates': df = df.unique()
            elif action == 'drop_nulls': df = df.drop_nulls()
            elif action == 'set_header':
                idx = params.get('index', 0)
                new_headers = df.row(idx)
                df = df.slice(idx + 1)
                df.columns = [str(h) if h else f"col_{i}" for i, h in enumerate(new_headers)]
            elif action == 'rename_columns': df = df.rename(params)
            elif action == 'change_dtype':
                col = params.get('column')
                target_type = params.get('type')
                if col in df.columns:
                    if target_type == 'str': df = df.with_columns(pl.col(col).cast(pl.Utf8, strict=False))
                    elif target_type == 'int': df = df.with_columns(pl.col(col).cast(pl.Int64, strict=False))
                    elif target_type == 'float': df = df.with_columns(pl.col(col).cast(pl.Float64, strict=False))
                    elif target_type == 'bool': df = df.with_columns(pl.col(col).cast(pl.Boolean, strict=False))
                    elif target_type == 'date': df = df.with_columns(pl.col(col).str.to_date(strict=False))
                    elif target_type == 'datetime': df = df.with_columns(pl.col(col).str.to_datetime(strict=False))
            elif action == 'filter':
                col = params.get('column')
                val = params.get('value')
                if col in df.columns: df = df.filter(pl.col(col).cast(pl.Utf8).str.contains(f"(?i){val}"))
            elif action == 'sort':
                col = params.get('column')
                desc = params.get('descending', False)
                if col in df.columns: df = df.sort(col, descending=desc)
            
            # --- FITUR BARU: FIND & REPLACE ---
            elif action == 'find_replace':
                col = params.get('column')
                find_val = str(params.get('find_val'))
                replace_val = str(params.get('replace_val'))
                if col in df.columns:
                    df = df.with_columns(
                        pl.when(pl.col(col).cast(pl.Utf8) == find_val)
                        .then(pl.lit(replace_val))
                        .otherwise(pl.col(col))
                    )
            
            # --- FITUR BARU: INLINE CELL UPDATE ---
            elif action == 'update_cell':
                row_idx = int(params.get('row_index'))
                col = params.get('column')
                new_val = str(params.get('new_val'))
                if col in df.columns:
                    # Tambah kolom index sementara untuk mencari baris spesifik, edit, lalu buang indexnya
                    df = df.with_row_index("temp_row_idx")
                    df = df.with_columns(
                        pl.when(pl.col("temp_row_idx") == row_idx)
                        .then(pl.lit(new_val))
                        .otherwise(pl.col(col))
                    ).drop("temp_row_idx")

        # Simpan kembali
        if request.file_path.endswith('.csv'): df.write_csv(request.file_path)
        elif request.file_path.endswith('.json'): df.write_json(request.file_path)
        elif request.file_path.endswith('.parquet'): df.write_parquet(request.file_path)
        else: df.write_excel(request.file_path)

        null_counts = {col: int(df[col].is_null().sum()) for col in df.columns}
        
        return {
            "status": "success",
            "data": {
                "rows": df.height,
                "columns": df.width,
                "dtypes": {col: str(dtype) for col, dtype in zip(df.columns, df.dtypes)},
                "duplicate_count": int(df.is_duplicated().sum()),
                "null_counts": null_counts,
                "preview": df.head(10).to_dicts()
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Gagal melakukan cleaning: {str(e)}")
