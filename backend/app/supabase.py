import io
import httpx
import PyPDF2
import pdfplumber
from docx import Document
from typing import Optional, Dict, List
from uuid import UUID
from datetime import datetime
from supabase import create_client, Client
from app.config import settings

class SupabaseService:
    def __init__(self):
        self.client: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        self.admin_client: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    
    def _serialize(self, data: Dict) -> Dict:
        if not data:
            return data
        result = {}
        for key, value in data.items():
            if isinstance(value, datetime):
                result[key] = value.isoformat()
            elif isinstance(value, dict):
                result[key] = self._serialize(value)
            elif isinstance(value, list):
                result[key] = [self._serialize(item) if isinstance(item, dict) else item for item in value]
            else:
                result[key] = value
        return result
    
    async def extract_text_from_pdf(self, file_content: bytes) -> str:
        """Extract text from PDF file using multiple methods"""
        text = ""
        
        # Method 1: Try PyPDF2
        try:
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
            for page in pdf_reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        except Exception as e:
            print(f"PyPDF2 extraction failed: {e}")
        
        # If PyPDF2 returned nothing, try pdfplumber (better for complex PDFs)
        if not text.strip():
            try:
                with pdfplumber.open(io.BytesIO(file_content)) as pdf:
                    for page in pdf.pages:
                        page_text = page.extract_text()
                        if page_text:
                            text += page_text + "\n"
            except Exception as e:
                print(f"pdfplumber extraction failed: {e}")
        
        return text.strip() if text.strip() else "Unable to extract text from PDF"
    
    async def extract_text_from_docx(self, file_content: bytes) -> str:
        """Extract text from DOCX file"""
        try:
            doc = Document(io.BytesIO(file_content))
            text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
            return text.strip() if text.strip() else "Unable to extract text from DOCX"
        except Exception as e:
            print(f"DOCX extraction failed: {e}")
            return "Unable to extract text from DOCX"
    
    async def fetch_and_parse_resume(self, resume_url: str) -> str:
        """Download resume from URL and extract text"""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(resume_url)
                if response.status_code != 200:
                    return f"Failed to download resume: HTTP {response.status_code}"
                
                file_content = response.content
                
                # Detect file type from URL or content
                if resume_url.lower().endswith('.pdf'):
                    return await self.extract_text_from_pdf(file_content)
                elif resume_url.lower().endswith('.docx'):
                    return await self.extract_text_from_docx(file_content)
                else:
                    return "Unsupported file format. Please upload PDF or DOCX."
                    
        except httpx.TimeoutException:
            return "Resume download timeout"
        except Exception as e:
            return f"Failed to parse resume: {str(e)}"
    
    def get_job(self, job_id: UUID) -> Optional[Dict]:
        response = self.client.table("jobs").select("*").eq("id", str(job_id)).execute()
        return self._serialize(response.data[0]) if response.data else None
    
    def get_job_with_applications(self, job_id: UUID):
        job = self.get_job(job_id)
        if not job:
            return None, []
        
        response = self.admin_client.table("candidates").select("*").eq("job_id", str(job_id)).execute()
        candidates = [self._serialize(c) for c in response.data]
        return job, candidates
    
    def update_candidate_score(self, candidate_id: str, score_data: Dict):
        return self.admin_client.table("candidates").update(score_data).eq("id", candidate_id).execute()
    
    def mark_job_processed(self, job_id: str):
        return self.admin_client.table("jobs").update({
            "processed": True, 
            "processed_at": datetime.now().isoformat()
        }).eq("id", job_id).execute()
    
    def save_feedback(self, job_id: str, candidate_id: str, decision: str, reason: str):
        return self.admin_client.table("feedback_logs").insert({
            "job_id": job_id,
            "candidate_id": candidate_id,
            "decision": decision,
            "reason": reason,
            "created_at": datetime.now().isoformat()
        }).execute()

supabase = SupabaseService()