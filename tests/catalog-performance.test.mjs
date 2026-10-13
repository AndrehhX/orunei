import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

test('renders anime details inside the catalog page instead of a blocking modal', () => {
  const detail = fs.readFileSync(new URL('../src/components/AnimeDetail.jsx', import.meta.url), 'utf8')

  assert.doesNotMatch(detail, /fixed inset-0 z-40/)
  assert.doesNotMatch(detail, /backdrop-blur-sm/)
  assert.match(detail, /Volver al catálogo/)
})

test('keeps catalog cards cheap to render and decode', () => {
  const page = fs.readFileSync(new URL('../src/components/AnimePage.jsx', import.meta.url), 'utf8')

  assert.doesNotMatch(page, /<Reveal delay=\{\(i % 12\) \* 45\}>/)
  assert.match(page, /loading="lazy" decoding="async"/)
  assert.match(page, /contentVisibility: 'auto'/)
})

test('lets users choose a description language with a Spanish default', () => {
  const api = fs.readFileSync(new URL('../src/api/anime.js', import.meta.url), 'utf8')
  const detail = fs.readFileSync(new URL('../src/components/AnimeDetail.jsx', import.meta.url), 'utf8')

  assert.match(api, /export async function translateDescription/)
  assert.match(detail, /descriptionLanguage.*es/)
  assert.match(detail, /Espa/)
  assert.match(detail, /English/)
  assert.match(detail, /translateDescription/)
})
