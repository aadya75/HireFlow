from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import jobs, candidates, logs  # Add logs import
from app.config import settings

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="AI-powered job application screening",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(jobs.router, prefix="/api/v1/jobs", tags=["jobs"])
app.include_router(candidates.router, prefix="/api/v1/candidates", tags=["candidates"])
app.include_router(logs.router, prefix="/api/v1/logs", tags=["logs"])  # Add logs router

@app.get("/")
async def root():
    return {"message": settings.APP_NAME, "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}