from fastapi import APIRouter, HTTPException, Header, BackgroundTasks
from typing import List
from uuid import UUID
import uuid
from datetime import datetime

from app.api_models import JobCreateRequest, JobResponse, ProcessJobResponse
from app.supabase import supabase
from app.orchestration import RecruitmentOrchestrator, JobDescription, CandidateProfile

router = APIRouter()
orchestrator = RecruitmentOrchestrator(supabase_client=supabase)


@router.post("/", response_model=JobResponse, status_code=201)
async def create_job(job: JobCreateRequest, x_user_id: str = Header(...)) -> JobResponse:
    try:
        user_id = UUID(x_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    job_data = {}
    for key, value in job.model_dump().items():
        if value is None:
            continue
        if isinstance(value, datetime):
            job_data[key] = value.isoformat()
        else:
            job_data[key] = value
    
    job_data["id"] = str(uuid.uuid4())
    job_data["recruiter_id"] = str(user_id)
    job_data["processed"] = False
    
    result = supabase.admin_client.table("jobs").insert(job_data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create job")
    
    return result.data[0]


@router.get("/", response_model=List[JobResponse])
async def get_jobs(x_user_id: str = Header(...)) -> List[JobResponse]:
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
    response = supabase.admin_client.table("jobs")\
        .select("*")\
        .eq("id", str(job_id))\
        .execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return response.data[0]


@router.post("/{job_id}/process", response_model=ProcessJobResponse)
async def process_job(job_id: UUID, background_tasks: BackgroundTasks) -> ProcessJobResponse:
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
    
    if job_data.get("processed", False):
        return ProcessJobResponse(
            success=False,
            response="Job already processed",
            metadata={},
            errors=[]
        )
    
    # Build applications with extracted resume text
    applications = []
    for c in candidates_data:
        # Fetch and parse resume text
        resume_text = await supabase.fetch_and_parse_resume(c.get("resume_url", ""))
        
        applications.append(CandidateProfile(
            application_id=c["id"],
            job_id=c["job_id"],
            candidate_name=c["name"],
            candidate_email=c["email"],
            resume_text=resume_text,
            years_experience=0.0,
            skills=[],
            applied_at=c.get("created_at", ""),
        ))
    
    job = JobDescription(
        job_id=job_data["id"],
        recruiter_id=job_data["recruiter_id"],
        recruiter_email=job_data.get("recruiter_email", ""),
        title=job_data["title"],
        required_skills=[],  # TODO: Parse from description
        min_years_experience=0.0,
        description=job_data["description"],
        closed_at=job_data.get("created_at", ""),
    )
    
    background_tasks.add_task(orchestrator.process_and_save, job, applications, str(job_id))
    
    return ProcessJobResponse(
        success=True,
        response=f"Processing started for {len(applications)} candidates",
        metadata={"job_id": str(job_id), "candidates": len(applications)},
        errors=[]
    )


@router.post("/{job_id}/feedback")
async def submit_feedback(job_id: UUID, feedback: dict, x_user_id: str = Header(...)) -> dict:
    candidate_id = feedback.get("candidate_id")
    decision = feedback.get("decision")
    reason = feedback.get("reason")
    
    if decision == "accept":
        status = "shortlist"
    else:
        status = "rejected"
    
    supabase.admin_client.table("candidates")\
        .update({
            "screening_status": status,
            "feedback_reason": reason,
            "feedback_provided_at": datetime.now().isoformat()
        })\
        .eq("id", candidate_id)\
        .execute()
    
    supabase.save_feedback(str(job_id), candidate_id, decision, reason)
    
    return {"status": "success"}