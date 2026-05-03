'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Source } from '@/lib/types'
import { api } from '@/lib/api'
import clsx from 'clsx'

interface Step {
  id: string
  icon: string
  title: string
  description: string
  action?: React.ReactNode
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep]         = useState(0)
  const [direction, setDir]     = useState(1)
  const [phoneInputs, setPhone] = useState<Partial<Record<Source, string>>>({})
  const [saving, setSaving]     = useState<Source | null>(null)
  const [connected, setConnected] = useState<Set<Source>>(new Set())
  const [error, setError]       = useState<string | null>(null)

  async function connectTwilio(service: 'sms' | 'whatsapp') {
    const phone = phoneInputs[service]?.trim()
    if (!phone) return
    setSaving(service)
    setError(null)
    try {
      await api.integrations.twilioSetup(service, phone)
      setConnected(prev => new Set(Array.from(prev).concat(service)))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setSaving(null)
    }
  }

  async function connectGmail() {
    try {
      const { url } = await api.integrations.gmailAuthUrl()
      window.location.href = url
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur Gmail')
    }
  }

  function next() {
    setDir(1)
    setStep(s => Math.min(s + 1, steps.length - 1))
    setError(null)
  }
  function prev() {
    setDir(-1)
    setStep(s => Math.max(s - 1, 0))
    setError(null)
  }

  const steps: Step[] = [
    {
      id: 'welcome',
      icon: '👋',
      title: 'Bienvenue !',
      description:
        'Cette application regroupe tous vos messages — SMS, WhatsApp et emails — dans un seul endroit simple à lire.\n\nPlus besoin de passer d\'une application à l\'autre.',
    },
    {
      id: 'gmail',
      icon: '✉️',
      title: 'Connecter vos emails',
      description: 'Connectez votre boîte Gmail pour voir vos emails ici.',
      action: (
        <div className="space-y-3">
          {connected.has('gmail') ? (
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4">
              <span className="text-3xl">✓</span>
              <p className="text-xl font-bold text-green-700">Email connecté !</p>
            </div>
          ) : (
            <button
              onClick={connectGmail}
              className="w-full bg-red-600 text-white rounded-2xl py-4 text-xl font-bold active:opacity-80"
            >
              Se connecter avec Google
            </button>
          )}
          <button onClick={next} className="w-full text-slate-400 text-lg underline py-1">
            Passer cette étape
          </button>
        </div>
      ),
    },
    {
      id: 'whatsapp',
      icon: '💬',
      title: 'Connecter WhatsApp',
      description: 'Entrez votre numéro de téléphone WhatsApp pour recevoir vos messages ici.',
      action: (
        <div className="space-y-3">
          {connected.has('whatsapp') ? (
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4">
              <span className="text-3xl">✓</span>
              <p className="text-xl font-bold text-green-700">WhatsApp connecté !</p>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="tel"
                value={phoneInputs.whatsapp ?? ''}
                onChange={e => setPhone(prev => ({ ...prev, whatsapp: e.target.value }))}
                placeholder="+33 6 12 34 56 78"
                className="flex-1 border-2 border-slate-200 rounded-2xl px-4 py-3 text-lg focus:outline-none focus:border-green-400"
              />
              <button
                onClick={() => connectTwilio('whatsapp')}
                disabled={saving === 'whatsapp' || !phoneInputs.whatsapp?.trim()}
                className={clsx(
                  'px-5 py-3 rounded-2xl text-white font-bold text-lg',
                  phoneInputs.whatsapp?.trim() && saving !== 'whatsapp'
                    ? 'bg-green-600'
                    : 'bg-slate-300'
                )}
              >
                {saving === 'whatsapp' ? '…' : 'OK'}
              </button>
            </div>
          )}
          <button onClick={next} className="w-full text-slate-400 text-lg underline py-1">
            Passer cette étape
          </button>
        </div>
      ),
    },
    {
      id: 'sms',
      icon: '📱',
      title: 'Connecter les SMS',
      description: 'Entrez votre numéro de téléphone pour recevoir vos SMS ici aussi.',
      action: (
        <div className="space-y-3">
          {connected.has('sms') ? (
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4">
              <span className="text-3xl">✓</span>
              <p className="text-xl font-bold text-blue-700">SMS connecté !</p>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="tel"
                value={phoneInputs.sms ?? ''}
                onChange={e => setPhone(prev => ({ ...prev, sms: e.target.value }))}
                placeholder="+33 6 12 34 56 78"
                className="flex-1 border-2 border-slate-200 rounded-2xl px-4 py-3 text-lg focus:outline-none focus:border-blue-400"
              />
              <button
                onClick={() => connectTwilio('sms')}
                disabled={saving === 'sms' || !phoneInputs.sms?.trim()}
                className={clsx(
                  'px-5 py-3 rounded-2xl text-white font-bold text-lg',
                  phoneInputs.sms?.trim() && saving !== 'sms' ? 'bg-blue-600' : 'bg-slate-300'
                )}
              >
                {saving === 'sms' ? '…' : 'OK'}
              </button>
            </div>
          )}
          <button onClick={next} className="w-full text-slate-400 text-lg underline py-1">
            Passer cette étape
          </button>
        </div>
      ),
    },
    {
      id: 'done',
      icon: '🎉',
      title: 'C\'est prêt !',
      description:
        'Votre boîte de réception est configurée.\n\nTous vos nouveaux messages apparaîtront ici automatiquement.',
    },
  ]

  const current = steps[step]
  const isLast  = step === steps.length - 1

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-50 to-white px-6 pt-10 pb-10">
      {/* Progress dots */}
      <div className="flex justify-center gap-2 mb-10">
        {steps.map((_, i) => (
          <div
            key={i}
            className={clsx(
              'rounded-full transition-all',
              i === step ? 'w-8 h-3 bg-blue-600' : i < step ? 'w-3 h-3 bg-blue-300' : 'w-3 h-3 bg-slate-200'
            )}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -direction * 40 }}
            transition={{ duration: 0.25 }}
            className="text-center"
          >
            <span className="text-8xl block mb-6">{current.icon}</span>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">{current.title}</h2>
            <p className="text-xl text-slate-600 leading-relaxed whitespace-pre-line mb-8">
              {current.description}
            </p>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-2xl p-4 text-left">
                <p className="text-red-700 text-base">{error}</p>
              </div>
            )}

            {current.action}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-3 mt-6">
        {step > 0 && (
          <button
            onClick={prev}
            className="flex-1 py-4 rounded-2xl border-2 border-slate-200 text-xl font-bold text-slate-600 active:scale-95 transition-all"
          >
            ← Retour
          </button>
        )}
        {!current.action && (
          <button
            onClick={isLast ? () => router.replace('/inbox') : next}
            className="flex-1 py-4 rounded-2xl bg-blue-600 text-white text-xl font-extrabold shadow-lg active:scale-95 transition-all"
          >
            {isLast ? 'Voir mes messages →' : 'Suivant →'}
          </button>
        )}
      </div>
    </div>
  )
}
