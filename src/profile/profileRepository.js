import { normalizeProfile } from './model.js'
import { supabase } from '../auth/supabaseClient.js'

const PROFILE_FIELDS = ['username', 'displayName', 'bio', 'status', 'visibility', 'accent', 'featuredAnimeId', 'pinnedSections', 'landingSection']

const text = (value) => typeof value === 'string' ? value.trim() : ''

function privacyObject(rows) {
  if (!Array.isArray(rows)) return rows || undefined
  return Object.fromEntries(rows.map((row) => [row.section, row.visibility]))
}

export function normalizeRemoteProfile(row, user = {}) {
  if (!row) return null
  return normalizeProfile({
    ...row,
    visibility: row.visibility ?? row.profile_visibility,
    displayName: row.displayName ?? row.display_name,
    avatar: row.avatar ?? row.avatar_url,
    banner: row.banner ?? row.banner_url,
    featuredAnimeId: row.featuredAnimeId ?? row.featured_anime_id,
    pinnedSections: row.pinnedSections ?? row.pinned_sections,
    landingSection: row.landingSection ?? row.landing_section,
    updatedAt: row.updatedAt ?? row.updated_at,
    privacy: privacyObject(row.privacy),
  }, user)
}

function profilePayload(userId, patch) {
  return {
    id: userId,
    username: text(patch.username),
    profile_visibility: ['private', 'public'].includes(patch.visibility) ? patch.visibility : 'public',
    display_name: text(patch.displayName),
    bio: text(patch.bio),
    status: text(patch.status),
    avatar_url: text(patch.avatar),
    banner_url: text(patch.banner),
    accent: text(patch.accent),
    featured_anime_id: text(patch.featuredAnimeId),
    pinned_sections: Array.isArray(patch.pinnedSections) ? patch.pinnedSections : [],
    landing_section: text(patch.landingSection),
    updated_at: new Date().toISOString(),
  }
}

function privacyPayload(profileId, privacy = {}) {
  return Object.entries(privacy).map(([section, visibility]) => ({ profile_id: profileId, section, visibility }))
}

function resultError(error) {
  return error?.message || ''
}

export function createProfileRepository(client = supabase) {
  const unavailable = () => ({ data: null, error: 'Las cuentas remotas no están configuradas.' })
  return {
    async getOwnProfile(userId) {
      if (!client || !userId) return unavailable()
      const { data, error } = await client.from('profiles').select('*').eq('id', userId).maybeSingle()
      return { data: error ? null : normalizeRemoteProfile(data, { id: userId }), error: resultError(error) }
    },

    async getPublicProfile(username, viewerId = null) {
      if (!client || !username) return unavailable()
      const profileResult = await client.from('profiles').select('*').eq('username', username).maybeSingle()
      if (profileResult.error || !profileResult.data) return { data: null, error: resultError(profileResult.error) }
      if (profileResult.data.id !== viewerId && profileResult.data.profile_visibility === 'private') return { data: null, error: '' }
      const privacyResult = await client.from('profile_privacy').select('section, visibility').eq('profile_id', profileResult.data.id)
      const row = { ...profileResult.data, privacy: privacyResult.data || [] }
      return { data: normalizeRemoteProfile(row, { id: viewerId || '' }), error: resultError(privacyResult.error) }
    },

    async saveProfile(userId, patch) {
      if (!client || !userId) return unavailable()
      const payload = profilePayload(userId, patch)
      const { data, error } = await client.from('profiles').upsert(payload).select('*').single()
      if (error) return { data: null, error: resultError(error) }
      const rows = privacyPayload(userId, patch.privacy)
      if (rows.length) {
        const privacyResult = await client.from('profile_privacy').upsert(rows, { onConflict: 'profile_id,section' })
        if (privacyResult.error) return { data: null, error: resultError(privacyResult.error) }
      }
      return { data: normalizeRemoteProfile({ ...data, privacy: rows }, { id: userId }), error: '' }
    },

    async uploadProfileImage(userId, kind, file) {
      if (!client || !userId || !file || !['avatar', 'banner'].includes(kind)) return unavailable()
      const extension = text(file.name).split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${userId}/${kind}-${Date.now()}.${extension}`
      const bucket = client.storage.from('profile-media')
      const uploadResult = await bucket.upload(path, file, { upsert: true, contentType: file.type || undefined })
      if (uploadResult.error) return { data: null, error: resultError(uploadResult.error) }
      const publicResult = bucket.getPublicUrl(path)
      return { data: publicResult.data?.publicUrl || '', error: '' }
    },
  }
}

export { PROFILE_FIELDS }
