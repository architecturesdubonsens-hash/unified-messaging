"""Inbox and send endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Header
from typing import Optional

from ..models import MessageSummary, Message, SendMessageRequest, SendMessageResponse, InboxStats
from ..services import message_store, twilio_service, gmail as gmail_service
from ..database import get_supabase
from ..config import get_settings

router = APIRouter(prefix="/api/messages", tags=["messages"])


def _get_user_id(authorization: str = Header(...)) -> str:
    """Extract user ID from Supabase JWT."""
    sb = get_supabase()
    token = authorization.replace("Bearer ", "")
    user = sb.auth.get_user(token)
    if not user or not user.user:
        raise HTTPException(status_code=401, detail="Non autorisé")
    return str(user.user.id)


@router.get("/", response_model=list[MessageSummary])
def get_inbox(
    limit: int = 100,
    offset: int = 0,
    source: Optional[str] = None,
    user_id: str = Depends(_get_user_id),
):
    messages = message_store.get_inbox(user_id, limit=limit, offset=offset)
    if source:
        messages = [m for m in messages if m.source == source]
    return messages


@router.get("/stats", response_model=InboxStats)
def get_stats(user_id: str = Depends(_get_user_id)):
    counts = message_store.get_unread_counts(user_id)
    return InboxStats(**counts)


@router.get("/{message_id}", response_model=Message)
def get_message(message_id: str, user_id: str = Depends(_get_user_id)):
    msg = message_store.get_message(user_id, message_id)
    if not msg:
        raise HTTPException(status_code=404, detail="Message introuvable")
    message_store.mark_read(user_id, message_id)
    return msg


@router.post("/{message_id}/read")
def mark_read(message_id: str, user_id: str = Depends(_get_user_id)):
    message_store.mark_read(user_id, message_id)
    return {"ok": True}


@router.post("/send", response_model=SendMessageResponse)
def send_message(req: SendMessageRequest, user_id: str = Depends(_get_user_id)):
    sb = get_supabase()

    # Get the user's integration for this source
    integ_resp = (
        sb.table("integrations")
        .select("*")
        .eq("user_id", user_id)
        .eq("service", req.source)
        .eq("status", "active")
        .single()
        .execute()
    )
    if not integ_resp.data:
        raise HTTPException(
            status_code=400,
            detail=f"Aucun compte {req.source} connecté. Allez dans Réglages pour connecter.",
        )
    integ = integ_resp.data

    external_id: str
    if req.source == "sms":
        external_id = twilio_service.send_sms(to=req.to_address, body=req.body)
    elif req.source == "whatsapp":
        external_id = twilio_service.send_whatsapp(to=req.to_address, body=req.body)
    elif req.source == "gmail":
        external_id = gmail_service.send_email(
            access_token=integ["access_token"],
            refresh_token=integ["refresh_token"],
            token_expiry=integ.get("token_expiry"),
            to=req.to_address,
            subject=req.subject or "Re:",
            body=req.body,
        )
    else:
        raise HTTPException(status_code=400, detail="Source inconnue")

    # Store outbound message
    settings = get_settings()
    outbound_address = integ.get("phone_number") or integ.get("gmail_address") or "moi"
    message_store.store_message(
        user_id,
        {
            "source": req.source,
            "direction": "outbound",
            "from_address": outbound_address,
            "to_address": req.to_address,
            "subject": req.subject,
            "body": req.body,
            "external_id": external_id,
        },
    )
    if req.reply_to_id:
        message_store.mark_replied(user_id, req.reply_to_id)

    return SendMessageResponse(message_id=external_id, status="sent")
