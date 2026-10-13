const text = (value) => typeof value === 'string' ? value.trim() : ''

export const REGISTER_USERNAME_PLACEHOLDER = 'ej. mika_anime'

export function normalizeAuthUser(user) {
  if (!user?.id) return null
  const email = text(user.email)
  const fallbackName = email.split('@')[0] || 'Usuario de Orunei'
  return {
    id: String(user.id),
    name: text(user.user_metadata?.name) || fallbackName,
    email,
  }
}
