import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const api = fs.readFileSync(new URL('../src/api/anime.js', import.meta.url), 'utf8')
const catalog = fs.readFileSync(new URL('../src/components/AnimePage.jsx', import.meta.url), 'utf8')
const newsPage = fs.readFileSync(new URL('../src/components/NewsPage.jsx', import.meta.url), 'utf8')
const rows = fs.readFileSync(new URL('../src/components/Rows.jsx', import.meta.url), 'utf8')
const poster = fs.readFileSync(new URL('../src/components/Poster.jsx', import.meta.url), 'utf8')
const news = fs.readFileSync(new URL('../src/news.jsx', import.meta.url), 'utf8')

test('uses cancellable catalog requests and async image decoding', () => {
  assert.match(api, /export async function searchAnime\(f, page = 1, signal\)/)
  assert.match(api, /signal/)
  assert.match(catalog, /decoding="async"/)
  assert.doesNotMatch(catalog, /import Reveal/)
  assert.match(poster, /decoding="async"/)
})

test('keeps news and recommendation rows free of observer-per-card reveals', () => {
  assert.doesNotMatch(newsPage, /import Reveal/)
  assert.doesNotMatch(rows, /import Reveal/)
  assert.match(news, /requestId|loadVersion|activeRequest/)
})
