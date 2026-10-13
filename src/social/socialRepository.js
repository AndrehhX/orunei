import { supabase } from '../auth/supabaseClient.js'
import { normalizeRemoteProfile } from '../profile/profileRepository.js'
import { normalizeComment, normalizeFriendship, STATUSES } from './model.js'

const text = (value) => typeof value === 'string' ? value.trim() : ''
const resultError = (error) => error?.message || ''
const empty = (message = 'Las funciones sociales no están configuradas.') => ({ data: null, error: message })

export function createSocialRepository(client = supabase, userId = '') {
  const unavailable = () => empty()
  return {
    async searchProfiles(query) {
      const normalizedQuery = text(query)
      if (!client || !normalizedQuery) return { data: [], error: '' }
      const { data, error } = await client.from('profiles').select('*').eq('profile_visibility', 'public').or(`username.ilike.%${normalizedQuery}%,display_name.ilike.%${normalizedQuery}%`).limit(20)
      return { data: error ? [] : (data || []).map((row) => normalizeRemoteProfile(row, { id: row.id })), error: resultError(error) }
    },

    async getFriendships(ownerId = userId) {
      if (!client || !ownerId) return unavailable()
      const { data, error } = await client.from('friendships').select('*, requester:profiles!friendships_requester_id_fkey(*), addressee:profiles!friendships_addressee_id_fkey(*)').or(`requester_id.eq.${ownerId},addressee_id.eq.${ownerId}`).order('updated_at', { ascending: false })
      return { data: error ? [] : (data || []).map((row) => {
        const friendship = normalizeFriendship(row, ownerId)
        const other = row.requester_id === ownerId ? row.addressee : row.requester
        return { ...friendship, profile: other ? normalizeRemoteProfile(other, { id: other.id }) : null }
      }), error: resultError(error) }
    },

    async sendFriendRequest(targetId) {
      if (!client || !userId || !targetId || userId === targetId) return unavailable()
      const { data, error } = await client.from('friendships').insert({ requester_id: userId, addressee_id: targetId, status: 'pending' }).select('*').single()
      return { data: error ? null : normalizeFriendship(data, userId), error: resultError(error) }
    },

    async respondToFriendRequest(id, status) {
      if (!client || !userId || !id || !['accepted', 'declined', 'blocked'].includes(status)) return unavailable()
      const { data, error } = await client.from('friendships').update({ status, updated_at: new Date().toISOString() }).eq('id', id).eq('addressee_id', userId).select('*').single()
      return { data: error ? null : normalizeFriendship(data, userId), error: resultError(error) }
    },

    async cancelFriendRequest(id) {
      if (!client || !userId || !id) return unavailable()
      const { error } = await client.from('friendships').delete().eq('id', id).eq('requester_id', userId).eq('status', 'pending')
      return { data: error ? null : true, error: resultError(error) }
    },

    async removeFriend(id) {
      if (!client || !userId || !id) return unavailable()
      const { error } = await client.from('friendships').delete().eq('id', id).or(`requester_id.eq.${userId},addressee_id.eq.${userId}`).eq('status', 'accepted')
      return { data: error ? null : true, error: resultError(error) }
    },

    async listComments(profileId) {
      if (!client || !profileId) return unavailable()
      const { data, error } = await client.from('profile_comments').select('*').eq('profile_id', profileId).is('deleted_at', null).order('created_at', { ascending: true })
      return { data: error ? [] : (data || []).map((row) => normalizeComment(row, userId, profileId)), error: resultError(error) }
    },

    async createComment(profileId, body) {
      const normalizedBody = text(body).slice(0, 500)
      if (!client || !userId || !profileId || !normalizedBody) return empty('Escribe un comentario antes de publicarlo.')
      const { data, error } = await client.from('profile_comments').insert({ profile_id: profileId, author_id: userId, body: normalizedBody }).select('*').single()
      return { data: error ? null : normalizeComment(data, userId, profileId), error: resultError(error) }
    },

    async updateComment(id, body) {
      const normalizedBody = text(body).slice(0, 500)
      if (!client || !userId || !id || !normalizedBody) return empty('El comentario no puede quedar vacío.')
      const { data, error } = await client.from('profile_comments').update({ body: normalizedBody, updated_at: new Date().toISOString() }).eq('id', id).eq('author_id', userId).select('*').single()
      return { data: error ? null : normalizeComment(data, userId), error: resultError(error) }
    },

    async deleteComment(id) {
      if (!client || !userId || !id) return unavailable()
      const { error } = await client.from('profile_comments').delete().eq('id', id)
      return { data: error ? null : true, error: resultError(error) }
    },
  }
}

export { STATUSES }
