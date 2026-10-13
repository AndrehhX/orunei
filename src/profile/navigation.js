export const PROFILE_PAGE = 'profile'

export function getMainDestination(label) {
  if (label === 'Para ti') return 'home'
  if (label === 'Perfil') return PROFILE_PAGE
  if (label === 'Amigos') return 'friends'
  return null
}
