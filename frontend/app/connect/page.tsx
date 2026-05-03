'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Integration, Source } from '@/lib/types'
import { api } from '@/lib/api'
import BottomNav from '@/components/BottomNav'
import clsx from 'clsx'

const SERVICE_INFO: Record<Source, { icon: string; name: string; description: string; color: string }> = {
  gmail:    { icon: '✉️',  name: 'Email (Gmail)',  description: 'Recevez et répondez à vos emails directement ici.', color: 'border-red-200 bg-red-50' },
  whatsapp: { icon: '💬', name: 'WhatsApp',        description: 'Centralisez vos messages WhatsApp.', color: 'border-green-200 bg-green-50' },
  sms:      { icon: '📱', name: 'SMS',             description: 'Ne ratez plus aucun SMS.', color: 'border-blue-200 bg-blue-50' },
}

// Isolated component that uses useSearchParams (must be inside Suspense)
function GmailCallbackHandler({ onError }: { onError: (msg: string) => void }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const accessToken  = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    const expiry       = searchParams.get('expiry')
    if (accessToken && refreshToken) {
      api.integrations
        .gmailSaveTokens({ access_token: accessToken, refresh_token: refreshToken, token_expiry: expiry ?? undefined })
        .then(() => router.replace('/connect'))
        .catch(e => onError(e instanceof Error ? e.message : 'Erreur Gmail'))
    }
  }, [searchParams, router, onError])

  return null
}

function ConnectContent() {
  const router = useRouter()
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading]           = useState(true)
  const [phoneInput, setPhoneInput]     = useState<Partial<Record<Source, string>>>({})
  const [saving, setSaving]             = useState<Source | null>(null)
  const [error, setError]               = useState<string | null>(null)

  useEffect(() => {
    api.integrations.list()
      .then(setIntegrations)
      .catch(() => setIntegrations([]))
      .finally(() => setLoading(false))
  }, [])

  function isConnected(service: Source): Integration | undefined {
    return integrations.find(i => i.service === service && i.status === 'active')
  }

  async function connectGmail() {
    try {
      const { url } = await api.integrations.gmailAuthUrl()
      window.location.href = url
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur Gmail')
    }
  }

  async function connectTwilio(service: 'sms' | 'whatsapp') {
    const phone = phoneInput[service]?.trim()
    if (!phone) return
    setSaving(service)
    setError(null)
    try {
      await api.integrations.twilioSetup(service, phone)
      const updated = await api.integrations.list()
      setIntegrations(updated)
      setPhoneInput(prev => ({ ...prev, [service]: '' }))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur de connexion')
    } finally {
      setSaving(null)
    }
  }

  async function disconnect(service: Source) {
    await api.integrations.disconnect(service)
    setIntegrations(prev =>
      prev.map(i => i.service === service ? { ...i, status: 'disconnected' as const } : i)
    )
  }

  return (
    <div className="flex flex-col min-h-screen pb-24">
      {/* Handles ?access_token=... after Gmail OAuth redirect */}
      <Suspense fallback={null}>
        <GmailCallbackHandler onError={setError} />
      </Suspense>

      <div className="px-4 pt-5 pb-3 bg-white border-b border-slate-100">
        <button onClick={() => router.back()} className="text-blue-600 text-lg mb-2">← Retour</button>
        <h1 className="text-3xl font-extrabold text-slate-900">Connecter mes comptes</h1>
        <p className="text-base text-slate-500 mt-1">
          Ajoutez vos services pour recevoir tous vos messages ici.
        </p>
      </div>

      {error && (
        <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-2xl p-4">
          <p className="text-red-700 text-base">{error}</p>
        </div>
      )}

      <div className="flex-1 px-4 py-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
          </div>
        ) : (
          (Object.keys(SERVICE_INFO) as Source[]).map(service => {
            const info      = SERVICE_INFO[service]
            const connected = isConnected(service)

            return (
              <motion.div
                key={service}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={clsx(
                  'rounded-2xl border-2 p-5',
                  connected ? 'border-green-300 bg-green-50' : info.color
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{info.icon}</span>
                    <div>
                      <p className="text-xl font-bold text-slate-800">{info.name}</p>
                      <p className="text-sm text-slate-500">{info.description}</p>
                    </div>
                  </div>
                  {connected && (
                    <span className="bg-green-600 text-white text-sm font-bold px-3 py-1 rounded-full">
                      ✓ Connecté
                    </span>
                  )}
                </div>

                {connected ? (
                  <div className="flex items-center justify-between">
                    <p className="text-slate-600 text-base">
                      {connected.gmail_address || connected.phone_number || 'Actif'}
                    </p>
                    <button
                      onClick={() => disconnect(service)}
                      className="text-red-600 text-base underline"
                    >
                      Déconnecter
                    </button>
                  </div>
                ) : service === 'gmail' ? (
                  <button
                    onClick={connectGmail}
                    className="w-full bg-red-600 text-white rounded-xl py-3 text-lg font-bold active:opacity-80"
                  >
                    Se connecter avec Google
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={phoneInput[service] ?? ''}
                      onChange={e => setPhoneInput(prev => ({ ...prev, [service]: e.target.value }))}
                      placeholder="+33 6 12 34 56 78"
                      className="flex-1 border-2 border-slate-200 rounded-xl px-3 py-2 text-lg bg-white focus:outline-none focus:border-blue-400"
                    />
                    <button
                      onClick={() => connectTwilio(service)}
                      disabled={saving === service || !phoneInput[service]?.trim()}
                      className={clsx(
                        'px-4 py-2 rounded-xl text-white font-bold text-lg',
                        saving === service || !phoneInput[service]?.trim()
                          ? 'bg-slate-300'
                          : service === 'sms' ? 'bg-blue-600' : 'bg-green-600'
                      )}
                    >
                      {saving === service ? '…' : 'Ajouter'}
                    </button>
                  </div>
                )}
              </motion.div>
            )
          })
        )}
      </div>

      <BottomNav />
    </div>
  )
}

export default function ConnectPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
      </div>
    }>
      <ConnectContent />
    </Suspense>
  )
}
