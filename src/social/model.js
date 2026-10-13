const STATUSES = ['pending', 'accepted', 'declined', 'blocked']
const STATUS_PRIORITY = { declined: 1, pending: 2, accepted: 3, blocked: 4 }
const text = (value) => typeof value === 'string' ? value.trim() : ''

export function normalizeFriendship(row = {}, viewerId = '') {
  const requesterId = text(row.requesterId ?? row.requester_id)
  const addresseeId = text(row.addresseeId ?? row.addressee_id)
  const status = STATUSES.includes(row.status) ? row.status : 'pending'
  const direction = viewerId === requesterId ? 'outgoing' : viewerId === addresseeId ? 'incoming' : 'other'
  return {
    id: text(row.id),
    requesterId,
    addresseeId,
    status,
    direction,
    createdAt: text(row.createdAt ?? row.created_at),
    updatedAt: text(row.updatedAt ?? row.updated_at),
  }
}

export function mergeFriendship(left, right) {
  if (!left) return right
  if (!right) return left
  const direction = left.direction !== 'other' ? left.direction : right.direction
  const leftPriority = STATUS_PRIORITY[left.status] || 0
  const rightPriority = STATUS_PRIORITY[right.status] || 0
  if (rightPriority > leftPriority) return { ...right, direction }
  if (leftPriority > rightPriority) return { ...left, direction }
  return { ...((right.updatedAt || '') >= (left.updatedAt || '') ? right : left), direction }
}

export function getRelationship(rows = [], viewerId, targetId) {
  const matches = (Array.isArray(rows) ? rows : [])
    .map((row) => normalizeFriendship(row, viewerId))
    .filter((row) => (row.requesterId === viewerId && row.addresseeId === targetId) || (row.requesterId === targetId && row.addresseeId === viewerId))
  const merged = matches.reduce((current, row) => mergeFriendship(current, row), null)
  if (!merged) return { id: '', requesterId: viewerId, addresseeId: targetId, status: 'none', direction: 'none', createdAt: '', updatedAt: '' }
  return { ...merged, direction: merged.requesterId === viewerId ? 'outgoing' : merged.addresseeId === viewerId ? 'incoming' : 'other' }
}

export function canComment(profile = {}, viewer = {}) {
  if (!viewer.id || !profile.id || viewer.id === profile.id) return false
  if (viewer.relationship === 'blocked') return false
  return profile.visibility === 'public' || profile.public === true || profile.privacy?.profile === 'public'
}

export function normalizeComment(row = {}, viewerId = '', profileId = '') {
  const authorId = text(row.authorId ?? row.author_id)
  const targetId = text(row.profileId ?? row.profile_id) || profileId
  const author = row.author || {}
  return {
    id: text(row.id),
    profileId: targetId,
    authorId,
    authorName: text(row.authorName ?? row.author_name ?? author.displayName ?? author.display_name) || 'Usuario de Orunei',
    body: text(row.body).slice(0, 500),
    createdAt: text(row.createdAt ?? row.created_at),
    updatedAt: text(row.updatedAt ?? row.updated_at),
    canEdit: Boolean(viewerId && viewerId === authorId),
    canModerate: Boolean(viewerId && viewerId === targetId),
  }
}

export { STATUSES }
