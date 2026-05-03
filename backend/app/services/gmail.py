"""Gmail integration via Google OAuth2 + Gmail API."""

import base64
import email as email_lib
from datetime import datetime, timezone
from typing import Optional
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import Flow

from ..config import get_settings

SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
]


def build_oauth_flow() -> Flow:
    s = get_settings()
    return Flow.from_client_config(
        {
            "web": {
                "client_id": s.google_client_id,
                "client_secret": s.google_client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [s.google_redirect_uri],
            }
        },
        scopes=SCOPES,
        redirect_uri=s.google_redirect_uri,
    )


def get_auth_url() -> str:
    flow = build_oauth_flow()
    url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
    )
    return url


def exchange_code(code: str) -> dict:
    flow = build_oauth_flow()
    flow.fetch_token(code=code)
    creds = flow.credentials
    return {
        "access_token": creds.token,
        "refresh_token": creds.refresh_token,
        "token_expiry": creds.expiry.isoformat() if creds.expiry else None,
    }


def _build_service(access_token: str, refresh_token: str, token_expiry: Optional[str]):
    expiry = datetime.fromisoformat(token_expiry) if token_expiry else None
    s = get_settings()
    creds = Credentials(
        token=access_token,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=s.google_client_id,
        client_secret=s.google_client_secret,
        expiry=expiry,
    )
    if creds.expired and creds.refresh_token:
        creds.refresh(Request())
    return build("gmail", "v1", credentials=creds), creds


def get_user_email(access_token: str, refresh_token: str, token_expiry: Optional[str]) -> str:
    service, _ = _build_service(access_token, refresh_token, token_expiry)
    profile = service.users().getProfile(userId="me").execute()
    return profile["emailAddress"]


def fetch_messages(
    access_token: str,
    refresh_token: str,
    token_expiry: Optional[str],
    max_results: int = 50,
    after_history_id: Optional[str] = None,
) -> list[dict]:
    service, _ = _build_service(access_token, refresh_token, token_expiry)

    list_resp = (
        service.users()
        .messages()
        .list(userId="me", maxResults=max_results, labelIds=["INBOX"])
        .execute()
    )
    msg_refs = list_resp.get("messages", [])
    messages = []

    for ref in msg_refs:
        raw = (
            service.users()
            .messages()
            .get(userId="me", id=ref["id"], format="full")
            .execute()
        )
        parsed = _parse_gmail_message(raw)
        if parsed:
            messages.append(parsed)

    return messages


def _parse_gmail_message(raw: dict) -> Optional[dict]:
    headers = {h["name"]: h["value"] for h in raw.get("payload", {}).get("headers", [])}
    body = _extract_body(raw.get("payload", {}))
    internal_date = int(raw.get("internalDate", 0)) / 1000

    return {
        "external_id": raw["id"],
        "thread_id": raw.get("threadId"),
        "from_address": headers.get("From", ""),
        "to_address": headers.get("To", ""),
        "subject": headers.get("Subject", "(sans objet)"),
        "body": body,
        "received_at": datetime.fromtimestamp(internal_date, tz=timezone.utc).isoformat(),
        "direction": "inbound",
        "source": "gmail",
    }


def _extract_body(payload: dict) -> str:
    mime_type = payload.get("mimeType", "")
    if mime_type == "text/plain":
        data = payload.get("body", {}).get("data", "")
        return base64.urlsafe_b64decode(data + "==").decode("utf-8", errors="replace")
    if mime_type.startswith("multipart/"):
        for part in payload.get("parts", []):
            if part.get("mimeType") == "text/plain":
                data = part.get("body", {}).get("data", "")
                return base64.urlsafe_b64decode(data + "==").decode("utf-8", errors="replace")
        # Fallback: first part
        parts = payload.get("parts", [])
        if parts:
            return _extract_body(parts[0])
    return ""


def send_email(
    access_token: str,
    refresh_token: str,
    token_expiry: Optional[str],
    to: str,
    subject: str,
    body: str,
    reply_to_message_id: Optional[str] = None,
    thread_id: Optional[str] = None,
) -> str:
    service, _ = _build_service(access_token, refresh_token, token_expiry)

    msg = email_lib.message.EmailMessage()
    msg["To"] = to
    msg["Subject"] = subject
    if reply_to_message_id:
        msg["In-Reply-To"] = reply_to_message_id
        msg["References"] = reply_to_message_id
    msg.set_content(body)

    raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()
    payload: dict = {"raw": raw}
    if thread_id:
        payload["threadId"] = thread_id

    result = service.users().messages().send(userId="me", body=payload).execute()
    return result["id"]
