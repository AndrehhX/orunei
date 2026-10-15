import { buildNewsImageFallback } from '../newsImages.js'

export const FEEDS = [
  {
    name: 'Crunchyroll',
    url: 'https://cr-news-api-service.prd.crunchyrollsvc.com/v1/es-ES/rss',
    grad: 'linear-gradient(135deg,#f08a3a,#3a2a22)'
  },
  {
    name: 'Crunchyroll News',
    url: 'https://cr-news-api-service.prd.crunchyrollsvc.com/v1/en-US/rss',
    grad: 'linear-gradient(135deg,#f08a3a,#3a2a22)'
  },
  {
    name: 'Anime News Network',
    url: 'https://www.animenewsnetwork.com/all/rss.xml',
    grad: 'linear-gradient(135deg,#2a3a6a,#6d5cff)'
  },
  {
    name: 'MyAnimeList',
    url: 'https://myanimelist.net/rss/news.xml',
    grad: 'linear-gradient(135deg,#1b3a6a,#7fb6e6)'
  }
]

const ENT = {
  '&amp;': '&',
  '&quot;': '"',
  '&#39;': "'",
  '&#039;': "'",
  '&nbsp;': ' ',
  '&lt;': '<',
  '&gt;': '>',
  '&hellip;': '…',
  '&#8211;': '–',
  '&#8212;': '—',
  '&#8216;': '‘',
  '&#8217;': '’',
  '&#8220;': '“',
  '&#8221;': '”'
}

export function cleanText(str = '') {
  return str
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[#\w]+;/g, (m) => ENT[m] ?? ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractTag(xml, tag) {
  const cdataRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i')
  const cdataMatch = xml.match(cdataRegex)
  if (cdataMatch) return cdataMatch[1].trim()

  const plainRegex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const plainMatch = xml.match(plainRegex)
  if (plainMatch) return plainMatch[1].trim()

  return ''
}

function extractAttr(xml, tag, attr) {
  const regex = new RegExp(`<${tag}[^>]+${attr}=["']([^"']+)["']`, 'i')
  const match = xml.match(regex)
  return match ? match[1] : ''
}

export function parseRssFeed(xmlText, feedName, grad) {
  const items = []
  const itemMatches = xmlText.match(/<item[\s\S]*?<\/item>/gi) || []

  for (const itemXml of itemMatches) {
    const rawTitle = extractTag(itemXml, 'title')
    const link = extractTag(itemXml, 'link') || extractTag(itemXml, 'guid')
    const desc = extractTag(itemXml, 'description') || extractTag(itemXml, 'content:encoded')
    const pubDate = extractTag(itemXml, 'pubDate')

    let img = extractAttr(itemXml, 'media:thumbnail', 'url') ||
              extractAttr(itemXml, 'enclosure', 'url') ||
              extractAttr(itemXml, 'media:content', 'url')

    if (!img) {
      const thumbTag = extractTag(itemXml, 'media:thumbnail')
      if (thumbTag && thumbTag.startsWith('http')) {
        img = thumbTag
      }
    }

    if (!img) {
      const imgMatch = (extractTag(itemXml, 'content:encoded') || desc).match(/<img[^>]+src=["']([^"']+)["']/i)
      if (imgMatch) img = imgMatch[1]
    }

    const t = cleanText(rawTitle)
    const d = cleanText(desc).slice(0, 180)
    const ts = pubDate ? new Date(pubDate).getTime() || Date.now() : Date.now()

    if (t && link) {
      items.push({
        id: link,
        t,
        d,
        s: feedName,
        ts,
        img: img || buildNewsImageFallback(link),
        link,
        grad
      })
    }
  }

  return items
}

export async function fetchAllFeeds() {
  const res = await Promise.allSettled(
    FEEDS.map(async (feed) => {
      const r = await fetch(feed.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8'
        }
      })
      if (!r.ok) throw new Error(`Feed HTTP ${r.status}`)
      const xml = await r.text()
      return parseRssFeed(xml, feed.name, feed.grad)
    })
  )

  const seen = new Set()
  return res
    .flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
    .filter((n) => n.t && !seen.has(n.id) && seen.add(n.id))
    .sort((a, b) => b.ts - a.ts)
}
