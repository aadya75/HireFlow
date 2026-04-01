from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List
from uuid import UUID
import uuid

from app.api_models import CandidateApplyRequest, CandidateResponse, CandidateWithScore
from app.supabase import supabase
from app.orchestration import RecruitmentOrchestrator

router = APIRouter()
orchestrator = RecruitmentOrchestrator()


@router.post("/apply", response_model=CandidateResponse, status_code=201)
async def apply_to_job(candidate: CandidateApplyRequest) -> CandidateResponse:
    """Submit a job application"""
    job = supabase.get_job(candidate.job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    existing = supabase.admin_client.table("candidates")\
        .select("*")\
        .eq("email", candidate.email)\
        .eq("job_id", str(candidate.job_id))\
        .execute()
    
    if existing.data:
        raise HTTPException(status_code=400, detail="Application already exists")
    
    candidate_data = candidate.model_dump()
    candidate_data["id"] = str(uuid.uuid4())
    
    result = supabase.admin_client.table("candidates").insert(candidate_data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create application")
    
    return result.data[0]


@router.get("/jobs/{job_id}/candidates", response_model=List[CandidateResponse])
async def get_job_candidates(job_id: UUID) -> List[CandidateResponse]:
    """Retrieve all candidates for a specific job"""
    response = supabase.admin_client.table("candidates")\
        .select("*")\
        .eq("job_id", str(job_id))\
        .execute()
    return response.data


@router.get("/{candidate_id}", response_model=CandidateResponse)
async def get_candidate(candidate_id: UUID) -> CandidateResponse:
    """Retrieve a specific candidate by ID"""
    response = supabase.admin_client.table("candidates")\
        .select("*")\
        .eq("id", str(candidate_id))\
        .execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    return response.data[0]


@router.post("/{candidate_id}/process", response_model=CandidateResponse)
async def process_candidate(candidate_id: UUID) -> CandidateResponse:
    """Trigger screening for a specific candidate"""
    response = supabase.admin_client.table("candidates")\
        .select("*")\
        .eq("id", str(candidate_id))\
        .execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    candidate_data = response.data[0]
    job = supabase.get_job(UUID(candidate_data["job_id"]))
    
    if not job:
        raise HTTPException(status_code=404, detail="Associated job not found")
    
    from app.orchestration import JobDescription, CandidateProfile
    
    job_description = JobDescription(
        job_id=job["id"],
        recruiter_id=job["recruiter_id"],
        recruiter_email="",
        title=job["title"],
        required_skills=[],
        min_years_experience=0.0,
        description=job["description"],
        closed_at=job.get("created_at", ""),
    )
    
    candidate_profile = CandidateProfile(
        application_id=candidate_data["id"],
        job_id=candidate_data["job_id"],
        candidate_name=candidate_data["name"],
        candidate_email=candidate_data["email"],
        resume_text="",
        years_experience=0.0,
        skills=[],
        applied_at=candidate_data.get("created_at", ""),
    )
    
    result = await orchestrator.process(job_description, [candidate_profile])
    
    if not result.get("success"):
        raise HTTPException(status_code=500, detail="Processing failed")
    
    updated = supabase.admin_client.table("candidates")\
        .select("*")\
        .eq("id", str(candidate_id))\
        .execute()
    
    return updated.data[0]