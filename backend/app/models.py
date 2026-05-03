from pydantic import BaseModel, EmailStr
from typing import Optional, Literal
from datetime import datetime
import uuid


Source = Literal["sms", "whatsapp", "gmail"]
Direction = Literal["inbound", "outbound"]
IntegrationStatus = Literal["active", "error", "disconnected"]


class Contact(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    display_name: str
    phone_number: Optional[str] = None
    email: Optional[str] = None
    whatsapp_id: Optional[str] = None
    avatar_url: Optional[str] = None


class Message(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    contact_id: Optional[uuid.UUID] = None
    source: Source
    direction: Direction
    from_address: str
    to_address: str
    subject: Optional[str] = None
    body: str
    thread_id: Optional[str] = None
    reply_to_id: Optional[uuid.UUID] = None
    external_id: Optional[str] = None
    read_at: Optional[datetime] = None
    replied_at: Optional[datetime] = None
    received_at: datetime
    # Enriched fields (joined from contacts)
    contact_name: Optional[str] = None


class MessageSummary(BaseModel):
    """Lightweight version for inbox list"""
    id: uuid.UUID
    source: Source
    direction: Direction
    from_address: str
    subject: Optional[str] = None
    body_preview: str
    received_at: datetime
    read_at: Optional[datetime] = None
    replied_at: Optional[datetime] = None
    contact_name: Optional[str] = None
    thread_id: Optional[str] = None


class SendMessageRequest(BaseModel):
    source: Source
    to_address: str          # phone or email
    body: str
    subject: Optional[str] = None   # email only
    reply_to_id: Optional[str] = None


class SendMessageResponse(BaseModel):
    message_id: str
    status: str


class Integration(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    service: Source
    status: IntegrationStatus
    phone_number: Optional[str] = None
    gmail_address: Optional[str] = None
    created_at: datetime


class InboxStats(BaseModel):
    total_unread: int
    unread_sms: int
    unread_whatsapp: int
    unread_gmail: int
