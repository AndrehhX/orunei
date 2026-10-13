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
  assert.equal((hero.match(/h-\[360px\]/g) || []).length, 2)
  assert.equal((hero.match(/md:h-\[340px\]/g) || []).length, 2)
  assert.equal((hero.match(/xl:h-\[320px\]/g) || []).length, 2)
  assert.match(hero, /flex-col justify-start gap-2/)
  assert.match(hero, /pb-12 pt-6/)
  assert.match(hero, /mt-auto flex gap-2/)
  assert.match(hero, /absolute bottom-2 left-1\/2/)
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

test('refreshes the recommendation pool with recent AniList anime', () => {
  const recommendations = fs.readFileSync(new URL('../src/rec/rec.jsx', import.meta.url), 'utf8')

  assert.match(recommendations, /orunei-pool-v3/)
  assert.match(recommendations, /START_DATE_DESC/)
  assert.match(recommendations, /10 \* 6e4/)
})

test('feeds the home hero with the latest live anime when available', () => {
  const hero = fs.readFileSync(new URL('../src/components/Hero.jsx', import.meta.url), 'utf8')

  assert.match(hero, /latest/)
  assert.match(hero, /currentSlides/)
  assert.match(hero, /currentTrending/)
})

test('bounds every live hero title before rendering it', () => {
  const hero = fs.readFileSync(new URL('../src/components/Hero.jsx', import.meta.url), 'utf8')

  assert.match(hero, /formatHeroTitle\(s\.title/)
  assert.match(hero, /line-clamp-2 h-\[80px\] shrink-0 overflow-hidden/)
  assert.match(hero, /line-clamp-2 h-\[48px\] overflow-hidden/)
})

test('renders the right-panel trends from the live recommendation pool', () => {
  const rightPanel = fs.readFileSync(new URL('../src/components/RightPanel.jsx', import.meta.url), 'utf8')
  const recommendations = fs.readFileSync(new URL('../src/rec/rec.jsx', import.meta.url), 'utf8')

  assert.match(rightPanel, /useRec/)
  assert.match(rightPanel, /liveTrends\.map/)
  assert.doesNotMatch(rightPanel, /import \{ trends \} from '\.\.\/data'/)
  assert.match(recommendations, /selectTrending\(pool\)/)
})

test('keeps only Anime and Noticias in the home filters', () => {
  const app = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')

  assert.match(app, /const tabs = \['Anime', 'Noticias'\]/)
  assert.match(app, /useState\('Anime'\)/)
})

test('removes the deprecated Descubrir item from the sidebar', () => {
  const sidebar = fs.readFileSync(new URL('../src/components/Sidebar.jsx', import.meta.url), 'utf8')

  assert.doesNotMatch(sidebar, /\['Descubrir', Search\]/)
  assert.match(sidebar, /const main = \[\['Para ti', Home\], \['Biblioteca', Library\]/)
})

test('does not remount the whole page shell when switching home tabs', () => {
  const app = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')

  assert.match(app, /<div key=\{page\} className="animate-page-enter space-y-7">/)
  assert.doesNotMatch(app, /key=\{`\$\{page\}:\$\{tab\}`\}/)
})

test('renders the news feed progressively to avoid a large tab-switch spike', () => {
  const newsPage = fs.readFileSync(new URL('../src/components/NewsPage.jsx', import.meta.url), 'utf8')

  assert.match(newsPage, /const PAGE_SIZE = 12/)
  assert.match(newsPage, /list\.slice\(0, visibleCount\)/)
  assert.match(newsPage, /Cargar más noticias/)
})
