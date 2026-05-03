'use client'

import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'

export default function SettingsPage() {
  const router = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    localStorage.removeItem('sb-access-token')
    router.replace('/login')
  }

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <div className="px-4 pt-5 pb-3 bg-white border-b border-slate-100">
        <h1 className="text-3xl font-extrabold text-slate-900">Réglages</h1>
      </div>

      <div className="flex-1 px-4 py-4 space-y-3">
        {/* Contacts */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => router.push('/contacts')}
          className="w-full bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4 active:scale-[0.98] transition-transform text-left"
        >
          <span className="text-4xl">👥</span>
          <div>
            <p className="text-xl font-bold text-slate-800">Mes contacts</p>
            <p className="text-base text-slate-500">Renommer vos correspondants</p>
          </div>
          <span className="ml-auto text-2xl text-slate-300">›</span>
        </motion.button>

        {/* Manage connections */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => router.push('/connect')}
          className="w-full bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4 active:scale-[0.98] transition-transform text-left"
        >
          <span className="text-4xl">🔗</span>
          <div>
            <p className="text-xl font-bold text-slate-800">Mes comptes connectés</p>
            <p className="text-base text-slate-500">Gmail, WhatsApp, SMS</p>
          </div>
          <span className="ml-auto text-2xl text-slate-300">›</span>
        </motion.button>

        {/* Font size hint */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-blue-50 rounded-2xl p-5 border border-blue-100"
        >
          <div className="flex items-center gap-4">
            <span className="text-4xl">🔡</span>
            <div>
              <p className="text-xl font-bold text-slate-800">Taille du texte</p>
              <p className="text-base text-slate-500">
                Pour agrandir le texte, utilisez les réglages d'accessibilité de votre téléphone :<br />
                <strong>Réglages → Accessibilité → Taille du texte</strong>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Notifications hint */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-amber-50 rounded-2xl p-5 border border-amber-100"
        >
          <div className="flex items-center gap-4">
            <span className="text-4xl">🔔</span>
            <div>
              <p className="text-xl font-bold text-slate-800">Notifications</p>
              <p className="text-base text-slate-500">
                Pour activer les alertes de nouveaux messages, ajoutez cette page à votre écran d'accueil et autorisez les notifications.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Sync Gmail */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          onClick={async () => {
            try { await import('@/lib/api').then(m => m.api.integrations.gmailSync()) } catch {}
            router.push('/inbox')
          }}
          className="w-full bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4 active:scale-[0.98] transition-transform text-left"
        >
          <span className="text-4xl">🔄</span>
          <div>
            <p className="text-xl font-bold text-slate-800">Synchroniser les emails</p>
            <p className="text-base text-slate-500">Récupérer les derniers emails Gmail</p>
          </div>
          <span className="ml-auto text-2xl text-slate-300">›</span>
        </motion.button>

        {/* Logout */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={handleLogout}
          className="w-full bg-red-50 rounded-2xl p-5 border border-red-100 flex items-center gap-4 active:scale-[0.98] transition-transform text-left"
        >
          <span className="text-4xl">🚪</span>
          <div>
            <p className="text-xl font-bold text-red-700">Se déconnecter</p>
            <p className="text-base text-red-400">Fermer votre session</p>
          </div>
        </motion.button>

        {/* Version */}
        <div className="text-center pt-4 pb-2 text-slate-400 text-base">
          Mes Messages — version 1.0
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
