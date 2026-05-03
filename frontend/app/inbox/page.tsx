'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSummary, Source, InboxStats } from '@/lib/types'
import { api, DEMO_MESSAGES } from '@/lib/api'
import MessageCard from '@/components/MessageCard'
import BottomNav from '@/components/BottomNav'
import FilterTabs from '@/components/FilterTabs'
import EmptyState from '@/components/EmptyState'

const USE_DEMO = !process.env.NEXT_PUBLIC_API_URL

export default function InboxPage() {
  const [messages, setMessages] = useState<MessageSummary[]>([])
  const [stats, setStats]       = useState<InboxStats | null>(null)
  const [filter, setFilter]     = useState<Source | 'all'>('all')
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      if (USE_DEMO) {
        // Demo mode: use mock data
        setMessages(DEMO_MESSAGES)
        const unread = DEMO_MESSAGES.filter(m => !m.read_at)
        setStats({
          total_unread: unread.length,
          unread_sms:      unread.filter(m => m.source === 'sms').length,
          unread_whatsapp: unread.filter(m => m.source === 'whatsapp').length,
          unread_gmail:    unread.filter(m => m.source === 'gmail').length,
        })
      } else {
        const [msgs, st] = await Promise.all([api.inbox.list(), api.inbox.stats()])
        setMessages(msgs)
        setStats(st)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Impossible de charger les messages')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = filter === 'all' ? messages : messages.filter(m => m.source === filter)

  const filterCounts = {
    all:      stats?.total_unread ?? 0,
    sms:      stats?.unread_sms   ?? 0,
    whatsapp: stats?.unread_whatsapp ?? 0,
    gmail:    stats?.unread_gmail ?? 0,
  }

  return (
    <div className="flex flex-col min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-50 pt-safe">
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-3xl font-extrabold text-slate-900">Mes Messages</h1>
            <button
              onClick={load}
              className="text-blue-600 text-base font-semibold active:opacity-60"
              aria-label="Actualiser"
            >
              🔄 Actualiser
            </button>
          </div>
          {stats && stats.total_unread > 0 && (
            <p className="text-lg text-blue-600 font-semibold">
              {stats.total_unread} nouveau{stats.total_unread > 1 ? 'x' : ''} message{stats.total_unread > 1 ? 's' : ''}
            </p>
          )}
          {stats && stats.total_unread === 0 && !loading && (
            <p className="text-lg text-slate-400">Tout est lu ✓</p>
          )}
        </div>

        {/* Filter tabs */}
        <div className="pb-3">
          <FilterTabs active={filter} onChange={setFilter} counts={filterCounts} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mb-4" />
            <p className="text-xl text-slate-400">Chargement…</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-4 text-center">
            <p className="text-xl font-semibold text-red-700 mb-1">Problème de connexion</p>
            <p className="text-base text-red-500 mb-3">{error}</p>
            <button
              onClick={load}
              className="bg-red-600 text-white rounded-xl px-6 py-2 font-semibold text-lg"
            >
              Réessayer
            </button>
          </div>
        )}

        {!loading && !error && (
          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <EmptyState filter={filter} />
            ) : (
              filtered.map((msg, i) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <MessageCard message={msg} />
                </motion.div>
              ))
            )}
          </AnimatePresence>
        )}
      </div>

      <BottomNav unreadCount={stats?.total_unread ?? 0} />
    </div>
  )
}
