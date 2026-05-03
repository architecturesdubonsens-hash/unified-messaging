'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Source, SOURCE_LABELS } from '@/lib/types'
import { api } from '@/lib/api'
import BottomNav from '@/components/BottomNav'
import clsx from 'clsx'

const SOURCES: { value: Source; icon: string; color: string }[] = [
  { value: 'sms',      icon: '📱', color: 'border-blue-400 bg-blue-50 text-blue-700'  },
  { value: 'whatsapp', icon: '💬', color: 'border-green-400 bg-green-50 text-green-700' },
  { value: 'gmail',    icon: '✉️',  color: 'border-red-400 bg-red-50 text-red-700'     },
]

export default function ComposePage() {
  const router = useRouter()
  const [source, setSource]   = useState<Source>('sms')
  const [to, setTo]           = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody]       = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleSend() {
    if (!to.trim() || !body.trim()) return
    setSending(true)
    setError(null)
    try {
      await api.inbox.send({
        source,
        to_address: to.trim(),
        body: body.trim(),
        subject: source === 'gmail' ? subject : undefined,
      })
      setSent(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Impossible d\'envoyer')
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen pb-24 px-6 text-center">
        <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <span className="text-7xl block mb-6">✉️</span>
          <h2 className="text-3xl font-extrabold text-slate-800 mb-3">Message envoyé !</h2>
          <p className="text-xl text-slate-500 mb-8">Votre message a bien été transmis.</p>
          <button
            onClick={() => { setSent(false); setTo(''); setBody(''); setSubject('') }}
            className="bg-blue-600 text-white rounded-2xl px-8 py-4 text-xl font-bold mr-3"
          >
            Nouveau message
          </button>
          <button
            onClick={() => router.push('/inbox')}
            className="text-blue-600 underline text-xl"
          >
            Retour à la boîte
          </button>
        </motion.div>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen pb-24">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 bg-white border-b border-slate-100">
        <h1 className="text-3xl font-extrabold text-slate-900">Nouveau message</h1>
      </div>

      <div className="flex-1 px-4 py-4 space-y-5">
        {/* Source selector */}
        <div>
          <label className="block text-lg font-bold text-slate-700 mb-2">
            Envoyer via
          </label>
          <div className="flex gap-3">
            {SOURCES.map(s => (
              <button
                key={s.value}
                onClick={() => setSource(s.value)}
                className={clsx(
                  'flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl border-2 font-semibold text-base transition-all',
                  source === s.value ? s.color + ' border-2' : 'border-slate-200 bg-white text-slate-500'
                )}
              >
                <span className="text-2xl">{s.icon}</span>
                <span>{SOURCE_LABELS[s.value]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* To */}
        <div>
          <label className="block text-lg font-bold text-slate-700 mb-2" htmlFor="to">
            {source === 'gmail' ? 'Adresse email' : 'Numéro de téléphone'}
          </label>
          <input
            id="to"
            type={source === 'gmail' ? 'email' : 'tel'}
            value={to}
            onChange={e => setTo(e.target.value)}
            placeholder={source === 'gmail' ? 'prenom.nom@exemple.fr' : '+33 6 12 34 56 78'}
            className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-lg text-slate-800 focus:outline-none focus:border-blue-400 bg-white"
          />
        </div>

        {/* Subject (email only) */}
        {source === 'gmail' && (
          <div>
            <label className="block text-lg font-bold text-slate-700 mb-2" htmlFor="subject">
              Objet
            </label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Sujet de votre email"
              className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-lg text-slate-800 focus:outline-none focus:border-blue-400 bg-white"
            />
          </div>
        )}

        {/* Body */}
        <div>
          <label className="block text-lg font-bold text-slate-700 mb-2" htmlFor="body">
            Votre message
          </label>
          <textarea
            id="body"
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Écrivez votre message ici…"
            rows={6}
            className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-lg text-slate-800 resize-none focus:outline-none focus:border-blue-400 bg-white"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="text-red-700 text-lg">{error}</p>
          </div>
        )}

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={sending || !to.trim() || !body.trim()}
          className={clsx(
            'w-full py-5 rounded-2xl text-xl font-extrabold transition-all',
            to.trim() && body.trim() && !sending
              ? 'bg-blue-600 text-white shadow-lg active:scale-95'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          )}
        >
          {sending ? '⏳ Envoi en cours…' : '✈️ Envoyer le message'}
        </button>
      </div>

      <BottomNav />
    </div>
  )
}
