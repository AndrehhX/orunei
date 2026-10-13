import test from 'node:test'
import assert from 'node:assert/strict'
import { createLibraryEntry, normalizeAnimeEntry, normalizeAnimeList, toRemoteAnimeEntry } from '../src/profile/model.js'

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

test('converts catalogue media into a real library entry', () => {
  const entry = createLibraryEntry({ id: 101, title: 'Frieren', coverImage: { extraLarge: 'https://img.test/frieren.jpg' }, seasonYear: 2023, genres: ['Fantasy'] })
  assert.deepEqual(entry, {
    id: '101',
    animeId: '101',
    q: 'Frieren',
    t: 'Frieren',
    s: 'Planeo ver',
    status: 'planned',
    favorite: false,
    dot: 'bg-blue-500',
    img: 'https://img.test/frieren.jpg',
    banner: '',
    grad: 'linear-gradient(135deg,#c9b7e6,#6f8a6b)',
    year: 2023,
    genres: ['Fantasy'],
  })
})
