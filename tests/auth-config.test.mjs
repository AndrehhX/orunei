import test from 'node:test'
import assert from 'node:assert/strict'
import { readSupabaseConfig } from '../src/auth/supabaseClient.js'

test('reports missing Supabase configuration without pretending auth is ready', () => {
  assert.deepEqual(readSupabaseConfig({}), {
    configured: false,
    url: '',
    anonKey: '',
    error: 'Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY para activar las cuentas reales.',
  })
})

test('normalizes configured Supabase environment values', () => {
  assert.deepEqual(readSupabaseConfig({
    VITE_SUPABASE_URL: ' https://example.supabase.co ',
    VITE_SUPABASE_ANON_KEY: ' anon-key ',
  }), {
    configured: true,
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    error: '',
  })
})

test('rejects malformed Supabase URLs', () => {
  assert.equal(readSupabaseConfig({ VITE_SUPABASE_URL: 'not-a-url', VITE_SUPABASE_ANON_KEY: 'anon-key' }).configured, false)
})
