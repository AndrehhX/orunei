import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT_PROFILE, MAX_ACTIVITY, createProfile, makeActivity, normalizeAnimeList, normalizeProfile, readImageAsDataUrl } from './model.js'
import { readProfileStorage, writeProfileStorage } from './profileStorage.js'
import { clearProfileState, persistRemoteProfile, resolveLoadedProfile } from './profileProviderModel.js'

const ProfileContext = createContext(null)
const browserStorage = () => {
  try { return typeof localStorage === 'undefined' ? null : localStorage } catch { return null }
}

export function ProfileProvider({ children, user = {}, repository = null }) {
  const remote = Boolean(repository && user?.id)
  const [profile, setProfile] = useState(() => remote ? createProfile(user) : readProfileStorage(browserStorage(), user))
  const [profileStatus, setProfileStatus] = useState(() => remote ? 'loading' : 'ready')
  const [storageError, setStorageError] = useState('')
  const profileRef = useRef(profile)

  useEffect(() => {
    let active = true
    const initial = remote ? createProfile(user) : readProfileStorage(browserStorage(), user)
    profileRef.current = initial
    setProfile(initial)
    setStorageError('')
    setProfileStatus(remote ? 'loading' : 'ready')
    if (!remote) return () => { active = false }

    repository.getOwnProfile(user.id).then((result) => {
      if (!active) return
      const loaded = resolveLoadedProfile(result?.data, result?.error, user)
      profileRef.current = loaded.profile
      setProfile(loaded.profile)
      setStorageError(loaded.error)
      setProfileStatus(loaded.status)
    }).catch((error) => {
      if (!active) return
      setStorageError(error instanceof Error ? error.message : 'No se pudo cargar el perfil.')
      setProfileStatus('ready')
    })
    return () => { active = false }
  }, [remote, repository, user?.id])

  const saveProfile = useCallback(async (nextOrUpdater) => {
    const source = typeof nextOrUpdater === 'function' ? nextOrUpdater(profileRef.current) : nextOrUpdater
    const next = normalizeProfile({ ...source, updatedAt: new Date().toISOString() }, user)
    if (remote) {
      const result = await persistRemoteProfile(repository, user.id, next)
      if (!result.ok) {
        setStorageError(result.error)
        return { ok: false, error: result.error }
      }
      const persisted = normalizeProfile({ ...result.data, animeList: result.data?.animeList ?? profileRef.current.animeList }, user)
      profileRef.current = persisted
      setProfile(persisted)
      setStorageError('')
      return { ok: true, error: '' }
    }
    profileRef.current = next
    setProfile(next)
    const result = writeProfileStorage(browserStorage(), next)
    setStorageError(result.ok ? '' : result.error)
    return result
  }, [remote, repository, user])

  const uploadProfileImage = useCallback(async (kind, file) => {
    if (remote) {
      try {
        const result = await repository.uploadProfileImage(user.id, kind, file)
        return result?.error ? { ok: false, data: null, error: result.error } : { ok: true, data: result.data, error: '' }
      } catch (error) {
        return { ok: false, data: null, error: error instanceof Error ? error.message : 'No se pudo subir la imagen.' }
      }
    }
    try {
      return { ok: true, data: await readImageAsDataUrl(file, kind), error: '' }
    } catch (error) {
      return { ok: false, data: null, error: error instanceof Error ? error.message : 'No se pudo procesar la imagen.' }
    }
  }, [remote, repository, user?.id])

  const updateProfile = useCallback((patch) => saveProfile((current) => ({ ...current, ...(typeof patch === 'function' ? patch(current) : patch) })), [saveProfile])
  const resetVisuals = useCallback(() => saveProfile((current) => ({ ...current, avatar: '', banner: '', accent: DEFAULT_PROFILE.accent, featuredAnimeId: '' })), [saveProfile])
  const recordActivity = useCallback((type, label) => saveProfile((current) => ({ ...current, activity: [...current.activity, makeActivity(type, label)].slice(-MAX_ACTIVITY) })), [saveProfile])
  const updateCustomLists = useCallback((nextOrUpdater) => saveProfile((current) => ({
    ...current,
    customLists: typeof nextOrUpdater === 'function' ? nextOrUpdater(current.customLists) : nextOrUpdater,
  })), [saveProfile])
  const updateAnimeList = useCallback(async (nextOrUpdater) => {
    const next = normalizeAnimeList(typeof nextOrUpdater === 'function' ? nextOrUpdater(profileRef.current.animeList) : nextOrUpdater)
    if (remote) {
      const result = await repository.saveAnimeList(user.id, next)
      if (!result.ok && result.error) {
        setStorageError(result.error)
        return { ok: false, error: result.error }
      }
      const persisted = normalizeAnimeList(result.data || next)
      profileRef.current = { ...profileRef.current, animeList: persisted }
      setProfile(profileRef.current)
      setStorageError('')
      return { ok: true, error: '' }
    }
    return saveProfile((current) => ({ ...current, animeList: next }))
  }, [remote, repository, saveProfile, user?.id])

  const value = useMemo(() => ({ profile, profileStatus, saveProfile, updateProfile, resetVisuals, recordActivity, updateCustomLists, updateAnimeList, uploadProfileImage, storageError, clearProfileState }), [profile, profileStatus, saveProfile, updateProfile, resetVisuals, recordActivity, updateCustomLists, updateAnimeList, uploadProfileImage, storageError])
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export function useProfile() {
  const value = useContext(ProfileContext)
  if (!value) throw new Error('useProfile debe usarse dentro de ProfileProvider')
  return value
}

export { createProfile }
