import test from 'node:test'
import assert from 'node:assert/strict'
import { buildEpisodeCards } from '../src/api/episodeData.js'

test('builds episode cards only from real legal streaming links and always has an image', () => {
  const episodes = buildEpisodeCards({
    coverImage: { extraLarge: 'https://img.test/cover.jpg' },
    streamingEpisodes: [
      { title: 'Episode 1', url: 'https://watch.test/episode-1', site: 'Crunchyroll', thumbnail: '' },
      { title: 'Episode 1 duplicate', url: 'https://watch.test/episode-1', site: 'Crunchyroll', thumbnail: 'https://img.test/ep-1.jpg' },
      { title: 'Episode 2', url: 'https://watch.test/episode-2', site: 'Crunchyroll', thumbnail: 'https://img.test/ep-2.jpg' },
      { title: 'Missing link', url: '', site: 'Crunchyroll', thumbnail: 'https://img.test/missing.jpg' },
    ],
  })

  assert.deepEqual(episodes, [
    { title: 'Episode 1', url: 'https://watch.test/episode-1', site: 'Crunchyroll', thumbnail: 'https://img.test/cover.jpg' },
    { title: 'Episode 2', url: 'https://watch.test/episode-2', site: 'Crunchyroll', thumbnail: 'https://img.test/ep-2.jpg' },
  ])
})
