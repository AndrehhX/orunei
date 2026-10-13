import test from 'node:test'
import assert from 'node:assert/strict'
import { PROFILE_PAGE, getMainDestination } from '../src/profile/navigation.js'

test('routes the private profile from the main navigation without changing catalogue routes', () => {
  assert.equal(PROFILE_PAGE, 'profile')
  assert.equal(getMainDestination('Perfil'), 'profile')
  assert.equal(getMainDestination('Para ti'), 'home')
  assert.equal(getMainDestination('Biblioteca'), null)
})
