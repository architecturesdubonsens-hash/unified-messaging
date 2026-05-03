export type Source = 'sms' | 'whatsapp' | 'gmail'
export type Direction = 'inbound' | 'outbound'

export interface MessageSummary {
  id: string
  source: Source
  direction: Direction
  from_address: string
  subject?: string
  body_preview: string
  received_at: string
  read_at?: string
  replied_at?: string
  contact_name?: string
  thread_id?: string
}

export interface Message extends MessageSummary {
  to_address: string
  body: string
  reply_to_id?: string
  external_id?: string
}

export interface InboxStats {
  total_unread: number
  unread_sms: number
  unread_whatsapp: number
  unread_gmail: number
}

export interface Integration {
  id: string
  service: Source
  status: 'active' | 'error' | 'disconnected'
  phone_number?: string
  gmail_address?: string
  created_at: string
}

export interface SendMessageRequest {
  source: Source
  to_address: string
  body: string
  subject?: string
  reply_to_id?: string
}

export const SOURCE_LABELS: Record<Source, string> = {
  sms: 'SMS',
  whatsapp: 'WhatsApp',
  gmail: 'Email',
}

export const SOURCE_COLORS: Record<Source, { bg: string; text: string; border: string; dot: string }> = {
  sms:      { bg: 'bg-blue-100',   text: 'text-blue-700',  border: 'border-blue-200', dot: 'bg-blue-500'  },
  whatsapp: { bg: 'bg-green-100',  text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-500' },
  gmail:    { bg: 'bg-red-100',    text: 'text-red-700',   border: 'border-red-200',   dot: 'bg-red-500'   },
}
