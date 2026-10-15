import test from 'node:test'
import assert from 'node:assert/strict'
import { cleanAuthEmail, normalizeAuthUser, REGISTER_USERNAME_PLACEHOLDER } from '../src/auth/authModel.js'

test('uses a neutral username example in registration', () => {
  assert.equal(REGISTER_USERNAME_PLACEHOLDER, 'ej. mika_anime')
  assert.notEqual(REGISTER_USERNAME_PLACEHOLDER, 'dereck')
})

test('cleanAuthEmail trims whitespace and lowercases mobile keyboard input', () => {
  assert.equal(cleanAuthEmail('  Usuario@Gmail.Com  '), 'usuario@gmail.com')
  assert.equal(cleanAuthEmail('test@gmail.com '), 'test@gmail.com')
  assert.equal(cleanAuthEmail(''), '')
  assert.equal(cleanAuthEmail(null), '')
  assert.equal(cleanAuthEmail(undefined), '')
})

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
