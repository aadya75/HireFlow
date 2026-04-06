from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
import asyncio
import json
from typing import Dict, List
from datetime import datetime

router = APIRouter()

# Store logs per job (in production use Redis)
job_logs: Dict[str, List[dict]] = {}
job_listeners: Dict[str, List[asyncio.Queue]] = {}


def add_log(job_id: str, log_type: str, message: str, data: dict = None):
    """Add a log entry for a job - synchronous version"""
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "type": log_type,
        "message": message,
        "data": data
    }
    
    if job_id not in job_logs:
        job_logs[job_id] = []
    job_logs[job_id].append(log_entry)
    
    # Notify listeners asynchronously without blocking
    if job_id in job_listeners:
        for queue in job_listeners[job_id]:
            # Try to put without await (will be processed by event loop)
            try:
                queue.put_nowait(log_entry)
            except asyncio.QueueFull:
                pass

            
async def event_stream(job_id: str, request: Request):
    """SSE event stream for live logs"""
    queue = asyncio.Queue()
    
    if job_id not in job_listeners:
        job_listeners[job_id] = []
    job_listeners[job_id].append(queue)
    
    try:
        # Send existing logs first
        if job_id in job_logs:
            for log in job_logs[job_id]:
                yield f"data: {json.dumps(log)}\n\n"
        
        # Stream new logs
        while await request.is_disconnected() == False:
            try:
                log = await asyncio.wait_for(queue.get(), timeout=1.0)
                yield f"data: {json.dumps(log)}\n\n"
            except asyncio.TimeoutError:
                yield ": heartbeat\n\n"
    finally:
        if job_id in job_listeners:
            job_listeners[job_id].remove(queue)
            if not job_listeners[job_id]:
                del job_listeners[job_id]


@router.get("/jobs/{job_id}/logs")
async def get_job_logs(job_id: str):
    """Get all logs for a job"""
    return {"logs": job_logs.get(job_id, [])}


@router.get("/jobs/{job_id}/stream")
async def stream_job_logs(job_id: str, request: Request):
    """SSE endpoint for live logs"""
    return StreamingResponse(
        event_stream(job_id, request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )