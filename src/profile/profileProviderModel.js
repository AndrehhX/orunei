import { createProfile, normalizeProfile } from './model.js'

export function resolveLoadedProfile(data, error = '', user = {}) {
  return {
    profile: data ? normalizeProfile(data, user) : createProfile(user),
    status: 'ready',
    error: error || '',
  }
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
