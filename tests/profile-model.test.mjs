import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_PROFILE,
  PROFILE_KEY,
  createProfile,
  getProfileStats,
  makeActivity,
  normalizeProfile,
  validateImageFile,
} from '../src/profile/model.js'

test('exposes the private profile storage contract and useful defaults', () => {
  assert.equal(PROFILE_KEY, 'orunei-profile-v1')
  const profile = createProfile({ name: 'Andreh', email: 'andreh@example.com' })

  assert.equal(profile.displayName, 'Andreh')
  assert.equal(profile.username, 'andreh')
  assert.equal(profile.bio, '')
  assert.equal(profile.status, '')
  assert.equal(profile.accent, DEFAULT_PROFILE.accent)
  assert.deepEqual(profile.pinnedSections, ['overview', 'animelist', 'favorites'])
  assert.deepEqual(profile.privacy, DEFAULT_PROFILE.privacy)
  assert.deepEqual(Object.keys(profile.privacy), ['animeList', 'favorites', 'activity', 'lists'])
  assert.deepEqual(profile.customLists, [])
  assert.deepEqual(profile.activity, [])
})

test('normalizes malformed local data without losing the user identity', () => {
  const profile = normalizeProfile({
    displayName: 42,
    username: 'Bad Name!!',
    privacy: { animeList: 'public', favorites: 'nope' },
    pinnedSections: ['animelist', 'animelist', 'unknown'],
    customLists: [{ id: 'list-1', title: '  Mis favoritos  ', animeIds: ['1', 2, '1'] }, null],
    activity: [{ type: 'profile', label: 'Actualizó su perfil', at: '2026-01-01' }, { nope: true }],
  }, { name: 'Andreh', email: 'andreh@example.com' })

  assert.equal(profile.displayName, 'Andreh')
  assert.equal(profile.username, 'andreh')
  assert.equal(profile.privacy.animeList, 'public')
  assert.equal(profile.privacy.favorites, 'private')
  assert.deepEqual(profile.pinnedSections, ['animelist'])
  assert.equal(profile.customLists.length, 1)
  assert.equal(profile.customLists[0].title, 'Mis favoritos')
  assert.equal(profile.customLists[0].accent, DEFAULT_PROFILE.accent)
  assert.deepEqual(profile.customLists[0].animeIds, ['1', '2'])
  assert.equal(profile.activity.length, 1)
})

test('validates image type and file size before reading a file', () => {
  assert.deepEqual(validateImageFile({ type: 'image/png', size: 1024 }, 'avatar'), { ok: true })
  assert.equal(validateImageFile({ type: 'text/plain', size: 1024 }, 'avatar').ok, false)
  assert.match(validateImageFile({ type: 'image/png', size: 5 * 1024 * 1024 + 1 }, 'banner').error, /5 MB/)
  assert.equal(validateImageFile({ type: 'image/png', size: 1024 }, 'cover').ok, false)
})

test('creates bounded activity records and computes real profile stats', () => {
  const now = '2026-10-12T12:00:00.000Z'
  const event = makeActivity('list', 'Creó la lista “Favoritos”', now)
  assert.deepEqual(event, { id: 'list-2026-10-12T12:00:00.000Z', type: 'list', label: 'Creó la lista “Favoritos”', at: now })

  const library = [
    { s: 'Viendo · Ep. 2 de 12' },
    { s: 'Terminado' },
    { s: 'Favorito' },
    { s: 'Favorito' },
  ]
  const profile = normalizeProfile({ customLists: [{ id: 'one', title: 'Una lista', animeIds: ['a'] }] }, { name: 'A', email: 'a@b.com' })
  assert.deepEqual(getProfileStats(library, 7, profile), {
    works: 4,
    favorites: 2,
    lists: 1,
    tastes: 7,
  })
})
