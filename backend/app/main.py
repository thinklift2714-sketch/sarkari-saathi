from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import (
    auth,
    conversation,
    voice,
    profile,
    schemes,
    eligibility,
    documents,
    applications,
    integrations,
    analysis,
    admin
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Sarkari Saathi (सरकारी साथी) - AI-Powered Hindi-First Government Scheme Discovery Assistant",
    docs_url="/docs",
    openapi_url="/openapi.json"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(conversation.router, prefix=settings.API_PREFIX)
app.include_router(voice.router, prefix=settings.API_PREFIX)
app.include_router(profile.router, prefix=settings.API_PREFIX)
app.include_router(schemes.router, prefix=settings.API_PREFIX)
app.include_router(eligibility.router, prefix=settings.API_PREFIX)
app.include_router(documents.router, prefix=settings.API_PREFIX)
app.include_router(applications.router, prefix=settings.API_PREFIX)
app.include_router(integrations.router, prefix=settings.API_PREFIX)
app.include_router(analysis.router, prefix=settings.API_PREFIX)
app.include_router(admin.router, prefix=settings.API_PREFIX)


@app.get("/")
def root():
    return {
        "app": "Sarkari Saathi (सरकारी साथी)",
        "tagline": "सरकारी योजनाओं का लाभ, अब हर किसी के साथ।",
        "status": "🟢 Backend is running",
        "docs": "http://localhost:8000/docs",
        "api_prefix": "/api",
        "version": settings.VERSION
    }

@app.get("/api/health")
def health_check():
    from app.database import DB_SCHEMES
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "language": "hi (Hindi-First)",
        "demo_persona": "सीता देवी (52 वर्ष, वाराणसी, उत्तर प्रदेश)",
        "rule_engine": "Python Deterministic Engine Active",
        "schemes_loaded": len(DB_SCHEMES)
    }
