"""Connect/disconnect Gmail, SMS, WhatsApp integrations."""

from fastapi import APIRouter, Depends, HTTPException, Header
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import Optional

from ..services import gmail as gmail_service
from ..database import get_supabase
from ..config import get_settings
from ..models import Integration

router = APIRouter(prefix="/api/integrations", tags=["integrations"])


def _get_user_id(authorization: str = Header(...)) -> str:
    sb = get_supabase()
    token = authorization.replace("Bearer ", "")
    user = sb.auth.get_user(token)
    if not user or not user.user:
        raise HTTPException(status_code=401, detail="Non autorisé")
    return str(user.user.id)


@router.get("/", response_model=list[Integration])
def list_integrations(user_id: str = Depends(_get_user_id)):
    sb = get_supabase()
    resp = sb.table("integrations").select("*").eq("user_id", user_id).execute()
    return [Integration(**r) for r in (resp.data or [])]


# ── Gmail ──────────────────────────────────────────────────────────────────────

@router.get("/gmail/auth-url")
def gmail_auth_url(user_id: str = Depends(_get_user_id)):
    url = gmail_service.get_auth_url()
    return {"url": url}


@router.get("/gmail/callback")
def gmail_callback(code: str, state: Optional[str] = None):
    """Google redirects here after user consent."""
    tokens = gmail_service.exchange_code(code)
    # We need user_id — store it in state during auth URL generation in production.
    # For now we return tokens to frontend to finalize.
    s = get_settings()
    redirect = (
        f"{s.frontend_url}/connect/gmail-success"
        f"?access_token={tokens['access_token']}"
        f"&refresh_token={tokens['refresh_token']}"
        f"&expiry={tokens.get('token_expiry', '')}"
    )
    return RedirectResponse(url=redirect)


class GmailTokensRequest(BaseModel):
    access_token: str
    refresh_token: str
    token_expiry: Optional[str] = None


@router.post("/gmail/save-tokens")
def gmail_save_tokens(body: GmailTokensRequest, user_id: str = Depends(_get_user_id)):
    """Frontend calls this after receiving tokens from callback redirect."""
    sb = get_supabase()
    gmail_address = gmail_service.get_user_email(
        body.access_token, body.refresh_token, body.token_expiry
    )
    sb.table("integrations").upsert(
        {
            "user_id": user_id,
            "service": "gmail",
            "status": "active",
            "access_token": body.access_token,
            "refresh_token": body.refresh_token,
            "token_expiry": body.token_expiry,
            "gmail_address": gmail_address,
        },
        on_conflict="user_id,service",
    ).execute()
    return {"gmail_address": gmail_address}


@router.post("/gmail/sync")
def gmail_sync(user_id: str = Depends(_get_user_id)):
    """Fetch latest emails and store them."""
    sb = get_supabase()
    integ = (
        sb.table("integrations")
        .select("*")
        .eq("user_id", user_id)
        .eq("service", "gmail")
        .single()
        .execute()
    )
    if not integ.data:
        raise HTTPException(status_code=400, detail="Gmail non connecté")
    i = integ.data
    messages = gmail_service.fetch_messages(
        i["access_token"], i["refresh_token"], i.get("token_expiry")
    )
    from ..services.message_store import store_message
    stored = 0
    for m in messages:
        mid = store_message(user_id, m)
        if mid:
            stored += 1
    return {"synced": stored}


# ── SMS / WhatsApp ─────────────────────────────────────────────────────────────

class TwilioSetupRequest(BaseModel):
    service: str   # "sms" or "whatsapp"
    phone_number: str  # E.164


@router.post("/twilio/setup")
def twilio_setup(body: TwilioSetupRequest, user_id: str = Depends(_get_user_id)):
    if body.service not in ("sms", "whatsapp"):
        raise HTTPException(status_code=400, detail="Service doit être sms ou whatsapp")
    sb = get_supabase()
    sb.table("integrations").upsert(
        {
            "user_id": user_id,
            "service": body.service,
            "status": "active",
            "phone_number": body.phone_number,
        },
        on_conflict="user_id,service",
    ).execute()
    return {"ok": True}


@router.delete("/{service}")
def disconnect(service: str, user_id: str = Depends(_get_user_id)):
    sb = get_supabase()
    sb.table("integrations").update({"status": "disconnected"}).eq(
        "user_id", user_id
    ).eq("service", service).execute()
    return {"ok": True}
