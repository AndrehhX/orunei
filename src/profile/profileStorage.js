import { createProfile, normalizeProfile, PROFILE_KEY } from './model.js'

export function readProfileStorage(storage, user = {}) {
  if (!storage) return createProfile(user)
  try {
    const raw = storage.getItem(PROFILE_KEY)
    return raw ? normalizeProfile(JSON.parse(raw), user) : createProfile(user)
  } catch {
    return createProfile(user)
  }
}

export function writeProfileStorage(storage, profile) {
  if (!storage) return { ok: false, error: 'El almacenamiento local no está disponible.' }
  try {
    storage.setItem(PROFILE_KEY, JSON.stringify(profile))
    return { ok: true, error: '' }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'No se pudo guardar el perfil.' }
  }
}
