import { getProfileStats, TASTE_STATUSES } from './model.js'

const sectionForStatus = (status = '') => {
  const value = status.toLowerCase()
  if (value.startsWith('viendo')) return 'watching'
  if (value.startsWith('planeo')) return 'planned'
  if (value.startsWith('en pausa')) return 'paused'
  if (value.startsWith('terminado')) return 'completed'
  if (value.startsWith('favorito')) return 'favorites'
  return null
}

export function selectAnimeSections(library = []) {
  const sections = { watching: [], planned: [], paused: [], completed: [], favorites: [] }
  for (const item of Array.isArray(library) ? library : []) {
    const section = sectionForStatus(item?.s)
    if (section) sections[section].push(item)
    if (item?.favorite && !sections.favorites.includes(item)) sections.favorites.push(item)
  }
  return sections
}

export function selectProfileStats(library, tasteCount, profile) {
  return getProfileStats(library, tasteCount, profile)
}

export function selectTasteGenres(library = [], limit = 5) {
  const rows = (Array.isArray(library) ? library : []).filter((item) => {
    const status = String(item?.status || sectionForStatus(item?.s) || '').toLowerCase()
    return TASTE_STATUSES.includes(status)
  })
  const counts = new Map()
  rows.forEach((item) => {
    const uniqueGenres = [...new Set((Array.isArray(item?.genres) ? item.genres : []).map((genre) => String(genre).trim()).filter(Boolean))]
    uniqueGenres.forEach((genre) => counts.set(genre, (counts.get(genre) || 0) + 1))
  })
  const total = rows.length
  const max = Math.max(0, ...counts.values())
  return [...counts.entries()]
    .sort(([, aCount], [, bCount]) => bCount - aCount)
    .slice(0, limit)
    .map(([name, count]) => ({ name, count, total, pct: max ? Math.round((count / max) * 100) : 0 }))
}

export function selectRecentActivity(profile, _library) {
  return (Array.isArray(profile?.activity) ? profile.activity : []).slice().sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 8)
}

export function selectTasteMetrics(library = [], tasteGenres = [], profile = {}) {
  const rows = Array.isArray(library) ? library : []
  let totalEpisodes = 0
  let completedCount = 0
  let watchingCount = 0
  let pausedCount = 0
  let plannedCount = 0
  let favoritesCount = 0

  for (const item of rows) {
    const status = String(item?.status || sectionForStatus(item?.s) || '').toLowerCase()
    const isFav = Boolean(item?.favorite || String(item?.s || '').toLowerCase().startsWith('favorito'))
    if (isFav) favoritesCount++

    if (status === 'completed') {
      completedCount++
      const eps = Number(item?.episodes) || Number(item?.currentEpisode) || 12
      totalEpisodes += Math.max(1, eps)
    } else if (status === 'watching') {
      watchingCount++
      const curEp = Number(item?.currentEpisode) || 3
      totalEpisodes += Math.max(1, curEp)
    } else if (status === 'paused') {
      pausedCount++
      const curEp = Number(item?.currentEpisode) || 2
      totalEpisodes += Math.max(1, curEp)
    } else {
      plannedCount++
    }
  }

  const watchHours = Math.round((totalEpisodes * 23.5) / 60)
  const activeOrDone = completedCount + watchingCount + pausedCount
  const completionRate = activeOrDone > 0 ? Math.round((completedCount / activeOrDone) * 100) : 0

  const topGenre = tasteGenres[0]?.name || ''
  
  let archetype = 'Explorador de Anime'
  if (topGenre) {
    const g = topGenre.toLowerCase()
    if (g.includes('action') || g.includes('shounen') || g.includes('shonen')) archetype = 'Guerrero Shōnen'
    else if (g.includes('drama') || g.includes('psychological')) archetype = 'Analista Psicológico'
    else if (g.includes('sci-fi') || g.includes('mecha')) archetype = 'Visionario Cyberpunk'
    else if (g.includes('romance')) archetype = 'Corazón Romántico'
    else if (g.includes('comedy') || g.includes('slice of life')) archetype = 'Buscador de Confort'
    else if (g.includes('fantasy') || g.includes('adventure')) archetype = 'Explorador de Fantasía'
    else if (g.includes('thriller') || g.includes('mystery')) archetype = 'Detective de Misterios'
    else if (g.includes('supernatural') || g.includes('horror')) archetype = 'Cazador Sobrenatural'
    else archetype = `Curador de ${topGenre}`
  } else if (rows.length > 2) {
    archetype = 'Curador Ecléctico'
  }

  const signals = rows.length * 2 + favoritesCount * 4 + completedCount * 5 + watchingCount * 3
  let calibrationPct = 0
  let calibrationLabel = 'Iniciando Calibración'
  if (signals === 0) {
    calibrationPct = 10
    calibrationLabel = 'Iniciando Algoritmo'
  } else if (signals < 10) {
    calibrationPct = Math.min(65, 20 + signals * 5)
    calibrationLabel = 'Aprendiendo tus Gustos'
  } else if (signals < 25) {
    calibrationPct = Math.min(94, 65 + signals * 1.5)
    calibrationLabel = 'Perfil Calibrado'
  } else {
    calibrationPct = 100
    calibrationLabel = 'Algoritmo Peak (100%)'
  }

  return {
    totalEpisodes,
    watchHours,
    completionRate,
    completedCount,
    watchingCount,
    pausedCount,
    plannedCount,
    favoritesCount,
    dominantGenre: topGenre || 'Variado',
    archetype,
    calibrationPct: Math.round(calibrationPct),
    calibrationLabel,
    totalWorks: rows.length,
  }
}

