import test from 'node:test'
import assert from 'node:assert/strict'
import { buildNewsImageFallback, extractFeedImage } from '../src/newsImages.js'

test('extracts the first usable image from common RSS item shapes', () => {
  assert.equal(extractFeedImage({ thumbnail: 'https://cdn.example/thumb.jpg' }), 'https://cdn.example/thumb.jpg')
  assert.equal(extractFeedImage({ enclosure: { link: 'https://cdn.example/cover.png', type: 'image/png' } }), 'https://cdn.example/cover.png')
  assert.equal(extractFeedImage({ content: '<p>News</p><img src="https://cdn.example/article.webp" />' }), 'https://cdn.example/article.webp')
  assert.equal(extractFeedImage({}), '')
})

test('builds a cached image fallback from an article link', () => {
  const url = buildNewsImageFallback('https://example.com/anime/news?id=42')
  assert.match(url, /^https:\/\/api\.microlink\.io\//)
  assert.match(url, /screenshot=true/)
  assert.match(url, /meta=false/)
  assert.match(url, /embed=screenshot\.url/)
  assert.match(url, /url=https%3A%2F%2Fexample\.com%2Fanime%2Fnews%3Fid%3D42/)
  assert.equal(buildNewsImageFallback(''), '')
})
