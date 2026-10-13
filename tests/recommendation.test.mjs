import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import * as engine from '../src/rec/engine.js'
const { librarySignal } = engine

const animeApi = fs.readFileSync(new URL('../src/api/anime.js', import.meta.url), 'utf8')
const detail = fs.readFileSync(new URL('../src/components/AnimeDetail.jsx', import.meta.url), 'utf8')

test('shows IMDb as unavailable when no OMDb key is configured', async () => {
  assert.match(animeApi, /return \{ unavailable: true \}/)
  assert.match(detail, /No disponible/)
  assert.doesNotMatch(detail, /VITE_OMDB_KEY/)
})

test('maps AnimeList state to intentional recommendation signals', () => {
  assert.equal(librarySignal({ status: 'watching', favorite: false }), 'add')
  assert.equal(librarySignal({ status: 'completed', favorite: false }), 'add')
  assert.equal(librarySignal({ status: 'planned', favorite: false }), 'click')
  assert.equal(librarySignal({ status: 'paused', favorite: false }), 'click')
  assert.equal(librarySignal({ status: 'planned', favorite: true }), 'like')
})

test('rotates the live hero selection through the refreshed anime pool', () => {
  assert.equal(typeof engine.selectLatest, 'function')

  const pool = [
    { id: 1, year: 2026, trend: 1, pop: 1 },
    { id: 2, year: 2025, trend: 5, pop: 5 },
    { id: 3, year: 2024, trend: 9, pop: 9 },
    { id: 4, year: 2023, trend: 8, pop: 8 },
  ]

  const first = engine.selectLatest(pool, 0, 2, 1000)
  const next = engine.selectLatest(pool, 1000, 2, 1000)

  assert.deepEqual(first.map((item) => item.id), [1, 2])
  assert.deepEqual(next.map((item) => item.id), [2, 3])
})
