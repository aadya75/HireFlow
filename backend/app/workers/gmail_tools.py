import base64
import logging
import email.mime.text
import email.mime.multipart
from app.workers.google_auth import get_google_service
from googleapiclient.errors import HttpError

logger = logging.getLogger(__name__)


def send_gmail_message(state: dict) -> dict:
    """Send email using Gmail API"""
    service = get_google_service(state, service_name="gmail", version="v1")
    to = state.get("email_to")
    subject = state.get("email_subject", "")
    body = state.get("email_body", "")
    
    if not to:
        return {**state, "error": "No 'email_to' in state", "email_sent": False}
    
    try:
        msg = email.mime.multipart.MIMEMultipart()
        msg["to"] = to
        msg["subject"] = subject
        msg.attach(email.mime.text.MIMEText(body, "plain"))
        raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()
        
        sent = service.users().messages().send(userId="me", body={"raw": raw}).execute()
        logger.info(f"[GMAIL] Email sent to {to}: {sent.get('id')}")
        
        return {**state, "email_sent": True, "message_id": sent.get("id")}
        
    except HttpError as e:
        logger.error(f"Failed to send email: {e}")
        return {**state, "error": str(e), "email_sent": False}