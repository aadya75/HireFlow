from pydantic import BaseModel, EmailStr, HttpUrl
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class JobCreateRequest(BaseModel):
    title: str
    description: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    deadline: Optional[datetime] = None


class JobResponse(BaseModel):
    id: UUID
    recruiter_id: UUID
    title: str
    description: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    deadline: Optional[datetime] = None
    created_at: datetime
    processed: Optional[bool] = False


class CandidateApplyRequest(BaseModel):
    job_id: UUID
    name: str
    email: EmailStr
    resume_url: HttpUrl


class CandidateResponse(BaseModel):
    id: UUID
    job_id: UUID
    name: str
    email: str
    resume_url: str
    created_at: datetime
    screening_score: Optional[float] = None
    screening_status: Optional[str] = None
    feedback_reason: Optional[str] = None
    screening_details: Optional[dict] = None


class CandidateWithScore(CandidateResponse):
    pass


class ProcessJobResponse(BaseModel):
    success: bool
    response: str
    metadata: dict
    errors: List[str] = []