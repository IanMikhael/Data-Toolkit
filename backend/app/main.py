from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import datasets

app = FastAPI(title="Data Toolkit API", version="1.0.0")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Daftarkan router datasets
app.include_router(datasets.router, prefix="/api/datasets", tags=["Datasets"])

@app.get("/api/health")
def health_check():
    return {"status": "success", "message": "Backend Data Toolkit berjalan optimal!"}
