import test from 'node:test'
import assert from 'node:assert/strict'
import { buildCatalogRequest } from '../src/api/catalogQuery.js'

test('omits the AniList format variable when the catalog has no format filter', () => {
  const request = buildCatalogRequest({ genres: [], format: '', status: '', year: '', sort: 'Popular', search: '' }, 1)

  assert.equal(request.variables.format, undefined)
  assert.doesNotMatch(request.query, /format_in/)
})

test('includes the AniList format filter only when it is selected', () => {
  const request = buildCatalogRequest({ genres: [], format: 'Serie', status: '', year: '', sort: 'Popular', search: '' }, 1)

  assert.deepEqual(request.variables.format, ['TV', 'TV_SHORT'])
  assert.match(request.query, /format_in:\$format/)
})

test('includes AniList tag categories when extra filters are selected', () => {
  const request = buildCatalogRequest({ genres: [], tags: ['Isekai', 'Mecha'], format: '', status: '', year: '', sort: 'Popular', search: '' }, 1)

  assert.deepEqual(request.variables.tags, ['Isekai', 'Mecha'])
  assert.match(request.query, /tag_in:\$tags/)
})

