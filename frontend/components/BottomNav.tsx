'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

const tabs = [
  { href: '/inbox',    icon: '📬', label: 'Messages'  },
  { href: '/compose',  icon: '✏️',  label: 'Écrire'    },
  { href: '/contacts', icon: '👥', label: 'Contacts'  },
  { href: '/settings', icon: '⚙️',  label: 'Réglages'  },
]

export default function BottomNav({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white border-t border-slate-200 safe-area-bottom z-50">
      <div className="flex">
        {tabs.map(tab => {
          const active = pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={clsx(
                'flex-1 flex flex-col items-center justify-center py-3 gap-0.5 text-sm font-medium transition-colors relative',
                active ? 'text-blue-600' : 'text-slate-500'
              )}
            >
              <span className="text-2xl leading-none">{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.href === '/inbox' && unreadCount > 0 && (
                <span className="absolute top-2 right-[calc(50%-18px)] min-w-[20px] h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1 font-bold">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
