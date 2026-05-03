# Mes Messages — Application de messagerie unifiée

Application mobile (PWA) qui centralise **SMS, WhatsApp et Email** dans une seule boîte de réception simple et accessible.

## Pour qui ?

Conçue pour les personnes peu à l'aise avec les smartphones : grande police, navigation simple, boutons larges, aucun jargon technique.

## Architecture

```
messaging/
├── frontend/          # Next.js 14 PWA
│   ├── app/
│   │   ├── inbox/     # Boîte de réception unifiée
│   │   ├── message/   # Lecture + réponse d'un message
│   │   ├── compose/   # Nouveau message
│   │   ├── connect/   # Connecter Gmail / WhatsApp / SMS
│   │   └── settings/  # Réglages
│   ├── components/    # MessageCard, BottomNav, FilterTabs, …
│   └── lib/           # API, types, utilitaires
├── backend/           # FastAPI (Python)
│   └── app/
│       ├── routers/   # messages, integrations, webhooks
│       └── services/  # gmail, twilio, message_store
└── database/
    └── schema.sql     # Tables Supabase + RLS
```

## Intégrations

| Service    | Méthode                        | Entrant | Sortant |
|------------|-------------------------------|---------|---------|
| Gmail      | OAuth2 + Gmail API            | ✓ sync | ✓       |
| WhatsApp   | Twilio WhatsApp Business API  | ✓ webhook | ✓    |
| SMS        | Twilio SMS                    | ✓ webhook | ✓    |

## Démarrage rapide

### Backend
```bash
cd messaging/backend
pip install -r requirements.txt
cp .env.example .env   # Renseigner les clés
uvicorn app.main:app --port 8001 --reload
```

### Frontend
```bash
cd messaging/frontend
npm install
cp .env.local.example .env.local   # Renseigner les URLs
npm run dev   # → http://localhost:3001
```

### Base de données
Exécuter `messaging/database/schema.sql` dans Supabase SQL Editor.

## Variables d'environnement

### Backend (`.env`)
- `SUPABASE_URL` + `SUPABASE_SERVICE_KEY`
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` (Google Cloud Console)
- `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` + numéros SMS/WhatsApp

### Frontend (`.env.local`)
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL` (URL du backend FastAPI)

## Webhooks Twilio

Dans la console Twilio, configurer :
- SMS : `POST https://votre-backend.com/api/webhooks/sms`
- WhatsApp : `POST https://votre-backend.com/api/webhooks/whatsapp`

## Mode démo

Si `NEXT_PUBLIC_API_URL` n'est pas défini, l'app affiche des messages fictifs pour la démonstration.
