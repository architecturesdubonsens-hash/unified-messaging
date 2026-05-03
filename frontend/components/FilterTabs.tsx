'use client'

import clsx from 'clsx'
import { Source } from '@/lib/types'

const FILTERS: { value: Source | 'all'; label: string; icon: string }[] = [
  { value: 'all',       label: 'Tout',     icon: '📬' },
  { value: 'whatsapp',  label: 'WhatsApp', icon: '💬' },
  { value: 'sms',       label: 'SMS',      icon: '📱' },
  { value: 'gmail',     label: 'Email',    icon: '✉️' },
]

interface Props {
  active: Source | 'all'
  onChange: (v: Source | 'all') => void
  counts?: Partial<Record<Source | 'all', number>>
}

export default function FilterTabs({ active, onChange, counts = {} }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 px-4 scrollbar-hide">
      {FILTERS.map(f => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          className={clsx(
            'flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-base font-semibold transition-all',
            active === f.value
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-slate-600 border border-slate-200'
          )}
        >
          <span>{f.icon}</span>
          <span>{f.label}</span>
          {counts[f.value] !== undefined && counts[f.value]! > 0 && (
            <span className={clsx(
              'text-xs rounded-full px-1.5 py-0.5 font-bold',
              active === f.value ? 'bg-white text-blue-600' : 'bg-red-500 text-white'
            )}>
              {counts[f.value]}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
