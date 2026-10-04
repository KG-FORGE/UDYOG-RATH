import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent
SAMPLES_DIR = BASE_DIR.parent / "samples"
DATA_DIR = BASE_DIR / "data"

DATA_DIR.mkdir(parents=True, exist_ok=True)
SAMPLES_DIR.mkdir(parents=True, exist_ok=True)

class Settings(BaseModel):
    PROJECT_NAME: str = "UDYOGRATH"
    TEAM_NAME: str = "KG-FORGE"
    PROBLEM_STATEMENT: str = "SIH26130"
    VERSION: str = "1.0.0"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "udyograth-sih26130-secret-key-2026-kgforge")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    DATABASE_URL: str = f"sqlite:///{DATA_DIR / 'udyograth.db'}"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    RULES_FILE: Path = BASE_DIR / "rules" / "v1_rules.json"
    DATA_DIR: Path = DATA_DIR
    SAMPLES_DIR: Path = SAMPLES_DIR

settings = Settings()
