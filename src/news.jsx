import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { buildNewsImageFallback, extractFeedImage } from './newsImages'
import { FEEDS, parseRssFeed } from './api/newsParser.js'

export { FEEDS }

const KEY = 'orunei-news-v1'
const TTL = 10 * 60 * 1000

const ENT = { '&amp;': '&', '&quot;': '"', '&#39;': "'", '&#039;': "'", '&nbsp;': ' ', '&lt;': '<', '&gt;': '>' }
const strip = (h = '') => h.replace(/<[^>]*>/g, ' ').replace(/&[#\w]+;/g, (m) => ENT[m] ?? ' ').replace(/\s+/g, ' ').trim()

export function timeAgo(ts) {
  const m = Math.max(1, Math.round((Date.now() - ts) / 60000))
  if (m < 60) return `hace ${m} min`
  if (m < 1440) return `hace ${Math.round(m / 60)} h`
  return `hace ${Math.round(m / 1440)} d`
}

export async function loadFeed(feed) {
  const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(feed.url)}`
  const r = await fetch(proxyUrl)
  if (!r.ok) throw new Error(`Feed error ${r.status}`)
  const xml = await r.text()
  return parseRssFeed(xml, feed.name, feed.grad)
}

const Ctx = createContext({ items: [], status: 'loading', reload() {} })
export const useNews = () => useContext(Ctx)

const withImageFallback = (item) => ({ ...item, img: item.img || buildNewsImageFallback(item.link) })

async function fetchNewsFromEndpoints() {
  const endpoints = [
    '/api/news',
    `${(typeof import.meta !== 'undefined' && import.meta.env?.VITE_STREAM_API_URL) || 'https://orunei-stream.thealex230820.workers.dev'}/api/news`
  ]

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined
      })
      if (res.ok) {
        const data = await res.json()
        if (data && Array.isArray(data.items) && data.items.length > 0) {
          return data.items
        }
      }
    } catch {
      // Intentar con el siguiente endpoint
    }
  }

  // Fallback con proxy CORS público para cada feed
  const feedResults = await Promise.allSettled(FEEDS.map(loadFeed))
  const seen = new Set()
  return feedResults
    .flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
    .filter((n) => n.t && !seen.has(n.id) && seen.add(n.id))
    .sort((a, b) => b.ts - a.ts)
}

export function NewsProvider({ children }) {
  const [state, setState] = useState({ items: [], status: 'loading' })
  const activeRequest = useRef(0)

  const load = useCallback(async (force) => {
    const requestId = ++activeRequest.current
    if (!force) {
      try {
        const c = JSON.parse(sessionStorage.getItem(KEY))
        if (c && Date.now() - c.at < TTL && Array.isArray(c.items) && c.items.length > 0) {
          if (requestId === activeRequest.current) {
            setState({ items: c.items.map(withImageFallback), status: 'ok' })
          }
          return
        }
      } catch {}
    }

    setState((s) => ({ ...s, status: 'loading' }))

    try {
      const items = await fetchNewsFromEndpoints()
      if (requestId !== activeRequest.current) return

      if (!items || !items.length) {
        return setState({ items: [], status: 'error' })
      }

      try {
        sessionStorage.setItem(KEY, JSON.stringify({ at: Date.now(), items }))
      } catch {}

      setState({ items: items.map(withImageFallback), status: 'ok' })
    } catch {
      if (requestId === activeRequest.current) {
        setState({ items: [], status: 'error' })
      }
    }
  }, [])

  useEffect(() => {
    load()
    return () => { activeRequest.current += 1 }
  }, [load])

  const items = useMemo(() => state.items.map((n) => ({ ...n, h: n.ts ? timeAgo(n.ts) : n.h })), [state.items])

  return <Ctx.Provider value={{ items, status: state.status, reload: () => load(true) }}>{children}</Ctx.Provider>
}

export const NewsLink = ({ n, ...p }) => n.link ? <a href={n.link} target="_blank" rel="noopener noreferrer" {...p} /> : <div {...p} />
