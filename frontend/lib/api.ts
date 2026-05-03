import { MessageSummary, Message, InboxStats, Integration, SendMessageRequest } from './types'

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

async function authFetch(path: string, options: RequestInit = {}) {
  // Token stored in localStorage after Supabase login
  const token = typeof window !== 'undefined' ? localStorage.getItem('sb-access-token') : null
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `Erreur ${res.status}`)
  }
  return res.json()
}

export const api = {
  inbox: {
    list: (params?: { source?: string; limit?: number; offset?: number }): Promise<MessageSummary[]> => {
      const qs = new URLSearchParams()
      if (params?.source) qs.set('source', params.source)
      if (params?.limit)  qs.set('limit', String(params.limit))
      if (params?.offset) qs.set('offset', String(params.offset))
      return authFetch(`/api/messages/?${qs}`)
    },
    stats: (): Promise<InboxStats> => authFetch('/api/messages/stats'),
    get: (id: string): Promise<Message> => authFetch(`/api/messages/${id}`),
    markRead: (id: string): Promise<void> => authFetch(`/api/messages/${id}/read`, { method: 'POST' }),
    send: (req: SendMessageRequest): Promise<{ message_id: string; status: string }> =>
      authFetch('/api/messages/send', { method: 'POST', body: JSON.stringify(req) }),
  },
  integrations: {
    list: (): Promise<Integration[]> => authFetch('/api/integrations/'),
    gmailAuthUrl: (): Promise<{ url: string }> => authFetch('/api/integrations/gmail/auth-url'),
    gmailSaveTokens: (data: { access_token: string; refresh_token: string; token_expiry?: string }) =>
      authFetch('/api/integrations/gmail/save-tokens', { method: 'POST', body: JSON.stringify(data) }),
    gmailSync: () => authFetch('/api/integrations/gmail/sync', { method: 'POST' }),
    twilioSetup: (service: 'sms' | 'whatsapp', phone_number: string) =>
      authFetch('/api/integrations/twilio/setup', {
        method: 'POST',
        body: JSON.stringify({ service, phone_number }),
      }),
    disconnect: (service: string) =>
      authFetch(`/api/integrations/${service}`, { method: 'DELETE' }),
  },
}

// Demo data for when backend isn't connected
export const DEMO_MESSAGES: MessageSummary[] = [
  {
    id: '1',
    source: 'whatsapp',
    direction: 'inbound',
    from_address: '+33612345678',
    body_preview: 'Bonjour, est-ce que tu es disponible ce week-end pour le déjeuner ?',
    received_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    contact_name: 'Marie Dupont',
  },
  {
    id: '2',
    source: 'sms',
    direction: 'inbound',
    from_address: '+33698765432',
    body_preview: "N'oublie pas ton rendez-vous chez le médecin demain à 10h00.",
    received_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    contact_name: 'Cabinet Dr. Martin',
  },
  {
    id: '3',
    source: 'gmail',
    direction: 'inbound',
    from_address: 'banque@credit-agricole.fr',
    subject: 'Votre relevé de compte est disponible',
    body_preview: 'Votre relevé du mois de mai 2026 est disponible dans votre espace personnel.',
    received_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    contact_name: 'Crédit Agricole',
  },
  {
    id: '4',
    source: 'whatsapp',
    direction: 'inbound',
    from_address: '+33611223344',
    body_preview: 'Photos des vacances ✨ — je t\'envoie ça ce soir !',
    received_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    contact_name: 'Pierre',
    read_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: '5',
    source: 'sms',
    direction: 'inbound',
    from_address: '+33123456789',
    body_preview: 'Votre colis a été livré dans votre boîte aux lettres.',
    received_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    contact_name: 'La Poste',
    read_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    replied_at: new Date(Date.now() - 1000 * 60 * 60 * 19).toISOString(),
  },
]
