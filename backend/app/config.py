from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Supabase
    supabase_url: str = ""
    supabase_service_key: str = ""

    # Google OAuth (Gmail)
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8001/api/integrations/gmail/callback"

    # Twilio (SMS + WhatsApp)
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_sms_number: str = ""       # E.164: +33XXXXXXXXX
    twilio_whatsapp_number: str = ""  # E.164: +14155238886 (Twilio sandbox)

    # App
    app_base_url: str = "http://localhost:8001"
    frontend_url: str = "http://localhost:3001"
    secret_key: str = "change-me-in-production"

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
