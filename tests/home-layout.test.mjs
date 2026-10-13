import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

test('adds breathing room between the home intro and its content', () => {
  const app = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')

  assert.match(app, /animate-page-enter space-y-5/)
  assert.match(app, /items-end justify-between gap-4 animate-rise/)
})

test('uses a more balanced responsive proportion for the home hero', () => {
  const hero = fs.readFileSync(new URL('../src/components/Hero.jsx', import.meta.url), 'utf8')

  assert.match(hero, /md:grid-cols-\[minmax\(0,1fr\)_240px\]/)
  assert.equal((hero.match(/h-\[232px\]/g) || []).length, 2)
  assert.match(hero, /gap-1\.5 p-6/)
})
