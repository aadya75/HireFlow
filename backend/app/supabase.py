from supabase import create_client, Client
from app.config import settings
from typing import Optional, Dict, List
from uuid import UUID
from datetime import datetime

class SupabaseService:
    def __init__(self):
        self.client: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        self.admin_client: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    
    def _serialize(self, data: Dict) -> Dict:
        """Convert datetime objects to strings"""
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
    
    # Jobs
    def get_job(self, job_id: UUID) -> Optional[Dict]:
        response = self.client.table("jobs").select("*").eq("id", str(job_id)).execute()
        return self._serialize(response.data[0]) if response.data else None
    
    def get_job_with_applications(self, job_id: UUID):
        """Fetch job and all associated candidates"""
        job = self.get_job(job_id)
        if not job:
            return None, []
        
        response = self.admin_client.table("candidates")\
            .select("*")\
            .eq("job_id", str(job_id))\
            .execute()
        
        candidates = [self._serialize(c) for c in response.data]
        return job, candidates

supabase = SupabaseService()