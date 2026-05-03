"""Twilio integration for SMS and WhatsApp."""

from twilio.rest import Client
from twilio.request_validator import RequestValidator
from ..config import get_settings


def _client() -> Client:
    s = get_settings()
    return Client(s.twilio_account_sid, s.twilio_auth_token)


def send_sms(to: str, body: str) -> str:
    s = get_settings()
    msg = _client().messages.create(
        body=body,
        from_=s.twilio_sms_number,
        to=to,
    )
    return msg.sid


def send_whatsapp(to: str, body: str) -> str:
    """to should be E.164 format; Twilio prefixes whatsapp: automatically."""
    s = get_settings()
    from_number = f"whatsapp:{s.twilio_whatsapp_number}"
    to_number = f"whatsapp:{to}" if not to.startswith("whatsapp:") else to
    msg = _client().messages.create(
        body=body,
        from_=from_number,
        to=to_number,
    )
    return msg.sid


def validate_webhook(url: str, params: dict, signature: str) -> bool:
    s = get_settings()
    validator = RequestValidator(s.twilio_auth_token)
    return validator.validate(url, params, signature)


def parse_incoming_sms(form_data: dict) -> dict:
    return {
        "external_id": form_data.get("MessageSid", ""),
        "from_address": form_data.get("From", ""),
        "to_address": form_data.get("To", ""),
        "body": form_data.get("Body", ""),
        "source": "sms",
        "direction": "inbound",
    }


def parse_incoming_whatsapp(form_data: dict) -> dict:
    from_raw = form_data.get("From", "")
    to_raw = form_data.get("To", "")
    # Strip whatsapp: prefix for storage
    from_clean = from_raw.replace("whatsapp:", "")
    to_clean = to_raw.replace("whatsapp:", "")
    return {
        "external_id": form_data.get("MessageSid", ""),
        "from_address": from_clean,
        "to_address": to_clean,
        "body": form_data.get("Body", ""),
        "source": "whatsapp",
        "direction": "inbound",
    }
