from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routers import messages, integrations, webhooks

s = get_settings()

app = FastAPI(
    title="Unified Messaging API",
    description="Centralise SMS, WhatsApp et email en une seule boîte de réception.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[s.frontend_url, "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(messages.router)
app.include_router(integrations.router)
app.include_router(webhooks.router)


@app.get("/health")
def health():
    return {"status": "ok"}
