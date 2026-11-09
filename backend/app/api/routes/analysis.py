from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import polars as pl
import duckdb
import os
from typing import Optional

router = APIRouter()

class AggregationRequest(BaseModel):
    file_path: str
    x_column: str
    y_column: str
    agg_func: str # sum, avg, count, min, max
    sort_by_value: bool = True

@router.post("/aggregate")
async def aggregate_data(request: AggregationRequest):
    if not os.path.exists(request.file_path):
        raise HTTPException(status_code=404, detail="File tidak ditemukan.")
    
    try:
        # Baca dataset
        file_ext = os.path.splitext(request.file_path)[1]
        data = pl.read_csv(request.file_path) if file_ext == '.csv' else pl.read_excel(request.file_path)
            
        con = duckdb.connect()
        con.register('data', data)
        
        # Validasi fungsi agregasi untuk mencegah SQL Injection
        valid_funcs = {"sum": "SUM", "avg": "AVG", "count": "COUNT", "min": "MIN", "max": "MAX"}
        func = valid_funcs.get(request.agg_func.lower(), "SUM")
        
        # Susun Query Dinamis
        # Casting sumbu Y ke numerik agar fungsi agregasi tidak error jika ada teks yang nyasar
        query = f"""
            SELECT 
                "{request.x_column}" AS category, 
                {func}(TRY_CAST("{request.y_column}" AS DOUBLE)) AS value 
            FROM data 
            WHERE "{request.x_column}" IS NOT NULL
            GROUP BY "{request.x_column}"
        """
        
        if request.sort_by_value:
            query += " ORDER BY value DESC"
        else:
            query += " ORDER BY category ASC"
            
        # Eksekusi dan konversi
        result_df = con.sql(query).pl()
        con.close()
        
        # Format output khusus untuk ECharts (memisahkan array label kategori dan array data angka)
        categories = result_df["category"].to_list()
        
        # Tangani nilai null di hasil agregasi menjadi 0 agar grafik tidak rusak
        values = [v if v is not None else 0 for v in result_df["value"].to_list()]

        return {
            "status": "success",
            "data": {
                "categories": categories,
                "values": values,
                "x_column": request.x_column,
                "y_column": f"{func} of {request.y_column}"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Gagal melakukan agregasi: {str(e)}")
