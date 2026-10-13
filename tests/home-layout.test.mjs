import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

test('adds breathing room between the home intro and its content', () => {
  const app = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')

  assert.match(app, /animate-page-enter space-y-7/)
  assert.match(app, /items-end justify-between gap-6 animate-rise/)
  assert.match(app, /<p className="mt-2 text-sm leading-6 text-slate-500"/)
})

test('uses a more balanced responsive proportion for the home hero', () => {
  const hero = fs.readFileSync(new URL('../src/components/Hero.jsx', import.meta.url), 'utf8')

  assert.match(hero, /md:grid-cols-\[minmax\(0,1fr\)_240px\]/)
  assert.equal((hero.match(/h-\[320px\]/g) || []).length, 2)
  assert.equal((hero.match(/md:h-\[300px\]/g) || []).length, 2)
  assert.equal((hero.match(/xl:h-\[280px\]/g) || []).length, 2)
  assert.match(hero, /flex-col justify-start gap-2/)
  assert.match(hero, /pt-6/)
})

test('uses the profile AnimeList for the home library and empty state', () => {
  const rows = fs.readFileSync(new URL('../src/components/Rows.jsx', import.meta.url), 'utf8')

  assert.match(rows, /useProfile/)
  assert.match(rows, /profile\.animeList/)
  assert.match(rows, /Tu biblioteca está vacía/)
  assert.doesNotMatch(rows, /import \{ library, because \} from '\.\.\/data'/)
})

test('does not seed personalized recommendations with hardcoded anime', () => {
  const recommendations = fs.readFileSync(new URL('../src/rec/rec.jsx', import.meta.url), 'utf8')

  assert.doesNotMatch(recommendations, /const SEEDS/)
  assert.doesNotMatch(recommendations, /seeded: false/)
})
