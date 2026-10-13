import test from 'node:test'
import assert from 'node:assert/strict'
import { clearProfileState, persistRemoteProfile, resolveLoadedProfile } from '../src/profile/profileProviderModel.js'

test('keeps authenticated identity while resolving a remote profile', () => {
  const result = resolveLoadedProfile({ id: 'user-1', displayName: 'Andreh', username: 'andreh' }, '', { id: 'user-1', email: 'andreh@example.com' })
  assert.equal(result.status, 'ready')
  assert.equal(result.profile.displayName, 'Andreh')
  assert.equal(result.profile.username, 'andreh')
})

test('returns a recoverable remote save result on success and failure', async () => {
  const success = await persistRemoteProfile({ saveProfile: async () => ({ data: { username: 'andreh' }, error: '' }) }, 'user-1', { username: 'andreh' })
  assert.equal(success.ok, true)
  assert.equal(success.data.username, 'andreh')

  const failure = await persistRemoteProfile({ saveProfile: async () => ({ data: null, error: 'RLS denied' }) }, 'user-1', { username: 'andreh' })
  assert.equal(failure.ok, false)
  assert.equal(failure.error, 'RLS denied')
})

test('clears profile state after sign out', () => {
  assert.deepEqual(clearProfileState(), { profile: null, status: 'signed-out', error: '' })
})
