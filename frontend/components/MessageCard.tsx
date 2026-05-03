'use client'

import Link from 'next/link'
import { MessageSummary, SOURCE_COLORS } from '@/lib/types'
import { relativeTime } from '@/lib/time'
import SourceBadge from './SourceBadge'
import clsx from 'clsx'

interface Props {
  message: MessageSummary
}

export default function MessageCard({ message }: Props) {
  const isUnread  = !message.read_at
  const isReplied = !!message.replied_at
  const colors    = SOURCE_COLORS[message.source]
  const sender    = message.contact_name || message.from_address
  const href      = message.thread_id
    ? `/conversation/${encodeURIComponent(message.thread_id)}`
    : `/message/${message.id}`

  return (
    <Link href={href} className="block">
      <div
        className={clsx(
          'relative rounded-2xl p-4 mb-3 bg-white shadow-sm border-l-4 transition-all active:scale-[0.98]',
          colors.border,
          isUnread ? 'shadow-md' : 'opacity-80'
        )}
      >
        {/* Unread dot */}
        {isUnread && (
          <span className={clsx('absolute top-4 right-4 w-3 h-3 rounded-full', colors.dot)} />
        )}

        {/* Header row */}
        <div className="flex items-start gap-3 mb-2">
          {/* Avatar / initials */}
          <div
            className={clsx(
              'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold',
              colors.bg, colors.text
            )}
          >
            {sender.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className={clsx('text-lg font-bold truncate', isUnread ? 'text-slate-900' : 'text-slate-600')}>
                {sender}
              </span>
              <span className="text-sm text-slate-400 flex-shrink-0">
                {relativeTime(message.received_at)}
              </span>
            </div>
            <SourceBadge source={message.source} size="sm" />
          </div>
        </div>

        {/* Subject (email) */}
        {message.subject && (
          <p className={clsx('text-base font-semibold mb-1 truncate', isUnread ? 'text-slate-800' : 'text-slate-500')}>
            {message.subject}
          </p>
        )}

        {/* Preview */}
        <p className={clsx(
          'text-base leading-snug line-clamp-2',
          isUnread ? 'text-slate-700' : 'text-slate-400'
        )}>
          {message.body_preview}
        </p>

        {/* Footer */}
        {isReplied && (
          <p className="mt-2 text-sm text-slate-400 italic">✓ Vous avez répondu</p>
        )}
      </div>
    </Link>
  )
}
