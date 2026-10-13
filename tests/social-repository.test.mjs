import test from 'node:test'
import assert from 'node:assert/strict'
import { createSocialRepository } from '../src/social/socialRepository.js'

function makeClient({ profiles = [], friendships = [], comments = [], error = null } = {}) {
  const calls = []
  const rows = { profiles, friendships, profile_comments: comments }
  return {
    calls,
    from(table) {
      calls.push({ type: 'from', table })
      const state = { table, data: rows[table] || [], error }
      const builder = {
        select() { return builder },
        ilike() { return builder },
        eq() { return builder },
        or() { return builder },
        order() { return builder },
        limit() { return builder },
        insert(payload) { calls.push({ type: 'insert', table, payload }); state.data = Array.isArray(payload) ? payload[0] : payload; return builder },
        update(payload) { calls.push({ type: 'update', table, payload }); state.data = { ...state.data, ...payload }; return builder },
        delete() { calls.push({ type: 'delete', table }); return builder },
        maybeSingle() { return Promise.resolve({ data: state.data?.[0] || null, error: state.error }) },
        single() { return Promise.resolve({ data: state.data, error: state.error }) },
        then(resolve) { return Promise.resolve({ data: state.data, error: state.error }).then(resolve) },
      }
      return builder
    },
  }
}

test('searches only with a non-empty query and normalizes public profiles', async () => {
  const client = makeClient({ profiles: [{ id: 'p1', username: 'mika', display_name: 'Mika', profile_visibility: 'public' }] })
  const repository = createSocialRepository(client, 'viewer-1')
  assert.deepEqual((await repository.searchProfiles('   ')).data, [])
  const result = await repository.searchProfiles('mika')
  assert.equal(result.error, '')
  assert.equal(result.data[0].username, 'mika')
  assert.equal(client.calls.some((call) => call.type === 'from' && call.table === 'profiles'), true)
})

test('sends and responds to friendship requests with authenticated owner ids', async () => {
  const client = makeClient({ friendships: { id: 'f1', requester_id: 'viewer-1', addressee_id: 'p1', status: 'pending' } })
  const repository = createSocialRepository(client, 'viewer-1')
  const sent = await repository.sendFriendRequest('p1')
  assert.equal(sent.data.requesterId, 'viewer-1')
  assert.equal(client.calls.find((call) => call.type === 'insert').payload.requester_id, 'viewer-1')
  const accepted = await repository.respondToFriendRequest('f1', 'accepted')
  assert.equal(accepted.data.status, 'accepted')
})

test('normalizes comments and preserves RLS errors from mutations', async () => {
  const client = makeClient({ comments: [{ id: 'c1', profile_id: 'p1', author_id: 'viewer-1', body: 'Hola' }] })
  const repository = createSocialRepository(client, 'viewer-1')
  const comments = await repository.listComments('p1')
  assert.equal(comments.data[0].body, 'Hola')
  const deniedRepository = createSocialRepository(makeClient({ error: { message: 'new row violates row-level security policy' } }), 'viewer-1')
  const created = await deniedRepository.createComment('p1', 'Hola')
  assert.equal(created.data, null)
  assert.match(created.error, /row-level security/i)
})
