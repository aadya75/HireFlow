from fastapi import APIRouter, HTTPException, Header, BackgroundTasks
from typing import List
from uuid import UUID
import uuid

from app.api_models import JobCreateRequest, JobResponse, ProcessJobResponse
from app.supabase import supabase
from app.orchestration import RecruitmentOrchestrator, JobDescription, CandidateProfile

router = APIRouter()
orchestrator = RecruitmentOrchestrator()


@router.post("/", response_model=JobResponse, status_code=201)
async def create_job(job: JobCreateRequest, x_user_id: str = Header(...)) -> JobResponse:
    """Create a new job posting"""
    try:
        user_id = UUID(x_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    job_data = {k: v for k, v in job.model_dump().items() if v is not None}
    job_data["id"] = str(uuid.uuid4())
    job_data["recruiter_id"] = str(user_id)
    
    result = supabase.admin_client.table("jobs").insert(job_data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create job")
    
    return result.data[0]


@router.get("/", response_model=List[JobResponse])
async def get_jobs(x_user_id: str = Header(...)) -> List[JobResponse]:
    """Retrieve all jobs for a recruiter"""
    try:
        user_id = UUID(x_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    response = supabase.admin_client.table("jobs")\
        .select("*")\
        .eq("recruiter_id", str(user_id))\
        .execute()
    
    return response.data


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: UUID) -> JobResponse:
    """Retrieve a specific job by ID"""
    response = supabase.admin_client.table("jobs")\
        .select("*")\
        .eq("id", str(job_id))\
        .execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return response.data[0]


@router.post("/{job_id}/process", response_model=ProcessJobResponse)
async def process_job(job_id: UUID, background_tasks: BackgroundTasks) -> ProcessJobResponse:
    """Trigger the recruitment orchestrator for a job"""
    job_data, candidates_data = supabase.get_job_with_applications(job_id)
    
    if not job_data:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if not candidates_data:
        return ProcessJobResponse(
            success=False,
            response="No candidates to process",
            metadata={},
            errors=[]
        )
    
    job = JobDescription(
        job_id=job_data["id"],
        recruiter_id=job_data["recruiter_id"],
        recruiter_email=job_data.get("recruiter_email", ""),
        title=job_data["title"],
        required_skills=[],
        min_years_experience=0.0,
        description=job_data["description"],
        closed_at=job_data.get("created_at", ""),
    )
    
    applications = [
        CandidateProfile(
            application_id=c["id"],
            job_id=c["job_id"],
            candidate_name=c["name"],
            candidate_email=c["email"],
            resume_text="",
            years_experience=0.0,
            skills=[],
            applied_at=c.get("created_at", ""),
        )
        for c in candidates_data
    ]
    
    background_tasks.add_task(orchestrator.process, job, applications)
    
    return ProcessJobResponse(
        success=True,
        response=f"Processing started for {len(applications)} candidates",
        metadata={"job_id": str(job_id), "candidates": len(applications)},
        errors=[]
    )