const clean = (value, fallback = '') => typeof value === 'string' ? value.trim() : fallback

export function createCustomList(title, description = '', at = new Date().toISOString()) {
  const safeTitle = clean(title).slice(0, 60)
  return { id: `list-${at}`, title: safeTitle, description: clean(description).slice(0, 160), animeIds: [], createdAt: at, updatedAt: at }
}

export function updateCustomList(lists, id, patch, at = new Date().toISOString()) {
  return (Array.isArray(lists) ? lists : []).map((list) => list.id !== id ? list : ({
    ...list,
    ...patch,
    title: clean(patch.title, list.title).slice(0, 60),
    description: clean(patch.description, list.description).slice(0, 160),
    updatedAt: at,
  }))
}

export function deleteCustomList(lists, id) {
  return (Array.isArray(lists) ? lists : []).filter((list) => list.id !== id)
}

export function addAnimeToList(lists, id, animeId) {
  const value = String(animeId)
  return updateCustomList(lists, id, ({})).map((list) => list.id !== id ? list : ({ ...list, animeIds: [...new Set([...list.animeIds, value])] }))
}

export function removeAnimeFromList(lists, id, animeId) {
  const value = String(animeId)
  return updateCustomList(lists, id, ({})).map((list) => list.id !== id ? list : ({ ...list, animeIds: list.animeIds.filter((item) => item !== value) }))
}
