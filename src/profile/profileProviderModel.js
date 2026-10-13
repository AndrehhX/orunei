import { createProfile, normalizeProfile } from './model.js'

export function resolveLoadedProfile(data, error = '', user = {}) {
  return {
    profile: data ? normalizeProfile(data, user) : createProfile(user),
    status: 'ready',
    error: error || '',
  }
}

export async function loadOrCreateRemoteProfile(repository, user = {}) {
  if (!repository || !user?.id) return { data: null, error: 'No hay una cuenta remota activa.' }
  const loaded = await repository.getOwnProfile(user.id)
  if (loaded?.data || loaded?.error) return loaded
  const initial = createProfile(user)
  let created = await repository.saveProfile(user.id, initial)
  if (created?.error && /duplicate|unique|profiles_username_key/i.test(created.error)) {
    const suffix = String(user.id).replace(/[^a-z0-9]/gi, '').slice(0, 6).toLowerCase()
    const base = initial.username.replace(/[^a-z0-9_.-]/gi, '').slice(0, 17)
    if (suffix && base) created = await repository.saveProfile(user.id, { ...initial, username: `${base}-${suffix}`.slice(0, 24) })
  }
  return { data: created?.data || null, error: created?.error || '' }
}

export async function persistRemoteProfile(repository, userId, profile) {
  if (!repository || !userId) return { ok: false, data: null, error: 'No hay una cuenta remota activa.' }
  try {
    const result = await repository.saveProfile(userId, profile)
    return result?.error ? { ok: false, data: null, error: result.error } : { ok: true, data: result?.data || profile, error: '' }
  } catch (error) {
    return { ok: false, data: null, error: error instanceof Error ? error.message : 'No se pudo guardar el perfil.' }
  }
}

export function clearProfileState() {
  return { profile: null, status: 'signed-out', error: '' }
}
