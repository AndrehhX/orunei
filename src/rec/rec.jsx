import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { toItem, vectorize, update, label, dot, norm, selectLatest, selectTrending } from './engine'
import { buildRecommendationState, migrateTasteState } from './providerModel.js'
import { loadRecommendationPool } from './pool.js'

const KEY = 'orunei-taste-v3', LEGACY_KEY = 'orunei-taste-v2'
const Ctx = createContext({ ready: false, recs: [], affinityRecs: [], trendingRecs: [], exploreRecs: [], latest: [], trends: [], topGenres: [], count: 0, anchor: '', personalized: false, coldStart: true, isNewsLiked: () => false, like() {}, dismiss() {}, likeMedia() {}, isLiked: () => false, likeNews() {}, addByQuery() {}, syncLibrary() {}, affinity: () => null })
export const useRec = () => useContext(Ctx)

const empty = { version: 3, p: { w: {}, t: 0, n: 0 }, liked: [], hidden: [], news: [], library: [], librarySignature: '' }

export function RecProvider({ children }) {
  const [pool, setPool] = useState([])
  const [st, setSt] = useState(() => {
    try {
      const current = JSON.parse(localStorage.getItem(KEY) || 'null') || JSON.parse(localStorage.getItem(LEGACY_KEY) || 'null') || {}
      return { ...empty, ...current, ...migrateTasteState(current), version: 3, library: Array.isArray(current.library) ? current.library : [] }
    } catch { return empty }
  })
  const [toast, setToast] = useState(null)
  const ref = useRef(st); ref.current = st
  const timer = useRef()

  useEffect(() => {
    let active = true
    const refresh = (force = false) => loadRecommendationPool({ force, library: ref.current.library }).then((items) => { if (active) setPool(items) }).catch(() => {})
    refresh(Boolean(st.librarySignature))
    const id = setInterval(() => refresh(true), 10 * 6e4)
    return () => { active = false; clearInterval(id) }
  }, [st.librarySignature])
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

  const byId = useMemo(() => new Map(pool.map((i) => [String(i.id), i])), [pool])
  const find = (q) => { q = q.toLowerCase(); return pool.find((i) => i.alts.some((a) => a.startsWith(q) || a.includes(q))) }

  const like = (id) => { const it = byId.get(String(id)); if (!it) return; apply(it, 'like', { liked: [...ref.current.liked.filter((x) => String(x) !== String(id)), id] }) }
  const dismiss = (id) => { const it = byId.get(String(id)); if (!it) return; apply(it, 'dismiss', { hidden: [...ref.current.hidden.filter((x) => String(x) !== String(id)), id] }) }
  const addByQuery = (q, on) => {
    const it = find(q); if (!it) return
    const cur = ref.current, has = cur.liked.some((id) => String(id) === String(it.id))
    if (on && !has) apply(it, 'add', { liked: [...cur.liked, it.id] })
    if (!on && has) apply(it, 'unadd', { liked: cur.liked.filter((id) => String(id) !== String(it.id)) })
  }
  const syncLibrary = useCallback((entries = []) => {
    const rows = Array.isArray(entries) ? entries : []
    const cur = ref.current
    const likedItems = pool.filter((item) => cur.liked.some((id) => String(id) === String(item.id)))
    const hiddenItems = pool.filter((item) => cur.hidden.some((id) => String(id) === String(item.id)))
    const derived = buildRecommendationState({ entries: rows, explicitState: { likedIds: cur.liked, hiddenIds: cur.hidden, likedItems, hiddenItems }, pool })
    if (cur.librarySignature === derived.signature && cur.library.length === rows.length) return
    setSt({ ...cur, p: derived.profile, library: rows, librarySignature: derived.signature })
  }, [pool])
  // Like any anime from the catalogue (even outside the candidate pool): build its vector on the fly.
  const likeMedia = (m) => {
    const cur = ref.current, has = cur.liked.some((id) => String(id) === String(m.id))
    const base = toItem({ ...m, tags: (m.tags || []).filter((t) => !t.isMediaSpoiler) })
    const v = byId.get(String(m.id))?.v || vectorize([base])[0].v
    apply({ ...base, v }, has ? 'unlike' : 'like', { liked: has ? cur.liked.filter((id) => String(id) !== String(m.id)) : [...cur.liked, m.id] })
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

  const recommendationState = useMemo(() => buildRecommendationState({
    entries: st.library,
    explicitState: { likedIds: st.liked, hiddenIds: st.hidden },
    pool,
  }), [pool, st.library, st.liked, st.hidden])
  const likedItems = useMemo(() => pool.filter((item) => st.liked.some((id) => String(id) === String(item.id))), [st.liked, pool])
  const recs = recommendationState.recs
  const genres = useMemo(() => Object.entries(recommendationState.profile.w).filter(([key, value]) => key.startsWith('g:') && value > 0.05).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([key, value], _, rows) => ({ name: label(key), pct: Math.round((value / (rows[0]?.[1] || 1)) * 100) })), [recommendationState.profile])
  // How well another taste (a set of genres) matches this user's profile, 0..1
  const affinity = (gs) => {
    if (!recommendationState.profile.n) return null
    const v = {}; gs.forEach((g) => (v['g:' + g] = 1 / Math.sqrt(gs.length)))
    const wn = norm(recommendationState.profile.w) || 1
    return Math.max(0, Math.min(1, dot(recommendationState.profile.w, v) / wn))
  }

  const latest = useMemo(() => selectLatest(pool), [pool])
  const trends = useMemo(() => selectTrending(pool), [pool])
  const value = { ready: pool.length > 0, recs, affinityRecs: recommendationState.affinityRecs, trendingRecs: recommendationState.trendingRecs, exploreRecs: recommendationState.exploreRecs, latest, trends, topGenres: genres, count: st.liked.length, anchor: recommendationState.anchor || likedItems.at(-1)?.title || '', personalized: recommendationState.personalized, coldStart: recommendationState.coldStart, like, dismiss, likeNews, likeMedia, isLiked: (id) => st.liked.some((value) => String(value) === String(id)), addByQuery, syncLibrary, affinity, isNewsLiked: (id) => st.news.includes(id) }
  return (
    <Ctx.Provider value={value}>
      {children}
      {toast && <div key={toast.id} className="pointer-events-none fixed bottom-6 right-6 z-50 animate-rise rounded-xl bg-slate-900/95 px-4 py-3 text-sm font-medium text-white shadow-2xl backdrop-blur dark:bg-white dark:text-slate-900">✨ {toast.text}</div>}
    </Ctx.Provider>
  )
}
