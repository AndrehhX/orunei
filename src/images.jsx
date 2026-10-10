import { createContext, useContext, useEffect, useState } from 'react'
import { hero, trending, library, because, trends, featured, news } from './data'

const Ctx = createContext({})
export const useImages = () => useContext(Ctx)

const queries = [...new Set([hero, trending, ...library, ...because, ...trends, ...featured, ...news].map((x) => x.q).filter(Boolean))]
const KEY = 'orunei-covers-v1'

// One GraphQL request (aliased) to the public AniList API: no key needed.
async function load() {
  const body = queries.map((q, i) => `q${i}: Media(search: ${JSON.stringify(q)}, type: ANIME, sort: POPULARITY_DESC) { coverImage { extraLarge } bannerImage }`).join('\n')
  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: `query { ${body} }` }),
  })
  const { data } = await res.json()
  const map = {}
  queries.forEach((q, i) => { const m = data?.[`q${i}`]; if (m) map[q] = { cover: m.coverImage?.extraLarge, banner: m.bannerImage } })
  return map
}

export function ImagesProvider({ children }) {
  const [map, setMap] = useState(() => { try { return JSON.parse(sessionStorage.getItem(KEY)) || {} } catch { return {} } })
  useEffect(() => {
    if (Object.keys(map).length) return
    load().then((m) => { setMap(m); try { sessionStorage.setItem(KEY, JSON.stringify(m)) } catch {} }).catch(() => {})
  }, [])
  return <Ctx.Provider value={map}>{children}</Ctx.Provider>
}
