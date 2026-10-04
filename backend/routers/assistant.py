from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Dict, Any

from backend.services.rag import rag_assistant

router = APIRouter(prefix="/api/assistant", tags=["Knowledge Assistant"])

class QueryRequest(BaseModel):
    query: str

@router.post("/ask")
def ask_regulatory_assistant(req: QueryRequest):
    return rag_assistant.answer_query(req.query)

@router.get("/passages")
def list_regulatory_passages():
    """Lists all 42 seeded regulatory summaries for transparent citizen browsing."""
    return [
        {
            "id": p["id"],
            "title": p["title"],
            "authority": p["authority"],
            "section_label": p.get("section_label", ""),
            "short_summary": p["short_summary"],
            "source_url": p.get("source_url", "https://maitri.mahaonline.gov.in/"),
            "is_summary_not_legal_text": True,
            "keywords": p.get("keywords", [])
        }
        for p in rag_assistant.passages
    ]
