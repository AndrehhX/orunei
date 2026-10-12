import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { news as mockNews, featured as mockFeatured } from './data'

// Public RSS feeds, converted to JSON (CORS-friendly, no API key) by rss2json.
export const FEEDS = [
  { name: 'Anime News Network', url: 'https://www.animenewsnetwork.com/all/rss.xml', grad: 'linear-gradient(135deg,#2a3a6a,#6d5cff)' },
  { name: 'Crunchyroll', url: 'https://cr-news-api-service.prd.crunchyrollsvc.com/v1/en-US/rss', grad: 'linear-gradient(135deg,#f08a3a,#3a2a22)' },
  { name: 'MyAnimeList', url: 'https://myanimelist.net/rss/news.xml', grad: 'linear-gradient(135deg,#1b3a6a,#7fb6e6)' },
]
const API = 'https://api.rss2json.com/v1/api.json?rss_url='
const KEY = 'orunei-news-v1', TTL = 10 * 60 * 1000

const ENT = { '&amp;': '&', '&quot;': '"', '&#39;': "'", '&#039;': "'", '&nbsp;': ' ', '&lt;': '<', '&gt;': '>' }
const strip = (h = '') => h.replace(/<[^>]*>/g, ' ').replace(/&[#\w]+;/g, (m) => ENT[m] ?? ' ').replace(/\s+/g, ' ').trim()
const firstImg = (h = '') => (h.match(/<img[^>]+src=["']([^"']+)/i) || [])[1]

export function timeAgo(ts) {
  const m = Math.max(1, Math.round((Date.now() - ts) / 60000))
  if (m < 60) return `hace ${m} min`
  if (m < 1440) return `hace ${Math.round(m / 60)} h`
  return `hace ${Math.round(m / 1440)} d`
}

async function loadFeed(feed) {
  const r = await fetch(API + encodeURIComponent(feed.url))
  const j = await r.json()
  if (j.status !== 'ok') throw new Error(j.message || 'feed error')
  return j.items.map((it) => {
    const ts = new Date(String(it.pubDate).replace(' ', 'T') + 'Z').getTime() || Date.now()
    const enc = it.enclosure?.link && (it.enclosure.type || '').startsWith('image') ? it.enclosure.link : ''
    return { id: it.link, t: strip(it.title), d: strip(it.description || it.content).slice(0, 170), s: feed.name, ts,
      img: it.thumbnail || enc || firstImg(it.content || it.description) || '', link: it.link, grad: feed.grad }
  })
}

// Demo content (shown if the live feeds can't be reached).
const demo = [...mockNews, ...mockFeatured].map((n) => ({ ...n, id: n.t, d: n.d || '', img: '', link: '', ts: 0 }))

const Ctx = createContext({ items: [], status: 'loading', reload() {} })
export const useNews = () => useContext(Ctx)

export function NewsProvider({ children }) {
  const [state, setState] = useState({ items: [], status: 'loading' })
  const load = useCallback(async (force) => {
    if (!force) {
      try { const c = JSON.parse(sessionStorage.getItem(KEY)); if (c && Date.now() - c.at < TTL) return setState({ items: c.items, status: 'ok' }) } catch {}
    }
    setState((s) => ({ ...s, status: 'loading' }))
    const res = await Promise.allSettled(FEEDS.map(loadFeed))
    const seen = new Set()
    const items = res.flatMap((r) => (r.status === 'fulfilled' ? r.value : [])).filter((n) => n.t && !seen.has(n.id) && seen.add(n.id)).sort((a, b) => b.ts - a.ts)
    if (!items.length) return setState({ items: demo, status: 'error' })
    try { sessionStorage.setItem(KEY, JSON.stringify({ at: Date.now(), items })) } catch {}
    setState({ items, status: 'ok' })
  }, [])
  useEffect(() => { load() }, [load])
  const items = state.items.map((n) => ({ ...n, h: n.ts ? timeAgo(n.ts) : n.h }))
  return <Ctx.Provider value={{ items, status: state.status, reload: () => load(true) }}>{children}</Ctx.Provider>
}

export const NewsLink = ({ n, ...p }) => n.link ? <a href={n.link} target="_blank" rel="noopener noreferrer" {...p} /> : <div {...p} />
