#!/usr/bin/env python
"""
CLI test script for the Recruitment Orchestrator.
Run with: python -m tests.test_orchestrator
"""

import asyncio
import sys
import os
from pathlib import Path

# Add parent directory to path so we can import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.orchestration import (
    RecruitmentOrchestrator,
    JobDescription,
    CandidateProfile,
)
import uuid
from datetime import datetime, timezone

async def test_orchestrator_with_dummy_data():
    """Test the orchestrator with dummy job and candidates"""
    
    print("\n" + "="*60)
    print("🧪 Recruitment Orchestrator - Smoke Test")
    print("="*60 + "\n")
    
    # Create dummy job
    job = JobDescription(
        job_id=str(uuid.uuid4()),
        recruiter_id="recruiter_test_001",
        recruiter_email="test-recruiter@company.com",
        title="Senior Python Backend Engineer",
        required_skills=["Python", "FastAPI", "PostgreSQL", "LangGraph", "Redis"],
        min_years_experience=3.0,
        description="""
        We are looking for a Senior Python Backend Engineer to join our AI recruitment team.
        
        Responsibilities:
        - Build and maintain production-grade AI pipelines
        - Design scalable backend systems using FastAPI
        - Work with LangGraph for agent orchestration
        
        Requirements:
        - 3+ years of Python experience
        - Strong background in API design
        - Experience with PostgreSQL and async programming
        """,
        closed_at=datetime.now(timezone.utc).isoformat(),
    )
    
    print(f"📋 Job Created:")
    print(f"   Title: {job.title}")
    print(f"   Required Skills: {', '.join(job.required_skills)}")
    print(f"   Min Experience: {job.min_years_experience} years\n")
    
    # Create dummy candidates
    candidates = [
        CandidateProfile(
            application_id=str(uuid.uuid4()),
            job_id=job.job_id,
            candidate_name="Alice Chen",
            candidate_email="aadya7497@gmail.com",
            resume_text="""
            Senior Python Engineer with 6 years of experience.
            
            Skills: Python, FastAPI, Django, PostgreSQL, Redis, LangGraph, AWS
            Experience: Built a multi-agent AI system processing 10k+ applications/hour.
            Led backend team of 4 engineers.
            Expertise in async programming and high-performance APIs.
            """,
            years_experience=6.0,
            skills=["Python", "FastAPI", "PostgreSQL", "LangGraph", "Redis", "AWS"],
            applied_at=datetime.now(timezone.utc).isoformat(),
        ),
        CandidateProfile(
            application_id=str(uuid.uuid4()),
            job_id=job.job_id,
            candidate_name="Bob Smith",
            candidate_email="aadya7497@gmail.com",
            resume_text="""
            Mid-level Python Developer with 2 years of experience.
            
            Skills: Python, Flask, SQLAlchemy, MySQL
            Experience: Built REST APIs for small e-commerce platform.
            Familiar with basic Docker and Git workflows.
            Looking to grow into backend architecture.
            """,
            years_experience=2.0,
            skills=["Python", "Flask", "MySQL", "Docker"],
            applied_at=datetime.now(timezone.utc).isoformat(),
        ),
        CandidateProfile(
            application_id=str(uuid.uuid4()),
            job_id=job.job_id,
            candidate_name="Carol Davis",
            candidate_email="aadya7497@gmail.com",
            resume_text="""
            Backend Engineer with 4 years of experience.
            
            Skills: Python, FastAPI, PostgreSQL, Celery, Redis, LangChain
            Experience: Migrated legacy monolith to microservices.
            Implemented background job processing for 50k+ daily tasks.
            Strong understanding of database optimization and caching strategies.
            """,
            years_experience=4.0,
            skills=["Python", "FastAPI", "PostgreSQL", "Redis", "Celery", "LangChain"],
            applied_at=datetime.now(timezone.utc).isoformat(),
        ),
        CandidateProfile(
            application_id=str(uuid.uuid4()),
            job_id=job.job_id,
            candidate_name="David Miller",
            candidate_email="aadya7497@gmail.com",
            resume_text="""
            Junior Python Developer with 1 year experience.
            
            Skills: Python, Django basics, HTML/CSS
            Experience: Completed internship at startup.
            Built small CRUD applications.
            Enthusiastic about learning backend systems.
            """,
            years_experience=1.0,
            skills=["Python", "Django", "SQLite"],
            applied_at=datetime.now(timezone.utc).isoformat(),
        ),
    ]
    
    print(f"👥 Candidates Created: {len(candidates)}")
    for c in candidates:
        print(f"   - {c.candidate_name}: {c.years_experience} yrs, {len(c.skills)} skills")
    
    print("\n" + "="*60)
    print("🚀 Running Orchestrator...")
    print("="*60 + "\n")
    
    # Run orchestrator
    orchestrator = RecruitmentOrchestrator()
    result = await orchestrator.process(
        job=job,
        applications=candidates,
        token_data=None  # No Google OAuth tokens for test
    )
    
    print("\n" + "="*60)
    print("📊 ORCHESTRATOR RESULTS")
    print("="*60)
    print(f"✅ Success: {result['success']}")
    print(f"📝 Response: {result['response']}")
    
    if result.get('metadata'):
        print(f"\n📈 Metadata:")
        meta = result['metadata']
        print(f"   Total Applications: {meta.get('total_applications', 0)}")
        print(f"   Auto Accepted (HIGH): {meta.get('auto_accepted', 0)}")
        print(f"   Human Review (MID): {meta.get('sent_to_human_review', 0)}")
        print(f"   Auto Rejected (LOW): {meta.get('auto_rejected', 0)}")
        print(f"   Bias Flags Raised: {meta.get('bias_flags_raised', 0)}")
    
    if result.get('errors'):
        print(f"\n⚠️ Errors:")
        for err in result['errors']:
            print(f"   - {err}")
    
    print("\n" + "="*60)
    print("✅ Test Complete!")
    print("="*60 + "\n")
    
    return result

async def test_single_candidate():
    """Test with just one candidate for quick validation"""
    
    print("\n" + "="*60)
    print("🧪 Quick Single Candidate Test")
    print("="*60 + "\n")
    
    job = JobDescription(
        job_id=str(uuid.uuid4()),
        recruiter_id="recruiter_test_001",
        recruiter_email="test@company.com",
        title="Python Developer",
        required_skills=["Python", "FastAPI"],
        min_years_experience=2.0,
        description="Looking for a Python developer with FastAPI experience.",
        closed_at=datetime.now(timezone.utc).isoformat(),
    )
    
    candidate = CandidateProfile(
        application_id=str(uuid.uuid4()),
        job_id=job.job_id,
        candidate_name="Test Candidate",
        candidate_email="aadya7497@gmail.com",
        resume_text="3 years Python experience, worked with FastAPI and PostgreSQL.",
        years_experience=3.0,
        skills=["Python", "FastAPI", "PostgreSQL"],
        applied_at=datetime.now(timezone.utc).isoformat(),
    )
    
    orchestrator = RecruitmentOrchestrator()
    result = await orchestrator.process(
        job=job,
        applications=[candidate],
        token_data=None
    )
    
    print(f"✅ Success: {result['success']}")
    print(f"📝 Response: {result['response']}")
    return result

if __name__ == "__main__":
    print("\n🔧 Recruitment Orchestrator Test CLI")
    print("Options:")
    print("  1. Full test (4 candidates)")
    print("  2. Quick test (1 candidate)")
    
    choice = input("\nSelect test (1 or 2): ").strip()
    
    if choice == "2":
        asyncio.run(test_single_candidate())
    else:
        asyncio.run(test_orchestrator_with_dummy_data())