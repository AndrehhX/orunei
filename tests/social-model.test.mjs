import test from 'node:test'
import assert from 'node:assert/strict'
import { canComment, getRelationship, mergeFriendship, normalizeComment, normalizeFriendship } from '../src/social/model.js'

test('normalizes friendship direction and rejects unsupported statuses', () => {
  const friendship = normalizeFriendship({ id: 'f1', requester_id: 'a', addressee_id: 'b', status: 'unknown' }, 'a')
  assert.deepEqual(friendship, { id: 'f1', requesterId: 'a', addresseeId: 'b', status: 'pending', direction: 'outgoing', createdAt: '', updatedAt: '' })
})

test('merges opposite friendship rows with the strongest current relationship', () => {
  const merged = mergeFriendship(
    normalizeFriendship({ id: 'f1', requester_id: 'a', addressee_id: 'b', status: 'pending', updated_at: '2026-01-01' }, 'a'),
    normalizeFriendship({ id: 'f2', requester_id: 'b', addressee_id: 'a', status: 'accepted', updated_at: '2026-01-02' }, 'a'),
  )
  assert.equal(merged.status, 'accepted')
  assert.equal(merged.direction, 'outgoing')
})

test('blocked relationship wins and pending request never grants friend access', () => {
  const rows = [
    { id: 'f1', requester_id: 'a', addressee_id: 'b', status: 'pending' },
    { id: 'f2', requester_id: 'b', addressee_id: 'a', status: 'blocked' },
  ]
  assert.equal(getRelationship(rows, 'a', 'b').status, 'blocked')
  assert.equal(getRelationship([{ id: 'f3', requester_id: 'a', addressee_id: 'b', status: 'pending' }], 'b', 'a').status, 'pending')
})

test('normalizes comment ownership and moderation flags without trusting client author fields', () => {
  const comment = normalizeComment({ id: 'c1', profile_id: 'profile-1', author_id: 'author-1', author: { display_name: 'Andreh' }, body: '  Hola Orunei  ', created_at: '2026-01-01' }, 'author-1', 'profile-1')
  assert.equal(comment.body, 'Hola Orunei')
  assert.equal(comment.canEdit, true)
  assert.equal(comment.canModerate, false)
  assert.equal(normalizeComment({ id: 'c2', profile_id: 'profile-1', author_id: 'author-2', body: 'x'.repeat(501) }, 'profile-1', 'profile-1').body.length, 500)
})

test('comments require an authenticated non-blocked viewer and public profile', () => {
  const profile = { id: 'profile-1', visibility: 'public' }
  assert.equal(canComment(profile, { id: 'author-1', relationship: 'none' }), true)
  assert.equal(canComment(profile, { id: 'author-1', relationship: 'blocked' }), false)
  assert.equal(canComment({ id: 'profile-1', visibility: 'private' }, { id: 'author-1', relationship: 'none' }), false)
  assert.equal(canComment(profile, {}), false)
})
