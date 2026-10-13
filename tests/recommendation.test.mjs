import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import * as engine from '../src/rec/engine.js'
import { buildRecommendationState, migrateTasteState } from '../src/rec/providerModel.js'
const { librarySignal, STATUS_WEIGHTS, buildTasteProfile, profileSignature, scoreCandidate, recommend } = engine

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

test('uses distinct weights for each library state', () => {
  assert.deepEqual(STATUS_WEIGHTS, {
    completed: 1,
    watching: 0.7,
    favorite: 0.95,
    paused: 0.25,
    planned: 0.15,
  })
})

test('rebuilds the same taste profile regardless of library order', () => {
  const entries = [
    { id: '1', status: 'completed', genres: ['Drama', 'Romance'], updatedAt: '2026-01-01T00:00:00.000Z' },
    { id: '2', status: 'planned', genres: ['Comedy'], updatedAt: '2026-01-02T00:00:00.000Z' },
    { id: '3', status: 'watching', favorite: true, genres: ['Drama'], updatedAt: '2026-01-03T00:00:00.000Z' },
  ]

  const first = buildTasteProfile(entries, {}, Date.parse('2026-02-01T00:00:00.000Z'))
  const second = buildTasteProfile([...entries].reverse(), {}, Date.parse('2026-02-01T00:00:00.000Z'))

  assert.deepEqual(first.w, second.w)
  assert.equal(first.n, second.n)
  assert.ok(first.w['g:Drama'] > first.w['g:Comedy'])
})

test('profile signature changes with status but stays stable for reordered entries', () => {
  const entries = [
    { id: '1', status: 'planned', favorite: false, genres: ['Action'] },
    { id: '2', status: 'completed', favorite: true, genres: ['Drama'] },
  ]

  assert.equal(profileSignature(entries), profileSignature([...entries].reverse()))
  assert.notEqual(profileSignature(entries), profileSignature([{ ...entries[0], status: 'completed' }, entries[1]]))
})

test('applies temporal decay to older taste signals', () => {
  const entry = { id: '1', status: 'completed', genres: ['Fantasy'], updatedAt: '2026-01-01T00:00:00.000Z' }
  const recent = buildTasteProfile([entry], {}, Date.parse('2026-01-02T00:00:00.000Z'))
  const old = buildTasteProfile([entry], {}, Date.parse('2026-02-15T00:00:00.000Z'))

  assert.ok(recent.w['g:Fantasy'] > old.w['g:Fantasy'])
})

test('returns weighted score components for a candidate', () => {
  const result = scoreCandidate(
    { id: 10, score: 90, trend: 1000, pop: 10000, year: 2026, v: { 'g:Drama': 1 } },
    { w: { 'g:Drama': 1 }, n: 3 },
    { year: 2026 },
  )

  assert.equal(typeof result.score, 'number')
  assert.deepEqual(Object.keys(result.components).sort(), ['affinity', 'freshness', 'popularity', 'quality', 'trend'])
  assert.ok(result.components.affinity > 0)
  assert.ok(result.score > 0)
})

test('returns structured reasons for recommendations', () => {
  const [result] = recommend([
    { id: 10, title: 'Nueva historia', score: 85, trend: 10, pop: 100, year: 2026, v: { 'g:Drama': 1 } },
  ], { w: { 'g:Drama': 1 }, n: 3 }, {
    exclude: new Set(),
    liked: [{ id: 9, title: 'Tu drama favorito', v: { 'g:Drama': 1 } }],
    n: 1,
    year: 2026,
  })

  assert.equal(result.reasonKey, 'similar_to')
  assert.deepEqual(result.reasonData, { title: 'Tu drama favorito' })
  assert.match(result.reason, /Tu drama favorito/)
})

test('derives provider state idempotently and excludes every library entry', () => {
  const pool = [
    { id: 1, title: 'Ya agregada', score: 90, trend: 100, pop: 100, year: 2026, v: { 'g:Drama': 1 } },
    { id: 2, title: 'También agregada', score: 88, trend: 80, pop: 90, year: 2026, v: { 'g:Action': 1 } },
    { id: 3, title: 'Recomendable', score: 86, trend: 70, pop: 80, year: 2026, v: { 'g:Drama': 1 } },
  ]
  const input = {
    entries: [{ id: 1, status: 'planned', genres: ['Drama'] }, { id: 2, status: 'completed', genres: ['Action'] }],
    explicitState: { likedIds: [], hiddenIds: [] },
    pool,
    now: Date.parse('2026-02-01T00:00:00.000Z'),
    year: 2026,
  }

  const first = buildRecommendationState(input)
  const second = buildRecommendationState(input)

  assert.deepEqual(first.profile, second.profile)
  assert.deepEqual([...first.exclude].sort(), ['1', '2'])
  assert.ok(first.recs.every((item) => !first.exclude.has(String(item.id))))
  assert.equal(first.personalized, true)
})

test('replacing a library status does not accumulate the previous signal', () => {
  const base = { id: 1, genres: ['Drama'], updatedAt: '2026-01-01T00:00:00.000Z' }
  const now = Date.parse('2026-01-01T00:00:00.000Z')
  const planned = buildRecommendationState({ entries: [{ ...base, status: 'planned' }], pool: [], now })
  const completed = buildRecommendationState({ entries: [{ ...base, status: 'completed' }], pool: [], now })

  assert.ok(completed.profile.w['g:Drama'] > planned.profile.w['g:Drama'])
  assert.equal(completed.profile.w['g:Drama'], 1)
})

test('cold start returns live candidates without claiming personalization', () => {
  const state = buildRecommendationState({
    entries: [],
    pool: [{ id: 9, title: 'Tendencia', score: 90, trend: 1000, pop: 1000, year: 2026, v: { 'g:Action': 1 } }],
    year: 2026,
  })

  assert.equal(state.personalized, false)
  assert.equal(state.coldStart, true)
  assert.equal(state.recs[0].id, 9)
  assert.equal(state.recs[0].reasonKey, 'trending')
})

test('migrates explicit interactions from the previous local version', () => {
  assert.deepEqual(migrateTasteState({ liked: [1], hidden: [2], news: [3] }), {
    version: 3,
    liked: [1],
    hidden: [2],
    news: [3],
  })
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

test('ranks the live trends from AniList trending counts', () => {
  assert.equal(typeof engine.selectTrending, 'function')
  assert.equal(typeof engine.formatCount, 'function')

  const ranked = engine.selectTrending([
    { id: 1, trend: 1200, pop: 3000 },
    { id: 2, trend: 18400, pop: 10000 },
    { id: 3, trend: 16200, pop: 9000 },
  ])

  assert.deepEqual(ranked.map((item) => item.id), [2, 3, 1])
  assert.equal(engine.formatCount(ranked[0].trend), '18.4K')
})
