import { Source, SOURCE_COLORS, SOURCE_LABELS } from '@/lib/types'
import clsx from 'clsx'

interface Props {
  source: Source
  size?: 'sm' | 'md'
}

const ICONS: Record<Source, string> = {
  sms:      '📱',
  whatsapp: '💬',
  gmail:    '✉️',
}

export default function SourceBadge({ source, size = 'md' }: Props) {
  const c = SOURCE_COLORS[source]
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full font-semibold',
        c.bg, c.text,
        size === 'sm' ? 'px-2 py-0.5 text-sm' : 'px-3 py-1 text-base'
      )}
    >
      <span>{ICONS[source]}</span>
      <span>{SOURCE_LABELS[source]}</span>
    </span>
  )
}
