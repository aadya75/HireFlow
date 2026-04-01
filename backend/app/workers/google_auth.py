import os
import json
import logging
from typing import Optional
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow, InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

SCOPES = [
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/calendar",
]

REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback")

# In-memory service cache
_service_cache: dict = {}

CREDENTIALS_FILE = os.path.expanduser("~/.my_project/google_creds.json")


def _load_credentials() -> Optional[Credentials]:
    if not os.path.exists(CREDENTIALS_FILE):
        return None
    with open(CREDENTIALS_FILE) as f:
        data = json.load(f)
    creds = Credentials.from_authorized_user_info(data, SCOPES)
    return creds


def _save_credentials(creds: Credentials):
    os.makedirs(os.path.dirname(CREDENTIALS_FILE), exist_ok=True)
    with open(CREDENTIALS_FILE, "w") as f:
        f.write(creds.to_json())


def _get_client_config() -> dict:
    return {
        "web": {
            "client_id": os.getenv("GOOGLE_OAUTH_CLIENT_ID"),
            "client_secret": os.getenv("GOOGLE_OAUTH_CLIENT_SECRET"),
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [REDIRECT_URI],
        }
    }


def get_auth_url(state: str) -> str:
    """Generate Google authorization URL"""
    flow = Flow.from_client_config(
        _get_client_config(),
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI,
    )
    auth_url, _ = flow.authorization_url(
        access_type="offline",
        prompt="consent",
        state=state,
        include_granted_scopes="true",
    )
    return auth_url


def exchange_code_for_tokens(code: str) -> dict:
    """Exchange code for tokens"""
    flow = Flow.from_client_config(
        _get_client_config(),
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI,
    )
    flow.fetch_token(code=code)
    creds = flow.credentials

    return {
        "token": creds.token,
        "refresh_token": creds.refresh_token,
        "token_uri": creds.token_uri,
        "client_id": creds.client_id,
        "client_secret": creds.client_secret,
        "scopes": list(creds.scopes) if creds.scopes else SCOPES,
        "expiry": creds.expiry.isoformat() if creds.expiry else None,
    }


def get_google_service(state: dict, service_name: str = None, version: str = None):
    """Universal service getter for both CLI and web flow"""
    user_id = state.get("user_id", "cli_user")
    token_data = state.get("token_data")

    if token_data:
        return _build_service_from_token_data(user_id, token_data, service_name, version)
    else:
        return _build_service_from_file(service_name, version)


def _build_service_from_file(service_name: str, version: str):
    """CLI path — uses locally saved credentials file"""
    cache_key = f"cli_{service_name}_{version}"
    if cache_key in _service_cache:
        return _service_cache[cache_key]

    creds = _load_credentials()

    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
        _save_credentials(creds)

    if not creds or not creds.valid:
        client_config = _get_client_config()
        flow = InstalledAppFlow.from_client_config(client_config, SCOPES)
        creds = flow.run_local_server(port=0)
        _save_credentials(creds)

    service = build(service_name, version, credentials=creds)
    _service_cache[cache_key] = service
    return service


def _build_service_from_token_data(user_id: str, token_data: dict, service_name: str, version: str):
    """Web flow — uses token_data loaded from DB"""
    cache_key = f"{user_id}_{service_name}_{version}"
    if cache_key in _service_cache:
        return _service_cache[cache_key]

    creds = Credentials(
        token=token_data["token"],
        refresh_token=token_data["refresh_token"],
        token_uri=token_data["token_uri"],
        client_id=token_data["client_id"],
        client_secret=token_data["client_secret"],
        scopes=token_data["scopes"],
    )
    if creds.expired and creds.refresh_token:
        creds.refresh(Request())
        token_data["token"] = creds.token
        token_data["expiry"] = creds.expiry.isoformat() if creds.expiry else None

    service = build(service_name, version, credentials=creds)
    _service_cache[cache_key] = service
    return service