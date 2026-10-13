import { getProfileStats } from './model.js'

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

export function selectRecentActivity(profile, _library) {
  return (Array.isArray(profile?.activity) ? profile.activity : []).slice().sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 8)
}
