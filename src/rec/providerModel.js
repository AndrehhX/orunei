import { buildTasteProfile, profileSignature, recommend } from './engine.js'

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
  const likedIds = ids(explicitState.likedIds || explicitState.liked)
  const hiddenIds = ids(explicitState.hiddenIds || explicitState.hidden)
  const likedItems = explicitState.likedItems || pool.filter((item) => likedIds.includes(String(item.id)))
  const hiddenItems = explicitState.hiddenItems || pool.filter((item) => hiddenIds.includes(String(item.id)))
  const profile = buildTasteProfile(entries, { likedItems, hiddenItems }, now)
  const exclude = new Set([
    ...(Array.isArray(entries) ? entries : []).map((entry) => String(entry?.id ?? entry?.q ?? '')),
    ...likedIds,
    ...hiddenIds,
  ].filter(Boolean))
  const recs = recommend(Array.isArray(pool) ? pool : [], profile, {
    exclude: new Set([...exclude].map((id) => Number.isNaN(Number(id)) ? id : Number(id))),
    liked: likedItems,
    n: 8,
    year,
  })
  return {
    profile,
    signature: profileSignature(entries),
    exclude,
    recs,
    affinityRecs: recs.filter((item) => ['similar_to', 'matches_taste'].includes(item.reasonKey)),
    trendingRecs: recs.filter((item) => item.trend > 0 && item.reasonKey !== 'explore').slice(0, 6),
    exploreRecs: recs.filter((item) => item.reasonKey === 'explore'),
    personalized: Array.isArray(entries) && entries.length > 0,
    coldStart: !Array.isArray(entries) || entries.length === 0,
  }
}
