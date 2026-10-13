import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeAuthUser } from '../src/auth/authModel.js'

test('normalizes Supabase identity metadata for the app shell', () => {
  assert.deepEqual(normalizeAuthUser({
    id: 'user-1',
    email: 'andreh@example.com',
    user_metadata: { name: 'Andreh' },
  }), { id: 'user-1', name: 'Andreh', email: 'andreh@example.com' })
})

test('keeps a stable fallback when optional metadata is absent', () => {
  assert.deepEqual(normalizeAuthUser({ id: 'user-2', email: 'demo@example.com' }), {
    id: 'user-2',
    name: 'demo',
    email: 'demo@example.com',
  })
  assert.equal(normalizeAuthUser(null), null)
})
