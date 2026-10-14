import { buildTasteProfile, profileSignature, recommend, dot, norm, clamp, label } from './engine.js'

const ids = (value) => Array.isArray(value) ? [...new Set(value.map((id) => String(id)))] : []

export function migrateTasteState(raw = {}) {
  return {
    version: 3,
    liked: Array.isArray(raw.liked) ? [...new Set(raw.liked)] : [],
    hidden: Array.isArray(raw.hidden) ? [...new Set(raw.hidden)] : [],
    news: Array.isArray(raw.news) ? [...new Set(raw.news)] : [],
  }
}

export function buildRecommendationState({ entries = [], explicitState = {}, pool = [], now = Date.now(), year = new Date().getFullYear() } = {}) {
  const safePool = Array.isArray(pool) ? pool : []
  const libraryEntries = Array.isArray(entries) ? entries : []
  const likedIds = ids(explicitState.likedIds || explicitState.liked)
  const hiddenIds = ids(explicitState.hiddenIds || explicitState.hidden)
  const explicitLikedItems = explicitState.likedItems || safePool.filter((item) => likedIds.includes(String(item.id)))
  const hiddenItems = explicitState.hiddenItems || safePool.filter((item) => hiddenIds.includes(String(item.id)))

  // 1. Anclas de gusto (obras favoritas o completadas que sirven de punto de comparación)
  const libraryAnchors = safePool.filter((item) =>
    libraryEntries.some((e) =>
      (e.favorite || e.status === 'completed' || e.status === 'watching') &&
      (String(e.id) === String(item.id) || (e.t && item.alts?.includes(String(e.t).toLowerCase())))
    )
  )
  const allLiked = [...new Map([...explicitLikedItems, ...libraryAnchors].map((it) => [it.id, it])).values()]

  const profile = buildTasteProfile(entries, { likedItems: explicitLikedItems, hiddenItems }, now)
  const exclude = new Set([
    ...libraryEntries.map((entry) => String(entry?.id ?? entry?.q ?? '')),
    ...likedIds,
    ...hiddenIds,
  ].filter(Boolean))

  const excludeNumeric = new Set([...exclude].map((id) => Number.isNaN(Number(id)) ? id : Number(id)))

  // 2. Recomendaciones principales equilibradas con MMR
  const recs = recommend(safePool, profile, {
    exclude: excludeNumeric,
    liked: allLiked.length ? allLiked : explicitLikedItems,
    n: 18,
    year,
  })

  // Ancla principal para el encabezado "Porque te gusta [X]"
  const anchorItem = allLiked.find((a) => libraryEntries.some((e) => e.favorite && (String(e.id) === String(a.id) || (e.t && a.alts?.includes(String(e.t).toLowerCase())))))
    || allLiked.at(-1)
  const anchor = anchorItem?.title || ''

  // 3. Candidatos disponibles fuera de exclusiones
  const availableCandidates = safePool.filter((i) => !excludeNumeric.has(i.id))
  const wn = norm(profile.w) || 1
  const isPersonalized = libraryEntries.length > 0

  // 4. Afinidad directa (Cerca de tus gustos)
  const scoredByAffinity = availableCandidates.map((i) => {
    const sim = wn > 1e-6 ? dot(profile.w, i.v) / (wn * (norm(i.v) || 1)) : 0
    const q = clamp(((i.score || 0) - 60) / 35)
    const affScore = isPersonalized ? 0.70 * sim + 0.30 * q : q
    return { ...i, sim, q, affScore }
  })

  const affinityRecs = scoredByAffinity
    .filter((i) => isPersonalized ? i.sim > 0.05 : true)
    .sort((a, b) => b.affScore - a.affScore)
    .slice(0, 12)
    .map((i) => {
      let near = null, ns = 0.18
      allLiked.forEach((l) => { const c = dot(i.v, l.v); if (c > ns) { ns = c; near = l } })
      const matchedGenres = Object.keys(i.v || {}).filter((k) => k.startsWith('g:') && (profile.w[k] || 0) > 0.25).map(label)
      const reasonKey = near ? 'similar_to' : matchedGenres.length ? 'matches_taste' : 'affinity'
      const reasonData = near ? { title: near.title } : matchedGenres.length ? { genres: matchedGenres.slice(0, 2) } : {}
      const reason = near ? `Porque te gusta ${near.title}` : matchedGenres.length ? `Coincide con tus gustos de ${matchedGenres.slice(0, 2).join(' y ')}` : 'Alta afinidad con tu perfil'
      return { ...i, reasonKey, reasonData, reason }
    })

  // 5. Tendencias compatibles
  const trendingRecs = availableCandidates
    .filter((i) => Number(i.trend) > 0)
    .map((i) => {
      const sim = wn > 1e-6 ? dot(profile.w, i.v) / (wn * (norm(i.v) || 1)) : 0
      const q = clamp(((i.score || 0) - 60) / 35)
      const tNorm = clamp(Math.log10(1 + Math.max(0, i.trend)) / 2.2)
      const trendScore = isPersonalized ? 0.60 * tNorm + 0.25 * Math.max(0, sim) + 0.15 * q : tNorm * 0.7 + q * 0.3
      return { ...i, trendScore }
    })
    .sort((a, b) => b.trendScore - a.trendScore)
    .slice(0, 12)
    .map((i) => ({
      ...i,
      reasonKey: 'trending',
      reasonData: {},
      reason: 'En tendencia y con gran seguimiento actual',
    }))

  // 6. Descubrimiento / Exploración (obras de calidad alta fuera de su cluster habitual)
  const exploreRecs = availableCandidates
    .map((i) => {
      let cov = 0
      for (const k in i.v) if (Math.abs(profile.w[k] || 0) > 0.25) cov += i.v[k] ** 2
      const q = clamp(((i.score || 0) - 60) / 35)
      const exploreScore = isPersonalized ? 0.65 * q + 0.35 * (1 - clamp(cov)) : q * 0.6 + ((i.pop || 0) > 5000 ? 0.4 : 0.2)
      return { ...i, cov, q, exploreScore }
    })
    .filter((i) => isPersonalized ? i.cov < 0.45 && i.q > 0.4 : i.q > 0.5)
    .sort((a, b) => b.exploreScore - a.exploreScore)
    .slice(0, 12)
    .map((i) => ({
      ...i,
      reasonKey: 'explore',
      reasonData: {},
      reason: 'Joya recomendada para descubrir algo nuevo',
    }))

  return {
    profile,
    signature: profileSignature(entries),
    exclude,
    anchor,
    recs,
    affinityRecs: affinityRecs.length ? affinityRecs : recs.filter((item) => ['similar_to', 'matches_taste'].includes(item.reasonKey)),
    trendingRecs: trendingRecs.length ? trendingRecs : recs.filter((item) => item.trend > 0 && item.reasonKey !== 'explore').slice(0, 6),
    exploreRecs: exploreRecs.length ? exploreRecs : recs.filter((item) => item.reasonKey === 'explore'),
    personalized: isPersonalized,
    coldStart: !isPersonalized,
  }
}
