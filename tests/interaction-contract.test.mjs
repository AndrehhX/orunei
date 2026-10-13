import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const app = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
const hero = fs.readFileSync(new URL('../src/components/Hero.jsx', import.meta.url), 'utf8')
const rows = fs.readFileSync(new URL('../src/components/Rows.jsx', import.meta.url), 'utf8')

test('routes hero details into the real anime detail flow', () => {
  assert.match(app, /openAnime/)
  assert.match(app, /<Hero onOpenDetail=\{openAnime\}/)
  assert.match(hero, /onOpenDetail\?\.\(s\)/)
})

test('gives home library actions a real library destination', () => {
  assert.match(app, /<Library query=\{query\} onMore=\{\(\) => navigatePage\('library'\)\}/)
  assert.match(rows, /export function Library\(\{ query, onMore \}\)/)
  assert.match(rows, /onClick=\{onMore\}/)
})
