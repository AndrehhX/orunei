export const PROFILE_KEY = 'orunei-profile-v1'
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const MAX_ACTIVITY = 50
export const PROFILE_SECTIONS = ['overview', 'animelist', 'favorites', 'lists', 'activity']

export const DEFAULT_PROFILE = {
  version: 1,
  displayName: 'Usuario de Orunei',
  username: 'orunei-user',
  bio: '',
  status: '',
  avatar: '',
  banner: '',
  accent: '#6d5cff',
  featuredAnimeId: '',
  pinnedSections: ['overview', 'animelist', 'favorites'],
  landingSection: 'overview',
  privacy: {
    overview: 'private',
    animelist: 'private',
    favorites: 'private',
    lists: 'private',
    activity: 'private',
  },
  customLists: [],
  activity: [],
  updatedAt: '',
}

const clone = (value) => JSON.parse(JSON.stringify(value))
const text = (value, fallback = '') => typeof value === 'string' ? value.trim() : fallback

function slug(value) {
  return text(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_.-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24)
}

function identityFromUser(user = {}) {
  const name = text(user.name) || text(user.email).split('@')[0] || DEFAULT_PROFILE.displayName
  return {
    displayName: name.slice(0, 50),
    username: slug(name) || DEFAULT_PROFILE.username,
  }
}

export function createProfile(user = {}) {
  const identity = identityFromUser(user)
  return {
    ...clone(DEFAULT_PROFILE),
    ...identity,
    privacy: { ...DEFAULT_PROFILE.privacy },
    pinnedSections: [...DEFAULT_PROFILE.pinnedSections],
    updatedAt: new Date().toISOString(),
  }
}

function normalizePrivacy(raw) {
  return Object.fromEntries(PROFILE_SECTIONS.map((section) => {
    const value = raw?.[section]
    return [section, ['private', 'public', 'friends'].includes(value) ? value : DEFAULT_PROFILE.privacy[section]]
  }))
}

function normalizeLists(raw) {
  if (!Array.isArray(raw)) return []
  return raw.map((list, index) => {
    if (!list || typeof list !== 'object') return null
    const title = text(list.title).slice(0, 60)
    if (!title) return null
    const now = text(list.updatedAt) || new Date().toISOString()
    return {
      id: text(list.id) || `list-${index + 1}`,
      title,
      description: text(list.description).slice(0, 160),
      animeIds: [...new Set((Array.isArray(list.animeIds) ? list.animeIds : []).map(String))],
      createdAt: text(list.createdAt) || now,
      updatedAt: now,
    }
  }).filter(Boolean)
}

function normalizeActivity(raw) {
  if (!Array.isArray(raw)) return []
  return raw.map((item, index) => {
    if (!item || typeof item !== 'object') return null
    const label = text(item.label).slice(0, 180)
    const at = text(item.at)
    if (!label || !at) return null
    return { id: text(item.id) || `activity-${index + 1}-${at}`, type: text(item.type) || 'profile', label, at }
  }).filter(Boolean).slice(-MAX_ACTIVITY)
}

export function normalizeProfile(raw, user = {}) {
  const base = createProfile(user)
  const source = raw && typeof raw === 'object' ? raw : {}
  const fallbackIdentity = identityFromUser(user)
  const rawUsername = slug(source.username)
  const username = /^[a-z0-9][a-z0-9_.-]{2,23}$/.test(rawUsername) && rawUsername === text(source.username).toLowerCase()
    ? rawUsername
    : fallbackIdentity.username
  const pinned = [...new Set((Array.isArray(source.pinnedSections) ? source.pinnedSections : base.pinnedSections).filter((section) => PROFILE_SECTIONS.includes(section)))]
  return {
    ...base,
    displayName: text(source.displayName, fallbackIdentity.displayName).slice(0, 50) || fallbackIdentity.displayName,
    username,
    bio: text(source.bio).slice(0, 280),
    status: text(source.status).slice(0, 100),
    avatar: text(source.avatar),
    banner: text(source.banner),
    accent: /^#[0-9a-f]{6}$/i.test(text(source.accent)) ? source.accent : base.accent,
    featuredAnimeId: text(source.featuredAnimeId),
    pinnedSections: pinned.length ? pinned : [...base.pinnedSections],
    landingSection: PROFILE_SECTIONS.includes(source.landingSection) ? source.landingSection : base.landingSection,
    privacy: normalizePrivacy(source.privacy),
    customLists: normalizeLists(source.customLists),
    activity: normalizeActivity(source.activity),
    updatedAt: text(source.updatedAt) || base.updatedAt,
  }
}

export function validateImageFile(file, kind) {
  if (!['avatar', 'banner'].includes(kind)) return { ok: false, error: 'Tipo de imagen no válido.' }
  if (!file || typeof file.type !== 'string' || !file.type.startsWith('image/')) return { ok: false, error: 'Selecciona una imagen válida.' }
  if (!Number.isFinite(file.size) || file.size > MAX_IMAGE_BYTES) return { ok: false, error: 'La imagen debe pesar menos de 5 MB.' }
  return { ok: true }
}

export function makeActivity(type, label, at = new Date().toISOString()) {
  const safeType = text(type) || 'profile'
  const safeLabel = text(label).slice(0, 180)
  return { id: `${safeType}-${at}`, type: safeType, label: safeLabel, at }
}

export function getProfileStats(library = [], tasteCount = 0, profile = DEFAULT_PROFILE) {
  const rows = Array.isArray(library) ? library : []
  return {
    works: rows.length,
    favorites: rows.filter((item) => text(item?.s).startsWith('Favorito')).length,
    lists: Array.isArray(profile?.customLists) ? profile.customLists.length : 0,
    tastes: Number.isFinite(tasteCount) ? tasteCount : 0,
  }
}
