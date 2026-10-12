// Taste engine: content-based + implicit feedback + time decay + diversity + exploration.
const HALF = 45 * 864e5 // taste half-life: 45 days
// Signal strengths (positive = pulls profile toward an item, negative = pushes away). "un*" reverses a signal.
export const AW = { like: 1, add: 1.6, click: 0.15, dismiss: -0.6, dislike: -1.2, news: 0.6, unlike: -1, unadd: -1.6, unnews: -0.6 }

export const dot = (a, b) => { let s = 0; for (const k in a) if (b[k]) s += a[k] * b[k]; return s }
export const norm = (a) => Math.sqrt(dot(a, a))

// AniList media -> item with sparse feature map: genres, weighted tags, studio, format, decade.
export function toItem(m) {
  const f = {}
  ;(m.genres || []).forEach((g) => (f['g:' + g] = 1))
  ;(m.tags || []).filter((t) => !t.isGeneralSpoiler && t.rank >= 45).slice(0, 8).forEach((t) => (f['t:' + t.name] = (0.8 * t.rank) / 100))
  const st = m.studios?.nodes?.[0]?.name
  if (st) f['s:' + st] = 0.5
  if (m.format) f['f:' + m.format] = 0.3
  if (m.seasonYear) f['d:' + Math.floor(m.seasonYear / 10) * 10] = 0.25
  const title = m.title.english || m.title.romaji
  return { id: m.id, title, alts: [m.title.romaji, m.title.english].filter(Boolean).map((x) => x.toLowerCase()),
    img: m.coverImage?.extraLarge, banner: m.bannerImage, year: m.seasonYear, score: m.averageScore || 0,
    pop: m.popularity || 0, trend: m.trending || 0, f }
}

// TF-IDF weighting (rare features say more about taste), then L2-normalise every item vector.
export function vectorize(items) {
  const df = {}
  items.forEach((i) => Object.keys(i.f).forEach((k) => (df[k] = (df[k] || 0) + 1)))
  const N = items.length
  return items.map((i) => {
    const v = {}
    for (const k in i.f) v[k] = i.f[k] * (Math.log((N + 1) / (df[k] + 1)) + 1)
    const n = norm(v) || 1
    for (const k in v) v[k] /= n
    return { ...i, v }
  })
}

// Online update: decay old taste, then move the profile along the item's vector. Returns the new profile + per-feature delta.
export function update(p, item, action, now = Date.now()) {
  const decay = 0.5 ** ((now - (p.t || now)) / HALF)
  const w = {}
  for (const k in p.w) { const v = p.w[k] * decay; if (Math.abs(v) > 0.01) w[k] = v }
  const a = AW[action], d = {}
  for (const k in item.v) {
    const old = w[k] || 0, nv = Math.max(-3, Math.min(6, old + a * item.v[k] * 3))
    d[k] = nv - old; w[k] = nv
  }
  return { p: { ...p, w, t: now, n: Math.max(0, (p.n || 0) + a) }, d }
}

// Rank candidates: cosine(profile, item) blended with quality/trend/popularity/freshness (profile weight grows with confidence),
// then MMR re-ranking for diversity and one "explore" slot for things outside the known taste.
export function recommend(pool, p, { exclude, liked = [], n = 8, year = new Date().getFullYear() }) {
  const wn = norm(p.w) || 1
  const conf = 1 - Math.exp(-Math.max(0, p.n || 0) / 4)
  const cand = pool.filter((i) => !exclude.has(i.id)).map((i) => {
    const sim = wn > 1e-6 ? dot(p.w, i.v) / wn : 0
    let cov = 0
    for (const k in i.v) if (Math.abs(p.w[k] || 0) > 0.25) cov += i.v[k] ** 2
    const q = Math.max(0, Math.min(1, (i.score - 60) / 35))
    const tr = Math.min(1, Math.log10(1 + i.trend) / 2.2), pp = Math.min(1, Math.log10(1 + i.pop) / 5.5)
    const fr = Math.exp(-(year - (i.year || year)) / 8)
    return { ...i, s: conf * 0.7 * sim + 0.18 * q + 0.07 * tr + 0.05 * pp + 0.05 * fr, cov, q }
  })
  const explore = conf > 0.3 ? cand.filter((i) => i.cov < 0.35 && i.q > 0.55).sort((a, b) => b.s - a.s)[0] : null
  const out = []
  const left = cand.filter((i) => i !== explore)
  while (out.length < n - (explore ? 1 : 0) && left.length) {
    let best = 0, bs = -9
    left.forEach((i, x) => {
      const red = out.reduce((m, o) => Math.max(m, dot(i.v, o.v)), 0)
      const mmr = 0.75 * i.s - 0.25 * red
      if (mmr > bs) { bs = mmr; best = x }
    })
    out.push(left.splice(best, 1)[0])
  }
  if (explore) out.splice(Math.min(3, out.length), 0, { ...explore, explore: true })
  return out.map((i) => {
    let near = null, ns = 0.15
    liked.forEach((l) => { const c = dot(i.v, l.v); if (c > ns) { ns = c; near = l } })
    return { ...i, reason: i.explore ? 'Algo nuevo que podría gustarte' : near ? `Porque te gusta ${near.title}` : 'Popular y muy bien valorado' }
  })
}

export const label = (k) => k.slice(2)
export const topGenres = (p, n = 5) => {
  const e = Object.entries(p.w).filter(([k, v]) => k.startsWith('g:') && v > 0.05).sort((a, b) => b[1] - a[1]).slice(0, n)
  const max = e[0]?.[1] || 1
  return e.map(([k, v]) => ({ name: label(k), pct: Math.round((v / max) * 100) }))
}
