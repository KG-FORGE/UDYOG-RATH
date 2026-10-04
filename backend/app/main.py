from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.config import settings
from backend.app.database import init_db
from backend.scripts.seed_db import seed_database
from backend.routers.auth import router as auth_router
from backend.routers.enterprises import router as enterprises_router
from backend.routers.rules import router as rules_router
from backend.routers.documents import router as documents_router
from backend.routers.applications import router as applications_router
from backend.routers.queries import router as queries_router
from backend.routers.inspections import router as inspections_router
from backend.routers.incentives import router as incentives_router
from backend.routers.assistant import router as assistant_router
from backend.routers.grievances import router as grievances_router
from backend.routers.analytics import router as analytics_router
from backend.routers.audit import router as audit_router
from backend.routers.notifications import router as notifications_router
from backend.routers.demo import router as demo_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB and auto-seed if empty
    init_db()
    seed_database(force=False)
    yield

app = FastAPI(
    title="UDYOGRATH (उद्योगरथ) API",
    description="Integrated Industrial Approval and Compliance Management Platform (SIH26130 - Government of Maharashtra)",
    version=settings.VERSION,
    lifespan=lifespan
)

# Enable CORS for frontend Vite dev server (port 5173, 3000, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all modular routers
app.include_router(auth_router)
app.include_router(enterprises_router)
app.include_router(rules_router)
app.include_router(documents_router)
app.include_router(applications_router)
app.include_router(queries_router)
app.include_router(inspections_router)
app.include_router(incentives_router)
app.include_router(assistant_router)
app.include_router(grievances_router)
app.include_router(analytics_router)
app.include_router(audit_router)
app.include_router(notifications_router)
app.include_router(demo_router)

@app.get("/api/health")
def health_check():
    return {
        "status": "HEALTHY",
        "platform": "UDYOGRATH (उद्योगरथ)",
        "team": "KG-FORGE",
        "problem_statement": "SIH26130",
        "state": "Maharashtra",
        "version": settings.VERSION,
        "disclaimer": "Smart India Hackathon 2026 prototype by Team KG-FORGE. Illustrative data."
    }
