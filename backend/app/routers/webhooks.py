"""Incoming webhooks from Twilio (SMS + WhatsApp)."""

from fastapi import APIRouter, Request, HTTPException, Header
from fastapi.responses import PlainTextResponse
from typing import Optional
from datetime import datetime, timezone

from ..services import twilio_service, message_store
from ..database import get_supabase
from ..config import get_settings

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])


async def _validate_twilio(request: Request, x_twilio_signature: Optional[str] = Header(None)):
    if not x_twilio_signature:
        raise HTTPException(status_code=403, detail="Signature Twilio manquante")
    s = get_settings()
    url = str(request.url)
    form = await request.form()
    params = dict(form)
    if not twilio_service.validate_webhook(url, params, x_twilio_signature):
        raise HTTPException(status_code=403, detail="Signature Twilio invalide")
    return params


@router.post("/sms", response_class=PlainTextResponse)
async def sms_webhook(request: Request, x_twilio_signature: Optional[str] = Header(None)):
    s = get_settings()
    params = await _validate_twilio(request, x_twilio_signature)
    parsed = twilio_service.parse_incoming_sms(params)
    _store_for_owner(parsed, source="sms")
    # Empty TwiML response — we don't auto-reply
    return "<?xml version='1.0' encoding='UTF-8'?><Response></Response>"


@router.post("/whatsapp", response_class=PlainTextResponse)
async def whatsapp_webhook(request: Request, x_twilio_signature: Optional[str] = Header(None)):
    params = await _validate_twilio(request, x_twilio_signature)
    parsed = twilio_service.parse_incoming_whatsapp(params)
    _store_for_owner(parsed, source="whatsapp")
    return "<?xml version='1.0' encoding='UTF-8'?><Response></Response>"


def _store_for_owner(parsed: dict, source: str):
    """Find which user owns the destination number and store the message."""
    sb = get_supabase()
    to_address = parsed["to_address"]
    resp = (
        sb.table("integrations")
        .select("user_id")
        .eq("service", source)
        .eq("phone_number", to_address)
        .eq("status", "active")
        .execute()
    )
    if not resp.data:
        return  # Unknown destination, discard
    user_id = resp.data[0]["user_id"]
    parsed["received_at"] = datetime.now(timezone.utc).isoformat()
    message_store.store_message(user_id, parsed)
