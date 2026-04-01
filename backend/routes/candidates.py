from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List
from uuid import UUID
from backend.app.api_models import CandidateCreate, CandidateResponse, CandidateWithScore
from app.supabase import supabase
import uuid

router = APIRouter()

@router.post("/apply", response_model=CandidateResponse, status_code=201)
async def apply_to_job(candidate: CandidateCreate):
    """Candidate applies to a job"""
    # Verify job exists
    job = supabase.get_job(candidate.job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Check for duplicate
    response = supabase.admin_client.table("candidates").select("*").eq("email", candidate.email).eq("job_id", str(candidate.job_id)).execute()
    if response.data:
        raise HTTPException(status_code=400, detail="You have already applied to this job")
    
    # Create candidate record
    candidate_data = candidate.model_dump()
    candidate_data["id"] = str(uuid.uuid4())
    
    result = supabase.admin_client.table("candidates").insert(candidate_data).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to submit application")
    
    return result.data[0]

@router.get("/jobs/{job_id}/candidates", response_model=List[CandidateWithScore])
async def get_job_candidates(job_id: UUID):
    """Get all candidates for a job"""
    response = supabase.admin_client.table("candidates").select("*").eq("job_id", str(job_id)).execute()
    return response.data

@router.get("/{candidate_id}", response_model=CandidateWithScore)
async def get_candidate(candidate_id: UUID):
    """Get a specific candidate"""
    response = supabase.admin_client.table("candidates").select("*").eq("id", str(candidate_id)).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return response.data[0]