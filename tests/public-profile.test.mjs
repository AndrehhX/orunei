import test from 'node:test'
import assert from 'node:assert/strict'
import { selectVisibleProfile } from '../src/profile/publicProfile.js'

const profile = {
  privacy: {
    animeList: 'friends',
    favorites: 'public',
    taste: 'private',
    activity: 'friends',
    reviews: 'public',
    lists: 'private',
  },
}

test('owner can see every profile section and edit controls', () => {
  const view = selectVisibleProfile(profile, { id: 'owner', profileId: 'owner', relationship: 'none' })
  assert.equal(view.canEdit, true)
  assert.deepEqual(view.visibleSections, ['animeList', 'favorites', 'taste', 'activity', 'reviews', 'lists'])
})

test('public visitor sees only public sections', () => {
  const view = selectVisibleProfile(profile, { id: 'visitor', profileId: 'owner', relationship: 'none' })
  assert.equal(view.canEdit, false)
  assert.deepEqual(view.visibleSections, ['favorites', 'reviews'])
})

test('accepted friend receives friends sections but pending visitor does not', () => {
  const friend = selectVisibleProfile(profile, { id: 'friend', profileId: 'owner', relationship: 'accepted' })
  const pending = selectVisibleProfile(profile, { id: 'pending', profileId: 'owner', relationship: 'pending' })
  assert.deepEqual(friend.visibleSections, ['animeList', 'favorites', 'activity', 'reviews'])
  assert.deepEqual(pending.visibleSections, ['favorites', 'reviews'])
})
