import os
from fastapi import APIRouter, HTTPException, File, UploadFile, Form
from typing import List
from uuid import UUID
import uuid
from datetime import datetime

from app.api_models import CandidateResponse
from app.supabase import supabase

router = APIRouter()


@router.post("/apply", response_model=CandidateResponse, status_code=201)
async def apply_to_job(
    job_id: str = Form(...),
    name: str = Form(...),
    email: str = Form(...),
    resume: UploadFile = File(...),
) -> CandidateResponse:
    allowed_extensions = {'.pdf', '.docx'}
    file_ext = os.path.splitext(resume.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are allowed")
    
    job = supabase.get_job(UUID(job_id))
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    existing = supabase.admin_client.table("candidates")\
        .select("*")\
        .eq("email", email)\
        .eq("job_id", job_id)\
        .execute()
    
    if existing.data:
        raise HTTPException(status_code=400, detail="Application already exists")
    
    file_name = f"{uuid.uuid4()}_{datetime.now().strftime('%Y%m%d')}{file_ext}"
    storage_path = file_name
    
    content = await resume.read()
    supabase.admin_client.storage.from_("resumes").upload(storage_path, content, {"content-type": "application/pdf"})
    resume_url = supabase.admin_client.storage.from_("resumes").get_public_url(storage_path)
    
    # Remove screening_status from insert - let it be NULL/default
    candidate_data = {
        "id": str(uuid.uuid4()),
        "job_id": job_id,
        "name": name,
        "email": email,
        "resume_url": resume_url,
        # "screening_status" removed - will use database default
    }
    
    result = supabase.admin_client.table("candidates").insert(candidate_data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create application")
    
    return result.data[0]


@router.get("/jobs/{job_id}/candidates", response_model=List[CandidateResponse])
async def get_job_candidates(job_id: UUID) -> List[CandidateResponse]:
    response = supabase.admin_client.table("candidates")\
        .select("*")\
        .eq("job_id", str(job_id))\
        .execute()
    return response.data


@router.get("/{candidate_id}", response_model=CandidateResponse)
async def get_candidate(candidate_id: UUID) -> CandidateResponse:
    response = supabase.admin_client.table("candidates")\
        .select("*")\
        .eq("id", str(candidate_id))\
        .execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    return response.data[0]