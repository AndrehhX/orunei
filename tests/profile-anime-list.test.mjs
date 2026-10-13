import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeAnimeEntry, normalizeAnimeList, toRemoteAnimeEntry } from '../src/profile/model.js'

test('normalizes user anime entries without trusting malformed fields', () => {
  const entry = normalizeAnimeEntry({ anime_id: 101, title: 'Frieren', status: 'watching', favorite: true, poster_url: 'https://img.test/frieren.jpg' })
  assert.equal(entry.id, '101')
  assert.equal(entry.t, 'Frieren')
  assert.equal(entry.s, 'Viendo')
  assert.equal(entry.favorite, true)
  assert.equal(entry.img, 'https://img.test/frieren.jpg')
})

test('deduplicates the account AnimeList and maps rows for remote persistence', () => {
  const list = normalizeAnimeList([
    { id: '101', q: 'Frieren', t: 'Frieren', s: 'Planeo ver' },
    { id: '101', q: 'Frieren', t: 'Frieren', s: 'Viendo' },
  ])
  assert.equal(list.length, 1)
  assert.equal(toRemoteAnimeEntry('user-1', list[0]).profile_id, 'user-1')
  assert.equal(toRemoteAnimeEntry('user-1', list[0]).anime_id, '101')
})
