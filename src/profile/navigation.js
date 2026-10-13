export const PROFILE_PAGE = 'profile'
export const LIBRARY_PAGE = 'library'
const PUBLIC_PROFILE_PATTERN = /^#perfil\/([^/?#]+)$/

export function getMainDestination(label) {
  if (label === 'Para ti') return 'home'
  if (label === 'Biblioteca') return LIBRARY_PAGE
  if (label === 'Perfil') return PROFILE_PAGE
  if (label === 'Amigos') return 'friends'
  return null
}

export function getPublicProfileHash(username) {
  const value = typeof username === 'string' ? username.trim() : ''
  return value ? `#perfil/${encodeURIComponent(value)}` : ''
}

export function getPublicProfileUsername(hash = '') {
  const match = PUBLIC_PROFILE_PATTERN.exec(typeof hash === 'string' ? hash : '')
  if (!match) return ''
  try { return decodeURIComponent(match[1]) } catch { return '' }
}
