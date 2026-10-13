import test from 'node:test'
import assert from 'node:assert/strict'
import { PROFILE_PAGE, getMainDestination, getPublicProfileHash, getPublicProfileUsername } from '../src/profile/navigation.js'

test('routes the private profile from the main navigation without changing catalogue routes', () => {
  assert.equal(PROFILE_PAGE, 'profile')
  assert.equal(getMainDestination('Perfil'), 'profile')
  assert.equal(getMainDestination('Para ti'), 'home')
  assert.equal(getMainDestination('Biblioteca'), null)
})

test('creates and reads shareable public profile hashes', () => {
  const hash = getPublicProfileHash('mika.anime')
  assert.equal(hash, '#perfil/mika.anime')
  assert.equal(getPublicProfileUsername(hash), 'mika.anime')
  assert.equal(getPublicProfileUsername('#perfil/'), '')
  assert.equal(getPublicProfileUsername('#perfil/mika.anime?tab=lists'), '')
})
