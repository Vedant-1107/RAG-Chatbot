import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()

class Settings(BaseSettings):
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")

    BASE_DIR: Path = Path(__file__).parent
    DATA_DIR: Path = BASE_DIR / "data"
    CHROMA_DB_DIR: Path = BASE_DIR / "chroma_db"

    EMBEDDING_MODEL: str = "sentence-transformers/paraphrase-MiniLM-L3-v2"
    LLM_MODEL: str = "llama-3.1-8b-instant"

    # 🔥 Improved chunking
    CHUNK_SIZE: int = 1500
    CHUNK_OVERLAP: int = 200

    HOST: str = "0.0.0.0"
    PORT: int = 8000

    ALLOWED_ORIGINS: list = ["http://localhost:5173", "http://localhost:3000"]

settings = Settings()

settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
settings.CHROMA_DB_DIR.mkdir(parents=True, exist_ok=True)