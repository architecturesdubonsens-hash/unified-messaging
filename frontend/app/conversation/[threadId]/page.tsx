'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Message, SOURCE_COLORS } from '@/lib/types'
import { api } from '@/lib/api'
import { relativeTime } from '@/lib/time'
import SourceBadge from '@/components/SourceBadge'
import clsx from 'clsx'

export default function ConversationPage() {
  const { threadId } = useParams<{ threadId: string }>()
  const router = useRouter()

  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading]   = useState(true)
  const [reply, setReply]       = useState('')
  const [sending, setSending]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const decodedId = decodeURIComponent(threadId)

  useEffect(() => {
    api.inbox.list()
      .then(list => {
        const thread = list.filter(m => m.thread_id === decodedId)
        // Fetch full messages
        return Promise.all(thread.map(m => api.inbox.get(m.id)))
      })
      .then(full => {
        setMessages(full.sort((a, b) => new Date(a.received_at).getTime() - new Date(b.received_at).getTime()))
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Erreur'))
      .finally(() => setLoading(false))
  }, [decodedId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const lastInbound = [...messages].reverse().find(m => m.direction === 'inbound')
  const source      = messages[0]?.source
  const sender      = lastInbound?.contact_name || lastInbound?.from_address || 'Conversation'
  const colors      = source ? SOURCE_COLORS[source] : SOURCE_COLORS.sms

  async function handleSend() {
    if (!lastInbound || !reply.trim()) return
    setSending(true)
    setError(null)
    try {
      await api.inbox.send({
        source: lastInbound.source,
        to_address: lastInbound.from_address,
        body: reply.trim(),
        subject: lastInbound.subject ? `Re: ${lastInbound.subject}` : undefined,
        reply_to_id: lastInbound.id,
      })
      // Optimistic update
      const optimistic: Message = {
        id: `tmp-${Date.now()}`,
        source: lastInbound.source,
        direction: 'outbound',
        from_address: 'Moi',
        to_address: lastInbound.from_address,
        body: reply.trim(),
        body_preview: reply.trim(),
        received_at: new Date().toISOString(),
        thread_id: decodedId,
      }
      setMessages(prev => [...prev, optimistic])
      setReply('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Impossible d\'envoyer')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-blue-600 text-2xl font-bold p-1">←</button>
        <div className="flex-1 min-w-0">
          <p className="text-xl font-bold text-slate-900 truncate">{sender}</p>
          {source && <SourceBadge source={source} size="sm" />}
        </div>
      </div>

      {/* Messages thread */}
      <div className="flex-1 px-4 py-4 pb-36 overflow-y-auto space-y-3">
        {loading && (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.direction === 'outbound'
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className={clsx('flex', isMe ? 'justify-end' : 'justify-start')}
            >
              <div className={clsx(
                'max-w-[82%] rounded-2xl px-4 py-3 shadow-sm',
                isMe
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : clsx('bg-white border', colors.border, 'rounded-bl-sm')
              )}>
                {msg.subject && (
                  <p className={clsx('text-sm font-bold mb-1', isMe ? 'text-blue-200' : 'text-slate-500')}>
                    {msg.subject}
                  </p>
                )}
                <p className={clsx('text-lg leading-snug whitespace-pre-wrap', isMe ? 'text-white' : 'text-slate-800')}>
                  {msg.body}
                </p>
                <p className={clsx('text-xs mt-1', isMe ? 'text-blue-200 text-right' : 'text-slate-400')}>
                  {relativeTime(msg.received_at)}
                </p>
              </div>
            </motion.div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Reply bar — fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white border-t border-slate-100 px-4 py-3">
        {error && (
          <p className="text-red-600 text-sm mb-2">{error}</p>
        )}
        <div className="flex gap-2 items-end">
          <textarea
            value={reply}
            onChange={e => setReply(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
            }}
            placeholder="Votre réponse…"
            rows={2}
            className="flex-1 bg-slate-100 rounded-2xl px-4 py-3 text-lg text-slate-800 resize-none focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-300 transition-all"
            disabled={sending}
          />
          <button
            onClick={handleSend}
            disabled={sending || !reply.trim()}
            className={clsx(
              'w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all flex-shrink-0',
              reply.trim() && !sending
                ? 'bg-blue-600 text-white active:scale-90 shadow-md'
                : 'bg-slate-200 text-slate-400'
            )}
            aria-label="Envoyer"
          >
            {sending ? '⏳' : '✈️'}
          </button>
        </div>
      </div>
    </div>
  )
}
