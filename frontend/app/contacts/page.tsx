'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'
import clsx from 'clsx'

interface Contact {
  id: string
  display_name: string
  phone_number?: string
  email?: string
  whatsapp_id?: string
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
  'bg-purple-100 text-purple-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
]
function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

export default function ContactsPage() {
  const router = useRouter()
  const [contacts, setContacts]   = useState<Contact[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [editing, setEditing]     = useState<Contact | null>(null)
  const [editName, setEditName]   = useState('')
  const [saving, setSaving]       = useState(false)
  const [userId, setUserId]       = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) { router.replace('/login'); return }
      setUserId(authData.user.id)
      try {
        const { data: rows } = await supabase
          .from('contacts')
          .select('*')
          .eq('user_id', authData.user.id)
          .order('display_name')
        setContacts(rows ?? [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  const filtered = contacts.filter(c =>
    c.display_name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone_number?.includes(search) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  function startEdit(c: Contact) {
    setEditing(c)
    setEditName(c.display_name)
  }

  async function saveEdit() {
    if (!editing || !editName.trim()) return
    setSaving(true)
    await supabase
      .from('contacts')
      .update({ display_name: editName.trim() })
      .eq('id', editing.id)
    setContacts(prev => prev.map(c => c.id === editing.id ? { ...c, display_name: editName.trim() } : c))
    setEditing(null)
    setSaving(false)
  }

  async function deleteContact(id: string) {
    await supabase.from('contacts').delete().eq('id', id)
    setContacts(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="flex flex-col min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-100 px-4 pt-4 pb-3">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.back()} className="text-blue-600 text-2xl font-bold">←</button>
          <h1 className="text-2xl font-extrabold text-slate-900">Mes contacts</h1>
        </div>
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un contact…"
          className="w-full bg-slate-100 rounded-2xl px-4 py-3 text-lg text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-300 transition-all"
        />
      </div>

      {/* List */}
      <div className="flex-1 px-4 py-3">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl block mb-4">👥</span>
            <p className="text-xl font-bold text-slate-700">
              {search ? 'Aucun résultat' : 'Aucun contact pour l\'instant'}
            </p>
            <p className="text-base text-slate-400 mt-1">
              Les contacts apparaissent automatiquement quand vous recevez des messages.
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 bg-white rounded-2xl p-4 mb-3 shadow-sm border border-slate-100"
              >
                {/* Avatar */}
                <div className={clsx('w-14 h-14 rounded-full flex items-center justify-center text-xl font-extrabold flex-shrink-0', avatarColor(c.display_name))}>
                  {initials(c.display_name)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xl font-bold text-slate-900 truncate">{c.display_name}</p>
                  {c.phone_number && (
                    <p className="text-base text-slate-400">{c.phone_number}</p>
                  )}
                  {c.email && (
                    <p className="text-base text-slate-400 truncate">{c.email}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    onClick={() => startEdit(c)}
                    className="bg-blue-50 text-blue-600 rounded-xl px-3 py-1.5 text-base font-semibold"
                  >
                    ✏️ Renommer
                  </button>
                  <button
                    onClick={() => deleteContact(c.id)}
                    className="bg-red-50 text-red-500 rounded-xl px-3 py-1.5 text-base font-semibold"
                  >
                    🗑️ Supprimer
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Edit modal */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end"
            onClick={e => { if (e.target === e.currentTarget) setEditing(null) }}
          >
            <motion.div
              initial={{ y: 80 }}
              animate={{ y: 0 }}
              exit={{ y: 80 }}
              className="w-full max-w-lg mx-auto bg-white rounded-t-3xl p-6 shadow-xl"
            >
              <h3 className="text-2xl font-extrabold text-slate-900 mb-1">Renommer le contact</h3>
              <p className="text-base text-slate-400 mb-4">{editing.phone_number || editing.email}</p>
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveEdit()}
                autoFocus
                className="w-full border-2 border-blue-300 rounded-2xl px-4 py-3 text-xl text-slate-800 focus:outline-none mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setEditing(null)}
                  className="flex-1 py-4 rounded-2xl border-2 border-slate-200 text-xl font-bold text-slate-600"
                >
                  Annuler
                </button>
                <button
                  onClick={saveEdit}
                  disabled={saving || !editName.trim()}
                  className={clsx(
                    'flex-1 py-4 rounded-2xl text-xl font-extrabold text-white',
                    editName.trim() && !saving ? 'bg-blue-600' : 'bg-slate-300'
                  )}
                >
                  {saving ? '…' : 'Enregistrer'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  )
}
