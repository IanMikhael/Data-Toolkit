from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import polars as pl
import os
from typing import List, Dict, Optional

router = APIRouter()

class CleanOperation(BaseModel):
    action: str
    params: Optional[Dict] = None

class CleanRequest(BaseModel):
    file_path: str
    operations: List[CleanOperation]

@router.post("/")
async def clean_data(request: CleanRequest):
    if not os.path.exists(request.file_path):
        raise HTTPException(status_code=404, detail="File tidak ditemukan.")
        
    try:
        file_ext = os.path.splitext(request.file_path)[1]
        if file_ext == '.csv':
            df = pl.read_csv(request.file_path)
        else:
            df = pl.read_excel(request.file_path)
            
        for op in request.operations:
            if op.action == "drop_duplicates":
                df = df.unique()
            elif op.action == "drop_nulls":
                valid_cols = [col for col in df.columns if df[col].null_count() < df.height]
                if valid_cols:
                    df = df.select(valid_cols)
                df = df.filter(~pl.all_horizontal(pl.all().is_null()))
            elif op.action == "rename_columns" and op.params:
                df = df.rename(op.params)
            elif op.action == "change_dtype" and op.params:
                col = op.params.get("column")
                dtype_str = op.params.get("type")
                if dtype_str == "int":
                    df = df.with_columns(pl.col(col).cast(pl.Int64, strict=False))
                elif dtype_str == "float":
                    df = df.with_columns(pl.col(col).cast(pl.Float64, strict=False))
                elif dtype_str == "str":
                    df = df.with_columns(pl.col(col).cast(pl.String))
            elif op.action == "sort" and op.params:
                col = op.params.get("column")
                desc = op.params.get("descending", False)
                df = df.sort(col, descending=desc)
            elif op.action == "filter" and op.params:
                col = op.params.get("column")
                val = str(op.params.get("value")).lower()
                # Ubah ke pencarian sebagian (contains) yang tidak sensitif huruf besar/kecil
                df = df.filter(pl.col(col).cast(pl.String).str.to_lowercase().str.contains(val))
            elif op.action == "set_header" and op.params:
                row_idx = int(op.params.get("index", 0))
                if 0 <= row_idx < df.height:
                    row_values = df.row(row_idx)
                    new_cols = []
                    seen = set()
                    for i, val in enumerate(row_values):
                        col_name = str(val).strip() if val is not None else ""
                        if not col_name or col_name.lower() == "null":
                            col_name = f"UNNAMED_{i}"
                        orig_name = col_name
                        count = 1
                        while col_name in seen:
                            col_name = f"{orig_name}_{count}"
                            count += 1
                        seen.add(col_name)
                        new_cols.append(col_name)
                    rename_map = {old: new for old, new in zip(df.columns, new_cols)}
                    df = df.rename(rename_map)
                    df = df.slice(row_idx + 1)
        
        if file_ext == '.csv':
            df.write_csv(request.file_path)
        else:
            df.write_excel(request.file_path)
        
        row_count = df.height
        col_count = df.width
        dtypes = {col: str(dtype) for col, dtype in zip(df.columns, df.dtypes)}
        duplicate_count = df.is_duplicated().sum()
        null_counts = df.null_count().to_dicts()[0]
        preview_data = df.head(5).to_dicts()

        return {
            "status": "success",
            "data": {
                "rows": row_count,
                "columns": col_count,
                "dtypes": dtypes,
                "duplicate_count": duplicate_count,
                "null_counts": null_counts,
                "preview": preview_data
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal melakukan cleaning: {str(e)}")
