import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mes Messages',
  description: 'Tous vos SMS, WhatsApp et emails en un seul endroit',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Mes Messages' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#3B82F6',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="max-w-lg mx-auto min-h-screen bg-slate-50">
        {children}
      </body>
    </html>
  )
}
