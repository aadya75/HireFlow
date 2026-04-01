import logging
from datetime import datetime, timezone
from app.workers.google_auth import get_google_service
from googleapiclient.errors import HttpError

logger = logging.getLogger(__name__)


def create_calendar_event(state: dict) -> dict:
    """Create calendar event using Google Calendar API"""
    service = get_google_service(state, service_name="calendar", version="v3")
    
    start_dt = state.get("event_start")
    end_dt = state.get("event_end")
    
    if not start_dt or not end_dt:
        return {**state, "error": "event_start and event_end required"}
    
    # Ensure seconds are included
    if len(start_dt) == 16:  # "YYYY-MM-DDTHH:MM"
        start_dt += ":00"
    if len(end_dt) == 16:
        end_dt += ":00"
    
    event_body = {
        "summary": state.get("event_summary", "Interview"),
        "description": state.get("event_description", ""),
        "start": {"dateTime": start_dt, "timeZone": "Asia/Kolkata"},
        "end": {"dateTime": end_dt, "timeZone": "Asia/Kolkata"}
    }
    
    # Add attendees if provided
    if attendees := state.get("event_attendees"):
        event_body["attendees"] = [{"email": e} for e in attendees]
    
    try:
        event = service.events().insert(
            calendarId=state.get("calendar_id", "primary"),
            body=event_body,
            conferenceDataVersion=1  # Creates Google Meet link
        ).execute()
        
        logger.info(f"[CALENDAR] Event created: {event.get('id')}")
        
        return {
            **state,
            "created_event_id": event.get("id"),
            "created_event_link": event.get("hangoutLink", event.get("htmlLink")),
            "event_summary": state.get("event_summary"),
            "event_start": start_dt,
            "event_end": end_dt,
            "success": True
        }
        
    except HttpError as e:
        logger.error(f"Failed to create event: {e}")
        return {**state, "error": str(e), "success": False}