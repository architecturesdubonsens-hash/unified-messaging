"""Persist and retrieve messages from Supabase."""

from datetime import datetime, timezone
from typing import Optional
import uuid

from ..database import get_supabase
from ..models import MessageSummary, Message


def store_message(user_id: str, msg: dict) -> Optional[str]:
    """Insert a message, ignoring duplicates (by external_id + source)."""
    sb = get_supabase()
    payload = {
        "user_id": user_id,
        "source": msg["source"],
        "direction": msg.get("direction", "inbound"),
        "from_address": msg["from_address"],
        "to_address": msg["to_address"],
        "subject": msg.get("subject"),
        "body": msg["body"],
        "thread_id": msg.get("thread_id"),
        "external_id": msg.get("external_id"),
        "received_at": msg.get("received_at", datetime.now(timezone.utc).isoformat()),
    }
    resp = sb.table("messages").upsert(payload, on_conflict="source,external_id").execute()
    if resp.data:
        return resp.data[0]["id"]
    return None


def get_inbox(user_id: str, limit: int = 100, offset: int = 0) -> list[MessageSummary]:
    sb = get_supabase()
    resp = (
        sb.table("messages")
        .select(
            "id,source,direction,from_address,subject,body,received_at,read_at,replied_at,thread_id,contact_id"
        )
        .eq("user_id", user_id)
        .eq("direction", "inbound")
        .order("received_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    rows = resp.data or []
    # Resolve contact names in bulk
    contact_ids = list({r["contact_id"] for r in rows if r.get("contact_id")})
    contact_map: dict[str, str] = {}
    if contact_ids:
        c_resp = (
            sb.table("contacts")
            .select("id,display_name")
            .in_("id", contact_ids)
            .execute()
        )
        contact_map = {c["id"]: c["display_name"] for c in (c_resp.data or [])}

    result = []
    for r in rows:
        preview = r["body"][:120].replace("\n", " ")
        result.append(
            MessageSummary(
                id=r["id"],
                source=r["source"],
                direction=r["direction"],
                from_address=r["from_address"],
                subject=r.get("subject"),
                body_preview=preview,
                received_at=r["received_at"],
                read_at=r.get("read_at"),
                replied_at=r.get("replied_at"),
                contact_name=contact_map.get(r.get("contact_id", ""), None),
                thread_id=r.get("thread_id"),
            )
        )
    return result


def get_message(user_id: str, message_id: str) -> Optional[Message]:
    sb = get_supabase()
    resp = (
        sb.table("messages")
        .select("*")
        .eq("id", message_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not resp.data:
        return None
    r = resp.data
    contact_name = None
    if r.get("contact_id"):
        c = (
            sb.table("contacts")
            .select("display_name")
            .eq("id", r["contact_id"])
            .single()
            .execute()
        )
        if c.data:
            contact_name = c.data["display_name"]
    return Message(**r, contact_name=contact_name)


def mark_read(user_id: str, message_id: str) -> None:
    sb = get_supabase()
    sb.table("messages").update({"read_at": datetime.now(timezone.utc).isoformat()}).eq(
        "id", message_id
    ).eq("user_id", user_id).execute()


def mark_replied(user_id: str, message_id: str) -> None:
    sb = get_supabase()
    sb.table("messages").update(
        {"replied_at": datetime.now(timezone.utc).isoformat()}
    ).eq("id", message_id).eq("user_id", user_id).execute()


def get_unread_counts(user_id: str) -> dict:
    sb = get_supabase()
    resp = (
        sb.table("messages")
        .select("source", count="exact")
        .eq("user_id", user_id)
        .eq("direction", "inbound")
        .is_("read_at", "null")
        .execute()
    )
    rows = resp.data or []
    counts: dict[str, int] = {"sms": 0, "whatsapp": 0, "gmail": 0}
    for r in rows:
        src = r.get("source")
        if src in counts:
            counts[src] += 1
    return {
        "total_unread": sum(counts.values()),
        "unread_sms": counts["sms"],
        "unread_whatsapp": counts["whatsapp"],
        "unread_gmail": counts["gmail"],
    }


def resolve_or_create_contact(user_id: str, source: str, address: str, display_name: Optional[str] = None) -> str:
    sb = get_supabase()
    field = "email" if source == "gmail" else "phone_number"
    resp = sb.table("contacts").select("id").eq("user_id", user_id).eq(field, address).execute()
    if resp.data:
        return resp.data[0]["id"]
    new_contact = {
        "user_id": user_id,
        field: address,
        "display_name": display_name or address,
    }
    created = sb.table("contacts").insert(new_contact).execute()
    return created.data[0]["id"]
