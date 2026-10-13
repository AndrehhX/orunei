import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { DEFAULT_PROFILE, MAX_ACTIVITY, createProfile, makeActivity, normalizeProfile } from './model.js'
import { readProfileStorage, writeProfileStorage } from './profileStorage.js'

const ProfileContext = createContext(null)
const browserStorage = () => {
  try { return typeof localStorage === 'undefined' ? null : localStorage } catch { return null }
}

export function ProfileProvider({ children, user = {} }) {
  const [profile, setProfile] = useState(() => readProfileStorage(browserStorage(), user))
  const [storageError, setStorageError] = useState('')
  const profileRef = useRef(profile)

  const saveProfile = useCallback((nextOrUpdater) => {
    const source = typeof nextOrUpdater === 'function' ? nextOrUpdater(profileRef.current) : nextOrUpdater
    const next = normalizeProfile(source, user)
    profileRef.current = next
    setProfile(next)
    const result = writeProfileStorage(browserStorage(), next)
    setStorageError(result.ok ? '' : result.error)
    return next
  }, [user])

  const updateProfile = useCallback((patch) => saveProfile((current) => ({ ...current, ...(typeof patch === 'function' ? patch(current) : patch) })), [saveProfile])
  const resetVisuals = useCallback(() => saveProfile((current) => ({ ...current, avatar: '', banner: '', accent: DEFAULT_PROFILE.accent, featuredAnimeId: '' })), [saveProfile])
  const recordActivity = useCallback((type, label) => saveProfile((current) => ({ ...current, activity: [...current.activity, makeActivity(type, label)].slice(-MAX_ACTIVITY) })), [saveProfile])
  const updateCustomLists = useCallback((nextOrUpdater) => saveProfile((current) => ({
    ...current,
    customLists: typeof nextOrUpdater === 'function' ? nextOrUpdater(current.customLists) : nextOrUpdater,
  })), [saveProfile])

  const value = useMemo(() => ({ profile, saveProfile, updateProfile, resetVisuals, recordActivity, updateCustomLists, storageError }), [profile, saveProfile, updateProfile, resetVisuals, recordActivity, updateCustomLists, storageError])
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export function useProfile() {
  const value = useContext(ProfileContext)
  if (!value) throw new Error('useProfile debe usarse dentro de ProfileProvider')
  return value
}

export { createProfile }
