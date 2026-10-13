import test from 'node:test'
import assert from 'node:assert/strict'
import { getHomeTabClass } from '../src/ui/homeTabs.js'

test('keeps the active home tab visible without relying on a measured indicator', () => {
  const active = getHomeTabClass('Anime', 'Anime')
  const inactive = getHomeTabClass('Noticias', 'Anime')

  assert.match(active, /bg-brand/)
  assert.match(active, /text-white/)
  assert.doesNotMatch(inactive, /bg-brand/)
  assert.match(inactive, /text-slate-600/)
})
