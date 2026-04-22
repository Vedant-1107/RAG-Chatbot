import logging
import shutil
import os

from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from config import settings
from rag_pipeline import RAGPipeline
from utils import validate_pdf, sanitize_filename

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rag_pipeline = None

@app.on_event("startup")
async def startup():
    global rag_pipeline
    try:
        rag_pipeline = RAGPipeline()
    except Exception as e:
        logger.error(e)
        rag_pipeline = None

@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    if not rag_pipeline:
        raise HTTPException(500, "Pipeline not initialized")

    path = settings.DATA_DIR / sanitize_filename(file.filename)

    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    valid = validate_pdf(path)
    if not valid["valid"]:
        raise HTTPException(400, valid["error"])

    return rag_pipeline.process_pdf(path)

@app.get("/ask")
async def ask(query: str = Query(...)):
    if not rag_pipeline:
        raise HTTPException(500, "Pipeline not initialized")

    return rag_pipeline.query(query)

@app.post("/clear")
async def clear():
    return {"message": "memory cleared"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 10000))
    )