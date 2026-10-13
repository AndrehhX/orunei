import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { librarySignal } from '../src/rec/engine.js'

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
