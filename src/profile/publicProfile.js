export const PUBLIC_PROFILE_SECTIONS = ['animeList', 'favorites', 'activity', 'lists']
import { canComment } from '../social/model.js'

const visibilityAllows = (visibility, relationship) => visibility === 'public' || (visibility === 'friends' && relationship === 'accepted')

export function selectVisibleProfile(profile = {}, viewer = {}) {
  const isOwner = Boolean(viewer.isOwner || (viewer.id && viewer.profileId && viewer.id === viewer.profileId))
  const privacy = profile.privacy || {}
  const visibleSections = isOwner
    ? [...PUBLIC_PROFILE_SECTIONS]
    : PUBLIC_PROFILE_SECTIONS.filter((section) => visibilityAllows(privacy[section], viewer.relationship))
  return {
    canEdit: isOwner,
    relationship: isOwner ? 'owner' : (viewer.relationship || 'none'),
    visibleSections,
    privacy: Object.fromEntries(PUBLIC_PROFILE_SECTIONS.map((section) => [section, privacy[section] || 'private'])),
  }
}

export function canViewProfileSection(profile, viewer, section) {
  return selectVisibleProfile(profile, viewer).visibleSections.includes(section)
}

export function selectVisibleComments(profile = {}, viewer = {}, comments = []) {
  const isOwner = Boolean(viewer.isOwner || (viewer.id && viewer.profileId && viewer.id === viewer.profileId))
  if (!isOwner && !canComment(profile, viewer)) return []
  return Array.isArray(comments) ? comments.map((comment) => ({ ...comment, canEdit: viewer.id === comment.authorId, canModerate: isOwner })) : []
}
