-- Unified Messaging App — Database Schema
-- Supabase / PostgreSQL

-- Users (auth managed by Supabase Auth, this extends the profile)
create table if not exists messaging_users (
  id          uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at  timestamptz default now()
);

-- Connected integrations per user
create table if not exists integrations (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references messaging_users(id) on delete cascade,
  service      text not null check (service in ('gmail', 'sms', 'whatsapp')),
  status       text not null default 'active' check (status in ('active', 'error', 'disconnected')),
  -- Gmail OAuth tokens (encrypted at rest via Supabase Vault in production)
  access_token  text,
  refresh_token text,
  token_expiry  timestamptz,
  -- Twilio / WhatsApp
  account_sid   text,
  phone_number  text,  -- E.164 format: +33612345678
  -- Gmail
  gmail_address text,
  gmail_history_id text,  -- For incremental sync
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  unique (user_id, service)
);

-- Contacts (built from senders)
create table if not exists contacts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references messaging_users(id) on delete cascade,
  display_name text not null,
  -- Identifiers per channel
  phone_number text,   -- E.164
  email       text,
  whatsapp_id text,
  avatar_url  text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Unified messages
create table if not exists messages (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references messaging_users(id) on delete cascade,
  contact_id    uuid references contacts(id) on delete set null,
  -- Source channel
  source        text not null check (source in ('sms', 'whatsapp', 'gmail')),
  direction     text not null check (direction in ('inbound', 'outbound')),
  -- Raw sender/recipient identifiers (before contact resolution)
  from_address  text not null,  -- phone number or email
  to_address    text not null,
  -- Content
  subject       text,           -- Email subject
  body          text not null,
  -- Threading
  thread_id     text,           -- Gmail thread ID or SMS conversation key
  reply_to_id   uuid references messages(id) on delete set null,
  -- External IDs (for dedup)
  external_id   text,           -- Gmail message ID, Twilio SID, etc.
  -- Status
  read_at       timestamptz,
  replied_at    timestamptz,
  -- Timestamps
  received_at   timestamptz not null default now(),
  created_at    timestamptz default now(),
  unique (source, external_id)
);

-- Indexes for fast inbox queries
create index if not exists idx_messages_user_received on messages (user_id, received_at desc);
create index if not exists idx_messages_thread on messages (thread_id, received_at asc);
create index if not exists idx_messages_unread on messages (user_id, read_at) where read_at is null;

-- Row-level security
alter table messaging_users enable row level security;
alter table integrations     enable row level security;
alter table contacts         enable row level security;
alter table messages         enable row level security;

create policy "users: own row" on messaging_users for all using (auth.uid() = id);
create policy "integrations: own rows" on integrations for all using (auth.uid() = user_id);
create policy "contacts: own rows" on contacts for all using (auth.uid() = user_id);
create policy "messages: own rows" on messages for all using (auth.uid() = user_id);
