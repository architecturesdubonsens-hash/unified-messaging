import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        sms:       { DEFAULT: '#3B82F6', light: '#DBEAFE', text: '#1D4ED8' },
        whatsapp:  { DEFAULT: '#25D366', light: '#DCFCE7', text: '#15803D' },
        gmail:     { DEFAULT: '#EA4335', light: '#FEE2E2', text: '#B91C1C' },
      },
      fontSize: {
        // Larger base sizes for accessibility
        'inbox-name': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        'inbox-preview': ['1.1rem', { lineHeight: '1.6rem' }],
        'inbox-time': ['0.95rem', { lineHeight: '1.4rem' }],
      },
    },
  },
  plugins: [],
}
export default config
