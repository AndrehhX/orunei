import test from 'node:test'
import assert from 'node:assert/strict'
import { selectVisibleComments } from '../src/profile/publicProfile.js'
import { normalizeComment } from '../src/social/model.js'

const comments = [
  normalizeComment({ id: 'c1', profile_id: 'profile-1', author_id: 'author-1', body: 'Hola' }, 'author-1', 'profile-1'),
  normalizeComment({ id: 'c2', profile_id: 'profile-1', author_id: 'author-2', body: 'Qué tal' }, 'author-1', 'profile-1'),
]

test('shows comments on a public profile and keeps edit/moderation ownership', () => {
  const visible = selectVisibleComments({ id: 'profile-1', visibility: 'public' }, { id: 'author-1', relationship: 'none' }, comments)
  assert.equal(visible.length, 2)
  assert.equal(visible[0].canEdit, true)
  assert.equal(visible[0].canModerate, false)
})

test('denies comments on private or blocked profiles to visitors', () => {
  assert.deepEqual(selectVisibleComments({ id: 'profile-1', visibility: 'private' }, { id: 'author-1', relationship: 'none' }, comments), [])
  assert.deepEqual(selectVisibleComments({ id: 'profile-1', visibility: 'public' }, { id: 'author-1', relationship: 'blocked' }, comments), [])
})

test('profile owner can moderate comments but cannot grant another author edit rights', () => {
  const visible = selectVisibleComments({ id: 'profile-1', visibility: 'private' }, { id: 'profile-1', isOwner: true }, comments)
  assert.equal(visible[0].canModerate, true)
  assert.equal(visible[0].canEdit, false)
})
