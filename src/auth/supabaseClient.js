import { createClient } from '@supabase/supabase-js'

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {}

const DEFAULT_SUPABASE_URL = 'https://afgvxmqapzikggmasskz.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmZ3Z4bXFhcHppa2dnbWFzc2t6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwMjYwODEsImV4cCI6MjEwNzYwMjA4MX0.c6OPXgUJz855R1JnLayAfiUIBsAvDlFqQtLFFziD8rU'

function isValidSupabaseUrl(value) {
  try {
    const protocol = new URL(value).protocol
    return protocol === 'https:' || protocol === 'http:'
  } catch {
    return false
  }
}

export function readSupabaseConfig(source = env) {
  const isExplicit = source !== env
  const rawUrl = source?.VITE_SUPABASE_URL
  const rawAnonKey = source?.VITE_SUPABASE_ANON_KEY

  const url = (typeof rawUrl === 'string' ? rawUrl.trim() : '') || (!isExplicit ? DEFAULT_SUPABASE_URL : '')
  const anonKey = (typeof rawAnonKey === 'string' ? rawAnonKey.trim() : '') || (!isExplicit ? DEFAULT_SUPABASE_ANON_KEY : '')
  const configured = Boolean(url && anonKey && isValidSupabaseUrl(url))
  return {
    configured,
    url,
    anonKey,
    error: configured ? '' : 'Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY para activar las cuentas reales.',
  }
}

export const supabaseConfig = readSupabaseConfig()
export const supabase = supabaseConfig.configured
  ? createClient(supabaseConfig.url, supabaseConfig.anonKey)
  : null
