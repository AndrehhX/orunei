const clean = (value, fallback = '') => typeof value === 'string' ? value.trim() : fallback

export function createCustomList(title, description = '', at = new Date().toISOString(), accent = '#6d5cff') {
  const safeTitle = clean(title).slice(0, 60)
  return { id: `list-${at}`, title: safeTitle, description: clean(description).slice(0, 160), accent: /^#[0-9a-f]{6}$/i.test(accent) ? accent : '#6d5cff', animeIds: [], createdAt: at, updatedAt: at }
}

export function updateCustomList(lists, id, patch, at = new Date().toISOString()) {
  return (Array.isArray(lists) ? lists : []).map((list) => list.id !== id ? list : ({
    ...list,
    ...patch,
    title: clean(patch.title, list.title).slice(0, 60),
    description: clean(patch.description, list.description).slice(0, 160),
    accent: /^#[0-9a-f]{6}$/i.test(clean(patch.accent)) ? patch.accent : list.accent || '#6d5cff',
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

export function moveCustomList(lists, id, direction) {
  const result = [...(Array.isArray(lists) ? lists : [])]
  const index = result.findIndex((list) => list.id === id)
  const nextIndex = index + direction
  if (index < 0 || nextIndex < 0 || nextIndex >= result.length) return result
  ;[result[index], result[nextIndex]] = [result[nextIndex], result[index]]
  return result
}
