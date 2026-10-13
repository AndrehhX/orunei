import test from 'node:test'
import assert from 'node:assert/strict'
import { createProfileRepository, normalizeRemoteProfile } from '../src/profile/profileRepository.js'

function makeClient({ profile, privacy = [], anime = [], uploadError = null }) {
  const calls = []
  const builder = {
    select() { return builder },
    eq() { return builder },
    upsert(payload) { calls.push({ type: 'upsert', payload }); return builder },
    delete() { calls.push({ type: 'delete' }); return builder },
    maybeSingle() { return Promise.resolve({ data: profile, error: null }) },
    single() { return Promise.resolve({ data: profile, error: null }) },
    then(resolve) { return Promise.resolve({ data: anime, error: null }).then(resolve) },
  }
  return {
    calls,
    from(table) {
      calls.push({ type: 'from', table })
      if (table === 'profile_privacy') return {
        select() { return this },
        eq() { return Promise.resolve({ data: privacy, error: null }) },
      }
      return builder
    },
    storage: {
      from() {
        return {
          upload: () => Promise.resolve({ error: uploadError }),
          getPublicUrl: (path) => ({ data: { publicUrl: `https://cdn.example/${path}` } }),
        }
      },
    },
  }
}

test('normalizes remote profile columns into the existing profile contract', () => {
  const profile = normalizeRemoteProfile({
    id: 'user-1',
    display_name: 'Andreh',
    username: 'andreh',
    bio: 'Anime y diseño',
    avatar_url: 'https://cdn.example/avatar.jpg',
    banner_url: 'https://cdn.example/banner.jpg',
    privacy: [{ section: 'animeList', visibility: 'public' }],
  }, { name: 'Fallback', email: 'fallback@example.com' })
  assert.equal(profile.displayName, 'Andreh')
  assert.equal(profile.avatar, 'https://cdn.example/avatar.jpg')
  assert.equal(profile.banner, 'https://cdn.example/banner.jpg')
  assert.equal(profile.privacy.animeList, 'public')
})

test('reads own profile and writes an explicit owner-scoped patch', async () => {
  const client = makeClient({ profile: { id: 'user-1', display_name: 'Andreh', username: 'andreh' } })
  const repository = createProfileRepository(client)
  const own = await repository.getOwnProfile('user-1')
  assert.equal(own.error, '')
  assert.equal(own.data.username, 'andreh')
  const saved = await repository.saveProfile('user-1', { displayName: 'Andreh Nuevo', bio: 'ok' })
  assert.equal(saved.error, '')
  assert.equal(client.calls.find((call) => call.type === 'upsert').payload.id, 'user-1')
})

test('returns privacy rows with a public profile and preserves upload errors', async () => {
  const client = makeClient({
    profile: { id: 'user-2', display_name: 'Mika', username: 'mika' },
    privacy: [{ section: 'animeList', visibility: 'friends' }],
    uploadError: { message: 'Storage quota' },
  })
  const repository = createProfileRepository(client)
  const publicProfile = await repository.getPublicProfile('mika', 'viewer-1')
  assert.equal(publicProfile.data.privacy.animeList, 'friends')
  const upload = await repository.uploadProfileImage('user-2', 'avatar', { name: 'avatar.jpg' })
  assert.equal(upload.data, null)
  assert.equal(upload.error, 'Storage quota')
})

test('does not resolve a private profile for an unrelated viewer', async () => {
  const client = makeClient({ profile: { id: 'user-2', display_name: 'Mika', username: 'mika', profile_visibility: 'private' } })
  const result = await createProfileRepository(client).getPublicProfile('mika', 'viewer-1')
  assert.equal(result.data, null)
  assert.equal(result.error, '')
})

test('loads and persists the account AnimeList through the remote repository', async () => {
  const client = makeClient({ profile: { id: 'user-1', display_name: 'Andreh', username: 'andreh' }, anime: [{ anime_id: '101', title: 'Frieren', status: 'watching', favorite: true }] })
  const repository = createProfileRepository(client)
  const own = await repository.getOwnProfile('user-1')
  assert.equal(own.data.animeList[0].id, '101')
  const saved = await repository.saveAnimeList('user-1', own.data.animeList)
  assert.equal(saved.error, '')
  assert.equal(client.calls.some((call) => call.type === 'delete'), true)
  assert.equal(client.calls.some((call) => call.type === 'upsert'), true)
})
