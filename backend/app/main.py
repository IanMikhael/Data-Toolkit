from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import datasets, cleaning, sql, analysis

app = FastAPI(title="Data Toolkit API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(datasets.router, prefix="/api/datasets", tags=["Datasets"])
app.include_router(cleaning.router, prefix="/api/cleaning", tags=["Cleaning"])
app.include_router(sql.router, prefix="/api/sql", tags=["SQL Workspace"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["Analysis & Aggregation"])

@app.get("/api/health")
def health_check():
    return {"status": "success"}
