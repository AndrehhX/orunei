import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { toItem, vectorize, update, recommend, topGenres, label, dot, norm, librarySignal, selectLatest } from './engine'

const KEY = 'orunei-taste-v2', POOL = 'orunei-pool-v2'
const F = 'id title{romaji english} coverImage{extraLarge} bannerImage description(asHtml:false) genres tags{name rank isGeneralSpoiler} studios(isMain:true){nodes{name}} averageScore popularity trending seasonYear format'
const pg = (a, page, sort) => `${a}: Page(page:${page}, perPage:30){ media(type:ANIME, sort:${sort}, isAdult:false){ ${F} } }`
const QUERY = `query { ${pg('a', 1, 'POPULARITY_DESC')} ${pg('b', 1, 'TRENDING_DESC')} ${pg('c', 1, 'SCORE_DESC')} ${pg('d', 2, 'POPULARITY_DESC')} ${pg('e', 1, 'START_DATE_DESC')} }`
const Ctx = createContext({ ready: false, recs: [], latest: [], topGenres: [], count: 0, anchor: '', isNewsLiked: () => false, like() {}, dismiss() {}, likeMedia() {}, isLiked: () => false, likeNews() {}, addByQuery() {}, syncLibrary() {}, affinity: () => null })
export const useRec = () => useContext(Ctx)

async function loadPool(force = false) {
  if (!force) {
    try { const c = JSON.parse(sessionStorage.getItem(POOL)); if (c && Date.now() - c.at < 10 * 6e4) return c.items } catch {}
  }
  const r = await fetch('https://graphql.anilist.co', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: QUERY }) })
  const { data } = await r.json()
  const seen = new Set()
  const raw = Object.values(data).flatMap((p) => p.media).filter((m) => m && !seen.has(m.id) && seen.add(m.id) && (m.genres || []).length)
  const items = vectorize(raw.map(toItem))
  try { sessionStorage.setItem(POOL, JSON.stringify({ at: Date.now(), items })) } catch {}
  return items
}

const empty = { p: { w: {}, t: 0, n: 0 }, liked: [], hidden: [], news: [], librarySignature: '' }

