const text = (value) => typeof value === 'string' ? value.trim() : ''

export const REGISTER_USERNAME_PLACEHOLDER = 'ej. mika_anime'

export function cleanAuthEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

export function normalizeAuthUser(user) {
  if (!user?.id) return null
  const email = cleanAuthEmail(user.email)
  const fallbackName = email.split('@')[0] || 'Usuario de Orunei'
  return {
    id: String(user.id),
    name: text(user.user_metadata?.name) || fallbackName,
    email,
  }
}
