import json
import re
import os
from pathlib import Path
from typing import Dict, Any, List, Optional
from rank_bm25 import BM25Okapi
from backend.app.config import settings

CORPUS_PATH = Path(__file__).resolve().parent.parent / "seeds" / "regulatory_corpus.json"

def _tokenize(text: str) -> List[str]:
    clean = re.sub(r"[^\w\s]", " ", text.lower())
    return [w for w in clean.split() if len(w) > 1]

class RegulatoryAssistant:
    def __init__(self, corpus_path: Path = CORPUS_PATH):
        self.corpus_path = corpus_path
        self.passages: List[Dict[str, Any]] = []
        self.bm25: Optional[BM25Okapi] = None
        self._load_corpus()

    def _load_corpus(self):
        if not self.corpus_path.exists():
            self.passages = []
            return
        with open(self.corpus_path, "r", encoding="utf-8") as f:
            self.passages = json.load(f)

        tokenized_corpus = []
        for p in self.passages:
            text = f"{p['title']} {p.get('section_label', '')} {p['short_summary']} {' '.join(p.get('keywords', []))}"
            tokenized_corpus.append(_tokenize(text))

        if tokenized_corpus:
            self.bm25 = BM25Okapi(tokenized_corpus)

    def reload(self):
        self._load_corpus()

    def answer_query(self, query: str) -> Dict[str, Any]:
        """
        Retrieves top relevant statutory passages using BM25.
        Generates citation-grounded response or abstains if confidence is low.
        """
        if not self.bm25 or not self.passages:
            return {
                "abstained": True,
                "confidence": "Low",
                "answer": "Regulatory knowledge corpus is currently unavailable. Please escalate to a department officer.",
                "can_escalate": True,
                "citations": []
            }

        query_tokens = _tokenize(query)
        if not query_tokens:
            return {
                "abstained": True,
                "confidence": "Low",
                "answer": "Please enter a valid inquiry regarding industrial approvals, statutory timelines, or government incentives.",
                "can_escalate": False,
                "citations": []
            }

        doc_scores = self.bm25.get_scores(query_tokens)
        scored_pairs = sorted(zip(range(len(doc_scores)), doc_scores), key=lambda x: x[1], reverse=True)

        top_candidates = [pair for pair in scored_pairs if pair[1] > 2.5][:3]

        # Out of domain check / low confidence threshold
        if not top_candidates or top_candidates[0][1] < 3.2:
            return {
                "abstained": True,
                "confidence": "Low",
                "top_score": float(scored_pairs[0][1]) if scored_pairs else 0.0,
                "answer": (
                    "The knowledge assistant cannot determine an authoritative answer with sufficient confidence from "
                    "the statutory corpus for your specific question. To ensure compliance and prevent regulatory misinterpretation, "
                    "this query should be reviewed by an authorized department officer."
                ),
                "can_escalate": True,
                "citations": []
            }

        top_score = top_candidates[0][1]
        confidence = "High" if top_score >= 7.5 else "Medium"

        retrieved_passages = [self.passages[idx] for idx, score in top_candidates]

        citations = []
        for idx, p in enumerate(retrieved_passages, 1):
            citations.append({
                "citation_no": idx,
                "id": p["id"],
                "title": p["title"],
                "section_label": p.get("section_label", ""),
                "authority": p["authority"],
                "source_url": p.get("source_url", "https://maitri.mahaonline.gov.in/"),
                "is_summary_not_legal_text": True,
                "summary": p["short_summary"]
            })

        # Check for Gemini API Key
        gemini_key = settings.GEMINI_API_KEY
        if gemini_key:
            try:
                from google import genai
                client = genai.Client(api_key=gemini_key)
                context_str = "\n\n".join(
                    f"[{c['citation_no']}] Title: {c['title']}\nAuthority: {c['authority']}\nReference: {c['section_label']}\nSummary: {c['summary']}"
                    for c in citations
                )
                prompt = (
                    f"You are the UDYOGRATH Regulatory Knowledge Assistant. Answer the entrepreneur's question strictly "
                    f"using the provided verified passages below. Always cite the passage numbers [1], [2], etc.\n\n"
                    f"Context Passages:\n{context_str}\n\n"
                    f"Entrepreneur Question: {query}\n\n"
                    f"Answer format: Direct, administrative, professional tone. Include specific citations."
                )
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt
                )
                if response and response.text:
                    return {
                        "abstained": False,
                        "confidence": confidence,
                        "top_score": round(float(top_score), 2),
                        "answer": response.text.strip(),
                        "can_escalate": False,
                        "citations": citations,
                        "source_engine": "Gemini 2.5 Flash Grounded RAG"
                    }
            except Exception as e:
                pass # Fallback to deterministic synthesis below

        # Deterministic Grounded Synthesis Fallback
        lead_passage = citations[0]
        supplementary = citations[1:] if len(citations) > 1 else []

        synthesis_lines = [
            f"Based on regulatory provisions administered by the {lead_passage['authority']} "
            f"([{lead_passage['citation_no']}] {lead_passage['title']} - {lead_passage['section_label']}):",
            "",
            f"• {lead_passage['summary']} [{lead_passage['citation_no']}]"
        ]

        for s in supplementary:
            synthesis_lines.append(f"• Additionally, under {s['authority']} ([{s['citation_no']}] {s['title']}): {s['summary']} [{s['citation_no']}]")

        synthesis_lines.extend([
            "",
            "Notice: This is an administrative summary for general guidance, not legal text. Always verify the current notification with the competent issuing department."
        ])

        return {
            "abstained": False,
            "confidence": confidence,
            "top_score": round(float(top_score), 2),
            "answer": "\n".join(synthesis_lines),
            "can_escalate": False,
            "citations": citations,
            "source_engine": "BM25 Deterministic Statutory Synthesizer"
        }

rag_assistant = RegulatoryAssistant()
