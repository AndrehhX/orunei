import { createClient } from '@supabase/supabase-js'

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {}

function isValidSupabaseUrl(value) {
  try {
    const protocol = new URL(value).protocol
    return protocol === 'https:' || protocol === 'http:'
  } catch {
    return false
  }
}

export function readSupabaseConfig(source = env) {
  const url = typeof source?.VITE_SUPABASE_URL === 'string' ? source.VITE_SUPABASE_URL.trim() : ''
  const anonKey = typeof source?.VITE_SUPABASE_ANON_KEY === 'string' ? source.VITE_SUPABASE_ANON_KEY.trim() : ''
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