export function RecProvider({ children }) {
  const [pool, setPool] = useState([])
  const [st, setSt] = useState(() => { try { return { ...empty, ...JSON.parse(localStorage.getItem(KEY)) } } catch { return empty } })
  const [toast, setToast] = useState(null)
  const ref = useRef(st); ref.current = st
  const timer = useRef()

  useEffect(() => {
    let active = true
    const refresh = (force = false) => loadPool(force).then((items) => { if (active) setPool(items) }).catch(() => {})
    refresh()
    const id = setInterval(() => refresh(true), 10 * 6e4)
    return () => { active = false; clearInterval(id) }
  }, [])
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(st)) } catch {} }, [st])

  const say = (d, action) => {
    const ks = Object.entries(d).filter(([k]) => /^[gt]:/.test(k)).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 3)
    const pos = AWpos(action)
    if (!ks.length) return
    setToast({ id: Date.now(), text: `${pos ? 'Aprendimos que te gusta' : 'Verás menos de'}: ${ks.map(([k]) => label(k)).join(' · ')}` })
    clearTimeout(timer.current); timer.current = setTimeout(() => setToast(null), 2800)
  }
  const AWpos = (a) => !/^(dismiss|dislike|unlike|unadd|unnews)$/.test(a)

  const apply = useCallback((item, action, extra = {}, quiet) => {
    const cur = ref.current
    const { p, d } = update(cur.p, item, action)
    setSt({ ...cur, ...extra, p })
    if (!quiet) say(d, action)
  }, [])

  const byId = useMemo(() => new Map(pool.map((i) => [i.id, i])), [pool])
  const find = (q) => { q = q.toLowerCase(); return pool.find((i) => i.alts.some((a) => a.startsWith(q) || a.includes(q))) }

  const like = (id) => { const it = byId.get(id); if (!it) return; apply(it, 'like', { liked: [...ref.current.liked.filter((x) => x !== id), id] }) }
  const dismiss = (id) => { const it = byId.get(id); if (!it) return; apply(it, 'dismiss', { hidden: [...ref.current.hidden, id] }) }
  const addByQuery = (q, on) => {
    const it = find(q); if (!it) return
    const cur = ref.current, has = cur.liked.includes(it.id)
    if (on && !has) apply(it, 'add', { liked: [...cur.liked, it.id] })
    if (!on && has) apply(it, 'unadd', { liked: cur.liked.filter((x) => x !== it.id) })
  }
  const syncLibrary = useCallback((entries = []) => {
    if (!pool.length) return
    const rows = Array.isArray(entries) ? entries : []
    const signature = rows.map((entry) => `${entry.id}:${entry.status}:${entry.favorite ? '1' : '0'}`).join('|')
    const cur = ref.current
    if (cur.librarySignature === signature) return
    let p = cur.p
    const liked = [...cur.liked]
    rows.forEach((entry) => {
      const query = String(entry.q || entry.t || '').toLowerCase()
      const item = pool.find((candidate) => String(candidate.id) === String(entry.id) || candidate.alts.some((alt) => alt === query || alt.includes(query)))
      if (item && !liked.includes(item.id)) {
        const action = librarySignal(entry)
        p = update(p, item, action).p
        if (action !== 'click') liked.push(item.id)
      }
    })
    setSt({ ...cur, p, liked, librarySignature: signature })
  }, [pool])
  // Like any anime from the catalogue (even outside the candidate pool): build its vector on the fly.
  const likeMedia = (m) => {
    const cur = ref.current, has = cur.liked.includes(m.id)
    const base = toItem({ ...m, tags: (m.tags || []).filter((t) => !t.isMediaSpoiler) })
    const v = byId.get(m.id)?.v || vectorize([base])[0].v
    apply({ ...base, v }, has ? 'unlike' : 'like', { liked: has ? cur.liked.filter((x) => x !== m.id) : [...cur.liked, m.id] })
  }
  const likeNews = (n) => { // a liked post nudges the taste toward any anime it mentions
    const cur = ref.current, on = !cur.news.includes(n.id)
    const text = n.t.toLowerCase()
    const hits = pool.filter((i) => i.alts.some((a) => a.length > 4 && text.includes(a))).slice(0, 2)
    let p = cur.p, d = {}
    hits.forEach((h) => { const r = update(p, h, on ? 'news' : 'unnews'); p = r.p; Object.assign(d, r.d) })
    setSt({ ...cur, p, news: on ? [...cur.news, n.id] : cur.news.filter((x) => x !== n.id) })
    if (hits.length) say(d, on ? 'news' : 'unnews')
    else if (on) { setToast({ id: Date.now(), text: 'Guardado en tus noticias favoritas' }); clearTimeout(timer.current); timer.current = setTimeout(() => setToast(null), 2200) }
  }

  const likedItems = useMemo(() => st.liked.map((id) => byId.get(id)).filter(Boolean), [st.liked, byId])
  const recs = useMemo(() => pool.length ? recommend(pool, st.p, { exclude: new Set([...st.liked, ...st.hidden]), liked: likedItems, n: 8 }) : [], [pool, st, likedItems])
  const genres = useMemo(() => topGenres(st.p), [st.p])
  // How well another taste (a set of genres) matches this user's profile, 0..1
  const affinity = (gs) => {
    if (!st.p.n) return null
    const v = {}; gs.forEach((g) => (v['g:' + g] = 1 / Math.sqrt(gs.length)))
    const wn = norm(st.p.w) || 1
    return Math.max(0, Math.min(1, dot(st.p.w, v) / wn))
  }

  const latest = useMemo(() => selectLatest(pool), [pool])
  const value = { ready: pool.length > 0, recs, latest, topGenres: genres, count: st.liked.length, anchor: likedItems.at(-1)?.title || '', like, dismiss, likeNews, likeMedia, isLiked: (id) => st.liked.includes(id), addByQuery, syncLibrary, affinity, isNewsLiked: (id) => st.news.includes(id) }
  return (
    <Ctx.Provider value={value}>
      {children}
      {toast && <div key={toast.id} className="pointer-events-none fixed bottom-6 right-6 z-50 animate-rise rounded-xl bg-slate-900/95 px-4 py-3 text-sm font-medium text-white shadow-2xl backdrop-blur dark:bg-white dark:text-slate-900">✨ {toast.text}</div>}
    </Ctx.Provider>
  )
}
