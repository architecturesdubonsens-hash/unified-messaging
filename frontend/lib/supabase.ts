import { createClient } from '@supabase/supabase-js'

// Fallback values prevent build-time crash when env vars are absent (pages are client-only at runtime)
const url = process.env.NEXT_PUBLIC_SUPABASE_URL  || 'https://placeholder.supabase.co'
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export const supabase = createClient(url, key)
