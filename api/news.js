import { fetchAllFeeds } from '../src/api/newsParser.js'

let memoryCache = { items: [], timestamp: 0 }
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutos de caché en memoria

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // 1. Servir desde caché en memoria si está fresca
  const now = Date.now()
  if (memoryCache.items.length > 0 && now - memoryCache.timestamp < CACHE_TTL_MS) {
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    res.setHeader('Content-Type', 'application/json')
    return res.status(200).json({ status: 'ok', items: memoryCache.items, cached: true })
  }

  try {
    const items = await fetchAllFeeds()
    if (items.length > 0) {
      memoryCache = { items, timestamp: now }
    }

    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    res.setHeader('Content-Type', 'application/json')
    return res.status(200).json({ status: 'ok', items: items.length > 0 ? items : memoryCache.items })
  } catch (error) {
    if (memoryCache.items.length > 0) {
      res.setHeader('Content-Type', 'application/json')
      return res.status(200).json({ status: 'ok', items: memoryCache.items, stale: true })
    }
    res.setHeader('Content-Type', 'application/json')
    return res.status(500).json({ status: 'error', message: error.message || 'Error cargando noticias' })
  }
}
