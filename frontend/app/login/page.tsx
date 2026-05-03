'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import clsx from 'clsx'

type Mode = 'login' | 'signup' | 'reset'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode]         = useState<Mode>('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [info, setInfo]         = useState<string | null>(null)

  async function handleSubmit() {
    if (!email.trim()) { setError("Entrez votre adresse email."); return }
    if (mode !== 'reset' && !password.trim()) { setError("Entrez votre mot de passe."); return }
    setLoading(true)
    setError(null)
    setInfo(null)
    try {
      if (mode === 'login') {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
        if (err) throw err
        // Store token for API calls
        if (data.session?.access_token) {
          localStorage.setItem('sb-access-token', data.session.access_token)
        }
        // Redirect: new users go to onboarding, others to inbox
        const { data: profile } = await supabase
          .from('messaging_users')
          .select('id')
          .eq('id', data.user?.id)
          .maybeSingle()
        router.replace(profile ? '/inbox' : '/onboarding')

      } else if (mode === 'signup') {
        const { data, error: err } = await supabase.auth.signUp({ email, password })
        if (err) throw err
        if (data.session?.access_token) {
          localStorage.setItem('sb-access-token', data.session.access_token)
        }
        // Create messaging_users row
        if (data.user) {
          await supabase.from('messaging_users').upsert({ id: data.user.id })
        }
        router.replace('/onboarding')

      } else {
        // reset
        const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/login`,
        })
        if (err) throw err
        setInfo("Un email de réinitialisation vous a été envoyé. Vérifiez votre boîte de réception.")
        setMode('login')
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Une erreur est survenue'
      setError(
        msg.includes('Invalid login') || msg.includes('invalid_credentials')
          ? 'Email ou mot de passe incorrect.'
          : msg.includes('already registered')
          ? 'Ce compte existe déjà. Connectez-vous.'
          : msg
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-600 to-blue-800 px-6 pt-16 pb-10">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <span className="text-7xl block mb-4">📬</span>
        <h1 className="text-4xl font-extrabold text-white">Mes Messages</h1>
        <p className="text-blue-200 text-xl mt-2">Tous vos messages en un seul endroit</p>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-3xl p-6 shadow-xl"
      >
        {/* Mode tabs */}
        <div className="flex rounded-xl bg-slate-100 p-1 mb-6">
          <button
            onClick={() => { setMode('login'); setError(null) }}
            className={clsx(
              'flex-1 py-2 rounded-lg text-lg font-bold transition-all',
              mode === 'login' ? 'bg-white shadow text-slate-900' : 'text-slate-500'
            )}
          >
            Connexion
          </button>
          <button
            onClick={() => { setMode('signup'); setError(null) }}
            className={clsx(
              'flex-1 py-2 rounded-lg text-lg font-bold transition-all',
              mode === 'signup' ? 'bg-white shadow text-slate-900' : 'text-slate-500'
            )}
          >
            Créer un compte
          </button>
        </div>

        {info && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-2xl p-4">
            <p className="text-green-700 text-base">{info}</p>
          </div>
        )}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="text-red-700 text-base">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-lg font-bold text-slate-700 mb-1" htmlFor="email">
              Adresse email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="votre@email.fr"
              className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-lg focus:outline-none focus:border-blue-400"
            />
          </div>

          {/* Password */}
          {mode !== 'reset' && (
            <div>
              <label className="block text-lg font-bold text-slate-700 mb-1" htmlFor="password">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  placeholder={mode === 'signup' ? 'Minimum 6 caractères' : '••••••••'}
                  className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-lg focus:outline-none focus:border-blue-400 pr-14"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-2xl"
                  aria-label={showPwd ? 'Masquer' : 'Afficher'}
                >
                  {showPwd ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={clsx(
              'w-full py-4 rounded-2xl text-xl font-extrabold transition-all mt-2',
              loading
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 text-white shadow-lg active:scale-95'
            )}
          >
            {loading
              ? '⏳ Chargement…'
              : mode === 'login'
              ? 'Se connecter'
              : mode === 'signup'
              ? 'Créer mon compte'
              : 'Envoyer le lien'}
          </button>
        </div>

        {/* Forgot password */}
        {mode === 'login' && (
          <button
            onClick={() => { setMode('reset'); setError(null) }}
            className="mt-4 w-full text-center text-blue-500 text-base underline"
          >
            Mot de passe oublié ?
          </button>
        )}
        {mode === 'reset' && (
          <button
            onClick={() => { setMode('login'); setError(null) }}
            className="mt-4 w-full text-center text-slate-500 text-base underline"
          >
            ← Retour à la connexion
          </button>
        )}
      </motion.div>

      <p className="text-center text-blue-300 text-sm mt-6">
        Vos données sont privées et sécurisées.
      </p>
    </div>
  )
}
