import test from 'node:test'
import assert from 'node:assert/strict'
import { readProfileStorage, writeProfileStorage } from '../src/profile/profileStorage.js'
import { selectAnimeSections, selectProfileStats, selectRecentActivity } from '../src/profile/profileData.js'
import { createProfile } from '../src/profile/model.js'

const library = [
  { q: 'frieren', t: 'Frieren', s: 'Viendo · Ep. 8 de 28' },
  { q: 'monster', t: 'Monster', s: 'Planeo ver' },
  { q: 'vinland', t: 'Vinland Saga', s: 'En pausa' },
  { q: 'silent', t: 'A Silent Voice', s: 'Terminado' },
  { q: 'your-name', t: 'Your Name.', s: 'Favorito' },
]

test('selects AnimeList sections from the real library statuses', () => {
  const sections = selectAnimeSections(library)
  assert.deepEqual(Object.fromEntries(Object.entries(sections).map(([key, value]) => [key, value.map((item) => item.t)])), {
    watching: ['Frieren'],
    planned: ['Monster'],
    paused: ['Vinland Saga'],
    completed: ['A Silent Voice'],
    favorites: ['Your Name.'],
  })
})

test('selects stats and recent profile activity without inventing social counts', () => {
  const profile = createProfile({ name: 'Andreh', email: 'andreh@example.com' })
  profile.customLists = [{ id: 'one', title: 'Romance', animeIds: ['1'] }]
  profile.activity = [
    { id: 'old', type: 'profile', label: 'Cambió su bio', at: '2026-01-01' },
    { id: 'new', type: 'list', label: 'Creó una lista', at: '2026-01-02' },
  ]
  assert.deepEqual(selectProfileStats(library, 3, profile), { works: 5, favorites: 1, lists: 1, tastes: 3 })
  assert.deepEqual(selectRecentActivity(profile, library).map((item) => item.id), ['new', 'old'])
})

test('reads malformed storage as a normalized profile and reports write errors', () => {
  const storage = {
    values: new Map([['orunei-profile-v1', '{"displayName":42,"bio":"ok"}']]),
    getItem(key) { return this.values.get(key) ?? null },
    setItem(key, value) { this.values.set(key, value) },
  }
  const profile = readProfileStorage(storage, { name: 'Andreh', email: 'andreh@example.com' })
  assert.equal(profile.displayName, 'Andreh')
  assert.equal(profile.bio, 'ok')
  assert.equal(writeProfileStorage(storage, profile).ok, true)

  const failingStorage = { getItem() { return null }, setItem() { throw new Error('quota') } }
  const result = writeProfileStorage(failingStorage, profile)
  assert.equal(result.ok, false)
  assert.match(result.error, /quota/i)
})
