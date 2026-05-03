'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Message } from '@/lib/types'
import { api, DEMO_MESSAGES } from '@/lib/api'
import { relativeTime } from '@/lib/time'
import SourceBadge from '@/components/SourceBadge'
import clsx from 'clsx'

const USE_DEMO = !process.env.NEXT_PUBLIC_API_URL

const DEMO_FULL: Record<string, Partial<Message>> = {
  '1': { body: 'Bonjour, est-ce que tu es disponible ce week-end pour le déjeuner ?\nJ\'aimerais qu\'on se retrouve tous ensemble chez maman, elle serait très contente 😊', to_address: '+33700000000' },
  '2': { body: "N'oublie pas ton rendez-vous chez le médecin demain à 10h00.\nAdresse : 12 rue de la Paix, 75001 Paris.", to_address: '+33700000000' },
  '3': { body: 'Bonjour,\n\nVotre relevé de compte du mois de mai 2026 est disponible dans votre espace personnel sur notre site.\n\nCordialement,\nLe Crédit Agricole', to_address: 'vous@gmail.com' },
  '4': { body: 'Photos des vacances ✨ — je t\'envoie ça ce soir !', to_address: '+33700000000' },
  '5': { body: 'Votre colis numéro 1234567890 a été livré dans votre boîte aux lettres à 14h32.', to_address: '+33700000000' },
}

export default function MessagePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [message, setMessage] = useState<Message | null>(null)
  const [loading, setLoading] = useState(true)
  const [reply, setReply]     = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    async function load() {
      try {
        if (USE_DEMO) {
          const summary = DEMO_MESSAGES.find(m => m.id === id)
          if (summary) {
            const extra = DEMO_FULL[id] ?? {}
            setMessage({ ...summary, to_address: extra.to_address ?? '', body: extra.body ?? summary.body_preview, ...extra } as Message)
          }
        } else {
          const msg = await api.inbox.get(id)
          setMessage(msg)
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Message introuvable')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  async function handleSend() {
    if (!message || !reply.trim()) return
    setSending(true)
    setError(null)
    try {
      if (!USE_DEMO) {
        await api.inbox.send({
          source: message.source,
          to_address: message.from_address,
          body: reply.trim(),
          subject: message.subject ? `Re: ${message.subject}` : undefined,
          reply_to_id: message.id,
        })
      }
      setSent(true)
      setReply('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Impossible d\'envoyer')
    } finally {
      setSending(false)
    }
  }

  const sender = message?.contact_name || message?.from_address || '…'

  return (
    <div className="flex flex-col min-h-screen pb-10">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-blue-600 text-2xl font-bold active:opacity-60 p-1"
          aria-label="Retour"
        >
          ←
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xl font-bold text-slate-900 truncate">{sender}</p>
          {message && <SourceBadge source={message.source} size="sm" />}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && !loading && !sent && (
        <div className="m-4 bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
          <p className="text-red-700 text-lg font-semibold">{error}</p>
        </div>
      )}

      {/* Message body */}
      {message && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 px-4 py-4"
        >
          {/* Metadata */}
          <div className="mb-4 text-slate-400 text-base">
            <span>{relativeTime(message.received_at)}</span>
            {message.source === 'gmail' && (
              <span className="ml-2 text-slate-500">de : {message.from_address}</span>
            )}
          </div>

          {/* Subject (email) */}
          {message.subject && (
            <h2 className="text-2xl font-bold text-slate-800 mb-4">{message.subject}</h2>
          )}

          {/* Body */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 text-lg text-slate-700 leading-relaxed whitespace-pre-wrap">
            {message.body}
          </div>

          {/* Reply section */}
          <div className="mt-6">
            <p className="text-lg font-bold text-slate-800 mb-3">
              Répondre à {sender}
            </p>

            {sent ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
                <p className="text-3xl mb-2">✓</p>
                <p className="text-xl font-bold text-green-700">Message envoyé !</p>
                <button
                  onClick={() => setSent(false)}
                  className="mt-4 text-green-600 underline text-lg"
                >
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <textarea
                  ref={textareaRef}
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  placeholder="Écrivez votre réponse ici…"
                  rows={4}
                  className="w-full p-4 text-lg text-slate-800 resize-none focus:outline-none border-b border-slate-100"
                  disabled={sending}
                />
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-slate-400 text-sm">{reply.length} caractères</span>
                  <button
                    onClick={handleSend}
                    disabled={sending || !reply.trim()}
                    className={clsx(
                      'px-8 py-3 rounded-xl text-white text-lg font-bold transition-all',
                      reply.trim() && !sending
                        ? 'bg-blue-600 active:scale-95 shadow-md'
                        : 'bg-slate-300 cursor-not-allowed'
                    )}
                  >
                    {sending ? 'Envoi…' : 'Envoyer ✈️'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}
